import { Globe, Building2, Users, Vote, MapPin } from 'lucide-react';

// Helper para obtener el icono de tipo de entidad
export const getEntityTypeIcon = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
        'Globe': Globe,
        'Building2': Building2,
        'Users': Users,
        'Vote': Vote,
        'MapPin': MapPin,
    };
    return iconMap[iconName];
};
