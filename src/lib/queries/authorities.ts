import { databases, DATABASE_ID, COLLECTIONS, Query } from '../appwrite';
import type { Entity, Authority, Claim, Qualifier } from './types';
import { PROPERTY_IDS } from './constants';

type AuthorityRole = 'Alcalde' | 'Gobernador' | 'Concejal' | 'Asambleísta';

interface AuthoritiesByMunicipality {
  alcalde: Authority[];
  gobernador: Authority[];
  concejales: Authority[];
  asambleistas: Authority[];
}

const VALID_ROLES = [
  'Alcalde',
  'Gobernador',
  'Concejal',
  'Concejales Municipales',
  'Asambleísta',
  'Asambleista',
  'Asambleístas Departamentales por Territorio',
];

const QUALIFIER_TERRITORY = PROPERTY_IDS.TERRITORY;
const CANDIDATE_PROPERTY = PROPERTY_IDS.CANDIDATO_POLITICO;

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

// Cache for role IDs
let roleIdsCache: Record<AuthorityRole, string> | null = null;
let allRoleIdsCache: string[] | null = null;
let roleIdToTypeCache: Map<string, AuthorityRole> | null = null;

/**
 * Dynamically fetch the Entity IDs for the political roles.
 * Returns: { Alcalde: 'id1', Gobernador: 'id2', ... } and caches all role IDs
 */
async function getRoleIds(): Promise<Record<AuthorityRole, string>> {
  if (roleIdsCache) return roleIdsCache;

  try {
    const response = await databases.listDocuments<Entity>(
      DATABASE_ID,
      COLLECTIONS.ENTITIES,
      [Query.equal('label', VALID_ROLES), Query.limit(15)]
    );

    const roles: Partial<Record<AuthorityRole, string>> = {};
    const allIds: string[] = [];
    const roleIdToType = new Map<string, AuthorityRole>();

    response.documents.forEach((doc) => {
      allIds.push(doc.$id);

      if (doc.label === 'Alcalde') {
        roles.Alcalde = doc.$id;
        roleIdToType.set(doc.$id, 'Alcalde');
      }
      if (doc.label === 'Gobernador') {
        roles.Gobernador = doc.$id;
        roleIdToType.set(doc.$id, 'Gobernador');
      }
      if (doc.label === 'Concejal' || doc.label === 'Concejales Municipales') {
        if (!roles.Concejal || doc.label === 'Concejales Municipales') {
          roles.Concejal = doc.$id;
        }
        roleIdToType.set(doc.$id, 'Concejal');
      }
      if (
        doc.label === 'Asambleísta' ||
        doc.label === 'Asambleista' ||
        doc.label === 'Asambleístas Departamentales por Territorio'
      ) {
        if (
          !roles.Asambleísta ||
          doc.label === 'Asambleístas Departamentales por Territorio'
        ) {
          roles.Asambleísta = doc.$id;
        }
        roleIdToType.set(doc.$id, 'Asambleísta');
      }
    });

    roleIdsCache = roles as Record<AuthorityRole, string>;
    allRoleIdsCache = allIds;
    roleIdToTypeCache = roleIdToType;

    return roleIdsCache;
  } catch (error) {
    console.error('Error fetching role IDs:', error);
    throw error;
  }
}

/**
 * Get all role IDs (for filtering claims by any valid authority role)
 */
async function getAllRoleIds(): Promise<string[]> {
  if (allRoleIdsCache) return allRoleIdsCache;
  await getRoleIds(); // This will populate allRoleIdsCache
  return allRoleIdsCache || [];
}

/**
 * Get the role type for a given role ID — synchronous after cache is warm.
 */
function getRoleTypeSync(roleId: string): AuthorityRole | null {
  return roleIdToTypeCache?.get(roleId) ?? null;
}

/**
 * Fetch all candidate claims that have a territory qualifier pointing to `territory`.
 * Pages through qualifiers, then batch-fetches matching claims in parallel.
 * `allRoleIds` must be pre-fetched (pass result of getAllRoleIds()).
 */
async function getCandidateClaimsForTerritory(
  territory: string,
  allRoleIds: string[]
): Promise<Claim[]> {
  const claimIds: string[] = [];
  const pageSize = 500;
  let offset = 0;

  while (true) {
    const qualifiers = await databases.listDocuments<Qualifier>(
      DATABASE_ID,
      COLLECTIONS.QUALIFIERS,
      [
        Query.equal('property', QUALIFIER_TERRITORY),
        Query.equal('value_relation', territory),
        Query.limit(pageSize),
        Query.offset(offset),
      ]
    );

    if (qualifiers.documents.length === 0) break;

    qualifiers.documents.forEach((q) => {
      const id = typeof q.claim === 'object' ? q.claim.$id : q.claim;
      if (id) claimIds.push(id);
    });

    if (qualifiers.documents.length < pageSize) break;
    offset += pageSize;
  }

  if (claimIds.length === 0) return [];

  const uniqueClaimIds = Array.from(new Set(claimIds));
  const claimBatchSize = 100;
  const batchPromises: Promise<Claim[]>[] = [];

  for (let i = 0; i < uniqueClaimIds.length; i += claimBatchSize) {
    const batch = uniqueClaimIds.slice(i, i + claimBatchSize);
    batchPromises.push(
      databases
        .listDocuments<Claim>(DATABASE_ID, COLLECTIONS.CLAIMS, [
          Query.equal('$id', batch),
          Query.equal('property', CANDIDATE_PROPERTY),
          Query.equal('value_relation', allRoleIds),
          Query.limit(claimBatchSize),
        ])
        .then((r) => r.documents)
    );
  }

  const results = await Promise.all(batchPromises);
  return results.flat();
}

/**
 * Fetch entities that have one of the valid authority roles.
 * Supports search and pagination.
 */
export async function fetchAuthorities(
  options: { search?: string; limit?: number; offset?: number } = {}
): Promise<{ documents: Entity[]; total: number }> {
  const { search, limit = 25, offset = 0 } = options;

  try {
    await getRoleIds();
    const validRoleIds = await getAllRoleIds();

    if (validRoleIds.length === 0) {
      return { documents: [], total: 0 };
    }

    if (!search) {
      const roleClaims = await databases.listDocuments<Claim>(
        DATABASE_ID,
        COLLECTIONS.CLAIMS,
        [
          Query.equal('property', PROPERTY_IDS.CANDIDATO_POLITICO),
          Query.equal('value_relation', validRoleIds),
          Query.orderDesc('$createdAt'),
          Query.limit(100),
        ]
      );

      const authorityIds = Array.from(
        new Set(
          roleClaims.documents.map((c) =>
            typeof c.subject === 'object' ? c.subject.$id : c.subject
          )
        )
      );

      const pageIds = authorityIds.slice(offset, offset + limit);

      if (pageIds.length === 0)
        return { documents: [], total: roleClaims.total };

      const response = await databases.listDocuments<Entity>(
        DATABASE_ID,
        COLLECTIONS.ENTITIES,
        [Query.equal('$id', pageIds)]
      );

      return {
        documents: response.documents,
        total: roleClaims.total,
      };
    }

    const searchResponse = await databases.listDocuments<Entity>(
      DATABASE_ID,
      COLLECTIONS.ENTITIES,
      [Query.search('label', search), Query.limit(100)]
    );

    if (searchResponse.documents.length === 0) {
      const fallbackClaims = await databases.listDocuments<Claim>(
        DATABASE_ID,
        COLLECTIONS.CLAIMS,
        [
          Query.equal('property', PROPERTY_IDS.CANDIDATO_POLITICO),
          Query.equal('value_relation', validRoleIds),
          Query.limit(1000),
        ]
      );

      const fallbackIds = Array.from(
        new Set(
          fallbackClaims.documents.map((c) =>
            typeof c.subject === 'object' ? c.subject.$id : c.subject
          )
        )
      );

      if (fallbackIds.length === 0) return { documents: [], total: 0 };

      const batchSize = 50;
      const batches: Promise<Entity[]>[] = [];
      for (let i = 0; i < fallbackIds.length; i += batchSize) {
        const batch = fallbackIds.slice(i, i + batchSize);
        batches.push(
          databases
            .listDocuments<Entity>(DATABASE_ID, COLLECTIONS.ENTITIES, [
              Query.equal('$id', batch),
              Query.limit(batchSize),
            ])
            .then((r) => r.documents)
        );
      }
      const batchResults = await Promise.all(batches);
      const entities = batchResults.flat();

      const searchKey = normalizeText(search);
      const filtered = entities.filter((doc) => {
        const label = normalizeText(doc.label || '');
        const description = normalizeText(doc.description || '');
        const aliases = (doc.aliases || []).map((a) => normalizeText(a));
        return (
          label.includes(searchKey) ||
          description.includes(searchKey) ||
          aliases.some((a) => a.includes(searchKey))
        );
      });

      return {
        documents: filtered.slice(offset, offset + limit),
        total: filtered.length,
      };
    }

    const candidateIds = searchResponse.documents.map((doc) => doc.$id);

    const roleClaims = await databases.listDocuments<Claim>(
      DATABASE_ID,
      COLLECTIONS.CLAIMS,
      [
        Query.equal('subject', candidateIds),
        Query.equal('property', PROPERTY_IDS.CANDIDATO_POLITICO),
        Query.equal('value_relation', validRoleIds),
        Query.limit(100),
      ]
    );

    const authorityIds = new Set(
      roleClaims.documents.map((c) =>
        typeof c.subject === 'object' ? c.subject.$id : c.subject
      )
    );

    const filteredDocuments = searchResponse.documents.filter((doc) =>
      authorityIds.has(doc.$id)
    );

    return {
      documents: filteredDocuments.slice(offset, offset + limit),
      total: filteredDocuments.length,
    };
  } catch (error) {
    console.error('Error fetching authorities:', error);
    return { documents: [], total: 0 };
  }
}

/**
 * Shared helper: given a map of personId → findings and allRoleIds already fetched,
 * fetch entities + parties, then call onBatch and merge into `merged`.
 */
async function fetchAndEmit(
  officialsToFetch: Map<
    string,
    { roleId: string; personId: string; claimId: string }[]
  >,
  merged: AuthoritiesByMunicipality,
  onBatch: (batch: Authority[], replace: boolean) => void,
  isFirst: boolean
): Promise<void> {
  const allIdsToFetch = Array.from(officialsToFetch.keys());
  if (allIdsToFetch.length === 0) {
    if (isFirst) onBatch([], true);
    return;
  }

  const entityBatchSize = 50;
  const entityBatchPromises: Promise<Entity[]>[] = [];
  for (let i = 0; i < allIdsToFetch.length; i += entityBatchSize) {
    const batch = allIdsToFetch.slice(i, i + entityBatchSize);
    entityBatchPromises.push(
      databases
        .listDocuments<Entity>(DATABASE_ID, COLLECTIONS.ENTITIES, [
          Query.equal('$id', batch),
          Query.limit(entityBatchSize),
        ])
        .then((r) => r.documents)
    );
  }

  const allClaimIds = Array.from(officialsToFetch.values()).flatMap((list) =>
    list.map((item) => item.claimId)
  );
  const partyQualPromises: Promise<Qualifier[]>[] = [];
  const qualBatchSize = 100;
  for (let i = 0; i < allClaimIds.length; i += qualBatchSize) {
    const batch = allClaimIds.slice(i, i + qualBatchSize);
    partyQualPromises.push(
      databases
        .listDocuments<Qualifier>(DATABASE_ID, COLLECTIONS.QUALIFIERS, [
          Query.equal('claim', batch),
          Query.equal('property', PROPERTY_IDS.POLITICAL_PARTY),
          Query.limit(qualBatchSize),
        ])
        .then((r) => r.documents)
    );
  }

  const [entityBatchResults, partyQualResults] = await Promise.all([
    Promise.all(entityBatchPromises),
    Promise.all(partyQualPromises),
  ]);

  const entities = entityBatchResults.flat();
  const allPartyQualifiers = partyQualResults.flat();

  const claimToPartyMap = new Map<string, Entity & { color?: string }>();

  if (allPartyQualifiers.length > 0) {
    const partyIdsToFetch = new Set<string>();
    const claimToPartyId = new Map<string, string>();
    allPartyQualifiers.forEach((q) => {
      const claimId = typeof q.claim === 'object' ? q.claim.$id : q.claim;
      const partyId =
        typeof q.value_relation === 'object'
          ? q.value_relation.$id
          : q.value_relation;
      if (claimId && partyId) {
        claimToPartyId.set(claimId, partyId);
        partyIdsToFetch.add(partyId);
      }
    });

    if (partyIdsToFetch.size > 0) {
      const partyIds = Array.from(partyIdsToFetch);
      const partyBatchSize = 50;
      const partyEntityPromises: Promise<Entity[]>[] = [];
      for (let i = 0; i < partyIds.length; i += partyBatchSize) {
        const batch = partyIds.slice(i, i + partyBatchSize);
        partyEntityPromises.push(
          databases
            .listDocuments<Entity>(DATABASE_ID, COLLECTIONS.ENTITIES, [
              Query.equal('$id', batch),
              Query.limit(partyBatchSize),
            ])
            .then((r) => r.documents)
        );
      }

      const [partyBatchResults, colorClaims] = await Promise.all([
        Promise.all(partyEntityPromises),
        databases.listDocuments<Claim>(DATABASE_ID, COLLECTIONS.CLAIMS, [
          Query.equal('subject', partyIds),
          Query.equal('property', PROPERTY_IDS.COLOR),
          Query.limit(100),
        ]),
      ]);

      const partyEntities = partyBatchResults.flat();
      const partyColors = new Map<string, string>();
      colorClaims.documents.forEach((c) => {
        const subjectId =
          typeof c.subject === 'object' ? c.subject.$id : c.subject;
        if (subjectId && c.value_raw) {
          partyColors.set(subjectId, c.value_raw.split('|')[0].trim());
        }
      });

      const partyMap = new Map(partyEntities.map((e) => [e.$id, e]));
      claimToPartyId.forEach((pId, cId) => {
        const entity = partyMap.get(pId);
        if (entity) {
          claimToPartyMap.set(cId, { ...entity, color: partyColors.get(pId) });
        }
      });
    }
  }

  const batchAuthorities: Authority[] = [];
  for (const entity of entities) {
    const findings = officialsToFetch.get(entity.$id);
    if (!findings) continue;
    for (const f of findings) {
      const roleType = getRoleTypeSync(f.roleId);
      const party = claimToPartyMap.get(f.claimId);
      const authority: Authority = {
        ...entity,
        role: roleType || undefined,
        party,
      };

      if (
        roleType === 'Alcalde' &&
        !merged.alcalde.some((e) => e.$id === entity.$id)
      ) {
        merged.alcalde.push(authority);
        batchAuthorities.push(authority);
      }
      if (
        roleType === 'Gobernador' &&
        !merged.gobernador.some((e) => e.$id === entity.$id)
      ) {
        merged.gobernador.push(authority);
        batchAuthorities.push(authority);
      }
      if (
        roleType === 'Concejal' &&
        !merged.concejales.some((e) => e.$id === entity.$id)
      ) {
        merged.concejales.push(authority);
        batchAuthorities.push(authority);
      }
      if (
        roleType === 'Asambleísta' &&
        !merged.asambleistas.some((e) => e.$id === entity.$id)
      ) {
        merged.asambleistas.push(authority);
        batchAuthorities.push(authority);
      }
    }
  }

  if (batchAuthorities.length > 0 || isFirst) {
    onBatch(batchAuthorities, isFirst);
  }
}

/** Build a personId → findings map from a set of claims. */
function buildOfficialsMap(
  claims: Claim[]
): Map<string, { roleId: string; personId: string; claimId: string }[]> {
  const map = new Map<
    string,
    { roleId: string; personId: string; claimId: string }[]
  >();
  for (const c of claims) {
    const pid = typeof c.subject === 'object' ? c.subject.$id : c.subject;
    const rid =
      typeof c.value_relation === 'object'
        ? c.value_relation.$id
        : c.value_relation;
    if (!pid || !rid) continue;
    if (!map.has(pid)) map.set(pid, []);
    map.get(pid)!.push({ roleId: rid, personId: pid, claimId: c.$id });
  }
  return map;
}

/**
 * Streaming variant of getAuthoritiesByMunicipality.
 * Calls `onBatch` with partial results as each territory level resolves,
 * so the UI can display alcaldes/concejales before gobernadores/asambleístas
 * from parent territories finish loading.
 *
 * `onBatch(batch, replace)`:
 *   - replace=true  → first batch, set as initial state
 *   - replace=false → subsequent batches, append to existing state
 *
 * Returns the complete merged result when all levels are done.
 */
export async function getAuthoritiesByMunicipalityStreaming(
  territoryId: string,
  onBatch: (batch: Authority[], replace: boolean) => void
): Promise<AuthoritiesByMunicipality> {
  const merged: AuthoritiesByMunicipality = {
    alcalde: [],
    gobernador: [],
    concejales: [],
    asambleistas: [],
  };

  try {
    const [allRoleIds] = await Promise.all([getAllRoleIds(), getRoleIds()]);

    const [l0Claims, parentClaims] = await Promise.all([
      getCandidateClaimsForTerritory(territoryId, allRoleIds),
      databases.listDocuments<Claim>(DATABASE_ID, COLLECTIONS.CLAIMS, [
        Query.equal('subject', territoryId),
        Query.equal('property', PROPERTY_IDS.PART_OF),
      ]),
    ]);

    const l0Map = buildOfficialsMap(l0Claims);
    await fetchAndEmit(l0Map, merged, onBatch, true);

    let parentId: string | null = null;
    const parentRel = parentClaims.documents[0]?.value_relation;
    if (parentRel)
      parentId = typeof parentRel === 'object' ? parentRel.$id : parentRel;

    if (parentId && parentId !== territoryId) {
      const [l1Claims, gpClaims] = await Promise.all([
        getCandidateClaimsForTerritory(parentId, allRoleIds),
        databases.listDocuments<Claim>(DATABASE_ID, COLLECTIONS.CLAIMS, [
          Query.equal('subject', parentId),
          Query.equal('property', PROPERTY_IDS.PART_OF),
        ]),
      ]);

      const l1Map = buildOfficialsMap(l1Claims);
      await fetchAndEmit(l1Map, merged, onBatch, false);

      let gpId: string | null = null;
      const gpRel = gpClaims.documents[0]?.value_relation;
      if (gpRel) gpId = typeof gpRel === 'object' ? gpRel.$id : gpRel;

      if (gpId && gpId !== parentId) {
        const l2Claims = await getCandidateClaimsForTerritory(gpId, allRoleIds);
        const l2Map = buildOfficialsMap(l2Claims);
        await fetchAndEmit(l2Map, merged, onBatch, false);
      }
    }
  } catch (error) {
    console.error('Error in getAuthoritiesByMunicipalityStreaming:', error);
  }

  return merged;
}

/**
 * Fetch all authorities for a given municipality territory ID.
 * Traverses PART_OF chain up to 3 levels (municipality → province → department).
 */
export async function getAuthoritiesByMunicipality(
  territoryId: string
): Promise<AuthoritiesByMunicipality> {
  const result: AuthoritiesByMunicipality = {
    alcalde: [],
    gobernador: [],
    concejales: [],
    asambleistas: [],
  };

  try {
    const [allRoleIds] = await Promise.all([getAllRoleIds(), getRoleIds()]);

    const officialsToFetch = new Map<
      string,
      { roleId: string; personId: string; claimId: string }[]
    >();

    const addFinding = (personId: string, roleId: string, claimId: string) => {
      if (!officialsToFetch.has(personId)) {
        officialsToFetch.set(personId, []);
      }
      officialsToFetch.get(personId)?.push({ roleId, personId, claimId });
    };

    const [l0RoleClaims, parentClaims] = await Promise.all([
      getCandidateClaimsForTerritory(territoryId, allRoleIds),
      databases.listDocuments<Claim>(DATABASE_ID, COLLECTIONS.CLAIMS, [
        Query.equal('subject', territoryId),
        Query.equal('property', PROPERTY_IDS.PART_OF),
      ]),
    ]);

    l0RoleClaims.forEach((c) => {
      const pid = typeof c.subject === 'object' ? c.subject.$id : c.subject;
      const rid =
        typeof c.value_relation === 'object'
          ? c.value_relation.$id
          : c.value_relation;
      if (rid && pid) addFinding(pid, rid, c.$id);
    });

    let parentId: string | null = null;
    const parentRel = parentClaims.documents[0]?.value_relation;
    if (parentRel)
      parentId = typeof parentRel === 'object' ? parentRel.$id : parentRel;

    if (parentId && parentId !== territoryId) {
      const [l1RoleClaims, gpClaims] = await Promise.all([
        getCandidateClaimsForTerritory(parentId, allRoleIds),
        databases.listDocuments<Claim>(DATABASE_ID, COLLECTIONS.CLAIMS, [
          Query.equal('subject', parentId),
          Query.equal('property', PROPERTY_IDS.PART_OF),
        ]),
      ]);

      l1RoleClaims.forEach((c) => {
        const pid = typeof c.subject === 'object' ? c.subject.$id : c.subject;
        const rid =
          typeof c.value_relation === 'object'
            ? c.value_relation.$id
            : c.value_relation;
        if (rid && pid) addFinding(pid, rid, c.$id);
      });

      let gpId: string | null = null;
      const gpRel = gpClaims.documents[0]?.value_relation;
      if (gpRel) gpId = typeof gpRel === 'object' ? gpRel.$id : gpRel;

      if (gpId && gpId !== parentId) {
        // --- LEVEL 2 ---
        const l2RoleClaims = await getCandidateClaimsForTerritory(
          gpId,
          allRoleIds
        );
        l2RoleClaims.forEach((c) => {
          const pid = typeof c.subject === 'object' ? c.subject.$id : c.subject;
          const rid =
            typeof c.value_relation === 'object'
              ? c.value_relation.$id
              : c.value_relation;
          if (rid && pid) addFinding(pid, rid, c.$id);
        });
      }
    }

    const allIdsToFetch = Array.from(officialsToFetch.keys());

    if (allIdsToFetch.length === 0) {
      return result;
    }

    const entityBatchSize = 50;
    const entityBatchPromises: Promise<Entity[]>[] = [];
    for (let i = 0; i < allIdsToFetch.length; i += entityBatchSize) {
      const batch = allIdsToFetch.slice(i, i + entityBatchSize);
      entityBatchPromises.push(
        databases
          .listDocuments<Entity>(DATABASE_ID, COLLECTIONS.ENTITIES, [
            Query.equal('$id', batch),
            Query.limit(entityBatchSize),
          ])
          .then((r) => r.documents)
      );
    }

    const allClaimIds = Array.from(officialsToFetch.values()).flatMap((list) =>
      list.map((item) => item.claimId)
    );
    const claimToPartyMap = new Map<string, Entity & { color?: string }>();

    const partyQualPromises: Promise<Qualifier[]>[] = [];
    const qualBatchSize = 100;
    for (let i = 0; i < allClaimIds.length; i += qualBatchSize) {
      const batch = allClaimIds.slice(i, i + qualBatchSize);
      partyQualPromises.push(
        databases
          .listDocuments<Qualifier>(DATABASE_ID, COLLECTIONS.QUALIFIERS, [
            Query.equal('claim', batch),
            Query.equal('property', PROPERTY_IDS.POLITICAL_PARTY),
            Query.limit(qualBatchSize),
          ])
          .then((r) => r.documents)
      );
    }

    const [entityBatchResults, partyQualResults] = await Promise.all([
      Promise.all(entityBatchPromises),
      Promise.all(partyQualPromises),
    ]);

    const entities = entityBatchResults.flat();
    const allPartyQualifiers = partyQualResults.flat();

    const partyIdsToFetch = new Set<string>();
    const claimToPartyId = new Map<string, string>();
    allPartyQualifiers.forEach((q) => {
      const claimId = typeof q.claim === 'object' ? q.claim.$id : q.claim;
      const partyId =
        typeof q.value_relation === 'object'
          ? q.value_relation.$id
          : q.value_relation;
      if (claimId && partyId) {
        claimToPartyId.set(claimId, partyId);
        partyIdsToFetch.add(partyId);
      }
    });

    if (partyIdsToFetch.size > 0) {
      const partyIds = Array.from(partyIdsToFetch);
      const partyBatchSize = 50;

      const partyEntityPromises: Promise<Entity[]>[] = [];
      for (let i = 0; i < partyIds.length; i += partyBatchSize) {
        const batch = partyIds.slice(i, i + partyBatchSize);
        partyEntityPromises.push(
          databases
            .listDocuments<Entity>(DATABASE_ID, COLLECTIONS.ENTITIES, [
              Query.equal('$id', batch),
              Query.limit(partyBatchSize),
            ])
            .then((r) => r.documents)
        );
      }

      const [partyBatchResults, colorClaims] = await Promise.all([
        Promise.all(partyEntityPromises),
        databases.listDocuments<Claim>(DATABASE_ID, COLLECTIONS.CLAIMS, [
          Query.equal('subject', partyIds),
          Query.equal('property', PROPERTY_IDS.COLOR),
          Query.limit(100),
        ]),
      ]);

      const partyEntities = partyBatchResults.flat();

      const partyColors = new Map<string, string>();
      colorClaims.documents.forEach((c) => {
        const subjectId =
          typeof c.subject === 'object' ? c.subject.$id : c.subject;
        if (subjectId && c.value_raw) {
          const color = c.value_raw.split('|')[0].trim();
          partyColors.set(subjectId, color);
        }
      });

      const partyMap = new Map(partyEntities.map((e) => [e.$id, e]));

      claimToPartyId.forEach((pId, cId) => {
        const entity = partyMap.get(pId);
        if (entity) {
          const color = partyColors.get(pId);
          claimToPartyMap.set(cId, { ...entity, color });
        }
      });
    }

    for (const entity of entities) {
      const findings = officialsToFetch.get(entity.$id);
      if (findings) {
        for (const f of findings) {
          const roleType = getRoleTypeSync(f.roleId);
          const party = claimToPartyMap.get(f.claimId);

          const authority: Authority = {
            ...entity,
            role: roleType || undefined,
            party: party,
          };

          // Avoid duplicates
          if (
            roleType === 'Alcalde' &&
            !result.alcalde.some((e) => e.$id === entity.$id)
          ) {
            result.alcalde.push(authority);
          }
          if (
            roleType === 'Gobernador' &&
            !result.gobernador.some((e) => e.$id === entity.$id)
          ) {
            result.gobernador.push(authority);
          }
          if (
            roleType === 'Concejal' &&
            !result.concejales.some((e) => e.$id === entity.$id)
          ) {
            result.concejales.push(authority);
          }
          if (
            roleType === 'Asambleísta' &&
            !result.asambleistas.some((e) => e.$id === entity.$id)
          ) {
            result.asambleistas.push(authority);
          }
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Error fetching authorities by municipality:', error);
    return result;
  }
}
