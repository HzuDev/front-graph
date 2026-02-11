import { databases, DATABASE_ID, COLLECTIONS, Query } from '../appwrite';
import type { Claim, Entity } from './types';
import { PROPERTY_IDS } from './constants';

/**
 * Fetch administrative levels based on "Codigo Territorial" claims
 * Returns a Map of Entity ID -> Administrative Level (1, 2, 3)
 */
export async function fetchAdministrativeLevels(): Promise<Map<string, number>> {
    const CODIGO_TERRITORIAL_ID = PROPERTY_IDS.TERRITORIAL_CODE;
    const adminLevels = new Map<string, number>();

    try {
        // Fetch all claims that are instances of "Codigo Territorial"
        const response = await databases.listDocuments<Claim>(
            DATABASE_ID,
            COLLECTIONS.CLAIMS,
            [
                Query.equal('property', CODIGO_TERRITORIAL_ID),
                Query.limit(5000) // Fetch as many as possible
            ]
        );

        for (const claim of response.documents) {
            if (claim.subject && claim.value_raw) {
                const entityId = typeof claim.subject === 'string' 
                    ? claim.subject 
                    : claim.subject.$id;
                
                // Determine level based on code length
                // 2 digits = Department (Level 1)
                // 4 digits = Province (Level 2)
                // 6 digits = Municipality (Level 3)
                const code = claim.value_raw.trim();
                let level = 0;
                
                if (code.length === 2) level = 1;
                else if (code.length === 4) level = 2;
                else if (code.length === 6) level = 3;

                if (level > 0) {
                    adminLevels.set(entityId, level);
                }
            }
        }
    } catch (error) {
        console.error('Error fetching administrative levels:', error);
    }

    return adminLevels;
}

/**
 * Search municipalities and provinces by name for autocomplete
 * Returns territorial entities matching the search term
 */
export async function searchMunicipalities(searchTerm: string): Promise<Entity[]> {
    if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
    }

    try {
        const searchKey = searchTerm.toLowerCase().trim();

        // Fetch administrative levels to filter by level 2 (provinces) and 3 (municipalities)
        const adminLevels = await fetchAdministrativeLevels();
        
        // Get all territorial entity IDs (provinces and municipalities)
        const territorialEntityIds = Array.from(adminLevels.entries())
            .filter(([_, level]) => level === 2 || level === 3)
            .map(([entityId, _]) => entityId);

        if (territorialEntityIds.length === 0) {
            return [];
        }

        // Fetch entities in batches
        const batchSize = 25;
        const allEntities: Entity[] = [];
        
        for (let i = 0; i < territorialEntityIds.length; i += batchSize) {
            const batch = territorialEntityIds.slice(i, i + batchSize);
            const response = await databases.listDocuments<Entity>(
                DATABASE_ID,
                COLLECTIONS.ENTITIES,
                [
                    Query.equal('$id', batch),
                    Query.limit(batchSize),
                ]
            );
            allEntities.push(...response.documents);
        }

        // Filter and score results
        const searchWords = searchKey.split(/\s+/).filter(w => w.length > 0);
        
        const results = allEntities
            .map(entity => {
                const label = (entity.label || '').toLowerCase();
                const aliases = (entity.aliases || []).map((a: string) => a.toLowerCase());
                
                let score = 0;
                
                // Exact match (highest score)
                if (label === searchKey) score += 1000;
                
                // Starts with (high score)
                if (label.startsWith(searchKey)) score += 500;
                
                // Contains in label (medium score)
                if (label.includes(searchKey)) score += 100;
                
                // Contains in aliases (medium score)
                if (aliases.some(a => a.includes(searchKey))) score += 80;
                
                // Multi-word match (all words present)
                if (searchWords.length > 1) {
                    const allWordsMatch = searchWords.every(word => 
                        label.includes(word) || aliases.some(a => a.includes(word))
                    );
                    if (allWordsMatch) score += 200;
                }
                
                return { entity, score, level: adminLevels.get(entity.$id) || 0 };
            })
            .filter(result => result.score > 0)
            .sort((a, b) => {
                // Sort by score first, then by level (municipalities before provinces)
                if (b.score !== a.score) return b.score - a.score;
                return b.level - a.level;
            })
            .slice(0, 20) // Limit to top 20 results
            .map(result => result.entity);

        return results;
    } catch (error) {
        console.error('Error searching municipalities:', error);
        return [];
    }
}
