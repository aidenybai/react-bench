import { spawn } from "child_process";
import type { CliResult } from "./types";

const DEFAULT_TIMEOUT_MS = 180_000;
const MAX_RETRIES = 1;

interface StreamingResult {
  stdout: string;
  ms: number;
  bootMs: number;
  earlyAborted: boolean;
}

const FILE_READ_COMMANDS = ["cat ", "head ", "tail ", "nl ", "sed "];

const containsFileAccess = (
  stdout: string,
  expectedFilePath: string,
): boolean => {
  const lines = stdout.split("\n").filter(Boolean);
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);

      if (parsed.type === "assistant" && parsed.message?.content) {
        for (const block of parsed.message.content) {
          if (block.type !== "tool_use") continue;

          if (block.name === "Read" || block.name === "Grep") {
            const inputPath =
              block.input?.file_path ?? block.input?.path ?? "";
            if (inputPath.includes(expectedFilePath)) return true;
          }
        }
      }

      if (parsed.type === "item.started" || parsed.type === "item.completed") {
        const item = parsed.item;
        if (
          item?.type === "command_execution" &&
          typeof item.command === "string" &&
          item.command.includes(expectedFilePath) &&
          FILE_READ_COMMANDS.some((readCommand) =>
            item.command.includes(readCommand),
          )
        ) {
          return true;
        }
      }
    } catch {
      continue;
    }
  }
  return false;
};

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
    let firstChunkAt = 0;

    const resolveOnce = (result: StreamingResult): void => {
      if (didResolve) return;
      didResolve = true;
      resolve(result);
    };

    child.stdout.on("data", (chunk: Buffer) => {
      if (!firstChunkAt) firstChunkAt = performance.now();
      stdout += chunk.toString();

      if (
        expectedFilePath &&
        !didResolve &&
        containsFileAccess(stdout, expectedFilePath)
      ) {
        child.kill();
        const now = performance.now();
        resolveOnce({
          stdout,
          ms: now - start,
          bootMs: firstChunkAt - start,
          earlyAborted: true,
        });
      }
    });

    child.on("close", () => {
      const now = performance.now();
      resolveOnce({
        stdout,
        ms: now - start,
        bootMs: firstChunkAt ? firstChunkAt - start : now - start,
        earlyAborted: false,
      });
    });

    child.on("error", () => {
      const now = performance.now();
      resolveOnce({
        stdout,
        ms: now - start,
        bootMs: firstChunkAt ? firstChunkAt - start : now - start,
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
    const retryPrompt = `${prompt}\n\nIMPORTANT: You must find and READ the actual source file. The component definitely exists in this codebase. Try searching with different patterns, then READ the file you find.`;
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
