import React, { useRef, useCallback, memo } from "react";
import { Search, Loader2, X } from "lucide-react";
import { fetchEntities, type Entity } from "../../../lib/queries";
import { MAX_RECENT_ITEMS } from "./constants";
import {
  saveRecentEntity,
  loadRecentEntities,
} from "./utils/recentStorageHelpers";
import { useSearch } from "./hooks/useSearch";
import { useClickOutside } from "./hooks/useClickOutside";
import { logger } from "../../../lib/logger";
import ResultsDropdownHeader from "./components/ResultsDropdownHeader";
import { buildPath } from "../../../lib/utils/paths";

interface SearchCommandProps {
  onSelect: (entity: Entity) => void;
  onSearch?: (query: string) => void;
  className?: string;
}

const SearchCommandComponent: React.FC<SearchCommandProps> = ({
  onSelect,
  onSearch,
  className,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const {
    query,
    results,
    loading,
    isOpen,
    setIsOpen,
    handleSearch,
    clearSearch,
  } = useSearch();

  useClickOutside(wrapperRef, () => setIsOpen(false));

  // Wrapped in useCallback to prevent inline recreation
  const handleSelectEntity = useCallback(
    (entity: Entity) => {
      logger.log("SearchCommand: select entity", entity);
      if (!entity || !entity.$id) {
        logger.error("SearchCommand: Entity has no ID!", entity);
        return;
      }
      saveRecentEntity(entity);
      onSelect(entity);
      handleSearch(entity.label || "", onSearch);
      setIsOpen(false);
    },
    [onSelect, onSearch, handleSearch],
  );

  // Wrapped in useCallback to prevent recreation on every render
  const loadSuggestions = useCallback(async () => {
    try {
      // Try to get recent searches from localStorage
      const recent = loadRecentEntities();
      if (recent.length > 0) {
        // Use setResults through a closure
        return recent.slice(0, MAX_RECENT_ITEMS);
      }

      // If no recent searches, show some popular entities
      const response = await fetchEntities({ limit: MAX_RECENT_ITEMS });
      return response.documents;
    } catch (error) {
      logger.error("Error loading suggestions:", error);
      return [];
    }
  }, []);

  return (
    <div className={`relative group ${className || ""}`} ref={wrapperRef}>
      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
        {loading ? (
          <Loader2 className="text-primary-green animate-spin" size={24} />
        ) : (
          <Search
            className="text-primary-green/30 group-focus-within:text-primary-green transition-colors"
            size={24}
          />
        )}
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value, onSearch)}
        onFocus={async () => {
          if (query.length > 0) {
            setIsOpen(true);
          } else {
            // Show suggestions when focusing on empty field
            setIsOpen(true);
            await loadSuggestions();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query.trim().length > 0) {
            e.preventDefault();
            console.log("SearchCommand: Enter pressed, query:", query);
            const searchUrl = buildPath(
              `/search?q=${encodeURIComponent(query.trim())}`,
            );
            console.log("SearchCommand: Navigating to:", searchUrl);
            // Force full page reload to preserve query params (bypass View Transitions)
            window.location.href = searchUrl;
          }
        }}
        placeholder="Buscar municipios, propiedades, conceptos..."
        className="w-full bg-white border-2 border-primary-green/5 rounded-[2rem] py-6 pl-14 pr-32 text-xl font-medium focus:outline-none focus:border-primary-green focus:shadow-[0_0_40px_rgba(20,40,29,0.05)] transition-all placeholder:text-primary-green/20"
      />

      {query.length > 0 && (
        <div className="absolute right-3 inset-y-3 flex items-center gap-2">
          <button
            onClick={() => clearSearch(onSearch)}
            className="p-2 hover:bg-primary-green/5 rounded-full text-primary-green/40 transition-colors"
          >
            <X size={20} />
          </button>
          <button
            onClick={() => {
              console.log("SearchCommand: Button clicked, query:", query);
              if (query.trim().length > 0) {
                const searchUrl = buildPath(
                  `/search?q=${encodeURIComponent(query.trim())}`,
                );
                console.log("SearchCommand: Navigating to:", searchUrl);
                window.location.href = searchUrl;
              } else {
                console.log("SearchCommand: Query is empty, not navigating");
              }
            }}
            className="bg-primary-green text-hunter px-6 h-full rounded-full font-bold text-sm hover:bg-soft-green transition-colors"
          >
            Buscar
          </button>
        </div>
      )}

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-4 bg-white/90 backdrop-blur-md border border-primary-green/10 rounded-[2rem] shadow-2xl overflow-hidden z-50">
          {query.length === 0 && <ResultsDropdownHeader />}
          <ul className="py-2">
            {results.map((entity) => (
              <li key={entity.$id}>
                <a
                  href={buildPath(`/entity?id=${entity.$id}`)}
                  onMouseDown={(e) => {
                    // Save to recent history on mouse down
                    saveRecentEntity(entity);
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-primary-green/5 transition-colors group/item flex items-start gap-4 border-b border-primary-green/5 last:border-0"
                >
                  <div className="w-10 h-10 bg-primary-green/5 rounded-xl flex items-center justify-center text-primary-green group-hover/item:bg-primary-green group-hover/item:text-hunter transition-colors">
                    <Search size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-green">
                      {entity.label}
                    </h4>
                    {entity.description && (
                      <p className="text-xs text-primary-green/50 line-clamp-1">
                        {entity.description}
                      </p>
                    )}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isOpen && query.length > 0 && results.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-4 bg-white/90 backdrop-blur-md border border-primary-green/10 rounded-[2rem] shadow-2xl p-6 text-center text-primary-green/50 z-50">
          <p>No se encontraron resultados para "{query}"</p>
        </div>
      )}
    </div>
  );
};

// Export memoized component to prevent parent re-renders
export const SearchCommand = memo(SearchCommandComponent);
