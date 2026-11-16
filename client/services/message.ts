"use server";

import { server } from "@/lib/server";
import { catchAsync } from "@/lib/catch-async";

export const fetchThreadMessages = catchAsync(
  async (channelId: string, threadTs: string) => {
    const { data } = await server.get(
      `/message/thread/${channelId}/${threadTs}`
    );
    return data;
  }
);

export const getPaginatedMessages = catchAsync(
  async (channelId: string, cursor: string) => {
    const { data } = await server.get(
      `/message?channelId=${channelId}&cursor=${cursor}`
    );
    return data;
  }
);

export const getChannelMessages = catchAsync(
  async (channelId: string, messageId?: string) => {
    const params = new URLSearchParams({ channelId });
    if (messageId) params.set("messageId", messageId);
    const { data } = await server.get(`/message?${params.toString()}`);
    return data;
  }
);

export const getChannelData = catchAsync(async (channelId: string) => {
  const { data } = await server.get(`/channel/${channelId}`);
  return data;
});

export const getMessageById = catchAsync(async (messageId: string) => {
  const { data } = await server.get(`/message/${messageId}`);
  return data;
});

export const searchMessages = catchAsync(async (query: string) => {
  const { data } = await server.get(
    `/message/search?q=${encodeURIComponent(query)}`
  );
  return data;
});
