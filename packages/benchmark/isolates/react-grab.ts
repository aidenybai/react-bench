import type { IsolateDefinition } from "./types";
import { BASE_ISOLATE_PORT } from "./constants";

const reactGrabIsolate: IsolateDefinition = {
  name: "react-grab",
  port: BASE_ISOLATE_PORT,
  description: "React Grab — runtime script that reads fiber tree via window.__REACT_GRAB__",
  dependencies: ["react-grab"],

  configureNext: (baseConfig) => baseConfig,

  createResolver: () => ({
    name: "react-grab",
    resolve: async (element) => {
      const api = (window as any).__REACT_GRAB__;
      if (!api) return { filePath: null, componentName: null, found: false };

      const source = await api.getSource(element);
      const displayName = api.getDisplayName(element);

      return {
        filePath: source?.filePath ?? null,
        componentName: displayName ?? null,
        found: Boolean(source),
      };
    },
  }),
};

export default reactGrabIsolate;
