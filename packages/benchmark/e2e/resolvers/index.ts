import claudeBackend from "./claude-backend";
// import codexBackend from "./codex-backend";
import { PROMPT_STRATEGIES } from "./prompt-strategies";
import { runWithRetries } from "./streaming-runner";
import type { CliBackend, CliResolver } from "./types";

const BACKENDS: CliBackend[] = [claudeBackend];

const resolverName = (strategy: string, backend: string): string => {
  if (strategy === "code") return backend === "claude" ? "claude-code" : backend;
  return `${strategy}+${backend}`;
};

const CLI_RESOLVERS: CliResolver[] = BACKENDS.flatMap((backend) =>
  PROMPT_STRATEGIES.map((strategy) => ({
    name: resolverName(strategy.name, backend.name),
    backend: backend.name,
    buildPrompt: strategy.buildPrompt,
    run: (prompt: string) => runWithRetries(backend.runOnce, prompt),
  })),
);

const CLI_CONCURRENCY = parseInt(process.env.BENCH_CONCURRENCY ?? "20", 10);

export { CLI_RESOLVERS, BACKENDS, CLI_CONCURRENCY };
export { pool } from "./streaming-runner";
export { EMPTY_ELEMENT_CONTEXT } from "./types";
export type { CliResolver, ElementContext, CliResult } from "./types";
