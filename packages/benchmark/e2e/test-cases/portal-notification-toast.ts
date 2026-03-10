import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/portals/notification-portal.tsx",
  componentName: "_NotificationToast",
  description:
    "A notification toast rendered via createPortal with an underscored internal name, exported under a clean public name",
  lazyDescription: "the toast in the corner",
};

export default testCase;
