"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  getDashboardOverview,
  startBackup,
  startSync,
  type DashboardWorkspace,
  type OpsJob,
} from "@/services/admin";

const formatUtc = (iso: string | null) => {
  if (!iso) return "Never";
  return `${new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(iso))} UTC`;
};

const finishedLabel = (scope: string | null) => {
  if (scope?.startsWith("sync:")) return "Channel sync finished";
  if (scope?.startsWith("backup:")) return "Backup finished";
  return null;
};

export function WorkspaceTable({
  workspaces,
  job,
}: {
  workspaces: DashboardWorkspace[];
  job: OpsJob;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [tracking, setTracking] = useState(job.running);
  const completedAt = useRef<string | null>(null);
  const activeScope = useRef<string | null>(job.scope);
  const activeStartedAt = useRef<string | null>(job.startedAt);

  useEffect(() => {
    if (!job.running || !job.startedAt) return;
    if (completedAt.current === job.startedAt) return;
    if (completedAt.current === "done") {
      completedAt.current = job.startedAt;
      return;
    }
    if (job.scope) activeScope.current = job.scope;
    activeStartedAt.current = job.startedAt;
    setTracking(true);
  }, [job.running, job.startedAt, job.scope]);

  useEffect(() => {
    if (!tracking) return undefined;

    let stopped = false;
    let settling = false;

    const poll = async () => {
      if (stopped || settling) return;
      try {
        const overview = await getDashboardOverview();
        if (stopped) return;

        if (overview.job.running) {
          if (overview.job.scope) activeScope.current = overview.job.scope;
          if (overview.job.startedAt)
            activeStartedAt.current = overview.job.startedAt;
          return;
        }

        settling = true;
        completedAt.current = activeStartedAt.current ?? "done";
        const label = finishedLabel(activeScope.current);
        setTracking(false);
        setPendingId(null);
        if (label) toast.success(label);
        router.refresh();
      } catch {
        // Keep polling. A failed status check should not leave the actions disabled.
      }
    };

    poll();
    const timer = window.setInterval(poll, 1500);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [tracking, router]);

  const busy = Boolean(pendingId) || tracking;

  const run = async (
    workspace: DashboardWorkspace,
    action: "backup" | "sync"
  ) => {
    activeScope.current =
      action === "sync"
        ? `sync:${workspace.slackId}`
        : `backup:${workspace.slackId}`;
    setPendingId(`${action}:${workspace.slackId}`);
    try {
      if (action === "backup") {
        await startBackup(workspace.slackId);
        toast.success(`Backup started for ${workspace.name}`);
      } else {
        await startSync(workspace.slackId);
        toast.success(`Channel sync started for ${workspace.name}`);
      }
      setTracking(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error("Could not start the job", { description: message });
      setPendingId(null);
    }
  };

  return (
    <section className="flex w-full shrink-0 flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow">
      <div className="shrink-0 border-b px-6 py-5">
        <h2 className="font-semibold leading-none tracking-tight">
          Workspaces
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Backup freshness and channels the bot can read
        </p>
      </div>
      {workspaces.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">
          No workspaces installed.
        </p>
      ) : (
        <ScrollArea className="max-h-48 [&_[data-radix-scroll-area-viewport]]:max-h-48 [&_[data-radix-scroll-area-viewport]>div]:block!">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-card text-left text-muted-foreground">
              <tr className="border-b">
                <th className="px-6 py-3 font-medium">Workspace</th>
                <th className="px-6 py-3 font-medium">Channels</th>
                <th className="px-6 py-3 font-medium">Last backup</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workspaces.map((workspace) => (
                <tr key={workspace.slackId} className="border-b last:border-0">
                  <td className="px-6 py-3">
                    <div className="font-medium">{workspace.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {workspace.slackId}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    {workspace.monitoredChannelCount} of{" "}
                    {workspace.channelCount} with bot
                  </td>
                  <td className="px-6 py-3">
                    {formatUtc(workspace.lastBackupAt)}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => run(workspace, "sync")}
                      >
                        {pendingId === `sync:${workspace.slackId}`
                          ? "Syncing…"
                          : "Sync"}
                      </Button>
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => run(workspace, "backup")}
                      >
                        {pendingId === `backup:${workspace.slackId}`
                          ? "Backing up…"
                          : "Backup"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      )}
    </section>
  );
}
