import { clsx, type ClassValue } from "clsx";
import {
  differenceInMinutes,
  format,
  formatDistanceToNow,
  fromUnixTime,
  isToday,
  isYesterday,
} from "date-fns";
import { twMerge } from "tailwind-merge";
import { Message } from "~/types";
import { emojiMap, skinToneMap } from "~/constants/emoji-map";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toCapitalize(str: string) {
  if (!str) return "";
  return str[0].toUpperCase() + str.slice(1);
}

export const convertSlackTimestamp = (slackTs: string | number): Date => {
  const ts = typeof slackTs === "string" ? parseFloat(slackTs) : slackTs;
  return fromUnixTime(Math.floor(ts));
};

export const formatSlackTimestampAgo = (slackTs: string | number): string => {
  const date = convertSlackTimestamp(slackTs);
  return formatDistanceToNow(date, { addSuffix: true });
};

export const isCompactMessage = (
  currentMessage: Message,
  prevMessage: Message,
  timeThreshold = 5
) => {
  if (!prevMessage) return false;

  const currentTime = convertSlackTimestamp(currentMessage.ts);
  const prevTime = convertSlackTimestamp(prevMessage.ts);

  const isSameUser =
    currentMessage.sender?.slackId === prevMessage.sender?.slackId;
  const isWithinThreshold =
    differenceInMinutes(currentTime, prevTime) < timeThreshold;

  return isSameUser && isWithinThreshold;
};

export const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);

  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d");
};

export const formatFullTime = (slackTs: string) => {
  const date = convertSlackTimestamp(slackTs);

  if (isToday(date)) return "Today";
  else if (isYesterday(date)) return "Yesterday";
  return `${format(date, "MMM d, yyyy")} at ${format(date, "h:mm:ss a")}`;
};

export const getQueryParams = (request: Request) => {
  const url = new URL(request.url);
  const queryParams: Record<string, string | null> = {};

  for (const [key, value] of url.searchParams) {
    queryParams[key] = value;
  }

  return queryParams;
};

export const truncateText = (text: string, maxWords: number = 20) => {
  const words = text.split(" ");

  if (words.length > maxWords) {
    return words.slice(0, maxWords).join(" ") + "...";
  }

  return text;
};

export function getBaseEmojiName(slackName: string): string {
  if (!slackName || typeof slackName !== "string") return "";
  return slackName.replace(/^:|:$/g, "").split("::")[0];
}

export function getEmoji(slackName: string): string {
  const parts = slackName.replace(/^:|:$/g, "").split("::");
  const base = parts[0];
  const tone = parts[1];

  const baseEmoji = emojiMap[base];
  const skin = tone ? skinToneMap[tone] : "";

  return baseEmoji ? baseEmoji + (skin || "") : `:${base}:`;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const usableMentionName = (value?: string | null) => {
  if (!value) return undefined;
  const name = value.trim().replace(/^@/, "");
  if (!name || /^(anonymous|unknown)$/i.test(name) || /^unknown-/i.test(name)) {
    return undefined;
  }
  return name;
};

const mentionChip = (label: string, self = false) =>
  `<span class="slack-mention${self ? " slack-mention-self" : ""}">${escapeHtml(
    label
  )}</span>`;

export type SlackMentionDirectory = {
  users?: Record<string, string>;
  channels?: Record<string, string>;
  currentUserId?: string;
  currentUserName?: string;
};

export const normalizeMarkdown = (text: string): string => {
  return text
    .replace(/\\n/g, " ")
    .replace(/<!subteam\^[A-Z0-9]+\|@?([^>]+)>/gi, "@$1")
    .replace(/<!(here|channel|everyone)(?:\|[^>]*)?>/gi, "@$1")
    .replace(/<!date\^[^>|]*?(?:\|([^>]*))?>/gi, (_, label) => label || "")
    .replace(/<@([A-Z0-9]+)\|@?([^>]+)>/gi, "@$2")
    .replace(/<#([A-Z0-9]+)\|([^>]+)>/gi, "#$2")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/~(.*?)~/g, "$1")
    .replace(/`{1,3}([\s\S]*?)`{1,3}/g, "$1")
    .replace(/<([^|>]+)\|([^>]+)>/g, "$2")
    .replace(/<[^>]+>/g, "")
    .replace(/:([a-zA-Z0-9_+-]+):/g, "")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/• /g, "- ")
    .replace(/\s+/g, " ")
    .trim();
};

export const parseSlackMessage = (
  message: Message,
  directory?: SlackMentionDirectory
): string => {
  const { body, sender, mentions } = message;
  const chips: string[] = [];
  const holdMention = (label: string, self = false) => {
    const token = `%%MENTION${chips.length}%%`;
    chips.push(mentionChip(label, self));
    return token;
  };

  const userName = (userId: string, label?: string) =>
    usableMentionName(directory?.users?.[userId]) ||
    usableMentionName(mentions?.[userId]) ||
    usableMentionName(label) ||
    (sender?.slackId === userId ? usableMentionName(sender.name) : undefined) ||
    "unknown";

  const isSelfMention = (userId: string, label?: string) => {
    const currentId = directory?.currentUserId?.trim();
    if (currentId && userId.toUpperCase() === currentId.toUpperCase()) {
      return true;
    }
    const currentName = usableMentionName(
      directory?.currentUserName
    )?.toLowerCase();
    const mentionedName = userName(userId, label).toLowerCase();
    return Boolean(currentName && mentionedName === currentName);
  };

  const channelName = (channelId: string, label?: string) =>
    usableMentionName(label) ||
    usableMentionName(directory?.channels?.[channelId]) ||
    "channel";

  const withMentions = body
    .replace(/\\n/g, "\n")
    .replace(/<!subteam\^[A-Z0-9]+(?:\|([^>]*))?>/gi, (_, label) =>
      holdMention(`@${usableMentionName(label) || "group"}`)
    )
    .replace(/<!(here|channel|everyone)(?:\|[^>]*)?>/gi, (_, group) =>
      holdMention(`@${group}`)
    )
    .replace(/<!date\^[^>|]*?(?:\|([^>]*))?>/gi, (_, label) => label || "")
    .replace(/<@([A-Z0-9]+)(?:\|([^>]*))?>/gi, (_, userId, label) =>
      holdMention(`@${userName(userId, label)}`, isSelfMention(userId, label))
    )
    .replace(/<#([A-Z0-9]+)(?:\|([^>]*))?>/gi, (_, channelId, label) =>
      holdMention(`#${channelName(channelId, label)}`)
    );

  const formatted = withMentions
    .replace(/\*(.*?)\*/g, "**$1**") // Bold
    .replace(/_(.*?)_/g, "*$1*") // Italic
    .replace(/~(.*?)~/g, "~~$1~~") // Strikethrough
    .replace(/`(.*?)`/g, "`$1`") // Inline code
    .replace(/```([\s\S]*?)```/g, "```\n$1\n```") // Multiline code blocks
    .replace(/<([^|>]+)\|([^>]+)>/g, "[$2]($1)") // Slack-style links <url|text>
    .replace(/<([^>]+)>/g, (match, url) => {
      if (/^(http|https):\/\//.test(url)) {
        return `[${url}](${url})`;
      }
      return match;
    })
    .replace(/&gt;/g, ">")
    .replace(/(?<=\n|^)• /g, "\n- ")
    .replace(/(?<=\n|^)- /g, "\n- ")
    .replace(/(?<=\n|^)1\./g, "\n1.")
    .replace(/:([a-zA-Z0-9_+-]+):/g, (match, emojiName) => {
      const unicodeEmoji = getEmoji(emojiName);
      return unicodeEmoji || match;
    });

  return formatted.replace(
    /%%MENTION(\d+)%%/g,
    (_, index) => chips[Number(index)] ?? ""
  );
};

export const matchesRoute = (pathname: string, routes: string[]) =>
  routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

// Only allow same-origin relative paths to prevent open redirects
export const getSafeRedirect = (value: string | null) => {
  if (!value) return null;
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return null;
  }
  return value;
};
