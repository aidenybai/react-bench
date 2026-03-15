import type { IsolateDefinition } from "./types";
import { BASE_ISOLATE_PORT } from "./constants";

const locatorjsIsolate: IsolateDefinition = {
  name: "locatorjs",
  port: BASE_ISOLATE_PORT + 4,
  description: "LocatorJS runtime-only — walks React fiber tree via adapter without Babel plugin",
  dependencies: ["@locator/runtime"],

  configureNext: (baseConfig) => baseConfig,

  createResolver: () => ({
    name: "locatorjs",
    resolve: async (element) => {
      try {
        const { getElementInfo } = await import("@locator/runtime/adapters");
        const info = getElementInfo(element, "react");

        if (!info?.thisElement?.link) {
          return { filePath: null, componentName: null, found: false };
        }

        return {
          filePath: info.thisElement.link.filePath ?? null,
          componentName: info.thisElement.label ?? null,
          found: Boolean(info.thisElement.link.filePath),
        };
      } catch {
        return { filePath: null, componentName: null, found: false };
      }
    },
  }),
};

export default locatorjsIsolate;
