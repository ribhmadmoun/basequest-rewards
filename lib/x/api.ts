import {
  getXBearerToken,
  getXClientId,
  getXClientSecret,
  X_TARGET_USERNAME,
} from "@/lib/x/config";

const X_API = "https://api.twitter.com";
const X_AUTH = "https://twitter.com";

export type XTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scope?: string;
};

export type XUser = {
  id: string;
  name: string;
  username: string;
};

function basicAuthHeader(clientId: string, clientSecret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

export function buildXAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const url = new URL(`${X_AUTH}/i/oauth2/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set(
    "scope",
    ["tweet.read", "users.read", "follows.read", "offline.access"].join(" "),
  );
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export async function exchangeXCodeForToken(params: {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<XTokenResponse> {
  const clientId = getXClientId();
  const clientSecret = getXClientSecret();

  const body = new URLSearchParams({
    code: params.code,
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: params.redirectUri,
    code_verifier: params.codeVerifier,
  });

  const response = await fetch(`${X_API}/2/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(clientId, clientSecret),
    },
    body,
  });

  const json = (await response.json()) as XTokenResponse & {
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !json.access_token) {
    throw new Error(
      json.error_description || json.error || "Failed to exchange X OAuth code",
    );
  }

  return json;
}

export async function fetchXAuthenticatedUser(
  accessToken: string,
): Promise<XUser> {
  const response = await fetch(`${X_API}/2/users/me?user.fields=username,name`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const json = (await response.json()) as {
    data?: XUser;
    errors?: Array<{ detail?: string; title?: string }>;
  };

  if (!response.ok || !json.data?.id) {
    throw new Error(
      json.errors?.[0]?.detail ||
        json.errors?.[0]?.title ||
        "Failed to fetch authenticated X user",
    );
  }

  return json.data;
}

let cachedTargetUserId: string | null = null;

export async function fetchTargetXUserId(): Promise<string> {
  if (cachedTargetUserId) {
    return cachedTargetUserId;
  }

  const bearer = getXBearerToken();
  const response = await fetch(
    `${X_API}/2/users/by/username/${X_TARGET_USERNAME}?user.fields=username`,
    {
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
      cache: "no-store",
    },
  );

  const json = (await response.json()) as {
    data?: { id: string; username: string };
    errors?: Array<{ detail?: string; title?: string }>;
  };

  if (!response.ok || !json.data?.id) {
    throw new Error(
      json.errors?.[0]?.detail ||
        json.errors?.[0]?.title ||
        `Failed to resolve @${X_TARGET_USERNAME}`,
    );
  }

  cachedTargetUserId = json.data.id;
  return cachedTargetUserId;
}

/**
 * Returns whether `sourceUserId` follows `targetUserId`.
 * Uses the user-context access token (follows.read).
 */
export async function doesUserFollowTarget(params: {
  accessToken: string;
  sourceUserId: string;
  targetUserId: string;
}): Promise<boolean> {
  // Preferred relationship lookup (when available on the app's access tier).
  const relationshipUrl = `${X_API}/2/users/${params.sourceUserId}/following/${params.targetUserId}`;
  const relationshipResponse = await fetch(relationshipUrl, {
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
    cache: "no-store",
  });

  if (relationshipResponse.ok) {
    const json = (await relationshipResponse.json()) as {
      data?: { following?: boolean };
    };
    if (typeof json.data?.following === "boolean") {
      return json.data.following;
    }
  }

  // Fallback: scan following list for the target account.
  let nextToken: string | undefined;
  for (let page = 0; page < 10; page += 1) {
    const url = new URL(
      `${X_API}/2/users/${params.sourceUserId}/following`,
    );
    url.searchParams.set("max_results", "1000");
    url.searchParams.set("user.fields", "username");
    if (nextToken) {
      url.searchParams.set("pagination_token", nextToken);
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
      },
      cache: "no-store",
    });

    const json = (await response.json()) as {
      data?: Array<{ id: string; username?: string }>;
      meta?: { next_token?: string; result_count?: number };
      errors?: Array<{ detail?: string; title?: string }>;
      status?: number;
      title?: string;
      detail?: string;
    };

    if (!response.ok) {
      // 404 from relationship-style probes is expected; list errors are hard failures.
      if (response.status === 404 && page === 0) {
        return false;
      }
      throw new Error(
        json.errors?.[0]?.detail ||
          json.detail ||
          json.title ||
          "Failed to verify X follow relationship",
      );
    }

    const found = (json.data ?? []).some(
      (user) =>
        user.id === params.targetUserId ||
        user.username?.toLowerCase() === X_TARGET_USERNAME.toLowerCase(),
    );
    if (found) {
      return true;
    }

    nextToken = json.meta?.next_token;
    if (!nextToken) {
      break;
    }
  }

  return false;
}
