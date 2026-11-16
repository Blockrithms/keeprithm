import { redirect } from "next/navigation";
import { getUser, hasAuth } from "@/lib/cookies-util";
import {
  ADMIN_ROLE,
  DEFAULT_ADMIN_ROUTE,
  DEFAULT_AUTH_ROUTE,
  LOGIN_ROUTE,
} from "@/constants/auth";

/** No marketing page. Send visitors into the app or to login. */
export default async function HomePage() {
  if (!(await hasAuth())) {
    redirect(LOGIN_ROUTE);
  }

  const user = await getUser();
  redirect(
    user?.role === ADMIN_ROLE ? DEFAULT_ADMIN_ROUTE : DEFAULT_AUTH_ROUTE
  );
}
