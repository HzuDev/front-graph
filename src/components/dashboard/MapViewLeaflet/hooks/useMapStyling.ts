import { useCallback } from 'react';
import type { MunicipalityFeature } from '../types';

export const useMapStyling = (
  selectedFeatureId: string | null,
  userDetectedFeatureId: string | null,
  hoveredFeatureId: string | null
) => {
  const getFeatureStyle = useCallback(
    (feature: MunicipalityFeature) => {
      const isUserLocation = feature.properties.id === userDetectedFeatureId;
      const isSelected = feature.properties.id === selectedFeatureId;
      const isHovered = feature.properties.id === hoveredFeatureId;

      const baseColor = '#10b981';

      if (isUserLocation) {
        return {
          fillColor: '#10b981',
          fillOpacity: 0.1,
          color: '#34d399',
          weight: 2,
          opacity: 0.8,
          dashArray: '5, 5',
        };
      }

      return {
        fillColor: isSelected ? '#34d399' : baseColor,
        fillOpacity: isSelected ? 0.5 : isHovered ? 0.3 : 0.05,
        color: isSelected ? '#10b981' : isHovered ? '#34d399' : '#047857',
        weight: isSelected ? 3 : isHovered ? 2 : 1,
        opacity: isSelected ? 1 : 0.6,
      };
    },
    [selectedFeatureId, userDetectedFeatureId, hoveredFeatureId]
  );

  return { getFeatureStyle };
};
