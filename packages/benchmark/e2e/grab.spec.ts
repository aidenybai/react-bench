import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import { NEEDS_INTERACTION, normalizeFilePath } from "./interactions";
import { TEST_MANIFEST, type TestEntry } from "../test-manifest";

const ELEMENT_VISIBLE_TIMEOUT_MS = 15_000;
const SKELETON_RELOAD_TIMEOUT_MS = 10_000;

const GRAB_INTERACTIONS: Record<string, (page: Page) => Promise<void>> = {
  ...NEEDS_INTERACTION,
  "shadcn-skeleton": async (page) => {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () => {
        const api = (window as any).__REACT_GRAB__;
        return api && typeof api.copyElement === "function";
      },
      { timeout: SKELETON_RELOAD_TIMEOUT_MS },
    );
  },
};

const TIER_LABELS: Record<string, string> = {
  easy: "Easy — baseline components",
  medium: "Medium — HOCs, portals, compound components",
  hard: "Hard — recursive, mixed styling, deep nesting",
  nightmare: "Nightmare — extreme nesting, portals, dynamic trees",
};

const byDifficulty = (difficulty: TestEntry["difficulty"]): TestEntry[] =>
  TEST_MANIFEST.filter((entry) => entry.difficulty === difficulty);

for (const [difficulty, label] of Object.entries(TIER_LABELS)) {
  test.describe(label, () => {
    for (const entry of byDifficulty(difficulty as TestEntry["difficulty"])) {
      test(`[${entry.id}] ${entry.testId}: ${entry.description}`, async ({
        grab,
      }) => {
        if (GRAB_INTERACTIONS[entry.testId]) {
          await GRAB_INTERACTIONS[entry.testId](grab.page);
        }

        const element = grab.page
          .locator(`[data-testid="${entry.testId}"]`)
          .first();
        await expect(element).toBeVisible({ timeout: ELEMENT_VISIBLE_TIMEOUT_MS });

        const result = await grab.grabByTestId(entry.testId);

        expect(result.clipboard).toBeTruthy();
        expect(result.clipboard.length).toBeGreaterThan(0);

        if (result.source) {
          expect(result.source.filePath).toMatch(/\.tsx$/);
        }

        if (result.displayName) {
          expect(result.displayName.length).toBeGreaterThan(0);
        }
      });
    }
  });
}

test.describe("Clipboard format validation", () => {
  const sampleEntries = [TEST_MANIFEST[0], TEST_MANIFEST[6], TEST_MANIFEST[12]];

  for (const entry of sampleEntries) {
    test(`[${entry.id}] clipboard format for ${entry.testId}`, async ({
      grab,
    }) => {
      const element = grab.page
        .locator(`[data-testid="${entry.testId}"]`)
        .first();
      await expect(element).toBeVisible({ timeout: ELEMENT_VISIBLE_TIMEOUT_MS });

      const result = await grab.grabByTestId(entry.testId);

      expect(result.clipboard).toMatch(/^@/);
      expect(result.clipboard).toContain("\n");
      expect(result.clipboard).toMatch(/<\w+/);
    });
  }
});

test.describe("UI-driven grab (hover + click)", () => {
  const uiTestEntries = [TEST_MANIFEST[0], TEST_MANIFEST[6], TEST_MANIFEST[10]];

  for (const entry of uiTestEntries) {
    test(`[${entry.id}] hover+click grab for ${entry.testId}`, async ({
      grab,
    }) => {
      const result = await grab.hoverAndGrab(entry.testId);

      if (result.clipboard) {
        expect(result.clipboard.length).toBeGreaterThan(0);
      }

      if (result.source) {
        expect(result.source.filePath).toMatch(/\.tsx$/);
      }
    });
  }
});

test.describe("Scoring summary", () => {
  test.setTimeout(300_000);

  test("run all entries and report score", async ({ grab }) => {
    interface EntryResult {
      id: number;
      testId: string;
      difficulty: string;
      expected: string;
      actualSource: string | null;
      actualName: string | null;
      sourceResolved: boolean;
      correctFile: boolean;
      hasDisplayName: boolean;
      hasClipboard: boolean;
      agentationSource: string | null;
      error?: string;
    }

    const results: EntryResult[] = [];

    for (const entry of TEST_MANIFEST) {
      try {
        if (GRAB_INTERACTIONS[entry.testId]) {
          await GRAB_INTERACTIONS[entry.testId](grab.page);
        }

        const element = grab.page
          .locator(`[data-testid="${entry.testId}"]`)
          .first();
        const isVisible = await element.isVisible().catch(() => false);

        if (!isVisible) {
          results.push({
            id: entry.id,
            testId: entry.testId,
            difficulty: entry.difficulty,
            expected: entry.filePath,
            actualSource: null,
            actualName: null,
            sourceResolved: false,
            correctFile: false,
            hasDisplayName: false,
            hasClipboard: false,
            agentationSource: null,
            error: "element not visible",
          });
          continue;
        }

        const result = await grab.grabByTestId(entry.testId);

        const agentationSource = await grab.page.evaluate((tid) => {
          const targetElement = document.querySelector(`[data-testid="${tid}"]`);
          if (!targetElement) return null;
          try {
            const bench = (window as any).__BENCH__;
            if (!bench) return null;
            const location = bench.utils.getSourceLocation(
              targetElement as HTMLElement,
            );
            return location?.found
              ? (location.source?.fileName ?? null)
              : null;
          } catch {
            return null;
          }
        }, entry.testId);

        const sourceResolved = result.source !== null;
        const actualPath = sourceResolved
          ? normalizeFilePath(result.source!.filePath)
          : null;
        const correctFile = actualPath
          ? actualPath.includes(entry.filePath.split("/").slice(1).join("/"))
          : false;

        results.push({
          id: entry.id,
          testId: entry.testId,
          difficulty: entry.difficulty,
          expected: entry.filePath,
          actualSource: actualPath,
          actualName: result.displayName,
          sourceResolved,
          correctFile,
          hasDisplayName: Boolean(result.displayName),
          hasClipboard: Boolean(result.clipboard),
          agentationSource,
        });
      } catch (error) {
        results.push({
          id: entry.id,
          testId: entry.testId,
          difficulty: entry.difficulty,
          expected: entry.filePath,
          actualSource: null,
          actualName: null,
          sourceResolved: false,
          correctFile: false,
          hasDisplayName: false,
          hasClipboard: false,
          agentationSource: null,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const difficulties = ["easy", "medium", "hard", "nightmare"] as const;
    console.log("\n========== REACT-GRAB BENCHMARK RESULTS ==========\n");

    let totalResolved = 0;
    let totalCorrect = 0;
    let totalEntries = 0;

    for (const difficulty of difficulties) {
      const tier = results.filter(
        (entryResult) => entryResult.difficulty === difficulty,
      );
      const resolved = tier.filter(
        (entryResult) => entryResult.sourceResolved,
      ).length;
      const correct = tier.filter(
        (entryResult) => entryResult.correctFile,
      ).length;
      const withName = tier.filter(
        (entryResult) => entryResult.hasDisplayName,
      ).length;
      const withClip = tier.filter(
        (entryResult) => entryResult.hasClipboard,
      ).length;

      console.log(`${difficulty.toUpperCase()} (${tier.length} cases):`);
      console.log(`  Source resolved: ${resolved}/${tier.length}`);
      console.log(`  Correct file:   ${correct}/${tier.length}`);
      console.log(`  Display name:   ${withName}/${tier.length}`);
      console.log(`  Clipboard:      ${withClip}/${tier.length}`);

      for (const entryResult of tier) {
        const statusSymbol = entryResult.correctFile
          ? "✓"
          : entryResult.sourceResolved
            ? "~"
            : "✗";
        const line = `    ${statusSymbol} [${entryResult.id}] ${entryResult.testId}`;
        if (entryResult.error) {
          console.log(`${line}: ERROR ${entryResult.error}`);
        } else if (!entryResult.sourceResolved) {
          console.log(
            `${line}: no source (expected ${entryResult.expected})`,
          );
        } else if (!entryResult.correctFile) {
          console.log(
            `${line}: WRONG FILE\n        expected: ${entryResult.expected}\n        actual:   ${entryResult.actualSource}`,
          );
        } else {
          console.log(
            `${line}: ${entryResult.actualName ?? "?"} → ${entryResult.actualSource}`,
          );
        }
      }
      console.log();

      totalResolved += resolved;
      totalCorrect += correct;
      totalEntries += tier.length;
    }

    console.log(`TOTAL: ${totalResolved}/${totalEntries} sources resolved`);
    console.log(`TOTAL: ${totalCorrect}/${totalEntries} correct file paths`);
    console.log(
      `ACCURACY: ${((totalCorrect / totalEntries) * 100).toFixed(1)}%`,
    );
    console.log("\n===================================================\n");

    expect(true).toBe(true);
  });
});
