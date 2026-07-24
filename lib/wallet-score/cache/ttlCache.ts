/**
 * Process-local TTL cache with in-flight coalescing and stale-if-error support.
 */

type CacheEntry<T> = {
  value: T;
  /** Fresh until this timestamp. */
  expiresAt: number;
  /** May still be served on error until this timestamp. */
  staleUntil: number;
};

const store = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

/** How long expired entries remain eligible for stale-if-error. */
const DEFAULT_STALE_GRACE_MS = 10 * 60_000;

function pruneExpired(now: number) {
  if (store.size < 200) {
    return;
  }
  for (const [key, entry] of store) {
    if (entry.staleUntil <= now) {
      store.delete(key);
    }
  }
}

type GetOrSetOptions<T> = {
  shouldCache?: (value: T) => boolean;
  /** Extra time past TTL when a value may still be returned on loader failure. */
  staleGraceMs?: number;
  /** When true (default), return a stale value if the loader fails. */
  staleOnError?: boolean;
};

export function peekCached<T>(
  key: string,
): { value: T; fresh: boolean } | null {
  const hit = store.get(key);
  if (!hit) {
    return null;
  }
  const now = Date.now();
  if (hit.staleUntil <= now) {
    store.delete(key);
    return null;
  }
  return { value: hit.value as T, fresh: hit.expiresAt > now };
}

/**
 * Return a cached value when fresh; otherwise run `loader` once and share
 * the same promise with concurrent callers for the same key.
 * On loader failure, optionally return a still-valid stale entry.
 */
export async function getOrSetCached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
  options?: GetOrSetOptions<T>,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) {
    return hit.value as T;
  }

  const pending = inflight.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  const staleGraceMs = options?.staleGraceMs ?? DEFAULT_STALE_GRACE_MS;
  const staleOnError = options?.staleOnError ?? true;

  const promise = (async () => {
    try {
      const value = await loader();
      const persist = options?.shouldCache?.(value) ?? true;
      if (persist) {
        const expiresAt = Date.now() + Math.max(0, ttlMs);
        store.set(key, {
          value,
          expiresAt,
          staleUntil: expiresAt + staleGraceMs,
        });
        pruneExpired(Date.now());
      }
      return value;
    } catch (error) {
      if (staleOnError && hit && hit.staleUntil > Date.now()) {
        return hit.value as T;
      }
      throw error;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

export const CACHE_TTL_MS = {
  providerHttp: 60_000,
  walletAnalytics: 60_000,
  walletHistory: 10 * 60_000,
} as const;

export const PROVIDER_TIMEOUT_MS = 12_000;
