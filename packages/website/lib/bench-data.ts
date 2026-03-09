import benchData from "@/app/data.json";

const resolverKeys = benchData.resolvers.map((resolver) => resolver.key);
const controlKey = (benchData as { control?: string }).control;

const RESOLVER_COLORS: Record<string, string> = {
  "react-grab+claude": "oklch(0.7 0.25 330)",
  "agentation+claude": "oklch(0.65 0.2 260)",
  "claude-code": "oklch(0.7 0.15 50)",
};

const DEFAULT_CHART_COLOR = "oklch(0.6 0 0)";

const getResolverColor = (resolverKey: string): string =>
  RESOLVER_COLORS[resolverKey] ?? DEFAULT_CHART_COLOR;

export {
  benchData,
  resolverKeys,
  controlKey,
  RESOLVER_COLORS,
  DEFAULT_CHART_COLOR,
  getResolverColor,
};
