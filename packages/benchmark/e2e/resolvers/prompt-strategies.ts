import type { TestEntry } from "../test-cases/types";
import type { PromptStrategy } from "./types";

const buildUserPrompt = (entry: TestEntry): string =>
  `I need to find the source file for a React component in this Next.js app. ${entry.description}. Where is it defined?`;

const PROMPT_STRATEGIES: PromptStrategy[] = [
  {
    name: "code",
    buildPrompt: buildUserPrompt,
  },
  {
    name: "agentation",
    buildPrompt: (entry, context) => {
      const basePrompt = buildUserPrompt(entry);
      if (!context.agentationClipboard) return basePrompt;
      return `${basePrompt}\n\n${context.agentationClipboard}`;
    },
  },
  {
    name: "react-grab",
    buildPrompt: (entry, context) => {
      const basePrompt = buildUserPrompt(entry);
      if (!context.reactGrabClipboard) return basePrompt;
      return `${basePrompt}\n\n${context.reactGrabClipboard}`;
    },
  },
  {
    name: "cursor-browser",
    buildPrompt: (entry, context) => {
      const basePrompt = buildUserPrompt(entry);
      if (!context.cursorBrowserClipboard) return basePrompt;
      return `${basePrompt}\n\n${context.cursorBrowserClipboard}`;
    },
  },
];

export { PROMPT_STRATEGIES };
