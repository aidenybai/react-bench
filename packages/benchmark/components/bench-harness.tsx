"use client";

import { useEffect } from "react";
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
import {
  identifyElementWithReact as identifyElementWithReactImproved,
  detectSourceFile as detectSourceFileImproved,
  getReactComponentName as getReactComponentNameImproved,
  generateOutput as generateOutputImproved,
  identifyElement as identifyElementImproved,
  getElementPath as getElementPathImproved,
  getElementClasses as getElementClassesImproved,
  getNearbyText as getNearbyTextImproved,
  getNearbyElements as getNearbyElementsImproved,
  getFullElementPath as getFullElementPathImproved,
  getAccessibilityInfo as getAccessibilityInfoImproved,
  getForensicComputedStyles as getForensicComputedStylesImproved,
  getDetailedComputedStyles as getDetailedComputedStylesImproved,
} from "agentation-improved";

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

const agentationImprovedResolver: Resolver = {
  name: "agentation-improved",
  resolve: async (el) => {
    const sourceFile = await detectSourceFileImproved(el);
    const react = getReactComponentNameImproved(el);
    return {
      filePath: sourceFile ?? null,
      componentName: react.components[0] ?? null,
      found: Boolean(sourceFile),
    };
  },
  identify: (el) => identifyElementImproved(el),
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
  };
  improved: {
    identifyElementWithReact: typeof identifyElementWithReactImproved;
    detectSourceFile: typeof detectSourceFileImproved;
    getReactComponentName: typeof getReactComponentNameImproved;
    generateOutput: typeof generateOutputImproved;
    getElementPath: typeof getElementPathImproved;
    getElementClasses: typeof getElementClassesImproved;
  };
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

    improved: {
      identifyElementWithReact: identifyElementWithReactImproved,
      detectSourceFile: detectSourceFileImproved,
      getReactComponentName: getReactComponentNameImproved,
      generateOutput: generateOutputImproved,
      getElementPath: getElementPathImproved,
      getElementClasses: getElementClassesImproved,
      getNearbyText: getNearbyTextImproved,
      getNearbyElements: getNearbyElementsImproved,
      getFullElementPath: getFullElementPathImproved,
      getAccessibilityInfo: getAccessibilityInfoImproved,
      getForensicComputedStyles: getForensicComputedStylesImproved,
      getDetailedComputedStyles: getDetailedComputedStylesImproved,
    },
  };

  api.register(reactGrabResolver);
  api.register(agentationResolver);
  api.register(agentationImprovedResolver);
  api.register(cursorBrowserResolver);

  return api;
};

const buildAnnotation = (api: any, element: HTMLElement, selectedText: string) => {
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
    boundingBox: { x: rect.left, y: rect.top + window.scrollY, width: rect.width, height: rect.height },
    comment: "identify this component",
    x: 50,
    y: rect.top + window.scrollY,
  };
};

const useBenchHarness = () => {
  useEffect(() => {
    (window as any).__BENCH__ = createBenchAPI();
    (window as any).__BENCH_BUILD_ANNOTATION__ = buildAnnotation;
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
