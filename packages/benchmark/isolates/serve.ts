import { spawn, type ChildProcess, execSync } from "child_process";
import { join } from "path";
import { ISOLATE_REGISTRY } from "./registry";
import type { IsolateDefinition } from "./types";

const BENCHMARK_ROOT = join(__dirname, "..");
const STARTUP_SETTLE_MS = 3000;

const checkDependenciesInstalled = (isolate: IsolateDefinition): boolean => {
  for (const dependency of isolate.dependencies) {
    try {
      require.resolve(dependency, { paths: [BENCHMARK_ROOT] });
    } catch {
      return false;
    }
  }
  return true;
};

const startIsolateServer = (isolate: IsolateDefinition): ChildProcess => {
  const childProcess = spawn(
    "npx",
    ["next", "dev", "--port", String(isolate.port)],
    {
      env: {
        ...process.env,
        NEXT_PUBLIC_BENCH_ISOLATE: isolate.name,
      },
      stdio: ["ignore", "pipe", "pipe"],
      cwd: BENCHMARK_ROOT,
    },
  );

  childProcess.stdout?.on("data", (data: Buffer) => {
    process.stdout.write(`[${isolate.name}] ${data}`);
  });

  childProcess.stderr?.on("data", (data: Buffer) => {
    process.stderr.write(`[${isolate.name}] ${data}`);
  });

  return childProcess;
};

const targetIsolateName = process.argv[2];
const isolatesToStart = targetIsolateName
  ? ISOLATE_REGISTRY.filter((isolate) => isolate.name === targetIsolateName)
  : ISOLATE_REGISTRY;

if (isolatesToStart.length === 0) {
  const availableNames = ISOLATE_REGISTRY.map((isolate) => isolate.name).join(", ");
  console.error(
    `Unknown isolate: "${targetIsolateName}". Available: ${availableNames}`,
  );
  process.exit(1);
}

const readyIsolates: IsolateDefinition[] = [];
const missingIsolates: IsolateDefinition[] = [];

for (const isolate of isolatesToStart) {
  if (checkDependenciesInstalled(isolate)) {
    readyIsolates.push(isolate);
  } else {
    missingIsolates.push(isolate);
  }
}

if (missingIsolates.length > 0) {
  console.log("\nIsolates with missing dependencies:\n");
  for (const isolate of missingIsolates) {
    console.log(`  ${isolate.name}: ni ${isolate.dependencies.join(" ")}`);
  }
  console.log();
}

if (readyIsolates.length === 0) {
  console.error("No isolates ready to start. Install dependencies first.");
  process.exit(1);
}

console.log(`\nStarting ${readyIsolates.length} isolate(s):\n`);
for (const isolate of readyIsolates) {
  console.log(`  ${isolate.name} → http://localhost:${isolate.port}`);
}
console.log();

const activeProcesses: ChildProcess[] = [];

for (const isolate of readyIsolates) {
  const childProcess = startIsolateServer(isolate);
  activeProcesses.push(childProcess);
}

const shutdown = () => {
  console.log("\nShutting down isolates...");
  for (const childProcess of activeProcesses) {
    childProcess.kill("SIGTERM");
  }
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
