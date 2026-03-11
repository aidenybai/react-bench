import type { Page } from "@playwright/test";

const INTERACTION_SETTLE_MS = 500;
const MODAL_SETTLE_MS = 800;
const MENU_EXPAND_MS = 200;
const MENU_FINAL_SETTLE_MS = 300;
const MAX_MENU_EXPAND_ROUNDS = 10;

const clickTriggerByTestId = async (
  page: Page,
  testId: string,
): Promise<void> => {
  await page.evaluate((tid) => {
    const trigger = document.querySelector(
      `[data-testid="${tid}"]`,
    ) as HTMLElement | null;
    trigger?.click();
  }, testId);
  await page.waitForTimeout(INTERACTION_SETTLE_MS);
};

const pointerClickTriggerByTestId = async (
  page: Page,
  testId: string,
): Promise<void> => {
  await page.evaluate((tid) => {
    const trigger = document.querySelector(
      `[data-testid="${tid}"]`,
    ) as HTMLElement | null;
    if (!trigger) return;
    trigger.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        pointerType: "mouse",
      }),
    );
    trigger.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
  }, testId);
  await page.waitForTimeout(INTERACTION_SETTLE_MS);
};

const NEEDS_INTERACTION: Record<string, (page: Page) => Promise<void>> = {
  "radix-dropdown-item": (page) =>
    pointerClickTriggerByTestId(page, "radix-dropdown-trigger"),

  "radix-accordion-content": (page) =>
    clickTriggerByTestId(page, "radix-accordion-trigger"),

  "radix-popover-content": (page) =>
    pointerClickTriggerByTestId(page, "radix-popover-trigger"),

  "portal-motion-modal": async (page) => {
    await page.evaluate(() => {
      for (const button of document.querySelectorAll("button")) {
        if (button.textContent?.trim() === "Open Motion Modal") {
          button.click();
          break;
        }
      }
    });
    await page.waitForTimeout(MODAL_SETTLE_MS);
  },

  "button-in-dialog-in-motion": (page) =>
    clickTriggerByTestId(page, "nested-dialog-trigger"),

  "recursive-menu-deepest": async (page) => {
    for (let round = 0; round < MAX_MENU_EXPAND_ROUNDS; round++) {
      const didExpand = await page.evaluate(() => {
        const container = document.querySelector(
          '[data-testid="recursive-menu"]',
        );
        if (!container) return false;
        let expanded = false;
        for (const button of container.querySelectorAll("button")) {
          if (button.textContent?.includes("▶")) {
            button.dispatchEvent(
              new MouseEvent("click", { bubbles: true, cancelable: true }),
            );
            expanded = true;
          }
        }
        return expanded;
      });
      if (!didExpand) break;
      await page.waitForTimeout(MENU_EXPAND_MS);
    }
    await page.waitForTimeout(MENU_FINAL_SETTLE_MS);
  },
};

export { NEEDS_INTERACTION };
