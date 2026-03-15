import { spawn, type ChildProcess } from "child_process";
import { join } from "path";

const BENCHMARK_ROOT = join(__dirname, "..");
const STARTUP_POLL_INTERVAL_MS = 1000;
const STARTUP_TIMEOUT_MS = 120_000;

interface ServerTarget {
  name: string;
  port: number;
  env?: Record<string, string>;
}

const MAIN_SERVER: ServerTarget = { name: "main", port: 3001 };

const ISOLATE_SERVERS: ServerTarget[] = [
  { name: "react-grab", port: 3010, env: { NEXT_PUBLIC_BENCH_ISOLATE: "react-grab" } },
  { name: "agentation", port: 3011, env: { NEXT_PUBLIC_BENCH_ISOLATE: "agentation" } },
  { name: "cursor-browser", port: 3012, env: { NEXT_PUBLIC_BENCH_ISOLATE: "cursor-browser" } },
  { name: "click-to-component", port: 3013, env: { NEXT_PUBLIC_BENCH_ISOLATE: "click-to-component" } },
  { name: "locatorjs", port: 3014, env: { NEXT_PUBLIC_BENCH_ISOLATE: "locatorjs" } },
  { name: "instruckt", port: 3015, env: { NEXT_PUBLIC_BENCH_ISOLATE: "instruckt" } },
];

const ALL_SERVERS = [MAIN_SERVER, ...ISOLATE_SERVERS];

const waitForServer = async (port: number, timeoutMs: number): Promise<boolean> => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`http://localhost:${port}`);
      if (response.ok || response.status === 404) return true;
    } catch {
      // HACK: Server not ready yet, keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, STARTUP_POLL_INTERVAL_MS));
  }
  return false;
};

const startServer = (target: ServerTarget): ChildProcess => {
  const childProcess = spawn(
    "npx",
    ["next", "dev", "--port", String(target.port)],
    {
      env: { ...process.env, ...target.env },
      stdio: ["ignore", "pipe", "pipe"],
      cwd: BENCHMARK_ROOT,
    },
  );

  childProcess.stderr?.on("data", (data: Buffer) => {
    const message = data.toString();
    if (message.includes("error") || message.includes("Error")) {
      process.stderr.write(`[${target.name}] ${message}`);
    }
  });

  return childProcess;
};

const activeProcesses: ChildProcess[] = [];

const shutdown = () => {
  console.log("\nShutting down all servers...");
  for (const childProcess of activeProcesses) {
    childProcess.kill("SIGTERM");
  }
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const run = async () => {
  console.log(`Starting ${ALL_SERVERS.length} servers sequentially...\n`);

  for (const target of ALL_SERVERS) {
    process.stdout.write(`  ${target.name.padEnd(20)} → :${target.port} ...`);
    const childProcess = startServer(target);
    activeProcesses.push(childProcess);

    const isReady = await waitForServer(target.port, STARTUP_TIMEOUT_MS);
    if (!isReady) {
      console.error(` FAILED`);
      console.error(`\n${target.name} (port ${target.port}) failed to start within ${STARTUP_TIMEOUT_MS / 1000}s. Aborting.`);
      shutdown();
      return;
    }
    console.log(` ready`);
  }

  console.log(`\n  All ${ALL_SERVERS.length} servers ready.\n`);
  console.log("Running benchmark in isolated mode...\n");

  const benchProcess = spawn(
    "npx",
    ["playwright", "test", "e2e/bench.spec.ts"],
    {
      env: { ...process.env, BENCH_ISOLATED: "true" },
      stdio: "inherit",
      cwd: BENCHMARK_ROOT,
    },
  );

  benchProcess.on("exit", (exitCode) => {
    console.log(`\nBenchmark exited with code ${exitCode}`);
    for (const childProcess of activeProcesses) {
      childProcess.kill("SIGTERM");
    }
    process.exit(exitCode ?? 0);
  });
};

run();
