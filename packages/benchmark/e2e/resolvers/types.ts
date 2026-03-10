import type { TestEntry } from "../test-cases/types";

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

interface CliResult {
  filePath: string | null;
  componentName: string | null;
  ms: number;
}

interface PromptStrategy {
  name: string;
  buildPrompt: (entry: TestEntry, context: ElementContext) => string;
}

interface CliBackend {
  name: string;
  model: string;
  runOnce: (prompt: string, expectedFilePath?: string) => Promise<CliResult>;
}

interface CliResolver {
  name: string;
  backend: string;
  buildPrompt: (entry: TestEntry, context: ElementContext) => string;
  run: (prompt: string, expectedFilePath?: string) => Promise<CliResult>;
}

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

export { EMPTY_ELEMENT_CONTEXT };
export type {
  ElementContext,
  CliResult,
  PromptStrategy,
  CliBackend,
  CliResolver,
};
