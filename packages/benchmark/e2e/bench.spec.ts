import { test as base, expect, type Page } from "@playwright/test";
import { exec } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { TEST_MANIFEST, type TestEntry } from "../test-manifest";
import { NEEDS_INTERACTION, isCorrectFile, normalizeFilePath } from "./interactions";

const CLI_MODEL = process.env.BENCH_MODEL ?? "claude-sonnet-4-6";
const CLI_TIMEOUT_MS = 180_000;
const CWD = join(__dirname, "..");
const CHECKPOINT_PATH = join(__dirname, "..", "e2e", "bench-checkpoint.json");
const BENCH_RESUME = Boolean(process.env.BENCH_RESUME);

interface ElementContext {
  componentName: string | null;
  elementPath: string | null;
  classes: string | null;
  nearbyText: string | null;
  sourceLoc: {
    fileName: string | null;
    componentName: string | null;
    found: boolean;
  } | null;
  reactGrab: {
    filePath: string | null;
    componentName: string | null;
    displayName: string | null;
    stackContext: string | null;
  } | null;
  reactGrabClipboard: string | null;
  agentationClipboard: string | null;
}

interface CliResolver {
  name: string;
  buildPrompt: (entry: TestEntry, ctx: ElementContext) => string;
}

const USER_PROMPT = (entry: TestEntry): string =>
  `I need to find the source file for a React component in this Next.js app. ${entry.description}. Where is it defined?`;

const CLI_RESOLVERS: CliResolver[] = [
  {
    name: "baseline",
    buildPrompt: (entry) => `${entry.lazyDescription}`,
  },
  {
    name: "claude-code",
    buildPrompt: (entry) => USER_PROMPT(entry),
  },
  {
    name: "agentation+claude",
    buildPrompt: (entry, ctx) => {
      if (!ctx.agentationClipboard) return USER_PROMPT(entry);
      return `${USER_PROMPT(entry)}\n\n${ctx.agentationClipboard}`;
    },
  },
  {
    name: "react-grab+claude",
    buildPrompt: (entry, ctx) => {
      if (!ctx.reactGrabClipboard) return USER_PROMPT(entry);
      return `${USER_PROMPT(entry)}\n\n${ctx.reactGrabClipboard}`;
    },
  },
];

const SCHEMA = JSON.stringify({
  type: "object",
  properties: {
    filePath: {
      type: "string",
      description: "Relative path e.g. components/styled/styled-card.tsx",
    },
    componentName: { type: "string" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
  required: ["filePath", "componentName", "confidence"],
});

const CLI_FLAGS = [
  `-p`,
  `--output-format json`,
  `--no-session-persistence`,
  `--disallowed-tools "Edit,Write,NotebookEdit,Bash"`,
  `--json-schema '${SCHEMA}'`,
  `--max-budget-usd 0.50`,
  CLI_MODEL ? `--model ${CLI_MODEL}` : "",
]
  .filter(Boolean)
  .join(" ");

const MAX_RETRIES = 1;

const runCliOnce = (
  prompt: string,
): Promise<{
  filePath: string | null;
  componentName: string | null;
  ms: number;
}> =>
  new Promise((resolve) => {
    const start = performance.now();
    const child = exec(
      `claude ${CLI_FLAGS} -- ${JSON.stringify(prompt)}`,
      {
        cwd: CWD,
        encoding: "utf-8",
        timeout: CLI_TIMEOUT_MS,
        env: { ...process.env, FORCE_COLOR: "0", CLAUDECODE: "" },
      },
      (error, stdout) => {
        const elapsedMs = performance.now() - start;
        if (error || !stdout) {
          resolve({ filePath: null, componentName: null, ms: elapsedMs });
          return;
        }
        try {
          const structured = JSON.parse(stdout).structured_output ?? {};
          resolve({
            filePath: structured.filePath ?? null,
            componentName: structured.componentName ?? null,
            ms: elapsedMs,
          });
        } catch {
          resolve({ filePath: null, componentName: null, ms: elapsedMs });
        }
      },
    );
    // HACK: exec() leaves stdin open, causing `claude -p` to hang waiting for EOF
    child.stdin?.end();
  });

const runCli = async (
  prompt: string,
): Promise<{
  filePath: string | null;
  componentName: string | null;
  ms: number;
}> => {
  const result = await runCliOnce(prompt);
  if (result.filePath) return result;

  for (let retry = 0; retry < MAX_RETRIES; retry++) {
    const retryPrompt = `${prompt}\n\nIMPORTANT: You didn't find the file yet. Keep searching — read more files, try different directory patterns. The file definitely exists in this codebase.`;
    const retryResult = await runCliOnce(retryPrompt);
    if (retryResult.filePath) {
      return { ...retryResult, ms: result.ms + retryResult.ms };
    }
  }
  return result;
};

const pool = async <T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> => {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < tasks.length) {
      const taskIndex = nextIndex++;
      results[taskIndex] = await tasks[taskIndex]();
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()),
  );
  return results;
};

const CLI_CONCURRENCY = parseInt(process.env.BENCH_CONCURRENCY ?? "10", 10);

const collectElementContext = async (
  page: Page,
  testId: string,
): Promise<ElementContext> => {
  return page.evaluate(async (tid: string) => {
    const el = document.querySelector(
      `[data-testid="${tid}"]`,
    ) as HTMLElement | null;
    const empty: ElementContext = {
      componentName: null,
      elementPath: null,
      classes: null,
      nearbyText: null,
      sourceLoc: null,
      reactGrab: null,
      reactGrabClipboard: null,
      agentationClipboard: null,
    };
    if (!el) return empty;
    const b = (window as any).__BENCH__;
    if (!b?.utils) return empty;
    const id = b.utils.identifyElement(el);
    const loc = b.utils.getSourceLocation(el);

    let reactGrab: ElementContext["reactGrab"] = null;
    let reactGrabClipboard: string | null = null;
    const rg = (window as any).__REACT_GRAB__;
    if (rg) {
      const src = await rg.getSource(el);
      const displayName = rg.getDisplayName(el);
      const stackContext = await rg.getStackContext(el);
      reactGrab = {
        filePath: src?.filePath ?? null,
        componentName: src?.componentName ?? null,
        displayName: displayName ?? null,
        stackContext: stackContext ?? null,
      };
      const genSnippet = (window as any).__REACT_GRAB_GENERATE_SNIPPET__;
      if (genSnippet) {
        const snippets: string[] = await genSnippet([el]);
        const snippet = snippets[0] ?? "";
        if (snippet) {
          const name = displayName ?? el.localName;
          reactGrabClipboard = `@<${name}>\n\n${snippet}\n`;
        }
      }
    }

    const elementPath = b.utils.getElementPath(el) ?? null;
    const classes = b.utils.getElementClasses(el) ?? null;
    const nearbyText = b.utils.getNearbyText(el) ?? null;
    const componentName = id?.name ?? null;
    const sourceFile = loc?.source?.fileName ?? null;
    const reactComponents = componentName ?? null;
    const rect = el.getBoundingClientRect();

    const agentationLines: string[] = [];
    agentationLines.push(`### 1. ${el.localName}`);
    if (elementPath) agentationLines.push(`**Location:** ${elementPath}`);
    if (sourceFile) agentationLines.push(`**Source:** ${sourceFile}`);
    if (reactComponents) agentationLines.push(`**React:** ${reactComponents}`);
    if (classes) agentationLines.push(`**Classes:** ${classes}`);
    agentationLines.push(
      `**Position:** ${Math.round(rect.x)}px, ${Math.round(rect.y)}px (${Math.round(rect.width)}×${Math.round(rect.height)}px)`,
    );
    const selectedText = el.innerText?.trim().slice(0, 100) ?? "";
    if (selectedText)
      agentationLines.push(`**Selected text:** "${selectedText}"`);
    const agentationClipboard = agentationLines.join("\n");

    return {
      componentName,
      elementPath,
      classes,
      nearbyText,
      sourceLoc: loc
        ? {
            fileName: loc.source?.fileName ?? null,
            componentName: loc.source?.componentName ?? null,
            found: loc.found,
          }
        : null,
      reactGrab,
      reactGrabClipboard,
      agentationClipboard,
    };
  }, testId);
};

const EMPTY_ELEMENT_CONTEXT: ElementContext = {
  componentName: null,
  elementPath: null,
  classes: null,
  nearbyText: null,
  sourceLoc: null,
  reactGrab: null,
  reactGrabClipboard: null,
  agentationClipboard: null,
};

const BENCH_INIT_TIMEOUT_MS = 15_000;
const INIT_SETTLE_MS = 1000;
const SKELETON_RELOAD_TIMEOUT_MS = 10_000;

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
        return bench && typeof bench.resolveAll === "function" && bench.list().length >= 2;
      },
      { timeout: BENCH_INIT_TIMEOUT_MS },
    );
    // HACK: wait for all browser resolvers to finish registering after API is ready
    await page.waitForTimeout(INIT_SETTLE_MS);
    await use(page);
  },
});


const formatTime = (ms: number): string =>
  ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms.toFixed(0)}ms`;

interface BrowserCollected {
  entry: TestEntry;
  browserResults: Record<
    string,
    {
      filePath: string | null;
      componentName: string | null;
      found: boolean;
      ms: number;
    }
  >;
  elementCtx: ElementContext;
  error?: string;
}

interface CliTask {
  entryIndex: number;
  resolverName: string;
  prompt: string;
}

interface ResolverResult {
  filePath: string | null;
  componentName: string | null;
  found: boolean;
  ms: number;
  correct: boolean;
}

interface EntryResult {
  id: number;
  testId: string;
  difficulty: string;
  expected: string;
  resolvers: Record<string, ResolverResult>;
  error?: string;
}

interface Checkpoint {
  browserCollected: BrowserCollected[];
  cliCompleted: Record<
    string,
    { filePath: string | null; componentName: string | null; ms: number }
  >;
}

const saveCheckpoint = (checkpoint: Checkpoint): void => {
  writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint));
};

const loadCheckpoint = (): Checkpoint | null => {
  if (!BENCH_RESUME || !existsSync(CHECKPOINT_PATH)) return null;
  try {
    return JSON.parse(readFileSync(CHECKPOINT_PATH, "utf-8"));
  } catch {
    return null;
  }
};

const TIERS = ["easy", "medium", "hard", "nightmare"] as const;

test.describe("Unified benchmark \u2014 all resolvers", () => {
  test.setTimeout(3_600_000);

  test("compare all resolvers across full manifest", async ({ page }) => {
    await page.waitForFunction(
      () => (window as any).__REACT_GRAB__?.getSource,
      { timeout: 15_000 },
    );

    const browserResolvers: string[] = await page.evaluate(() =>
      (window as any).__BENCH__.list(),
    );
    const cliResolverNames = CLI_RESOLVERS.map((resolver) => resolver.name);
    const allResolvers = [...browserResolvers, ...cliResolverNames];

    console.log(
      `\n  Resolvers: ${allResolvers.join(", ")}${CLI_MODEL ? ` (model: ${CLI_MODEL})` : ""}`,
    );
    console.log(`  Entries:   ${TEST_MANIFEST.length}\n`);

    const checkpoint = loadCheckpoint();
    let collected: BrowserCollected[];
    const cliCompleted: Record<
      string,
      { filePath: string | null; componentName: string | null; ms: number }
    > = checkpoint?.cliCompleted ?? {};

    if (checkpoint?.browserCollected?.length === TEST_MANIFEST.length) {
      collected = checkpoint.browserCollected;
      console.log(
        `  Resumed browser phase from checkpoint (${collected.length} entries)`,
      );
    } else {
      collected = [];
      for (const entry of TEST_MANIFEST) {
        try {
          if (BENCH_INTERACTIONS[entry.testId])
            await BENCH_INTERACTIONS[entry.testId](page);

          const visible = await page
            .locator(`[data-testid="${entry.testId}"]`)
            .first()
            .isVisible()
            .catch(() => false);
          if (!visible) {
            collected.push({
              entry,
              browserResults: {},
              elementCtx: EMPTY_ELEMENT_CONTEXT,
              error: "not visible",
            });
            continue;
          }

          const browserResults = (await page.evaluate(
            async (tid: string) => (window as any).__BENCH__.resolveAll(tid),
            entry.testId,
          )) as Record<
            string,
            {
              filePath: string | null;
              componentName: string | null;
              found: boolean;
              ms: number;
            }
          >;

          const elementCtx = await collectElementContext(page, entry.testId);

          collected.push({ entry, browserResults, elementCtx });
        } catch (e) {
          collected.push({
            entry,
            browserResults: {},
            elementCtx: EMPTY_ELEMENT_CONTEXT,
            error: String(e),
          });
        }
      }
      saveCheckpoint({ browserCollected: collected, cliCompleted });
      console.log(
        `  Browser phase done (${collected.length} entries collected)`,
      );
    }

    const cliTasks: CliTask[] = [];
    for (
      let collectedIndex = 0;
      collectedIndex < collected.length;
      collectedIndex++
    ) {
      const { entry, elementCtx, error } = collected[collectedIndex];
      if (error) continue;
      for (const cliResolver of CLI_RESOLVERS) {
        const taskKey = `${entry.id}:${cliResolver.name}`;
        if (cliCompleted[taskKey]) continue;
        cliTasks.push({
          entryIndex: collectedIndex,
          resolverName: cliResolver.name,
          prompt: cliResolver.buildPrompt(entry, elementCtx),
        });
      }
    }

    const skippedCount = Object.keys(cliCompleted).length;
    if (skippedCount > 0)
      console.log(`  Resumed ${skippedCount} CLI tasks from checkpoint`);
    console.log(
      `  Running ${cliTasks.length} CLI tasks (concurrency: ${CLI_CONCURRENCY})...\n`,
    );

    const cliResults = await pool(
      cliTasks.map(
        (task) => () =>
          runCli(task.prompt).then((result) => {
            const taskKey = `${collected[task.entryIndex].entry.id}:${task.resolverName}`;
            cliCompleted[taskKey] = result;
            saveCheckpoint({ browserCollected: collected, cliCompleted });
            return result;
          }),
      ),
      CLI_CONCURRENCY,
    );

    for (let taskIndex = 0; taskIndex < cliTasks.length; taskIndex++) {
      const task = cliTasks[taskIndex];
      const cliResult = cliResults[taskIndex];
      if (!collected[task.entryIndex].browserResults[task.resolverName]) {
        collected[task.entryIndex].browserResults[task.resolverName] = {
          filePath: cliResult.filePath,
          componentName: cliResult.componentName,
          found: Boolean(cliResult.filePath),
          ms: cliResult.ms,
        };
      }
    }

    for (const [taskKey, result] of Object.entries(cliCompleted)) {
      const [idStr, resolverName] = taskKey.split(":");
      const collectedIndex = collected.findIndex(
        (c) => c.entry.id === parseInt(idStr, 10),
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

    const results: EntryResult[] = [];

    for (const { entry, browserResults, elementCtx, error } of collected) {
      const resolvers: Record<string, ResolverResult> = {};
      const columns: string[] = [];

      if (error) {
        for (const resolverName of allResolvers)
          resolvers[resolverName] = {
            filePath: null,
            componentName: null,
            found: false,
            ms: 0,
            correct: false,
          };
        results.push({
          id: entry.id,
          testId: entry.testId,
          difficulty: entry.difficulty,
          expected: entry.filePath,
          resolvers,
          error,
        });
        continue;
      }

      for (const name of allResolvers) {
        const resolverResult = browserResults[name];
        if (!resolverResult) {
          resolvers[name] = {
            filePath: null,
            componentName: null,
            found: false,
            ms: 0,
            correct: false,
          };
          columns.push(`${name}: \u2014`);
          continue;
        }
        const isCorrect = isCorrectFile(
          resolverResult.filePath,
          entry.filePath,
        );
        resolvers[name] = { ...resolverResult, correct: isCorrect };
        const symbol = isCorrect
          ? "\u2713"
          : resolverResult.found
            ? "~"
            : "\u2717";
        columns.push(`${name}: ${symbol} ${formatTime(resolverResult.ms)}`);
      }

      results.push({
        id: entry.id,
        testId: entry.testId,
        difficulty: entry.difficulty,
        expected: entry.filePath,
        resolvers,
      });

      console.log(
        `  [${String(entry.id).padStart(2)}] ${entry.testId.padEnd(28)} ${columns.join("  |  ")}`,
      );
      console.log(`        expected: ${entry.filePath}`);
      for (const name of allResolvers) {
        const resolverResult = resolvers[name];
        if (resolverResult?.filePath) {
          console.log(
            `        ${name.padEnd(22)} ${normalizeFilePath(resolverResult.filePath)}${resolverResult.correct ? "" : " \u2190 WRONG"}`,
          );
        } else {
          console.log(`        ${name.padEnd(22)} (no result)`);
        }
      }
    }

    console.log(`\n  ${"━".repeat(80)}`);
    for (const name of allResolvers) {
      const correctEntries = results.filter(
        (entry) => entry.resolvers[name]?.correct,
      );
      const avgTiming =
        correctEntries.length > 0
          ? formatTime(
              correctEntries.reduce(
                (sum, entry) => sum + entry.resolvers[name].ms,
                0,
              ) / correctEntries.length,
            )
          : "\u2014";
      console.log(
        `  ${name.padEnd(22)} ${correctEntries.length}/${results.length} correct (${((correctEntries.length / results.length) * 100).toFixed(0)}%) \u2014 avg ${avgTiming}`,
      );
    }
    console.log();

    const outputDir = join(__dirname, "..");
    const resultsJsonPath = join(outputDir, "e2e/bench-results.json");
    const cliOnlyResolvers = allResolvers.filter(
      (name) => !["react-grab", "agentation", "baseline"].includes(name),
    );
    const chartResolvers =
      cliOnlyResolvers.length > 0 ? cliOnlyResolvers : allResolvers;
    writeFileSync(
      resultsJsonPath,
      JSON.stringify({ resolverNames: allResolvers, results }, null, 2),
    );
    console.log(`  ${resultsJsonPath}`);

    // Generate website data.json for the benchmarks page
    const TIER_LABELS: Record<string, string> = {
      easy: "plain components",
      medium: "HOCs, portals, compound",
      hard: "nested HOCs + Radix + Motion",
      nightmare: "recursive trees, triple portals, factories",
    };
    const websiteResolvers = chartResolvers.map((name) => ({
      key: name,
      label:
        name === "claude-code"
          ? "Claude Code (no tool)"
          : name === "react-grab+claude"
            ? "React Grab + Claude Code"
            : name === "agentation+claude"
              ? "Agentation + Claude Code"
              : name,
    }));
    const websiteScenarios = [
      { label: "overall", tier: null, cases: results.length },
      ...TIERS.map((tier) => ({
        label: TIER_LABELS[tier] ?? tier,
        tier,
        cases: results.filter((e) => e.difficulty === tier).length,
      })),
    ]
      .filter((s) => s.tier === null || s.cases > 0)
      .map((s) => {
        const entries =
          s.tier === null
            ? results
            : results.filter((e) => e.difficulty === s.tier);
        const scenarioResults: Record<
          string,
          { speed: number; accuracy: number; correct: number }
        > = {};
        for (const name of chartResolvers) {
          const all = entries.map((e) => e.resolvers[name]).filter(Boolean);
          const correct = all.filter((r) => r.correct);
          const avgMs = correct.length
            ? correct.reduce((sum, r) => sum + r.ms, 0) / correct.length
            : all.length
              ? all.reduce((sum, r) => sum + r.ms, 0) / all.length
              : 0;
          scenarioResults[name] = {
            speed: Math.round(avgMs / 100) / 10,
            accuracy: entries.length
              ? Math.round((correct.length / entries.length) * 100)
              : 0,
            correct: correct.length,
          };
        }
        return { label: s.label, cases: s.cases, results: scenarioResults };
      });
    const websiteTestCases = results.map((entry) => {
      const perResolver: Record<string, { speed: number; correct: boolean }> =
        {};
      for (const name of chartResolvers) {
        const r = entry.resolvers[name];
        perResolver[name] = {
          speed: r ? Math.round(r.ms / 100) / 10 : 0,
          correct: r?.correct ?? false,
        };
      }
      return {
        id: entry.id,
        testId: entry.testId,
        difficulty: entry.difficulty,
        results: perResolver,
      };
    });
    const websiteData = {
      lastBenchmarked: new Date().toISOString().split("T")[0],
      control: "claude-code",
      resolvers: websiteResolvers,
      scenarios: websiteScenarios,
      testCases: websiteTestCases,
    };
    const websiteDataPath = join(
      __dirname,
      "..",
      "..",
      "..",
      "website",
      "app",
      "data.json",
    );
    writeFileSync(websiteDataPath, JSON.stringify(websiteData, null, 2));
    console.log(`  ${websiteDataPath}`);
    console.log();

    expect(
      Math.max(
        ...allResolvers.map(
          (name) =>
            results.filter((entry) => entry.resolvers[name]?.correct).length,
        ),
      ),
    ).toBeGreaterThan(0);
  });
});
