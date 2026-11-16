"use server";

import { server } from "@/lib/server";
import { catchAsync } from "@/lib/catch-async";

export type OpsJob = {
  running: boolean;
  startedAt: string | null;
  scope: string | null;
};

export type DashboardOverview = {
  workspaces: number;
  channels: { total: number; monitored: number };
  messages: number;
  threads: number;
  storage: {
    messages: number;
    threads: number;
    total: number;
  };
  users: {
    total: number;
    blocked: number;
    byRole: Record<string, number>;
  };
  job: OpsJob;
};

export type DashboardWorkspace = {
  id: string;
  name: string;
  slackId: string;
  avatar: string | null;
  owner: string;
  plan: string;
  channelCount: number;
  monitoredChannelCount: number;
  lastBackupAt: string | null;
};

export type DashboardUser = {
  id: string;
  name: string;
  email?: string;
  role: string;
  workspace?: string;
  workspaceName?: string | null;
  slackId?: string;
  isBlocked?: boolean;
  isBot?: boolean;
};

export type DashboardUsers = {
  results: DashboardUser[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
};

export const getDashboardOverview = catchAsync(async () => {
  const { data } = await server.get<DashboardOverview>("/dashboard/overview");
  return data;
});

export const getDashboardWorkspaces = catchAsync(async () => {
  const { data } = await server.get<DashboardWorkspace[]>(
    "/dashboard/workspaces"
  );
  return data;
});

export const getDashboardUsers = catchAsync(
  async (query?: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await server.get<DashboardUsers>("/dashboard/users", {
      params: query,
    });
    return data;
  }
);

export const startBackup = catchAsync(async (workspaceSlackId?: string) => {
  const { data } = await server.post("/dashboard/backups", {
    ...(workspaceSlackId ? { workspaceSlackId } : {}),
  });
  return data;
});

export const startSync = catchAsync(async (workspaceSlackId?: string) => {
  const { data } = await server.post("/dashboard/sync", {
    ...(workspaceSlackId ? { workspaceSlackId } : {}),
  });
  return data;
});

export const setUserBlocked = catchAsync(
  async (userId: string, isBlocked: boolean) => {
    const { data } = await server.patch(`/dashboard/users/${userId}`, {
      isBlocked,
    });
    return data;
  }
);
