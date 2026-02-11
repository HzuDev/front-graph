import { useState, useEffect } from 'react';
import { fetchPolygons } from '../../../../lib/queries';
import type { MunicipalityFeature, MunicipalityGeoJSON } from '../types';

export const useMapGeometry = () => {
    const [geoJsonData, setGeoJsonData] = useState<MunicipalityGeoJSON | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    return { geoJsonData, loading, error };
};
