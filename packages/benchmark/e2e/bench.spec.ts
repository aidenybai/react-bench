import { test as base, expect, type Page } from "@playwright/test";
import { writeFileSync } from "fs";
import { join } from "path";
import { TEST_MANIFEST } from "./test-cases";
import { NEEDS_INTERACTION } from "./interactions";
import { collectElementContext } from "./utils/collect-element-context";
import { isCorrectFile } from "./utils/is-correct-file";
import { normalizeFilePath } from "./utils/normalize-file-path";
import { formatTime } from "./utils/format-time";
import {
  saveCheckpoint,
  loadCheckpoint,
  type BrowserCollected,
  type CliCompleted,
} from "./checkpoint";
import {
  CLI_RESOLVERS,
  BACKENDS,
  EMPTY_ELEMENT_CONTEXT,
  pool,
  CLI_CONCURRENCY,
} from "./resolvers";

const HARNESS_INIT_TIMEOUT_MS = 15_000;
const INIT_SETTLE_MS = 1000;
const SKELETON_RELOAD_TIMEOUT_MS = 10_000;
const BENCH_RESUME = Boolean(process.env.BENCH_RESUME);

const RESOLVER_LABELS: Record<string, string> = {
  "claude-code": "Claude Code",
  "agentation+claude": "Agentation + Claude Code",
  "react-grab+claude": "React Grab + Claude Code",
  // codex: "Codex",
  // "agentation+codex": "Agentation + Codex",
  // "react-grab+codex": "React Grab + Codex",
};

const BENCH_INTERACTIONS: Record<string, (page: Page) => Promise<void>> = {
  ...NEEDS_INTERACTION,
  "shadcn-skeleton": async (page) => {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () => (window as any).__BENCH__?.resolveAll,
      { timeout: SKELETON_RELOAD_TIMEOUT_MS },
    );
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

const collectBrowserPhase = async (
  page: Page,
): Promise<{
  collected: BrowserCollected[];
  cliCompleted: Record<string, CliCompleted>;
}> => {
  const checkpoint = BENCH_RESUME ? loadCheckpoint() : null;
  const cliCompleted = checkpoint?.cliCompleted ?? {};

  if (checkpoint?.browserCollected?.length === TEST_MANIFEST.length) {
    console.log(
      `  Resumed browser phase from checkpoint (${checkpoint.browserCollected.length} entries)`,
    );
    return { collected: checkpoint.browserCollected, cliCompleted };
  }

  const collected: BrowserCollected[] = [];
  for (const entry of TEST_MANIFEST) {
    try {
      if (BENCH_INTERACTIONS[entry.testId])
        await BENCH_INTERACTIONS[entry.testId](page);

      const isVisible = await page
        .locator(`[data-testid="${entry.testId}"]`)
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
        entry.testId,
      )) as BrowserCollected["browserResults"];

      const elementContext = await collectElementContext(page, entry.testId);
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

  saveCheckpoint({ browserCollected: collected, cliCompleted });
  console.log(`  Browser phase done (${collected.length} entries collected)`);
  return { collected, cliCompleted };
};

const runCliPhase = async (
  collected: BrowserCollected[],
  cliCompleted: Record<string, CliCompleted>,
): Promise<void> => {
  interface CliTask {
    entryIndex: number;
    resolver: (typeof CLI_RESOLVERS)[number];
    prompt: string;
  }

  const cliTasks: CliTask[] = [];
  for (
    let collectedIndex = 0;
    collectedIndex < collected.length;
    collectedIndex++
  ) {
    const { entry, elementContext, error } = collected[collectedIndex];
    if (error) continue;
    for (const cliResolver of CLI_RESOLVERS) {
      const taskKey = `${entry.id}:${cliResolver.name}`;
      if (cliCompleted[taskKey]) continue;
      cliTasks.push({
        entryIndex: collectedIndex,
        resolver: cliResolver,
        prompt: cliResolver.buildPrompt(entry, elementContext),
      });
    }
  }

  const resumedCount = Object.keys(cliCompleted).length;
  if (resumedCount > 0)
    console.log(`  Resumed ${resumedCount} CLI tasks from checkpoint`);
  console.log(
    `  Running ${cliTasks.length} CLI tasks (concurrency: ${CLI_CONCURRENCY})...\n`,
  );

  await pool(
    cliTasks.map(
      (task) => () =>
        task.resolver.run(task.prompt).then((result) => {
          const taskKey = `${collected[task.entryIndex].entry.id}:${task.resolver.name}`;
          cliCompleted[taskKey] = result;
          saveCheckpoint({ browserCollected: collected, cliCompleted });
          return result;
        }),
    ),
    CLI_CONCURRENCY,
  );

  for (const [taskKey, result] of Object.entries(cliCompleted)) {
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

  console.log(`\n  ${"━".repeat(80)}`);
  for (const resolverName of allResolverNames) {
    const correctEntries = results.filter(
      (entryResult) => entryResult.resolvers[resolverName]?.correct,
    );
    const geometricMeanTiming =
      correctEntries.length > 0
        ? formatTime(
            Math.exp(
              correctEntries.reduce(
                (logSum, entryResult) =>
                  logSum + Math.log(entryResult.resolvers[resolverName].ms),
                0,
              ) / correctEntries.length,
            ),
          )
        : "\u2014";
    console.log(
      `  ${resolverName.padEnd(22)} ${correctEntries.length}/${results.length} correct (${((correctEntries.length / results.length) * 100).toFixed(0)}%) \u2014 geomean ${geometricMeanTiming}`,
    );
  }
  console.log();
};

const writeOutputFiles = (
  results: EntryResult[],
  allResolverNames: string[],
): void => {
  const chartResolverNames = allResolverNames.filter(
    (resolverName) =>
      !["react-grab", "agentation"].includes(resolverName),
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
            const timingResults = correctResults.length
              ? correctResults
              : allResults;
            const geometricMeanMs = timingResults.length
              ? Math.exp(
                  timingResults.reduce(
                    (logSum, resolverResult) =>
                      logSum + Math.log(resolverResult.ms),
                    0,
                  ) / timingResults.length,
                )
              : 0;
            return [
              resolverName,
              {
                speed: Math.round(geometricMeanMs / 100) / 10,
                accuracy: results.length
                  ? Math.round(
                      (correctResults.length / results.length) * 100,
                    )
                  : 0,
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
  test.setTimeout(7_200_000);

  test("compare all resolvers across full manifest", async ({ page }) => {
    await page.waitForFunction(
      () => (window as any).__REACT_GRAB__?.getSource,
      { timeout: HARNESS_INIT_TIMEOUT_MS },
    );

    const browserResolverNames: string[] = await page.evaluate(() =>
      (window as any).__BENCH__.list(),
    );
    const cliResolverNames = CLI_RESOLVERS.map((resolver) => resolver.name);
    const allResolverNames = [...browserResolverNames, ...cliResolverNames];

    const backendInfo = BACKENDS.map(
      (backend) => `${backend.name}: ${backend.model}`,
    ).join(", ");
    console.log(
      `\n  Resolvers: ${allResolverNames.join(", ")} (${backendInfo})`,
    );
    console.log(`  Entries:   ${TEST_MANIFEST.length}\n`);

    const { collected, cliCompleted } = await collectBrowserPhase(page);
    await runCliPhase(collected, cliCompleted);

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
