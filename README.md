# React Bench

331 test cases spanning 14 pattern categories, each inspired by component structures found in production codebases like [Cal.com](https://github.com/calcom/cal.com), [Excalidraw](https://github.com/excalidraw/excalidraw), [LobeChat](https://github.com/lobehub/lobe-chat), and [Plane](https://github.com/makeplane/plane). Given a natural-language description of a UI element, each resolver must identify the correct source file.

**[View results](https://react-bench.com)**

## My React Grab benchmark was broken, so I built a harder one

When I shipped [React Grab](https://www.react-grab.com/blog/intro), I benchmarked it on 20 UI tasks in a shadcn dashboard. The result was a ~3x speedup over Claude Code alone. Directionally correct, but there were obvious problems:

1. The shadcn dashboard is well-structured and shallow. Components have clear names. Files live where you'd expect them. Most real apps aren't like that.
2. React Grab wasn't the only tool solving this problem. [Agentation](https://github.com/benjitaylor/agentation), [Cursor Browser](https://cursor.com/docs/agent/browser), [Click to Component](https://github.com/ericclemmons/click-to-component), [LocatorJS](https://github.com/infi-pc/locatorjs), [Instruckt](https://github.com/joshcirre/instruckt) all claim to help agents find source files faster. Nobody had compared them.
3. Agents are non-deterministic. Running each test once gives you a point estimate with unknown variance.

I kept seeing people tweet about how tools helped them in their workflows, but there wasn't any concrete data to back those claims up.

So I decided to build the benchmark myself.

### Digging through production codebases

I spent a couple weeks reading through popular open-source React/Next.js projects: [Cal.com](https://github.com/calcom/cal.com), [Excalidraw](https://github.com/excalidraw/excalidraw), [Twenty](https://github.com/twentyhq/twenty), [LobeChat](https://github.com/lobehub/lobe-chat), [Plane](https://github.com/makeplane/plane), [Novu](https://github.com/novuhq/novu), [Formbricks](https://github.com/formbricks/formbricks), [Documenso](https://github.com/documenso/documenso), [Dub](https://github.com/dubinc/dub), [Inbox-zero](https://github.com/elie222/inbox-zero). I was looking for patterns that would make source-file retrieval hard.

In short: real codebases do awful things.

Cal.com wraps components in `withLicenseRequired`, `withErrorBoundary`, `withTracking`. Sometimes 3-4 layers deep. I turned this up to 14 layers in a test case I called "Russian Doll":

```typescript
const Layer1 = withPermissions(InnerButton, "read");
const Layer2 = withErrorBoundary(Layer1);
const Layer3 = withTracking(Layer2, "russian-doll-1");
// ...11 more layers...
const RussianDollWrapped = withErrorBoundary(Layer14);
```

React DevTools shows a tower of anonymous wrappers. The actual `StyledMotionButton` is buried so deep that grepping for the component name returns nothing useful.

Excalidraw uses context tunnels where content is _defined_ in one component and _rendered_ in a completely different part of the tree. LobeChat uses dynamic import maps where the component to render is selected at runtime from a key-value lookup. Plane has a `Button` in `@plane/ui` and another `Button` in `@plane/propel`. Same export name, different packages. Good luck.

And then there's the truly cursed stuff. Dub puts JSX in `variables.tsx`. Inbox-zero puts components in `utils/scripts/`. Documenso defines icon components inside config objects. An agent searching `components/` will never find them.

I turned each of these patterns into test cases. 331 of them, across 14 categories.<sup>1</sup>

### Benchmarking at scale

The harness is a real Next.js app. All 331 components are rendered on the page with hashed `data-testid` attributes, so the test ID itself gives nothing away.<sup>2</sup>

A benchmark run has two phases.

**Browser phase.** Playwright visits the app and iterates over every test case. For each one, it finds the rendered element and runs all six browser-side tools against it. Each tool produces a clipboard payload or source hint. Some cases need interaction first (clicking a dropdown trigger, expanding a recursive menu, opening a dialog inside a dialog).

**Agent phase.** For each test case × tool combination, we build a prompt and send it to Claude (claude-sonnet-4-6 via the [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk)). The agent gets access to Read, Grep, Glob, and Bash. It searches the codebase and returns a file path. 20 concurrent agent tasks with checkpointing so interrupted runs can resume.

Without any tool, the prompt looks like this:

"I need to find the source file for a React component in this Next.js app. Red-themed CollisionButton in collision-a directory, same export name as collision-b and collision-c variants. Where is it defined?"

With a tool (e.g. React Grab), the tool's clipboard output gets appended to the same prompt. The agent still has to return a file path, but now it has a head start.

If the returned path matches the expected file, it's correct. Wrong answers get penalized at 120 seconds for speed calculations.<sup>3</sup> The whole run takes about 20-25 minutes and fires off 1000+ agent tasks.

### Results

331 test cases. 7 resolvers.

Without any tool, Claude Code gets 86% accuracy at a geometric mean of 45.1 seconds. That's 285 out of 331 correct. For most components, a well-prompted agent with grep access _can_ find the file.

Adding Click to Component or LocatorJS doesn't help. Both stay at 86% accuracy, roughly the same speed. The extra context they provide (component name without a file path) isn't enough to change the agent's search behavior.

Adding React Grab, Agentation, Cursor Browser, or Instruckt pushes accuracy to 95-96%. That gap from 86% to 96% is 30-ish additional correct cases, concentrated in factory components, name collisions, unexpected locations, and dynamic imports. These are exactly the cases where a source file path + line number changes the outcome.

...and turns out, there's a ~2x speed gap even among the accurate tools. React Grab and Instruckt average ~20.7 seconds. Agentation and Cursor Browser average ~31 seconds. All four hit 95%+ accuracy, but the faster ones eliminate the search phase more completely. The agent jumps straight to the file instead of doing a couple extra greps to confirm.

View the full per-case breakdown at [react-bench.com](https://react-bench.com).

### How it impacts you

The difference between the top tools is smaller than the difference between using _any_ tool and using none. If you iterate on UI frequently, pick whichever fits your setup. All four top-tier tools (React Grab, Instruckt, Agentation, Cursor Browser) will get you to 95%+ accuracy.

Where the tools matter most is the hard cases. The deeply nested component, the factory-generated widget, the component that lives in `schemas/` for some reason. On easy cases, the agent finds the file in seconds regardless. On hard cases, the source hint is the difference between a correct edit and a wasted 2 minutes.

### What's next

There are a lot of improvements that can be made to this benchmark:

- Multiple trials and sampling. Run each test 3-5 times and report confidence intervals. One trial per case is a known limitation.
- More models. GPT-4.1, Gemini 2.5, Claude Haiku. Does the tool ranking change with different backends?
- More codebases. The benchmark is self-contained right now. What happens when you drop these patterns into a 200k-line monorepo with real noise?
- Community test cases. If you've seen a pattern in your codebase that would stump an agent, [open an issue](https://github.com/aidenybai/react-bench/issues). Adding a case is four steps: write the component, write the definition, render it, done.

If you want to help out or have ideas, hit me up on [Twitter](https://x.com/aidenybai) or open an issue on GitHub.

### Try it out

React Bench is free and open source. [Go check it out!](https://react-bench.com)

[Star on GitHub](https://github.com/aidenybai/react-bench) [View results](https://react-bench.com)

#### Footnotes

<sup>1</sup>The categories: deep nesting, factory components, generic names, sibling components, compound components, alias re-exports, displayName resolution, HOC stacking, switch/type dispatchers, polymorphic forwardRef, tunnel/context rendering, lazy named exports, dynamic import maps, JSX in data/config, render props, same-name collisions, unexpected file locations, and more. Every test case includes a reference link to the original project that inspired it. Full list in the [README](https://github.com/aidenybai/react-bench#readme).

<sup>2</sup>Early versions used readable `data-testid` values like `russian-doll-button`. The agent would just grep for the test ID and find the component instantly, defeating the purpose. Hashing with FNV produces IDs like `b-a8f3e2d1` that give away nothing about the component.

<sup>3</sup>The 120-second penalty is a design decision. It makes speed scores punish inaccuracy heavily, which I think is correct. A wrong answer is worse than a slow correct one. But it means speed and accuracy are correlated by construction. Read the numbers with that in mind.

## Running the Benchmark

### Prerequisites

- Node.js 18+
- pnpm
- An Anthropic API key

### Install

```bash
pnpm install
```

### Run the benchmark harness dev server

```bash
pnpm --filter @react-bench/benchmark dev
```

This starts the Next.js app on `http://localhost:3001` with all 331 test components rendered.

### Run the full benchmark

```bash
ANTHROPIC_API_KEY=sk-... pnpm --filter @react-bench/benchmark test
```

This takes about 20-25 minutes. It runs Playwright, collects browser results, sends 1000+ agent tasks to Claude, and writes output files.

To resume an interrupted run:

```bash
BENCH_RESUME=1 ANTHROPIC_API_KEY=sk-... pnpm --filter @react-bench/benchmark test
```

To adjust concurrency (default 20):

```bash
BENCH_CONCURRENCY=10 ANTHROPIC_API_KEY=sk-... pnpm --filter @react-bench/benchmark test
```

### View results on the website

```bash
pnpm --filter @react-bench/website dev
```

The website reads from `packages/website/app/data.json`, which is written by the benchmark run.

### Run checks

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm format
```

## Adding a Test Case

1. Create a component file under `packages/benchmark/` (e.g. `components/my-pattern/my-component.tsx`).
2. Create a test case definition at `packages/benchmark/e2e/test-cases/my-test-id.ts`:

```typescript
import type { TestCaseDefinition } from "./types";

const testCase: TestCaseDefinition = {
  filePath: "components/my-pattern/my-component.tsx",
  componentName: "MyComponent",
  description: "Description of what makes this component hard to find",
  lazyDescription: "the component in my pattern section",
};

export default testCase;
```

3. Import and render the component in `packages/benchmark/app/client-benchmarks.tsx` with a matching `data-testid` attribute (the `testId` is derived from the filename, e.g. `my-test-id`).

4. If the component requires interaction before it becomes visible (e.g. clicking a trigger), add an entry to `packages/benchmark/e2e/interactions.ts`.

The test manifest is built automatically at runtime from all `.ts` files in `e2e/test-cases/` (excluding `index.ts` and `types.ts`).

## License

MIT
