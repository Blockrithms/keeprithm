"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Server } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { startBackup, type OpsJob } from "@/services/admin";

function describeJob(job: OpsJob) {
  if (!job.running) return "Idle";
  if (job.scope === "backup:all") return "Backing up every workspace";
  if (job.scope?.startsWith("backup:"))
    return `Backing up ${job.scope.slice("backup:".length)}`;
  if (job.scope === "sync:all") return "Syncing every workspace";
  if (job.scope?.startsWith("sync:"))
    return `Syncing ${job.scope.slice("sync:".length)}`;
  return "A job is running";
}

export const BackupCard = ({ job }: { job: OpsJob }) => {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const busy = pending || job.running;

  const trigger = async () => {
    setPending(true);
    try {
      await startBackup();
      toast.success("Backup started", {
        description: "Messages are being archived in the background.",
      });
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error("Backup failed to start", { description: message });
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual backup</CardTitle>
        <CardDescription>
          Archive new messages for every installed workspace
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-4 rounded-lg border p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Server className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">Job status</p>
            <p className="text-sm text-muted-foreground">{describeJob(job)}</p>
          </div>
        </div>
        <Button onClick={trigger} className="w-full" disabled={busy}>
          {busy ? "Backup in progress" : "Back up all workspaces"}
        </Button>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <p className="text-xs text-muted-foreground">
          {job.running && job.startedAt
            ? `Started ${job.startedAt}`
            : "Scheduled backups keep running on the server cron."}
        </p>
      </CardFooter>
    </Card>
  );
};
