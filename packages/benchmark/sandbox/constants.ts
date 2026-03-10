export const SANDBOX_TIMEOUT_MS = 1_800_000;
export const SNAPSHOT_TIMEOUT_MS = 600_000;
export const GIT_CLONE_DEPTH = 1;
export const MAX_PUSH_ATTEMPTS = 3;
export const WORKING_DIRECTORY = "/vercel/sandbox/repo";
export const REPO_URL = "https://github.com/aidenybai/react-bench";
export const BENCH_RESULTS_PATH = "packages/benchmark/e2e/bench-results.json";
export const WEBSITE_DATA_PATH = "packages/website/app/data.json";

export const PLAYWRIGHT_SYSTEM_DEPS_COMMAND =
  "sudo dnf install -y alsa-lib atk at-spi2-atk cups-libs libdrm libXcomposite libXdamage libXrandr mesa-libgbm pango nss nspr libxkbcommon 2>/dev/null || sudo yum install -y alsa-lib atk at-spi2-atk cups-libs libdrm libXcomposite libXdamage libXrandr mesa-libgbm pango nss nspr libxkbcommon 2>/dev/null || true";
