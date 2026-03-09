import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/server/server-feature-item.tsx",
  componentName: "ServerFeatureItem",
  description:
    "Server component list item at 3 levels deep (ServerHero → ServerFeatureList → ServerFeatureItem)",
  lazyDescription: "the first feature list item",
};

export default testCase;
