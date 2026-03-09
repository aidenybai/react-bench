import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-provider";
import { ReactBenchLogo } from "@/components/icons/react-bench-logo";
import { ResultsSection } from "@/components/results-section";
import { benchData } from "@/lib/bench-data";

const LINK_CLASS =
  "underline underline-offset-4 hover:text-foreground transition-colors";

const Page = () => (
  <div className="min-h-screen px-4 py-6 sm:px-8 sm:py-8">
    <div className="mx-auto flex w-full max-w-3xl flex-col pt-4 text-base sm:pt-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-medium flex items-center gap-2">
          <ReactBenchLogo className="size-6" />
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
          <TabsTrigger value="perf" disabled>
            Performance
          </TabsTrigger>
          <TabsTrigger value="a11y" disabled>
            Accessibility
          </TabsTrigger>
          <TabsTrigger value="refactor" disabled>
            Refactoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="retrieval" className="mt-6 space-y-6">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Given a natural-language description of a UI element, each
              resolver must identify the correct React source file across 68
              test cases spanning 4 complexity tiers:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <a
                  href="https://github.com/aidenybai/react-bench/tree/main/packages/benchmark/components/atoms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LINK_CLASS}
                >
                  Plain components
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/aidenybai/react-bench/tree/main/packages/benchmark/components/common"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LINK_CLASS}
                >
                  HOCs, portals, compound
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/aidenybai/react-bench/tree/main/packages/benchmark/components/features"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LINK_CLASS}
                >
                  Nested HOCs + Radix + Motion
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/aidenybai/react-bench/tree/main/packages/benchmark/components/challenge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LINK_CLASS}
                >
                  Recursive trees, triple portals, factories
                </a>
              </li>
            </ul>
            <p>
              All runs use{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                claude-sonnet-4-6
              </code>{" "}
              with identical system prompts and no prior context. Last
              benchmarked: <em>{benchData.lastBenchmarked}</em>.{" "}
              <a
                href="https://github.com/aidenybai/react-bench"
                target="_blank"
                rel="noopener noreferrer"
                className={LINK_CLASS}
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
);

export default Page;
