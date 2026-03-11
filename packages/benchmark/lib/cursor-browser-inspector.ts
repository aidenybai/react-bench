// Reverse-engineered clone of Cursor's proprietary browser element inspector.
// Cursor's inspector is not available as a standalone library, so this is a
// clean-room reimplementation producing near-1:1 clipboard output (DOM path,
// position, React component via fiber walking, serialized props/styles/HTML).
// Verified against Cursor 1.x clipboard dumps via Evercoder Clipboard Inspector.
// Cloned: 2026-03-09

interface CursorElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface CursorReactComponent {
  name: string;
  props: Record<string, unknown>;
}

interface CursorElementMetadata {
  domPath: string;
  position: CursorElementRect;
  reactComponent: CursorReactComponent | null;
  htmlElement: string;
  element: string;
  textContent: string;
  id: string;
  className: string;
  attributes: Array<{ name: string; value: string }>;
  styles: Record<string, string>;
  rect: CursorElementRect;
  uniqueId: string;
}

interface CursorBrowserInspectorAPI {
  inspectElement: (
    element: HTMLElement,
    uniqueId?: string,
  ) => CursorElementMetadata;
  formatClipboardText: (metadata: CursorElementMetadata) => string;
}

interface ReactFiber {
  type: unknown;
  return: ReactFiber | null;
  memoizedProps: Record<string, unknown> | null;
}

interface ReactComponentType {
  displayName?: string;
  name?: string;
  render?: { displayName?: string; name?: string };
  $$typeof?: symbol;
}

const STYLE_PROPERTIES = [
  "color",
  "backgroundColor",
  "fontSize",
  "fontFamily",
  "display",
  "position",
] as const;

const MAX_TEXT_CONTENT_LENGTH = 200;
const MAX_FUNCTION_SOURCE_LENGTH = 200;
const MAX_DOM_DEPTH = 50;
const MAX_FIBER_DEPTH = 100;

const ZERO_RECT: CursorElementRect = {
  top: 0,
  left: 0,
  width: 0,
  height: 0,
};

const buildDomPathSegment = (element: HTMLElement): string => {
  const tagName = element.tagName.toLowerCase();

  if (element.id) {
    return `${tagName}#${element.id}`;
  }

  const classNames =
    typeof element.className === "string"
      ? element.className.trim().split(/\s+/).filter(Boolean)
      : [];

  let segment = tagName;
  if (classNames.length > 0) {
    segment += `.${classNames.join(" ")}`;
  }

  const parent = element.parentElement;
  if (parent) {
    const sameTagSiblings = Array.from(parent.children).filter(
      (sibling) => sibling.tagName === element.tagName,
    );
    if (sameTagSiblings.length > 1) {
      const index = sameTagSiblings.indexOf(element);
      if (index >= 0) {
        segment += `[${index}]`;
      }
    }
  }

  return segment;
};

const buildDomPath = (element: HTMLElement): string => {
  const segments: string[] = [];
  let current: HTMLElement | null = element;
  let depth = 0;

  while (
    current &&
    current !== document.body &&
    current !== document.documentElement &&
    depth < MAX_DOM_DEPTH
  ) {
    segments.unshift(buildDomPathSegment(current));
    current = current.parentElement;
    depth++;
  }

  return segments.join(" > ");
};

const getReactFiber = (element: HTMLElement): ReactFiber | null => {
  try {
    const fiberKey = Object.keys(element).find(
      (key) =>
        key.startsWith("__reactFiber$") ||
        key.startsWith("__reactInternalInstance$"),
    );
    if (!fiberKey) return null;
    const fiber = element[fiberKey as keyof HTMLElement] as unknown;
    if (!fiber || typeof fiber !== "object") return null;
    return fiber as ReactFiber;
  } catch {
    return null;
  }
};

const safeFunctionToString = (fn: Function): string => {
  try {
    return fn.toString().slice(0, MAX_FUNCTION_SOURCE_LENGTH) + "...";
  } catch {
    return "[native code]";
  }
};

const serializeProps = (
  props: Record<string, unknown>,
): Record<string, unknown> => {
  if (!props) return {};
  const serialized: Record<string, unknown> = {};

  for (const key of Object.keys(props)) {
    try {
      const value = props[key];
      if (typeof value === "function") {
        serialized[key] = {
          __type: "function",
          source: safeFunctionToString(value),
        };
      } else if (key === "children") {
        serialized[key] = Array.isArray(value)
          ? value.map((child) =>
              typeof child === "object" && child !== null
                ? "[React Element]"
                : child,
            )
          : typeof value === "object" && value !== null
            ? "[React Element]"
            : value;
      } else if (
        value &&
        typeof value === "object" &&
        "$$typeof" in (value as Record<string, unknown>)
      ) {
        serialized[key] = "[React Element]";
      } else {
        serialized[key] = value;
      }
    } catch {
      serialized[key] = "[unreadable]";
    }
  }

  return serialized;
};

const isUserComponent = (fiberType: unknown): boolean => {
  if (typeof fiberType === "function") return true;
  if (fiberType && typeof fiberType === "object") {
    const typed = fiberType as Record<string, unknown>;
    return (
      typed.$$typeof === Symbol.for("react.forward_ref") ||
      typed.$$typeof === Symbol.for("react.memo")
    );
  }
  return false;
};

const getComponentName = (fiberType: unknown): string | null => {
  if (typeof fiberType === "function") {
    const typed = fiberType as ReactComponentType;
    return typed.displayName || typed.name || null;
  }
  if (fiberType && typeof fiberType === "object") {
    const typed = fiberType as ReactComponentType;
    return (
      typed.displayName ||
      typed.render?.displayName ||
      typed.render?.name ||
      null
    );
  }
  return null;
};

const findReactComponent = (
  element: HTMLElement,
): CursorReactComponent | null => {
  try {
    const fiber = getReactFiber(element);
    if (!fiber) return null;

    let current: ReactFiber | null = fiber;
    let depth = 0;
    while (current && depth < MAX_FIBER_DEPTH) {
      if (isUserComponent(current.type)) {
        const name = getComponentName(current.type);
        if (name) {
          return {
            name,
            props: serializeProps(current.memoizedProps ?? {}),
          };
        }
      }
      current = current.return;
      depth++;
    }
  } catch {
    return null;
  }

  return null;
};

const getKeyStyles = (element: HTMLElement): Record<string, string> => {
  try {
    const computed = getComputedStyle(element);
    const styles: Record<string, string> = {};
    for (const property of STYLE_PROPERTIES) {
      styles[property] = computed.getPropertyValue(
        property.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`),
      );
    }
    return styles;
  } catch {
    return {};
  }
};

const buildHtmlElement = (element: HTMLElement): string => {
  try {
    const clone = element.cloneNode(false) as HTMLElement;
    const textContent =
      element.textContent?.trim().slice(0, MAX_TEXT_CONTENT_LENGTH) ?? "";
    clone.textContent = textContent;
    return clone.outerHTML;
  } catch {
    return `<${element.tagName.toLowerCase()}>`;
  }
};

let elementCounter = 0;

const inspectElement = (
  element: HTMLElement,
  uniqueId?: string,
): CursorElementMetadata => {
  const resolvedUniqueId = uniqueId ?? `cursor-el-${++elementCounter}`;

  let rect: CursorElementRect = ZERO_RECT;
  let preciseRect: CursorElementRect = ZERO_RECT;
  try {
    const domRect = element.getBoundingClientRect();
    rect = {
      top: Math.round(domRect.top),
      left: Math.round(domRect.left),
      width: Math.round(domRect.width),
      height: Math.round(domRect.height),
    };
    preciseRect = {
      top: domRect.top,
      left: domRect.left,
      width: domRect.width,
      height: domRect.height,
    };
  } catch {
    // HACK: getBoundingClientRect can throw on detached or exotic elements
  }

  return {
    domPath: buildDomPath(element),
    position: rect,
    reactComponent: findReactComponent(element),
    htmlElement: buildHtmlElement(element),
    element: element.tagName.toLowerCase(),
    textContent:
      element.textContent?.trim().slice(0, MAX_TEXT_CONTENT_LENGTH) ?? "",
    id: element.id ?? "",
    className: typeof element.className === "string" ? element.className : "",
    attributes: Array.from(element.attributes)
      .filter(
        (attr) =>
          attr.name !== "class" && attr.name !== "id" && attr.name !== "style",
      )
      .map((attr) => ({ name: attr.name, value: attr.value })),
    styles: getKeyStyles(element),
    rect: preciseRect,
    uniqueId: resolvedUniqueId,
  };
};

const formatClipboardText = (metadata: CursorElementMetadata): string => {
  const lines: string[] = [
    `DOM Path: ${metadata.domPath}`,
    `Position: top=${metadata.position.top}px, left=${metadata.position.left}px, width=${metadata.position.width}px, height=${metadata.position.height}px`,
  ];

  if (metadata.reactComponent) {
    lines.push(`React Component: ${metadata.reactComponent.name}`);
  }

  lines.push(`HTML Element: ${metadata.htmlElement}`);

  return lines.join("\n");
};

declare global {
  interface Window {
    __CURSOR_BROWSER_INSPECTOR__?: CursorBrowserInspectorAPI;
  }
}

if (typeof window !== "undefined") {
  const api: CursorBrowserInspectorAPI = {
    inspectElement,
    formatClipboardText,
  };
  window.__CURSOR_BROWSER_INSPECTOR__ = api;
}

export { inspectElement, formatClipboardText };
export type {
  CursorElementMetadata,
  CursorReactComponent,
  CursorElementRect,
  CursorBrowserInspectorAPI,
};
