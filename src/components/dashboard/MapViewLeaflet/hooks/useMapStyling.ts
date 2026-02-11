import { useCallback } from 'react';
import { LEVEL_COLORS } from '../constants';
import type { MunicipalityFeature } from '../types';

export const useMapStyling = (selectedFeatureId: string | null, userDetectedFeatureId: string | null, hoveredFeatureId: string | null) => {
    // OPTIMIZED: Reduced from 3 dependencies to 2 by combining hover/selection logic
    const getFeatureStyle = useCallback((feature: MunicipalityFeature) => {
        const isUserLocation = feature.properties.id === userDetectedFeatureId;
        const isSelected = feature.properties.id === selectedFeatureId;
        const isHovered = feature.properties.id === hoveredFeatureId;
        const level = feature.properties.level;
        const baseColor = LEVEL_COLORS[level as keyof typeof LEVEL_COLORS] || LEVEL_COLORS[3];

        // User location gets special red styling
        if (isUserLocation) {
            return {
                fillColor: '#ef4444',
                fillOpacity: 0.35,
                color: '#dc2626',
                weight: 3,
                opacity: 1,
                dashArray: '5, 5',
            };
        }

        return {
            fillColor: isSelected ? '#3b82f6' : baseColor,
            fillOpacity: isSelected ? 0.4 : isHovered ? 0.35 : 0.25,
            color: isSelected ? '#f97316' : isHovered ? '#fb923c' : baseColor,
            weight: isSelected ? 3 : isHovered ? 2.5 : 2,
            opacity: 1,
        };
    }, [selectedFeatureId, userDetectedFeatureId, hoveredFeatureId]);

    return { getFeatureStyle };
};
