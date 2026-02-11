import { useState, useEffect, useCallback } from 'react';
import { fetchEntities, getEntityCount, getClaimCount, getPropertyCount } from '../../../../lib/queries';
import type { Entity } from '../../../../lib/queries';

/**
 * Hook to fetch dashboard data including entities and statistics
 * 
 * Fetches:
 * - Top 4 entities (filtered by municipality if provided)
 * - Total entity count
 * - Total claim count
 * - Total property count
 * 
 * @param userMunicipalityName - The name of the user's municipality for filtering (optional)
 * @returns Object containing entities, statistics, and loading state
 * @returns {Entity[]} returns.entities - Array of entity documents (max 4)
 * @returns {Object} returns.stats - Statistics object
 * @returns {number} returns.stats.entities - Total number of entities
 * @returns {number} returns.stats.claims - Total number of claims
 * @returns {number} returns.stats.properties - Total number of properties
 * @returns {boolean} returns.loading - Loading state
 * 
 * @example
 * const { entities, stats, loading } = useDashboardData('Bogotá');
 * 
 * if (loading) return <Spinner />;
 * 
 * return (
 *   <div>
 *     <p>Total entities: {stats.entities}</p>
 *     {entities.map(entity => <EntityCard key={entity.id} entity={entity} />)}
 *   </div>
 * );
 */
export const useDashboardData = (userMunicipalityName: string | null) => {
    const [entities, setEntities] = useState<Entity[]>([]);
    const [stats, setStats] = useState({ entities: 0, claims: 0, properties: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);

                // Build search query based on detected municipality
                const searchQuery = userMunicipalityName ? userMunicipalityName : undefined;

                // Fetch entities (filtered by location if available) and statistics in parallel
                const [entitiesData, entityCount, claimCount, propertyCount] = await Promise.all([
                    fetchEntities({
                        limit: 4,
                        search: searchQuery
                    }),
                    getEntityCount(),
                    getClaimCount(),
                    getPropertyCount(),
                ]);

                setEntities(entitiesData.documents);
                setStats({
                    entities: entityCount,
                    claims: claimCount,
                    properties: propertyCount,
                });
            } catch (error) {
                console.error('Error loading dashboard data:', error);
                // Set empty data on error
                setEntities([]);
                setStats({ entities: 0, claims: 0, properties: 0 });
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [userMunicipalityName]);

    return { entities, stats, loading };
};
