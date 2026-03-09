import type { CliResolver } from "./types";
import { buildUserPrompt } from "./claude-code";

const agentationClaude: CliResolver = {
  name: "agentation+claude",
  buildPrompt: (entry, context) => {
    const basePrompt = buildUserPrompt(entry);
    if (!context.agentationClipboard) return basePrompt;
    return `${basePrompt}\n\n${context.agentationClipboard}`;
  },
};

export default agentationClaude;
