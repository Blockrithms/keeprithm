import { WorkspaceMessageView } from "./message-view";
import { notFound } from "next/navigation";
import { getMessageById } from "@/services/message";

export const metadata = {
  title: "Message - Keeprithm",
};

export default async function MessagePage({
  params,
}: {
  params: Promise<{ messageId: string }>;
}) {
  const { messageId } = await params;

  let message;
  try {
    message = await getMessageById(messageId);
  } catch {
    notFound();
  }

  return <WorkspaceMessageView message={message} />;
}
