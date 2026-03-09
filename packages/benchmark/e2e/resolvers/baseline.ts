import type { CliResolver } from "./types";

const baseline: CliResolver = {
  name: "baseline",
  buildPrompt: (entry) => entry.lazyDescription,
};

export default baseline;
