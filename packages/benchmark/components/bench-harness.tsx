"use client";

import { useEffect } from "react";
import { formatAnnotationMarkdown } from "instruckt";
import {
  Agentation,
  identifyElement,
  getNearbyText,
  getElementPath,
  getElementClasses,
  getSourceLocation,
  findNearestComponentSource,
  identifyElementWithReact,
  detectSourceFile,
  getReactComponentName,
  generateOutput,
  getNearbyElements,
  getFullElementPath,
  getAccessibilityInfo,
  getForensicComputedStyles,
  getDetailedComputedStyles,
} from "agentation";

export interface SourceResult {
  filePath: string | null;
  componentName: string | null;
  found: boolean;
}

export interface Resolver {
  name: string;
  resolve: (el: HTMLElement) => SourceResult | Promise<SourceResult>;
  identify?: (el: HTMLElement) => { name: string; path: string } | null;
}

const reactGrabResolver: Resolver = {
  name: "react-grab",
  resolve: async (el) => {
    const api = (window as any).__REACT_GRAB__;
    if (!api) return { filePath: null, componentName: null, found: false };
    const src = await api.getSource(el);
    const name = api.getDisplayName(el);
    return {
      filePath: src?.filePath ?? null,
      componentName: name ?? null,
      found: Boolean(src),
    };
  },
  identify: (el) => {
    const api = (window as any).__REACT_GRAB__;
    if (!api) return null;
    const name = api.getDisplayName(el);
    return name ? { name, path: "" } : null;
  },
};

const agentationResolver: Resolver = {
  name: "agentation",
  resolve: (el) => {
    const loc = getSourceLocation(el);
    return {
      filePath: loc.source?.fileName ?? null,
      componentName: loc.source?.componentName ?? null,
      found: loc.found,
    };
  },
  identify: (el) => identifyElement(el),
};

const cursorBrowserResolver: Resolver = {
  name: "cursor-browser",
  resolve: (el) => {
    const inspector = (window as any).__CURSOR_BROWSER_INSPECTOR__;
    if (!inspector)
      return { filePath: null, componentName: null, found: false };
    const metadata = inspector.inspectElement(el);
    return {
      filePath: null,
      componentName: metadata.reactComponent?.name ?? null,
      found: Boolean(metadata.reactComponent),
    };
  },
  identify: (el) => {
    const inspector = (window as any).__CURSOR_BROWSER_INSPECTOR__;
    if (!inspector) return null;
    const metadata = inspector.inspectElement(el);
    return metadata.reactComponent
      ? { name: metadata.reactComponent.name, path: metadata.domPath }
      : null;
  },
};

const clickToComponentResolver: Resolver = {
  name: "click-to-component",
  resolve: async (el) => {
    try {
      const { getSourceForElement } = await import(
        // @ts-expect-error patched subpath export
        "click-to-react-component/src/getSourceForElement.js"
      );
      const { getReactInstanceForElement } = await import(
        // @ts-expect-error patched subpath export
        "click-to-react-component/src/getReactInstanceForElement.js"
      );
      const { getDisplayNameForInstance } = await import(
        // @ts-expect-error patched subpath export
        "click-to-react-component/src/getDisplayNameFromReactInstance.js"
      );

      const source = getSourceForElement(el);
      const instance = getReactInstanceForElement(el);
      const componentName = instance
        ? getDisplayNameForInstance(instance)
        : null;

      return {
        filePath: source?.fileName ?? null,
        componentName: componentName ?? null,
        found: Boolean(source),
      };
    } catch {
      return { filePath: null, componentName: null, found: false };
    }
  },
};

const locatorjsResolver: Resolver = {
  name: "locatorjs",
  resolve: async (el) => {
    try {
      const { getElementInfo } = await import("@locator/runtime/adapters");
      const info = getElementInfo(el, "react");

      if (!info?.thisElement?.link) {
        return { filePath: null, componentName: null, found: false };
      }

      return {
        filePath: info.thisElement.link.filePath ?? null,
        componentName: info.thisElement.label ?? null,
        found: Boolean(info.thisElement.link.filePath),
      };
    } catch {
      return { filePath: null, componentName: null, found: false };
    }
  },
};

const instrucktResolver: Resolver = {
  name: "instruckt",
  resolve: async (el) => {
    try {
      const { resolveSource, resolveComponentName } = await import("element-source");
      const source = await resolveSource(el);
      const componentName = await resolveComponentName(el);

      return {
        filePath: source?.filePath ?? null,
        componentName: componentName ?? null,
        found: Boolean(source?.filePath),
      };
    } catch {
      return { filePath: null, componentName: null, found: false };
    }
  },
};

interface BenchAPI {
  resolvers: Map<string, Resolver>;
  register: (r: Resolver) => void;
  unregister: (name: string) => void;
  resolve: (
    el: HTMLElement,
    resolverName?: string,
  ) => Promise<Record<string, SourceResult>>;
  resolveAll: (
    testId: string,
  ) => Promise<Record<string, SourceResult & { ms: number }>>;
  identify: (
    el: HTMLElement,
  ) => Record<string, ReturnType<NonNullable<Resolver["identify"]>>>;
  list: () => string[];
  prod: {
    identifyElementWithReact: typeof identifyElementWithReact;
    detectSourceFile: typeof detectSourceFile;
    getReactComponentName: typeof getReactComponentName;
    generateOutput: typeof generateOutput;
    getElementPath: typeof getElementPath;
    getElementClasses: typeof getElementClasses;
    getNearbyText: typeof getNearbyText;
    getSourceLocation: typeof getSourceLocation;
    getNearbyElements: typeof getNearbyElements;
    getFullElementPath: typeof getFullElementPath;
    getAccessibilityInfo: typeof getAccessibilityInfo;
    getForensicComputedStyles: typeof getForensicComputedStyles;
    getDetailedComputedStyles: typeof getDetailedComputedStyles;
  };
  formatInstrucktMarkdown: typeof formatAnnotationMarkdown;
  buildInstrucktClipboard: (element: HTMLElement, pathname: string) => Promise<string | null>;
}

const createBenchAPI = (): BenchAPI => {
  const resolvers = new Map<string, Resolver>();

  const api: BenchAPI = {
    resolvers,

    register(r) {
      resolvers.set(r.name, r);
    },

    unregister(name) {
      resolvers.delete(name);
    },

    async resolve(el, resolverName) {
      const results: Record<string, SourceResult> = {};
      const targets = resolverName
        ? [resolvers.get(resolverName)].filter(Boolean)
        : [...resolvers.values()];

      for (const r of targets) {
        if (!r) continue;
        try {
          results[r.name] = await r.resolve(el);
        } catch {
          results[r.name] = {
            filePath: null,
            componentName: null,
            found: false,
          };
        }
      }
      return results;
    },

    async resolveAll(testId) {
      const el = document.querySelector(
        `[data-testid="${testId}"]`,
      ) as HTMLElement | null;
      if (!el) return {};

      const results: Record<string, SourceResult & { ms: number }> = {};
      for (const r of resolvers.values()) {
        const start = performance.now();
        try {
          const res = await r.resolve(el);
          results[r.name] = { ...res, ms: performance.now() - start };
        } catch {
          results[r.name] = {
            filePath: null,
            componentName: null,
            found: false,
            ms: performance.now() - start,
          };
        }
      }
      return results;
    },

    identify(el) {
      const results: Record<
        string,
        ReturnType<NonNullable<Resolver["identify"]>>
      > = {};
      for (const r of resolvers.values()) {
        results[r.name] = r.identify?.(el) ?? null;
      }
      return results;
    },

    list: () => [...resolvers.keys()],

    prod: {
      identifyElementWithReact,
      detectSourceFile,
      getReactComponentName,
      generateOutput,
      getElementPath,
      getElementClasses,
      getNearbyText,
      getSourceLocation,
      getNearbyElements,
      getFullElementPath,
      getAccessibilityInfo,
      getForensicComputedStyles,
      getDetailedComputedStyles,
    },

    formatInstrucktMarkdown: formatAnnotationMarkdown,

    buildInstrucktClipboard: async (element: HTMLElement, pathname: string): Promise<string | null> => {
      try {
        const { resolveElementInfo } = await import("element-source");
        const elementInfo = await resolveElementInfo(element);
        if (!elementInfo?.source) return null;

        const stack = elementInfo.stack.map((frame: { filePath: string; lineNumber: number | null; columnNumber: number | null; componentName: string | null }) => ({
          filePath: frame.filePath,
          lineNumber: frame.lineNumber,
          columnNumber: frame.columnNumber,
          componentName: frame.componentName,
        }));

        const annotation = {
          id: "bench-probe",
          element: element.localName,
          comment: "identify this component",
          cssClasses: element.className?.trim() ?? "",
          nearbyText: element.innerText?.trim().slice(0, 100) ?? "",
          status: "pending",
          framework: {
            framework: "react",
            component: elementInfo.componentName ?? "Component",
            source_file: elementInfo.source.filePath,
            source_line: elementInfo.source.lineNumber ?? undefined,
            source_column: elementInfo.source.columnNumber ?? undefined,
            component_stack: stack.length > 0 ? stack : undefined,
          },
        };

        return formatAnnotationMarkdown([annotation] as Parameters<typeof formatAnnotationMarkdown>[0], pathname);
      } catch {
        return null;
      }
    },
  };

  api.register(reactGrabResolver);
  api.register(agentationResolver);
  api.register(cursorBrowserResolver);
  api.register(clickToComponentResolver);
  api.register(locatorjsResolver);
  api.register(instrucktResolver);

  return api;
};

const buildAnnotation = (
  api: any,
  element: HTMLElement,
  selectedText: string,
) => {
  const identity = api.identifyElementWithReact(element);
  const rect = element.getBoundingClientRect();
  return {
    element: identity.name,
    elementPath: identity.path,
    reactComponents: identity.reactComponents ?? undefined,
    sourceFile: undefined as string | undefined,
    nearbyText: api.getNearbyText?.(element),
    cssClasses: api.getElementClasses?.(element),
    nearbyElements: api.getNearbyElements?.(element),
    fullPath: api.getFullElementPath?.(element),
    accessibility: api.getAccessibilityInfo?.(element),
    computedStyles: api.getForensicComputedStyles?.(element),
    computedStylesObj: api.getDetailedComputedStyles?.(element),
    selectedText: selectedText || undefined,
    boundingBox: {
      x: rect.left,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height,
    },
    comment: "identify this component",
    x: 50,
    y: rect.top + window.scrollY,
  };
};

const ISOLATE_RESOLVER_LOADERS: Record<
  string,
  () => Promise<{ default: { createResolver: () => Resolver } }>
> = {
  "react-grab": () => import("../isolates/react-grab"),
  agentation: () => import("../isolates/agentation"),
  "cursor-browser": () => import("../isolates/cursor-browser"),
  "click-to-component": () => import("../isolates/click-to-react-component"),
  locatorjs: () => import("../isolates/locatorjs"),
  instruckt: () => import("../isolates/instruckt"),
};

const useBenchHarness = () => {
  useEffect(() => {
    const api = createBenchAPI();
    (window as any).__BENCH__ = api;
    (window as any).__BENCH_BUILD_ANNOTATION__ = buildAnnotation;

    const activeIsolateName = process.env.NEXT_PUBLIC_BENCH_ISOLATE;
    if (activeIsolateName && ISOLATE_RESOLVER_LOADERS[activeIsolateName]) {
      ISOLATE_RESOLVER_LOADERS[activeIsolateName]().then((isolateModule) => {
        api.register(isolateModule.default.createResolver());
      });
    }

    return () => {
      delete (window as any).__BENCH__;
      delete (window as any).__BENCH_BUILD_ANNOTATION__;
    };
  }, []);
};

export const BenchHarness = () => {
  useBenchHarness();
  return <Agentation />;
};
