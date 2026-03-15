import type { IsolateDefinition } from "./types";
import { BASE_ISOLATE_PORT } from "./constants";

const agentationIsolate: IsolateDefinition = {
  name: "agentation",
  port: BASE_ISOLATE_PORT + 1,
  description: "Agentation — floating toolbar with React fiber source location detection",
  dependencies: ["agentation"],

  configureNext: (baseConfig) => baseConfig,

  createResolver: () => ({
    name: "agentation",
    resolve: async (element) => {
      const { getSourceLocation } = await import("agentation");
      const location = getSourceLocation(element);

      return {
        filePath: location.source?.fileName ?? null,
        componentName: location.source?.componentName ?? null,
        found: location.found,
      };
    },
  }),
};

export default agentationIsolate;
