import { getPaginatedMessages } from "@/services/message";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { Message as ChannelMessage, PaginatedMessageResponse } from "~/types";

// History is not live. Once we know a channel has nothing older than a
// timestamp, skip that request until this expires.
const EMPTY_PAGE_TTL_MS = 10 * 60 * 1000;

type ExhaustedPage = { olderThan: string; at: number };
const exhaustedPages = new Map<string, ExhaustedPage>();

const getExhausted = (channelId: string) => {
  const entry = exhaustedPages.get(channelId);
  if (!entry) return undefined;
  if (Date.now() - entry.at > EMPTY_PAGE_TTL_MS) {
    exhaustedPages.delete(channelId);
    return undefined;
  }
  return entry;
};

const rememberExhausted = (channelId: string, olderThan: string) => {
  const current = getExhausted(channelId);
  if (!current || olderThan > current.olderThan) {
    exhaustedPages.set(channelId, { olderThan, at: Date.now() });
  }
};

const hasNothingOlder = (channelId: string, cursor: string) => {
  const entry = getExhausted(channelId);
  return Boolean(entry && cursor <= entry.olderThan);
};

interface UsePaginatedMessagesProps {
  initialData: PaginatedMessageResponse;
  channelId: string;
}

export const usePaginatedMessages = ({
  initialData,
  channelId,
}: UsePaginatedMessagesProps) => {
  const topRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChannelMessage[]>(
    initialData?.results || []
  );
  const [nextCursor, setNextCursor] = useState<string | undefined>(
    initialData?.nextCursor
  );
  const [isFetching, setIsFetching] = useState(false);
  const [seenChannelId, setSeenChannelId] = useState(channelId);
  if (seenChannelId !== channelId) {
    setSeenChannelId(channelId);
    setIsFetching(false);
  }

  const cursorRef = useRef(nextCursor);
  const fetchingRef = useRef(false);
  const channelRef = useRef(channelId);
  const requestIdRef = useRef(0);

  // Drop an in-flight page for the previous channel before paint. Refs stay
  // out of render; the observer effect below runs after this.
  useLayoutEffect(() => {
    channelRef.current = channelId;
    cursorRef.current = initialData?.nextCursor;
    fetchingRef.current = false;
    requestIdRef.current += 1;
    // Cursor is read from this commit. Pagination updates it afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  useEffect(() => {
    const results = initialData?.results || [];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages(results);
    setNextCursor(initialData?.nextCursor);
    cursorRef.current = initialData?.nextCursor;
    channelRef.current = channelId;

    if (!initialData?.nextCursor) {
      const oldest = results[results.length - 1]?.ts;
      if (oldest) rememberExhausted(channelId, oldest);
    }
  }, [channelId, initialData?.nextCursor, initialData?.results]);

  const loadMoreMessages = useCallback(async () => {
    const cursor = cursorRef.current;
    const currentChannel = channelRef.current;
    if (!currentChannel || !cursor || fetchingRef.current) return;
    if (hasNothingOlder(currentChannel, cursor)) {
      cursorRef.current = undefined;
      setNextCursor(undefined);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    fetchingRef.current = true;
    setIsFetching(true);

    try {
      const data = await getPaginatedMessages(currentChannel, cursor);
      if (requestIdRef.current !== requestId) return;

      const page: ChannelMessage[] = data?.results ?? [];
      const moreCursor = data?.nextCursor || undefined;

      if (page.length === 0 || !moreCursor) {
        rememberExhausted(currentChannel, page[page.length - 1]?.ts ?? cursor);
      }

      if (page.length > 0) {
        setMessages((prev) => {
          const seen = new Set(prev.map((message) => message.id));
          const incoming = page.filter((message) => !seen.has(message.id));
          return incoming.length ? [...prev, ...incoming] : prev;
        });
      }

      cursorRef.current = moreCursor;
      setNextCursor(moreCursor);
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      console.error("Error fetching more messages:", error);
    } finally {
      if (requestIdRef.current === requestId) {
        fetchingRef.current = false;
        setIsFetching(false);
      }
    }
  }, []);

  useEffect(() => {
    const sentinel = topRef.current;
    const root = scrollRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMoreMessages();
        }
      },
      { root, threshold: 0.5, rootMargin: "50px 0px" }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [loadMoreMessages, channelId]);

  return {
    messages,
    topRef,
    scrollRef,
    isFetching,
    hasMore: Boolean(nextCursor),
  };
};
