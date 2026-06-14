interface RateLimitEntry {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

const store = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;  // 15 minutes
const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes

export function checkRateLimit(key: string): { allowed: boolean; remainingMs?: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { attempts: 1, firstAttemptAt: now, lockedUntil: null });
    return { allowed: true };
  }

  if (entry.lockedUntil !== null) {
    if (now < entry.lockedUntil) {
      return { allowed: false, remainingMs: entry.lockedUntil - now };
    }
    store.delete(key);
    store.set(key, { attempts: 1, firstAttemptAt: now, lockedUntil: null });
    return { allowed: true };
  }

  if (now - entry.firstAttemptAt > WINDOW_MS) {
    store.set(key, { attempts: 1, firstAttemptAt: now, lockedUntil: null });
    return { allowed: true };
  }

  entry.attempts += 1;

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
    return { allowed: false, remainingMs: LOCKOUT_MS };
  }

  return { allowed: true };
}

export function resetRateLimit(key: string): void {
  store.delete(key);
}
