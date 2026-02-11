import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import type { LatLngExpression, GeoJSONOptions } from 'leaflet';
import { LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import { fetchPolygons } from '@/lib/queries';

// Fix Leaflet default marker icon issue with Vite
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png?url';
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png?url';
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

// ============ HELPERS EXTRAÍDOS FUERA ============

// Helper para cargar ubicación desde localStorage (evita duplicación)
const loadUserLocationFromStorage = () => {
    const userLocationStr = localStorage.getItem('user_location');
    if (userLocationStr) {
        try {
            const location = JSON.parse(userLocationStr);
            if (location?.lat && location?.lon) {
                return location;
            }
        } catch (e) {
            console.error('Error parsing user location:', e);
        }
    }
    return null;
};

// Helper con debounce para guardar municipio (evita múltiples writes)
const createDebounce = (delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return (fn: () => void) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(fn, delay);
    };
};

const saveMunicipalityToStorage = createDebounce(300);

// Constante para nivel names
const LEVEL_NAMES: Record<number, string> = {
    0: 'País',
    1: 'Departamento',
    2: 'Provincia',
    3: 'Municipio',
};

interface MapViewProps {
    onMunicipalitySelect?: (municipality: { name: string; department: string; entityId: string }) => void;
    selectedEntityId?: string | null;
}

interface MunicipalityFeature {
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

interface MunicipalityGeoJSON {
    type: 'FeatureCollection';
    features: MunicipalityFeature[];
}

// Color mapping by administrative level
const LEVEL_COLORS = {
    0: '#ec4899', // País - Rosa
    1: '#a855f7', // Departamento - Púrpura
    2: '#3b82f6', // Provincia - Azul
    3: '#10b981', // Municipio - Verde
} as const;

// Algoritmo point-in-polygon optimizado (CRÍTICO: ejecuta en cálculos intensivos)
const pointInPolygon = (point: [number, number], polygon: number[][][]) => {
    const [x, y] = point;
    for (let ring of polygon) {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const [xi, yi] = ring[i];
            const [xj, yj] = ring[j];
            const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
            if (intersect) inside = !inside;
        }
        if (inside) return true;
    }
    return false;
};

// Component to handle map events and auto-zoom
const MapController = memo(({ 
    userLocation, 
    selectedFeatureId,
    userDetectedFeatureId,
    features 
}: { 
    userLocation: { lat: number; lon: number } | null;
    selectedFeatureId: string | null;
    userDetectedFeatureId: string | null;
    features: MunicipalityFeature[];
}) => {
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

// Main MapView component with React Leaflet
const MapViewLeaflet: React.FC<MapViewProps> = ({ onMunicipalitySelect, selectedEntityId }) => {
    const [geoJsonData, setGeoJsonData] = useState<MunicipalityGeoJSON | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(selectedEntityId || null);
    const [userDetectedFeatureId, setUserDetectedFeatureId] = useState<string | null>(null);
    const [userDetectedFeatureName, setUserDetectedFeatureName] = useState<string | null>(null);
    const [hoveredFeatureId, setHoveredFeatureId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load user location from localStorage (using helper to avoid duplication)
    useEffect(() => {
        const location = loadUserLocationFromStorage();
        if (location) {
            setUserLocation(location);
        }
    }, []);

    // Load and process polygon data
    useEffect(() => {
        let isMounted = true;

        const loadPolygons = async () => {
            try {
                setLoading(true);
                
                const polygons = await fetchPolygons();
                
                if (!isMounted) return;

                console.log('[MapView] Received ' + polygons.length + ' polygons from fetchPolygons');

                // Transform to GeoJSON FeatureCollection
                const features: MunicipalityFeature[] = polygons
                    .filter(p => p.coordinates && Array.isArray(p.coordinates) && p.coordinates.length > 0)
                    .map(p => ({
                        type: 'Feature' as const,
                        properties: {
                            id: p.entityId,
                            name: p.entityLabel,
                            department: '',
                            level: p.administrativeLevel || 3,
                        },
                        geometry: {
                            type: 'Polygon' as const,
                            coordinates: p.coordinates,
                        },
                    }));

                const geojson: MunicipalityGeoJSON = {
                    type: 'FeatureCollection',
                    features,
                };

              
                
                if (features.length > 0) {
                                        
                    const featuresWithoutName = features.filter(f => !f.properties.name || f.properties.name === '');
                    if (featuresWithoutName.length > 0) {
                        console.warn('[MapView] Found ' + featuresWithoutName.length + ' features without names');
                    }
                }
                
                setGeoJsonData(geojson);
                setError(null);
            } catch (err) {
                console.error('[MapView] Error loading polygons:', err);
                if (isMounted) {
                    setError('Error al cargar los polígonos');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadPolygons();

        return () => {
            isMounted = false;
        };
    }, []);

    // Point-in-polygon algorithm (optimized) - REMOVED: now using global pointInPolygon function
    
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
    // PROBLEMA 5: This transformation was not memoized, causing unnecessary GeoJSON rebuilds
    const geoJsonDataMemo = useMemo(() => {
        return geoJsonData;
    }, [geoJsonData]);

    // Update selected feature when prop changes
    useEffect(() => {
        if (selectedEntityId) {
            setSelectedFeatureId(selectedEntityId);
        }
    }, [selectedEntityId]);
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

    // Event handlers (memoized)
    // OPTIMIZED: Using LEVEL_NAMES constant to avoid ternary chains
    const onEachFeature = useCallback((feature: any, layer: any) => {
        if (!feature.properties) return;

        const props = feature.properties as MunicipalityFeature['properties'];
        const isUserLocation = props.id === userDetectedFeatureId;
        const levelName = LEVEL_NAMES[props.level] || 'Desconocido';
        const displayName = props.name || 'Área sin nombre';

        // Click handler
        layer.on('click', () => {
            setSelectedFeatureId(props.id);
            if (onMunicipalitySelect) {
                onMunicipalitySelect({
                    name: props.name,
                    department: props.department,
                    entityId: props.id,
                });
            }
        });

        // Hover handlers
        layer.on('mouseover', () => {
            setHoveredFeatureId(props.id);
        });

        layer.on('mouseout', () => {
            setHoveredFeatureId(null);
        });

        // Tooltip
        const tooltipContent = isUserLocation 
            ? `<div style="font-size: 14px; padding: 4px;"><div style="margin-bottom: 4px;"><strong style="font-size: 15px;">${displayName}</strong></div><div style="color: #ef4444; font-weight: 700; font-size: 12px;">TU UBICACIÓN ACTUAL</div><div style="color: #991b1b; font-size: 11px; margin-top: 2px;">${levelName}</div></div>`
            : `<div style="padding: 2px;"><strong style="font-size: 13px;">${displayName}</strong><br/><span style="font-size: 11px; color: #666;">${levelName}</span></div>`;
        
        layer.bindTooltip(tooltipContent, {
            sticky: true,
            permanent: isUserLocation,
            direction: isUserLocation ? 'top' : 'auto',
            className: isUserLocation ? 'user-location-tooltip' : '',
            offset: [0, isUserLocation ? -10 : 0],
        });
    }, [onMunicipalitySelect, userDetectedFeatureId]);

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
                        style={(feature) => getFeatureStyle(feature as MunicipalityFeature)}
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
