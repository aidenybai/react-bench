const normalizeFilePath = (filePath: string): string =>
  filePath.match(/components\/.*|app\/.*|lib\/.*|hooks\/.*/)?.[0] ?? filePath;

export { normalizeFilePath };
