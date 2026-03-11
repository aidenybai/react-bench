import { Suspense } from "react";
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
        Evaluating coding agents on React retrieval tasks in complex,
        real-world codebases.
      </p>

      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          {benchData.testCases.length} test cases spanning 14 pattern categories
          (HOC stacking, compound components, barrel re-exports, dynamic imports,
          render props, name collisions, and more), each inspired by patterns in
          open-source projects like Cal.com, Excalidraw, LobeChat, and Plane.
          Given a natural-language description of a UI element, each resolver
          must identify the correct source file. Last benchmarked:{" "}
          <em>{benchData.lastBenchmarked}</em>.{" "}
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
      </div>

      <div className="pb-12" />
    </div>
  </div>
);

export default Page;
