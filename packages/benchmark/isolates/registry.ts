import type { IsolateDefinition } from "./types";
import reactGrabIsolate from "./react-grab";
import agentationIsolate from "./agentation";
import cursorBrowserIsolate from "./cursor-browser";
import clickToReactComponentIsolate from "./click-to-react-component";
import locatorjsIsolate from "./locatorjs";
import instrucktIsolate from "./instruckt";

const ISOLATE_REGISTRY: IsolateDefinition[] = [
  reactGrabIsolate,
  agentationIsolate,
  cursorBrowserIsolate,
  clickToReactComponentIsolate,
  locatorjsIsolate,
  instrucktIsolate,
];

const findIsolateByName = (isolateName: string): IsolateDefinition | undefined =>
  ISOLATE_REGISTRY.find((isolate) => isolate.name === isolateName);

export { ISOLATE_REGISTRY, findIsolateByName };
