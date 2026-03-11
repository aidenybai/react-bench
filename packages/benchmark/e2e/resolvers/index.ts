import claudeBackend from "./claude-backend";
import { PROMPT_STRATEGIES } from "./prompt-strategies";
import { runWithRetries } from "./task-runner";
import type { AgentBackend, AgentResolver } from "./types";

const BACKENDS: AgentBackend[] = [claudeBackend];

const resolverName = (strategy: string, backend: string): string => {
  if (strategy === "code")
    return backend === "claude" ? "claude-code" : backend;
  return `${strategy}+${backend}`;
};

const AGENT_RESOLVERS: AgentResolver[] = BACKENDS.flatMap((backend) =>
  PROMPT_STRATEGIES.map((strategy) => ({
    name: resolverName(strategy.name, backend.name),
    backend: backend.name,
    buildPrompt: strategy.buildPrompt,
    run: (prompt: string) => runWithRetries(backend.runOnce, prompt),
  })),
);

const AGENT_CONCURRENCY = parseInt(process.env.BENCH_CONCURRENCY ?? "20", 10);

export { AGENT_RESOLVERS, BACKENDS, AGENT_CONCURRENCY };
export { pool } from "./task-runner";
export { EMPTY_ELEMENT_CONTEXT } from "./types";
export type { AgentResolver, ElementContext, AgentResult } from "./types";
