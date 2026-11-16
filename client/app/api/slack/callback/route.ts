import { NextRequest } from "next/server";
import {
  DEFAULT_ADMIN_ROUTE,
  DEFAULT_AUTH_ROUTE,
  ADMIN_ROLE,
  LOGIN_ROUTE,
  SLACK_CALLBACK_ROUTE,
  SLACK_STATE_KEY,
  SLACK_STATE_PREFIX,
} from "@/constants/auth";
import { server } from "@/lib/server";
import {
  getPublicOrigin,
  isCookieSecure,
  redirectRelative,
  setSessionCookies,
  setUserOnResponse,
} from "@/lib/session-cookies";

function clearStateCookies(
  response: ReturnType<typeof redirectRelative>,
  nonce?: string
) {
  const base = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: isCookieSecure(),
    maxAge: 0,
    expires: new Date(0),
  };

  if (nonce) {
    response.cookies.set(`${SLACK_STATE_PREFIX}${nonce}`, "", base);
  }
  response.cookies.set(SLACK_STATE_KEY, "", base);
}

function mapBackendErrorCode(error: unknown, flow: string): string {
  const message = String(
    (error as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ?? ""
  );

  if (message.includes("NOT_PRIMARY_OWNER")) return "not_primary_owner";
  if (message.toLowerCase().includes("restricted")) return "account_restricted";
  if (message.includes("WORKSPACE_NOT_ALLOWED")) return "workspace_not_allowed";

  return flow === "workspace_register"
    ? "workspace_install_failed"
    : "slack_exchange_failed";
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const slackError = searchParams.get("error");
  const rawState = searchParams.get("state") ?? "";
  const dotIdx = rawState.indexOf(".");
  const flow = dotIdx > 0 ? rawState.slice(0, dotIdx) : "";
  const nonce = dotIdx > 0 ? rawState.slice(dotIdx + 1) : "";

  const fail = (errorCode: string) => {
    const response = redirectRelative(
      `${LOGIN_ROUTE}?error=${encodeURIComponent(errorCode)}`
    );
    clearStateCookies(response, nonce);
    return response;
  };

  if (slackError) {
    return fail(
      slackError === "access_denied" ? "slack_cancelled" : "slack_failed"
    );
  }

  if (!code) {
    return fail("slack_failed");
  }

  const perAttemptKey = nonce ? `${SLACK_STATE_PREFIX}${nonce}` : "";
  const savedFlow = perAttemptKey
    ? request.cookies.get(perAttemptKey)?.value
    : undefined;
  const legacySavedNonce = request.cookies.get(SLACK_STATE_KEY)?.value;

  const stateValid =
    Boolean(nonce) &&
    (savedFlow === flow || (!savedFlow && legacySavedNonce === nonce));

  if (!stateValid || (flow !== "signin" && flow !== "workspace_register")) {
    console.warn("Slack callback state mismatch:", {
      flow,
      hasNonce: Boolean(nonce),
      hasSavedFlow: Boolean(savedFlow),
    });
    return fail("state_mismatch");
  }

  const redirectUri = `${getPublicOrigin(request)}/api${SLACK_CALLBACK_ROUTE}`;

  try {
    if (flow === "signin") {
      const { data } = await server.post("/auth/slack", { code, redirectUri });

      const destination =
        data?.user?.role === ADMIN_ROLE
          ? DEFAULT_ADMIN_ROUTE
          : DEFAULT_AUTH_ROUTE;

      const response = redirectRelative(destination);
      setSessionCookies(response, data.tokens);
      setUserOnResponse(
        response,
        data.user,
        data.tokens?.refresh?.maxAge ?? undefined
      );
      clearStateCookies(response, nonce);
      return response;
    }

    const { data } = await server.post("/workspace", { code, redirectUri });

    const response = redirectRelative(DEFAULT_AUTH_ROUTE);
    if (data?.tokens && data?.user) {
      setSessionCookies(response, data.tokens);
      setUserOnResponse(
        response,
        data.user,
        data.tokens?.refresh?.maxAge ?? undefined
      );
    }
    clearStateCookies(response, nonce);
    return response;
  } catch (error) {
    console.error("Slack callback token exchange failed:", error);
    return fail(mapBackendErrorCode(error, flow));
  }
}
