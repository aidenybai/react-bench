import { Suspense } from "react";
import { GitHubIcon } from "@/components/icons/github-icon";
import { ReactBenchLogo } from "@/components/icons/react-bench-logo";
import { ResultsSection } from "@/components/results-section";
import { benchData } from "@/lib/bench-data";

const LINK_CLASS =
  "underline decoration-stone-300/70 underline-offset-[3px] decoration-1 hover:decoration-stone-400";

const Page = () => (
  <div className="min-h-screen px-4 py-6 sm:px-8 sm:py-8">
    <div className="mx-auto flex w-full max-w-[600px] flex-col gap-2 pt-4 text-base leading-relaxed sm:pt-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <ReactBenchLogo className="size-6" />
          React Bench
        </h1>
        <a
          href="https://github.com/aidenybai/react-bench"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
        >
          <GitHubIcon className="size-4" />
        </a>
      </div>
      <p>
        Evaluating coding agents on React retrieval tasks in complex, real-world
        codebases.
      </p>

      <div className="flex flex-col gap-2">
        <p>
          {benchData.testCases.length} test cases across 14 pattern categories
          (HOC stacking, compound components, barrel re-exports, dynamic
          imports, render props, name collisions, and more).
        </p>
        <p>
          Inspired by production codebases like{" "}
          <a
            href="https://github.com/calcom/cal.com"
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASS}
          >
            Cal.com
          </a>
          ,{" "}
          <a
            href="https://github.com/excalidraw/excalidraw"
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASS}
          >
            Excalidraw
          </a>
          ,{" "}
          <a
            href="https://github.com/lobehub/lobe-chat"
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASS}
          >
            LobeChat
          </a>
          , and{" "}
          <a
            href="https://github.com/makeplane/plane"
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASS}
          >
            Plane
          </a>
          . Given a natural-language description of a UI element, each resolver
          must identify the correct source file.
        </p>
        <p>
          Last benchmarked: <em>{benchData.lastBenchmarked}</em>.{" "}
          <a
            href="https://github.com/aidenybai/react-bench#readme"
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
