import { Sandbox } from "@vercel/sandbox";
import {
  SNAPSHOT_TIMEOUT_MS,
  PLAYWRIGHT_SYSTEM_DEPS_COMMAND,
} from "./constants";

const INSTALL_COMMANDS = [
  "npm i -g @anthropic-ai/claude-code pnpm",
  PLAYWRIGHT_SYSTEM_DEPS_COMMAND,
  "npx playwright install chromium",
];

const VERIFY_COMMAND =
  "claude --version && pnpm --version && npx playwright --version";

const createSnapshot = async (): Promise<void> => {
  console.log("Creating sandbox...");
  const sandbox = await Sandbox.create({
    runtime: "node24",
    timeout: SNAPSHOT_TIMEOUT_MS,
  });
  console.log(`Sandbox created: ${sandbox.sandboxId}`);

  for (const command of INSTALL_COMMANDS) {
    console.log(`Running: ${command}`);
    const result = await sandbox.runCommand("sh", ["-c", command], {});
    const stdout = await result.stdout();
    const stderr = await result.stderr();
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    if (result.exitCode !== 0) {
      console.error(`Command failed with exit code ${result.exitCode}`);
      await sandbox.stop();
      process.exit(1);
    }
  }

  console.log("Verifying installations...");
  const verify = await sandbox.runCommand("sh", ["-c", VERIFY_COMMAND]);
  console.log(await verify.stdout());

  console.log("Creating snapshot (this stops the sandbox)...");
  const snapshot = await sandbox.snapshot({ expiration: 0 });
  console.log(`\nSnapshot created: ${snapshot.snapshotId}`);
  console.log(
    `\nSet in your environment:\n  SANDBOX_SNAPSHOT_ID=${snapshot.snapshotId}`,
  );
};

createSnapshot().catch((error) => {
  console.error("Failed to create snapshot:", error);
  process.exit(1);
});
