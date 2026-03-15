"use client";

import { useMemo } from "react";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ErrorBar,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccuracyTable } from "@/components/accuracy-table";
import { SpeedTable } from "@/components/speed-table";
import {
  benchData,
  getResolverColor,
  getResolversForModel,
  getControlKeyForModel,
  getTreatmentLabel,
} from "@/lib/bench-data";

interface ChartDataEntry {
  label: string;
  value: number;
  errorRange: [number, number];
  ciLower: number;
  ciUpper: number;
  fill: string;
}

interface ResultsBarChartProps {
  data: ChartDataEntry[];
  domain: [number, number];
  ticks: number[];
  formatValue: (value: number) => string;
  metricLabel: string;
}

const BenchTooltip = ({
  active,
  payload,
  formatValue,
  metricLabel,
}: {
  active?: boolean;
  payload?: { payload: ChartDataEntry }[];
  formatValue: (value: number) => string;
  metricLabel: string;
}) => {
  if (!active || !payload?.[0]) return null;
  const entry = payload[0].payload;
  const hasCI = entry.ciLower !== entry.ciUpper;

  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-md">
      <p className="font-medium mb-1">{entry.label}</p>
      <p className="text-muted-foreground">
        {metricLabel}:{" "}
        <span className="text-foreground font-medium">
          {formatValue(entry.value)}
        </span>
      </p>
      {hasCI && (
        <p className="text-muted-foreground">
          95% CI: {formatValue(entry.ciLower)} – {formatValue(entry.ciUpper)}
        </p>
      )}
    </div>
  );
};

const ResultsBarChart = ({
  data,
  domain,
  ticks,
  formatValue,
  metricLabel,
}: ResultsBarChartProps) => (
  <ChartContainer config={{}} className="aspect-2/1 w-full">
    <BarChart data={data} margin={{ top: 24, right: 0, bottom: 0, left: 0 }}>
      <CartesianGrid vertical={false} strokeDasharray="3 3" />
      <XAxis
        dataKey="label"
        type="category"
        tickLine={false}
        axisLine={false}
        tick={{ fontSize: 11 }}
      />
      <YAxis
        type="number"
        domain={domain}
        ticks={ticks}
        tickFormatter={formatValue}
        tickLine={false}
        axisLine={false}
        tick={{ fontSize: 10 }}
      />
      <ChartTooltip
        cursor={false}
        content={
          <BenchTooltip formatValue={formatValue} metricLabel={metricLabel} />
        }
      />
      <Bar dataKey="value" radius={[3, 3, 0, 0]}>
        <ErrorBar
          dataKey="errorRange"
          width={6}
          strokeWidth={1.5}
          stroke="var(--foreground)"
          opacity={0.5}
        />
        <LabelList
          dataKey="value"
          position="top"
          formatter={formatValue}
          style={{ fontSize: 10 }}
          offset={12}
        />
        {data.map((entry) => (
          <Cell key={entry.label} fill={entry.fill} />
        ))}
      </Bar>
    </BarChart>
  </ChartContainer>
);

const formatSpeed = (value: number) => `${value}s`;
const formatAccuracy = (value: number) => `${value}%`;

const SPEED_TICK_INTERVAL_S = 5;
const SPEED_PADDING_S = 2;
const ACCURACY_TICKS = [0, 25, 50, 75, 100];

const buildSpeedScale = (
  data: ChartDataEntry[],
): { domain: [number, number]; ticks: number[] } => {
  const maxValue = Math.max(...data.map((entry) => entry.value), 0);
  const ceiling =
    Math.ceil((maxValue + SPEED_PADDING_S) / SPEED_TICK_INTERVAL_S) *
    SPEED_TICK_INTERVAL_S;
  const ticks = Array.from(
    { length: ceiling / SPEED_TICK_INTERVAL_S + 1 },
    (_, index) => index * SPEED_TICK_INTERVAL_S,
  );
  return { domain: [0, ceiling], ticks };
};

interface BoundsRecord {
  lower?: number;
  upper?: number;
}

const extractCI = (
  resolverData: Record<string, unknown>,
  metricKey: "speed" | "accuracy",
): BoundsRecord => {
  const ciKey = metricKey === "speed" ? "speedCI" : "accuracyCI";
  const candidate = resolverData[ciKey];
  if (candidate && typeof candidate === "object")
    return candidate as BoundsRecord;
  return {};
};

const buildChartData = (
  filteredResolverKeys: string[],
  metricKey: "speed" | "accuracy",
  sortDescending: boolean,
): ChartDataEntry[] => {
  const overallScenario = benchData.scenarios.find(
    (scenario) => scenario.label === "overall",
  );
  if (!overallScenario) return [];

  return filteredResolverKeys
    .map((resolverKey) => {
      const resolverData =
        overallScenario.results[
          resolverKey as keyof typeof overallScenario.results
        ];
      const value = resolverData?.[metricKey] ?? 0;
      const bounds = extractCI(
        resolverData as Record<string, unknown>,
        metricKey,
      );

      const ciLower = bounds.lower ?? value;
      const ciUpper = bounds.upper ?? value;

      return {
        label: getTreatmentLabel(resolverKey),
        value,
        errorRange: [value - ciLower, ciUpper - value] as [number, number],
        ciLower,
        ciUpper,
        fill: getResolverColor(resolverKey),
      };
    })
    .filter((entry) => entry.value > 0)
    .sort((entryA, entryB) =>
      sortDescending
        ? entryB.value - entryA.value
        : entryA.value - entryB.value,
    );
};

const DEFAULT_MODEL = "claude";

const BASELINE_ACCURACY_THRESHOLD = 0.02;

const buildOverallData = (
  filteredResolverKeys: string[],
): ChartDataEntry[] => {
  const overallScenario = benchData.scenarios.find(
    (scenario) => scenario.label === "overall",
  );
  if (!overallScenario) return [];

  const controlKey = "claude-code";
  const controlData =
    overallScenario.results[
      controlKey as keyof typeof overallScenario.results
    ];
  const baselineAccuracy = controlData?.accuracy ?? 0;

  return filteredResolverKeys
    .map((resolverKey) => {
      const resolverData =
        overallScenario.results[
          resolverKey as keyof typeof overallScenario.results
        ] as Record<string, unknown> | undefined;
      const speed = (resolverData?.speed as number) ?? 0;
      const accuracy = (resolverData?.accuracy as number) ?? 0;
      if (speed === 0 || accuracy === 0) return null;

      if (
        resolverKey !== controlKey &&
        Math.abs(accuracy - baselineAccuracy) / 100 < BASELINE_ACCURACY_THRESHOLD
      ) {
        return null;
      }

      const timePerCorrect =
        Math.round((speed / (accuracy / 100)) * 10) / 10;

      return {
        label: getTreatmentLabel(resolverKey),
        value: timePerCorrect,
        errorRange: [0, 0] as [number, number],
        ciLower: timePerCorrect,
        ciUpper: timePerCorrect,
        fill: getResolverColor(resolverKey),
      };
    })
    .filter((entry): entry is ChartDataEntry => entry !== null)
    .sort((entryA, entryB) => entryA.value - entryB.value);
};

const ResultsSection = () => {
  const [tab, setTab] = useQueryState(
    "metric",
    parseAsStringLiteral(["speed", "accuracy"] as const).withDefault("speed"),
  );

  const filteredResolverKeys = useMemo(
    () => getResolversForModel(DEFAULT_MODEL),
    [],
  );

  const controlKey = useMemo(() => getControlKeyForModel(DEFAULT_MODEL), []);

  const speedChartData = useMemo(
    () => buildChartData(filteredResolverKeys, "speed", false),
    [filteredResolverKeys],
  );

  const speedScale = useMemo(
    () => buildSpeedScale(speedChartData),
    [speedChartData],
  );

  const accuracyChartData = useMemo(
    () => buildChartData(filteredResolverKeys, "accuracy", true),
    [filteredResolverKeys],
  );

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as "speed" | "accuracy")}
    >
      <TabsList variant="line">
        <TabsTrigger value="speed">Speed</TabsTrigger>
        <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
      </TabsList>

      <TabsContent value="speed" className="space-y-6">
        <p className="text-sm text-muted-foreground italic">
          Average resolution time. Wrong answers penalized at 2min (lower is
          better)
        </p>
        <ResultsBarChart
          data={speedChartData}
          domain={speedScale.domain}
          ticks={speedScale.ticks}
          formatValue={formatSpeed}
          metricLabel="Avg"
        />
        <div className="ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] overflow-x-auto px-4 sm:px-8">
          <SpeedTable
            resolverKeys={filteredResolverKeys}
            controlKey={controlKey}
          />
        </div>
      </TabsContent>

      <TabsContent value="accuracy" className="space-y-6">
        <p className="text-sm text-muted-foreground italic">
          Correct resolutions in % (higher is better)
        </p>
        <ResultsBarChart
          data={accuracyChartData}
          domain={[0, 100]}
          ticks={ACCURACY_TICKS}
          formatValue={formatAccuracy}
          metricLabel="Accuracy"
        />
        <div className="ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] overflow-x-auto px-4 sm:px-8">
          <AccuracyTable resolverKeys={filteredResolverKeys} />
        </div>
      </TabsContent>
    </Tabs>
  );
};

export { ResultsSection };
