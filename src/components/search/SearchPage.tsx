import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
  useRef,
} from "react";
import {
  Search,
  MapPin,
  Filter,
  X,
  ChevronRight,
  ArrowLeft,
  Users,
  Building2,
  Vote,
  Globe,
  ChevronLeft,
} from "lucide-react";
import { fetchEntitiesFiltered } from "../../lib/queries";
import type { Entity } from "../../lib/queries";
import { buildPath } from "@/lib/utils/paths";

// ============ CONSTANTES ============
const ITEMS_PER_PAGE = 24;
const SEARCH_DEBOUNCE_MS = 500;
const FETCH_LIMIT = 1000;
const PAGINATION_WINDOW = 3;
const EMPTY_STATE_MESSAGE = "No se encontraron resultados";
const EMPTY_STATE_HINT = "Intenta ajustar los filtros o el término de búsqueda";
const RESULTS_LABEL = "Mostrando";
const RESULTS_OF = "de";
const DEFAULT_DEPARTMENT = "Todos";
const DEFAULT_TYPE = "Todas";
const FILTER_TOGGLE_SHOW = "Mostrar Filtros";
const FILTER_TOGGLE_HIDE = "Ocultar Filtros";
const NO_NAME = "Sin nombre";

// ============ CONSTANTES EXTRAÍDAS (ANTES HARDCODEADAS) ============
const DEPARTMENTS = [
  "Todos",
  "La Paz",
  "Santa Cruz",
  "Cochabamba",
  "Oruro",
  "Potosí",
  "Chuquisaca",
  "Tarija",
  "Beni",
  "Pando",
];

const ENTITY_TYPES = [
  { value: "Todas", label: "Todas las entidades", icon: Globe },
  { value: "Municipio", label: "Municipios", icon: Building2 },
  { value: "Persona", label: "Personas", icon: Users },
  { value: "Partido", label: "Partidos Políticos", icon: Vote },
  { value: "Territorio", label: "Territorios", icon: MapPin },
];

interface SearchPageProps {
  // Props are optional since we'll read from URL in the client
  initialDepartment?: string;
  initialType?: string;
  initialQuery?: string;
}

// ============ MEMOIZED COMPONENTS ============

// EntityCard component (OPTIMIZED: extracted and memoized)
const EntityCard = memo<{ entity: Entity }>(({ entity }) => (
  <a
    href={buildPath(`/entity?id=${entity.$id}`)}
    className="bg-white border border-primary-green/5 p-6 rounded-2xl hover:shadow-lg hover:border-primary-green/20 transition-all group"
  >
    <h3 className="font-bold text-base mb-2 leading-tight group-hover:text-primary-green transition-colors">
      {entity.label || NO_NAME}
    </h3>
    {entity.description ? (
      <p className="text-xs text-primary-green/60 mb-3 line-clamp-2">
        {entity.description}
      </p>
    ) : null}
    <div className="flex items-center gap-1 text-xs font-bold text-primary-green group-hover:underline">
      Ver detalles
      <ChevronRight size={14} />
    </div>
  </a>
));

EntityCard.displayName = "EntityCard";

// DepartmentFilterPanel component (OPTIMIZED: extracted and memoized)
const DepartmentFilterPanel = memo<{
  selectedDepartment: string;
  onDepartmentChange: (dept: string) => void;
}>(({ selectedDepartment, onDepartmentChange }) => (
  <div className="bg-white border border-primary-green/10 rounded-2xl p-4">
    <label className="text-xs font-bold uppercase tracking-wider opacity-40 mb-3 block">
      Departamento
    </label>
    <div className="space-y-2 max-h-75 overflow-y-auto">
      {DEPARTMENTS.map((dept) => (
        <button
          key={dept}
          onClick={() => onDepartmentChange(dept)}
          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
            selectedDepartment === dept
              ? "bg-hunter border-2 border-primary-green text-primary-green"
              : "bg-neutral-white border-2 border-transparent text-primary-green/60 hover:border-primary-green/10 hover:bg-white"
          }`}
        >
          {dept}
        </button>
      ))}
    </div>
  </div>
));

DepartmentFilterPanel.displayName = "DepartmentFilterPanel";

// TypeFilterPanel component (OPTIMIZED: extracted and memoized)
const TypeFilterPanel = memo<{
  selectedType: string;
  onTypeChange: (type: string) => void;
}>(({ selectedType, onTypeChange }) => (
  <div className="bg-white border border-primary-green/10 rounded-2xl p-4">
    <label className="text-xs font-bold uppercase tracking-wider opacity-40 mb-3 block">
      Tipo de Entidad
    </label>
    <div className="space-y-2">
      {ENTITY_TYPES.map((type) => {
        const IconComponent = type.icon;
        return (
          <button
            key={type.value}
            onClick={() => onTypeChange(type.value)}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              selectedType === type.value
                ? "bg-hunter border-2 border-primary-green text-primary-green"
                : "bg-neutral-white border-2 border-transparent text-primary-green/60 hover:border-primary-green/10 hover:bg-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <IconComponent size={18} />
              <span>{type.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  </div>
));

TypeFilterPanel.displayName = "TypeFilterPanel";

// PaginationControls component (OPTIMIZED: extracted and memoized)
const PaginationControls = memo<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  startIndex: number;
  endIndex: number;
  totalEntities: number;
}>(
  ({
    currentPage,
    totalPages,
    onPageChange,
    startIndex,
    endIndex,
    totalEntities,
  }) => {
    // OPTIMIZED: Use useMemo to calculate visible pages once
    const visiblePages = useMemo(() => {
      const pages: (number | string)[] = [];

      for (let i = 1; i <= totalPages; i++) {
        // Show: first 3, last 3, and current ±1
        if (
          i <= PAGINATION_WINDOW ||
          i > totalPages - PAGINATION_WINDOW ||
          Math.abs(i - currentPage) <= 1
        ) {
          pages.push(i);
        } else if (pages[pages.length - 1] !== "...") {
          pages.push("...");
        }
      }

      return pages;
    }, [currentPage, totalPages]);

    return (
      <>
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-3 bg-white border border-primary-green/10 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-hunter transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-2">
            {visiblePages.map((page, idx) =>
              page === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-3 py-2 text-primary-green/40"
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page as number)}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                    currentPage === page
                      ? "bg-primary-green text-hunter"
                      : "bg-white border border-primary-green/10 text-primary-green hover:bg-hunter"
                  }`}
                >
                  {page}
                </button>
              ),
            )}
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-3 bg-white border border-primary-green/10 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-hunter transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="text-center text-sm text-primary-green/60">
          {RESULTS_LABEL} {startIndex + 1}-{Math.min(endIndex, totalEntities)}{" "}
          {RESULTS_OF} {totalEntities} resultados
        </div>
      </>
    );
  },
);

PaginationControls.displayName = "PaginationControls";

// ============ MAIN COMPONENT ============

const SearchPage: React.FC<SearchPageProps> = ({
  initialDepartment = DEFAULT_DEPARTMENT,
  initialType = DEFAULT_TYPE,
  initialQuery = "",
}) => {
  // Read query params from URL on client-side and initialize state
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState(initialDepartment);
  const [selectedType, setSelectedType] = useState(initialType);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const isFirstMount = useRef(true);

  // Initialize from URL params on mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined" && !isInitialized) {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q") || initialQuery || "";
      const department = params.get("department") || initialDepartment;
      const type = params.get("type") || initialType;

      console.log("SearchPage: Reading URL params from client:", {
        q,
        department,
        type,
      });

      // Set all state at once to avoid multiple renders
      setSearchQuery(q);
      setDebouncedSearch(q);
      setSelectedDepartment(department);
      setSelectedType(type);
      setIsInitialized(true);
    }
  }, []);

  // ============ OPTIMIZED: Debounce + Fetch (CRÍTICA: async-parallel) ============
  // Instead of separate effects, use single effect with debounce
  useEffect(() => {
    // Skip debounce on initial mount - debouncedSearch is already initialized with initialQuery
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load entities with optimized fetch (only after initialization)
  useEffect(() => {
    // Don't load data until we've initialized from URL params
    if (!isInitialized) {
      return;
    }

    async function loadData() {
      try {
        setLoading(true);

        // Log para debug
        console.log("SearchPage: Loading data with:", {
          entityType: selectedType,
          department: selectedDepartment,
          search: debouncedSearch,
        });

        const entitiesData = await fetchEntitiesFiltered({
          limit: FETCH_LIMIT,
          entityType: selectedType,
          department: selectedDepartment,
          search: debouncedSearch.trim() || undefined,
        });

        console.log(
          "SearchPage: Received",
          entitiesData.documents.length,
          "entities",
        );
        setEntities(entitiesData.documents);
      } catch (error) {
        console.error("Error loading entities:", error);
        setEntities([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedDepartment, selectedType, debouncedSearch, isInitialized]);

  // ============ OPTIMIZED: Pagination calculations with useMemo ============
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(entities.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentEntities = entities.slice(startIndex, endIndex);

    return { totalPages, startIndex, endIndex, currentEntities };
  }, [entities, currentPage]);

  const { totalPages, startIndex, endIndex, currentEntities } = paginationData;

  // ============ OPTIMIZED: Cache filter state checks (js-cache-property-access) ============
  const hasActiveFilters = useMemo(
    () => ({
      department: selectedDepartment !== DEFAULT_DEPARTMENT,
      type: selectedType !== DEFAULT_TYPE,
      search: searchQuery.length > 0,
    }),
    [selectedDepartment, selectedType, searchQuery],
  );

  const activeFiltersCount = useMemo(
    () => Object.values(hasActiveFilters).filter(Boolean).length,
    [hasActiveFilters],
  );

  // ============ OPTIMIZED: Extracted handlers with useCallback ============
  const handleDepartmentChange = useCallback((dept: string) => {
    setSelectedDepartment(dept);
  }, []);

  const handleTypeChange = useCallback((type: string) => {
    setSelectedType(type);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedDepartment(DEFAULT_DEPARTMENT);
    setSelectedType(DEFAULT_TYPE);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchQuery("");
  }, []);

  return (
    <div className="min-h-screen bg-neutral-white text-primary-green">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-neutral-white/95 backdrop-blur-md border-b border-primary-green/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <a
              href={buildPath("/mapa")}
              className="flex items-center gap-2 text-primary-green/60 hover:text-primary-green transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-bold">Volver al Mapa</span>
            </a>
            <div className="w-px h-6 bg-primary-green/10"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-green rounded-xl flex items-center justify-center text-hunter">
                <Search size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="font-black text-lg leading-none tracking-tight">
                  RESULTADOS DE BÚSQUEDA
                </h1>
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">
                  {entities.length} entidades encontradas
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-green text-hunter rounded-xl text-sm font-bold hover:scale-105 transition-transform relative"
          >
            <Filter size={16} />
            {showFilters ? FILTER_TOGGLE_HIDE : FILTER_TOGGLE_SHOW}
            {activeFiltersCount > 0 ? (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-hunter text-primary-green rounded-full text-xs flex items-center justify-center font-black">
                {activeFiltersCount}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-7xl mx-auto pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Filters Sidebar - Collapsible */}
          {showFilters ? (
            <aside className="lg:col-span-3 space-y-6">
              {/* Search Bar */}
              <div className="bg-white border border-primary-green/10 rounded-2xl p-4">
                <label className="text-xs font-bold uppercase tracking-wider opacity-40 mb-3 block">
                  Buscar
                </label>
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-green/40"
                  />
                  <input
                    type="text"
                    placeholder="Buscar entidades..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-primary-green/10 rounded-xl focus:outline-none focus:border-primary-green transition-colors"
                  />
                  {searchQuery ? (
                    <button
                      onClick={handleSearchClear}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-green/40 hover:text-primary-green"
                    >
                      <X size={18} />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Department Filter */}
              <DepartmentFilterPanel
                selectedDepartment={selectedDepartment}
                onDepartmentChange={handleDepartmentChange}
              />

              {/* Type Filter */}
              <TypeFilterPanel
                selectedType={selectedType}
                onTypeChange={handleTypeChange}
              />

              {/* Clear Filters */}
              {activeFiltersCount > 0 ? (
                <button
                  onClick={handleClearFilters}
                  className="w-full bg-white border border-primary-green/10 text-primary-green p-4 rounded-2xl font-bold text-sm hover:bg-primary-green/5 transition-colors flex items-center justify-center gap-2"
                >
                  <X size={16} />
                  Limpiar filtros
                </button>
              ) : null}
            </aside>
          ) : null}

          {/* Results Grid */}
          <div className={showFilters ? "lg:col-span-9" : "lg:col-span-12"}>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <div
                    key={i}
                    className="bg-white border border-primary-green/5 p-6 rounded-2xl animate-pulse"
                  >
                    <div className="h-5 bg-primary-green/5 rounded mb-3 w-3/4"></div>
                    <div className="h-4 bg-primary-green/5 rounded mb-2 w-full"></div>
                    <div className="h-4 bg-primary-green/5 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : entities.length === 0 ? (
              <div className="bg-white border border-primary-green/5 p-12 rounded-2xl text-center">
                <Search
                  size={60}
                  className="mx-auto mb-4 text-primary-green/20"
                />
                <p className="font-bold text-lg text-primary-green/60 mb-2">
                  {EMPTY_STATE_MESSAGE}
                </p>
                <p className="text-sm text-primary-green/40 mb-4">
                  {EMPTY_STATE_HINT}
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-3 bg-primary-green text-hunter rounded-xl font-bold text-sm hover:scale-105 transition-transform"
                >
                  Limpiar todos los filtros
                </button>
              </div>
            ) : (
              <>
                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {currentEntities.map((entity) => (
                    <EntityCard key={entity.$id} entity={entity} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 ? (
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    totalEntities={entities.length}
                  />
                ) : null}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SearchPage;
