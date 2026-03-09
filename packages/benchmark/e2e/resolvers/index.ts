import baseline from "./baseline";
import claudeCode from "./claude-code";
import agentationClaude from "./agentation-claude";
import reactGrabClaude from "./react-grab-claude";
import type { CliResolver } from "./types";

const CLI_RESOLVERS: CliResolver[] = [
  baseline,
  claudeCode,
  agentationClaude,
  reactGrabClaude,
];

export { CLI_RESOLVERS };
export { runCli, pool, CLI_CONCURRENCY, CLI_MODEL } from "./cli-runner";
export { EMPTY_ELEMENT_CONTEXT } from "./types";
export type { CliResolver, ElementContext } from "./types";
export type { CliResult } from "./cli-runner";
