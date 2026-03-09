"use client";

import { useQueryState, parseAsStringLiteral } from "nuqs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccuracyTable } from "@/components/accuracy-table";
import { SpeedTable } from "@/components/speed-table";
import {
  benchData,
  resolverKeys,
  getResolverColor,
} from "@/lib/bench-data";

const chartConfig: ChartConfig = Object.fromEntries(
  benchData.resolvers.map((resolver) => [
    resolver.key,
    {
      label: resolver.label,
      color: getResolverColor(resolver.key),
    },
  ]),
);

const speedChartData = benchData.scenarios.map((scenario) => ({
  label: scenario.label,
  ...Object.fromEntries(
    resolverKeys.map((resolverKey) => [
      resolverKey,
      scenario.results[resolverKey as keyof typeof scenario.results].speed,
    ]),
  ),
}));

const accuracyChartData = benchData.scenarios.map((scenario) => ({
  label: scenario.label,
  ...Object.fromEntries(
    resolverKeys.map((resolverKey) => [
      resolverKey,
      scenario.results[resolverKey as keyof typeof scenario.results].accuracy,
    ]),
  ),
}));

interface ResultsBarChartProps {
  data: Array<Record<string, unknown>>;
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
  <ChartContainer config={chartConfig} className="aspect-2/1 w-full">
    <BarChart
      data={data}
      layout="vertical"
      margin={{ top: 0, right: 40, bottom: 24, left: 0 }}
      barCategoryGap="18%"
      barGap={1}
    >
      <CartesianGrid horizontal={false} strokeDasharray="3 3" />
      <YAxis
        dataKey="label"
        type="category"
        tickLine={false}
        axisLine={false}
        width={160}
        tick={{ fontSize: 11 }}
      />
      <XAxis
        type="number"
        domain={domain}
        ticks={ticks}
        tickFormatter={formatValue}
        tickLine={false}
        axisLine={false}
        tick={{ fontSize: 10 }}
      />
      <ChartLegend verticalAlign="top" content={<ChartLegendContent />} />
      <ChartTooltip content={<ChartTooltipContent />} />
      {resolverKeys.map((resolverKey) => (
        <Bar
          key={resolverKey}
          dataKey={resolverKey}
          fill={getResolverColor(resolverKey)}
          radius={[0, 3, 3, 0]}
        >
          <LabelList
            dataKey={resolverKey}
            position="right"
            formatter={formatValue}
            style={{ fontSize: 10 }}
          />
        </Bar>
      ))}
    </BarChart>
  </ChartContainer>
);

const formatSpeed = (value: number) => `${value}s`;
const formatAccuracy = (value: number) => `${value}%`;

const SPEED_TICKS = [0, 5, 10, 15, 20, 25, 30];
const ACCURACY_TICKS = [0, 25, 50, 75, 100];

const ResultsSection = () => {
  const [tab, setTab] = useQueryState(
    "metric",
    parseAsStringLiteral(["speed", "accuracy"] as const).withDefault("speed"),
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
          Resolution time in seconds (lower is better)
        </p>
        <ResultsBarChart
          data={speedChartData}
          domain={[0, 30]}
          ticks={SPEED_TICKS}
          formatValue={formatSpeed}
        />
        <div className="overflow-x-auto">
          <SpeedTable />
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
        <div className="overflow-x-auto">
          <AccuracyTable />
        </div>
      </TabsContent>
    </Tabs>
  );
};

export { ResultsSection };
