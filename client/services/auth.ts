"use server";

import { server } from "@/lib/server";
import { catchAsync } from "@/lib/catch-async";
import {
  deleteAuthCookies,
  getRefreshToken,
  setAuthCookies,
  setUser,
} from "@/lib/cookies-util";
import axios from "axios";

export const login = catchAsync(
  async (credentials: { email: string; password: string }) => {
    const { data } = await server.post(`/auth/login`, credentials);

    // Commit Session
    await Promise.all([
      setAuthCookies(data.tokens),
      setUser(data.user, data.tokens),
    ]);

    return data;
  }
);

export const logout = catchAsync(async () => {
  const refreshToken = await getRefreshToken();

  try {
    if (refreshToken) {
      await server.post(`/auth/logout`, { refreshToken });
    }
  } catch {
    // Even if the backend token is already expired/deleted, always clear local cookies.
  } finally {
    await deleteAuthCookies();
  }

  return { success: true };
});

export const refreshAuthTokens = async (refreshToken: string) => {
  try {
    const { data: tokens } = await axios.post(
      `${process.env.SERVER_BASE_URL}/auth/refresh-tokens`,
      { refreshToken }
    );
    return tokens;
  } catch (error) {
    console.log("refreshToken ~ error:", error);
    return null;
  }
};
