/**
 * Provider / analytics error classification for Base Wallet Score.
 * Keeps messages user-friendly; never used to crash the page.
 */

export type ProviderFailureKind =
  | "rate_limit"
  | "server"
  | "timeout"
  | "network"
  | "invalid"
  | "empty"
  | "unknown";

export class ProviderError extends Error {
  readonly kind: ProviderFailureKind;
  readonly status?: number;

  constructor(
    kind: ProviderFailureKind,
    message: string,
    options?: { status?: number; cause?: unknown },
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = "ProviderError";
    this.kind = kind;
    this.status = options?.status;
  }
}

export function classifyHttpStatus(status: number): ProviderFailureKind {
  if (status === 429) {
    return "rate_limit";
  }
  if (status === 408 || status === 504) {
    return "timeout";
  }
  if (status >= 500) {
    return "server";
  }
  if (status === 400 || status === 404) {
    return "invalid";
  }
  return "unknown";
}

export function toProviderError(
  error: unknown,
  fallbackPrefix = "Request failed",
): ProviderError {
  if (error instanceof ProviderError) {
    return error;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return new ProviderError("timeout", "Request timed out", { cause: error });
  }

  if (error instanceof Error) {
    const message = error.message || fallbackPrefix;
    const statusMatch = message.match(/\b(429|500|502|503|504|408)\b/);
    if (statusMatch) {
      const status = Number(statusMatch[1]);
      return new ProviderError(classifyHttpStatus(status), message, {
        status,
        cause: error,
      });
    }
    if (/timed?\s*out|aborted|AbortError/i.test(message)) {
      return new ProviderError("timeout", message, { cause: error });
    }
    if (/network|fetch failed|Failed to fetch/i.test(message)) {
      return new ProviderError("network", message, { cause: error });
    }
    return new ProviderError("unknown", message, { cause: error });
  }

  return new ProviderError("unknown", fallbackPrefix);
}

/** Short copy for banners / fallback cards. */
export function userMessageForFailure(
  kind: ProviderFailureKind,
  options?: { fromCache?: boolean },
): string {
  const cached = options?.fromCache
    ? " Showing the latest saved data."
    : "";

  switch (kind) {
    case "rate_limit":
      return `Base data providers are busy right now.${cached || " Please try again shortly."}`;
    case "server":
      return `Wallet data is temporarily unavailable.${cached || " Please try again in a moment."}`;
    case "timeout":
      return `The request took too long.${cached || " Please try again."}`;
    case "network":
      return `Network connection issue.${cached || " Check your connection and retry."}`;
    case "invalid":
      return "That wallet address looks invalid. Connect a valid Base wallet.";
    case "empty":
      return "This wallet has no Base activity yet. Complete a transaction to unlock analytics.";
    default:
      return `Some wallet data could not be loaded.${cached || " Please try again shortly."}`;
  }
}

export function dominantFailureKind(
  messages: Array<string | undefined>,
): ProviderFailureKind | null {
  const joined = messages.filter(Boolean).join(" | ");
  if (!joined) {
    return null;
  }
  if (/429|rate limit|busy/i.test(joined)) {
    return "rate_limit";
  }
  if (/timeout|timed out|aborted/i.test(joined)) {
    return "timeout";
  }
  if (/\b5\d\d\b|unavailable|server/i.test(joined)) {
    return "server";
  }
  if (/network|fetch failed/i.test(joined)) {
    return "network";
  }
  if (/no transactions|empty/i.test(joined)) {
    return "empty";
  }
  return "unknown";
}
