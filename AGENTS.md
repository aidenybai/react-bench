## General Rules

- MUST: Use @antfu/ni. Use `ni` to install, `nr SCRIPT_NAME` to run. `nun` to uninstall.
- MUST: Use TypeScript interfaces over types.
- MUST: Keep all types in the global scope.
- MUST: Use arrow functions over function declarations
- MUST: Never comment unless absolutely necessary.
  - If the code is a hack (like a setTimeout or potentially confusing code), it must be prefixed with // HACK: reason for hack
  - Do not delete descriptive comments >3 lines without confirming with the user
- MUST: Use kebab-case for files
- MUST: Use descriptive names for variables (avoid shorthands, or 1-2 character names).
  - Example: for .map(), you can use `innerX` instead of `x`
  - Example: instead of `moved` use `didPositionChange`
- MUST: Frequently re-evaluate and refactor variable names to be more accurate and descriptive.
- MUST: Do not type cast ("as") unless absolutely necessary
- MUST: Remove unused code and don't repeat yourself.
- MUST: Always search the codebase, think of many solutions, then implement the most _elegant_ solution.
- MUST: Put all magic numbers in `constants.ts` using `SCREAMING_SNAKE_CASE` with unit suffixes (`_MS`, `_PX`).
- MUST: Put small, focused utility functions in `utils/` with one utility per file.
- MUST: Use Boolean over !!.

## Testing

Run checks always before committing with:

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm format
```

## Project Structure

This is a pnpm monorepo with Turborepo:

- `packages/benchmark` - Next.js benchmark harness (75-component test app, e2e specs, Playwright)
- `packages/website` - Next.js results display site (shadcn/ui, charts, tables)
- `packages/react-bench` - npm placeholder package
- `packages/reactbench` - npm placeholder package

## Benchmark

The benchmark harness lives at `packages/benchmark`. It contains:

- 75 component test cases (easy, medium, hard, nightmare tiers)
- E2E specs in `e2e/` (Playwright)
- Test manifest in `test-manifest.ts`

Run the harness dev server:

```bash
pnpm --filter @react-bench/benchmark dev
```

Run benchmarks:

```bash
pnpm --filter @react-bench/benchmark test
```

Run the results website:

```bash
pnpm --filter @react-bench/website dev
```
