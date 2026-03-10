import { Sandbox } from "@vercel/sandbox";
import { writeFileSync } from "fs";
import { join } from "path";
import { assertCommandSuccess } from "./assert-command-success";
import {
  SANDBOX_TIMEOUT_MS,
  GIT_CLONE_DEPTH,
  WORKING_DIRECTORY,
  BENCH_RESULTS_PATH,
  WEBSITE_DATA_PATH,
} from "./constants";

const REPO = "https://github.com/aidenybai/react-bench";
const TOTAL_STEPS = 9;
const MAX_PUSH_ATTEMPTS = 3;

const buildAuthUrl = (repo: string, token: string): string => {
  const url = repo.startsWith("https://") ? repo : `https://github.com/${repo}`;
  return url.replace("https://", `https://${token}@`);
};

const logStep = (step: number, message: string): void => {
  console.log(
    `\n[${"=".repeat(step)}${"·".repeat(TOTAL_STEPS - step)}] Step ${step}/${TOTAL_STEPS}: ${message}`,
  );
};

const runCommand = async (
  sandbox: Sandbox,
  label: string,
  command: string,
  cwd?: string,
): Promise<void> => {
  console.log(`  $ ${command}`);
  const result = await sandbox.runCommand({
    cmd: "sh",
    args: ["-c", command],
    ...(cwd ? { cwd } : {}),
  });
  const stdout = await result.stdout();
  const stderr = await result.stderr();
  if (stdout) console.log(stdout);
  if (stderr && result.exitCode !== 0) console.error(stderr);
  await assertCommandSuccess(result, label);
};

const commitAndPushInSandbox = async (sandbox: Sandbox): Promise<void> => {
  await runCommand(
    sandbox,
    "git config",
    `git config user.name "react-bench[bot]" && git config user.email "react-bench[bot]@users.noreply.github.com"`,
    WORKING_DIRECTORY,
  );

  await runCommand(
    sandbox,
    "git add",
    `git add ${WEBSITE_DATA_PATH}`,
    WORKING_DIRECTORY,
  );

  const diffResult = await sandbox.runCommand({
    cmd: "git",
    args: ["diff", "--cached", "--quiet"],
    cwd: WORKING_DIRECTORY,
  });

  if (diffResult.exitCode === 0) {
    console.log("  No changes to commit.");
    return;
  }

  await runCommand(
    sandbox,
    "git commit",
    `git commit -m "Update benchmark data [skip ci]"`,
    WORKING_DIRECTORY,
  );

  for (let attempt = 1; attempt <= MAX_PUSH_ATTEMPTS; attempt++) {
    const pushResult = await sandbox.runCommand({
      cmd: "sh",
      args: ["-c", "git fetch --unshallow origin main 2>/dev/null; git fetch origin main && git rebase origin/main && git push"],
      cwd: WORKING_DIRECTORY,
    });

    if (pushResult.exitCode === 0) {
      console.log("  Pushed successfully.");
      return;
    }

    const stderr = await pushResult.stderr();
    console.log(`  Push attempt ${attempt}/${MAX_PUSH_ATTEMPTS} failed: ${stderr}`);

    if (attempt < MAX_PUSH_ATTEMPTS) {
      await sandbox.runCommand({
        cmd: "sh",
        args: ["-c", "sleep 5 && git rebase --abort 2>/dev/null; true"],
        cwd: WORKING_DIRECTORY,
      });
    }
  }

  throw new Error(`Failed to push after ${MAX_PUSH_ATTEMPTS} attempts`);
};

const runBenchmark = async () => {
  const snapshotId = process.env.SANDBOX_SNAPSHOT_ID;
  if (!snapshotId) {
    throw new Error(
      "SANDBOX_SNAPSHOT_ID is required. Run `bun sandbox/create-snapshot.ts` first, or pull env from cloud-agent.",
    );
  }

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is required. Pull env from cloud-agent with `vercel env pull .env.local`.",
    );
  }

  const githubToken = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;

  const sandboxEnv: Record<string, string> = {
    ANTHROPIC_API_KEY: anthropicApiKey,
    FORCE_COLOR: "0",
  };

  if (process.env.BENCH_MODEL) sandboxEnv.BENCH_MODEL = process.env.BENCH_MODEL;
  if (process.env.BENCH_CONCURRENCY)
    sandboxEnv.BENCH_CONCURRENCY = process.env.BENCH_CONCURRENCY;
  if (process.env.OPENAI_API_KEY)
    sandboxEnv.OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  logStep(1, "Creating sandbox from snapshot...");
  const sandbox = await Sandbox.create({
    source: { type: "snapshot", snapshotId },
    timeout: SANDBOX_TIMEOUT_MS,
    env: sandboxEnv,
  });
  console.log(`  Sandbox ID: ${sandbox.sandboxId}`);

  try {
    logStep(2, "Cloning repo...");
    const cloneUrl = githubToken ? buildAuthUrl(REPO, githubToken) : REPO;
    const cloneResult = await sandbox.runCommand("git", [
      "clone",
      "--depth",
      String(GIT_CLONE_DEPTH),
      cloneUrl,
      WORKING_DIRECTORY,
    ]);
    await assertCommandSuccess(cloneResult, "git clone");

    logStep(3, "Installing dependencies...");
    await runCommand(sandbox, "pnpm install", "pnpm install", WORKING_DIRECTORY);

    logStep(4, "Installing Playwright browsers...");
    await runCommand(
      sandbox,
      "playwright system deps",
      "sudo dnf install -y alsa-lib atk at-spi2-atk cups-libs libdrm libXcomposite libXdamage libXrandr mesa-libgbm pango nss nspr libxkbcommon 2>/dev/null || sudo yum install -y alsa-lib atk at-spi2-atk cups-libs libdrm libXcomposite libXdamage libXrandr mesa-libgbm pango nss nspr libxkbcommon 2>/dev/null || true",
      WORKING_DIRECTORY,
    );
    await runCommand(
      sandbox,
      "playwright install",
      "pnpm --filter @react-bench/benchmark exec playwright install chromium",
      WORKING_DIRECTORY,
    );

    logStep(5, "Running benchmark...");
    console.log("  This may take a while...\n");
    await runCommand(
      sandbox,
      "benchmark test",
      "pnpm --filter @react-bench/benchmark test",
      WORKING_DIRECTORY,
    );

    logStep(6, "Reading results from sandbox...");
    const benchResultsBuffer = await sandbox.readFileToBuffer({
      path: join(WORKING_DIRECTORY, BENCH_RESULTS_PATH),
    });
    const websiteDataBuffer = await sandbox.readFileToBuffer({
      path: join(WORKING_DIRECTORY, WEBSITE_DATA_PATH),
    });

    logStep(7, "Writing results locally...");
    const localBenchResults = join(__dirname, "..", "e2e", "bench-results.json");
    const localWebsiteData = join(
      __dirname,
      "..",
      "..",
      "website",
      "app",
      "data.json",
    );

    if (benchResultsBuffer) {
      writeFileSync(localBenchResults, benchResultsBuffer);
      console.log(`  ${localBenchResults}`);
    }
    if (websiteDataBuffer) {
      writeFileSync(localWebsiteData, websiteDataBuffer);
      console.log(`  ${localWebsiteData}`);
    }

    logStep(8, "Committing and pushing results from sandbox...");
    if (githubToken) {
      await commitAndPushInSandbox(sandbox);
    } else {
      console.log("  No GH_TOKEN set, skipping push.");
    }

    logStep(9, "Stopping sandbox...");
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
