import React, { useMemo, memo } from 'react';
import { ArrowLeft, MapPin, Calendar, Globe, Tag, Link as LinkIcon, Building2, ArrowRight, ExternalLink } from 'lucide-react';
import { buildPath } from '../../lib/utils/paths';
import type { Entity, Claim } from '../../lib/queries';

// ============ CONSTANTES ============
const LOCALE = 'es-BO';
const EMPTY_ENTITY_LABEL = 'Sin nombre';
const RELATED_ENTITY = 'Entidad relacionada';
const NO_DATE = 'Sin fecha';
const NO_IMAGE = 'Sin imagen';
const NO_COORDINATES = 'Sin coordenadas';
const INVALID_JSON = 'JSON inválido';
const NO_VALUE = 'Sin valor';
const PROPIEDAD_DESCONOCIDA = 'Propiedad desconocida';

// ============ HELPERS EXTRAÍDOS ============

// Helper para extraer ID de una entidad que puede ser string o object
const extractId = (entity: string | { $id: string } | undefined): string | null => {
    if (typeof entity === 'string') return entity;
    if (entity?.$id) return entity.$id;
    return null;
};

// Helper para extraer label de una entidad
const extractLabel = (entity: any): string => {
    if (typeof entity === 'string') return entity;
    return entity?.label || RELATED_ENTITY;
};

// Icono por propiedad (OPTIMIZED: extraído fuera del componente)
const getIconForPropertyStatic = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('fecha')) return <Calendar className="w-4 h-4" />;
    if (lowerLabel.includes('lugar') || lowerLabel.includes('ubicación') || lowerLabel.includes('municipio')) return <MapPin className="w-4 h-4" />;
    if (lowerLabel.includes('web') || lowerLabel.includes('url') || lowerLabel.includes('sitio')) return <Globe className="w-4 h-4" />;
    if (lowerLabel.includes('organización') || lowerLabel.includes('partido') || lowerLabel.includes('institución')) return <Building2 className="w-4 h-4" />;
    return <Tag className="w-4 h-4" />;
};

// Renderizar valor de claim (OPTIMIZED: extraído fuera del componente)
const renderClaimValue = (claim: Claim) => {
    // Si es una relación, mostrar como enlace
    if (claim.value_relation) {
        const relationLabel = extractLabel(claim.value_relation);
        const relationId = extractId(claim.value_relation);

        if (!relationId) return null;

        return (
            <a
                href={buildPath(`/entity?id=${relationId}`)}
                className="inline-flex items-center gap-1 text-primary-green hover:text-[#2d5a42] transition-colors border-b border-primary-green/10 hover:border-[#2d5a42]/50 pb-0.5 group"
            >
                {relationLabel}
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
            </a>
        );
    }

    // Manejar diferentes tipos de datos
    switch (claim.datatype) {
        case 'url':
            return (
                <a
                    href={claim.value_raw || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                >
                    {claim.value_raw}
                    <ExternalLink className="w-3 h-3" />
                </a>
            );
        case 'date':
            try {
                const date = new Date(claim.value_raw || '');
                return date.toLocaleDateString(LOCALE, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch {
                return claim.value_raw || NO_DATE;
            }
        case 'image':
            return claim.value_raw ? (
                <div className="mt-2">
                    <img
                        src={claim.value_raw}
                        alt="Imagen"
                        className="max-w-xs rounded-lg border border-primary-green/10"
                    />
                </div>
            ) : NO_IMAGE;
        case 'boolean':
            return claim.value_raw === 'true' ? '✓ Sí' : '✗ No';
        case 'coordinate':
            return claim.value_raw ? (
                <span className="font-mono text-sm">{claim.value_raw}</span>
            ) : NO_COORDINATES;
        case 'json':
            try {
                const jsonData = JSON.parse(claim.value_raw || '{}');
                return (
                    <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-w-full">
                        {JSON.stringify(jsonData, null, 2)}
                    </pre>
                );
            } catch {
                return claim.value_raw || INVALID_JSON;
            }
        default:
            return <span>{claim.value_raw || NO_VALUE}</span>;
    }
};

interface EntityDetailProps {
    entity: Entity;
    claims: Claim[];
}

const EntityDetailComponent: React.FC<EntityDetailProps> = ({ entity, claims }) => {
    // OPTIMIZED: Usar useMemo para evitar waterfalls en operaciones derivadas
    const { outgoingClaims, incomingClaims, groupedOutgoingClaims, groupedIncomingClaims } = useMemo(() => {
        // Filtrar claims salientes (esta entidad es el subject)
        const outgoing = claims.filter(claim => {
            const subjectId = extractId(claim.subject);
            return subjectId === entity.$id;
        });

        // Filtrar claims entrantes (esta entidad es el value_relation)
        const incoming = claims.filter(claim => {
            const valueRelationId = extractId(claim.value_relation);
            return valueRelationId === entity.$id;
        });

        // Agrupar claims salientes por propiedad
        const groupedOutgoing = outgoing.reduce((acc, claim) => {
            const propertyLabel = typeof claim.property === 'object' ? (claim.property as any).label : PROPIEDAD_DESCONOCIDA;
            if (!acc[propertyLabel]) {
                acc[propertyLabel] = [];
            }
            acc[propertyLabel].push(claim);
            return acc;
        }, {} as Record<string, Claim[]>);

        // Agrupar claims entrantes por propiedad
        const groupedIncoming = incoming.reduce((acc, claim) => {
            const propertyLabel = typeof claim.property === 'object' ? (claim.property as any).label : PROPIEDAD_DESCONOCIDA;
            if (!acc[propertyLabel]) {
                acc[propertyLabel] = [];
            }
            acc[propertyLabel].push(claim);
            return acc;
        }, {} as Record<string, Claim[]>);

        return {
            outgoingClaims: outgoing,
            incomingClaims: incoming,
            groupedOutgoingClaims: groupedOutgoing,
            groupedIncomingClaims: groupedIncoming
        };
    }, [claims, entity.$id]);

    // OPTIMIZED: Memoizar createdDate para evitar recreación de Date
    const createdDate = useMemo(() => {
        return new Date(entity.$createdAt).toLocaleDateString(LOCALE);
    }, [entity.$createdAt]);

    return (
        <div className="min-h-screen bg-neutral-white text-primary-green ">
            {/* Header */}
            <header className="bg-neutral-white/80 backdrop-blur-md border-b border-primary-green/5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <a href="/" className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold">Volver al inicio</span>
                    </a>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-xl border border-primary-green/5 overflow-hidden">
                    {/* Entity Header */}
                    <div className="bg-primary-green text-hunter p-8 md:p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                            <Building2 size={400} />
                        </div>

                        <div className="relative z-10">
                            {/* Entity ID and metadata */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                <span className="px-3 py-1 bg-hunter/20 text-hunter rounded-full text-xs font-semibold backdrop-blur-sm uppercase tracking-wider">
                                    ID: {entity.$id}
                                </span>
                                {entity.aliases && entity.aliases.length > 0 && entity.aliases.map((alias, index) => (
                                    <span key={index} className="px-3 py-1 bg-hunter/10 text-hunter/80 rounded-full text-xs font-medium backdrop-blur-sm border border-hunter/10">
                                        {alias}
                                    </span>
                                ))}
                                <span className="px-3 py-1 bg-hunter/10 text-hunter/60 rounded-full text-xs font-mono backdrop-blur-sm">
                                    Creado: {createdDate}
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight">
                                {entity.label || EMPTY_ENTITY_LABEL}
                            </h1>

                            {entity.description && (
                                <p className="text-lg md:text-xl text-hunter/90 max-w-3xl leading-relaxed font-light border-l-4 border-hunter/20 pl-6">
                                    {entity.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 md:p-12">
                        {/* Outgoing Claims - Properties of this entity */}
                        {outgoingClaims.length > 0 && (
                            <section className="mb-12">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-primary-green">
                                    <div className="bg-primary-green/5 p-2 rounded-lg">
                                        <LinkIcon className="w-6 h-6" />
                                    </div>
                                    Declaraciones ({outgoingClaims.length})
                                </h2>

                                <div className="space-y-4">
                                    {Object.entries(groupedOutgoingClaims).map(([property, claimsList]) => (
                                        <PropertyCard key={property} propertyLabel={property} claimCount={claimsList.length} claimsList={claimsList} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Incoming Claims - References to this entity */}
                        {incomingClaims.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-primary-green">
                                    <div className="bg-hunter/50 p-2 rounded-lg">
                                        <ArrowLeft className="w-6 h-6 transform rotate-180" />
                                    </div>
                                    Referencias ({incomingClaims.length})
                                </h2>
                                <p className="text-sm text-primary-green/50 mb-6">
                                    Otras entidades que hacen referencia a {entity.label}
                                </p>

                                <div className="space-y-4">
                                    {Object.entries(groupedIncomingClaims).map(([property, claimsList]) => (
                                        <PropertyCardIncoming key={property} propertyLabel={property} claimCount={claimsList.length} claimsList={claimsList} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Empty State */}
                        {outgoingClaims.length === 0 && incomingClaims.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-primary-green/40 bg-[#f8f9fa] rounded-2xl border-dashed border-2 border-primary-green/10">
                                <Tag className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-lg font-medium mb-2">No hay declaraciones disponibles</p>
                                <p className="text-sm">Esta entidad aún no tiene propiedades o relaciones registradas</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Memoized component for outgoing claims property card (OPTIMIZED)
const PropertyCard = memo<{
    propertyLabel: string;
    claimCount: number;
    claimsList: Claim[];
}>(({ propertyLabel, claimCount, claimsList }) => (
    <div className="bg-[#f8f9fa] rounded-2xl p-6 border border-primary-green/5 hover:border-primary-green/20 transition-all">
        <h3 className="text-xs font-bold text-primary-green/40 uppercase tracking-widest mb-4 flex items-center gap-2">
            {getIconForPropertyStatic(propertyLabel)}
            {propertyLabel}
            <span className="ml-auto px-2 py-0.5 bg-primary-green/5 rounded-full text-[10px]">
                {claimCount}
            </span>
        </h3>
        <div className="space-y-3">
            {claimsList.map((claim) => (
                <div key={claim.$id} className="text-primary-green text-base leading-relaxed">
                    {renderClaimValue(claim)}
                </div>
            ))}
        </div>
    </div>
));

PropertyCard.displayName = 'PropertyCard';

// Memoized component for incoming claims property card (OPTIMIZED)
const PropertyCardIncoming = memo<{
    propertyLabel: string;
    claimCount: number;
    claimsList: Claim[];
}>(({ propertyLabel, claimCount, claimsList }) => (
    <div className="bg-hunter/30 rounded-2xl p-6 border border-primary-green/5 hover:border-primary-green/20 transition-all">
        <h3 className="text-xs font-bold text-primary-green/40 uppercase tracking-widest mb-4 flex items-center gap-2">
            {getIconForPropertyStatic(propertyLabel)}
            {propertyLabel}
            <span className="ml-auto px-2 py-0.5 bg-primary-green/5 rounded-full text-[10px]">
                {claimCount}
            </span>
        </h3>
        <div className="space-y-3">
            {claimsList.map((claim) => {
                if (!claim.subject) return null;

                const subjectLabel = extractLabel(claim.subject);
                const subjectId = extractId(claim.subject);

                if (!subjectId) return null;

                return (
                    <div key={claim.$id}>
                        <a
                            href={buildPath(`/entity?id=${subjectId}`)}
                            className="inline-flex items-center gap-1 text-primary-green text-base font-medium hover:text-[#2d5a42] transition-colors border-b border-primary-green/10 hover:border-[#2d5a42]/50 pb-0.5 group"
                        >
                            {subjectLabel}
                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                        </a>
                    </div>
                );
            })}
        </div>
    </div>
));

PropertyCardIncoming.displayName = 'PropertyCardIncoming';

// Export memoized component (OPTIMIZED: prevents parent re-renders)
export const EntityDetail = memo(EntityDetailComponent);
