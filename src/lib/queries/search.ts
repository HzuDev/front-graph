import { databases, DATABASE_ID, COLLECTIONS, Query } from "../appwrite";
import type { Entity, Claim } from "./types";
import { PROPERTY_IDS, DEPARTMENT_IDS, CACHE_DURATION } from "./constants";

// Simple in-memory cache for search results (expires after CACHE_DURATION)
const searchCache = new Map<
  string,
  { data: Entity[]; timestamp: number; total: number }
>();

/**
 * Calculate relevance score for search results
 */
function calculateSearchScore(
  entity: Entity,
  searchKey: string,
  searchWords: string[],
): number {
  const label = (entity.label || "").toLowerCase();
  const description = (entity.description || "").toLowerCase();
  const aliases = (entity.aliases || []).map((a: string) => a.toLowerCase());

  let score = 0;

  // Exact match (highest score)
  if (label === searchKey) score += 1000;

  // Starts with (high score)
  if (label.startsWith(searchKey)) score += 500;

  // Contains in label (medium score)
  if (label.includes(searchKey)) score += 100;

  // Contains in aliases (medium score)
  if (aliases.some((a) => a.includes(searchKey))) score += 80;

  // Contains in description (low score)
  if (description.includes(searchKey)) score += 50;

  // Multi-word match (all words present)
  if (searchWords.length > 1) {
    const allWordsMatch = searchWords.every(
      (word) =>
        label.includes(word) ||
        description.includes(word) ||
        aliases.some((a) => a.includes(word)),
    );
    if (allWordsMatch) score += 200;
  }

  return score;
}

/**
 * Perform client-side search and filtering on entities
 */
async function performClientSideSearch(
  searchKey: string,
  searchWords: string[],
): Promise<Entity[]> {
  // Fetch a reasonable batch of entities
  const batchSize = 100;
  const maxBatches = 10; // Max 1000 entities
  const allEntities: Entity[] = [];

  for (let i = 0; i < maxBatches; i++) {
    const batchResponse = await databases.listDocuments<Entity>(
      DATABASE_ID,
      COLLECTIONS.ENTITIES,
      [
        Query.limit(batchSize),
        Query.offset(i * batchSize),
        Query.orderDesc("$createdAt"),
      ],
    );

    allEntities.push(...batchResponse.documents);

    // Stop if we got fewer results than requested
    if (batchResponse.documents.length < batchSize) break;
  }

  // Filter and score results
  return allEntities
    .map((doc) => ({
      doc,
      score: calculateSearchScore(doc, searchKey, searchWords),
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((result) => result.doc);
}

/**
 * Fetch entities with optional search and pagination
 * OPTIMIZED: Uses cache and limits to 2000 entities max for performance
 */
export async function fetchEntities(
  options: {
    search?: string;
    limit?: number;
    offset?: number;
  } = {},
) {
  const { search, limit = 25, offset = 0 } = options;

  try {
    // Build queries array
    const queries = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc("$createdAt"),
    ];

    // If search is provided, use hybrid approach
    if (search) {
      const searchKey = search.toLowerCase().trim();

      // Check cache first
      const cached = searchCache.get(searchKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(
          "fetchEntities: returning cached results:",
          cached.data.length,
        );
        return {
          documents: cached.data.slice(offset, offset + limit),
          total: cached.total,
        };
      }

      let searchResults: Entity[] = [];

      // Try Appwrite's native search first (if fulltext index exists)
      try {
        const searchResponse = await databases.listDocuments<Entity>(
          DATABASE_ID,
          COLLECTIONS.ENTITIES,
          [
            Query.search("label", search),
            Query.limit(100),
            Query.orderDesc("$createdAt"),
          ],
        );

        console.log(
          "fetchEntities: Appwrite search returned:",
          searchResponse.documents.length,
        );
        if (searchResponse.documents.length > 0) {
          searchResults = searchResponse.documents;
        }
      } catch (searchError: any) {
        console.log(
          "fetchEntities: Appwrite search failed, falling back to client-side",
        );
        // Fallback to client-side filtering
      }

      // If Appwrite search didn't work or returned no results, use client-side filtering
      if (searchResults.length === 0) {
        console.log("fetchEntities: performing client-side search");
        const searchWords = searchKey.split(/\s+/).filter((w) => w.length > 0);
        searchResults = await performClientSideSearch(searchKey, searchWords);
        console.log(
          "fetchEntities: client-side search returned:",
          searchResults.length,
        );
      }

      // Cache the results
      searchCache.set(searchKey, {
        data: searchResults,
        timestamp: Date.now(),
        total: searchResults.length,
      });

      // Clean old cache entries
      if (searchCache.size > 50) {
        const oldestKey = Array.from(searchCache.entries()).sort(
          (a, b) => a[1].timestamp - b[1].timestamp,
        )[0][0];
        searchCache.delete(oldestKey);
      }

      console.log(
        "fetchEntities: returning",
        searchResults.slice(offset, offset + limit).length,
        "of",
        searchResults.length,
        "total results",
      );
      return {
        documents: searchResults.slice(offset, offset + limit),
        total: searchResults.length,
      };
    }

    // If no search, just fetch normally with pagination
    const response = await databases.listDocuments<Entity>(
      DATABASE_ID,
      COLLECTIONS.ENTITIES,
      queries,
    );

    return {
      documents: response.documents,
      total: response.total,
    };
  } catch (error: any) {
    console.error("Error fetching entities:", error);
    throw error;
  }
}

/**
 * Fetch entities with advanced filtering by type and department
 */
export async function fetchEntitiesFiltered(
  options: {
    search?: string;
    entityType?: string; // e.g., "Municipio", "Persona"
    department?: string; // e.g., "La Paz", "Santa Cruz"
    limit?: number;
    offset?: number;
  } = {},
) {
  const { search, entityType, department, limit = 25, offset = 0 } = options;

  try {
    let filteredIds: string[] | null = null;

    // Apply type filter
    if (entityType && entityType !== "Todas") {
      const typeIds = await getEntitiesByType(entityType);
      filteredIds = typeIds;
    }

    // Apply department filter
    if (department && department !== "Todos") {
      const deptIds = await getEntitiesByDepartment(department);

      if (filteredIds) {
        // Intersect with existing filtered IDs
        filteredIds = filteredIds.filter((id) => deptIds.includes(id));
      } else {
        filteredIds = deptIds;
      }
    }

    // If we have filtered IDs, fetch those specific entities
    if (filteredIds && filteredIds.length > 0) {
      const entities: Entity[] = [];

      // Fetch in batches (Appwrite has a limit on query size)
      const batchSize = 25;
      for (let i = 0; i < filteredIds.length && i < 100; i += batchSize) {
        const batch = filteredIds.slice(i, i + batchSize);
        const response = await databases.listDocuments<Entity>(
          DATABASE_ID,
          COLLECTIONS.ENTITIES,
          [Query.equal("$id", batch), Query.limit(batchSize)],
        );
        entities.push(...response.documents);
      }

      // Apply search filter if provided
      let results = entities;
      if (search) {
        const searchLower = search.toLowerCase();
        results = entities.filter(
          (entity) =>
            entity.label?.toLowerCase().includes(searchLower) ||
            entity.description?.toLowerCase().includes(searchLower) ||
            entity.aliases?.some((a) => a.toLowerCase().includes(searchLower)),
        );
      }

      return {
        documents: results.slice(offset, offset + limit),
        total: results.length,
      };
    }

    const result = await fetchEntities({ search, limit, offset });

    return result;
  } catch (error) {
    console.error("Error in fetchEntitiesFiltered:", error);
    return { documents: [], total: 0 };
  }
}

/**
 * Get all entity IDs that are of a specific type
 * @param typeName - The name of the type (e.g., "Municipio", "Persona", "Candidato")
 * @returns Array of entity IDs that are instances of the given type
 */
export async function getEntitiesByType(typeName: string): Promise<string[]> {
  try {
    // First, find the type entity by name
    const typeEntities = await databases.listDocuments<Entity>(
      DATABASE_ID,
      COLLECTIONS.ENTITIES,
      [Query.equal("label", typeName), Query.limit(10)],
    );

    if (typeEntities.documents.length === 0) {
      return [];
    }

    const typeId = typeEntities.documents[0].$id;

    // Find all claims where property="es instancia de" and value_relation=typeId
    const claims = await databases.listDocuments<Claim>(
      DATABASE_ID,
      COLLECTIONS.CLAIMS,
      [
        Query.equal("property", PROPERTY_IDS.INSTANCE_OF),
        Query.equal("value_relation", typeId),
        Query.limit(1000),
      ],
    );

    return claims.documents
      .map((claim) => claim.subject?.$id || (claim.subject as any as string))
      .filter(Boolean);
  } catch (error) {
    console.error(`Error getting entities by type "${typeName}":`, error);
    return [];
  }
}

/**
 * Get all entity IDs that are part of a specific department
 * @param departmentName - The name of the department
 * @returns Array of entity IDs that are part of the given department
 */
export async function getEntitiesByDepartment(
  departmentName: string,
): Promise<string[]> {
  try {
    const departmentId =
      DEPARTMENT_IDS[departmentName as keyof typeof DEPARTMENT_IDS];

    if (!departmentId) {
      return [];
    }

    // Find all claims where property="es parte de" and value_relation=departmentId
    const claims = await databases.listDocuments<Claim>(
      DATABASE_ID,
      COLLECTIONS.CLAIMS,
      [
        Query.equal("property", PROPERTY_IDS.PART_OF),
        Query.equal("value_relation", departmentId),
        Query.limit(1000),
      ],
    );

    return claims.documents
      .map((claim) => claim.subject?.$id || (claim.subject as any as string))
      .filter(Boolean);
  } catch (error) {
    console.error(
      `Error getting entities by department "${departmentName}":`,
      error,
    );
    return [];
  }
}
