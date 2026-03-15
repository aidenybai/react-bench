import type { TestEntry } from "../test-cases/types";
import type { ElementContext, PromptStrategy } from "./types";

const buildUserPrompt = (entry: TestEntry): string =>
  `I need to find the source file for a React component in this Next.js app. ${entry.description}. Where is it defined?`;

const withClipboard = (
  name: string,
  clipboardKey: keyof ElementContext,
): PromptStrategy => ({
  name,
  buildPrompt: (entry, context) => {
    const basePrompt = buildUserPrompt(entry);
    const clipboard = context[clipboardKey];
    if (!clipboard) return basePrompt;
    return `${basePrompt}\n\n${clipboard}`;
  },
});

const PROMPT_STRATEGIES: PromptStrategy[] = [
  { name: "code", buildPrompt: buildUserPrompt },
  withClipboard("agentation", "agentationClipboard"),
  withClipboard("react-grab", "reactGrabClipboard"),
  withClipboard("cursor-browser", "cursorBrowserClipboard"),
  withClipboard("click-to-component", "clickToComponentClipboard"),
  withClipboard("locatorjs", "locatorjsClipboard"),
  withClipboard("instruckt", "instrucktClipboard"),
];

export { PROMPT_STRATEGIES };
