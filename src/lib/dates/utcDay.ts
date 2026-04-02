/**
 * Bucket by UTC calendar day (matches POST /api/workouts when the client sends `new Date().toISOString()`).
 */
export function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Exclusive end bound for “same UTC day” queries. */
export function endOfUtcDayExclusive(d: Date): Date {
  const s = startOfUtcDay(d);
  return new Date(s.getTime() + 24 * 60 * 60 * 1000);
}
