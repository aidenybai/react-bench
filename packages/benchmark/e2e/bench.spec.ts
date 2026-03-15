import { test as base, expect, type Page } from "@playwright/test";
import { writeFileSync } from "fs";
import { join } from "path";
import { TEST_MANIFEST } from "./test-cases";
import { NEEDS_INTERACTION } from "./interactions";
import { hashTestId } from "../lib/hash-test-id";
import { collectElementContext } from "./utils/collect-element-context";
import { isCorrectFile } from "./utils/is-correct-file";
import { normalizeFilePath } from "./utils/normalize-file-path";
import { formatTime } from "./utils/format-time";
import {
  wilsonScoreInterval,
  geomeanConfidenceInterval,
} from "./utils/error-bars";
import {
  saveCheckpoint,
  loadCheckpoint,
  type BrowserCollected,
} from "./checkpoint";
import {
  AGENT_RESOLVERS,
  BACKENDS,
  EMPTY_ELEMENT_CONTEXT,
  pool,
  AGENT_CONCURRENCY,
  type AgentResult,
} from "./resolvers";

// HACK: Claude SDK spawns subprocesses that each add an exit listener; raise limit to match concurrency
process.setMaxListeners(AGENT_CONCURRENCY + 10);

const HARNESS_INIT_TIMEOUT_MS = 15_000;
const INIT_SETTLE_MS = 1000;
const SKELETON_RELOAD_TIMEOUT_MS = 10_000;
const WRONG_ANSWER_FLOOR_MS = 120_000;
const BENCH_RESUME = Boolean(process.env.BENCH_RESUME);
const BENCH_ISOLATED = Boolean(process.env.BENCH_ISOLATED);
const BENCH_RERUN = process.env.BENCH_RERUN ?? "";

interface IsolateTarget {
  resolverName: string;
  clipboardKey: keyof import("./resolvers/types").ElementContext;
  port: number;
}

const ISOLATE_TARGETS: IsolateTarget[] = [
  { resolverName: "react-grab", clipboardKey: "reactGrabClipboard", port: 3010 },
  { resolverName: "agentation", clipboardKey: "agentationClipboard", port: 3011 },
  { resolverName: "cursor-browser", clipboardKey: "cursorBrowserClipboard", port: 3012 },
  { resolverName: "click-to-component", clipboardKey: "clickToComponentClipboard", port: 3013 },
  { resolverName: "locatorjs", clipboardKey: "locatorjsClipboard", port: 3014 },
  { resolverName: "instruckt", clipboardKey: "instrucktClipboard", port: 3015 },
];

const RESOLVER_LABELS: Record<string, string> = {
  "claude-code": "Claude Code",
  "agentation+claude": "Agentation + Claude Code",
  "react-grab+claude": "React Grab + Claude Code",
  "cursor-browser+claude": "Cursor Browser + Claude Code",
  "click-to-component+claude": "Click to Component + Claude Code",
  "locatorjs+claude": "LocatorJS + Claude Code",
  "instruckt+claude": "Instruckt + Claude Code",
};

const BENCH_INTERACTIONS: Record<string, (page: Page) => Promise<void>> = {
  ...NEEDS_INTERACTION,
  "shadcn-skeleton": async (page) => {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => (window as any).__BENCH__?.resolveAll, {
      timeout: SKELETON_RELOAD_TIMEOUT_MS,
    });
  },
};

const test = base.extend<{ page: Page }>({
  page: async ({ page, context }, use) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/", { waitUntil: "load" });
    await page.waitForFunction(
      () => {
        const bench = (window as any).__BENCH__;
        return (
          bench &&
          typeof bench.resolveAll === "function" &&
          bench.list().length >= 2
        );
      },
      { timeout: HARNESS_INIT_TIMEOUT_MS },
    );
    // HACK: wait for all browser resolvers to finish registering after API is ready
    await page.waitForTimeout(INIT_SETTLE_MS);
    await use(page);
  },
});

interface ResolverResult {
  filePath: string | null;
  componentName: string | null;
  found: boolean;
  ms: number;
  correct: boolean;
}

const EMPTY_RESOLVER_RESULT: ResolverResult = {
  filePath: null,
  componentName: null,
  found: false,
  ms: 0,
  correct: false,
};

interface EntryResult {
  id: number;
  testId: string;
  description: string;
  componentName: string;
  expected: string;
  resolvers: Record<string, ResolverResult>;
  error?: string;
}

const loadRerunCheckpoint = (): {
  collected: BrowserCollected[];
  agentCompleted: Record<string, AgentResult>;
} | null => {
  if (!BENCH_RERUN) return null;
  const checkpoint = loadCheckpoint();
  if (!checkpoint?.browserCollected?.length) {
    console.error(`  No checkpoint found — run a full benchmark first before using BENCH_RERUN`);
    return null;
  }

  const resolverNames = BENCH_RERUN.split(",").map((name) => name.trim());
  const agentCompleted = { ...checkpoint.agentCompleted };

  let removedCount = 0;
  for (const taskKey of Object.keys(agentCompleted)) {
    const resolverName = taskKey.split(":").slice(1).join(":");
    if (resolverNames.some((name) => resolverName === name || resolverName.startsWith(`${name}+`) || resolverName.endsWith(`+${name}`))) {
      delete agentCompleted[taskKey];
      removedCount++;
    }
  }

  console.log(`  BENCH_RERUN: cleared ${removedCount} results for [${resolverNames.join(", ")}], reusing browser data (${checkpoint.browserCollected.length} entries)`);
  return { collected: checkpoint.browserCollected, agentCompleted };
};

const collectBrowserPhase = async (
  page: Page,
): Promise<{
  collected: BrowserCollected[];
  agentCompleted: Record<string, AgentResult>;
}> => {
  const rerunData = loadRerunCheckpoint();
  if (rerunData) return rerunData;

  const checkpoint = BENCH_RESUME ? loadCheckpoint() : null;
  const agentCompleted = checkpoint?.agentCompleted ?? {};

  if (checkpoint?.browserCollected?.length === TEST_MANIFEST.length) {
    console.log(
      `  Resumed browser phase from checkpoint (${checkpoint.browserCollected.length} entries)`,
    );
    return { collected: checkpoint.browserCollected, agentCompleted };
  }

  const collected: BrowserCollected[] = [];
  for (const entry of TEST_MANIFEST) {
    try {
      if (BENCH_INTERACTIONS[entry.testId])
        await BENCH_INTERACTIONS[entry.testId](page);

      const hashedTestId = hashTestId(entry.testId);

      const isVisible = await page
        .locator(`[data-testid="${hashedTestId}"]`)
        .first()
        .isVisible()
        .catch(() => false);

      if (!isVisible) {
        collected.push({
          entry,
          browserResults: {},
          elementContext: EMPTY_ELEMENT_CONTEXT,
          error: "not visible",
        });
        continue;
      }

      const browserResults = (await page.evaluate(
        async (tid: string) => (window as any).__BENCH__.resolveAll(tid),
        hashedTestId,
      )) as BrowserCollected["browserResults"];

      const elementContext = await collectElementContext(page, hashedTestId);
      collected.push({ entry, browserResults, elementContext });
    } catch (caughtError) {
      collected.push({
        entry,
        browserResults: {},
        elementContext: EMPTY_ELEMENT_CONTEXT,
        error: String(caughtError),
      });
    }
  }

  saveCheckpoint({ browserCollected: collected, agentCompleted });
  console.log(`  Browser phase done (${collected.length} entries collected)`);
  return { collected, agentCompleted };
};

const collectIsolateClipboards = async (
  page: Page,
  collected: BrowserCollected[],
): Promise<void> => {
  for (const isolate of ISOLATE_TARGETS) {
    const isolateUrl = `http://localhost:${isolate.port}`;
    console.log(`  Collecting clipboard from isolate: ${isolate.resolverName} (${isolateUrl})`);

    await page.goto(isolateUrl, { waitUntil: "load" });
    await page.waitForFunction(
      () => {
        const bench = (window as any).__BENCH__;
        return bench && typeof bench.resolveAll === "function";
      },
      { timeout: HARNESS_INIT_TIMEOUT_MS },
    );
    await page.waitForTimeout(INIT_SETTLE_MS);

    for (const item of collected) {
      if (item.error) continue;

      if (BENCH_INTERACTIONS[item.entry.testId]) {
        await BENCH_INTERACTIONS[item.entry.testId](page);
      }

      const hashedTestId = hashTestId(item.entry.testId);

      const clipboard = await page.evaluate(
        async ({ testId: evaluateTestId, resolverName }) => {
          const element = document.querySelector(
            `[data-testid="${evaluateTestId}"]`,
          ) as HTMLElement | null;
          if (!element) return null;

          const benchApi = (window as any).__BENCH__;
          if (!benchApi) return null;

          const results = await benchApi.resolveAll(evaluateTestId);
          const result = results[resolverName];
          if (!result?.found || !result.filePath) return null;

          const lines = [`Source (${resolverName}): ${result.filePath}`];
          if (result.componentName) lines.push(`Component: ${result.componentName}`);
          return lines.join("\n");
        },
        { testId: hashedTestId, resolverName: isolate.resolverName },
      );

      (item.elementContext as unknown as Record<string, unknown>)[isolate.clipboardKey] = clipboard;
    }
  }

  console.log(`  Isolated clipboard collection done (${ISOLATE_TARGETS.length} tools)\n`);
};

const runAgentPhase = async (
  collected: BrowserCollected[],
  agentCompleted: Record<string, AgentResult>,
): Promise<void> => {
  interface AgentTask {
    entryIndex: number;
    resolver: (typeof AGENT_RESOLVERS)[number];
    prompt: string;
  }

  const agentTasks: AgentTask[] = [];
  for (
    let collectedIndex = 0;
    collectedIndex < collected.length;
    collectedIndex++
  ) {
    const { entry, elementContext, error } = collected[collectedIndex];
    if (error) continue;
    for (const agentResolver of AGENT_RESOLVERS) {
      const taskKey = `${entry.id}:${agentResolver.name}`;
      if (agentCompleted[taskKey]) continue;
      agentTasks.push({
        entryIndex: collectedIndex,
        resolver: agentResolver,
        prompt: agentResolver.buildPrompt(entry, elementContext),
      });
    }
  }

  const resumedCount = Object.keys(agentCompleted).length;
  if (resumedCount > 0)
    console.log(`  Resumed ${resumedCount} agent tasks from checkpoint`);
  console.log(
    `  Running ${agentTasks.length} agent tasks (concurrency: ${AGENT_CONCURRENCY})...\n`,
  );

  let completedCount = 0;
  const totalCount = agentTasks.length;
  const startTime = performance.now();

  const logProgress = () => {
    const elapsedSeconds = (performance.now() - startTime) / 1000;
    const percent = Math.round((completedCount / totalCount) * 100);
    const filledWidth = Math.round((completedCount / totalCount) * 30);
    const bar = "█".repeat(filledWidth) + "░".repeat(30 - filledWidth);
    const tasksPerSecond =
      completedCount > 0 ? completedCount / elapsedSeconds : 0;
    const remainingSeconds =
      tasksPerSecond > 0
        ? Math.round((totalCount - completedCount) / tasksPerSecond)
        : 0;
    const etaDisplay =
      completedCount > 0
        ? formatTime(remainingSeconds * 1000)
        : "estimating...";
    process.stdout.write(
      `\r  ${bar} ${percent}% (${completedCount}/${totalCount}) | ${formatTime(elapsedSeconds * 1000)} elapsed | ETA ${etaDisplay}  `,
    );
  };

  logProgress();

  await pool(
    agentTasks.map(
      (task) => () =>
        task.resolver.run(task.prompt).then((result) => {
          const taskKey = `${collected[task.entryIndex].entry.id}:${task.resolver.name}`;
          agentCompleted[taskKey] = result;
          saveCheckpoint({ browserCollected: collected, agentCompleted });
          completedCount++;
          logProgress();
          return result;
        }),
    ),
    AGENT_CONCURRENCY,
  );

  process.stdout.write("\n\n");

  for (const [taskKey, result] of Object.entries(agentCompleted)) {
    const [idString, resolverName] = taskKey.split(":");
    const collectedIndex = collected.findIndex(
      (item) => item.entry.id === parseInt(idString, 10),
    );
    if (
      collectedIndex >= 0 &&
      !collected[collectedIndex].browserResults[resolverName]
    ) {
      collected[collectedIndex].browserResults[resolverName] = {
        filePath: result.filePath,
        componentName: result.componentName,
        found: Boolean(result.filePath),
        ms: result.ms,
      };
    }
  }
};

const buildResults = (
  collected: BrowserCollected[],
  allResolverNames: string[],
): EntryResult[] =>
  collected.map(({ entry, browserResults, error }) => {
    const resolvers: Record<string, ResolverResult> = {};

    for (const resolverName of allResolverNames) {
      if (error || !browserResults[resolverName]) {
        resolvers[resolverName] = EMPTY_RESOLVER_RESULT;
        continue;
      }

      const resolverResult = browserResults[resolverName];
      resolvers[resolverName] = {
        ...resolverResult,
        correct: isCorrectFile(resolverResult.filePath, entry.filePath),
      };
    }

    return {
      id: entry.id,
      testId: entry.testId,
      description: entry.description,
      componentName: entry.componentName,
      expected: entry.filePath,
      resolvers,
      ...(error ? { error } : {}),
    };
  });

const printResults = (
  results: EntryResult[],
  allResolverNames: string[],
): void => {
  for (const entryResult of results) {
    if (entryResult.error) continue;

    const columns = allResolverNames.map((resolverName) => {
      const resolver = entryResult.resolvers[resolverName];
      if (!resolver?.found) return `${resolverName}: \u2014`;

      let symbol = "\u2717";
      if (resolver.correct) symbol = "\u2713";
      else if (resolver.found) symbol = "~";

      return `${resolverName}: ${symbol} ${formatTime(resolver.ms)}`;
    });

    console.log(
      `  [${String(entryResult.id).padStart(2)}] ${entryResult.testId.padEnd(28)} ${columns.join("  |  ")}`,
    );
    console.log(`        expected: ${entryResult.expected}`);
    for (const resolverName of allResolverNames) {
      const resolver = entryResult.resolvers[resolverName];
      if (resolver?.filePath) {
        console.log(
          `        ${resolverName.padEnd(22)} ${normalizeFilePath(resolver.filePath)}${resolver.correct ? "" : " \u2190 WRONG"}`,
        );
      } else {
        console.log(`        ${resolverName.padEnd(22)} (no result)`);
      }
    }
  }

  console.log(`\n  ${"━".repeat(100)}`);
  for (const resolverName of allResolverNames) {
    const correctEntries = results.filter(
      (entryResult) => entryResult.resolvers[resolverName]?.correct,
    );

    const accuracyCI = wilsonScoreInterval(
      correctEntries.length,
      results.length,
    );
    const accuracyPercent = (
      (correctEntries.length / results.length) *
      100
    ).toFixed(0);
    const accuracyCIFormatted = `[${(accuracyCI.lower * 100).toFixed(1)}–${(accuracyCI.upper * 100).toFixed(1)}%]`;

    const allTimingValues = results
      .filter((entryResult) => !entryResult.error && entryResult.resolvers[resolverName]?.ms > 0)
      .map((entryResult) =>
        entryResult.resolvers[resolverName].correct
          ? entryResult.resolvers[resolverName].ms
          : Math.max(entryResult.resolvers[resolverName].ms, WRONG_ANSWER_FLOOR_MS),
      );
    const speedCI = geomeanConfidenceInterval(allTimingValues);
    const speedFormatted =
      speedCI.geomean > 0
        ? `avg ${formatTime(speedCI.geomean)} [${formatTime(speedCI.lower)}–${formatTime(speedCI.upper)}]`
        : "avg \u2014";

    console.log(
      `  ${resolverName.padEnd(22)} ${correctEntries.length}/${results.length} correct (${accuracyPercent}%) ${accuracyCIFormatted} \u2014 ${speedFormatted}`,
    );
  }
  console.log();
};

const writeOutputFiles = (
  results: EntryResult[],
  allResolverNames: string[],
): void => {
  const BROWSER_ONLY_RESOLVERS = new Set([
    "react-grab",
    "agentation",
    "cursor-browser",
    "click-to-component",
    "locatorjs",
    "instruckt",
  ]);
  const chartResolverNames = allResolverNames.filter(
    (resolverName) => !BROWSER_ONLY_RESOLVERS.has(resolverName),
  );
  const resolverNames =
    chartResolverNames.length > 0 ? chartResolverNames : allResolverNames;

  const benchResultsPath = join(__dirname, "..", "e2e", "bench-results.json");
  writeFileSync(
    benchResultsPath,
    JSON.stringify({ resolverNames: allResolverNames, results }, null, 2),
  );
  console.log(`  ${benchResultsPath}`);

  const websiteData = {
    lastBenchmarked: new Date().toISOString().split("T")[0],
    control: "claude-code",
    resolvers: resolverNames.map((resolverName) => ({
      key: resolverName,
      label: RESOLVER_LABELS[resolverName] ?? resolverName,
    })),
    scenarios: [
      {
        label: "overall",
        cases: results.length,
        results: Object.fromEntries(
          resolverNames.map((resolverName) => {
            const allResults = results
              .map((entryResult) => entryResult.resolvers[resolverName])
              .filter(Boolean);
            const correctResults = allResults.filter(
              (resolverResult) => resolverResult.correct,
            );
            const timingValues = allResults
              .filter((resolverResult) => resolverResult.ms > 0)
              .map((resolverResult) =>
                resolverResult.correct
                  ? resolverResult.ms
                  : Math.max(resolverResult.ms, WRONG_ANSWER_FLOOR_MS),
              );

            const speedCI = geomeanConfidenceInterval(timingValues);
            const accuracyCI = wilsonScoreInterval(
              correctResults.length,
              results.length,
            );

            return [
              resolverName,
              {
                speed: Math.round(speedCI.geomean / 100) / 10,
                speedCI: {
                  lower: Math.round(speedCI.lower / 100) / 10,
                  upper: Math.round(speedCI.upper / 100) / 10,
                },
                accuracy: results.length
                  ? Math.round((correctResults.length / results.length) * 100)
                  : 0,
                accuracyCI: {
                  lower: Math.round(accuracyCI.lower * 1000) / 10,
                  upper: Math.round(accuracyCI.upper * 1000) / 10,
                },
                correct: correctResults.length,
              },
            ];
          }),
        ),
      },
    ],
    testCases: results.map((entryResult) => ({
      id: entryResult.id,
      testId: entryResult.testId,
      description: entryResult.description,
      componentName: entryResult.componentName,
      filePath: entryResult.expected,
      results: Object.fromEntries(
        resolverNames.map((resolverName) => {
          const resolverResult = entryResult.resolvers[resolverName];
          return [
            resolverName,
            {
              speed: resolverResult
                ? Math.round(resolverResult.ms / 100) / 10
                : 0,
              correct: resolverResult?.correct ?? false,
            },
          ];
        }),
      ),
    })),
  };

  const websiteDataPath = join(
    __dirname,
    "..",
    "..",
    "website",
    "app",
    "data.json",
  );
  writeFileSync(websiteDataPath, JSON.stringify(websiteData, null, 2));
  console.log(`  ${websiteDataPath}\n`);
};

test.describe("Benchmark", () => {
  test.setTimeout(14_400_000);

  test("compare all resolvers across full manifest", async ({ page }) => {
    await page.waitForFunction(
      () => (window as any).__REACT_GRAB__?.getSource,
      { timeout: HARNESS_INIT_TIMEOUT_MS },
    );

    const browserResolverNames: string[] = BENCH_ISOLATED
      ? []
      : await page.evaluate(() => (window as any).__BENCH__.list());
    const agentResolverNames = AGENT_RESOLVERS.map((resolver) => resolver.name);
    const allResolverNames = [...browserResolverNames, ...agentResolverNames];

    const backendInfo = BACKENDS.map(
      (backend) => `${backend.name}: ${backend.model}`,
    ).join(", ");
    console.log(
      `\n  Resolvers: ${allResolverNames.join(", ")} (${backendInfo})`,
    );
    console.log(`  Entries:   ${TEST_MANIFEST.length}`);
    if (BENCH_ISOLATED) console.log(`  Mode:      isolated (${ISOLATE_TARGETS.length} isolate servers)`);
    console.log();

    const { collected, agentCompleted } = await collectBrowserPhase(page);

    if (BENCH_ISOLATED) {
      await collectIsolateClipboards(page, collected);
    }

    await runAgentPhase(collected, agentCompleted);

    const results = buildResults(collected, allResolverNames);
    printResults(results, allResolverNames);
    writeOutputFiles(results, allResolverNames);

    const bestScore = Math.max(
      ...allResolverNames.map(
        (resolverName) =>
          results.filter(
            (entryResult) => entryResult.resolvers[resolverName]?.correct,
          ).length,
      ),
    );
    expect(bestScore).toBeGreaterThan(0);
  });
});
