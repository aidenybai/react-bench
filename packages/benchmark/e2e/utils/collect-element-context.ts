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
      clickToComponentClipboard: null,
      locatorjsClipboard: null,
      instrucktClipboard: null,
    };

    const element = document.querySelector(
      `[data-testid="${tid}"]`,
    ) as HTMLElement | null;
    if (!element) return emptyContext;

    const benchApi = (window as any).__BENCH__;
    const buildAnnotation = (window as any).__BENCH_BUILD_ANNOTATION__;
    if (!benchApi?.prod || !buildAnnotation) return emptyContext;

    const { prod } = benchApi;
    const pathname = window.location.pathname;
    const selectedText = element.innerText?.trim().slice(0, 100) ?? "";

    const prodAnnotation = buildAnnotation(prod, element, selectedText);
    prodAnnotation.sourceFile = prod.detectSourceFile(element);
    const agentationClipboard = prod.generateOutput(
      [prodAnnotation],
      pathname,
      "forensic",
    );

    const prodSourceLoc = prod.getSourceLocation(element);

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

    let cursorBrowserClipboard: string | null = null;
    const cursorInspector = (window as any).__CURSOR_BROWSER_INSPECTOR__;
    if (cursorInspector) {
      const metadata = cursorInspector.inspectElement(element);
      cursorBrowserClipboard = cursorInspector.formatClipboardText(metadata);
    }

    const resolveOne = async (name: string) => {
      const results = await benchApi.resolve(element, name);
      return results[name] ?? null;
    };

    const [clickToComponentResult, locatorjsResult, instrucktResult] =
      await Promise.all([
        resolveOne("click-to-component"),
        resolveOne("locatorjs"),
        resolveOne("instruckt"),
      ]);

    const formatSimpleClipboard = (
      result: { filePath: string | null; componentName: string | null; found: boolean } | null,
    ): string | null => {
      if (!result?.found || !result.filePath) return null;
      let text = result.filePath;
      if (result.componentName) text = `${result.componentName} at ${text}`;
      return text;
    };

    const clickToComponentClipboard = formatSimpleClipboard(clickToComponentResult);
    const locatorjsClipboard = formatSimpleClipboard(locatorjsResult);

    const instrucktClipboard = benchApi.buildInstrucktClipboard
      ? await benchApi.buildInstrucktClipboard(element, pathname)
      : null;

    const prodIdentity = prod.identifyElementWithReact(element);
    return {
      componentName: prodIdentity.elementName,
      elementPath: prodAnnotation.elementPath,
      classes: prodAnnotation.cssClasses ?? null,
      nearbyText: prodAnnotation.nearbyText ?? null,
      sourceLoc: prodSourceLoc
        ? {
            fileName: prodSourceLoc.source?.fileName ?? null,
            componentName: prodSourceLoc.source?.componentName ?? null,
            found: prodSourceLoc.found,
          }
        : null,
      reactGrab,
      reactGrabClipboard,
      agentationClipboard,
      cursorBrowserClipboard,
      clickToComponentClipboard,
      locatorjsClipboard,
      instrucktClipboard,
    };
  }, testId);

export { collectElementContext };
