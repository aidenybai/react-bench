import type { IsolateDefinition } from "./types";
import { BASE_ISOLATE_PORT } from "./constants";

const instrucktIsolate: IsolateDefinition = {
  name: "instruckt",
  port: BASE_ISOLATE_PORT + 5,
  description: "Instruckt — uses element-source internally for React fiber source detection",
  dependencies: ["instruckt", "element-source"],

  configureNext: (baseConfig) => baseConfig,

  createResolver: () => ({
    name: "instruckt",
    resolve: async (element) => {
      try {
        const { resolveSource, resolveComponentName } = await import("element-source");
        const source = await resolveSource(element);
        const componentName = await resolveComponentName(element);

        return {
          filePath: source?.filePath ?? null,
          componentName: componentName ?? null,
          found: Boolean(source?.filePath),
        };
      } catch {
        return { filePath: null, componentName: null, found: false };
      }
    },
  }),
};

export default instrucktIsolate;
