import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-provider";
import { GitHubIcon } from "@/components/icons/github-icon";
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
        <div className="flex items-center gap-1">
          <a
            href="https://github.com/aidenybai/react-bench"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
          >
            <GitHubIcon className="size-4" />
          </a>
          <ThemeToggle />
        </div>
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
          <p className="text-sm text-muted-foreground">
            {benchData.testCases.length} test cases across 14 pattern categories
            inspired by real-world React/Next.js projects. Each resolver must
            identify the correct source file from a natural-language description.
            Last benchmarked: <em>{benchData.lastBenchmarked}</em>.{" "}
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
