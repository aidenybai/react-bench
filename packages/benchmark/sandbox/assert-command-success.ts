import type { CommandFinished } from "@vercel/sandbox";

export const assertCommandSuccess = async (
  command: CommandFinished,
  label: string,
): Promise<void> => {
  if (command.exitCode !== 0) {
    const stderr = await command.stderr();
    throw new Error(
      `${label} failed with exit code ${command.exitCode}: ${stderr}`,
    );
  }
};
