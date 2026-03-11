import type { AgentResult } from "./types";

const MAX_RETRIES = 1;

const runWithRetries = async (
  runOnce: (prompt: string) => Promise<AgentResult>,
  prompt: string,
): Promise<AgentResult> => {
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

export { runWithRetries, pool };
