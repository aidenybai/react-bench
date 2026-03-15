import benchData from "@/app/data.json";

const resolverKeys = benchData.resolvers.map((resolver) => resolver.key);

const TREATMENT_COLORS: Record<string, string> = {
  standalone: "oklch(0.6 0 0)",
  "react-grab": "oklch(0.7 0.25 330)",
  agentation: "#3b83f6",
  "cursor-browser": "#f64e00",
  "click-to-component": "#10b981",
  locatorjs: "#8b5cf6",
  instruckt: "#f59e0b",
};

const TREATMENT_LABELS: Record<string, string> = {
  standalone: "Model",
  agentation: "Agentation",
  "react-grab": "React Grab",
  "cursor-browser": "Cursor (Browser)",
  "click-to-component": "Click to Component",
  locatorjs: "LocatorJS",
  instruckt: "Instruckt",
};

const TREATMENT_GITHUB_URLS: Record<string, string> = {
  standalone: "https://github.com/anthropics/claude-code",
  agentation: "https://github.com/benjitaylor/agentation",
  "react-grab": "https://github.com/aidenybai/react-grab",
  "cursor-browser": "https://cursor.com/docs/agent/browser",
  "click-to-component": "https://github.com/ericclemmons/click-to-component",
  locatorjs: "https://github.com/infi-pc/locatorjs",
  instruckt: "https://github.com/joshcirre/instruckt",
};

const TREATMENT_LOGO_URLS: Record<string, string> = {
  standalone: "https://github.com/anthropics.png?size=64",
  agentation: "https://github.com/benjitaylor.png?size=64",
  "react-grab": "https://github.com/aidenybai.png?size=64",
  "cursor-browser": "https://github.com/anysphere.png?size=64",
  "click-to-component": "https://github.com/ericclemmons.png?size=64",
  locatorjs: "https://github.com/infi-pc.png?size=64",
  instruckt: "https://github.com/joshcirre.png?size=64",
};

const DEFAULT_CHART_COLOR = "oklch(0.6 0 0)";

const TREATMENT_KEYS = Object.keys(TREATMENT_COLORS);

interface CodingModel {
  key: string;
  label: string;
}

const CODING_MODELS: CodingModel[] = [{ key: "claude", label: "Claude Code" }];

const MODEL_RESOLVER_MAP: Record<string, Record<string, string>> = {
  claude: {
    standalone: "claude-code",
    agentation: "agentation+claude",
    "react-grab": "react-grab+claude",
    "cursor-browser": "cursor-browser+claude",
    "click-to-component": "click-to-component+claude",
    locatorjs: "locatorjs+claude",
    instruckt: "instruckt+claude",
  },
};

const RESOLVER_TO_TREATMENT: Record<string, string> = Object.fromEntries(
  Object.entries(MODEL_RESOLVER_MAP).flatMap(([, treatments]) =>
    Object.entries(treatments).map(([treatmentKey, resolverKey]) => [
      resolverKey,
      treatmentKey,
    ]),
  ),
);

const RESOLVER_TO_MODEL_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(MODEL_RESOLVER_MAP).flatMap(([modelKey, treatments]) =>
    Object.values(treatments).map((resolverKey) => [resolverKey, modelKey]),
  ),
);

const getTreatmentProperty = <T,>(
  resolverKey: string,
  map: Record<string, T>,
): T | undefined => {
  const treatmentKey = RESOLVER_TO_TREATMENT[resolverKey];
  return treatmentKey ? map[treatmentKey] : undefined;
};

const getResolverColor = (resolverKey: string): string =>
  getTreatmentProperty(resolverKey, TREATMENT_COLORS) ?? DEFAULT_CHART_COLOR;

const getToolGithubUrl = (resolverKey: string): string | undefined =>
  getTreatmentProperty(resolverKey, TREATMENT_GITHUB_URLS);

const getToolLogoUrl = (resolverKey: string): string | undefined =>
  getTreatmentProperty(resolverKey, TREATMENT_LOGO_URLS);

const getResolversForModel = (modelKey: string): string[] => {
  const treatments = MODEL_RESOLVER_MAP[modelKey];
  if (!treatments) return resolverKeys;
  return TREATMENT_KEYS.map((treatmentKey) => treatments[treatmentKey]).filter(
    Boolean,
  );
};

const getControlKeyForModel = (modelKey: string): string | undefined =>
  MODEL_RESOLVER_MAP[modelKey]?.standalone;

const getModelLabelByKey = (modelKey: string): string => {
  const codingModel = CODING_MODELS.find(
    (candidate) => candidate.key === modelKey,
  );
  return codingModel?.label ?? modelKey;
};

const getTreatmentLabel = (resolverKey: string): string => {
  const treatmentKey = RESOLVER_TO_TREATMENT[resolverKey];
  if (treatmentKey === "standalone") {
    const modelKey = RESOLVER_TO_MODEL_KEY[resolverKey];
    return modelKey ? getModelLabelByKey(modelKey) : resolverKey;
  }
  const label = treatmentKey ? TREATMENT_LABELS[treatmentKey] : undefined;
  return label ?? resolverKey;
};

export {
  benchData,
  resolverKeys,
  DEFAULT_CHART_COLOR,
  getResolverColor,
  getResolversForModel,
  getControlKeyForModel,
  getTreatmentLabel,
  getToolGithubUrl,
  getToolLogoUrl,
};
