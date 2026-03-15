const Z_95 = 1.96;

interface ConfidenceInterval {
  lower: number;
  upper: number;
}

interface GeomeanWithCI extends ConfidenceInterval {
  geomean: number;
}

const wilsonScoreInterval = (
  successes: number,
  total: number,
): ConfidenceInterval => {
  if (total === 0) return { lower: 0, upper: 0 };
  const proportion = successes / total;
  const zSquaredOverTotal = (Z_95 * Z_95) / total;
  const denominator = 1 + zSquaredOverTotal;
  const center = (proportion + zSquaredOverTotal / 2) / denominator;
  const margin =
    (Z_95 / denominator) *
    Math.sqrt(
      (proportion * (1 - proportion)) / total + zSquaredOverTotal / (4 * total),
    );
  return {
    lower: Math.max(0, center - margin),
    upper: Math.min(1, center + margin),
  };
};

const geomeanConfidenceInterval = (valuesMs: number[]): GeomeanWithCI => {
  const positiveValues = valuesMs.filter((value) => value > 0);
  if (positiveValues.length === 0) return { geomean: 0, lower: 0, upper: 0 };

  const mean =
    positiveValues.reduce((sum, value) => sum + value, 0) /
    positiveValues.length;

  if (positiveValues.length < 2) {
    return { geomean: mean, lower: mean, upper: mean };
  }

  const variance =
    positiveValues.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (positiveValues.length - 1);
  const standardError = Math.sqrt(variance / positiveValues.length);

  return {
    geomean: mean,
    lower: Math.max(0, mean - Z_95 * standardError),
    upper: mean + Z_95 * standardError,
  };
};

export { wilsonScoreInterval, geomeanConfidenceInterval };
export type { ConfidenceInterval, GeomeanWithCI };
