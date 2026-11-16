"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Hash, Lock, MessageSquareText, SearchX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui";
import { useWorkspace } from "~/context/workspace-context";
import {
  convertSlackTimestamp,
  formatFullTime,
  normalizeMarkdown,
  truncateText,
} from "~/lib/utils";
import { Message } from "~/types";
import { format } from "date-fns";

interface Props {
  query: string;
  results: Message[];
}

export function SearchResults({ query, results }: Props) {
  const { workspace } = useWorkspace();
  const channels = workspace?.channels ?? [];

  const getChannel = (slackChannelId: string) =>
    channels.find((channel) => channel.slackId === slackChannelId);

  if (!query || query.length < 3) {
    return (
      <EmptyState
        icon={<MessageSquareText className="size-8 text-muted-foreground" />}
        title="Search your workspace"
        description="Enter at least 3 characters in the search bar above to find messages."
      />
    );
  }

  if (results.length === 0) {
    return (
      <EmptyState
        icon={<SearchX className="size-8 text-muted-foreground" />}
        title={`No results for “${query}”`}
        description="Try different keywords or check spelling."
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="shrink-0 border-b px-4 py-4 sm:px-6">
        <h1 className="text-lg font-semibold tracking-tight">
          {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Select a message to open it in its channel.
        </p>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-4">
        {results.map((message) => {
          const channel = getChannel(message.slackChannelId);
          const date = convertSlackTimestamp(message.ts);
          const snippet = truncateText(normalizeMarkdown(message.body), 40);

          return (
            <li key={message.id}>
              <Link
                href={`/workspace/channel/${message.slackChannelId}?messageId=${message.id}`}
                className="block rounded-md px-3 py-3 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
              >
                <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                    {channel?.isPrivate ? (
                      <Lock className="size-3" />
                    ) : (
                      <Hash className="size-3" />
                    )}
                    {channel?.name ?? "Unknown channel"}
                  </span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={date.toISOString()}>
                    {format(date, "MMM d, yyyy")}
                  </time>
                </div>

                <div className="flex gap-3">
                  <Avatar className="size-8 shrink-0">
                    <AvatarImage
                      src={message.sender?.avatar}
                      alt={message.sender?.name || "U"}
                    />
                    <AvatarFallback>
                      {message.sender?.name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold">
                        {message.sender?.name ?? "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatFullTime(message.ts)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm leading-relaxed text-foreground/90">
                      {snippet || "(no text)"}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
