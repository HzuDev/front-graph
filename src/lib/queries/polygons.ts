import {
  databases,
  storage,
  DATABASE_ID,
  COLLECTIONS,
  GEOJSON_BUCKET_ID,
  Query,
} from "../appwrite";
import type { Entity, Claim, PolygonData } from "./types";
import { fetchAdministrativeLevels } from "./administrative";

// Cache for polygons to avoid re-fetching
let polygonCache: PolygonData[] | null = null;
let polygonCacheTime: number = 0;
const POLYGON_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (aumentado)
const LOCALSTORAGE_KEY = "polygons_cache_v1";
const LOCALSTORAGE_TIME_KEY = "polygons_cache_time_v1";

/**
 * Helper function to parse GeoJSON coordinates from various formats
 */
function parseGeoJsonCoordinates(
  geoJsonData: any,
  claimId: string,
): number[][][] | null {
  // Handle different GeoJSON formats
  if (geoJsonData.type === "Feature" && geoJsonData.geometry) {
    // Handle Feature with geometry
    if (geoJsonData.geometry.type === "MultiPolygon") {
      // MultiPolygon: take the first polygon from the array
      return geoJsonData.geometry.coordinates[0];
    } else if (geoJsonData.geometry.type === "Polygon") {
      return geoJsonData.geometry.coordinates;
    }
  } else if (geoJsonData.type === "MultiPolygon") {
    // Direct MultiPolygon: take the first polygon
    return geoJsonData.coordinates[0];
  } else if (geoJsonData.type === "Polygon") {
    return geoJsonData.coordinates;
  } else if (Array.isArray(geoJsonData)) {
    // Direct coordinates array
    return geoJsonData;
  }

  return null;
}

/**
 * Fetch polygon data from storage or parse inline GeoJSON
 */
async function fetchPolygonCoordinates(
  claim: Claim,
): Promise<number[][][] | null> {
  try {
    let coordinates;

    // Check if value_raw is a URL (Appwrite Storage link)
    if (
      typeof claim.value_raw === "string" &&
      claim.value_raw.startsWith("http")
    ) {
      // Extract bucketId and fileId from Appwrite Storage URL
      // Format: https://appwrite.sociest.org/v1/storage/buckets/{bucketId}/files/{fileId}/view?project=...
      const urlMatch = claim.value_raw.match(
        /\/buckets\/([^\/]+)\/files\/([^\/]+)\//,
      );

      if (urlMatch) {
        const [, bucketId, fileId] = urlMatch;

        try {
          // Use Appwrite SDK to get file view URL (handles authentication)
          const fileUrl = storage.getFileView(bucketId, fileId);

          // Fetch the GeoJSON content
          const geoJsonResponse = await fetch(fileUrl);

          if (!geoJsonResponse.ok) {
            // If SDK URL fails, try direct URL with better error handling
            const directResponse = await fetch(claim.value_raw, {
              method: "GET",
              headers: {
                Accept: "application/json",
              },
              mode: "cors",
              credentials: "omit",
            });

            if (!directResponse.ok) {
              return null;
            }

            const geoJsonData = await directResponse.json();
            coordinates = parseGeoJsonCoordinates(geoJsonData, claim.$id);
          } else {
            const geoJsonData = await geoJsonResponse.json();
            coordinates = parseGeoJsonCoordinates(geoJsonData, claim.$id);
          }
        } catch (storageError: any) {
          // Fallback: try direct fetch
          try {
            const directResponse = await fetch(claim.value_raw);
            if (!directResponse.ok) {
              return null;
            }
            const geoJsonData = await directResponse.json();
            coordinates = parseGeoJsonCoordinates(geoJsonData, claim.$id);
          } catch (directError: any) {
            return null;
          }
        }
      } else {
        // Try direct fetch as fallback
        try {
          const geoJsonResponse = await fetch(claim.value_raw);
          if (!geoJsonResponse.ok) {
            return null;
          }
          const geoJsonData = await geoJsonResponse.json();
          coordinates = parseGeoJsonCoordinates(geoJsonData, claim.$id);
        } catch (fetchError: any) {
          return null;
        }
      }
    } else if (claim.value_raw) {
      // Try to parse as direct JSON
      coordinates = JSON.parse(claim.value_raw);
    } else {
      return null;
    }

    // Validate coordinates
    if (
      !coordinates ||
      !Array.isArray(coordinates) ||
      coordinates.length === 0
    ) {
      return null;
    }

    return coordinates;
  } catch (error) {
    return null;
  }
}

/**
 * Fetch polygon data for map visualization
 */
export async function fetchPolygons(): Promise<PolygonData[]> {
  // Check memory cache first
  const now = Date.now();
  if (polygonCache && now - polygonCacheTime < POLYGON_CACHE_DURATION) {
    return polygonCache;
  }

  // Check localStorage cache
  if (typeof window !== "undefined") {
    try {
      const cachedData = localStorage.getItem(LOCALSTORAGE_KEY);
      const cachedTime = localStorage.getItem(LOCALSTORAGE_TIME_KEY);

      if (cachedData && cachedTime) {
        const cacheAge = now - parseInt(cachedTime);
        if (cacheAge < POLYGON_CACHE_DURATION) {
          const parsedData = JSON.parse(cachedData);
          polygonCache = parsedData;
          polygonCacheTime = parseInt(cachedTime);
          console.log("✅ Polígonos cargados desde caché local");
          return parsedData;
        }
      }
    } catch (e) {
      console.warn("Error leyendo caché de polígonos:", e);
    }
  }

  try {
    // Fetch all claims with datatype 'polygon'
    const response = await databases.listDocuments<Claim>(
      DATABASE_ID,
      COLLECTIONS.CLAIMS,
      [
        Query.equal("datatype", "polygon"),
        Query.limit(500), // Increased limit to capture all municipalities
      ],
    );

    // Fetch administrative levels lookup map
    const adminLevels = await fetchAdministrativeLevels();

    const polygons: PolygonData[] = [];
    let processed = 0;

    for (const claim of response.documents) {
      processed++;

      if (claim.value_raw && claim.subject) {
        try {
          const coordinates = await fetchPolygonCoordinates(claim);

          // Validate coordinates
          if (!coordinates) {
            continue;
          }

          const entityId =
            typeof claim.subject === "string"
              ? claim.subject
              : claim.subject.$id;
          const administrativeLevel = adminLevels.get(entityId) || 0;

          // Ensure coordinates are properly structured and serializable
          // Deep clone to avoid any reference issues
          const cleanCoordinates = JSON.parse(JSON.stringify(coordinates));

          polygons.push({
            entityId,
            entityLabel:
              typeof claim.subject === "string"
                ? ""
                : claim.subject.label || "",
            coordinates: cleanCoordinates,
            administrativeLevel,
          });
        } catch (parseError: any) {
          // Skip polygons that fail to parse
        }
      }
    }

    // If we have polygons without labels, fetch entity labels
    const polygonsNeedingLabels = polygons.filter(
      (p) => !p.entityLabel || p.entityLabel === "",
    );
    if (polygonsNeedingLabels.length > 0) {
      try {
        // Fetch entities in batches to get their labels
        const entityIds = [
          ...new Set(polygonsNeedingLabels.map((p) => p.entityId)),
        ];
        const entityLabels = new Map<string, string>();

        // Fetch in batches of 25
        for (let i = 0; i < entityIds.length; i += 25) {
          const batch = entityIds.slice(i, i + 25);
          const entitiesResponse = await databases.listDocuments<Entity>(
            DATABASE_ID,
            COLLECTIONS.ENTITIES,
            [Query.equal("$id", batch), Query.limit(25)],
          );

          for (const entity of entitiesResponse.documents) {
            entityLabels.set(entity.$id, entity.label || "");
          }
        }

        // Update polygons with fetched labels
        for (const polygon of polygons) {
          if (!polygon.entityLabel || polygon.entityLabel === "") {
            const label = entityLabels.get(polygon.entityId);
            if (label) {
              polygon.entityLabel = label;
            }
          }
        }
      } catch (error) {
        console.warn("Error fetching entity labels:", error);
      }
    }

    // Cache the results in memory and localStorage
    polygonCache = polygons;
    polygonCacheTime = Date.now();

    // Save to localStorage for persistence
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(polygons));
        localStorage.setItem(
          LOCALSTORAGE_TIME_KEY,
          polygonCacheTime.toString(),
        );
        console.log(`✅ ${polygons.length} polígonos almacenados en caché`);
      } catch (e) {
        console.warn(
          "No se pudo guardar en localStorage (espacio insuficiente?):",
          e,
        );
      }
    }

    return polygons;
  } catch (error) {
    console.error("Error fetching polygons:", error);
    throw error;
  }
}

/**
 * Find municipality by coordinates using polygon intersection
 * Optimized with geographic bounds pre-filtering
 */
export async function findMunicipalityByCoordinates(
  lat: number,
  lon: number,
): Promise<Entity | null> {
  const startTime = performance.now();

  try {
    const polygons = await fetchPolygons();

    // Bolivia bounds: approximately lat: -23 to -9, lon: -70 to -57
    // Quick validation
    if (lat < -23 || lat > -9 || lon < -70 || lon > -57) {
      console.warn("Coordenadas fuera de Bolivia:", { lat, lon });
      // No retornar null, intentar de todos modos
    }

    // Pre-calcular bounds para todos los polígonos (con caché simple)
    const polygonsWithBounds = polygons.map((p) => ({
      ...p,
      bounds: getPolygonBounds(p.coordinates),
    }));

    // Pre-filter polygons by bounding box for faster checks
    const candidatePolygons = polygonsWithBounds.filter((polygon) => {
      const bounds = polygon.bounds;
      return (
        lat >= bounds.minLat &&
        lat <= bounds.maxLat &&
        lon >= bounds.minLon &&
        lon <= bounds.maxLon
      );
    });

    console.log(
      `🔍 Filtrados ${polygons.length} → ${candidatePolygons.length} candidatos`,
    );

    // Ordenar candidatos por área (más pequeños primero = más precisos)
    candidatePolygons.sort((a, b) => {
      const areaA =
        (a.bounds.maxLat - a.bounds.minLat) *
        (a.bounds.maxLon - a.bounds.minLon);
      const areaB =
        (b.bounds.maxLat - b.bounds.minLat) *
        (b.bounds.maxLon - b.bounds.minLon);
      return areaA - areaB;
    });

    // Check each candidate polygon to see if the point is inside
    for (const polygon of candidatePolygons) {
      if (isPointInPolygon([lon, lat], polygon.coordinates)) {
        const elapsed = performance.now() - startTime;
        console.log(`✅ Municipio encontrado en ${elapsed.toFixed(0)}ms`);

        // Fetch the full entity details
        const entity = await databases.getDocument<Entity>(
          DATABASE_ID,
          COLLECTIONS.ENTITIES,
          polygon.entityId,
        );
        return entity;
      }
    }

    const elapsed = performance.now() - startTime;
    console.log(`❌ No se encontró municipio (${elapsed.toFixed(0)}ms)`);
    return null;
  } catch (error) {
    console.error("Error finding municipality:", error);
    return null;
  }
}

/**
 * Calculate bounding box for a polygon
 */
function getPolygonBounds(coordinates: number[][][]): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  const ring = coordinates[0];
  for (const [lon, lat] of ring) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
  }

  return { minLat, maxLat, minLon, maxLon };
}

/**
 * Point-in-polygon algorithm (ray casting)
 * @param point [longitude, latitude]
 * @param polygon GeoJSON polygon coordinates
 */
function isPointInPolygon(point: number[], polygon: number[][][]): boolean {
  const [x, y] = point;

  // Check the outer ring (first ring in the polygon)
  const ring = polygon[0];
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0],
      yi = ring[i][1];
    const xj = ring[j][0],
      yj = ring[j][1];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}
