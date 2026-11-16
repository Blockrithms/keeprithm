import ChannelView from "~/components/workspace/channel/channel-view";
import { notFound, redirect } from "next/navigation";
import { getChannelData, getChannelMessages } from "@/services/message";
import { LOGIN_ROUTE } from "@/constants/auth";

export const metadata = {
  title: "Channel - Keeprithm",
};

export default async function ChannelPage({
  params,
  searchParams,
}: {
  params: Promise<{ channelId: string }>;
  searchParams: Promise<{ messageId?: string }>;
}) {
  const { channelId } = await params;
  const { messageId } = await searchParams;

  let channel;
  let channelMessages;

  try {
    const [channelRes, messagesRes] = await Promise.allSettled([
      getChannelData(channelId),
      getChannelMessages(channelId, messageId),
    ]);

    if (channelRes.status === "rejected") {
      const err = channelRes.reason;
      if (err?.response?.status === 401) {
        redirect(LOGIN_ROUTE);
      }
      console.error(
        "Error fetching channel data:",
        err?.response?.data || err?.message
      );
      notFound();
    }

    channel = channelRes.value;
    channelMessages =
      messagesRes.status === "fulfilled" ? messagesRes.value : { results: [] };
  } catch (error: any) {
    if (error?.message === "NEXT_REDIRECT") throw error;
    console.error(
      "Error in ChannelPage:",
      error?.response?.data || error?.message
    );
    notFound();
  }

  return (
    <ChannelView
      channel={channel}
      channelMessages={channelMessages}
      focusMessageId={messageId}
    />
  );
}
