export function elapsed(started: number) {
  return Math.round(performance.now() - started);
}
