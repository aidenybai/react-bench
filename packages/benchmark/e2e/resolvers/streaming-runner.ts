import { spawn } from "child_process";
import type { CliResult } from "./types";

const DEFAULT_TIMEOUT_MS = 180_000;
const MAX_RETRIES = 1;

interface StreamingResult {
  stdout: string;
  ms: number;
  earlyAborted: boolean;
}

const runStreamingCommand = (
  command: string,
  cwd: string,
  expectedFilePath?: string,
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

    const resolveOnce = (result: StreamingResult): void => {
      if (didResolve) return;
      didResolve = true;
      resolve(result);
    };

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();

      if (
        expectedFilePath &&
        !didResolve &&
        stdout.includes(expectedFilePath)
      ) {
        child.kill();
        resolveOnce({
          stdout,
          ms: performance.now() - start,
          earlyAborted: true,
        });
      }
    });

    child.on("close", () => {
      resolveOnce({
        stdout,
        ms: performance.now() - start,
        earlyAborted: false,
      });
    });

    child.on("error", () => {
      resolveOnce({
        stdout,
        ms: performance.now() - start,
        earlyAborted: false,
      });
    });

    setTimeout(() => {
      if (!didResolve) child.kill();
    }, timeoutMs);
  });

const runWithRetries = async (
  runOnce: (prompt: string, expectedFilePath?: string) => Promise<CliResult>,
  prompt: string,
  expectedFilePath?: string,
): Promise<CliResult> => {
  const result = await runOnce(prompt, expectedFilePath);
  if (result.filePath) return result;

  for (let retry = 0; retry < MAX_RETRIES; retry++) {
    const retryPrompt = `${prompt}\n\nIMPORTANT: You didn't find the file yet. Keep searching — read more files, try different directory patterns. The file definitely exists in this codebase.`;
    const retryResult = await runOnce(retryPrompt, expectedFilePath);
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

export { runStreamingCommand, runWithRetries, pool };
export type { StreamingResult };
