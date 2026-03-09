import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/challenge/the-gauntlet.tsx",
  componentName: "TheGauntlet",
  description:
    "The Gauntlet: ~25 Fiber layers (providers -> HOCs -> styled -> motion -> fragments -> suspense -> Radix portal -> button)",
  lazyDescription: "the gauntlet button",
};

export default testCase;
