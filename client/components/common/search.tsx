"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import { useSearch } from "~/context/search-context";
import { Input } from "~/components/ui";

interface Props {
  className?: string;
  placeholder?: string;
}

export function Search({
  className = "",
  placeholder = "Search messages",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { expanded, setExpanded, inputRef } = useSearch();

  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/workspace/search")) {
      setQuery(searchParams.get("q") ?? "");
    }
  }, [pathname, searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();

    if (trimmed.length < 3) {
      setError("Enter at least 3 characters");
      return;
    }

    setError(null);
    setExpanded(false);
    inputRef.current?.blur();
    router.push(`/workspace/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative transition-[width] duration-200 ease-out",
        expanded ? "w-[min(40rem,calc(100vw-10rem))]" : "w-44 sm:w-64 md:w-80",
        className
      )}
    >
      <SearchIcon
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (error) setError(null);
        }}
        onFocus={() => setExpanded(true)}
        onBlur={() => setExpanded(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            setExpanded(false);
            inputRef.current?.blur();
          }
        }}
        placeholder={placeholder}
        aria-label="Search messages"
        className={cn(
          "h-9 border-transparent bg-muted/60 pl-9 pr-14 shadow-none transition-colors",
          "placeholder:text-muted-foreground",
          "hover:bg-muted focus-visible:border-border focus-visible:bg-background focus-visible:ring-1",
          expanded && "bg-background ring-1 ring-border"
        )}
      />
      {!expanded && (
        <kbd className="pointer-events-none absolute right-1.5 top-1/2 hidden h-6 -translate-y-1/2 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      )}
      {error && expanded && (
        <p className="absolute left-0 top-full z-10 mt-1 rounded-md bg-background px-2 py-1 text-xs text-destructive shadow-sm ring-1 ring-border">
          {error}
        </p>
      )}
    </form>
  );
}
