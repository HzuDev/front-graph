import React, { Suspense, lazy } from 'react';
import useSWR from 'swr';
import { fetchPolygons } from '../../../lib/queries/polygons';

interface TerritoryMapProps {
    geoJsonUrl?: string;
    codigoTerritorial?: string;
    entityId?: string;
}

const TerritoryMapContent = lazy(() => import('./TerritoryMapContent').then(m => ({ default: m.TerritoryMapContent })));

const normalizeGeoJson = (data: any) => {
    if (!data) return null;
    if (Array.isArray(data) && Array.isArray(data[0])) {
        return { type: "Feature", geometry: { type: "Polygon", coordinates: data } };
    }
    if (data.type === 'Polygon' || data.type === 'MultiPolygon') {
        return { type: "Feature", geometry: data };
    }
    if (data.type === 'Feature' || data.type === 'FeatureCollection') {
        return data;
    }
    return null;
};

const useTerritoryGeoData = (geoJsonUrl?: string, codigoTerritorial?: string, entityId?: string) => {
    const shouldFetch = !!(geoJsonUrl || codigoTerritorial || entityId);

    const { data, error } = useSWR(
        shouldFetch ? ['territory-geo', geoJsonUrl, codigoTerritorial, entityId] : null,
        async ([, url, code, id]) => {
            console.log('[TerritoryMap] useTerritoryGeoData called with:', { url, code, id });

            // Priority 1: direct GeoJSON URL
            if (url && typeof url === 'string' && url.startsWith('http')) {
                try {
                    console.log('[TerritoryMap] Attempting to fetch GeoJSON from URL:', url);
                    const res = await fetch(url);
                    if (!res.ok) throw new Error('Error al cargar la cartografía de la URL provista.');
                    const raw = await res.json();
                    console.log('[TerritoryMap] GeoJSON fetched successfully:', raw);
                    const normalized = normalizeGeoJson(raw);
                    if (!normalized) {
                        throw new Error("El archivo no es un GeoJSON válido.");
                    }
                    console.log('[TerritoryMap] GeoJSON normalized successfully');
                    return normalized;
                } catch (err: any) {
                    console.error("[TerritoryMap] GeoJSON Load Error via URL:", err);
                    if (!id && !code) {
                        throw err;
                    }
                    console.log('[TerritoryMap] Falling back to polygon cache since entityId or code is available');
                }
            }

            if (id || code) {
                try {
                    console.log('[TerritoryMap] Fetching polygons from cache...');
                    const polygons = await fetchPolygons();
                    console.log('[TerritoryMap] Polygons fetched, total count:', polygons.length);

                    // First try to match by entityId
                    if (id) {
                        console.log('[TerritoryMap] Searching for polygon with entityId:', id);
                        const match = polygons.find(poly => poly.entityId === id);
                        if (match && match.coordinates) {
                            console.log('[TerritoryMap] Found polygon by entityId:', match.entityLabel);
                            return {
                                type: "Feature",
                                properties: { name: match.entityLabel },
                                geometry: { type: "Polygon", coordinates: match.coordinates }
                            };
                        }
                        console.log('[TerritoryMap] No polygon found for entityId:', id);
                    }

                    // Then try to match by code
                    if (code) {
                        console.log('[TerritoryMap] Searching for polygon with code:', code);
                        const match = polygons.find(poly => poly.ineCode === code);
                        if (match && match.coordinates) {
                            console.log('[TerritoryMap] Found polygon by code:', match.entityLabel);
                            return {
                                type: "Feature",
                                properties: { name: match.entityLabel },
                                geometry: { type: "Polygon", coordinates: match.coordinates }
                            };
                        }
                        console.log('[TerritoryMap] No polygon found for code:', code);
                    }
                } catch (err: any) {
                    console.error('[TerritoryMap] Error fetching polygons:', err);
                }
            }

            if (url) {
                throw new Error('Cartografía oficial no disponible o en formato externo.');
            }

            console.log('[TerritoryMap] No GeoJSON data available');
            return null;
        }
    );

    console.log('[TerritoryMap] useTerritoryGeoData state:', {
        hasData: !!data,
        hasError: !!error,
        isLoading: shouldFetch && !error && !data,
        errorMessage: error ? (error as Error).message : null
    });

    return {
        geoData: data ?? null,
        error: error ? (error as Error).message : null,
        isLoading: shouldFetch && !error && !data,
    };
};

export default function TerritoryMap({ geoJsonUrl, codigoTerritorial, entityId }: TerritoryMapProps) {
    const { geoData, error, isLoading } = useTerritoryGeoData(geoJsonUrl, codigoTerritorial, entityId);

    console.log('[TerritoryMap] Component render:', {
        geoJsonUrl,
        codigoTerritorial,
        entityId,
        hasGeoData: !!geoData,
        error,
        isLoading
    });

    if (!geoJsonUrl && !codigoTerritorial && !entityId) {
        console.log('[TerritoryMap] No data provided, showing N/D message');
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-white/5 backdrop-blur-sm rounded-[3rem] border border-white/10 text-hunter/50 font-bold p-8 text-center" suppressHydrationWarning>
                <p>N/D Cartografía</p>
            </div>
        );
    }

    if (error) {
        console.log('[TerritoryMap] Error state:', error);
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-white/5 backdrop-blur-sm rounded-[3rem] border border-white/10 text-hunter/50 font-bold p-8 text-center text-xs" suppressHydrationWarning>
                <p>Cartografía oficial de origen externo.<br />Por favor use el botón de descarga o enlace.</p>
            </div>
        );
    }

    if (isLoading || !geoData) {
        console.log('[TerritoryMap] Loading state:', { isLoading, hasGeoData: !!geoData });
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-white/5 backdrop-blur-sm animate-pulse rounded-[3rem] border border-white/10 text-hunter/80 font-bold" suppressHydrationWarning></div>
        );
    }

    console.log('[TerritoryMap] Rendering map with geoData');
    return (
        <div suppressHydrationWarning className="w-full h-full absolute inset-0">
            <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center bg-white/5 backdrop-blur-sm animate-pulse rounded-[3rem] border border-white/10 text-hunter/80 font-bold"></div>}>
                <TerritoryMapContent geoData={geoData} />
            </Suspense>
        </div>
    );
}
