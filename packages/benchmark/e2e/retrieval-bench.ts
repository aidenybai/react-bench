#!/usr/bin/env npx tsx

import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { TEST_MANIFEST, type TestEntry } from "./test-cases";

const CWD = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const ALLOWED_TOOLS = "Read,Grep,Glob,Bash";
const CLI_TIMEOUT_MS = 120_000;

const SCHEMA = JSON.stringify({
  type: "object",
  properties: {
    filePath: {
      type: "string",
      description: "Relative path e.g. components/styled/styled-card.tsx",
    },
    componentName: { type: "string" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    reasoning: { type: "string" },
  },
  required: ["filePath", "componentName", "confidence"],
});

interface Result {
  id: number;
  testId: string;
  expected: string;
  actual: string | null;
  correct: boolean;
  wallMs: number;
  confidence: string | null;
  error?: string;
}

const buildPrompt = (entry: TestEntry): string =>
  [
    `Find the source file for this React component in the Next.js app.`,
    `Description: ${entry.description}`,
    `DOM data-testid="${entry.testId}"`,
    `Return the relative file path (e.g. "components/foo/bar.tsx") and the component name. Read-only - do not edit.`,
  ].join("\n");

const runClaude = (
  text: string,
  model?: string,
): { output: string; elapsedMs: number } => {
  const flags = [
    `-p`,
    `--output-format json`,
    `--tools "${ALLOWED_TOOLS}"`,
    `--json-schema '${SCHEMA}'`,
    model ? `--model ${model}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const start = performance.now();
  const output = execSync(
    `echo "" | claude ${flags} -- ${JSON.stringify(text)}`,
    {
      cwd: CWD,
      encoding: "utf-8",
      timeout: CLI_TIMEOUT_MS,
      env: { ...process.env, FORCE_COLOR: "0", CLAUDECODE: "" },
    },
  );
  return { output, elapsedMs: performance.now() - start };
};

const parseClaudeOutput = (
  raw: string,
): { filePath: string | null; confidence: string | null } => {
  try {
    const outer = JSON.parse(raw);

    if (
      outer.structured_output &&
      typeof outer.structured_output === "object"
    ) {
      return {
        filePath: (outer.structured_output.filePath as string) ?? null,
        confidence: (outer.structured_output.confidence as string) ?? null,
      };
    }

    const parsed =
      typeof outer.result === "string"
        ? JSON.parse(outer.result.match(/\{[\s\S]*\}/)?.[0] ?? "{}")
        : typeof outer.result === "object"
          ? outer.result
          : outer;
    return {
      filePath: (parsed.filePath as string) ?? null,
      confidence: (parsed.confidence as string) ?? null,
    };
  } catch {
    return { filePath: null, confidence: null };
  }
};

const normalizePath = (path: string): string =>
  path
    .replace(/^\.\//, "")
    .replace(/^app\//, "")
    .replace(/^src\//, "");

const parseArgs = (): { entries: TestEntry[]; model: string | undefined } => {
  const args = process.argv.slice(2);
  let ids: number[] | null = null;
  let model: string | undefined;

  for (let argIndex = 0; argIndex < args.length; argIndex++) {
    if (args[argIndex] === "--ids")
      ids = args[++argIndex].split(",").map(Number);
    else if (args[argIndex] === "--model") model = args[++argIndex];
  }

  let entries = [...TEST_MANIFEST];
  if (ids) entries = entries.filter((entry) => ids!.includes(entry.id));
  return { entries, model };
};

const { entries, model } = parseArgs();

console.log(`\n  Claude Code Retrieval Benchmark`);
console.log(`  ${entries.length} cases${model ? `, model: ${model}` : ""}\n`);

const results: Result[] = [];

for (const entry of entries) {
  const tag = `[${String(entry.id).padStart(2)}] ${entry.testId}`;
  process.stdout.write(`  ${tag.padEnd(35)} `);

  try {
    const { output, elapsedMs } = runClaude(buildPrompt(entry), model);
    const { filePath, confidence } = parseClaudeOutput(output);
    const isCorrect = filePath
      ? normalizePath(filePath) === normalizePath(entry.filePath)
      : false;

    results.push({
      id: entry.id,
      testId: entry.testId,
      expected: entry.filePath,
      actual: filePath,
      correct: isCorrect,
      wallMs: Math.round(elapsedMs),
      confidence,
    });

    const symbol = isCorrect ? "✓" : filePath ? "✗" : "⊘";
    console.log(
      `${symbol} ${(elapsedMs / 1000).toFixed(1).padStart(5)}s  ${(filePath ?? "-").padEnd(45)} expected: ${entry.filePath}`,
    );
  } catch (error: any) {
    results.push({
      id: entry.id,
      testId: entry.testId,
      expected: entry.filePath,
      actual: null,
      correct: false,
      wallMs: 0,
      confidence: null,
      error: error.message?.slice(0, 100),
    });
    console.log(`ERR ${error.message?.slice(0, 80)}`);
  }
}

const totalCount = results.length;
const correctCount = results.filter((result) => result.correct).length;
const averageSeconds = (
  results.reduce((sum, result) => sum + result.wallMs, 0) /
  totalCount /
  1000
).toFixed(1);

console.log(`\n  ${"━".repeat(80)}`);
console.log(
  `  ${correctCount}/${totalCount} correct (${((correctCount / totalCount) * 100).toFixed(0)}%) - avg ${averageSeconds}s/query\n`,
);

const jsonPath = `${CWD}/e2e/retrieval-results.json`;
writeFileSync(jsonPath, JSON.stringify(results, null, 2));
console.log(`  ${jsonPath}\n`);

process.exit(correctCount === totalCount ? 0 : 1);
