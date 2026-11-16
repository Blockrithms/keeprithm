// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
// Route matching is prefix-based (see `matchesRoute` in proxy.ts), so listing
// '/dashboard' also covers '/dashboard/users', '/dashboard/settings', etc.
// Exception: '/' only matches the home page itself.

/**
 * Login page. Logged-out users are redirected here from protected routes.
 * There is no marketing landing page; `/` only redirects.
 */
export const LOGIN_ROUTE = "/login";

/**
 * Pages meant only for logged-out users (e.g. login).
 * Authenticated users who visit these are redirected into the app.
 */
export const AUTH_ROUTES = [LOGIN_ROUTE];

/**
 * Pages anyone can visit without being logged in.
 * Any route NOT listed here (or in DISABLED_ROUTES) requires authentication.
 * "/" is included so the root redirect can run; it never renders a page.
 */
export const PUBLIC_ROUTES = ["/", "/contact", "/verify-email", ...AUTH_ROUTES];

/**
 * Pages that are turned off for everyone, regardless of auth state.
 * Visitors are redirected to login, or into the app if already signed in.
 * Checked before any auth logic.
 * Note: this only blocks page navigation; also disable the matching backend
 * endpoints.
 */
export const DISABLED_ROUTES = ["/register"];

/** Pages restricted to users whose role is ADMIN_ROLE. */
export const ADMIN_ROUTES = ["/dashboard"];

// ---------------------------------------------------------------------------
// Post-login destinations
// ---------------------------------------------------------------------------

/** Where admins land after login when no valid `redirect` param is provided. */
export const DEFAULT_ADMIN_ROUTE = "/dashboard";

/** Where regular users land after login when no valid `redirect` param is provided. */
export const DEFAULT_AUTH_ROUTE = "/workspace";

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

/** Role value (from the user cookie) that grants access to ADMIN_ROUTES. Case-sensitive. */
export const ADMIN_ROLE = "admin";

// ---------------------------------------------------------------------------
// Cookie keys
// ---------------------------------------------------------------------------
// These must match the keys used when the cookies are set in the cookie store
// file (setAuthCookies / setUser). Change them in both places together.

/** httpOnly cookie holding the short-lived access token. */
export const ACCESS_TOKEN_KEY = "access";

/** httpOnly cookie holding the long-lived refresh token. */
export const REFRESH_TOKEN_KEY = "refresh";

/**
 * Non-httpOnly cookie holding basic user info (name, email, role, ...).
 * Client-editable, so it's only used for UX routing (e.g. the admin check in
 * proxy.ts) and must never be trusted for real authorization.
 */
export const USER_COOKIE_KEY = "keeprithmuser";

// Slack OAuth constants
export const SLACK_STATE_KEY = "slack_oauth_state";
export const SLACK_STATE_PREFIX = "slack_oauth_";
export const SLACK_CALLBACK_ROUTE = "/slack/callback";
