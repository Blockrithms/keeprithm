import { cookies } from "next/headers";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_COOKIE_KEY,
} from "@/constants/auth";
import type { User } from "@/types";
import {
  buildAuthCookieOptions,
  buildUserCookiePayload,
  isCookieSecure,
  resolveTokenMaxAge,
  type SessionToken,
  type SessionTokens,
  type UserCookie,
} from "./session-cookies";

export type Token = SessionToken;
export type AuthTokens = SessionTokens;
export type { UserCookie };

/**
 * Set httpOnly + Secure auth cookies using the max-age returned by the backend.
 * Must only be called in a Server Action or Route Handler (or via trySetAuthCookies).
 */
export const setAuthCookies = async (tokens: AuthTokens) => {
  const cookieStore = await cookies();
  const { access, refresh } = tokens;

  cookieStore.set(
    ACCESS_TOKEN_KEY,
    access.token,
    buildAuthCookieOptions(access)
  );
  cookieStore.set(
    REFRESH_TOKEN_KEY,
    refresh.token,
    buildAuthCookieOptions(refresh)
  );
};

export const getAccessToken = async () => {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_KEY)?.value || null;
};

export const getRefreshToken = async () => {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_KEY)?.value || null;
};

export const deleteAuthCookies = async () => {
  const cookieStore = await cookies();
  const base = {
    path: "/",
    sameSite: "lax" as const,
    secure: isCookieSecure(),
    maxAge: 0,
    expires: new Date(0),
  };

  cookieStore.set(ACCESS_TOKEN_KEY, "", { ...base, httpOnly: true });
  cookieStore.set(REFRESH_TOKEN_KEY, "", { ...base, httpOnly: true });
  cookieStore.set(USER_COOKIE_KEY, "", { ...base, httpOnly: false });
};

export const hasAuth = async () => {
  const access = await getAccessToken();
  if (access) return true;

  const refresh = await getRefreshToken();
  return !!refresh;
};

export const setUser = async (user: User, tokens?: AuthTokens) => {
  const cookieStore = await cookies();
  const maxAge =
    (tokens?.refresh && resolveTokenMaxAge(tokens.refresh)) ??
    60 * 60 * 24 * 365;

  cookieStore.set(USER_COOKIE_KEY, buildUserCookiePayload(user), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    secure: isCookieSecure(),
    maxAge,
  });
};

export const getUser = async (): Promise<UserCookie | null> => {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get(USER_COOKIE_KEY)?.value;

  if (!userCookie) {
    return null;
  }

  try {
    return JSON.parse(userCookie) as UserCookie;
  } catch {
    return null;
  }
};
