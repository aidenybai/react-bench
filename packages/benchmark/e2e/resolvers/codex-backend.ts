import { join } from "path";
import type { CliBackend, CliResult } from "./types";
import { runStreamingCommand } from "./streaming-runner";

const MODEL = process.env.BENCH_CODEX_MODEL;
const TIMEOUT_MS = 180_000;
const CWD = join(__dirname, "..", "..");
const SCHEMA_PATH = join(__dirname, "codex-schema.json");

const FLAGS = [
  `--sandbox read-only`,
  `--json`,
  `--output-schema ${SCHEMA_PATH}`,
  MODEL ? `--model ${MODEL}` : "",
]
  .filter(Boolean)
  .join(" ");

const tryParseJson = (text: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const parseOutput = (
  stdout: string,
): { filePath: string | null; componentName: string | null } => {
  const lines = stdout.split("\n").filter(Boolean);
  for (let lineIndex = lines.length - 1; lineIndex >= 0; lineIndex--) {
    const parsed = tryParseJson(lines[lineIndex]);
    if (!parsed) continue;

    if (parsed.type === "item.completed") {
      const item = parsed.item as Record<string, unknown> | undefined;
      if (item?.type === "agent_message" && typeof item.text === "string") {
        const structured = tryParseJson(item.text);
        if (structured?.filePath) {
          return {
            filePath: structured.filePath as string,
            componentName: (structured.componentName as string) ?? null,
          };
        }
      }
    }
  }
  return { filePath: null, componentName: null };
};

const runOnce = async (
  prompt: string,
  expectedFilePath?: string,
): Promise<CliResult> => {
  const command = `codex exec ${FLAGS} ${JSON.stringify(prompt)}`;
  const result = await runStreamingCommand(
    command,
    CWD,
    expectedFilePath,
    TIMEOUT_MS,
  );

  const reasoningMs = result.ms - result.bootMs;

  if (result.earlyAborted) {
    return {
      filePath: expectedFilePath!,
      componentName: null,
      ms: reasoningMs,
      earlyAborted: true,
    };
  }

  const { filePath, componentName } = parseOutput(result.stdout);
  return { filePath, componentName, ms: reasoningMs, earlyAborted: false };
};

const codexBackend: CliBackend = {
  name: "codex",
  model: MODEL ?? "default",
  runOnce,
};

export default codexBackend;
