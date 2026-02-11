import { databases, DATABASE_ID, COLLECTIONS, Query } from '../appwrite';
import type { Entity, Claim } from './types';

/**
 * Fetch a single entity by ID with all its claims
 */
export async function fetchEntityById(entityId: string) {
    try {
        const entity = await databases.getDocument<Entity>(
            DATABASE_ID,
            COLLECTIONS.ENTITIES,
            entityId
        );
        
        // Fetch claims for this entity
        const claimsResponse = await databases.listDocuments<Claim>(
            DATABASE_ID,
            COLLECTIONS.CLAIMS,
            [Query.equal('subject', entityId)]
        );
        
        return {
            entity,
            claims: claimsResponse.documents,
        };
    } catch (error) {
        console.error('Error fetching entity:', error);
        throw error;
    }
}

/**
 * Alias for fetchEntityById - get a single entity by ID
 */
export async function getEntityById(entityId: string) {
    const result = await fetchEntityById(entityId);
    return result.entity;
}

/**
 * Get total count of entities
 */
export async function getEntityCount(): Promise<number> {
    try {
        const response = await databases.listDocuments<Entity>(
            DATABASE_ID,
            COLLECTIONS.ENTITIES,
            [Query.limit(1)] // We only need the total count
        );
        return response.total;
    } catch (error) {
        console.error('Error getting entity count:', error);
        return 0;
    }
}

/**
 * Get total count of claims
 */
export async function getClaimCount(): Promise<number> {
    try {
        const response = await databases.listDocuments<Claim>(
            DATABASE_ID,
            COLLECTIONS.CLAIMS,
            [Query.limit(1)] // We only need the total count
        );
        return response.total;
    } catch (error) {
        console.error('Error getting claim count:', error);
        return 0;
    }
}

/**
 * Get count of unique properties
 */
export async function getPropertyCount(): Promise<number> {
    try {
        // Fetch all claims and count unique property IDs
        const response = await databases.listDocuments<Claim>(
            DATABASE_ID,
            COLLECTIONS.CLAIMS,
            [Query.limit(5000)] // Adjust based on expected data size
        );
        
        const uniqueProperties = new Set<string>();
        response.documents.forEach(claim => {
            if (claim.property) {
                const propertyId = typeof claim.property === 'string' 
                    ? claim.property 
                    : claim.property.$id;
                uniqueProperties.add(propertyId);
            }
        });
        
        return uniqueProperties.size;
    } catch (error) {
        console.error('Error getting property count:', error);
        return 0;
    }
}

/**
 * Fetch full entity details including outgoing and incoming claims
 */
export async function fetchEntityDetails(entityId: string) {
    try {
        const entity = await databases.getDocument<Entity>(
            DATABASE_ID,
            COLLECTIONS.ENTITIES,
            entityId
        );
        
        // Fetch outgoing claims (Subject = Entity)
        const outgoingClaimsPromise = databases.listDocuments<Claim>(
            DATABASE_ID,
            COLLECTIONS.CLAIMS,
            [Query.equal('subject', entityId)]
        );

        // Fetch incoming claims (Value Relation = Entity)
        const incomingClaimsPromise = databases.listDocuments<Claim>(
            DATABASE_ID,
            COLLECTIONS.CLAIMS,
            [Query.equal('value_relation', entityId)]
        );

        const [outgoingResponse, incomingResponse] = await Promise.all([
            outgoingClaimsPromise,
            incomingClaimsPromise
        ]);

        const allClaims = [...outgoingResponse.documents, ...incomingResponse.documents];

        // Enrich claims by fetching property and value_relation details if they are just IDs or missing labels
        // We collect all unique IDs we need to fetch
        const entityIdsToFetch = new Set<string>();
        
        allClaims.forEach(claim => {
            if (claim.property && typeof claim.property === 'string') {
                entityIdsToFetch.add(claim.property);
            }
            if (claim.value_relation && typeof claim.value_relation === 'string') {
                entityIdsToFetch.add(claim.value_relation);
            }
        });

        // Fetch all needed entities in parallel (optimization: could be batched)
        // Since we can't easily do "WHERE ID IN (...)" in Appwrite without potentially hitting URL limits or strict query limits, 
        // we'll fetch them individually for now or use a limited batch if possible. 
        // Given the scale might be small per entity, Promise.all is acceptable for a prototype.
        
        if (entityIdsToFetch.size > 0) {
            const fetchedEntities = new Map<string, Entity>();
            
            await Promise.all(Array.from(entityIdsToFetch).map(async (id) => {
                try {
                    const ent = await databases.getDocument<Entity>(
                        DATABASE_ID,
                        COLLECTIONS.ENTITIES,
                        id
                    );
                    fetchedEntities.set(id, ent);
                } catch (e) {
                    console.warn(`Failed to fetch related entity ${id}`, e);
                }
            }));

            // Hydrate claims
            for (const claim of allClaims) {
                if (typeof claim.property === 'string' && fetchedEntities.has(claim.property)) {
                    claim.property = fetchedEntities.get(claim.property);
                }
                if (typeof claim.value_relation === 'string' && fetchedEntities.has(claim.value_relation)) {
                    claim.value_relation = fetchedEntities.get(claim.value_relation);
                }
            }
        }
        
        return {
            entity,
            claims: allClaims,
        };
    } catch (error) {
        console.error('Error fetching entity details:', error);
        throw error;
    }
}
