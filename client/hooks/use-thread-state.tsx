import { useCallback, useState } from "react";

export const useThreadState = () => {
  const [isThreadOpen, setIsThreadOpen] = useState<boolean>(false);
  const [activeThreadTs, setActiveThreadTs] = useState<string>("");

  const openThread = useCallback((threadTs: string) => {
    if (!threadTs) return;
    setActiveThreadTs(threadTs);
    setIsThreadOpen(true);
  }, []);

  const closeThread = useCallback(() => {
    setIsThreadOpen(false);
    setActiveThreadTs("");
  }, []);

  return {
    isThreadOpen,
    activeThreadTs,
    openThread,
    closeThread,
  };
};
