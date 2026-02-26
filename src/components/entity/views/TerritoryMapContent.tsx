import React, { Suspense, lazy } from 'react';
import type { GeoJsonObject } from 'geojson';

interface TerritoryMapContentProps {
  geoData: GeoJsonObject;
}

const MapRenderer = lazy(() => import('./MapRenderer'));

export function TerritoryMapContent({ geoData }: TerritoryMapContentProps) {
  return (
    <Suspense
      fallback={
        <div className="absolute inset-0 flex items-center justify-center bg-white/5 backdrop-blur-sm animate-pulse rounded-[3rem] border border-white/10 text-hunter/80 font-bold"></div>
      }
    >
      <MapRenderer geoData={geoData} />
    </Suspense>
  );
}
