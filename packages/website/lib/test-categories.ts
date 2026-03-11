interface TestCategory {
  label: string;
  rationale: string;
}

const PREFIX_CATEGORIES: Record<string, TestCategory> = {
  "deep-": {
    label: "Deep Nesting",
    rationale:
      "Deeply nested component trees common in complex dashboards and admin panels.",
  },
  "barrel-": {
    label: "Barrel Export",
    rationale:
      "Barrel re-export chains used in design system packages and component libraries.",
  },
  "factory-": {
    label: "Factory",
    rationale:
      "Factory-generated components common in data-heavy dashboards with repeated metrics.",
  },
  "generic-": {
    label: "Generic",
    rationale:
      "Generic/reusable UI primitives found in every component library.",
  },
  "sibling-": {
    label: "Sibling",
    rationale:
      "Near-identical sibling components rendered from shared templates.",
  },
  "util-": {
    label: "Utility",
    rationale:
      "Small utility display components used across many parent contexts.",
  },
  "dynamic-": {
    label: "Dynamic",
    rationale:
      "Dynamically rendered components with conditional layouts and runtime polymorphism.",
  },
  "hook-": {
    label: "Hook",
    rationale:
      "Components whose behavior is driven by custom hooks, common in interactive UIs.",
  },
  "provider-": {
    label: "Provider",
    rationale:
      "Components inside nested context providers, common in themed/auth-gated apps.",
  },
  "radix-": {
    label: "Radix",
    rationale:
      "Radix UI primitives used in modern React apps with headless UI patterns.",
  },
  "shadcn-": {
    label: "shadcn/ui",
    rationale:
      "shadcn/ui components, the most popular React component library pattern.",
  },
  "plain-": {
    label: "Plain",
    rationale:
      "Straightforward components with standard styling — the baseline for resolution.",
  },
  "server-": {
    label: "RSC",
    rationale:
      "React Server Components and client/server boundary crossing in Next.js apps.",
  },
  "common-": {
    label: "Shared",
    rationale:
      "Shared components reused across multiple parent contexts and modules.",
  },
  "config-": {
    label: "Config",
    rationale:
      "Configuration-driven components with conditional rendering based on state.",
  },
  "portal-": {
    label: "Portal",
    rationale: "Portal-rendered components mounted outside the DOM hierarchy.",
  },
  "recursive-": {
    label: "Recursive",
    rationale:
      "Recursive component trees like file explorers and nested menus.",
  },
  "identity-": {
    label: "Identity",
    rationale:
      "Deeply wrapped identity/pass-through components that obscure the source.",
  },
  "misleading-": {
    label: "Misleading",
    rationale:
      "Components with names that mismatch their file location — a refactoring artifact.",
  },
  "module-": {
    label: "Module",
    rationale:
      "Module-scoped components with CSS Modules or co-located styles.",
  },
  "style-clash": {
    label: "Style Clash",
    rationale:
      "Components where multiple styling systems collide, common during migrations.",
  },
  "inline-": {
    label: "Inline",
    rationale:
      "Inline-defined components that lack standalone file boundaries.",
  },
  "tooltip-hoc": {
    label: "HOC",
    rationale:
      "HOC-wrapped components where the wrapper obscures the underlying component.",
  },
  "tracked-": {
    label: "Tracked",
    rationale:
      "Instrumented/tracked components wrapped with analytics or logging HOCs.",
  },
  "stagger-": {
    label: "Animation",
    rationale:
      "Staggered animation grid children common in gallery and card layouts.",
  },
  "animation-": {
    label: "Animation",
    rationale:
      "Complex animation chains mixing Framer Motion, Radix, and styled-components.",
  },
  "animated-": {
    label: "Animation",
    rationale:
      "Animated components using Framer Motion AnimatePresence patterns.",
  },
  "button-in": {
    label: "Compound",
    rationale:
      "Deeply nested interactive elements inside compound component patterns.",
  },
  "client-island": {
    label: "RSC",
    rationale:
      "Client component islands inside server components — a Next.js App Router pattern.",
  },
  "memo-": {
    label: "Memo",
    rationale:
      "memo + forwardRef wrapped components, common in performance-optimized libraries.",
  },
  "fractal-": {
    label: "Recursive",
    rationale: "Fractal/self-similar recursive component patterns.",
  },
  "generated-": {
    label: "Generated",
    rationale: "Machine-generated integration components from code generators.",
  },
  "hoc-": {
    label: "HOC",
    rationale:
      "Higher-order component wrappers that add behavior without changing identity.",
  },
  "suspense-": {
    label: "Suspense",
    rationale: "React.lazy + Suspense code-split components.",
  },
  "russian-doll": {
    label: "Deep Nesting",
    rationale:
      "Deeply nested wrapper components — a common pattern in composed UIs.",
  },
  shapeshifter: {
    label: "Polymorphic",
    rationale:
      "Polymorphic components that render different elements based on props.",
  },
  "tw-": {
    label: "Tailwind",
    rationale: "Tailwind CSS utility class components with minimal markup.",
  },
  "styled-": {
    label: "Styled",
    rationale:
      "styled-components with runtime CSS-in-JS, common in legacy React apps.",
  },
  "compound-": {
    label: "Compound",
    rationale:
      "Object.assign compound components where sub-components are attached as static properties (inspired by Excalidraw Sidebar, Cal.com Table).",
  },
  "alias-": {
    label: "Alias",
    rationale:
      "Components re-exported under different names than their definition (inspired by Excalidraw Footer/FooterCenter, Novu Inbox chain).",
  },
  "display-name-": {
    label: "displayName",
    rationale:
      "Components resolved by displayName matching rather than imports (inspired by Excalidraw DropdownMenu).",
  },
  "dispatch-": {
    label: "Dispatcher",
    rationale:
      "Switch/map-based dispatchers that render different internal components based on a type prop (inspired by Formbricks ElementConditional).",
  },
  "polymorphic-": {
    label: "Polymorphic",
    rationale:
      "Polymorphic forwardRef components with memo wrapping and inner/outer name mismatch (inspired by Cal.com Form, Twenty SuggestionMenu).",
  },
  "tunnel-": {
    label: "Tunnel",
    rationale:
      "Components rendered through React context tunnels where content is injected far from its render site (inspired by Excalidraw DefaultSidebar tunnels).",
  },
  "lazy-named-": {
    label: "Lazy Named",
    rationale:
      "Lazy-loaded components using .then() to extract named exports instead of defaults (inspired by LobeChat, Twenty).",
  },
  "dynamic-import-": {
    label: "Dynamic Import",
    rationale:
      "Components loaded from a dynamic import map keyed by runtime values (inspired by LobeChat componentMap, Cal.com EventTypeWebWrapper).",
  },
  "render-prop-": {
    label: "Render Prop",
    rationale:
      "Components that receive their rendered content through callback props (inspired by Cal.com FormAction, Excalidraw App).",
  },
  "collision-": {
    label: "Collision",
    rationale:
      "Same-named components in different directories that require path-based disambiguation (inspired by Plane @plane/ui vs @plane/propel, Novu).",
  },
  "unexpected-": {
    label: "Unexpected",
    rationale:
      "Components in non-component directories like middleware/, scripts/, schemas/, constants/, types/ (inspired by Dub, Inbox-zero, Midday).",
  },
};

const getTestCategory = (testId: string): TestCategory | null => {
  const matchingPrefix = Object.keys(PREFIX_CATEGORIES).find((prefix) =>
    testId.startsWith(prefix),
  );
  return matchingPrefix ? PREFIX_CATEGORIES[matchingPrefix] : null;
};

export { getTestCategory };
export type { TestCategory };
