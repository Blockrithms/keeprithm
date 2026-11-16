import { redirect } from "next/navigation";
import { WorkspaceShell } from "~/components/workspace/layout/workspace-shell";
import { getUser, hasAuth } from "@/lib/cookies-util";
import { getWorkspace } from "@/services/workspace";

const isNextControlFlowError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const digest = "digest" in error ? String(error.digest) : "";
  return (
    digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND")
  );
};

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = await hasAuth();
  const user = await getUser();

  if (!isAuthenticated) {
    redirect("/api/auth/clear-session");
  }

  let workspaceData;

  try {
    workspaceData = await getWorkspace();
  } catch (error) {
    // refresh-session / clear-session redirects from the API client
    if (isNextControlFlowError(error)) {
      throw error;
    }

    workspaceData = null;
  }

  return (
    <WorkspaceShell workspace={workspaceData} user={user}>
      {children}
    </WorkspaceShell>
  );
}
