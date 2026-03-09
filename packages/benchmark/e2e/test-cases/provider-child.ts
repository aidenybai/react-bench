import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "app/page.tsx",
  componentName: "BenchmarkPage",
  description:
    "Simple div rendered inside 6 providers",
  lazyDescription: "the main page content that says 'Content rendered inside 6 providers'",
};

export default testCase;
