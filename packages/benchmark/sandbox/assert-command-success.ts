import type { CommandFinished } from "@vercel/sandbox";

export const assertCommandSuccess = async (
  command: CommandFinished,
  label: string,
): Promise<void> => {
  if (command.exitCode !== 0) {
    const [stdout, stderr] = await Promise.all([
      command.stdout(),
      command.stderr(),
    ]);
    const output = [
      stderr ? `stderr:\n${stderr}` : "",
      stdout ? `stdout (last 2000 chars):\n${stdout.slice(-2000)}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    throw new Error(
      `${label} failed with exit code ${command.exitCode}:\n${output}`,
    );
  }
};
