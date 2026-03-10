import { join } from "path";
import type { CliBackend, CliResult } from "./types";
import { runStreamingCommand, TARGET_FILE_PREAMBLE } from "./streaming-runner";

const MODEL = process.env.BENCH_MODEL ?? "claude-sonnet-4-6";
const TIMEOUT_MS = 180_000;
const CWD = join(__dirname, "..", "..");

const SCHEMA = JSON.stringify({
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
});

const FLAGS = [
  `-p`,
  `--verbose`,
  `--output-format stream-json`,
  `--tools "Read,Grep,Glob,Bash"`,
  `--json-schema '${SCHEMA}'`,
  `--model ${MODEL}`,
].join(" ");

const parseOutput = (
  stdout: string,
): { filePath: string | null; componentName: string | null } => {
  const lines = stdout.split("\n").filter(Boolean);
  for (let lineIndex = lines.length - 1; lineIndex >= 0; lineIndex--) {
    try {
      const parsed = JSON.parse(lines[lineIndex]);
      const structured = parsed.structured_output;
      if (structured) {
        return {
          filePath: structured.filePath ?? null,
          componentName: structured.componentName ?? null,
        };
      }
    } catch {
      continue;
    }
  }
  return { filePath: null, componentName: null };
};

const runOnce = async (prompt: string): Promise<CliResult> => {
  const promptWithPreamble = `${TARGET_FILE_PREAMBLE}\n\n${prompt}`;
  const command = `echo "" | claude ${FLAGS} -- ${JSON.stringify(promptWithPreamble)}`;
  const result = await runStreamingCommand(command, CWD, TIMEOUT_MS);

  if (result.targetFile) {
    return {
      filePath: result.targetFile,
      componentName: null,
      ms: result.ms,
    };
  }

  const { filePath, componentName } = parseOutput(result.stdout);
  return { filePath, componentName, ms: result.ms };
};

const claudeBackend: CliBackend = {
  name: "claude",
  model: MODEL,
  runOnce,
};

export default claudeBackend;
