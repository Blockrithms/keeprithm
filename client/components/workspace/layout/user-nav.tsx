"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronsUpDown,
  LogOut,
  Settings,
  Sparkles,
  UserCircle,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui";
import { useWorkspace } from "~/context/workspace-context";
import { logout } from "@/services/auth";

const menuGroup = [
  { icon: UserCircle, label: "Profile" },
  { icon: Settings, label: "Settings" },
];

export function UserNav() {
  const { isMobile } = useSidebar();
  const { user } = useWorkspace();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // logout() clears cookies in its finally block
    }
    router.push("/login");
    router.refresh();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              onClick={() => setOpen((prev) => !prev)}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <Avatar className="size-8">
                {user?.avatar && (
                  <AvatarImage src={user.avatar} alt={user?.name} />
                )}
                <AvatarFallback>
                  {user?.name ? user.name[0].toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.name}</span>
                <span className="truncate text-xs">{user?.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8">
                  {user?.avatar && (
                    <AvatarImage src={user.avatar} alt={user?.name} />
                  )}
                  <AvatarFallback>
                    {user?.name ? user.name[0].toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user?.name}</span>
                  <span className="truncate text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {menuGroup.map((item) => (
                <DropdownMenuItem key={item.label} className="cursor-pointer">
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
