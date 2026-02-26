import { databases, DATABASE_ID, COLLECTIONS, Query } from '../appwrite';
import type { Entity, Claim } from './types';
import { PROPERTY_IDS, DEPARTMENT_IDS, CACHE_DURATION } from './constants';

const QUICK_SEARCH_TYPE_IDS = {
  POLITICAL_PARTY: '6985697dce1378ac55e9',
  SURVEY_HOUSE: '69857dc12230ff9c37fd',
};

const QUICK_SEARCH_INSTITUTION_LABELS = [
  'Organo Electoral Plurinacional',
  'Ministerio',
  'Asamblea Legislativa Plurinacional',
];

const searchCache = new Map<
  string,
  { data: Entity[]; timestamp: number; total: number }
>();

const quickSearchCache = new Map<
  string,
  { data: Entity[]; timestamp: number; total: number }
>();

const quickSearchTypeCache = new Map<
  string,
  { data: Entity[]; timestamp: number }
>();

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function calculateQuickSearchScore(entity: Entity, searchKey: string): number {
  const label = normalizeText(entity.label || '');
  const description = normalizeText(entity.description || '');
  const aliases = (entity.aliases || []).map((a: string) => normalizeText(a));

  let score = 0;

  if (label === searchKey) score += 1000;
  if (label.startsWith(searchKey)) score += 500;
  if (label.includes(searchKey)) score += 100;
  if (aliases.some((a) => a.includes(searchKey))) score += 80;
  if (description.includes(searchKey)) score += 50;

  const searchWords = searchKey.split(/\s+/).filter((w) => w.length > 0);
  if (searchWords.length > 1) {
    const allWordsMatch = searchWords.every(
      (word) =>
        label.includes(word) ||
        description.includes(word) ||
        aliases.some((a) => a.includes(word))
    );
    if (allWordsMatch) score += 200;
  }

  return score;
}

async function fetchEntitiesByTypeId(typeId: string): Promise<Entity[]> {
  const cached = quickSearchTypeCache.get(typeId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const LIMIT = 500;
  let offset = 0;
  let keepFetching = true;
  const subjectIds: string[] = [];

  while (keepFetching) {
    const response = await databases.listDocuments<Claim>(
      DATABASE_ID,
      COLLECTIONS.CLAIMS,
      [
        Query.equal('property', PROPERTY_IDS.INSTANCE_OF),
        Query.equal('value_relation', typeId),
        Query.limit(LIMIT),
        Query.offset(offset),
      ]
    );

    response.documents.forEach((claim) => {
      const id = claim.subject?.$id || (claim.subject as unknown as string);
      if (id) subjectIds.push(id);
    });

    if (response.documents.length < LIMIT) {
      keepFetching = false;
    } else {
      offset += LIMIT;
    }
  }

  if (subjectIds.length === 0) {
    quickSearchTypeCache.set(typeId, { data: [], timestamp: Date.now() });
    return [];
  }

  const entities: Entity[] = [];
  const batchSize = 50;
  for (let i = 0; i < subjectIds.length; i += batchSize) {
    const batch = subjectIds.slice(i, i + batchSize);
    const response = await databases.listDocuments<Entity>(
      DATABASE_ID,
      COLLECTIONS.ENTITIES,
      [Query.equal('$id', batch), Query.limit(batchSize)]
    );
    entities.push(...response.documents);
  }

  quickSearchTypeCache.set(typeId, { data: entities, timestamp: Date.now() });
  return entities;
}

async function fetchEntitiesByLabels(labels: string[]): Promise<Entity[]> {
  if (labels.length === 0) return [];
  const response = await databases.listDocuments<Entity>(
    DATABASE_ID,
    COLLECTIONS.ENTITIES,
    [Query.equal('label', labels), Query.limit(100)]
  );
  return response.documents;
}

/**
 * Calculate relevance score for search results
 */
function calculateSearchScore(
  entity: Entity,
  searchKey: string,
  searchWords: string[]
): number {
  const label = (entity.label || '').toLowerCase();
  const description = (entity.description || '').toLowerCase();
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
        aliases.some((a) => a.includes(word))
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
  searchWords: string[]
): Promise<Entity[]> {
  const batchSize = 100;
  const maxBatches = 10;
  const allEntities: Entity[] = [];

  for (let i = 0; i < maxBatches; i++) {
    const batchResponse = await databases.listDocuments<Entity>(
      DATABASE_ID,
      COLLECTIONS.ENTITIES,
      [
        Query.limit(batchSize),
        Query.offset(i * batchSize),
        Query.orderDesc('$createdAt'),
      ]
    );

    allEntities.push(...batchResponse.documents);

    if (batchResponse.documents.length < batchSize) break;
  }

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
  } = {}
) {
  const { search, limit = 25, offset = 0 } = options;

  try {
    const queries = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc('$createdAt'),
    ];

    if (search) {
      const searchKey = search.toLowerCase().trim();

      const cached = searchCache.get(searchKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(
          'fetchEntities: returning cached results:',
          cached.data.length
        );
        return {
          documents: cached.data.slice(offset, offset + limit),
          total: cached.total,
        };
      }

      let searchResults: Entity[] = [];

      try {
        const searchResponse = await databases.listDocuments<Entity>(
          DATABASE_ID,
          COLLECTIONS.ENTITIES,
          [
            Query.search('label', search),
            Query.limit(100),
            Query.orderDesc('$createdAt'),
          ]
        );

        console.log(
          'fetchEntities: Appwrite search returned:',
          searchResponse.documents.length
        );
        if (searchResponse.documents.length > 0) {
          searchResults = searchResponse.documents;
        }
      } catch {
        console.log(
          'fetchEntities: Appwrite search failed, falling back to client-side'
        );
      }

      if (searchResults.length === 0) {
        console.log('fetchEntities: performing client-side search');
        const searchWords = searchKey.split(/\s+/).filter((w) => w.length > 0);
        searchResults = await performClientSideSearch(searchKey, searchWords);
        console.log(
          'fetchEntities: client-side search returned:',
          searchResults.length
        );
      }

      searchCache.set(searchKey, {
        data: searchResults,
        timestamp: Date.now(),
        total: searchResults.length,
      });

      if (searchCache.size > 50) {
        const oldestKey = Array.from(searchCache.entries()).sort(
          (a, b) => a[1].timestamp - b[1].timestamp
        )[0][0];
        searchCache.delete(oldestKey);
      }

      console.log(
        'fetchEntities: returning',
        searchResults.slice(offset, offset + limit).length,
        'of',
        searchResults.length,
        'total results'
      );
      return {
        documents: searchResults.slice(offset, offset + limit),
        total: searchResults.length,
      };
    }

    const response = await databases.listDocuments<Entity>(
      DATABASE_ID,
      COLLECTIONS.ENTITIES,
      queries
    );

    return {
      documents: response.documents,
      total: response.total,
    };
  } catch (error) {
    console.error('Error fetching entities:', error);
    throw error;
  }
}

export async function fetchQuickSearchEntities(options: {
  search: string;
  limit?: number;
}) {
  const { search, limit = 5 } = options;
  const searchKey = normalizeText(search || '').trim();

  if (!searchKey) {
    return { documents: [], total: 0 };
  }

  const cached = quickSearchCache.get(searchKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return {
      documents: cached.data.slice(0, limit),
      total: cached.total,
    };
  }

  const [authorities, parties, surveyHouses, institutions] = await Promise.all([
    (await import('./authorities')).fetchAuthorities({ search, limit: 25 }),
    fetchEntitiesByTypeId(QUICK_SEARCH_TYPE_IDS.POLITICAL_PARTY),
    fetchEntitiesByTypeId(QUICK_SEARCH_TYPE_IDS.SURVEY_HOUSE),
    fetchEntitiesByLabels(QUICK_SEARCH_INSTITUTION_LABELS),
  ]);

  const combined = new Map<string, Entity>();
  authorities.documents.forEach((doc) => combined.set(doc.$id, doc));

  const searchKeyNormalized = normalizeText(search || '').trim();
  const addIfMatches = (doc: Entity) => {
    if (calculateQuickSearchScore(doc, searchKeyNormalized) > 0) {
      combined.set(doc.$id, doc);
    }
  };

  parties.forEach(addIfMatches);
  surveyHouses.forEach(addIfMatches);
  institutions.forEach(addIfMatches);

  const scored = Array.from(combined.values())
    .map((entity) => ({
      entity,
      score: calculateQuickSearchScore(entity, searchKeyNormalized),
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((result) => result.entity);

  quickSearchCache.set(searchKey, {
    data: scored,
    timestamp: Date.now(),
    total: scored.length,
  });

  return {
    documents: scored.slice(0, limit),
    total: scored.length,
  };
}

/**
 * Fetch entities with advanced filtering by type and department
 */
export async function fetchEntitiesFiltered(
  options: {
    search?: string;
    entityType?: string;
    department?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { search, entityType, department, limit = 25, offset = 0 } = options;

  console.log('[fetchEntitiesFiltered] Filtros aplicados:', {
    search,
    entityType,
    department,
    limit,
    offset,
  });

  try {
    let filteredIds: string[] | null = null;

    if (entityType && entityType !== 'Todas') {
      console.log(
        `[fetchEntitiesFiltered] Aplicando filtro de tipo: "${entityType}"`
      );
      const typeIds = await getEntitiesByType(entityType);
      console.log(
        `[fetchEntitiesFiltered] IDs encontrados por tipo:`,
        typeIds.length
      );
      filteredIds = typeIds;
    }

    if (department && department !== 'Todos') {
      console.log(
        `[fetchEntitiesFiltered] Aplicando filtro de departamento: "${department}"`
      );
      const deptIds = await getEntitiesByDepartment(department);
      console.log(
        `[fetchEntitiesFiltered] IDs encontrados por departamento:`,
        deptIds.length
      );

      if (filteredIds) {
        const beforeIntersection = filteredIds.length;
        filteredIds = filteredIds.filter((id) => deptIds.includes(id));
        console.log(
          `[fetchEntitiesFiltered] IDs después de intersección tipo+departamento: ${filteredIds.length} (antes: ${beforeIntersection})`
        );
      } else {
        filteredIds = deptIds;
      }
    }

    if (filteredIds && filteredIds.length > 0) {
      console.log(
        `[fetchEntitiesFiltered] Obteniendo entidades para ${filteredIds.length} IDs filtrados`
      );
      const entities: Entity[] = [];

      const batchSize = 25;
      const maxIds = Math.min(filteredIds.length, 100);
      for (let i = 0; i < maxIds; i += batchSize) {
        const batch = filteredIds.slice(i, i + batchSize);
        const response = await databases.listDocuments<Entity>(
          DATABASE_ID,
          COLLECTIONS.ENTITIES,
          [Query.equal('$id', batch), Query.limit(batchSize)]
        );
        entities.push(...response.documents);
      }

      console.log(
        `[fetchEntitiesFiltered] Entidades obtenidas:`,
        entities.length
      );

      let results = entities;
      if (search) {
        console.log(
          `[fetchEntitiesFiltered] Aplicando búsqueda de texto: "${search}"`
        );
        const searchLower = search.toLowerCase();
        results = entities.filter(
          (entity) =>
            entity.label?.toLowerCase().includes(searchLower) ||
            entity.description?.toLowerCase().includes(searchLower) ||
            entity.aliases?.some((a) => a.toLowerCase().includes(searchLower))
        );
        console.log(
          `[fetchEntitiesFiltered] Resultados después de búsqueda:`,
          results.length
        );
      }

      console.log(
        `[fetchEntitiesFiltered] Retornando ${results.slice(offset, offset + limit).length} de ${results.length} resultados totales`
      );
      return {
        documents: results.slice(offset, offset + limit),
        total: results.length,
      };
    }

    console.log(
      '[fetchEntitiesFiltered] No hay filtros aplicados, usando fetchEntities estándar'
    );
    const result = await fetchEntities({ search, limit, offset });
    console.log(
      `[fetchEntitiesFiltered] Resultados de fetchEntities:`,
      result.documents.length,
      'de',
      result.total
    );

    return result;
  } catch (error) {
    console.error('[fetchEntitiesFiltered] Error:', error);
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
    console.log(`[getEntitiesByType] Buscando tipo: "${typeName}"`);

    const typeEntities = await databases.listDocuments<Entity>(
      DATABASE_ID,
      COLLECTIONS.ENTITIES,
      [Query.equal('label', typeName), Query.limit(10)]
    );

    console.log(
      `[getEntitiesByType] Entidades encontradas con label "${typeName}":`,
      typeEntities.documents.length
    );

    if (typeEntities.documents.length === 0) {
      console.warn(
        `[getEntitiesByType] No se encontró ninguna entidad con label exacto "${typeName}"`
      );
      return [];
    }

    const typeId = typeEntities.documents[0].$id;
    console.log(`[getEntitiesByType] ID del tipo encontrado: ${typeId}`);

    const claims = await databases.listDocuments<Claim>(
      DATABASE_ID,
      COLLECTIONS.CLAIMS,
      [
        Query.equal('property', PROPERTY_IDS.INSTANCE_OF),
        Query.equal('value_relation', typeId),
        Query.limit(1000),
      ]
    );

    console.log(
      `[getEntitiesByType] Claims encontrados para tipo "${typeName}":`,
      claims.documents.length
    );

    const entityIds = claims.documents
      .map(
        (claim) => claim.subject?.$id || (claim.subject as unknown as string)
      )
      .filter(Boolean);

    console.log(
      `[getEntitiesByType] IDs de entidades extraídos:`,
      entityIds.length
    );

    return entityIds;
  } catch (error) {
    console.error(
      `[getEntitiesByType] Error getting entities by type "${typeName}":`,
      error
    );
    return [];
  }
}

/**
 * Get all entity IDs that are part of a specific department
 * @param departmentName - The name of the department
 * @returns Array of entity IDs that are part of the given department
 */
export async function getEntitiesByDepartment(
  departmentName: string
): Promise<string[]> {
  try {
    console.log(
      `[getEntitiesByDepartment] Buscando departamento: "${departmentName}"`
    );

    const departmentId =
      DEPARTMENT_IDS[departmentName as keyof typeof DEPARTMENT_IDS];

    if (!departmentId) {
      console.warn(
        `[getEntitiesByDepartment] No se encontró ID para departamento "${departmentName}"`
      );
      console.log(
        `[getEntitiesByDepartment] Departamentos disponibles:`,
        Object.keys(DEPARTMENT_IDS)
      );
      return [];
    }

    console.log(
      `[getEntitiesByDepartment] ID del departamento: ${departmentId}`
    );

    const claims = await databases.listDocuments<Claim>(
      DATABASE_ID,
      COLLECTIONS.CLAIMS,
      [
        Query.equal('property', PROPERTY_IDS.PART_OF),
        Query.equal('value_relation', departmentId),
        Query.limit(1000),
      ]
    );

    console.log(
      `[getEntitiesByDepartment] Claims encontrados para departamento "${departmentName}":`,
      claims.documents.length
    );

    const entityIds = claims.documents
      .map(
        (claim) => claim.subject?.$id || (claim.subject as unknown as string)
      )
      .filter(Boolean);

    console.log(
      `[getEntitiesByDepartment] IDs de entidades extraídos:`,
      entityIds.length
    );

    return entityIds;
  } catch (error) {
    console.error(
      `[getEntitiesByDepartment] Error getting entities by department "${departmentName}":`,
      error
    );
    return [];
  }
}
