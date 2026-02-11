import React, { useState, useCallback } from 'react';
import {
    Search, MapPin, Filter, Layers, X,
    ChevronRight, ArrowLeft, Home,
    Users, Building2, Vote, Globe
} from 'lucide-react';
import MapViewWrapper from '../MapViewWrapper';
import { DEPARTMENTS, ENTITY_TYPES, RESULTS_PREVIEW_LIMIT } from './constants';
import { useMapFilters } from './hooks/useMapFilters';
import { useMapData } from './hooks/useMapData';
import DepartmentButton from './components/DepartmentButton';
import EntityTypeButton from './components/EntityTypeButton';
import ClearFiltersButton from './components/ClearFiltersButton';
import ResultEntityCard from './components/ResultEntityCard';

const MapPage: React.FC = () => {
    const {
        selectedDepartment,
        setSelectedDepartment,
        selectedType,
        setSelectedType,
        searchQuery,
        setSearchQuery,
        debouncedSearch
    } = useMapFilters();

    const {
        entities,
        loading,
        mapZoomTarget
    } = useMapData(selectedDepartment, selectedType, debouncedSearch);

    const [showFilters, setShowFilters] = useState(true);
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
    const [selectedMunicipality, setSelectedMunicipality] = useState<{ name: string; department: string } | null>(null);

    return (
        <div className="min-h-screen bg-neutral-white text-primary-green font-sans">
            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-neutral-white/95 backdrop-blur-md border-b border-primary-green/5 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <a
                            href="/"
                            className="flex items-center gap-2 text-primary-green/60 hover:text-primary-green transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span className="text-sm font-bold">Volver</span>
                        </a>
                        <div className="w-px h-6 bg-primary-green/10"></div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-green rounded-xl flex items-center justify-center text-hunter">
                                <Globe size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="font-black text-lg leading-none tracking-tight">MAPA ELECTORAL</h1>
                                <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Bolivia 2026</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-green text-hunter rounded-xl text-sm font-bold hover:scale-105 transition-transform relative"
                    >
                        <Filter size={16} />
                        {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                        {(selectedDepartment !== 'Todos' || selectedType !== 'Todas' || searchQuery) && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-hunter text-primary-green rounded-full text-xs flex items-center justify-center font-black">
                                {[selectedDepartment !== 'Todos', selectedType !== 'Todas', searchQuery].filter(Boolean).length}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            <main className="pt-24 px-6 max-w-7xl mx-auto pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">

                    {/* Filters Sidebar */}
                    {showFilters && (
                        <aside className="lg:col-span-3 space-y-6 overflow-y-auto pr-4">
                            {/* Search Bar */}
                            <div className="bg-white border border-primary-green/10 rounded-2xl p-4">
                                <label className="text-xs font-bold uppercase tracking-wider opacity-40 mb-3 block">
                                    Buscar
                                </label>
                                <div className="relative">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-green/40" />
                                    <input
                                        type="text"
                                        placeholder="Buscar entidades..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-10 py-3 border border-primary-green/10 rounded-xl focus:outline-none focus:border-primary-green transition-colors"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-green/40 hover:text-primary-green"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                    {searchQuery !== debouncedSearch && (
                                        <div className="absolute right-10 top-1/2 -translate-y-1/2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-green border-t-transparent"></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Department Filter */}
                            <div className="bg-white border border-primary-green/10 rounded-2xl p-4">
                                <label className="text-xs font-bold uppercase tracking-wider opacity-40 mb-3 block">
                                    Departamento
                                </label>
                                <div className="space-y-2 max-h-75 overflow-y-auto">
                                    {DEPARTMENTS.map((dept) => (
                                        <DepartmentButton
                                            key={dept}
                                            dept={dept}
                                            isSelected={selectedDepartment === dept}
                                            onSelect={() => setSelectedDepartment(dept)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Type Filter */}
                            <div className="bg-white border border-primary-green/10 rounded-2xl p-4">
                                <label className="text-xs font-bold uppercase tracking-wider opacity-40 mb-3 block">
                                    Tipo de Entidad
                                </label>
                                <div className="space-y-2">
                                    {ENTITY_TYPES.map((type) => (
                                        <EntityTypeButton
                                            key={type.value}
                                            type={type}
                                            isSelected={selectedType === type.value}
                                            onSelect={() => setSelectedType(type.value)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Results Count */}
                            <div className="bg-primary-green text-hunter rounded-2xl p-4">
                                <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">
                                    Resultados
                                </p>
                                <p className="text-3xl font-black">
                                    {loading ? (
                                        <span className="inline-flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-hunter border-t-transparent"></div>
                                        </span>
                                    ) : entities.length}
                                </p>
                                <p className="text-xs opacity-60 mt-1">
                                    {loading ? 'Buscando...' :
                                        entities.length === 0 ? 'Sin resultados' :
                                            entities.length === entities.length &&
                                                selectedDepartment === 'Todos' &&
                                                selectedType === 'Todas' &&
                                                !searchQuery ? 'Total de entidades' : 'Entidades filtradas'
                                    }
                                </p>
                            </div>
                        </aside>
                    )}

                    {/* Map and Results */}
                    <div className={showFilters ? 'lg:col-span-9' : 'lg:col-span-12'}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

                            {/* Map Container */}
                            <div className="lg:col-span-2 h-full">
                                <div className="h-full bg-hunter rounded-[2.5rem] border-2 border-primary-green relative overflow-hidden shadow-2xl shadow-primary-green/10">
                                    <div className="absolute inset-0">
                                        <MapViewWrapper
                                            selectedEntityId={mapZoomTarget || selectedEntityId}
                                            onMunicipalitySelect={(municipality: { name: string; department: string; entityId: string }) => {
                                                setSelectedMunicipality({
                                                    name: municipality.name,
                                                    department: municipality.department
                                                });
                                                setSelectedEntityId(municipality.entityId);
                                            }}
                                        />
                                    </div>

                                    {/* Map Overlay Info */}
                                    {selectedMunicipality && (
                                        <div className="absolute top-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-primary-green/10 shadow-lg z-10">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <MapPin size={20} className="text-primary-green" />
                                                    <div>
                                                        <p className="font-bold text-sm">
                                                            {selectedMunicipality.name}
                                                        </p>
                                                        <p className="text-xs text-primary-green/60">
                                                            {selectedMunicipality.department}
                                                        </p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={`/entity?id=${selectedEntityId}`}
                                                    className="px-4 py-2 bg-primary-green text-hunter rounded-lg text-xs font-bold hover:scale-105 transition-transform"
                                                >
                                                    Ver Detalles
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Results List */}
                            <div className="lg:col-span-1 flex flex-col h-full overflow-hidden">
                                <div className="sticky top-0 bg-neutral-white pb-3 z-10 shrink-0">
                                    <h3 className="font-black text-xs uppercase tracking-[0.2em] opacity-30 mb-2">
                                        Entidades Encontradas {entities.length > 0 && `(${entities.length})`}
                                    </h3>
                                    {(searchQuery || selectedDepartment !== 'Todos' || selectedType !== 'Todas') && (
                                        <ClearFiltersButton
                                            onClear={() => {
                                                setSearchQuery('');
                                                setSelectedDepartment('Todos');
                                                setSelectedType('Todas');
                                            }}
                                        />
                                    )}
                                </div>

                                {loading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="bg-white border border-primary-green/5 p-4 rounded-2xl animate-pulse">
                                                <div className="h-4 bg-primary-green/5 rounded mb-2 w-3/4"></div>
                                                <div className="h-3 bg-primary-green/5 rounded w-1/2"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : entities.length === 0 ? (
                                    <div className="bg-white border border-primary-green/5 p-8 rounded-2xl text-center shrink-0">
                                        <Search size={40} className="mx-auto mb-3 text-primary-green/20" />
                                        <p className="font-bold text-sm text-primary-green/60 mb-1">
                                            No se encontraron resultados
                                        </p>
                                        <p className="text-xs text-primary-green/40 mb-3">
                                            {searchQuery && `No hay coincidencias para "${searchQuery}"`}
                                            {!searchQuery && selectedDepartment !== 'Todos' && `Sin entidades en ${selectedDepartment}`}
                                            {!searchQuery && selectedDepartment === 'Todos' && selectedType !== 'Todas' && `Sin entidades de tipo ${selectedType}`}
                                        </p>
                                        <ClearFiltersButton
                                            onClear={() => {
                                                setSearchQuery('');
                                                setSelectedDepartment('Todos');
                                                setSelectedType('Todas');
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                                            {entities.slice(0, RESULTS_PREVIEW_LIMIT).map((entity) => (
                                                <ResultEntityCard
                                                    key={entity.$id}
                                                    entity={entity}
                                                    isSelected={selectedEntityId === entity.$id}
                                                    onSelect={() => {
                                                        setSelectedEntityId(entity.$id);
                                                    }}
                                                />
                                            ))}
                                        </div>

                                        {/* Ver Todos button */}
                                        {entities.length > RESULTS_PREVIEW_LIMIT && (
                                            <div className="shrink-0 pt-4 border-t border-primary-green/10">
                                                <a
                                                    href={`/search?department=${encodeURIComponent(selectedDepartment)}&type=${encodeURIComponent(selectedType)}&q=${encodeURIComponent(searchQuery)}`}
                                                    className="w-full block bg-primary-green text-hunter p-4 rounded-2xl font-bold text-sm text-center hover:scale-[1.02] transition-transform"
                                                >
                                                    Ver todos los resultados ({entities.length})
                                                </a>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default React.memo(MapPage);
