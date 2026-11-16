import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  LOGIN_ROUTE,
  SLACK_CALLBACK_ROUTE,
  SLACK_STATE_PREFIX,
} from "@/constants/auth";
import {
  getPublicOrigin,
  isCookieSecure,
  redirectRelative,
} from "@/lib/session-cookies";

const DEFAULT_BOT_SCOPES =
  "channels:history,channels:read,groups:read,groups:history,files:read,users:read,team:read,chat:write";

function getBrowserHost(request: NextRequest): string | null {
  const forwarded = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  if (forwarded) return forwarded;
  return request.headers.get("host")?.trim() ?? null;
}

export async function GET(request: NextRequest) {
  const flow = request.nextUrl.searchParams.get("flow");
  const isCanonicalHop = request.nextUrl.searchParams.get("canonical") === "1";

  const isSignin = flow === "signin";
  if (!isSignin && flow !== "workspace_register") {
    return redirectRelative(LOGIN_ROUTE);
  }

  const publicOrigin = getPublicOrigin(request);
  const publicHost = new URL(publicOrigin).host;
  const browserHost = getBrowserHost(request);

  // If the developer opened http://localhost:3000 while APP_URL points to a
  // port-forwarding tunnel (devtunnels / ngrok), hop to the canonical tunnel
  // origin ONCE so the OAuth state cookie is stored on the same host that
  // Slack will redirect back to. `canonical=1` prevents an infinite loop when
  // the tunnel rewrites `Host: localhost:3000` without `x-forwarded-host`.
  if (!isCanonicalHop && browserHost && browserHost !== publicHost) {
    const canonicalStart = new URL("/api/slack/start", publicOrigin);
    canonicalStart.searchParams.set("flow", flow);
    canonicalStart.searchParams.set("canonical", "1");
    return NextResponse.redirect(canonicalStart, 302);
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  const authorizeUrl = isSignin
    ? process.env.SLACK_OPENID_AUTHORIZE_URL ||
      "https://slack.com/openid/connect/authorize"
    : process.env.SLACK_OAUTH_AUTHORIZE_URL ||
      "https://slack.com/oauth/v2/authorize";

  if (!clientId) {
    return redirectRelative(`${LOGIN_ROUTE}?error=slack_misconfigured`);
  }

  const nonce = randomBytes(16).toString("hex");
  const redirectUri = `${publicOrigin}/api${SLACK_CALLBACK_ROUTE}`;
  const botScopes = process.env.SLACK_BOT_SCOPES?.trim() || DEFAULT_BOT_SCOPES;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state: `${flow}.${nonce}`,
    ...(isSignin
      ? { response_type: "code", scope: "openid email profile" }
      : {
          scope: botScopes,
          user_scope: "openid,email,profile",
        }),
  });

  const response = NextResponse.redirect(
    `${authorizeUrl}?${params.toString()}`
  );

  // Key the cookie by nonce so multiple tabs / double-clicks never clobber an
  // in-flight OAuth attempt's state.
  response.cookies.set(`${SLACK_STATE_PREFIX}${nonce}`, flow, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isCookieSecure(),
    maxAge: 60 * 10,
  });

  return response;
}
