import React, { useCallback, useState, useEffect } from "react";
import {
  MapPin,
  Layers,
  ChevronRight,
  ArrowUpRight,
  Database,
  ListFilter,
  Globe,
  X,
  Info,
} from "lucide-react";
import MapViewWrapper from "../MapViewWrapper";
import { SearchCommand } from "../SearchCommand";
import { Button } from "../../ui/Button";
import { FILTERS } from "./constants";
import { formatNumber } from "./utils/formatters";
import { useMunicipalityInitialization } from "./hooks/useMunicipalityInitialization";
import { useDashboardData } from "./hooks/useDashboardData";
import { useDashboardState } from "./hooks/useDashboardState";
import { buildPath } from "../../../lib/utils/paths";

const EntityDashboard: React.FC = () => {
  const {
    userLocation,
    municipalityEntityId,
    userMunicipalityName,
    setMunicipalityEntityId,
  } = useMunicipalityInitialization();

  const { entities, stats, loading } = useDashboardData(userMunicipalityName);

  const { selectedMunicipality, setSelectedMunicipality } = useDashboardState(
    null,
    userMunicipalityName,
    userLocation,
  );

  // Estado para el banner de onboarding opcional
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);

  useEffect(() => {
    // Verificar si el onboarding está completado y si el banner fue cerrado
    const isCompleted = localStorage.getItem("onboarding_completed");
    const bannerDismissed = sessionStorage.getItem(
      "onboarding_banner_dismissed",
    );

    if (!isCompleted && !bannerDismissed) {
      setShowOnboardingBanner(true);
    }
  }, []);

  const dismissBanner = useCallback(() => {
    setShowOnboardingBanner(false);
    sessionStorage.setItem("onboarding_banner_dismissed", "true");
  }, []);

  return (
    <div className="min-h-screen bg-neutral-white text-primary-green font-sans selection:bg-primary-green selection:text-hunter">
      {/* 1. HEADER REFINADO */}
      <header className="fixed top-0 w-full z-50 bg-neutral-white/80 backdrop-blur-md border-b border-primary-green/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-green rounded-xl flex items-center justify-center text-hunter">
            <Globe size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-black text-lg leading-none tracking-tight">
              MONITOR
            </h1>
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">
              Elecciones 2026
            </p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a
            href={buildPath("/")}
            className="text-sm font-bold opacity-50 hover:opacity-100 transition-opacity hover:underline"
          >
            Inicio
          </a>
          <a
            href={buildPath("/mapa")}
            className="text-sm font-bold opacity-50 hover:opacity-100 transition-opacity hover:underline"
          >
            Mapa Global
          </a>
        </nav>

        <button className="bg-primary-green text-hunter px-5 py-2 rounded-xl text-sm font-bold hover:scale-105 transition-transform">
          Iniciar Sesión
        </button>
      </header>

      {/* Banner de Onboarding Opcional */}
      {showOnboardingBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-full px-6">
          <div className="bg-primary-green/5 border-2 border-primary-green/20 rounded-2xl p-4 shadow-lg backdrop-blur-sm flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-green/10 rounded-xl shrink-0">
              <Info size={20} className="text-primary-green" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-primary-green mb-1">
                ¿Quieres personalizar tu experiencia?
              </h4>
              <p className="text-xs text-primary-green/60">
                Configura tu ubicación para ver información relevante de tu
                municipio
              </p>
            </div>
            <a
              href={buildPath("/onboarding/1")}
              className="px-4 py-2 bg-primary-green text-hunter rounded-xl text-xs font-bold hover:scale-105 transition-transform shrink-0"
            >
              Configurar
            </a>
            <button
              onClick={dismissBanner}
              className="p-2 hover:bg-primary-green/10 rounded-lg transition-colors shrink-0"
              aria-label="Cerrar banner"
            >
              <X size={18} className="text-primary-green/60" />
            </button>
          </div>
        </div>
      )}

      <main className="pt-28 px-6 max-w-7xl mx-auto pb-20">
        {/* 2. BUSCADOR HERO & FILTROS */}
        <section className="mb-12">
          <div className="max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 leading-none">
              Explora la red de <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-green to-primary-green/40">
                Entidades Electorales
              </span>
            </h2>

            {/* Barra de Búsqueda de alta fidelidad */}
            <div className="relative z-50">
              <SearchCommand
                onSelect={useCallback((entity) => {
                  window.location.href = buildPath(`/entity?id=${entity.$id}`);
                }, [])}
              />
            </div>

            {/* Pill Filters */}
            <div className="flex flex-wrap gap-2 mt-6">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${"bg-white border-2 border-transparent text-primary-green/40 hover:border-primary-green/10"}`}
                >
                  {f}
                </button>
              ))}
              <button className="ml-2 p-2 rounded-full border-2 border-primary-green/5 text-primary-green/40 hover:bg-primary-green hover:text-hunter transition-all">
                <ListFilter size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* 3. GRID PRINCIPAL (Layout Asimétrico) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Columna Izquierda: Resultados */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex justify-between items-end mb-4">
              <div>
                {userMunicipalityName ? (
                  <div className="bg-green-500/10 border-2 border-green-500/30 rounded-2xl px-4 py-3 mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={14} className="text-green-700" />
                      <p className="text-xs text-green-700 font-bold">
                        Tu ubicación detectada
                      </p>
                    </div>
                    <h3 className="font-black text-lg text-green-900">
                      {userMunicipalityName}
                    </h3>
                    <p className="text-[10px] text-green-600 mt-1">
                      Mostrando entidades de tu zona
                    </p>
                  </div>
                ) : (
                  <h3 className="font-black text-xs uppercase tracking-[0.2em] opacity-30">
                    Entidades Recientes
                  </h3>
                )}
              </div>
              <button className="text-xs font-bold flex items-center gap-1 hover:underline">
                Ver todas <ChevronRight size={14} />
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white border border-primary-green/5 p-6 rounded-[2rem] animate-pulse"
                  >
                    <div className="h-6 bg-primary-green/5 rounded mb-4 w-24"></div>
                    <div className="h-8 bg-primary-green/5 rounded mb-2"></div>
                    <div className="h-4 bg-primary-green/5 rounded mb-4 w-3/4"></div>
                    <div className="h-4 bg-primary-green/5 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Card de Entidad Estilo Pro */}
                {entities.map((entity) => (
                  <a
                    key={entity.$id}
                    href={buildPath(`/entity?id=${entity.$id}`)}
                    className="group bg-white border border-primary-green/5 p-6 rounded-[2rem] hover:border-primary-green hover:shadow-2xl hover:shadow-primary-green/5 transition-all cursor-pointer relative overflow-hidden block"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight size={20} />
                    </div>
                    <span className="inline-block px-2 py-1 bg-primary-green/5 rounded text-[10px] font-mono text-primary-green/50 mb-4 tracking-tighter">
                      {entity.$id.substring(0, 10)}...
                    </span>
                    <h4 className="text-xl font-black leading-tight mb-2 group-hover:text-primary-green">
                      {entity.label || "Sin nombre"}
                    </h4>
                    {entity.aliases && entity.aliases.length > 0 && (
                      <p className="text-sm text-primary-green/40 font-medium mb-4">
                        También conocido como: {entity.aliases[0]}
                      </p>
                    )}
                    {entity.description && (
                      <div className="flex items-center gap-2 text-[11px] font-bold text-primary-green">
                        <span className="w-2 h-2 bg-primary-green rounded-full"></span>
                        {entity.description.substring(0, 50)}
                        {entity.description.length > 50 ? "..." : ""}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            )}

            {/* Estadísticas Rápidas (Siguiendo el estilo de tu imagen pero mejorado) */}
            <div className="bg-primary-green text-hunter p-8 rounded-[2.5rem] mt-12 grid grid-cols-3 gap-8">
              <div>
                <p className="text-[10px] uppercase font-bold opacity-50 tracking-widest mb-1">
                  Entidades
                </p>
                <p className="text-3xl font-black">
                  {loading ? "..." : formatNumber(stats.entities)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold opacity-50 tracking-widest mb-1">
                  Declaraciones
                </p>
                <p className="text-3xl font-black">
                  {loading ? "..." : formatNumber(stats.claims)}
                </p>
              </div>
              <div className="relative">
                <p className="text-[10px] uppercase font-bold opacity-50 tracking-widest mb-1">
                  Propiedades
                </p>
                <p className="text-3xl font-black">
                  {loading ? "..." : formatNumber(stats.properties)}
                </p>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Mapa Contextual */}
          <div className="lg:col-span-5">
            <div className="sticky top-28">
              <div className="flex justify-between items-end mb-4">
                <h3 className="font-black text-xs uppercase tracking-[0.2em] opacity-30">
                  Vista de Mapa
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    title="Ver mapa completo"
                    href={buildPath("/mapa")}
                    icon={<Layers size={16} />}
                    className="group-hover:scale-110 transition-transform"
                  />
                </div>
              </div>

              {/* Contenedor del Mapa */}
              <div className="aspect-4/5 bg-hunter rounded-[2.5rem] border-2 border-primary-green relative overflow-hidden shadow-2xl shadow-primary-green/10">
                {/* MapView Component with Error Boundary */}
                <div className="absolute inset-0">
                  <MapViewWrapper
                    selectedEntityId={undefined}
                    onMunicipalitySelect={useCallback(
                      (municipality: {
                        name: string;
                        department: string;
                        entityId: string;
                      }) => {
                        setSelectedMunicipality({
                          name: municipality.name,
                          department: municipality.department,
                        });
                        setMunicipalityEntityId(municipality.entityId);
                      },
                      [],
                    )}
                  />
                </div>

                {/* Info Overlay */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-primary-green/10 shadow-lg z-10 pointer-events-none">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin size={18} className="text-primary-green" />
                    <span className="font-bold text-sm tracking-tight">
                      {selectedMunicipality?.name ||
                        userMunicipalityName ||
                        "Bolivia"}
                      {(selectedMunicipality?.department ||
                        (userMunicipalityName && "Bolivia")) &&
                        `, ${selectedMunicipality?.department || "Bolivia"}`}
                    </span>
                    {userLocation &&
                      (selectedMunicipality || userMunicipalityName) && (
                        <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-700 text-[10px] font-bold rounded-full">
                          <MapPin size={12} />
                          Tu ubicación
                        </span>
                      )}
                  </div>
                  <p className="text-xs text-primary-green/60 font-medium mb-4">
                    {userLocation &&
                    (selectedMunicipality || userMunicipalityName)
                      ? `Mostrando tu municipio según tu ubicación detectada. Las entidades mostradas son relevantes para tu zona.`
                      : `Explora el mapa para ver municipios y sus entidades políticas.`}
                  </p>
                  {municipalityEntityId ? (
                    <a
                      href={buildPath(`/entity?id=${municipalityEntityId}`)}
                      className="w-full block py-3 bg-primary-green text-hunter rounded-xl font-bold text-xs hover:scale-[1.02] transition-transform pointer-events-auto text-center"
                    >
                      {userLocation &&
                      (selectedMunicipality || userMunicipalityName)
                        ? `Ver datos de ${selectedMunicipality?.name || userMunicipalityName}`
                        : "Expandir Análisis Geográfico"}
                    </a>
                  ) : userLocation && !userMunicipalityName ? (
                    <div className="text-center py-2">
                      <div className="inline-flex items-center gap-2 text-xs text-primary-green/50">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-green"></div>
                        <span>Detectando tu municipio...</span>
                      </div>
                    </div>
                  ) : (
                    <button className="w-full py-3 bg-primary-green text-hunter rounded-xl font-bold text-xs hover:scale-[1.02] transition-transform pointer-events-auto">
                      Expandir Análisis Geográfico
                    </button>
                  )}
                </div>

                {/* Icono de flotación decorativo (consistencia con onboarding) */}
                {/* <div className="absolute top-10 right-10 opacity-[0.05] animate-bounce pointer-events-none">
                                    <Database size={120} />
                                </div> */}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer minimalista */}
      <footer className="border-t border-primary-green/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-black text-primary-green/20 uppercase tracking-[0.4em]">
            Plataforma Cívica Independiente
          </p>
          <div className="flex gap-8">
            <span className="text-[10px] font-bold opacity-30">
              GraphQL API
            </span>
            <span className="text-[10px] font-bold opacity-30">Open Data</span>
            <span className="text-[10px] font-bold opacity-30">2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default React.memo(EntityDashboard);
