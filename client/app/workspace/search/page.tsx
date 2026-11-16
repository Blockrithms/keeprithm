import { searchMessages } from "@/services/message";
import { SearchResults } from "~/components/workspace/search/search-results";
import { Message } from "~/types";

export const metadata = {
  title: "Search - Keeprithm",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  let results: Message[] = [];

  if (query.length >= 3) {
    try {
      results = await searchMessages(query);
    } catch (error) {
      console.error("Search failed:", error);
      results = [];
    }
  }

  return <SearchResults query={query} results={results} />;
}
