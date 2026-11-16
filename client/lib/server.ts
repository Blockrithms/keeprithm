import axios, { type InternalAxiosRequestConfig } from "axios";
import {
  deleteAuthCookies,
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
} from "./cookies-util";
import { refreshAuthTokens } from "@/services/auth";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
  _skipAuthRefresh?: boolean;
}

const AUTH_BYPASS_PATHS = [
  "/auth/login",
  "/auth/slack",
  "/auth/refresh-tokens",
  "/auth/logout",
  "/auth/forgot-password",
  "/auth/reset-password",
];

function shouldSkipRefresh(url?: string): boolean {
  if (!url) return false;
  return AUTH_BYPASS_PATHS.some((path) => url.startsWith(path));
}

/**
 * Server-only Axios client for the Express API.
 *
 * - Attaches the access token from httpOnly cookies.
 * - If the access cookie is missing/expired while a refresh cookie exists,
 *   transparently refreshes BEFORE sending so the user's in-flight request
 *   goes straight through with no redirect or lost state.
 * - If a call still receives 401 (e.g. token expired mid-request or backend
 *   clock skew), refreshes once, persists new cookies when in a Server Action
 *   or Route Handler, and retries the exact original request transparently.
 */
export const server = axios.create({
  baseURL: process.env.SERVER_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

server.interceptors.request.use(
  async (config: RetryableRequestConfig) => {
    if (config._skipAuthRefresh || shouldSkipRefresh(config.url)) {
      const token = await getAccessToken();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }

    // Never overwrite a freshly-minted Authorization header on a 401 retry.
    if (config._retried && config.headers.Authorization) {
      return config;
    }

    const accessToken = await getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    }

    // Access cookie expired/removed, refresh cookie present → refresh inline
    // so the user's in-flight request succeeds transparently.
    const refreshToken = await getRefreshToken();

    if (refreshToken) {
      const tokens = await refreshAuthTokens(refreshToken);

      if (!tokens) {
        await deleteAuthCookies();
      }

      await setAuthCookies(tokens);
      config.headers.Authorization = `Bearer ${tokens.access.token}`;
      config._retried = true;
      return config;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

server.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalConfig ||
      originalConfig._retried ||
      originalConfig._skipAuthRefresh ||
      shouldSkipRefresh(originalConfig.url)
    ) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);
