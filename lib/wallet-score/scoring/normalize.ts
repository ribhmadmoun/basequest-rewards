/** Clamp a number into an inclusive range. */
export function clamp(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

/** Linear 0–100 score that reaches 100 at `fullAt`. */
export function linearScore(value: number, fullAt: number): number {
  if (fullAt <= 0) {
    return 0;
  }
  return clamp((value / fullAt) * 100);
}

/**
 * Diminishing-returns 0–100 score.
 * Useful for unbounded counts (transactions, interactions).
 */
export function logScore(value: number, fullAt: number): number {
  if (value <= 0 || fullAt <= 0) {
    return 0;
  }
  return clamp((Math.log1p(value) / Math.log1p(fullAt)) * 100);
}

/**
 * Ease-out curve: early progress scores well, then flattens.
 * `power` < 1 accelerates early gains (e.g. 0.7).
 */
export function easeOutScore(value: number, fullAt: number, power = 0.7): number {
  if (value <= 0 || fullAt <= 0) {
    return 0;
  }
  const ratio = Math.min(value / fullAt, 1);
  return clamp(Math.pow(ratio, power) * 100);
}
