"use client";

import React from "react";
import { WorkspaceProvider } from "~/context/workspace-context";
import { SearchProvider } from "~/context/search-context";
import { SidebarProvider, SidebarInset } from "~/components/ui/sidebar";
import { WorkspaceSidebar } from "./workspace-sidebar";
import { Header } from "./header";
import { SlackButton, WorkspaceRegisterWarning } from "~/components/common";
import { Button } from "~/components/ui/button";
import { logout } from "@/services/auth";
import { useRouter } from "next/navigation";

export function WorkspaceShell({
  workspace,
  user,
  children,
}: {
  workspace: any;
  user: any;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);

  if (!workspace) {
    const handleSignOut = async () => {
      setSigningOut(true);
      try {
        await logout();
      } catch {
        // cookies cleared in finally
      }
      router.push("/login");
      router.refresh();
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">Workspace not installed</h1>
            <p className="text-sm text-muted-foreground">
              Install your Slack workspace to start backing up and browsing
              conversations, or ask your Primary Workspace Owner to install it.
            </p>
          </div>
          <WorkspaceRegisterWarning />
          <SlackButton
            title="Install Slack Workspace"
            state="workspace_register"
          />
          <Button
            variant="ghost"
            className="w-full"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceProvider workspace={workspace} user={user}>
      <SearchProvider>
        <SidebarProvider>
          <WorkspaceSidebar />
          <SidebarInset>
            <div className="h-screen w-full min-w-0 flex flex-col">
              <Header />
              <main className="flex flex-1 min-w-0 overflow-hidden">
                {children}
              </main>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SearchProvider>
    </WorkspaceProvider>
  );
}
