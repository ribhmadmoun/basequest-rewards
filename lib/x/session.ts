import { cookies } from "next/headers";
import {
  getXClientSecret,
  normalizeWalletAddress,
  signPayload,
  verifySignedPayload,
} from "@/lib/x/config";

export const X_OAUTH_COOKIE = "bq_x_oauth";
export const X_SESSION_COOKIE = "bq_x_session";
export const X_PUBLIC_COOKIE = "bq_x_public";

const COOKIE_MAX_AGE_OAUTH = 60 * 10; // 10 minutes
const COOKIE_MAX_AGE_SESSION = 60 * 60 * 24 * 30; // 30 days

export type XOAuthPending = {
  state: string;
  codeVerifier: string;
  walletAddress: string;
  returnTo: string;
};

export type XSession = {
  walletAddress: string;
  xUserId: string;
  xUsername: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};

export type XPublicProfile = {
  connected: true;
  walletAddress: string;
  xUserId: string;
  xUsername: string;
};

function encodeSigned(value: unknown, secret: string): string {
  const payload = Buffer.from(JSON.stringify(value), "utf8").toString(
    "base64url",
  );
  const signature = signPayload(payload, secret);
  return `${payload}.${signature}`;
}

function decodeSigned<T>(raw: string | undefined, secret: string): T | null {
  if (!raw) {
    return null;
  }

  const [payload, signature] = raw.split(".");
  if (!payload || !signature) {
    return null;
  }

  if (!verifySignedPayload(payload, signature, secret)) {
    return null;
  }

  try {
    return JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as T;
  } catch {
    return null;
  }
}

function cookieOptions(maxAge: number, httpOnly: boolean) {
  return {
    httpOnly,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function setOAuthPendingCookie(pending: XOAuthPending) {
  const secret = getXClientSecret();
  const store = await cookies();
  store.set(
    X_OAUTH_COOKIE,
    encodeSigned(pending, secret),
    cookieOptions(COOKIE_MAX_AGE_OAUTH, true),
  );
}

export async function readOAuthPendingCookie(): Promise<XOAuthPending | null> {
  const secret = getXClientSecret();
  const store = await cookies();
  return decodeSigned<XOAuthPending>(store.get(X_OAUTH_COOKIE)?.value, secret);
}

export async function clearOAuthPendingCookie() {
  const store = await cookies();
  store.delete(X_OAUTH_COOKIE);
}

export async function setXSessionCookie(session: XSession) {
  const secret = getXClientSecret();
  const store = await cookies();
  store.set(
    X_SESSION_COOKIE,
    encodeSigned(session, secret),
    cookieOptions(COOKIE_MAX_AGE_SESSION, true),
  );

  const publicProfile: XPublicProfile = {
    connected: true,
    walletAddress: normalizeWalletAddress(session.walletAddress),
    xUserId: session.xUserId,
    xUsername: session.xUsername,
  };

  store.set(
    X_PUBLIC_COOKIE,
    encodeSigned(publicProfile, secret),
    cookieOptions(COOKIE_MAX_AGE_SESSION, false),
  );
}

export async function readXSessionCookie(): Promise<XSession | null> {
  const secret = getXClientSecret();
  const store = await cookies();
  const session = decodeSigned<XSession>(
    store.get(X_SESSION_COOKIE)?.value,
    secret,
  );

  if (!session) {
    return null;
  }

  if (session.expiresAt && session.expiresAt < Date.now()) {
    return null;
  }

  return session;
}

export async function readXPublicProfile(): Promise<XPublicProfile | null> {
  const secret = getXClientSecret();
  const store = await cookies();
  return decodeSigned<XPublicProfile>(
    store.get(X_PUBLIC_COOKIE)?.value,
    secret,
  );
}

export async function clearXSessionCookies() {
  const store = await cookies();
  store.delete(X_SESSION_COOKIE);
  store.delete(X_PUBLIC_COOKIE);
}
