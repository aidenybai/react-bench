import { spawn } from "child_process";
import type { CliResult } from "./types";

const DEFAULT_TIMEOUT_MS = 180_000;
const MAX_RETRIES = 1;

const TARGET_FILE_PREAMBLE =
  "Output the file path you believe is correct in <target_file>path/to/file.tsx</target_file> tags.";

interface StreamingResult {
  stdout: string;
  ms: number;
  bootMs: number;
  targetFile: string | null;
}

const TARGET_FILE_REGEX = /<target_file>(.*?)<\\?\/target_file>/;

const extractTargetFile = (stdout: string): string | null => {
  const match = stdout.match(TARGET_FILE_REGEX);
  return match?.[1]?.trim() ?? null;
};

const runStreamingCommand = (
  command: string,
  cwd: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<StreamingResult> =>
  new Promise((resolve) => {
    const start = performance.now();
    const child = spawn("sh", ["-c", command], {
      cwd,
      env: { ...process.env, FORCE_COLOR: "0" },
    });

    let stdout = "";
    let didResolve = false;
    let firstChunkAt = 0;

    const resolveOnce = (result: StreamingResult): void => {
      if (didResolve) return;
      didResolve = true;
      resolve(result);
    };

    const elapsed = (): number => performance.now() - start;
    const bootMs = (): number =>
      firstChunkAt ? firstChunkAt - start : elapsed();

    child.stdout.on("data", (chunk: Buffer) => {
      if (!firstChunkAt) firstChunkAt = performance.now();
      stdout += chunk.toString();

      const targetFile = extractTargetFile(stdout);
      if (!didResolve && targetFile) {
        child.kill();
        resolveOnce({
          stdout,
          ms: elapsed(),
          bootMs: bootMs(),
          targetFile,
        });
      }
    });

    child.on("close", () => {
      resolveOnce({
        stdout,
        ms: elapsed(),
        bootMs: bootMs(),
        targetFile: extractTargetFile(stdout),
      });
    });

    child.on("error", () => {
      resolveOnce({
        stdout,
        ms: elapsed(),
        bootMs: bootMs(),
        targetFile: extractTargetFile(stdout),
      });
    });

    setTimeout(() => {
      if (!didResolve) child.kill();
    }, timeoutMs);
  });

const runWithRetries = async (
  runOnce: (prompt: string) => Promise<CliResult>,
  prompt: string,
): Promise<CliResult> => {
  const result = await runOnce(prompt);
  if (result.filePath) return result;

  for (let retry = 0; retry < MAX_RETRIES; retry++) {
    const retryPrompt = `${prompt}\n\nIMPORTANT: You must find and READ the actual source file. The component definitely exists in this codebase. Try searching with different patterns, then READ the file you find.`;
    const retryResult = await runOnce(retryPrompt);
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

export { runStreamingCommand, runWithRetries, pool, TARGET_FILE_PREAMBLE };
export type { StreamingResult };
