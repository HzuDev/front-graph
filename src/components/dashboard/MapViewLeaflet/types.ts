export interface MapViewProps {
    onMunicipalitySelect?: (municipality: { name: string; department: string; entityId: string }) => void;
    selectedEntityId?: string | null;
}

export interface MunicipalityFeature {
    type: 'Feature';
    properties: {
        id: string;
        name: string;
        department: string;
        level: number;
    };
    geometry: {
        type: 'Polygon';
        coordinates: number[][][];
    };
}

export interface MunicipalityGeoJSON {
    type: 'FeatureCollection';
    features: MunicipalityFeature[];
}
