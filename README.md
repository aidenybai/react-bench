# React Bench

Evaluating coding agents on React.js tasks.

## What It Measures

React Bench compares how well different coding agent tools locate the source file of a React component, given only a description of what the user sees on screen. It measures:

- **Speed** -- how long (in seconds) each tool takes to resolve the source file
- **Accuracy** -- whether the tool identifies the correct file

## Resolvers

| Resolver | Description |
|----------|-------------|
| Claude Code (control) | Baseline -- Claude Code with no additional tooling |
| Agentation + Claude Code | Claude Code with [Agentation](https://github.com/nicholasgriffintn/agentation) |
| React Grab + Claude Code | Claude Code with [React Grab](https://github.com/aidenybai/react-grab) |

## Test Cases

75 component resolution tasks across four difficulty tiers:

- **Easy** (12) -- plain components with a single owner and no indirection
- **Medium** (18) -- HOCs, portals, compound components
- **Hard** (14) -- nested HOCs + Radix + Motion combinations
- **Nightmare** (24+) -- recursive trees, triple portals, factory-generated widgets

The test harness is a real Next.js app with Radix UI, styled-components, Tailwind, Motion, and deeply nested component trees.

## Running Locally

```bash
pnpm install
pnpm --filter @react-bench/website dev
```

Visit `http://localhost:3001` for the results page, or `http://localhost:3001/harness` for the test component harness.

### Running Benchmarks

```bash
pnpm --filter @react-bench/website test
```

To run with Claude Code CLI resolvers:

```bash
BENCH_CLAUDE=1 ANTHROPIC_API_KEY=sk-... pnpm --filter @react-bench/website exec playwright test e2e/bench.spec.ts
```

## CI

Benchmarks run daily via GitHub Actions and results are committed back to the repo as `packages/website/app/data.json`.

## License

MIT
