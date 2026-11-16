"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui";
import { Message } from "~/components/workspace/channel/message";
import { Message as ChannelMessage } from "~/types";
import { useRouter } from "next/navigation";

export function WorkspaceMessageView({ message }: { message: ChannelMessage }) {
  const router = useRouter();

  return (
    <div className="w-full h-full flex justify-center">
      <div className="message-container w-full max-w-3xl space-y-4 mt-10">
        <div className="header h-16 flex items-center gap-2 border-b">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft />
          </Button>
          <h2 className="text-lg font-semibold">Searched Message</h2>
        </div>
        <div className="main h-[72vh]">
          <Message message={message} isCompact={false} />
        </div>
      </div>
    </div>
  );
}
