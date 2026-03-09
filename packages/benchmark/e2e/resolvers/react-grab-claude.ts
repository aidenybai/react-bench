import type { CliResolver } from "./types";
import { buildUserPrompt } from "./claude-code";

const reactGrabClaude: CliResolver = {
  name: "react-grab+claude",
  buildPrompt: (entry, context) => {
    const basePrompt = buildUserPrompt(entry);
    if (!context.reactGrabClipboard) return basePrompt;
    return `${basePrompt}\n\n${context.reactGrabClipboard}`;
  },
};

export default reactGrabClaude;
