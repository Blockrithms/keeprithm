"use client";

import { useParams } from "next/navigation";
import { ChevronRight, Lock, Hash } from "lucide-react";
import { User } from "~/types";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupContent,
  useSidebar,
} from "~/components/ui";
import { useIsMobile } from "~/hooks/use-mobile";
import { useWorkspace } from "~/context/workspace-context";
import Link from "next/link";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
}

const CollapsibleSection = ({ title, children }: CollapsibleSectionProps) => (
  <Collapsible
    key={title}
    title={title}
    defaultOpen
    className="group/collapsible"
  >
    <SidebarGroup>
      <SidebarGroupLabel
        asChild
        className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer"
      >
        <CollapsibleTrigger className="cursor-pointer">
          {title}
          <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
        </CollapsibleTrigger>
      </SidebarGroupLabel>
      <CollapsibleContent>
        <SidebarGroupContent>
          <SidebarMenu>{children}</SidebarMenu>
        </SidebarGroupContent>
      </CollapsibleContent>
    </SidebarGroup>
  </Collapsible>
);

export function NavMain() {
  const { workspace } = useWorkspace();
  const channels = workspace?.channels || [];
  const members = workspace?.members || [];

  const isMobile = useIsMobile();
  const { open: isSidebarOpen, toggleSidebar } = useSidebar();

  const params = useParams();
  const channelId = params?.channelId as string | undefined;

  return (
    <>
      <CollapsibleSection title="Channels">
        {channels.map((channel: any) => {
          const isActive = channelId === channel.slackId;

          return (
            <SidebarMenuItem key={channel.slackId}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={channel.name}
              >
                <Link
                  href={`/workspace/channel/${channel.slackId}`}
                  onClick={() => {
                    if (isMobile) toggleSidebar();
                  }}
                  className="flex items-center gap-2 w-full cursor-pointer"
                >
                  {channel.isPrivate ? (
                    <Lock className="size-4 shrink-0" />
                  ) : (
                    <Hash className="size-4 shrink-0" />
                  )}
                  <span className="truncate">{channel.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </CollapsibleSection>

      <CollapsibleSection title="Members">
        {members.map((member: User) => {
          return (
            <SidebarMenuItem
              key={member.id || member.slackId || (member as any)._id}
            >
              <div
                className={`flex items-center gap-3 mt-2 ${
                  isSidebarOpen ? "ml-2" : "justify-center"
                }`}
              >
                <Avatar
                  className={`transition-all duration-300 ${
                    isSidebarOpen ? "size-8" : "size-6"
                  }`}
                >
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback>
                    {member.name ? member.name[0].toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <p className={`${!isSidebarOpen ? "hidden" : ""}`}>
                  {member.name}
                </p>
              </div>
            </SidebarMenuItem>
          );
        })}
      </CollapsibleSection>
    </>
  );
}
