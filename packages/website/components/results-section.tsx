"use client";

import { useMemo } from "react";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
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
  fill: string;
}

interface ResultsBarChartProps {
  data: ChartDataEntry[];
  domain: [number, number];
  ticks: number[];
  formatValue: (value: number) => string;
}

const ResultsBarChart = ({
  data,
  domain,
  ticks,
  formatValue,
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
        content={<ChartTooltipContent hideLabel nameKey="label" />}
      />
      <Bar dataKey="value" radius={[3, 3, 0, 0]}>
        <LabelList
          dataKey="value"
          position="top"
          formatter={formatValue}
          style={{ fontSize: 10 }}
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
  const ceiling = Math.ceil((maxValue + SPEED_PADDING_S) / SPEED_TICK_INTERVAL_S) * SPEED_TICK_INTERVAL_S;
  const ticks = Array.from(
    { length: ceiling / SPEED_TICK_INTERVAL_S + 1 },
    (_, index) => index * SPEED_TICK_INTERVAL_S,
  );
  return { domain: [0, ceiling], ticks };
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
    .map((resolverKey) => ({
      label: getTreatmentLabel(resolverKey),
      value:
        overallScenario.results[
          resolverKey as keyof typeof overallScenario.results
        ]?.[metricKey] ?? 0,
      fill: getResolverColor(resolverKey),
    }))
    .filter((entry) => entry.value > 0)
    .sort((entryA, entryB) =>
      sortDescending
        ? entryB.value - entryA.value
        : entryA.value - entryB.value,
    );
};

const DEFAULT_MODEL = "claude";

const ResultsSection = () => {
  const [tab, setTab] = useQueryState(
    "metric",
    parseAsStringLiteral(["speed", "accuracy"] as const).withDefault("speed"),
  );

  const filteredResolverKeys = useMemo(
    () => getResolversForModel(DEFAULT_MODEL),
    [],
  );

  const controlKey = useMemo(
    () => getControlKeyForModel(DEFAULT_MODEL),
    [],
  );

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
          Geometric mean resolution time in seconds (lower is better)
        </p>
        <ResultsBarChart
          data={speedChartData}
          domain={speedScale.domain}
          ticks={speedScale.ticks}
          formatValue={formatSpeed}
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
        />
        <div className="ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] overflow-x-auto px-4 sm:px-8">
          <AccuracyTable resolverKeys={filteredResolverKeys} />
        </div>
      </TabsContent>
    </Tabs>
  );
};

export { ResultsSection };
