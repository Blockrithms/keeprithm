import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_TOKEN_KEY,
  ADMIN_ROLE,
  ADMIN_ROUTES,
  AUTH_ROUTES,
  DEFAULT_ADMIN_ROUTE,
  DEFAULT_AUTH_ROUTE,
  DISABLED_ROUTES,
  LOGIN_ROUTE,
  PUBLIC_ROUTES,
  REFRESH_TOKEN_KEY,
  USER_COOKIE_KEY,
} from "./constants/auth";
import { getSafeRedirect, matchesRoute } from "./lib/utils";
import { refreshAuthTokens } from "./services/auth";
import { deleteAuthCookies, setAuthCookies } from "./lib/cookies-util";

const getUserRole = (request: NextRequest): string | null => {
  const raw = request.cookies.get(USER_COOKIE_KEY)?.value;
  if (!raw) return null;

  try {
    const user = JSON.parse(raw);
    return typeof user?.role === "string" ? user.role : null;
  } catch {
    return null;
  }
};

function redirectFromProxy(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get(ACCESS_TOKEN_KEY)?.value || null;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_KEY)?.value || null;

  const isAuthenticated = Boolean(accessToken || refreshToken);

  if (matchesRoute(pathname, DISABLED_ROUTES)) {
    return redirectFromProxy(
      request,
      isAuthenticated ? DEFAULT_AUTH_ROUTE : LOGIN_ROUTE
    );
  }

  if (!accessToken && refreshToken) {
    const tokens = await refreshAuthTokens(refreshToken);
    if (!tokens) {
      deleteAuthCookies();
    }

    await setAuthCookies(tokens);
  }

  const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);
  const isPublicRoute = matchesRoute(pathname, PUBLIC_ROUTES);
  const isAdminRoute = matchesRoute(pathname, ADMIN_ROUTES);

  if (!isAuthenticated && !isPublicRoute) {
    return redirectFromProxy(request, LOGIN_ROUTE);
  }

  const isAdmin = isAuthenticated && getUserRole(request) === ADMIN_ROLE;

  if (isAuthenticated && isAdminRoute && !isAdmin) {
    return redirectFromProxy(request, DEFAULT_AUTH_ROUTE);
  }

  if (isAuthenticated && isAuthRoute) {
    const requested = getSafeRedirect(
      request.nextUrl.searchParams.get("redirect")
    );
    const fallback = isAdmin ? DEFAULT_ADMIN_ROUTE : DEFAULT_AUTH_ROUTE;

    const target =
      requested && (isAdmin || !matchesRoute(requested, ADMIN_ROUTES))
        ? requested
        : fallback;

    return redirectFromProxy(request, target);
  }

  const response = NextResponse.next({ request });
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
