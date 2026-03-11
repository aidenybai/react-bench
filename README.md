# React Bench

Evaluating coding agents on React component source retrieval.

**[View results](https://react-bench.com)**

## About

React Bench is a benchmark harness that measures how accurately coding agents can identify the source file of a rendered React component, given a natural-language description. The harness is a real Next.js app with 298 test cases spanning 14 pattern categories, each inspired by component structures found in popular open-source React/Next.js projects.

## Project Structure

This is a pnpm monorepo with Turborepo:

```
packages/
  benchmark/      Next.js benchmark harness (298 test cases, Playwright e2e)
  website/        Next.js results display site (shadcn/ui, charts, tables)
  react-bench/    npm placeholder package
  reactbench/     npm placeholder package
```

## Test Case Categories

Every test case is inspired by real patterns found in production codebases. Each test case definition includes a reference link to the original project.

| Category | Cases | Inspired By |
|---|---|---|
| Deep Nesting | 35 | Cal.com platform types, Twenty record-table |
| Factory Components | 30 | Data dashboards with repeated metric patterns |
| Generic Names | 30 | Component libraries with common names (Button, Card) |
| Sibling Components | 20 | Shared templates with near-identical siblings |
| Compound (Object.assign) | 4 | [Excalidraw Sidebar](https://github.com/excalidraw/excalidraw/blob/master/packages/excalidraw/components/Sidebar/Sidebar.tsx), [Cal.com Table](https://github.com/calcom/cal.com/blob/main/packages/ui/components/table/Table.tsx) |
| Alias Re-exports | 5 | [Excalidraw Footer/FooterCenter](https://github.com/excalidraw/excalidraw/blob/master/packages/excalidraw/index.tsx), [Novu Inbox chain](https://github.com/novuhq/novu/blob/main/packages/react/src/components/Inbox.tsx) |
| displayName Resolution | 4 | [Excalidraw DropdownMenu](https://github.com/excalidraw/excalidraw/blob/master/packages/excalidraw/components/dropdownMenu/dropdownMenuUtils.ts) |
| HOC Stacking (3-4 layers) | 5 | [Cal.com withLicenseRequired](https://github.com/calcom/cal.com/blob/main/apps/web/modules/ee/common/components/LicenseRequired.tsx) |
| Switch/Type Dispatchers | 5 | [Formbricks ElementConditional](https://github.com/formbricks/formbricks/blob/main/packages/surveys/src/components/general/element-conditional.tsx) |
| Polymorphic forwardRef | 4 | [Cal.com Form](https://github.com/calcom/cal.com/blob/main/packages/ui/components/form/inputs/Form.tsx), [Twenty SuggestionMenu](https://github.com/twentyhq/twenty/blob/main/packages/twenty-front/src/modules/ui/suggestion/components/SuggestionMenu.tsx) |
| Tunnel/Context Rendering | 4 | [Excalidraw DefaultSidebar tunnels](https://github.com/excalidraw/excalidraw/blob/master/packages/excalidraw/components/DefaultSidebar.tsx) |
| Lazy .then() Named Exports | 4 | [LobeChat dynamic imports](https://github.com/lobehub/lobe-chat/blob/main/src/features/Conversation/ChatItem/components/MessageContent/index.tsx), [Twenty lazy router](https://github.com/twentyhq/twenty/blob/main/packages/twenty-front/src/modules/app/hooks/useCreateAppRouter.tsx) |
| Dynamic Import Maps | 5 | [LobeChat componentMap](https://github.com/lobehub/lobe-chat/blob/main/src/routes/(main)/settings/features/componentMap.ts), [Cal.com EventTypeWebWrapper](https://github.com/calcom/cal.com/blob/main/apps/web/modules/event-types/components/EventTypeWebWrapper.tsx) |
| JSX in Data/Config | 5 | [Documenso ROLE_ICONS](https://github.com/documenso/documenso/blob/main/packages/ui/primitives/recipient-role-icons.tsx), [Dub pricing features](https://github.com/dubinc/dub/blob/main/packages/utils/src/constants/pricing/pricing-plan-compare-features.tsx) |
| Render Props | 4 | [Cal.com FormAction](https://github.com/calcom/cal.com/blob/main/apps/web/components/apps/routing-forms/FormActions.tsx) |
| Same-Name Collisions | 6 | [Plane @plane/ui vs @plane/propel](https://github.com/makeplane/plane/blob/main/packages/ui/src/button/button.tsx), [Novu Button](https://github.com/novuhq/novu/blob/main/packages/js/src/ui/components/primitives/Button.tsx) |
| Unexpected File Locations | 5 | [Dub variables.tsx](https://github.com/dubinc/dub/blob/main/packages/ui/src/rich-text-area/variables.tsx), [Inbox-zero scripts](https://github.com/elie222/inbox-zero/blob/main/apps/web/utils/scripts/lemon.tsx) |
| Plus: Barrel exports, hooks, providers, portals, RSC, animation, recursive, and more | | |

## Methodology

### How a benchmark run works

1. **Browser phase.** Playwright launches the Next.js benchmark app and iterates over all 298 test entries. For each entry, it locates the rendered element by `data-testid`, collects DOM context (surrounding HTML, computed styles, fiber tree info), and runs any browser-side resolvers (React Grab, Agentation, Cursor Browser). Some test cases require interaction first (clicking a dropdown trigger, expanding a recursive menu, etc.).

2. **Agent phase.** For each test entry, the harness builds a natural-language prompt from the test case description and any context payload (e.g. React Grab's source hint, Agentation's clipboard data). It sends the prompt to each agent backend (currently Claude via the Anthropic SDK) and records the file path returned. Agent tasks run in parallel (default concurrency: 20) with checkpointing so interrupted runs can resume via `BENCH_RESUME=1`.

3. **Scoring.** Each resolver's returned file path is compared against the expected `filePath` in the test case definition using normalized path matching. A result is marked correct if the resolved path matches. The harness computes per-resolver accuracy (correct/total) and geometric mean resolution time across correct results.

4. **Output.** Results are written to two files:
   - `packages/benchmark/e2e/bench-results.json` (full results with all resolvers)
   - `packages/website/app/data.json` (website-formatted data for charts and tables)

### What makes a test case hard

Each test case targets a specific pattern that makes source-file resolution difficult:

- **Indirection**: The component is re-exported under a different name, wrapped in HOCs, or rendered through a tunnel/context.
- **Ambiguity**: Multiple components share the same name across different directories, or generic names (Button, Card) exist in many places.
- **Dynamic resolution**: The component is loaded via `lazy(() => import().then())`, selected from a runtime map, or dispatched through a switch statement.
- **Misleading location**: The component lives in a non-component directory (middleware/, scripts/, constants/, schemas/).
- **Deep nesting**: The file path is 6-9 directories deep, common in monorepo structures.
- **Structural complexity**: Compound components via Object.assign, displayName-based child matching, render props, or polymorphic forwardRef patterns.

### Prompt strategies

The harness tests four prompt strategies per backend:

| Strategy | What it sends |
|---|---|
| **code** | Natural-language description only ("I need to find the source file for a React component...") |
| **agentation** | Description + Agentation clipboard payload |
| **react-grab** | Description + React Grab source hint |
| **cursor-browser** | Description + Cursor Browser clipboard payload |

Each strategy is combined with each backend to produce resolver names like `claude-code`, `react-grab+claude`, etc.

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

This starts the Next.js app on `http://localhost:3001` with all 298 test components rendered.

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
