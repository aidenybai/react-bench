import { test as base, expect } from "@playwright/test";
import { normalizeFilePath } from "./interactions";

const BENCH_INIT_TIMEOUT_MS = 15_000;
const INIT_SETTLE_MS = 1000;
const REACT_GRAB_INIT_TIMEOUT_MS = 15_000;

const test = base.extend<{ page: import("@playwright/test").Page }>({
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

test.describe("Bench harness", () => {
  test("__BENCH__ exposes unified API", async ({ page }) => {
    const api = await page.evaluate(() => {
      const bench = (window as any).__BENCH__;
      if (!bench) return null;
      return {
        resolvers: bench.list(),
        hasResolve: typeof bench.resolve === "function",
        hasResolveAll: typeof bench.resolveAll === "function",
        hasIdentify: typeof bench.identify === "function",
        hasRegister: typeof bench.register === "function",
        hasUtils: typeof bench.utils?.getSourceLocation === "function",
      };
    });

    expect(api).not.toBeNull();
    expect(api!.resolvers).toContain("react-grab");
    expect(api!.resolvers).toContain("agentation");
    expect(api!.hasResolve).toBe(true);
    expect(api!.hasResolveAll).toBe(true);
    expect(api!.hasIdentify).toBe(true);
    expect(api!.hasRegister).toBe(true);
    expect(api!.hasUtils).toBe(true);
  });

  test("custom resolver can be registered", async ({ page }) => {
    const result = await page.evaluate(() => {
      const bench = (window as any).__BENCH__;
      bench.register({
        name: "test-resolver",
        resolve: () => ({
          filePath: "test.tsx",
          componentName: "Test",
          found: true,
        }),
      });
      const resolverList = bench.list();
      bench.unregister("test-resolver");
      return {
        hadResolver: resolverList.includes("test-resolver"),
        afterRemoval: bench.list(),
      };
    });

    expect(result.hadResolver).toBe(true);
    expect(result.afterRemoval).not.toContain("test-resolver");
  });
});

test.describe("Agentation utilities via __BENCH__.utils", () => {
  test("identifyElement", async ({ page }) => {
    const result = await page.evaluate(() => {
      const element = document.querySelector(
        '[data-testid="plain-tw-card"]',
      ) as HTMLElement;
      return element
        ? (window as any).__BENCH__.utils.identifyElement(element)
        : null;
    });
    expect(result).not.toBeNull();
    expect(result!.name).toBeTruthy();
  });

  test("getNearbyText", async ({ page }) => {
    const result = await page.evaluate(() => {
      const element = document.querySelector(
        '[data-testid="plain-styled-card"]',
      ) as HTMLElement;
      return element
        ? (window as any).__BENCH__.utils.getNearbyText(element)
        : null;
    });
    expect(result).toBeTruthy();
    expect(result!.length).toBeGreaterThan(0);
  });

  test("getElementPath", async ({ page }) => {
    const result = await page.evaluate(() => {
      const element = document.querySelector(
        '[data-testid="plain-styled-badge"]',
      ) as HTMLElement;
      return element
        ? (window as any).__BENCH__.utils.getElementPath(element)
        : null;
    });
    expect(result).toBeTruthy();
    expect(result).toMatch(/body|div|section|span/i);
  });

  test("getElementClasses", async ({ page }) => {
    const result = await page.evaluate(() => {
      const element = document.querySelector(
        '[data-testid="plain-styled-card"]',
      ) as HTMLElement;
      return element
        ? (window as any).__BENCH__.utils.getElementClasses(element)
        : null;
    });
    expect(result).toBeTruthy();
  });
});

test.describe("Source resolution via __BENCH__", () => {
  test("getSourceLocation returns structured result", async ({ page }) => {
    const result = await page.evaluate(() => {
      const element = document.querySelector(
        '[data-testid="plain-styled-card"]',
      ) as HTMLElement;
      return element
        ? (window as any).__BENCH__.utils.getSourceLocation(element)
        : null;
    });
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("found");
    expect(result).toHaveProperty("isReactApp");
  });

  test("findNearestComponentSource walks ancestors", async ({ page }) => {
    const result = await page.evaluate(() => {
      const element = document.querySelector(
        '[data-testid="plain-tw-card"]',
      ) as HTMLElement;
      return element
        ? (window as any).__BENCH__.utils.findNearestComponentSource(element)
        : null;
    });
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("found");
  });
});

test.describe("Head-to-head: all resolvers", () => {
  test.setTimeout(120_000);

  const testCases = [
    { testId: "plain-styled-card", expected: "components/styled/styled-card.tsx" },
    { testId: "plain-tw-card", expected: "components/tailwind/tw-card.tsx" },
    { testId: "plain-animated-card", expected: "components/motion/animated-card.tsx" },
    { testId: "plain-inline-card", expected: "components/mixed/inline-card.tsx" },
    { testId: "plain-module-card", expected: "components/modules/module-card.tsx" },
    { testId: "shadcn-profile-card", expected: "components/shadcn/shadcn-profile-card.tsx" },
    { testId: "recursive-tree-leaf", expected: "components/recursive/recursive-tree.tsx" },
    { testId: "hoc-motion-styled-card", expected: "components/motion/animated-card.tsx" },
    { testId: "style-clash-button", expected: "components/mixed/style-clash.tsx" },
    { testId: "gauntlet-button", expected: "components/challenge/the-gauntlet.tsx" },
    { testId: "russian-doll-button", expected: "components/challenge/russian-doll.tsx" },
    { testId: "identity-depth-11", expected: "components/challenge/identity-crisis.tsx" },
    { testId: "shapeshifter", expected: "components/challenge/shapeshifter.tsx" },
  ];

  test("compare all resolvers across test cases", async ({ page }) => {
    await page.waitForFunction(
      () =>
        (window as any).__REACT_GRAB__ &&
        typeof (window as any).__REACT_GRAB__.getSource === "function",
      { timeout: REACT_GRAB_INIT_TIMEOUT_MS },
    );

    const resolverNames: string[] = await page.evaluate(() =>
      (window as any).__BENCH__.list(),
    );

    const scores: Record<string, { resolved: number; correct: number }> = {};
    for (const resolverName of resolverNames)
      scores[resolverName] = { resolved: 0, correct: 0 };

    console.log(`\n  Resolvers: ${resolverNames.join(", ")}\n`);

    for (const testCase of testCases) {
      const resolverResults = await page.evaluate(
        async (testId: string) => (window as any).__BENCH__.resolveAll(testId),
        testCase.testId,
      );

      const expectedSuffix = testCase.expected.split("/").slice(1).join("/");
      const columns: string[] = [];

      for (const resolverName of resolverNames) {
        const resolverResult = resolverResults[resolverName];
        if (!resolverResult) {
          columns.push(`${resolverName}: —`);
          continue;
        }

        const normalizedPath = normalizeFilePath(resolverResult.filePath);
        const isCorrect = normalizedPath?.includes(expectedSuffix) ?? false;

        if (resolverResult.found) scores[resolverName].resolved++;
        if (isCorrect) scores[resolverName].correct++;

        const symbol = isCorrect ? "✓" : resolverResult.found ? "~" : "✗";
        columns.push(
          `${resolverName}: ${symbol} ${(resolverResult.ms ?? 0).toFixed(0)}ms`,
        );
      }

      console.log(
        `  ${testCase.testId.padEnd(28)} ${columns.join("  |  ")}`,
      );
    }

    const totalCases = testCases.length;
    console.log();
    for (const resolverName of resolverNames) {
      const resolverScore = scores[resolverName];
      console.log(
        `  ${resolverName.padEnd(15)} ${resolverScore.resolved}/${totalCases} resolved, ${resolverScore.correct}/${totalCases} correct (${((resolverScore.correct / totalCases) * 100).toFixed(0)}%)`,
      );
    }
    console.log();

    expect(scores["react-grab"]?.resolved ?? 0).toBeGreaterThan(0);
  });
});
