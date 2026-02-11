import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png?url';
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png?url';

// Fix Leaflet default marker icon issue with Vite
const DefaultIcon = L.icon({
    iconUrl: iconUrl,
    shadowUrl: iconShadowUrl,
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom red marker icon for user location
const UserLocationIcon = L.divIcon({
    className: 'custom-user-marker',
    html: '<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});

// Import hooks and utilities
import { useMapGeometry } from './hooks/useMapGeometry';
import { useUserLocationDetection } from './hooks/useUserLocationDetection';
import { useMapStyling } from './hooks/useMapStyling';
import { useMapEventHandlers } from './hooks/useMapEventHandlers';
import { loadUserLocationFromStorage, pointInPolygon, saveMunicipalityToStorage } from './utils/geomHelpers';
import { LEVEL_NAMES, LEVEL_COLORS } from './constants';
import MapController from './components/MapController';
import type { MapViewProps } from './types';

// Main MapView component with React Leaflet
const MapViewLeaflet: React.FC<MapViewProps> = ({ onMunicipalitySelect, selectedEntityId }) => {
    const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(selectedEntityId || null);
    const [userDetectedFeatureId, setUserDetectedFeatureId] = useState<string | null>(null);
    const [userDetectedFeatureName, setUserDetectedFeatureName] = useState<string | null>(null);
    const [hoveredFeatureId, setHoveredFeatureId] = useState<string | null>(null);

    // Use custom hooks for separated concerns
    const { geoJsonData, loading, error } = useMapGeometry();
    const userLocation = useUserLocationDetection();
    const { getFeatureStyle } = useMapStyling(selectedFeatureId, userDetectedFeatureId, hoveredFeatureId);
    const { onEachFeature } = useMapEventHandlers(userDetectedFeatureId, onMunicipalitySelect, setSelectedFeatureId, setHoveredFeatureId);

    // Auto-detect municipality from user location
    useEffect(() => {
        if (userLocation && geoJsonData && !userDetectedFeatureId) {
            const detected = geoJsonData.features.find(feature => {
                return pointInPolygon(
                    [userLocation.lon, userLocation.lat],
                    feature.geometry.coordinates
                );
            });

            if (detected) {
                setUserDetectedFeatureId(detected.properties.id);
                setUserDetectedFeatureName(detected.properties.name);
                setSelectedFeatureId(detected.properties.id);
                
                const levelName = LEVEL_NAMES[detected.properties.level] || 'Desconocido';
                
                if (onMunicipalitySelect) {
                    onMunicipalitySelect({
                        name: detected.properties.name,
                        department: detected.properties.department,
                        entityId: detected.properties.id,
                    });
                }
                
                // Save to localStorage with debounce (OPTIMIZED: evita múltiples writes)
                saveMunicipalityToStorage(() => {
                    localStorage.setItem('detected_municipality', JSON.stringify({
                        name: detected.properties.name,
                        department: detected.properties.department,
                        entityId: detected.properties.id,
                        level: detected.properties.level,
                        levelName: levelName,
                    }));
                });
            } 
        }
    }, [userLocation, geoJsonData, userDetectedFeatureId, onMunicipalitySelect]);

    // Memoized feature transformation (OPTIMIZED: avoids recreating features on every render)
    const geoJsonDataMemo = useMemo(() => {
        return geoJsonData;
    }, [geoJsonData]);

    // Update selected feature when prop changes
    useEffect(() => {
        if (selectedEntityId) {
            setSelectedFeatureId(selectedEntityId);
        }
    }, [selectedEntityId]);

    // Calculate initial center and zoom
    const { center, zoom } = useMemo<{ center: LatLngExpression; zoom: number }>(() => {
        if (userLocation) {
            return { center: [userLocation.lat, userLocation.lon], zoom: 10 };
        }
        // Bolivia center with better zoom level to show whole country
        return { center: [-16.5, -64.5], zoom: 5.5 }; // Bolivia center
    }, [userLocation]);

    // Loading state
    if (loading) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-[2.5rem]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600 font-medium">Cargando mapa...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !geoJsonData) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-[2.5rem]">
                <div className="text-center p-8">
                    <p className="text-gray-600 font-bold mb-2">Mapa no disponible</p>
                    <p className="text-sm text-gray-500">{error || 'No se pudieron cargar los datos'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                className="rounded-[2.5rem]"
            >
                {/* Base tile layer */}
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />

                {/* GeoJSON polygons */}
                {geoJsonDataMemo && (
                    <GeoJSON
                        data={geoJsonDataMemo}
                        style={(feature) => getFeatureStyle(feature as any)}
                        onEachFeature={onEachFeature}
                    />
                )}

                {/* User location marker */}
                {userLocation && (
                    <Marker 
                        position={[userLocation.lat, userLocation.lon]}
                        icon={UserLocationIcon}
                    >
                        <Popup>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 font-bold text-sm text-red-500">
                                    <MapPin size={16} />
                                    <span>Tu ubicación</span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Map controller for auto-zoom */}
                <MapController
                    userLocation={userLocation}
                    selectedFeatureId={selectedFeatureId}
                    userDetectedFeatureId={userDetectedFeatureId}
                    features={geoJsonData.features}
                />
            </MapContainer>

            {/* User Location Banner */}
            {userLocation && userDetectedFeatureName && (
                <div className="absolute top-4 left-4 right-4 bg-red-500 text-white p-4 rounded-2xl shadow-2xl z-1000 animate-fadeIn">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <MapPin size={20} className="text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold opacity-90">Tu ubicación detectada</p>
                                <p className="text-lg font-black">{userDetectedFeatureName}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg z-999">
                <p className="text-xs font-bold mb-2 text-gray-700">Niveles Administrativos</p>
                <div className="space-y-1">
                    {Object.entries(LEVEL_COLORS).map(([level, color]) => (
                        <div key={level} className="flex items-center gap-2">
                            <div 
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: color, opacity: 0.6 }}
                            />
                            <span className="text-xs text-gray-600">
                                {level === '0' ? 'País' : level === '1' ? 'Departamento' : level === '2' ? 'Provincia' : 'Municipio'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default memo(MapViewLeaflet);
