"use server";

import { server } from "@/lib/server";
import { catchAsync } from "@/lib/catch-async";

export const getWorkspace = catchAsync(async () => {
  const { data } = await server.get("/workspace");
  return data;
});
