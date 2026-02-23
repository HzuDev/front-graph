import { useCallback, useRef, useState } from "react";
import { fetchQuickSearchEntities, type Entity } from "../../../../lib/queries";
import { SEARCH_DEBOUNCE_MS } from "../constants";

/**
 * Hook to manage entity search functionality with debouncing
 *
 * Features:
 * - Debounced search to reduce API calls
 * - Tracks search query, results, and loading state
 * - Manages dropdown visibility
 * - Supports optional callback on search completion
 *
 * @returns Object containing search state and handlers
 * @returns {string} returns.query - Current search query
 * @returns {Function} returns.setQuery - Function to update query directly
 * @returns {Entity[]} returns.results - Array of search result entities
 * @returns {Function} returns.setResults - Function to update results directly
 * @returns {boolean} returns.loading - Whether search is in progress
 * @returns {boolean} returns.isOpen - Whether dropdown is visible
 * @returns {Function} returns.setIsOpen - Function to toggle dropdown visibility
 * @returns {Function} returns.handleSearch - Main search handler with debounce
 * @returns {Function} returns.clearSearch - Function to clear all search state
 *
 * @example
 * const { query, results, loading, isOpen, handleSearch } = useSearch();
 *
 * <input
 *   value={query}
 *   onChange={(e) => handleSearch(e.target.value)}
 *   placeholder="Search entities..."
 * />
 *
 * {loading && <Spinner />}
 * {isOpen && results.map(entity => <ResultItem key={entity.$id} entity={entity} />)}
 */
export const useSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    (value: string, onSearch?: (query: string) => void) => {
      console.log("useSearch: handleSearch called with value:", value);
      setQuery(value);
      console.log("useSearch: query state will be updated to:", value);

      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }

      if (value.trim().length === 0) {
        setResults([]);
        setIsOpen(false);
        if (onSearch) onSearch("");
        return;
      }

      setLoading(true);
      setIsOpen(true);

      searchTimeout.current = setTimeout(async () => {
        try {
          const response = await fetchQuickSearchEntities({ search: value, limit: 5 });
          setResults(response.documents);
          if (onSearch) onSearch(value);
        } catch (error) {
          console.error("Search error:", error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, SEARCH_DEBOUNCE_MS);
    },
    [],
  );

  const clearSearch = useCallback((onSearch?: (query: string) => void) => {
    console.log("useSearch: clearSearch called");
    setQuery("");
    setResults([]);
    setIsOpen(false);
    if (onSearch) onSearch("");
  }, []);


  return {
    query,
    setQuery,
    results,
    setResults,
    loading,
    isOpen,
    setIsOpen,
    handleSearch,
    clearSearch,
  };
};
