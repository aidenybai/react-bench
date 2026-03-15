import type { IsolateDefinition } from "./types";
import { BASE_ISOLATE_PORT } from "./constants";

const cursorBrowserIsolate: IsolateDefinition = {
  name: "cursor-browser",
  port: BASE_ISOLATE_PORT + 2,
  description: "Cursor Browser Inspector — uses window.__CURSOR_BROWSER_INSPECTOR__ for component detection",
  dependencies: [],

  configureNext: (baseConfig) => baseConfig,

  createResolver: () => ({
    name: "cursor-browser",
    resolve: (element) => {
      const inspector = (window as any).__CURSOR_BROWSER_INSPECTOR__;
      if (!inspector) {
        return { filePath: null, componentName: null, found: false };
      }

      const metadata = inspector.inspectElement(element);

      return {
        filePath: null,
        componentName: metadata.reactComponent?.name ?? null,
        found: Boolean(metadata.reactComponent),
      };
    },
  }),
};

export default cursorBrowserIsolate;
