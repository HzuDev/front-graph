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
            // Priority 1: direct GeoJSON URL
            if (url && typeof url === 'string' && url.startsWith('http')) {
                try {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error('Error al cargar la cartografía de la URL provista.');
                    const raw = await res.json();
                    const normalized = normalizeGeoJson(raw);
                    if (!normalized) {
                        throw new Error("El archivo no es un GeoJSON válido.");
                    }
                    return normalized;
                } catch (err: any) {
                    console.error("GeoJSON Load Error via URL:", err);
                    if (!id && !code) {
                        throw err;
                    }
                }
            }

            if (id || code) {
                const polygons = await fetchPolygons();
                const match = polygons.find(poly =>
                    (id && poly.entityId === id) ||
                    (code && poly.administrativeLevel === 3)
                );
                if (match && match.coordinates) {
                    return {
                        type: "Feature",
                        properties: { name: match.entityLabel },
                        geometry: { type: "Polygon", coordinates: match.coordinates }
                    };
                }
            }

            if (url) {
                throw new Error('Cartografía oficial no disponible o en formato externo.');
            }

            return null;
        }
    );

    return {
        geoData: data ?? null,
        error: error ? (error as Error).message : null,
        isLoading: shouldFetch && !error && !data,
    };
};

export function TerritoryMap({ geoJsonUrl, codigoTerritorial, entityId }: TerritoryMapProps) {
    const { geoData, error, isLoading } = useTerritoryGeoData(geoJsonUrl, codigoTerritorial, entityId);

    if (!geoJsonUrl && !codigoTerritorial && !entityId) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-white/5 backdrop-blur-sm rounded-[3rem] border border-white/10 text-hunter/50 font-bold p-8 text-center" suppressHydrationWarning>
                <p>N/D Cartografía</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-white/5 backdrop-blur-sm rounded-[3rem] border border-white/10 text-hunter/50 font-bold p-8 text-center text-xs" suppressHydrationWarning>
                <p>Cartografía oficial de origen externo.<br />Por favor use el botón de descarga o enlace.</p>
            </div>
        );
    }

    if (isLoading || !geoData) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-white/5 backdrop-blur-sm animate-pulse rounded-[3rem] border border-white/10 text-hunter/80 font-bold" suppressHydrationWarning></div>
        );
    }

    return (
        <div suppressHydrationWarning>
            <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center bg-white/5 backdrop-blur-sm animate-pulse rounded-[3rem] border border-white/10 text-hunter/80 font-bold"></div>}>
                <TerritoryMapContent geoData={geoData} />
            </Suspense>
        </div>
    );
}
