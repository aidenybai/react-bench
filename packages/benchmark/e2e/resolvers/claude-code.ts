import type { TestEntry } from "../test-cases/types";
import type { CliResolver } from "./types";

const buildUserPrompt = (entry: TestEntry): string =>
  `I need to find the source file for a React component in this Next.js app. ${entry.description}. Where is it defined?`;

const claudeCode: CliResolver = {
  name: "claude-code",
  buildPrompt: (entry) => buildUserPrompt(entry),
};

export default claudeCode;
export { buildUserPrompt };
