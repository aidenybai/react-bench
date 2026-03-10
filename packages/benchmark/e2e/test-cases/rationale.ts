const PREFIX_RATIONALES: Record<string, string> = {
  "deep-": "Tests deeply nested component trees common in complex dashboards and admin panels.",
  "barrel-": "Tests barrel re-export chains used in design system packages and component libraries.",
  "factory-": "Tests factory-generated components common in data-heavy dashboards with repeated metrics.",
  "generic-": "Tests generic/reusable UI primitives found in every component library.",
  "sibling-": "Tests distinguishing between near-identical sibling components rendered from shared templates.",
  "util-": "Tests small utility display components used across many parent contexts.",
  "dynamic-": "Tests dynamically rendered components with conditional layouts and runtime polymorphism.",
  "hook-": "Tests components whose behavior is driven by custom hooks, common in interactive UIs.",
  "provider-": "Tests components rendered inside nested context providers, common in themed/auth-gated apps.",
  "radix-": "Tests Radix UI primitives used in modern React apps with headless UI patterns.",
  "shadcn-": "Tests shadcn/ui components, the most popular React component library pattern.",
  "plain-": "Tests straightforward components with standard styling — the baseline for resolution.",
  "server-": "Tests React Server Components and client/server boundary crossing in Next.js apps.",
  "common-": "Tests shared components reused across multiple parent contexts and modules.",
  "config-": "Tests configuration-driven components with conditional rendering based on state.",
  "portal-": "Tests portal-rendered components mounted outside the DOM hierarchy.",
  "recursive-": "Tests recursive component trees like file explorers and nested menus.",
  "identity-": "Tests deeply wrapped identity/pass-through components that obscure the source.",
  "misleading-": "Tests components with names that mismatch their file location — a common refactoring artifact.",
  "module-": "Tests module-scoped components with CSS Modules or co-located styles.",
  "style-clash": "Tests components where multiple styling systems collide, common during migrations.",
  "inline-": "Tests inline-defined components that lack standalone file boundaries.",
  "tooltip-hoc": "Tests HOC-wrapped components where the wrapper obscures the underlying component.",
  "tracked-": "Tests instrumented/tracked components wrapped with analytics or logging HOCs.",
  "stagger-": "Tests staggered animation grid children common in gallery and card layouts.",
  "animation-": "Tests complex animation chains mixing Framer Motion, Radix, and styled-components.",
  "animated-": "Tests animated components using Framer Motion AnimatePresence patterns.",
  "button-in": "Tests deeply nested interactive elements inside compound component patterns.",
  "client-island": "Tests client component islands inside server components — a Next.js App Router pattern.",
  "memo-": "Tests memo + forwardRef wrapped components, common in performance-optimized libraries.",
  "fractal-": "Tests fractal/self-similar recursive component patterns.",
  "generated-": "Tests machine-generated integration components from code generators.",
  "hoc-": "Tests higher-order component wrappers that add behavior without changing identity.",
  "suspense-": "Tests React.lazy + Suspense code-split components.",
  "russian-doll": "Tests deeply nested wrapper components — a common pattern in composed UIs.",
  "shapeshifter": "Tests polymorphic components that render different elements based on props.",
  "tw-": "Tests Tailwind CSS utility class components with minimal markup.",
  "styled-": "Tests styled-components with runtime CSS-in-JS, common in legacy React apps.",
};

const getRationale = (testId: string): string => {
  const matchingPrefix = Object.keys(PREFIX_RATIONALES).find((prefix) =>
    testId.startsWith(prefix),
  );
  return matchingPrefix ? PREFIX_RATIONALES[matchingPrefix] : "";
};

export { getRationale };
