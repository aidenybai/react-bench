import { normalizeFilePath } from "./normalize-file-path";

const isCorrectFile = (actual: string | null, expected: string): boolean => {
  if (!actual) return false;
  const expectedSuffix = expected.split("/").slice(1).join("/");
  return normalizeFilePath(actual).includes(expectedSuffix);
};

export { isCorrectFile };
