"use client";

import { Hash, Lock } from "lucide-react";
import { MessageList } from "./message-list";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Separator,
} from "~/components/ui";
import { ChannelLoaderRespone } from "~/types";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { useThreadState } from "~/hooks/use-thread-state";
import { ThreadPanel } from "./thread-panel";
import { useIsMobile } from "~/hooks/use-mobile";
import { useEffect } from "react";

export const ChannelView = ({
  channel,
  channelMessages,
  focusMessageId,
}: ChannelLoaderRespone & { focusMessageId?: string }) => {
  const isMobile = useIsMobile();
  const { isThreadOpen, activeThreadTs, openThread, closeThread } =
    useThreadState();

  const members = channel?.members || [];

  useEffect(() => {
    closeThread();
  }, [channel.slackId, closeThread]);

  if (!channel) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-muted-foreground">Channel not found.</p>
      </div>
    );
  }

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full w-full relative"
    >
      <ResizablePanel
        defaultSize={isThreadOpen ? 62 : 100}
        minSize={30}
        className="flex flex-col h-full w-full min-w-0"
      >
        <div className="flex justify-between w-full px-3 sm:px-6 h-16">
          <div className="flex gap-1 items-center">
            {channel.isPrivate ? <Lock size={20} /> : <Hash size={20} />}
            <span className="text-lg font-semibold">{channel.name}</span>
          </div>
          {!isMobile && (
            <div className="flex items-center">
              <div className="flex items-center flex-row-reverse justify-end -space-x-4 space-x-reverse z-20">
                {members.map((member) => (
                  <Avatar
                    key={member.slackId}
                    className="w-9 h-9 border-[3px] border-primary-foreground bg-background shadow-sm transition-transform transform hover:scale-110 hover:border-none hover:z-10 cursor-pointer"
                  >
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>
                      {member.name ? member.name[0].toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="size-8.5 z-10 -ml-2 bg-muted rounded-md text-sm font-semibold flex items-center justify-center shadow-sm">
                {members.length}
              </div>
            </div>
          )}
        </div>
        <Separator />
        <MessageList
          initialData={channelMessages}
          channelId={channel.slackId}
          threadHandler={openThread}
          focusMessageId={focusMessageId}
        />
      </ResizablePanel>
      {isThreadOpen &&
        (isMobile ? (
          <div className="h-full w-full absolute left-0 bg-background">
            <ThreadPanel
              channelId={channel.slackId}
              threadTs={activeThreadTs}
              closeThread={closeThread}
            />
          </div>
        ) : (
          <>
            <ResizableHandle />
            <ResizablePanel
              defaultSize={38}
              minSize={25}
              maxSize={50}
              className="border-l shadow-lg"
            >
              <ThreadPanel
                channelId={channel.slackId}
                threadTs={activeThreadTs}
                closeThread={closeThread}
              />
            </ResizablePanel>
          </>
        ))}
    </ResizablePanelGroup>
  );
};

export default ChannelView;
