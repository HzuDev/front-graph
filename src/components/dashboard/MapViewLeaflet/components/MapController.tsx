import React, { memo, useState, useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import { LatLngBounds } from 'leaflet';
import type { MunicipalityFeature } from '../types';

interface MapControllerProps {
    userLocation: { lat: number; lon: number } | null;
    selectedFeatureId: string | null;
    userDetectedFeatureId: string | null;
    features: MunicipalityFeature[];
}

// Component to handle map events and auto-zoom
const MapController = memo(({ 
    userLocation, 
    selectedFeatureId,
    userDetectedFeatureId,
    features 
}: MapControllerProps) => {
    const map = useMap();
    const [hasZoomed, setHasZoomed] = useState(false);

    // Auto-zoom to user detected feature or user location (only once on mount)
    useEffect(() => {
        if (hasZoomed) return;

        if (userDetectedFeatureId) {
            const feature = features.find(f => f.properties.id === userDetectedFeatureId);
            if (feature && feature.geometry.coordinates[0]) {
                const bounds = new LatLngBounds(
                    feature.geometry.coordinates[0].map(coord => [coord[1], coord[0]] as LatLngExpression)
                );
                setTimeout(() => {
                    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, duration: 1.5 });
                    setHasZoomed(true);
                }, 500);
            }
        } else if (userLocation) {
            setTimeout(() => {
                map.flyTo([userLocation.lat, userLocation.lon], 11, { duration: 1.5 });
                setHasZoomed(true);
            }, 500);
        }
    }, [userDetectedFeatureId, userLocation, features, map, hasZoomed]);

    // Handle manual selection zoom (separate from initial auto-zoom)
    useEffect(() => {
        if (!hasZoomed) return;
        
        if (selectedFeatureId && selectedFeatureId !== userDetectedFeatureId) {
            const feature = features.find(f => f.properties.id === selectedFeatureId);
            if (feature && feature.geometry.coordinates[0]) {
                const bounds = new LatLngBounds(
                    feature.geometry.coordinates[0].map(coord => [coord[1], coord[0]] as LatLngExpression)
                );
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, duration: 1 });
            }
        }
    }, [selectedFeatureId, userDetectedFeatureId, features, map, hasZoomed]);

    return null;
});

MapController.displayName = 'MapController';

export default MapController;
