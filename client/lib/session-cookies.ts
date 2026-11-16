import "next/dist/compiled/server-only";
import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_COOKIE_KEY,
} from "@/constants/auth";
import type { User } from "@/types";

export type SessionToken = {
  token: string;
  expires?: string | Date;
  expiry?: string | Date;
  maxAge?: number;
};

export type SessionTokens = {
  access: SessionToken;
  refresh: SessionToken;
};

export type UserCookie = {
  name: string;
  email: string;
  role: string;
  avatar: string;
  isEmailVerified: string | boolean;
  slackId: string;
  workspace: string;
};

/**
 * Auth cookies are Secure by default (HTTPS in prod and HTTPS tunnels like
 * VS Code devtunnels / ngrok in dev). Set COOKIE_SECURE=false only when
 * testing over plain http://localhost without a tunnel.
 */
export const isCookieSecure = (): boolean => {
  if (process.env.COOKIE_SECURE === "false") return false;
  if (process.env.COOKIE_SECURE === "true") return true;

  const appUrl = process.env.APP_URL;
  if (appUrl) {
    try {
      return new URL(appUrl).protocol === "https:";
    } catch {
      // fall through
    }
  }

  return true;
};

export function resolveTokenMaxAge(token: SessionToken): number | undefined {
  if (typeof token.maxAge === "number" && Number.isFinite(token.maxAge)) {
    return Math.max(0, Math.floor(token.maxAge));
  }

  const raw = token.expires ?? token.expiry;
  if (!raw) return undefined;

  const ms = new Date(raw).getTime() - Date.now();
  if (!Number.isFinite(ms)) return undefined;

  return Math.max(0, Math.floor(ms / 1000));
}

export function resolveTokenExpires(token: SessionToken): Date | undefined {
  const raw = token.expires ?? token.expiry;
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function buildAuthCookieOptions(token: SessionToken) {
  const maxAge = resolveTokenMaxAge(token);
  const expires = resolveTokenExpires(token);

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: isCookieSecure(),
    ...(maxAge !== undefined ? { maxAge } : {}),
    ...(expires ? { expires } : {}),
  };
}

export function buildUserCookiePayload(user: Partial<User>): string {
  const payload: UserCookie = {
    name: user.name ?? "",
    email: user.email ?? "",
    role: user.role ?? "user",
    avatar: user.avatar ?? "",
    isEmailVerified: user.isEmailVerified ?? "",
    slackId: user.slackId ?? "",
    workspace: user.workspace ?? "",
  };
  return JSON.stringify(payload);
}

/** Write httpOnly + Secure auth cookies onto a NextResponse. */
export function setSessionCookies(
  response: NextResponse,
  tokens: SessionTokens
) {
  response.cookies.set(
    ACCESS_TOKEN_KEY,
    tokens.access.token,
    buildAuthCookieOptions(tokens.access)
  );
  response.cookies.set(
    REFRESH_TOKEN_KEY,
    tokens.refresh.token,
    buildAuthCookieOptions(tokens.refresh)
  );
}

/** Write the UX-only user cookie onto a NextResponse. */
export function setUserOnResponse(
  response: NextResponse,
  user: Partial<User>,
  maxAge = 60 * 60 * 24 * 365
) {
  response.cookies.set(USER_COOKIE_KEY, buildUserCookiePayload(user), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    secure: isCookieSecure(),
    maxAge,
  });
}

/** Clear all session cookies on a NextResponse. */
export function clearSessionCookies(response: NextResponse) {
  const secure = isCookieSecure();
  const base = {
    path: "/",
    sameSite: "lax" as const,
    secure,
    maxAge: 0,
    expires: new Date(0),
  };

  response.cookies.set(ACCESS_TOKEN_KEY, "", { ...base, httpOnly: true });
  response.cookies.set(REFRESH_TOKEN_KEY, "", { ...base, httpOnly: true });
  response.cookies.set(USER_COOKIE_KEY, "", { ...base, httpOnly: false });
}

/** Only allow same-origin relative paths for redirects. */
export function getSafeNextPath(
  value: string | null | undefined,
  fallback = "/workspace"
) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return fallback;
  }
  return value;
}

/**
 * Relative-Location redirect for Route Handlers.
 *
 * Behind port-forwarding tunnels (VS Code devtunnels, Codespaces, some nginx
 * setups), `request.url` can have `Host: localhost:3000` with
 * `x-forwarded-proto: https`, turning `NextResponse.redirect(new URL(path, request.url))`
 * into `Location: https://localhost:3000/...` which breaks TLS in the browser.
 *
 * RFC 9110 §10.2.2 allows a relative `Location` URI reference, which the
 * browser resolves against the actual origin in its address bar.
 */
export function redirectRelative(path: string, status: 302 | 303 | 307 = 302) {
  const safePath = getSafeNextPath(path, "/");
  return new NextResponse(null, {
    status,
    headers: { Location: safePath },
  });
}

/**
 * Canonical public origin (for OAuth callbacks where external providers
 * redirect back to a registered domain).
 */
export function getPublicOrigin(request: NextRequest): string {
  const configured = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // fall through
    }
  }

  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const forwardedProto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";

  if (forwardedHost && !forwardedHost.startsWith("localhost")) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return request.nextUrl.origin;
}
