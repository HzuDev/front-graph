import React, { lazy, Suspense } from 'react';

// Lazy load the new optimized Leaflet-based MapView
const MapViewLeaflet = lazy(() => import('../MapViewLeaflet'));

export const MapViewLoader = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-[2.5rem]">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Cargando mapa...</p>
        </div>
    </div>
);

// Error fallback (shown via ErrorBoundary if needed)
export const MapErrorFallback = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-[2.5rem]">
        <div className="text-center p-8">
            <p className="text-gray-600 font-bold mb-2">Mapa no disponible</p>
            <p className="text-sm text-gray-500">Error al cargar el componente de mapa</p>
        </div>
    </div>
);

// Simple error boundary
class MapErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        console.error('❌ MapView error:', error);
    }

    render() {
        if (this.state.hasError) {
            return <MapErrorFallback />;
        }
        return this.props.children;
    }
}

export default MapErrorBoundary;
