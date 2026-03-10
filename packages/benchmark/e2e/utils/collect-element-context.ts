import type { Page } from "@playwright/test";
import type { ElementContext } from "../resolvers/types";

const collectElementContext = async (
  page: Page,
  testId: string,
): Promise<ElementContext> =>
  page.evaluate(async (tid: string) => {
    const emptyContext: ElementContext = {
      componentName: null,
      elementPath: null,
      classes: null,
      nearbyText: null,
      sourceLoc: null,
      reactGrab: null,
      reactGrabClipboard: null,
      agentationClipboard: null,
      cursorBrowserClipboard: null,
    };

    const element = document.querySelector(
      `[data-testid="${tid}"]`,
    ) as HTMLElement | null;
    if (!element) return emptyContext;

    const benchApi = (window as any).__BENCH__;
    if (!benchApi?.utils) return emptyContext;

    const componentIdentity = benchApi.utils.identifyElement(element);
    const sourceLocation = benchApi.utils.getSourceLocation(element);
    const elementPath = benchApi.utils.getElementPath(element) ?? null;
    const classes = benchApi.utils.getElementClasses(element) ?? null;
    const nearbyText = benchApi.utils.getNearbyText(element) ?? null;
    const componentName = componentIdentity?.name ?? null;
    const sourceFileName = sourceLocation?.source?.fileName ?? null;

    let reactGrab: ElementContext["reactGrab"] = null;
    let reactGrabClipboard: string | null = null;
    const reactGrabApi = (window as any).__REACT_GRAB__;
    if (reactGrabApi) {
      const source = await reactGrabApi.getSource(element);
      const displayName = reactGrabApi.getDisplayName(element);
      const stackContext = await reactGrabApi.getStackContext(element);
      reactGrab = {
        filePath: source?.filePath ?? null,
        componentName: source?.componentName ?? null,
        displayName: displayName ?? null,
        stackContext: stackContext ?? null,
      };
      const generateSnippet = (window as any).__REACT_GRAB_GENERATE_SNIPPET__;
      if (generateSnippet) {
        const snippets: string[] = await generateSnippet([element]);
        const snippet = snippets[0] ?? "";
        if (snippet) {
          const name = displayName ?? element.localName;
          reactGrabClipboard = `@<${name}>\n\n${snippet}\n`;
        }
      }
    }

    const rect = element.getBoundingClientRect();
    const agentationLines: string[] = [`### 1. ${element.localName}`];
    if (elementPath) agentationLines.push(`**Location:** ${elementPath}`);
    if (sourceFileName) agentationLines.push(`**Source:** ${sourceFileName}`);
    if (componentName) agentationLines.push(`**React:** ${componentName}`);
    if (classes) agentationLines.push(`**Classes:** ${classes}`);
    agentationLines.push(
      `**Position:** ${Math.round(rect.x)}px, ${Math.round(rect.y)}px (${Math.round(rect.width)}×${Math.round(rect.height)}px)`,
    );
    const selectedText = element.innerText?.trim().slice(0, 100) ?? "";
    if (selectedText)
      agentationLines.push(`**Selected text:** "${selectedText}"`);

    let cursorBrowserClipboard: string | null = null;
    const cursorInspector = (window as any).__CURSOR_BROWSER_INSPECTOR__;
    if (cursorInspector) {
      const metadata = cursorInspector.inspectElement(element);
      cursorBrowserClipboard = cursorInspector.formatClipboardText(metadata);
    }

    return {
      componentName,
      elementPath,
      classes,
      nearbyText,
      sourceLoc: sourceLocation
        ? {
            fileName: sourceLocation.source?.fileName ?? null,
            componentName: sourceLocation.source?.componentName ?? null,
            found: sourceLocation.found,
          }
        : null,
      reactGrab,
      reactGrabClipboard,
      agentationClipboard: agentationLines.join("\n"),
      cursorBrowserClipboard,
    };
  }, testId);

export { collectElementContext };
