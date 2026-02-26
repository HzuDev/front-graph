import { useState, useEffect } from 'react';
import { fetchPolygons } from '../../../../lib/queries';
import type { MunicipalityFeature, MunicipalityGeoJSON } from '../types';

export const useMapGeometry = () => {
  const [geoJsonData, setGeoJsonData] = useState<MunicipalityGeoJSON | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPolygons = async () => {
      const startTime = performance.now();
      console.log(
        '[useMapGeometry] 🚀 Iniciando carga de geometrías del mapa...'
      );

      try {
        setLoading(true);
        setReady(false);

        const polygons = await fetchPolygons();

        if (!isMounted) {
          console.log(
            '[useMapGeometry] ⚠️ Componente desmontado, cancelando...'
          );
          return;
        }

        console.log(
          '[useMapGeometry] 📦 Recibidos ' +
            polygons.length +
            ' polígonos de fetchPolygons'
        );

        // Filtrar solo municipios (nivel 3) con coordenadas válidas
        const validPolygons = polygons.filter((p) => {
          if (
            !p.coordinates ||
            !Array.isArray(p.coordinates) ||
            p.coordinates.length === 0
          ) {
            return false;
          }
          if (p.administrativeLevel !== 3) {
            return false;
          }
          return true;
        });

        console.log(
          '[useMapGeometry] ✅ ' +
            validPolygons.length +
            ' polígonos válidos (nivel 3 - municipios)'
        );

        const features: MunicipalityFeature[] = validPolygons.map((p) => ({
          type: 'Feature' as const,
          properties: {
            id: p.entityId,
            name: p.entityLabel,
            department: p.departamentName || '',
            level: p.administrativeLevel || 3,
            ineCode: p.ineCode,
            hasEntity: p.hasEntity,
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

        // Validación de nombres
        const featuresWithoutName = features.filter(
          (f) => !f.properties.name || f.properties.name === ''
        );
        if (featuresWithoutName.length > 0) {
          console.warn(
            '[useMapGeometry] ⚠️ ' +
              featuresWithoutName.length +
              ' features sin nombre'
          );
        }

        // Validación de coordenadas
        const featuresWithInvalidCoords = features.filter((f) => {
          const coords = f.geometry.coordinates;
          if (!coords || !coords[0] || coords[0].length < 3) return true;
          return false;
        });
        if (featuresWithInvalidCoords.length > 0) {
          console.warn(
            '[useMapGeometry] ⚠️ ' +
              featuresWithInvalidCoords.length +
              ' features con coordenadas inválidas'
          );
        }

        setGeoJsonData(geojson);
        setError(null);
        setReady(true);

        const duration = performance.now() - startTime;
        console.log(
          '[useMapGeometry] 🎉 Geometrías listas para renderizar (' +
            Math.round(duration) +
            'ms)'
        );
        console.log('[useMapGeometry] 📊 Total features: ' + features.length);
      } catch (err) {
        console.error('[useMapGeometry] ❌ Error cargando polígonos:', err);
        if (isMounted) {
          setError('Error al cargar los polígonos');
          setReady(false);
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

  return { geoJsonData, loading, error, ready };
};
