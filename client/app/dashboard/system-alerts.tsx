import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { DashboardWorkspace } from "@/services/admin";

type Issue = {
  id: string;
  title: string;
  detail: string;
};

function workspaceIssues(workspaces: DashboardWorkspace[]): Issue[] {
  return workspaces.flatMap((workspace) => {
    const issues: Issue[] = [];
    if (workspace.monitoredChannelCount === 0) {
      issues.push({
        id: `${workspace.slackId}-bot`,
        title: `${workspace.name}: bot is in no channel`,
        detail: "Invite the bot to the channels you want archived, then sync.",
      });
    }
    if (!workspace.lastBackupAt) {
      issues.push({
        id: `${workspace.slackId}-backup`,
        title: `${workspace.name}: never backed up`,
        detail: "Run a backup to copy messages into the archive.",
      });
    }
    return issues;
  });
}

export const SystemAlerts = ({
  workspaces,
}: {
  workspaces: DashboardWorkspace[];
}) => {
  const issues = workspaceIssues(workspaces);

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Needs attention</CardTitle>
        <CardDescription>
          Workspaces that are not ready to archive
        </CardDescription>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <div className="flex items-start gap-4 rounded-lg border p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">No issues</p>
              <p className="text-sm text-muted-foreground">
                Every workspace has a backup and at least one channel with the
                bot.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-h-80 space-y-4 overflow-y-auto">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-start gap-4 rounded-lg border p-4"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {issue.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {issue.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
