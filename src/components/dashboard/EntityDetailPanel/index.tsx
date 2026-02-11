import React, { useCallback, useMemo } from 'react';
import { X, Tag, Link as LinkIcon, ArrowRight, Loader2, Building2 } from 'lucide-react';
import { useEntityDetails } from './hooks/useEntityDetails';
import { useClaimFiltering } from './hooks/useClaimFiltering';
import { groupClaimsByProperty } from './utils/propertyHelpers';
import PropertyCard from './components/PropertyCard';
import type { EntityDetailPanelProps } from './types';

const EntityDetailPanel: React.FC<EntityDetailPanelProps> = ({ entityId, onClose, onSelectRelated }) => {
    const { entity, claims, loading } = useEntityDetails(entityId);

    // Memoizar el filtrado y agrupamiento de claims
    const { outgoingClaims, incomingClaims } = useClaimFiltering(claims, entityId);
    
    // Memoizar agrupamiento de claims para ambas secciones
    const outgoingGrouped = useMemo(() => groupClaimsByProperty(outgoingClaims), [outgoingClaims]);
    const incomingGrouped = useMemo(() => groupClaimsByProperty(incomingClaims), [incomingClaims]);

    // Callback memoizado para manejar relaciones
    const handleSelectRelated = useCallback((id: string) => {
        onSelectRelated(id);
    }, [onSelectRelated]);

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
                {loading ? (
                    <div className="flex items-center justify-center p-20">
                        <Loader2 className="w-12 h-12 text-primary-green animate-spin" />
                    </div>
                ) : entity ? (
                    <>
                        {/* Header */}
                        <div className="bg-primary-green text-hunter p-8 relative overflow-hidden shrink-0">
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 hover:bg-hunter/10 rounded-full transition-colors z-10"
                            >
                                <X size={24} />
                            </button>

                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                                <Building2 size={300} />
                            </div>

                            <div className="relative z-10 mr-12">
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="px-3 py-1 bg-hunter/20 text-hunter rounded-full text-xs font-semibold backdrop-blur-sm uppercase tracking-wider">
                                        Entidad
                                    </span>
                                    {entity.aliases?.map((alias, index) => (
                                        <span key={index} className="px-3 py-1 bg-hunter/10 text-hunter/80 rounded-full text-xs font-medium backdrop-blur-sm border border-hunter/10">
                                            {alias}
                                        </span>
                                    ))}
                                </div>

                                <h2 className="text-3xl md:text-4xl font-black mb-3 tracking-tight leading-tight">
                                    {entity.label}
                                </h2>

                                {entity.description && (
                                    <p className="text-base text-hunter/90 leading-relaxed font-light border-l-4 border-hunter/20 pl-4">
                                        {entity.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto flex-1 p-8">
                            {/* Outgoing Claims - Properties of this entity */}
                            {outgoingClaims.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-primary-green">
                                        <div className="bg-primary-green/5 p-2 rounded-lg">
                                            <LinkIcon className="w-5 h-5" />
                                        </div>
                                        Propiedades
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(outgoingGrouped).map(([property, claimsList]) => (
                                            <PropertyCard 
                                                key={property}
                                                property={property}
                                                claims={claimsList}
                                                onSelectRelated={handleSelectRelated}
                                                type="outgoing"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Incoming Claims - Entities that reference this entity */}
                            {incomingClaims.length > 0 && (
                                <div>
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-primary-green">
                                        <div className="bg-primary-green/5 p-2 rounded-lg">
                                            <ArrowRight className="w-5 h-5 transform rotate-180" />
                                        </div>
                                        Referencias ({incomingClaims.length})
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(incomingGrouped).map(([property, claimsList]) => (
                                            <PropertyCard 
                                                key={property}
                                                property={property}
                                                claims={claimsList}
                                                onSelectRelated={handleSelectRelated}
                                                type="incoming"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {outgoingClaims.length === 0 && incomingClaims.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 text-primary-green/40">
                                    <Tag className="w-12 h-12 mb-4 opacity-20" />
                                    <p className="text-lg font-medium">No se encontraron propiedades o relaciones</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center p-20 text-primary-green/40">
                        <p className="text-lg font-medium">No se pudo cargar la información de la entidad</p>
                        <button
                            onClick={onClose}
                            className="mt-4 px-6 py-2 bg-primary-green text-hunter rounded-xl font-bold text-sm hover:bg-soft-green transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-up {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default React.memo(EntityDetailPanel);
