import type { IsolateDefinition } from "./types";
import { BASE_ISOLATE_PORT } from "./constants";

const clickToReactComponentIsolate: IsolateDefinition = {
  name: "click-to-component",
  port: BASE_ISOLATE_PORT + 3,
  description: "click-to-react-component — walks fiber tree via _debugSource and DevTools hook",
  dependencies: ["click-to-react-component"],

  configureNext: (baseConfig) => baseConfig,

  createResolver: () => ({
    name: "click-to-component",
    resolve: async (element) => {
      try {
        const { getSourceForElement } = await import(
          // @ts-expect-error patched subpath export
          "click-to-react-component/src/getSourceForElement.js"
        );
        const { getReactInstanceForElement } = await import(
          // @ts-expect-error patched subpath export
          "click-to-react-component/src/getReactInstanceForElement.js"
        );
        const { getDisplayNameForInstance } = await import(
          // @ts-expect-error patched subpath export
          "click-to-react-component/src/getDisplayNameFromReactInstance.js"
        );

        const source = getSourceForElement(element);
        const instance = getReactInstanceForElement(element);
        const componentName = instance
          ? getDisplayNameForInstance(instance)
          : null;

        return {
          filePath: source?.fileName ?? null,
          componentName: componentName ?? null,
          found: Boolean(source),
        };
      } catch {
        return { filePath: null, componentName: null, found: false };
      }
    },
  }),
};

export default clickToReactComponentIsolate;
