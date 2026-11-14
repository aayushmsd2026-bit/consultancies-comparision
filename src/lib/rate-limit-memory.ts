/**
 * A small in-memory rate limiter for cheap, frequent requests (search suggestions).
 * It counts per server instance, so it is a speed bump, not a wall. Writes that
 * matter (reviews, reports) use the database limiter instead.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

export function allowRequest(key: string, max: number, windowMs: number, now = Date.now()): boolean {
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    // Do not let the map grow without end.
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}
