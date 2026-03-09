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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ThemeToggle } from "@/components/theme-provider"
import benchData from "./data.json"

const COLORS: Record<string, string> = {
  "react-grab+claude": "oklch(0.7 0.25 330)",
  "agentation+claude": "oklch(0.65 0.2 260)",
  "claude-code": "oklch(0.7 0.15 50)",
}

const chartConfig = Object.fromEntries(
  benchData.resolvers.map((resolver) => [
    resolver.key,
    { label: resolver.label, color: COLORS[resolver.key] ?? "oklch(0.6 0 0)" },
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
      <TabsList variant="line">
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
              <Bar key={resolverKey} dataKey={resolverKey} fill={COLORS[resolverKey] ?? "oklch(0.6 0 0)"} radius={[0, 3, 3, 0]}>
                <LabelList dataKey={resolverKey} position="right" formatter={(value: number) => `${value}s`} style={{ fontSize: 10 }} />
              </Bar>
            ))}
          </BarChart>
        </ChartContainer>
        <div className="overflow-x-auto">
          <SpeedTable />
        </div>
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
              <Bar key={resolverKey} dataKey={resolverKey} fill={COLORS[resolverKey] ?? "oklch(0.6 0 0)"} radius={[0, 3, 3, 0]}>
                <LabelList dataKey={resolverKey} position="right" formatter={(value: number) => `${value}%`} style={{ fontSize: 10 }} />
              </Bar>
            ))}
          </BarChart>
        </ChartContainer>
        <div className="overflow-x-auto">
          <AccuracyTable />
        </div>
      </TabsContent>
    </Tabs>
  )
}


export default function Page() {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col pt-4 text-base sm:pt-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-medium flex items-center gap-2">
            <svg className="size-6" viewBox="0 0 521 521" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="React Bench logo">
              <mask id="logo-mask" style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="-1" y="0" width="522" height="521">
                <path d="M520.979 0H-0.002V520.981H520.979V0Z" fill="#737373"/>
              </mask>
              <g mask="url(#logo-mask)">
                <path d="M256.236 84.159C300.737 48.547 344.748 35.488 375.907 53.48C403.755 69.562 416.22 106.897 410.983 158.626C410.541 163.04 409.923 167.533 409.237 172.076L404.958 195.173C404.942 195.165 404.922 195.158 404.903 195.151C404.888 195.217 404.874 195.284 404.856 195.35L383.213 187.378C383.215 187.368 383.201 187.355 383.201 187.346C368.435 182.742 353.383 179.11 338.141 176.476L337.921 176.423L307.496 172.358L307.469 172.355C307.435 172.307 307.392 172.274 307.355 172.226C290.371 170.482 273.308 169.614 256.236 169.624C239.125 169.613 222.028 170.504 205.013 172.293C195.058 186.123 185.814 200.45 177.316 215.22C168.774 230.009 161.012 245.235 154.06 260.833C161.012 276.433 168.774 291.657 177.316 306.446C185.827 321.275 195.1 335.655 205.097 349.526C205.112 349.526 205.127 349.528 205.143 349.531L205.118 349.572L205.105 349.594L205.121 349.617L224.164 373.924L224.295 374.06C234.151 385.893 244.765 397.071 256.073 407.525L256.254 407.715L273.908 422.255C273.85 422.312 273.791 422.366 273.732 422.421C273.754 422.441 273.779 422.459 273.804 422.477L254.902 438.548L254.868 438.575C224.27 462.731 193.989 476.229 167.993 476.229C156.988 476.392 146.138 473.617 136.564 468.188C108.714 452.105 96.251 414.769 101.486 363.04C101.942 358.496 102.567 353.866 103.293 349.189C50.213 328.408 16.875 296.835 16.875 260.833C16.875 228.668 42.968 199.172 90.357 177.869C94.528 175.993 98.869 174.202 103.293 172.513C102.567 167.817 101.942 163.17 101.486 158.626C96.251 106.897 108.714 69.562 136.564 53.48C167.723 35.488 211.734 48.547 256.236 84.159ZM125.181 356.738C124.792 359.645 124.438 362.501 124.168 365.339C119.912 406.802 128.558 437.035 147.72 448.307L147.997 448.438C168.415 460.23 202.04 450.855 238.84 422.421C222.034 406.596 206.61 389.363 192.735 370.914C169.853 368.128 147.253 363.387 125.181 356.738ZM142.39 289.62C137.05 304.219 132.667 319.153 129.268 334.32C143.852 338.857 158.714 342.443 173.762 345.059L174.478 345.218C168.719 336.45 163.062 327.226 157.59 317.866C152.118 308.507 147.085 299.064 142.39 289.62ZM107.667 195.285C104.965 196.412 102.314 197.538 99.713 198.664C61.629 215.845 39.674 238.501 39.674 260.833C39.674 284.401 64.619 308.863 107.65 326.517C112.957 304.049 120.166 282.077 129.2 260.833C120.183 239.633 112.979 217.705 107.667 195.285ZM174.393 176.567C159.143 179.234 144.08 182.885 129.302 187.498C132.644 202.373 136.933 217.019 142.141 231.347L142.305 232.029C147.069 222.569 152.05 213.243 157.505 203.8C162.96 194.357 168.618 185.302 174.393 176.567ZM168.213 68.262C161.137 68.097 154.144 69.811 147.946 73.228C128.702 84.352 119.963 114.466 124.118 155.842L124.117 156.329C124.387 159.166 124.741 162.022 125.13 164.911C147.21 158.308 169.808 153.584 192.684 150.788C206.566 132.333 222.002 115.1 238.824 99.279C212.427 78.871 187.651 68.262 168.213 68.262ZM364.575 73.212C358.427 69.815 351.494 68.101 344.474 68.241L344.291 68.245C324.854 68.245 300.078 78.854 273.682 99.262C290.491 115.072 305.915 132.293 319.786 150.737C342.669 153.52 365.268 158.262 387.34 164.911C387.745 162.022 388.083 159.15 388.37 156.312C392.592 114.669 383.912 84.378 364.575 73.212ZM256.152 113.96C244.727 124.506 234.006 135.793 224.062 147.747C234.602 147.071 245.297 146.733 256.152 146.733C267.095 146.733 277.818 147.105 288.324 147.747C278.353 135.791 267.605 124.503 256.152 113.96Z" fill="currentColor"/>
              </g>
              <path fillRule="evenodd" clipRule="evenodd" d="M267.001 320C267.001 269.19 308.191 228 359.001 228C409.812 228 451.001 269.19 451.001 320C451.001 370.811 409.812 412 359.001 412C308.191 412 267.001 370.811 267.001 320ZM318.35 294.326C318.35 286.054 325.055 279.349 333.327 279.349C341.598 279.349 348.303 286.054 348.303 294.326C348.303 302.597 341.598 309.302 333.327 309.302C325.055 309.302 318.35 302.597 318.35 294.326ZM369.699 345.674C369.699 337.403 376.404 330.698 384.675 330.698C392.947 330.698 399.652 337.403 399.652 345.674C399.652 353.946 392.947 360.651 384.675 360.651C376.404 360.651 369.699 353.946 369.699 345.674ZM330.821 360.285L399.286 291.82L387.183 279.717L318.718 348.182L330.821 360.285Z" fill="currentColor"/>
            </svg>
            React Bench
          </h1>
          <ThemeToggle />
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Evaluating coding agents on React.js tasks.
        </p>

        <Tabs defaultValue="retrieval">
          <TabsList variant="line">
            <TabsTrigger value="retrieval">Retrieval</TabsTrigger>
            <TabsTrigger value="perf" disabled>Performance</TabsTrigger>
            <TabsTrigger value="a11y" disabled>Accessibility</TabsTrigger>
            <TabsTrigger value="refactor" disabled>Refactoring</TabsTrigger>
          </TabsList>

          <TabsContent value="retrieval" className="mt-6 space-y-6">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Given a natural-language description of a UI element, each
                resolver must identify the correct React source file across 68
                test cases spanning 4 complexity tiers:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><a href="https://github.com/aidenybai/react-bench/tree/main/packages/benchmark/components/atoms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-foreground transition-colors">Plain components</a></li>
                <li><a href="https://github.com/aidenybai/react-bench/tree/main/packages/benchmark/components/common" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-foreground transition-colors">HOCs, portals, compound</a></li>
                <li><a href="https://github.com/aidenybai/react-bench/tree/main/packages/benchmark/components/features" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-foreground transition-colors">Nested HOCs + Radix + Motion</a></li>
                <li><a href="https://github.com/aidenybai/react-bench/tree/main/packages/benchmark/components/challenge" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-foreground transition-colors">Recursive trees, triple portals, factories</a></li>
              </ul>
              <p>
                All runs use{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  claude-sonnet-4-6
                </code>{" "}
                with identical system prompts and no prior context.
                Last benchmarked: <em>{benchData.lastBenchmarked}</em>.{" "}
                <a
                  href="https://github.com/aidenybai/react-bench"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-foreground transition-colors"
                >
                  Source &amp; methodology
                </a>
                .
              </p>
            </div>

            <Suspense>
              <ResultsSection />
            </Suspense>
          </TabsContent>
        </Tabs>

        <div className="pb-12" />
      </div>
    </div>
  )
}
