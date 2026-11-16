"use client";

import { useSidebar } from "~/components/ui/sidebar";
import { useWorkspace } from "~/context/workspace-context";
import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui";

export function SidebarHeader() {
  const { open: isSidebarOpen } = useSidebar();
  const { workspace } = useWorkspace();

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2 transition-all",
        isSidebarOpen ? "px-2" : "justify-center"
      )}
    >
      <Avatar className="size-8 shrink-0 rounded-md">
        {workspace?.avatar && (
          <AvatarImage src={workspace.avatar} alt={workspace?.name} />
        )}
        <AvatarFallback className="rounded-md bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
          {workspace?.name ? workspace.name[0].toUpperCase() : "W"}
        </AvatarFallback>
      </Avatar>
      {isSidebarOpen && (
        <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">{workspace?.name}</span>
        </div>
      )}
    </div>
  );
}
