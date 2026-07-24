import {
  CACHE_TTL_MS,
  PROVIDER_TIMEOUT_MS,
  getOrSetCached,
  peekCached,
} from "@/lib/wallet-score/cache/ttlCache";
import {
  ProviderError,
  classifyHttpStatus,
  toProviderError,
} from "@/lib/wallet-score/errors";

type CachedGetOptions = {
  ttlMs?: number;
  headers?: HeadersInit;
  errorPrefix?: string;
  revalidateSeconds?: number;
  timeoutMs?: number;
};

type CachedPostOptions = CachedGetOptions & {
  body: unknown;
};

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    throw toProviderError(error);
  } finally {
    clearTimeout(timer);
  }
}

function throwForStatus(status: number, errorPrefix: string): never {
  throw new ProviderError(
    classifyHttpStatus(status),
    `${errorPrefix} ${status}`,
    { status },
  );
}

/**
 * Cached JSON GET with timeout, in-flight dedupe, and stale-if-error.
 */
export async function cachedJsonGet<T>(
  url: string,
  options?: CachedGetOptions,
): Promise<T> {
  const ttlMs = options?.ttlMs ?? CACHE_TTL_MS.providerHttp;
  const errorPrefix = options?.errorPrefix ?? "HTTP";
  const revalidateSeconds = options?.revalidateSeconds ?? 60;
  const timeoutMs = options?.timeoutMs ?? PROVIDER_TIMEOUT_MS;
  const key = `GET:${url}`;

  try {
    return await getOrSetCached(key, ttlMs, async () => {
      const response = await fetchWithTimeout(
        url,
        {
          headers: options?.headers ?? { accept: "application/json" },
          next: { revalidate: revalidateSeconds },
        },
        timeoutMs,
      );

      if (!response.ok) {
        throwForStatus(response.status, errorPrefix);
      }

      return (await response.json()) as T;
    });
  } catch (error) {
    const stale = peekCached<T>(key);
    if (stale) {
      return stale.value;
    }
    throw toProviderError(error, errorPrefix);
  }
}

/**
 * Cached JSON POST (Alchemy RPC) — keyed by URL + body.
 */
export async function cachedJsonPost<T>(
  url: string,
  options: CachedPostOptions,
): Promise<T> {
  const ttlMs = options.ttlMs ?? CACHE_TTL_MS.providerHttp;
  const errorPrefix = options.errorPrefix ?? "HTTP";
  const revalidateSeconds = options.revalidateSeconds ?? 60;
  const timeoutMs = options.timeoutMs ?? PROVIDER_TIMEOUT_MS;
  const body = JSON.stringify(options.body);
  const key = `POST:${url}:${body}`;

  try {
    return await getOrSetCached(key, ttlMs, async () => {
      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: options.headers ?? {
            accept: "application/json",
            "content-type": "application/json",
          },
          body,
          next: { revalidate: revalidateSeconds },
        },
        timeoutMs,
      );

      if (!response.ok) {
        throwForStatus(response.status, errorPrefix);
      }

      return (await response.json()) as T;
    });
  } catch (error) {
    const stale = peekCached<T>(key);
    if (stale) {
      return stale.value;
    }
    throw toProviderError(error, errorPrefix);
  }
}
