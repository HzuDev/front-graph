import { Tag, Link as LinkIcon, Calendar, MapPin, Globe, Building2 } from 'lucide-react';
import type { Claim } from '../../../lib/queries';

// Helper para extraer IDs de manera consistente (evita duplicación)
export const extractId = (item: string | { $id: string } | undefined): string => {
    if (!item) return '';
    return typeof item === 'string' ? item : item.$id || '';
};

// Helper con icono para propiedades
export const getIconForProperty = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('fecha')) return <Calendar className="w-4 h-4" />;
    if (lowerLabel.includes('lugar') || lowerLabel.includes('ubicación') || lowerLabel.includes('municipio')) return <MapPin className="w-4 h-4" />;
    if (lowerLabel.includes('web') || lowerLabel.includes('url')) return <Globe className="w-4 h-4" />;
    if (lowerLabel.includes('organización') || lowerLabel.includes('partido')) return <Building2 className="w-4 h-4" />;
    return <Tag className="w-4 h-4" />;
};

// Helper para agrupar claims por propiedad (consolida lógica duplicada)
export const groupClaimsByProperty = (claims: Claim[]): Record<string, Claim[]> => {
    return claims.reduce((acc, claim) => {
        const propertyLabel = typeof claim.property === 'object' ? (claim.property as any)?.label : 'Propiedad desconocida';
        if (!acc[propertyLabel]) {
            acc[propertyLabel] = [];
        }
        acc[propertyLabel].push(claim);
        return acc;
    }, {} as Record<string, Claim[]>);
};
