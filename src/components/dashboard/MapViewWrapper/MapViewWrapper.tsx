import React, { lazy, Suspense, useEffect, useRef } from 'react';
import MapErrorBoundary from './components/MapErrorBoundary';
import { MapViewLoader } from './components/MapErrorBoundary';
import type { MapViewWrapperProps } from './types';

const MapViewLeaflet = lazy(() => import('../MapViewLeaflet/MapViewLeaflet'));

const MapViewWrapper: React.FC<MapViewWrapperProps> = (props) => {
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const node = wrapperRef.current;
        if (!node) return;

        const rafId = requestAnimationFrame(() => {
            window.dispatchEvent(new Event('resize'));
        });

        return () => {
            cancelAnimationFrame(rafId);
        };
    }, []);

    return (
        <div ref={wrapperRef} className="absolute inset-0">
            <MapErrorBoundary>
                <Suspense fallback={<MapViewLoader />}>
                    <MapViewLeaflet {...props} />
                </Suspense>
            </MapErrorBoundary>
        </div>
    );
};

export default MapViewWrapper;
