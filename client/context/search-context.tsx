"use client";

import React from "react";

interface SearchContextType {
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  focusSearch: () => void;
}

const SearchContext = React.createContext<SearchContextType | null>(null);

interface Props {
  children: React.ReactNode;
}

export function SearchProvider({ children }: Props) {
  const [expanded, setExpanded] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const focusSearch = React.useCallback(() => {
    setExpanded(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, []);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        focusSearch();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [focusSearch]);

  return (
    <SearchContext.Provider
      value={{ expanded, setExpanded, inputRef, focusSearch }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export const useSearch = () => {
  const searchContext = React.useContext(SearchContext);

  if (!searchContext) {
    throw new Error("useSearch has to be used within <SearchContext.Provider>");
  }

  return searchContext;
};
