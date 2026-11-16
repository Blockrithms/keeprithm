"use client";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui";
import { format } from "date-fns";
import { cn, convertSlackTimestamp, formatFullTime } from "~/lib/utils";
import { MessageAttachment, MessageProps } from "~/types";
import { Hint } from "~/components/common/hint";
import { RenderMarkdown } from "./render-markdown";
import { RenderMedia } from "./render-media";
import { Reactions } from "./reactions";
import { ThreadBar } from "./thread-bar";
import { User2Icon } from "lucide-react";

export const Message = ({
  message,
  isCompact,
  onClick,
  isHighlighted,
}: MessageProps) => {
  const { sender, ts, reactions, files, latestReplyTs, replyCount } = message;
  const date = convertSlackTimestamp(ts);
  const timeString = isCompact ? format(date, "h:mm") : format(date, "h:mm a");

  return (
    <>
      <div
        id={`message-${message.id}`}
        className={cn(
          "w-full flex gap-2 px-4 md:px-6 hover:bg-muted/40 scroll-mt-4",
          isCompact ? "group items-center pt-0 pb-1" : "items-start py-3",
          isHighlighted && "message-highlight"
        )}
      >
        {isCompact ? (
          <div className="w-9 flex justify-center">
            <Hint label={formatFullTime(ts)}>
              <span className="text-xs text-muted-foreground/85 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                {timeString}
              </span>
            </Hint>
          </div>
        ) : (
          <Avatar className="size-9 translate-y-[2px] ">
            <AvatarImage src={sender?.avatar} alt={sender?.name || "U"} />
            <AvatarFallback>
              {sender?.name ? sender.name[0]?.toUpperCase() : <User2Icon />}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 min-w-0">
          {!isCompact && (
            <div className="flex gap-2 items-center">
              <h1 className="font-bold text-sm">{sender?.name}</h1>
              <Hint label={formatFullTime(ts)}>
                <span className="text-xs text-muted-foreground/85 hover:underline cursor-pointer">
                  {timeString}
                </span>
              </Hint>
            </div>
          )}
          <RenderMarkdown message={message} />
          {files && files.length > 0 && (
            <div className="w-full sm:w-1/2 mt-2 flex flex-wrap gap-2 sm:gap-4 justify-start">
              {files.map((file: MessageAttachment) => (
                <RenderMedia key={file.slackId} file={file} />
              ))}
            </div>
          )}
          <Reactions data={reactions} />
          <ThreadBar
            count={replyCount}
            timestamp={latestReplyTs}
            onClick={onClick}
          />
        </div>
      </div>
    </>
  );
};
