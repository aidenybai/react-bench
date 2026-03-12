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

  const logValues = positiveValues.map((value) => Math.log(value));
  const logMean =
    logValues.reduce((sum, value) => sum + value, 0) / logValues.length;

  if (positiveValues.length < 2) {
    const singleGeomean = Math.exp(logMean);
    return {
      geomean: singleGeomean,
      lower: singleGeomean,
      upper: singleGeomean,
    };
  }

  const logVariance =
    logValues.reduce((sum, value) => sum + (value - logMean) ** 2, 0) /
    (logValues.length - 1);
  const logStandardError = Math.sqrt(logVariance / logValues.length);

  return {
    geomean: Math.exp(logMean),
    lower: Math.exp(logMean - Z_95 * logStandardError),
    upper: Math.exp(logMean + Z_95 * logStandardError),
  };
};

export { wilsonScoreInterval, geomeanConfidenceInterval };
export type { ConfidenceInterval, GeomeanWithCI };
