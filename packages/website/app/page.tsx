"use client"

import { Suspense } from "react"
import { useQueryState, parseAsStringLiteral } from "nuqs"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import benchData from "./data.json"

const COLORS: Record<string, string> = {
  "react-grab+claude": "var(--chart-1)",
  "agentation+claude": "var(--chart-2)",
  "claude-code": "var(--chart-3)",
}

const chartConfig = Object.fromEntries(
  benchData.resolvers.map((resolver) => [
    resolver.key,
    { label: resolver.label, color: COLORS[resolver.key] ?? "var(--chart-4)" },
  ]),
) as ChartConfig

const resolverKeys = benchData.resolvers.map((resolver) => resolver.key)
const controlKey = (benchData as { control?: string }).control

const getChangeInfo = (
  controlVal: number,
  treatmentVal: number,
  lowerIsBetter: boolean,
): { change: string; bgColor: string } => {
  if (!controlVal || !treatmentVal)
    return { change: "", bgColor: "transparent" }
  const pct = ((treatmentVal - controlVal) / controlVal) * 100
  if (Math.abs(pct) < 0.5) return { change: "", bgColor: "transparent" }
  const isGood = lowerIsBetter ? pct < 0 : pct > 0
  const abs = Math.abs(pct)
  const intensity = Math.min(abs / 100, 1)
  const opacity = 0.1 + intensity * 0.3
  return {
    change: `${isGood ? "\u2193" : "\u2191"}${Math.round(abs)}%`,
    bgColor: isGood
      ? `rgba(100, 200, 150, ${opacity})`
      : `rgba(240, 120, 120, ${opacity})`,
  }
}

const speedChartData = benchData.scenarios.map((scenario) => ({
  label: scenario.label,
  ...Object.fromEntries(
    resolverKeys.map((key) => [
      key,
      scenario.results[key as keyof typeof scenario.results].speed,
    ]),
  ),
}))

const accuracyChartData = benchData.scenarios.map((scenario) => ({
  label: scenario.label,
  ...Object.fromEntries(
    resolverKeys.map((key) => [
      key,
      scenario.results[key as keyof typeof scenario.results].accuracy,
    ]),
  ),
}))

interface ScenarioCollapsibleProps {
  title: string
  summary: string
  items: string[]
}

const ScenarioCollapsible = ({ title, summary, items }: ScenarioCollapsibleProps) => (
  <Collapsible>
    <CollapsibleTrigger asChild>
      <Button variant="ghost" size="sm" className="h-auto w-full justify-between p-0 font-normal text-left">
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">{title}</span>
          {": "}{summary}
        </span>
        <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
      </Button>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <ul className="list-disc pl-7 mt-1.5 mb-2 space-y-1 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </CollapsibleContent>
  </Collapsible>
)

const SpeedTable = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Test Case</TableHead>
        {resolverKeys.map((resolverKey) => {
          const resolver = benchData.resolvers.find(
            (innerResolver) => innerResolver.key === resolverKey,
          )
          return (
            <TableHead key={resolverKey} className="text-right">
              {resolver?.label ?? resolverKey}
            </TableHead>
          )
        })}
      </TableRow>
    </TableHeader>
    <TableBody>
      {benchData.testCases.map((testCase) => {
        const controlResult = controlKey
          ? testCase.results[controlKey as keyof typeof testCase.results]
          : null
        return (
          <TableRow key={testCase.id}>
            <TableCell className="font-medium max-w-[200px] truncate" title={testCase.difficulty}>
              {testCase.testId}
            </TableCell>
            {resolverKeys.map((resolverKey) => {
              const result = testCase.results[resolverKey as keyof typeof testCase.results]
              const isControl = resolverKey === controlKey
              const info =
                !isControl && controlResult
                  ? getChangeInfo(controlResult.speed, result.speed, true)
                  : { change: "", bgColor: "transparent" }
              return (
                <TableCell
                  key={resolverKey}
                  className="text-right tabular-nums text-xs"
                  style={{
                    color: isControl ? "var(--muted-foreground)" : "var(--foreground)",
                    backgroundColor: info.bgColor,
                  }}
                >
                  {result.speed ? `${result.speed}s` : "\u2014"}
                  {info.change && (
                    <span className="ml-1.5 text-[10px] opacity-70">{info.change}</span>
                  )}
                </TableCell>
              )
            })}
          </TableRow>
        )
      })}
    </TableBody>
  </Table>
)

const AccuracyTable = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Test Case</TableHead>
        {resolverKeys.map((resolverKey) => {
          const resolver = benchData.resolvers.find(
            (innerResolver) => innerResolver.key === resolverKey,
          )
          return (
            <TableHead key={resolverKey} className="text-right">
              {resolver?.label ?? resolverKey}
            </TableHead>
          )
        })}
      </TableRow>
    </TableHeader>
    <TableBody>
      {benchData.testCases.map((testCase) => {
        const controlResult = controlKey
          ? testCase.results[controlKey as keyof typeof testCase.results]
          : null
        return (
          <TableRow key={testCase.id}>
            <TableCell className="font-medium max-w-[200px] truncate" title={testCase.difficulty}>
              {testCase.testId}
            </TableCell>
            {resolverKeys.map((resolverKey) => {
              const result = testCase.results[resolverKey as keyof typeof testCase.results]
              const isControl = resolverKey === controlKey
              const controlCorrect = controlResult?.correct ?? false
              const didImproveOverControl = !isControl && result.correct && !controlCorrect
              const didRegressFromControl = !isControl && !result.correct && controlCorrect
              const bgColor = didImproveOverControl
                ? "rgba(100, 200, 150, 0.2)"
                : didRegressFromControl
                  ? "rgba(240, 120, 120, 0.2)"
                  : "transparent"
              return (
                <TableCell
                  key={resolverKey}
                  className="text-right tabular-nums text-xs"
                  style={{
                    color: result.correct ? "var(--foreground)" : "var(--muted-foreground)",
                    backgroundColor: bgColor,
                  }}
                >
                  {result.correct ? "\u2713" : "\u2717"}
                </TableCell>
              )
            })}
          </TableRow>
        )
      })}
    </TableBody>
  </Table>
)

const ResultsSection = () => {
  const [tab, setTab] = useQueryState(
    "metric",
    parseAsStringLiteral(["speed", "accuracy"] as const).withDefault("speed"),
  )

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as "speed" | "accuracy")}>
      <TabsList>
        <TabsTrigger value="speed">Speed</TabsTrigger>
        <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
      </TabsList>

      <TabsContent value="speed" className="space-y-6">
        <p className="text-sm text-muted-foreground italic">
          Resolution time in seconds (lower is better)
        </p>
        <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
          <BarChart
            data={speedChartData}
            layout="vertical"
            margin={{ top: 0, right: 40, bottom: 24, left: 0 }}
            barCategoryGap="18%"
            barGap={1}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={160} tick={{ fontSize: 11 }} />
            <XAxis type="number" domain={[0, 30]} ticks={[0, 5, 10, 15, 20, 25, 30]} tickFormatter={(v) => `${v}s`} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {resolverKeys.map((resolverKey) => (
              <Bar key={resolverKey} dataKey={resolverKey} fill={`var(--color-${resolverKey})`} radius={[0, 3, 3, 0]}>
                <LabelList dataKey={resolverKey} position="right" formatter={(value: number) => `${value}s`} style={{ fontSize: 10 }} />
              </Bar>
            ))}
          </BarChart>
        </ChartContainer>
        <Card>
          <CardHeader>
            <CardTitle>All Test Cases</CardTitle>
            <CardDescription>
              Resolution time per test case. Each treatment column shows % change vs. control (lower is better).
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <SpeedTable />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="accuracy" className="space-y-6">
        <p className="text-sm text-muted-foreground italic">
          Correct resolutions in % (higher is better)
        </p>
        <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
          <BarChart
            data={accuracyChartData}
            layout="vertical"
            margin={{ top: 0, right: 40, bottom: 24, left: 0 }}
            barCategoryGap="18%"
            barGap={1}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={160} tick={{ fontSize: 11 }} />
            <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {resolverKeys.map((resolverKey) => (
              <Bar key={resolverKey} dataKey={resolverKey} fill={`var(--color-${resolverKey})`} radius={[0, 3, 3, 0]}>
                <LabelList dataKey={resolverKey} position="right" formatter={(value: number) => `${value}%`} style={{ fontSize: 10 }} />
              </Bar>
            ))}
          </BarChart>
        </ChartContainer>
        <Card>
          <CardHeader>
            <CardTitle>All Test Cases</CardTitle>
            <CardDescription>
              Whether each resolver found the correct source file. Green = improvement over control.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <AccuracyTable />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

const SCENARIOS: ScenarioCollapsibleProps[] = [
  {
    title: "plain components",
    summary: "12 components with a single owner and no indirection.",
    items: [
      "styled-components (card, button, badge)",
      "Tailwind utility classes (card, button, badge)",
      "CSS Modules with scoped class names",
      "inline React styles (zero class names)",
      "shadcn/ui composite (Card + Avatar + Badge)",
      "one Radix Tabs trigger, one Motion animated card",
      "a div rendered inside 6 context providers",
    ],
  },
  {
    title: "HOCs, portals, compound",
    summary: "18 components where the DOM parent no longer maps directly to the React owner.",
    items: [
      "memo / forwardRef wrappers and HOCs (tracking, tooltip)",
      "Radix portals (Dialog, Dropdown, Popover, Accordion)",
      "10+ nested Fragment layers (zero DOM wrappers)",
      "Suspense boundaries with lazy-loaded children",
      "AnimatePresence list items and stagger grids",
      "compound table structures and shadcn/ui form inputs",
      "Tailwind dashboard stats, CSS Module table badges",
    ],
  },
  {
    title: "nested HOCs + Radix + Motion",
    summary: "14 components combining multiple abstraction layers in a single tree.",
    items: [
      "depth-8 binary tree with 256 identical styled leaves",
      "10-level recursive menu",
      "fractal subdividing grid",
      "HOC-wrapped Motion cards inside styled layouts",
      "portal modals with Motion enter/exit animations",
      "dynamic renderers with computed component selection",
      "conditional trees branching on prop hash",
      "Motion layoutId tab indicators",
      "elements styled by 2-4 systems simultaneously (styled-components + Tailwind + CSS Modules + inline)",
    ],
  },
  {
    title: "recursive trees, triple portals, factories",
    summary: "24 adversarial cases.",
    items: [
      "25-layer Fiber trees (providers, HOCs, styled, Motion, fragments, Suspense, Radix portal)",
      "15+ nested HOC wrappers around a single button",
      "triple-nested portals (Dialog, Popover, createPortal)",
      "AnimatePresence, Motion, styled-components, and Radix Accordion in one tree",
      "same component rendered at 6 different depths with identical DOM output",
      "components that change tree shape on a timer",
      "factory-generated widgets via createWidget()",
      "components defined inside hook files or utility modules",
      "barrel re-exports through 3 index files",
      "directory nesting 5 levels deep",
      "auto-generated component registries with slug-based lookup",
    ],
  },
]

export default function Page() {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col pt-4 text-base sm:pt-8">
        <h1 className="text-xl font-medium mb-1">React Bench</h1>
        <p className="text-sm text-muted-foreground mb-1">
          Evaluating coding agents on React.js tasks.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Last benchmarked: <em>{benchData.lastBenchmarked}</em>.
        </p>

        <div className="space-y-3 text-sm text-muted-foreground mb-8">
          <p>
            This benchmark compares treatment tools (React Grab, Agentation)
            against a control (Claude Code with no tool) at locating the source
            file of a React component, given only a description of what the user
            sees on screen.
          </p>
          <p>
            Each scenario groups test cases by the structural complexity of the
            React tree the resolver must navigate:
          </p>
          <ul className="space-y-2 list-disc pl-5">
            {SCENARIOS.map((scenario) => (
              <li key={scenario.title}>
                <ScenarioCollapsible {...scenario} />
              </li>
            ))}
          </ul>
          <p>
            All runs use{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              claude-sonnet-4-6
            </code>{" "}
            with identical system prompts. Each resolver receives the same text
            description of the target element.{" "}
            <a
              href="https://github.com/aidenybai/react-bench"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Source &amp; reproduction steps
            </a>
            .
          </p>
        </div>

        <Suspense>
          <ResultsSection />
        </Suspense>

        <div className="pb-12" />
      </div>
    </div>
  )
}
