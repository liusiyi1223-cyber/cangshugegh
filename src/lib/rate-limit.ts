type Attempt = { count: number; lockedUntil: number };

const attempts = new Map<string, Attempt>();

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000; // 15 分钟

export function isLocked(key: string): boolean {
  const a = attempts.get(key);
  if (!a) return false;
  if (a.lockedUntil > Date.now()) return true;
  if (a.lockedUntil > 0) attempts.delete(key);
  return false;
}

export function recordFailure(key: string): void {
  const a = attempts.get(key) ?? { count: 0, lockedUntil: 0 };
  a.count += 1;
  if (a.count >= MAX_ATTEMPTS) {
    a.lockedUntil = Date.now() + LOCK_MS;
    a.count = 0;
  }
  attempts.set(key, a);
}

export function clearFailures(key: string): void {
  attempts.delete(key);
}
