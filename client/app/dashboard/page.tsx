import { Database, Download, HardDrive, Users } from "lucide-react";
import { StatsCard } from "./stats-card";
import { Logo } from "~/components/common/logo";
import { ThemeToggle } from "~/components/common/theme-toggle";
import { UserNav } from "./user-nav";
import { WorkspaceTable } from "./workspace-table";
import { UserTable } from "./user-table";
import { getUser } from "@/lib/cookies-util";
import {
  getDashboardOverview,
  getDashboardUsers,
  getDashboardWorkspaces,
  type DashboardOverview,
  type DashboardUsers,
  type DashboardWorkspace,
  type OpsJob,
} from "@/services/admin";

export const metadata = {
  title: "Dashboard - Keeprithm",
};

const idleJob: OpsJob = { running: false, startedAt: null, scope: null };

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes < 1) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const power = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** power;
  const digits = power === 0 || value >= 100 ? 0 : 1;
  const rounded = value.toFixed(digits).replace(/\.0$/, "");
  return `${rounded} ${units[power]}`;
};

export default async function DashboardPage() {
  const user = await getUser();

  let overview: DashboardOverview | null = null;
  let workspaces: DashboardWorkspace[] = [];
  let users: DashboardUsers = {
    results: [],
    page: 1,
    limit: 50,
    totalPages: 0,
    totalResults: 0,
  };
  let loadError: string | null = null;

  try {
    [overview, workspaces, users] = await Promise.all([
      getDashboardOverview(),
      getDashboardWorkspaces(),
      getDashboardUsers({ limit: 50 }),
    ]);
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Could not load the dashboard";
  }

  const statCards = overview
    ? [
        {
          title: "Workspaces",
          value: overview.workspaces.toLocaleString(),
          note: "Installed Slack workspaces",
          icon: Users,
        },
        {
          title: "Channels monitored",
          value: overview.channels.monitored.toLocaleString(),
          note: `${overview.channels.total.toLocaleString()} channels synced`,
          icon: Database,
        },
        {
          title: "Messages backed up",
          value: overview.messages.toLocaleString(),
          note: `${overview.threads.toLocaleString()} thread replies`,
          icon: Download,
        },
        {
          title: "Stored on disk",
          value: formatBytes(overview.storage.total),
          note: `Messages ${formatBytes(
            overview.storage.messages
          )}, threads ${formatBytes(overview.storage.threads)}`,
          icon: HardDrive,
        },
      ]
    : [];

  const job = overview?.job ?? idleJob;

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
        <div className="flex flex-1 items-center gap-2">
          <Logo />
        </div>
        <div className="flex items-center justify-center gap-2">
          <ThemeToggle />
          <UserNav user={user} />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col gap-6 px-4 py-6">
        {loadError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
            {loadError}
          </p>
        ) : (
          <>
            <div className="shrink-0">
              <h1 className="text-2xl font-semibold tracking-tight">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Live archive counts, backup freshness, and who can sign in.
              </p>
            </div>
            <div className="grid shrink-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card) => (
                <StatsCard key={card.title} {...card} />
              ))}
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-6">
              <WorkspaceTable workspaces={workspaces} job={job} />
              <UserTable
                users={users.results}
                totalResults={users.totalResults}
                currentEmail={user?.email}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
