import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/challenge/portal-inception.tsx",
  componentName: "PortalInception",
  description:
    "Portal Inception: Radix Dialog -> Radix Popover -> createPortal -> styled badge (DOM parent chain unrelated to React tree)",
  lazyDescription: "that badge in the nested portals",
};

export default testCase;
