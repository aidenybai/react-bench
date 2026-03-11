import { join } from "path";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { AgentBackend, AgentResult } from "./types";

const MODEL = process.env.BENCH_MODEL ?? "claude-sonnet-4-6";
const CWD = join(__dirname, "..", "..");

const ALLOWED_TOOLS = ["Read", "Grep", "Glob", "Bash"];

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    filePath: {
      type: "string",
      description: "Relative path e.g. components/styled/styled-card.tsx",
    },
    componentName: { type: "string" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
  required: ["filePath", "componentName", "confidence"],
};

const parseStructuredOutput = (
  output: unknown,
): { filePath: string | null; componentName: string | null } => {
  if (!output || typeof output !== "object") {
    return { filePath: null, componentName: null };
  }
  const record = output as Record<string, unknown>;
  return {
    filePath: typeof record.filePath === "string" ? record.filePath : null,
    componentName:
      typeof record.componentName === "string" ? record.componentName : null,
  };
};

const runOnce = async (prompt: string): Promise<AgentResult> => {
  const start = performance.now();

  let filePath: string | null = null;
  let componentName: string | null = null;

  try {
    for await (const message of query({
      prompt,
      options: {
        model: MODEL,
        cwd: CWD,
        allowedTools: ALLOWED_TOOLS,
        permissionMode: "dontAsk",
        persistSession: false,
        outputFormat: {
          type: "json_schema",
          schema: OUTPUT_SCHEMA,
        },
      },
    })) {
      if (message.type === "result" && message.subtype === "success") {
        ({ filePath, componentName } = parseStructuredOutput(
          message.structured_output,
        ));
      }
    }
  } catch {
    // HACK: SDK subprocess can die on network errors — return partial result
  }

  return {
    filePath,
    componentName,
    ms: performance.now() - start,
  };
};

const claudeBackend: AgentBackend = {
  name: "claude",
  model: MODEL,
  runOnce,
};

export default claudeBackend;
