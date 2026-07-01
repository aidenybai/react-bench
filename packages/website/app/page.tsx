import { Suspense } from "react";
import { GitHubIcon } from "@/components/icons/github-icon";
import { ResultsSection } from "@/components/results-section";
import { benchData } from "@/lib/bench-data";

const LINK_CLASS =
  "text-link underline decoration-link/30 underline-offset-[3px] decoration-1 transition-colors hover:decoration-link";

const CODEBASE_LINKS = [
  { label: "Cal.com", href: "https://github.com/calcom/cal.com" },
  { label: "Excalidraw", href: "https://github.com/excalidraw/excalidraw" },
  { label: "LobeChat", href: "https://github.com/lobehub/lobe-chat" },
  { label: "Plane", href: "https://github.com/makeplane/plane" },
];

const Page = () => (
  <div className="min-h-screen px-4 py-6 sm:px-8 sm:py-8">
    <div className="mx-auto flex w-full max-w-[600px] flex-col gap-6 pt-4 sm:pt-10">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-eyebrow tracking-[0.14em] text-meta uppercase">
            React Bench
          </span>
          <a
            href="https://github.com/aidenybai/react-bench"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
            className="inline-flex size-8 items-center justify-center rounded-md text-meta transition-colors hover:text-ink"
          >
            <GitHubIcon className="size-4" />
          </a>
        </div>
        <h1 className="font-serif text-display leading-[1.05] text-ink">
          Evaluating coding agents on React retrieval
        </h1>
        <p className="text-body text-prose">
          A benchmark for how reliably an agent can turn a natural-language
          description of a rendered UI element into the correct source file,
          measured across the messy patterns real React codebases actually ship.
        </p>
      </header>

      <div className="paper-hatch h-px w-full" />

      <div className="flex flex-col gap-4 text-body text-prose">
        <p>
          {benchData.testCases.length} test cases span 14 pattern categories
          &mdash; HOC stacking, compound components, barrel re-exports, dynamic
          imports, render props, name collisions, and more &mdash; each modeled
          on structures found in production codebases like{" "}
          {CODEBASE_LINKS.map((link, index) => (
            <span key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={LINK_CLASS}
              >
                {link.label}
              </a>
              {index < CODEBASE_LINKS.length - 1
                ? index === CODEBASE_LINKS.length - 2
                  ? ", and "
                  : ", "
                : "."}
            </span>
          ))}
        </p>
        <p>
          Given only a description of a rendered element, each resolver must
          identify the file where its component is defined. The gap between a
          well-prompted agent with grep access and one handed a source hint is
          exactly what these numbers isolate.
        </p>
        <p className="text-meta">
          Last benchmarked{" "}
          <em className="text-ink not-italic">{benchData.lastBenchmarked}</em>.{" "}
          <a
            href="https://github.com/aidenybai/react-bench#readme"
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASS}
          >
            Read the methodology
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
