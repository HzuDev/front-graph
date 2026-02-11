import React, { lazy, Suspense } from 'react';
import MapErrorBoundary from './components/MapErrorBoundary';
import { MapViewLoader } from './components/MapErrorBoundary';
import type { MapViewWrapperProps } from './types';

// Lazy load the new optimized Leaflet-based MapView
const MapViewLeaflet = lazy(() => import('../MapViewLeaflet'));

const MapViewWrapper: React.FC<MapViewWrapperProps> = (props) => {
    return (
        <MapErrorBoundary>
            <Suspense fallback={<MapViewLoader />}>
                <MapViewLeaflet {...props} />
            </Suspense>
        </MapErrorBoundary>
    );
};

export default MapViewWrapper;
