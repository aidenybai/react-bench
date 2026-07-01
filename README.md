# React Bench

React Bench is a benchmark for evaluating how reliably coding agents locate React source files. Given a natural-language description of a rendered UI element, an agent must return the file where that component is defined — the retrieval step that has to succeed before any UI edit can happen.

The set is 330 test cases across 14 pattern categories, each modeled on component structures found in production codebases like [Cal.com](https://github.com/calcom/cal.com), [Excalidraw](https://github.com/excalidraw/excalidraw), [LobeChat](https://github.com/lobehub/lobe-chat), and [Plane](https://github.com/makeplane/plane).

**[View results →](https://react-bench.com)**

## Why source retrieval

Coding agents are increasingly driven from what a user sees on screen: "make the retry button on the error banner larger," "the avatar in the sidebar is misaligned." Before the agent can make that edit, it has to find the file the element comes from. In a well-structured demo app that step is trivial. In a production React codebase, with layers of higher-order components, dynamic imports, and re-exported names, it is often the hard part of the task.

A class of browser tools — [React Grab](https://github.com/aidenybai/react-grab), [Agentation](https://github.com/benjitaylor/agentation), [Cursor's browser inspector](https://cursor.com/docs/agent/browser), [Click to Component](https://github.com/ericclemmons/click-to-component), and [LocatorJS](https://github.com/infi-pc/locatorjs) — claim to close that gap by reading the React fiber tree and handing the agent a source hint. There was no shared, reproducible measurement of whether, and by how much, those tools actually help. React Bench is that measurement: it isolates the retrieval step, holds the agent and prompt fixed, and varies only the source hint each tool provides.

## What makes retrieval hard

The test cases are drawn from patterns that recur across open-source React and Next.js projects — Cal.com, Excalidraw, Twenty, LobeChat, Plane, Novu, Formbricks, Documenso, Dub, Inbox-zero — where the rendered component name and its source location diverge:

- **Deep wrapping.** Cal.com wraps components in `withLicenseRequired`, `withErrorBoundary`, `withTracking`, sometimes several layers deep. The "Russian Doll" case pushes this to 14 HOC layers around a single styled motion button; React DevTools shows a tower of anonymous wrappers, and grepping the component name returns nothing useful.
- **Indirection.** Excalidraw defines content in one component and renders it elsewhere through context tunnels. LobeChat selects the component to render at runtime from a key-value import map.
- **Name collisions.** Plane ships a `Button` in `@plane/ui` and another `Button` in `@plane/propel` — same export name, different packages.
- **Unexpected locations.** Dub puts JSX in `variables.tsx`, Inbox-zero puts components in `utils/scripts/`, and Documenso defines icon components inside config objects. An agent searching `components/` never finds them.

Each pattern is reproduced as one or more test cases — 330 in total, spanning deep nesting, factory components, generic names, sibling components, compound components, alias re-exports, `displayName` resolution, HOC stacking, dispatchers, polymorphic `forwardRef`, tunnel/context rendering, lazy named exports, dynamic import maps, JSX in data/config, render props, same-name collisions, and unexpected file locations.

## Methodology

The harness is a real Next.js app. All 330 components are rendered on the page with hashed `data-testid` attributes, so the test id itself gives nothing away — an earlier version used readable ids like `russian-doll-button`, which let the agent grep for the id and find the component instantly, defeating the purpose. Hashing with FNV produces ids like `b-a8f3e2d1`.

A run has two phases.

**Browser phase.** Playwright visits the app and iterates over every test case. For each one it locates the rendered element and runs all browser-side resolvers against it, capturing the clipboard payload or source hint each produces. Cases that require interaction first (opening a dropdown, expanding a recursive menu, opening a dialog inside a dialog) are driven before the element is read.

**Agent phase.** For each (test case × resolver) pair, we build a prompt and send it to Claude (`claude-sonnet-4-6` via the [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk)), with access to Read, Grep, Glob, and Bash. The agent searches the codebase and returns a file path. Without a tool, the prompt is the description alone:

> I need to find the source file for a React component in this Next.js app. Red-themed CollisionButton in collision-a directory, same export name as collision-b and collision-c variants. Where is it defined?

With a resolver, that tool's clipboard output is appended to the same prompt. The agent still has to return a file path; the hint only gives it a head start. Tasks run 20-wide with checkpointing, so an interrupted run resumes. A full run fires 1,000+ agent tasks and takes roughly 20–25 minutes.

**Scoring.** A returned path is correct only if it matches the expected source file. For the speed metric, wrong answers are penalized at 120 seconds. That penalty is deliberate — a wrong answer is worse than a slow correct one — but it means speed and accuracy are correlated by construction, and the two should be read together.

## Results

330 test cases, 6 resolvers, `claude-sonnet-4-6`. Speed is the geometric-mean resolution time (lower is better); accuracy is the share of cases resolved to the correct file (higher is better).

| Resolver             | Accuracy | Speed  |
| -------------------- | -------- | ------ |
| React Grab           | 96%      | 20.7s  |
| Cursor Browser       | 95%      | 30.7s  |
| Agentation           | 96%      | 31.5s  |
| LocatorJS            | 86%      | 41.8s  |
| Click to Component   | 86%      | 42.8s  |
| Claude Code (no tool)| 86%      | 45.1s  |

Without any tool, Claude Code resolves 86% of cases (285 / 330) at a geometric mean of 45.1 seconds. For most components, a well-prompted agent with grep access can find the file on its own.

Click to Component and LocatorJS do not change that. Both stay at 86% accuracy and roughly the same speed: the context they provide — a component name without a file path — is not enough to alter the agent's search behavior.

React Grab, Agentation, and Cursor Browser push accuracy to 95–96%. That lift of ~10 points is concentrated in the categories where a source path plus line number decides the outcome: factory components, name collisions, unexpected locations, and dynamic imports. Among the three, the gap is in speed rather than accuracy — React Grab resolves in 20.7 seconds against ~31 seconds for Agentation and Cursor Browser. The faster tool eliminates the search phase more completely, so the agent jumps straight to the file instead of running extra greps to confirm.

The practical takeaway: the difference between using any source-hint tool and using none is larger than the difference between the top tools. The hint matters most on the hard cases — the deeply nested component, the factory-generated widget, the component that lives in `schemas/` — where on easy cases the agent finds the file in seconds regardless.

## Limitations

- **One trial per case.** Agents are non-deterministic; a single run reports a point estimate. Multiple trials with confidence intervals would tighten the numbers.
- **One model.** Every resolver is evaluated against `claude-sonnet-4-6`. The tool ranking may shift with a different backend.
- **Self-contained corpus.** The 330 cases live in a single harness app. Results may not transfer directly to a large monorepo with real noise.
- **Coupled metrics.** The 120-second penalty on wrong answers makes speed punish inaccuracy, so speed and accuracy move together by construction.

## Running the benchmark

### Prerequisites

- Node.js 18+
- pnpm
- An Anthropic API key

### Install

```bash
pnpm install
```

### Run the harness dev server

```bash
pnpm --filter @react-bench/benchmark dev
```

This starts the Next.js app on `http://localhost:3001` with all 330 test components rendered.

### Run the full benchmark

```bash
ANTHROPIC_API_KEY=sk-... pnpm --filter @react-bench/benchmark test
```

This runs Playwright, collects browser results, sends 1,000+ agent tasks to Claude, and writes output files. To resume an interrupted run:

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

## Adding a test case

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

The test manifest is built automatically at runtime from every `.ts` file in `e2e/test-cases/` (excluding `index.ts` and `types.ts`).

## License

MIT
