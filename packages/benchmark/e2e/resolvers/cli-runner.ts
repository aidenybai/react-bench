import { spawn } from "child_process";
import { join } from "path";

const CLI_MODEL = process.env.BENCH_MODEL ?? "claude-sonnet-4-6";
const CLI_TIMEOUT_MS = 180_000;
const CWD = join(__dirname, "..", "..");
const MAX_RETRIES = 1;
const CLI_CONCURRENCY = parseInt(process.env.BENCH_CONCURRENCY ?? "10", 10);

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

const CLI_FLAGS = [
  `-p`,
  `--output-format stream-json`,
  `--tools "Read,Grep,Glob,Bash"`,
  `--json-schema '${SCHEMA}'`,
  CLI_MODEL ? `--model ${CLI_MODEL}` : "",
]
  .filter(Boolean)
  .join(" ");

interface CliResult {
  filePath: string | null;
  componentName: string | null;
  ms: number;
}

const parseStructuredOutput = (
  stdout: string,
): { filePath: string | null; componentName: string | null } => {
  const lines = stdout.split("\n").filter(Boolean);
  for (let lineIndex = lines.length - 1; lineIndex >= 0; lineIndex--) {
    try {
      const parsed = JSON.parse(lines[lineIndex]);
      if (parsed.structured_output) {
        return {
          filePath: parsed.structured_output.filePath ?? null,
          componentName: parsed.structured_output.componentName ?? null,
        };
      }
      if (parsed.type === "result" && parsed.subtype === "success") {
        return {
          filePath: parsed.structured_output?.filePath ?? null,
          componentName: parsed.structured_output?.componentName ?? null,
        };
      }
    } catch {
      continue;
    }
  }
  return { filePath: null, componentName: null };
};

const runCliOnce = (
  prompt: string,
  expectedFilePath?: string,
): Promise<CliResult> =>
  new Promise((resolve) => {
    const start = performance.now();
    const command = `echo "" | claude ${CLI_FLAGS} -- ${JSON.stringify(prompt)}`;
    const child = spawn("sh", ["-c", command], {
      cwd: CWD,
      env: { ...process.env, FORCE_COLOR: "0", CLAUDECODE: "" },
    });

    let stdout = "";
    let didResolve = false;

    const resolveOnce = (result: CliResult): void => {
      if (didResolve) return;
      didResolve = true;
      resolve(result);
    };

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();

      if (expectedFilePath && !didResolve && stdout.includes(expectedFilePath)) {
        child.kill();
        resolveOnce({
          filePath: expectedFilePath,
          componentName: null,
          ms: performance.now() - start,
        });
      }
    });

    child.on("close", () => {
      if (didResolve) return;
      const elapsedMs = performance.now() - start;
      const { filePath, componentName } = parseStructuredOutput(stdout);
      resolveOnce({ filePath, componentName, ms: elapsedMs });
    });

    child.on("error", () => {
      resolveOnce({
        filePath: null,
        componentName: null,
        ms: performance.now() - start,
      });
    });

    setTimeout(() => {
      if (!didResolve) child.kill();
    }, CLI_TIMEOUT_MS);
  });

const runCli = async (
  prompt: string,
  expectedFilePath?: string,
): Promise<CliResult> => {
  const result = await runCliOnce(prompt, expectedFilePath);
  if (result.filePath) return result;

  for (let retry = 0; retry < MAX_RETRIES; retry++) {
    const retryPrompt = `${prompt}\n\nIMPORTANT: You didn't find the file yet. Keep searching — read more files, try different directory patterns. The file definitely exists in this codebase.`;
    const retryResult = await runCliOnce(retryPrompt, expectedFilePath);
    if (retryResult.filePath) {
      return { ...retryResult, ms: result.ms + retryResult.ms };
    }
  }
  return result;
};

const pool = async <T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> => {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < tasks.length) {
      const taskIndex = nextIndex++;
      results[taskIndex] = await tasks[taskIndex]();
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()),
  );
  return results;
};

export { runCli, pool, CLI_CONCURRENCY, CLI_MODEL };
export type { CliResult };
