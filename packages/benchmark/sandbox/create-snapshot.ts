import { Sandbox } from "@vercel/sandbox";

const INSTALL_COMMANDS = [
  "npm i -g @anthropic-ai/claude-code @openai/codex pnpm",
  "sudo dnf install -y alsa-lib atk at-spi2-atk cups-libs libdrm libXcomposite libXdamage libXrandr mesa-libgbm pango nss nspr libxkbcommon 2>/dev/null || sudo yum install -y alsa-lib atk at-spi2-atk cups-libs libdrm libXcomposite libXdamage libXrandr mesa-libgbm pango nss nspr libxkbcommon 2>/dev/null || true",
  "npx playwright install chromium",
];

const createSnapshot = async () => {
  console.log("Creating sandbox...");
  const sandbox = await Sandbox.create({
    runtime: "node24",
    timeout: 600_000,
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
  const verify = await sandbox.runCommand("sh", [
    "-c",
    "claude --version && pnpm --version && npx playwright --version",
  ]);
  const verifyOutput = await verify.stdout();
  console.log(verifyOutput);

  console.log("Creating snapshot (this stops the sandbox)...");
  const snapshot = await sandbox.snapshot({ expiration: 0 });
  console.log(`\nSnapshot created successfully!`);
  console.log(`Snapshot ID: ${snapshot.snapshotId}`);
  console.log(`\nSet this in your environment:`);
  console.log(`  SANDBOX_SNAPSHOT_ID=${snapshot.snapshotId}`);
};

createSnapshot().catch((error) => {
  console.error("Failed to create snapshot:", error);
  process.exit(1);
});
