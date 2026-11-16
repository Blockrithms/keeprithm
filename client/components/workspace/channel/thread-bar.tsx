"use client";
import { ChevronRight } from "lucide-react";
import { formatSlackTimestampAgo } from "~/lib/utils";
import { ThreadBarProps } from "~/types";

export const ThreadBar = ({ count, timestamp, onClick }: ThreadBarProps) => {
  if (!count || !timestamp) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1 rounded-md hover:bg-primary-foreground border border-transparent hover:border-border flex items-center justify-start group/thread-bar transition max-w-[600px] mt-1 cursor-pointer"
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="text-xs text-sky-700 hover:underline font-bold truncate">
          {count} {count > 1 ? "replies" : "reply"}
        </span>
        <span className="text-xs text-muted-foreground truncate group-hover/thread-bar:hidden block">
          Last reply {formatSlackTimestampAgo(timestamp)}
        </span>
        <span className="text-xs text-muted-foreground truncate group-hover/thread-bar:block hidden">
          View thread
        </span>
      </div>
      <ChevronRight className="size-4 text-muted-foreground ml-auto opacity-0 group-hover/thread-bar:opacity-100 transition shrink-0" />
    </button>
  );
};
