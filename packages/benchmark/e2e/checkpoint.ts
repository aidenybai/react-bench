import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { TestEntry } from "./test-cases/types";
import type { AgentResult, ElementContext } from "./resolvers/types";

const CHECKPOINT_PATH = join(__dirname, "..", "e2e", "bench-checkpoint.json");

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
  elementContext: ElementContext;
  error?: string;
}

interface Checkpoint {
  browserCollected: BrowserCollected[];
  agentCompleted: Record<string, AgentResult>;
}

const saveCheckpoint = (checkpoint: Checkpoint): void => {
  writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint));
};

const loadCheckpoint = (): Checkpoint | null => {
  if (!existsSync(CHECKPOINT_PATH)) return null;
  try {
    return JSON.parse(readFileSync(CHECKPOINT_PATH, "utf-8"));
  } catch {
    return null;
  }
};

export { saveCheckpoint, loadCheckpoint };
export type { BrowserCollected, Checkpoint };
