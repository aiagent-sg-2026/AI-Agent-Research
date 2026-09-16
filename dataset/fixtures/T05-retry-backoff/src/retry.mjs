export function retryDelay(attempt, base = 100, max = 2000) {
  return Math.min(max, base * 2 ** attempt);
}
