import { createHmac, randomBytes, timingSafeEqual } from "crypto";

export const X_TARGET_USERNAME = "bqrbase";

export function getXClientId(): string {
  const value = process.env.X_CLIENT_ID?.trim();
  if (!value) {
    throw new Error("X_CLIENT_ID is not configured");
  }
  return value;
}

export function getXClientSecret(): string {
  const value = process.env.X_CLIENT_SECRET?.trim();
  if (!value) {
    throw new Error("X_CLIENT_SECRET is not configured");
  }
  return value;
}

export function getXBearerToken(): string {
  const value = process.env.X_BEARER_TOKEN?.trim();
  if (!value) {
    throw new Error("X_BEARER_TOKEN is not configured");
  }
  // .env may store URL-encoded bearer tokens
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getAppBaseUrl(requestUrl: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const url = new URL(requestUrl);
  return `${url.protocol}//${url.host}`;
}

export function getXRedirectUri(requestUrl: string): string {
  return `${getAppBaseUrl(requestUrl)}/api/auth/x/callback`;
}

export function createOAuthState(): string {
  return randomBytes(24).toString("hex");
}

export function createCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

export async function createCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(digest).toString("base64url");
}

export function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function verifySignedPayload(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = signPayload(payload, secret);
  const left = Buffer.from(expected);
  const right = Buffer.from(signature);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function normalizeWalletAddress(walletAddress: string): string {
  return walletAddress.trim().toLowerCase();
}

export function isValidWalletAddress(walletAddress: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(walletAddress.trim());
}
