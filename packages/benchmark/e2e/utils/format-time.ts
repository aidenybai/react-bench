const formatTime = (milliseconds: number): string =>
  milliseconds >= 1000
    ? `${(milliseconds / 1000).toFixed(1)}s`
    : `${milliseconds.toFixed(0)}ms`;

export { formatTime };
