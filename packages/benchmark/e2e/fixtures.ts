import { test as base, expect, type Page } from "@playwright/test";

const REACT_GRAB_INIT_TIMEOUT_MS = 15_000;
const INIT_SETTLE_MS = 1000;
const COPY_SETTLE_MS = 200;
const SOURCE_RETRY_MS = 500;
const MAX_SOURCE_RETRIES = 3;
const ACTIVATE_TIMEOUT_MS = 5_000;
const HOVER_SETTLE_MS = 500;
const CLICK_SETTLE_MS = 1000;

interface SourceInfo {
  filePath: string;
  lineNumber: number | null;
  componentName: string | null;
}

interface GrabResult {
  clipboard: string;
  source: SourceInfo | null;
  displayName: string | null;
}

export interface GrabFixture {
  page: Page;
  waitForReactGrab: () => Promise<void>;
  grabByTestId: (testId: string) => Promise<GrabResult>;
  getSourceByTestId: (testId: string) => Promise<SourceInfo | null>;
  getClipboard: () => Promise<string>;
  activate: () => Promise<void>;
  hoverAndGrab: (testId: string) => Promise<GrabResult>;
}

const waitForReactGrab = async (page: Page): Promise<void> => {
  await page.waitForFunction(
    () => {
      const api = (window as any).__REACT_GRAB__;
      return api && typeof api.copyElement === "function";
    },
    { timeout: REACT_GRAB_INIT_TIMEOUT_MS },
  );
  // HACK: wait for React Grab internals to finish initializing after the API is exposed
  await page.waitForTimeout(INIT_SETTLE_MS);
};

export const test = base.extend<{ grab: GrabFixture }>({
  grab: async ({ page, context }, use) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/", { waitUntil: "load" });
    await waitForReactGrab(page);

    const fixture: GrabFixture = {
      page,

      waitForReactGrab: () => waitForReactGrab(page),

      grabByTestId: async (testId: string): Promise<GrabResult> => {
        const copySuccess = await page.evaluate(async (tid) => {
          const element = document.querySelector(`[data-testid="${tid}"]`);
          if (!element)
            throw new Error(`Element with data-testid="${tid}" not found`);
          const api = (window as any).__REACT_GRAB__;
          if (!api) throw new Error("react-grab not initialized");
          return api.copyElement(element);
        }, testId);

        if (!copySuccess) {
          throw new Error(`copyElement failed for data-testid="${testId}"`);
        }

        await page.waitForTimeout(COPY_SETTLE_MS);

        const clipboard = await page.evaluate(() =>
          navigator.clipboard.readText(),
        );

        let source: SourceInfo | null = null;
        for (let attempt = 0; attempt < MAX_SOURCE_RETRIES; attempt++) {
          source = await page.evaluate(async (tid) => {
            const element = document.querySelector(`[data-testid="${tid}"]`);
            if (!element) return null;
            const api = (window as any).__REACT_GRAB__;
            if (!api) return null;
            return api.getSource(element);
          }, testId);
          if (source) break;
          await page.waitForTimeout(SOURCE_RETRY_MS);
        }

        const displayName = await page.evaluate((tid) => {
          const element = document.querySelector(`[data-testid="${tid}"]`);
          if (!element) return null;
          const api = (window as any).__REACT_GRAB__;
          if (!api) return null;
          return api.getDisplayName(element);
        }, testId);

        return { clipboard, source, displayName };
      },

      getSourceByTestId: async (testId: string): Promise<SourceInfo | null> =>
        page.evaluate(async (tid) => {
          const element = document.querySelector(`[data-testid="${tid}"]`);
          if (!element) return null;
          const api = (window as any).__REACT_GRAB__;
          if (!api) return null;
          return api.getSource(element);
        }, testId),

      getClipboard: () => page.evaluate(() => navigator.clipboard.readText()),

      activate: async (): Promise<void> => {
        await page.evaluate(() => {
          const api = (window as any).__REACT_GRAB__;
          api?.activate();
        });
        await page.waitForFunction(
          () => (window as any).__REACT_GRAB__?.isActive() === true,
          { timeout: ACTIVATE_TIMEOUT_MS },
        );
      },

      hoverAndGrab: async (testId: string): Promise<GrabResult> => {
        await fixture.activate();

        const element = page.locator(`[data-testid="${testId}"]`).first();
        await element.hover({ force: true });
        await page.waitForTimeout(HOVER_SETTLE_MS);

        await element.click({ force: true });
        await page.waitForTimeout(CLICK_SETTLE_MS);

        const clipboard = await page.evaluate(() =>
          navigator.clipboard.readText(),
        );

        const source = await page.evaluate(async (tid) => {
          const element = document.querySelector(`[data-testid="${tid}"]`);
          if (!element) return null;
          return (window as any).__REACT_GRAB__?.getSource(element) ?? null;
        }, testId);

        const displayName = await page.evaluate((tid) => {
          const element = document.querySelector(`[data-testid="${tid}"]`);
          if (!element) return null;
          return (window as any).__REACT_GRAB__?.getDisplayName(element) ?? null;
        }, testId);

        await page.evaluate(() => (window as any).__REACT_GRAB__?.deactivate());

        return { clipboard, source, displayName };
      },
    };

    await use(fixture);
  },
});

export { expect };
