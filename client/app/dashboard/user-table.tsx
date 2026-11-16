"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { setUserBlocked, type DashboardUser } from "@/services/admin";

export function UserTable({
  users,
  totalResults,
}: {
  users: DashboardUser[];
  totalResults: number;
  currentEmail?: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const toggle = async (user: DashboardUser) => {
    const nextBlocked = !user.isBlocked;
    setPendingId(user.id);
    try {
      await setUserBlocked(user.id, nextBlocked);
      toast.success(
        nextBlocked ? `${user.name} is blocked` : `${user.name} is unblocked`
      );
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error("Could not update the user", { description: message });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow">
      <div className="shrink-0 border-b px-6 py-5">
        <h2 className="font-semibold leading-none tracking-tight">Users</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {totalResults.toLocaleString()} accounts. Blocking stops sign-in and
          active sessions.
        </p>
      </div>
      {users.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">No users found.</p>
      ) : (
        <ScrollArea className="min-h-0 flex-1 [&_[data-radix-scroll-area-viewport]>div]:block!">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-card text-left text-muted-foreground">
              <tr className="border-b">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Workspace</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter((u) => u.role !== "admin")
                .map((user) => {
                  return (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="px-6 py-3">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.email || "No email"}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {user.role === "workspaceOwner"
                          ? "Owner"
                          : user.role === "user"
                          ? "Member"
                          : user.role.charAt(0).toUpperCase() +
                            user.role.slice(1)}
                      </td>
                      <td className="px-6 py-3">{user.workspaceName || "—"}</td>
                      <td className="px-6 py-3">
                        {user.isBlocked ? "Blocked" : "Active"}
                      </td>
                      <td className="px-6 py-3">
                        <Button
                          size="sm"
                          variant={user.isBlocked ? "outline" : "destructive"}
                          disabled={pendingId === user.id}
                          onClick={() => toggle(user)}
                        >
                          {user.isBlocked ? "Unblock" : "Block"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </ScrollArea>
      )}
    </section>
  );
}
