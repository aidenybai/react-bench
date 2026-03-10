import { Sandbox } from "@vercel/sandbox";
import { writeFileSync } from "fs";
import { join } from "path";
import { assertCommandSuccess } from "./assert-command-success";
import {
  SANDBOX_TIMEOUT_MS,
  GIT_CLONE_DEPTH,
  MAX_PUSH_ATTEMPTS,
  WORKING_DIRECTORY,
  REPO_URL,
  BENCH_RESULTS_PATH,
  WEBSITE_DATA_PATH,
  PLAYWRIGHT_SYSTEM_DEPS_COMMAND,
} from "./constants";

const buildAuthUrl = (repo: string, token: string): string => {
  const url = repo.startsWith("https://") ? repo : `https://github.com/${repo}`;
  return url.replace("https://", `https://${token}@`);
};

const runDetached = async (
  sandbox: Sandbox,
  label: string,
  command: string,
  cwd?: string,
): Promise<void> => {
  console.log(`  $ ${command}`);
  const handle = await sandbox.runCommand({
    cmd: "sh",
    args: ["-c", command],
    ...(cwd ? { cwd } : {}),
    detached: true,
  });

  try {
    for await (const log of handle.logs()) {
      process.stdout.write(log.data);
    }
  } catch {
    // HACK: Bun's fetch has a BrotliDecompressionError bug with long-running
    // streamed responses. Falls back to waiting without live output.
    console.log(`  (log stream interrupted, waiting for ${label} to finish...)`);
  }

  const finished = await handle.wait();
  await assertCommandSuccess(finished, label);
};

const cloneRepo = async (
  sandbox: Sandbox,
  githubToken?: string,
): Promise<void> => {
  const cloneUrl = githubToken ? buildAuthUrl(REPO_URL, githubToken) : REPO_URL;
  const handle = await sandbox.runCommand({
    cmd: "git",
    args: ["clone", "--depth", String(GIT_CLONE_DEPTH), cloneUrl, WORKING_DIRECTORY],
    detached: true,
  });
  const finished = await handle.wait();
  await assertCommandSuccess(finished, "git clone");
};

const installPlaywright = async (sandbox: Sandbox): Promise<void> => {
  await runDetached(sandbox, "playwright system deps", PLAYWRIGHT_SYSTEM_DEPS_COMMAND, WORKING_DIRECTORY);
  await runDetached(
    sandbox,
    "playwright install",
    "pnpm --filter @react-bench/benchmark exec playwright install chromium",
    WORKING_DIRECTORY,
  );
};

const commitAndPush = async (sandbox: Sandbox): Promise<void> => {
  await runDetached(
    sandbox,
    "git config",
    `git config user.name "react-bench[bot]" && git config user.email "react-bench[bot]@users.noreply.github.com"`,
    WORKING_DIRECTORY,
  );
  await runDetached(sandbox, "git add", `git add ${WEBSITE_DATA_PATH}`, WORKING_DIRECTORY);

  const diffHandle = await sandbox.runCommand({
    cmd: "git",
    args: ["diff", "--cached", "--quiet"],
    cwd: WORKING_DIRECTORY,
    detached: true,
  });
  const diffFinished = await diffHandle.wait();

  if (diffFinished.exitCode === 0) {
    console.log("  No changes to commit.");
    return;
  }

  await runDetached(
    sandbox,
    "git commit",
    `git commit -m "Update benchmark data [skip ci]"`,
    WORKING_DIRECTORY,
  );

  for (let attempt = 1; attempt <= MAX_PUSH_ATTEMPTS; attempt++) {
    const pushHandle = await sandbox.runCommand({
      cmd: "sh",
      args: [
        "-c",
        "git checkout -- . && git clean -fd && git fetch --unshallow origin main 2>/dev/null; git fetch origin main && git rebase origin/main && git push",
      ],
      cwd: WORKING_DIRECTORY,
      detached: true,
    });

    let pushStderr = "";
    for await (const log of pushHandle.logs()) {
      if (log.stream === "stderr") pushStderr += log.data;
      process.stdout.write(log.data);
    }

    const pushFinished = await pushHandle.wait();
    if (pushFinished.exitCode === 0) {
      console.log("  Pushed successfully.");
      return;
    }

    console.log(`  Push attempt ${attempt}/${MAX_PUSH_ATTEMPTS} failed: ${pushStderr}`);

    if (attempt < MAX_PUSH_ATTEMPTS) {
      await runDetached(sandbox, "rebase abort", "sleep 5 && git rebase --abort 2>/dev/null; true", WORKING_DIRECTORY);
    }
  }

  throw new Error(`Failed to push after ${MAX_PUSH_ATTEMPTS} attempts`);
};

const readResultsFromSandbox = async (
  sandbox: Sandbox,
): Promise<{ benchResults: Buffer | null; websiteData: Buffer | null }> => ({
  benchResults: await sandbox.readFileToBuffer({
    path: join(WORKING_DIRECTORY, BENCH_RESULTS_PATH),
  }),
  websiteData: await sandbox.readFileToBuffer({
    path: join(WORKING_DIRECTORY, WEBSITE_DATA_PATH),
  }),
});

const writeResultsLocally = (benchResults: Buffer | null, websiteData: Buffer | null): void => {
  const localBenchResults = join(__dirname, "..", "e2e", "bench-results.json");
  const localWebsiteData = join(__dirname, "..", "..", "website", "app", "data.json");

  if (benchResults) {
    writeFileSync(localBenchResults, benchResults);
    console.log(`  ${localBenchResults}`);
  }
  if (websiteData) {
    writeFileSync(localWebsiteData, websiteData);
    console.log(`  ${localWebsiteData}`);
  }
};

const requireEnv = (name: string, hint: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required. ${hint}`);
  return value;
};

const buildSandboxEnv = (anthropicApiKey: string): Record<string, string> => {
  const env: Record<string, string> = {
    ANTHROPIC_API_KEY: anthropicApiKey,
    FORCE_COLOR: "0",
  };
  const optionalKeys = ["BENCH_MODEL", "BENCH_CONCURRENCY", "OPENAI_API_KEY"];
  for (const key of optionalKeys) {
    if (process.env[key]) env[key] = process.env[key]!;
  }
  return env;
};

const runBenchmark = async (): Promise<void> => {
  const snapshotId = requireEnv("SANDBOX_SNAPSHOT_ID", "Run `bun sandbox/create-snapshot.ts` or pull env from cloud-agent.");
  const anthropicApiKey = requireEnv("ANTHROPIC_API_KEY", "Pull env with `vercel env pull .env.local`.");
  const githubToken = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;

  console.log("\n[1/7] Creating sandbox from snapshot...");
  const sandbox = await Sandbox.create({
    source: { type: "snapshot", snapshotId },
    timeout: SANDBOX_TIMEOUT_MS,
    env: buildSandboxEnv(anthropicApiKey),
  });
  console.log(`  Sandbox ID: ${sandbox.sandboxId}`);

  try {
    console.log("\n[2/7] Cloning repo...");
    await cloneRepo(sandbox, githubToken);

    console.log("\n[3/7] Installing dependencies...");
    await runDetached(sandbox, "pnpm install", "pnpm install", WORKING_DIRECTORY);

    console.log("\n[4/7] Installing Playwright...");
    await installPlaywright(sandbox);

    console.log("\n[5/7] Running benchmark...");
    await runDetached(sandbox, "benchmark test", "pnpm --filter @react-bench/benchmark test", WORKING_DIRECTORY);

    console.log("\n[6/7] Reading and writing results...");
    const { benchResults, websiteData } = await readResultsFromSandbox(sandbox);
    writeResultsLocally(benchResults, websiteData);

    if (githubToken) {
      console.log("\n[7/7] Pushing results...");
      await commitAndPush(sandbox);
    } else {
      console.log("\n[7/7] No GH_TOKEN set, skipping push.");
    }

    await sandbox.stop();
    console.log("\nBenchmark complete!");
  } catch (error) {
    console.error("\nBenchmark failed, stopping sandbox...");
    await sandbox.stop();
    throw error;
  }
};

runBenchmark().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
