"use client";

import { Loader, X } from "lucide-react";
import { Button, Separator } from "~/components/ui";
import { Message } from "./message";
import { Message as ChannelMessage, ThreadProps } from "~/types";
import { isCompactMessage } from "~/lib/utils";
import { ScrollArea } from "~/components/ui";
import { useQuery } from "@tanstack/react-query";
import { fetchThreadMessages } from "@/services/message";

export const ThreadPanel = ({
  channelId,
  threadTs,
  closeThread,
}: ThreadProps) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["thread-messages", channelId, threadTs],
    queryFn: async () => {
      return await fetchThreadMessages(channelId, threadTs);
    },
    enabled: Boolean(channelId && threadTs),
  });

  const totalReplies = data?.length - 1;

  return (
    <div>
      <div className="flex justify-between items-center w-full px-3 sm:px-6 h-16">
        <span className="text-lg font-semibold">Thread</span>
        <Button onClick={closeThread} variant={"ghost"} size={"icon"}>
          <X />
        </Button>
      </div>
      <Separator />
      {isLoading ? (
        <div className="h-[calc(100%-9rem)] w-full flex items-center justify-center">
          <Loader className="size-5 animate-spin" />
        </div>
      ) : isError ? (
        <p className="px-6 py-8 text-sm text-muted-foreground">
          Couldn&apos;t load this thread.
        </p>
      ) : (
        <div className="py-4">
          <ScrollArea className="overflow-y-auto h-[82vh]">
            {data &&
              data.map((message: ChannelMessage, index: number) => {
                const prevMessage = data[index - 1];
                const isCompact = isCompactMessage(message, prevMessage);
                return (
                  <div key={message.id}>
                    {message.ts === message.threadTs ? (
                      <div className="mb-2">
                        <Message message={message} isCompact={isCompact} />
                        <div className="p-4 relative">
                          <span className="absolute top-1 text-muted-foreground text-sm px-2 bg-background leading-relaxed">
                            {totalReplies > 1
                              ? `${totalReplies} replies`
                              : `${totalReplies} reply`}
                          </span>
                          <hr />
                        </div>
                      </div>
                    ) : (
                      <Message message={message} isCompact={isCompact} />
                    )}
                  </div>
                );
              })}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
