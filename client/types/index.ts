export interface LoginSchema {
  email: string;
  password: string;
}

export type User = {
  id: string;
  name: string;
  slackId: string;
  email: string;
  avatar: string;
  role: string;
  isDeleted: string;
  isEmailVerified: string;
  workspace: string;
};

export type Token = {
  token: string;
  expires: string;
};

export interface SessionData {
  user: User;
  tokens: {
    access: Token;
    refresh: Token;
  };
}

export interface Workspace {
  name: string;
  slackId: string;
  avatar?: string;
  plan: string;
  members: User[];
  channels: Channel[];
}

export interface Channel {
  id: string;
  slackId: string;
  name: string;
  slackWorkspaceId?: string;
  members?: User[];
  isPrivate: boolean;
  isBotAdded?: boolean;
}

export interface Message {
  id: string;
  body: string;
  sender: Pick<User, "name" | "avatar" | "slackId">;
  slackWorkspaceId: string;
  slackChannelId: string;
  replyCount: number;
  ts: string;
  threadTs: string;
  latestReplyTs: string;
  mentions: Record<string, string> | null;
  files: MessageAttachment[];
  reactions: MessageReaction[];
}

export interface MessageReaction {
  name: string;
  users: string[];
  count: number;
}

export interface MessageAttachment {
  slackId: string;
  name: string;
  mimetype: string;
  filetype: string;
  size: string;
  urlPrivate: string;
  urlPrivateDownload: string;
  permalink: string;
  isPublic: string;
  cloudUrl: string;
  cloudKey: string;
  created: string;
}

export interface WorkspaceLoaderResponse {
  workspace: Workspace;
  user: User;
}

export interface ChannelLoaderRespone {
  channel: Channel;
  channelMessages: PaginatedMessageResponse;
}

export interface PaginatedMessageResponse {
  totalResults: number;
  results: Message[];
  nextCursor?: string;
}

export interface MessageListProps {
  initialData: PaginatedMessageResponse;
  channelId: string;
  threadHandler: (threadTs: string) => void;
  focusMessageId?: string;
}

export interface MessageProps {
  message: Message;
  isCompact: boolean;
  onClick?: VoidFunction;
  isHighlighted?: boolean;
}

export interface ThreadProps {
  channelId: string;
  threadTs: string;
  closeThread: () => void;
}

export interface ThreadBarProps {
  count?: number;
  timestamp?: string;
  onClick?: any;
}

export type GroupedReactions = Record<
  string,
  {
    total: number;
    variants: MessageReaction[];
  }
>;
