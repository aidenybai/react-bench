import benchData from "@/app/data.json";

const resolverKeys = benchData.resolvers.map((resolver) => resolver.key);

const TREATMENT_COLORS: Record<string, string> = {
  standalone: "oklch(0.6 0 0)",
  "react-grab": "oklch(0.7 0.25 330)",
  agentation: "#3b83f6",
  "cursor-browser": "#f64e00",
};

const TREATMENT_LABELS: Record<string, string> = {
  standalone: "Model",
  agentation: "Agentation",
  "react-grab": "React Grab",
  "cursor-browser": "Cursor (Browser)",
};

const DEFAULT_CHART_COLOR = "oklch(0.6 0 0)";

const TREATMENT_KEYS = Object.keys(TREATMENT_COLORS);

interface CodingModel {
  key: string;
  label: string;
}

const CODING_MODELS: CodingModel[] = [
  { key: "claude", label: "Claude Code" },
  // { key: "codex", label: "Codex" },
];

const MODEL_RESOLVER_MAP: Record<string, Record<string, string>> = {
  claude: {
    standalone: "claude-code",
    agentation: "agentation+claude",
    "react-grab": "react-grab+claude",
    "cursor-browser": "cursor-browser+claude",
  },
  // codex: {
  //   standalone: "codex",
  //   agentation: "agentation+codex",
  //   "react-grab": "react-grab+codex",
  //   "cursor-browser": "cursor-browser+codex",
  // },
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

const getResolverColor = (resolverKey: string): string => {
  const treatmentKey = RESOLVER_TO_TREATMENT[resolverKey];
  const color = treatmentKey ? TREATMENT_COLORS[treatmentKey] : undefined;
  return color ?? DEFAULT_CHART_COLOR;
};

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
};
