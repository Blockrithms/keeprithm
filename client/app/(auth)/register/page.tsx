"use client";

import { SlackButton, WorkspaceRegisterWarning } from "~/components/common";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/services/auth";

export default function RegisterWorkspace() {
  const router = useRouter();
  const [isRedirectingBack, setIsRedirectingBack] = useState(false);

  const handleLogout = async () => {
    setIsRedirectingBack(true);
    try {
      await logout();
    } catch {}
    router.push("/");
    router.refresh();
  };

  return (
    <div className="mt-2 space-y-4">
      <WorkspaceRegisterWarning />
      <SlackButton title="Add to Slack" state="workspace_register" />
      <Button
        className="w-full"
        type="button"
        onClick={handleLogout}
        disabled={isRedirectingBack}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to home
      </Button>
    </div>
  );
}
