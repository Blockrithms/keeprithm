"use client";
import { useEffect } from "react";
import { Loader } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "~/components/ui";
import { Message } from "./message";
import { usePaginatedMessages } from "~/hooks/use-paginated-messages";
import {
  convertSlackTimestamp,
  formatDateLabel,
  isCompactMessage,
} from "~/lib/utils";
import { Message as ChannelMessage, MessageListProps } from "~/types";

export const MessageList = ({
  initialData,
  channelId,
  threadHandler,
  focusMessageId,
}: MessageListProps) => {
  const { messages, topRef, scrollRef, isFetching } = usePaginatedMessages({
    initialData,
    channelId,
  });

  useEffect(() => {
    if (focusMessageId) {
      const frame = requestAnimationFrame(() => {
        const el = document.getElementById(`message-${focusMessageId}`);
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
      return () => cancelAnimationFrame(frame);
    }

    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.results, focusMessageId]);

  const groupedMessages = messages.reduce(
    (groups: Record<string, ChannelMessage[]>, message: ChannelMessage) => {
      const messageDate = convertSlackTimestamp(message.ts);
      const dateKey = format(messageDate, "yyyy-MM-dd");

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].unshift(message);
      return groups;
    },
    {}
  );

  return (
    <>
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto flex flex-col-reverse pb-4"
      >
        {Object.entries(groupedMessages || {}).map(
          ([dateKey, messages]: [string, ChannelMessage[]]) => (
            <div key={dateKey}>
              <div className="text-center my-2 relative">
                <Separator className="absolute top-1/2 left-0 right-0" />
                <span className="relative inline-block bg-primary-foreground px-4 py-1 rounded-full text-xs border shadow-sm">
                  {formatDateLabel(dateKey)}
                </span>
              </div>

              {messages.map((message: ChannelMessage, index: number) => {
                const prevMessage = messages[index - 1];
                const isCompact = isCompactMessage(message, prevMessage);
                return (
                  <Message
                    key={message.id}
                    message={message}
                    isCompact={isCompact}
                    isHighlighted={focusMessageId === message.id}
                    onClick={() =>
                      threadHandler(message.threadTs || message.ts)
                    }
                  />
                );
              })}
            </div>
          )
        )}

        <div ref={topRef} />
        {isFetching && (
          <div className="text-center my-2 relative">
            <hr className="absolute top-1/2 left-0 right-0 border-t bg-muted-foreground" />
            <span className="relative inline-block bg-background px-4 py-1 rounded-full text-xs border shadow-sm">
              <Loader className="size-4 animate-spin" />
            </span>
          </div>
        )}
      </div>
    </>
  );
};
