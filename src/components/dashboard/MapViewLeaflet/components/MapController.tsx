import { memo, useReducer, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import { LatLngBounds } from 'leaflet';
import type { MunicipalityFeature } from '../types';

interface MapControllerProps {
    userLocation: { lat: number; lon: number } | null;
    selectedFeatureId: string | null;
    userDetectedFeatureId: string | null;
    features: MunicipalityFeature[];
}

interface MapState {
    hasZoomed: boolean;
}

type MapAction = 
    | { type: 'SET_ZOOMED'; payload: boolean };

const mapReducer = (state: MapState, action: MapAction): MapState => {
    switch (action.type) {
        case 'SET_ZOOMED':
            return { ...state, hasZoomed: action.payload };
        default:
            return state;
    }
};

const MapController = memo(({
    userLocation,
    selectedFeatureId,
    userDetectedFeatureId,
    features
}: MapControllerProps) => {
    const map = useMap();
    const [state, dispatch] = useReducer(mapReducer, { hasZoomed: false });
    const { hasZoomed } = state;

    useEffect(() => {
        if (!map) return;

        let count = 0;
        const intervalId = setInterval(() => {
            map.invalidateSize();
            count++;
            if (count >= 15) clearInterval(intervalId); 
        }, 200);

        let observer: ResizeObserver | null = null;
        const container = map.getContainer();

        if (container) {
            observer = new ResizeObserver(() => {
                map.invalidateSize();
            });
            observer.observe(container);

            if (container.parentElement) {
                observer.observe(container.parentElement);
                if (container.parentElement.parentElement) {
                    observer.observe(container.parentElement.parentElement);
                }
            }
        }

        const resizeHandle = () => map.invalidateSize();
        window.addEventListener('resize', resizeHandle);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('resize', resizeHandle);
            if (observer) {
                observer.disconnect();
            }
        };
    }, [map]);

    useEffect(() => {
        if (hasZoomed) return;

        const targetId = selectedFeatureId || userDetectedFeatureId;

        if (targetId) {
            const feature = features.find(f => f.properties.id === targetId);
            if (feature && feature.geometry.coordinates[0]) {
                const bounds = new LatLngBounds(
                    feature.geometry.coordinates[0].map(coord => [coord[1], coord[0]] as LatLngExpression)
                );
                setTimeout(() => {
                    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, duration: 1.5 });
                    dispatch({ type: 'SET_ZOOMED', payload: true });
                }, 500);
            }
        } else if (userLocation) {
            setTimeout(() => {
                map.flyTo([userLocation.lat, userLocation.lon], 11, { duration: 1.5 });
                dispatch({ type: 'SET_ZOOMED', payload: true });
            }, 500);
        }
    }, [selectedFeatureId, userDetectedFeatureId, userLocation, features, map, hasZoomed]);

    useEffect(() => {
        if (!hasZoomed) return;

        if (selectedFeatureId) {
            const feature = features.find(f => f.properties.id === selectedFeatureId);
            if (feature && feature.geometry.coordinates[0]) {
                const bounds = new LatLngBounds(
                    feature.geometry.coordinates[0].map(coord => [coord[1], coord[0]] as LatLngExpression)
                );
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, duration: 1 });
            }
        }
    }, [selectedFeatureId, features, map, hasZoomed]);

    return null;
});

MapController.displayName = 'MapController';

export default MapController;
