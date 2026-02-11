import { useCallback, useState } from 'react';
import { loadRecentEntities, saveRecentEntity } from '../utils/recentStorageHelpers';
import type { Entity } from '../../../../lib/queries';

/**
 * Hook to manage search suggestions showing recent searches or popular entities
 * 
 * Features:
 * - Shows recently viewed/searched entities from localStorage
 * - Falls back to popular entities if no recent searches
 * - Handles entity selection with automatic persistence
 * 
 * @returns Object containing suggestion results and handlers
 * @returns {Entity[]} returns.results - Array of suggested entities
 * @returns {Function} returns.setResults - Function to update suggestions
 * @returns {Function} returns.handleSelect - Function to handle entity selection
 * @returns {Function} returns.loadSuggestions - Function to load suggestions on dropdown open
 * 
 * @example
 * const { results, handleSelect, loadSuggestions } = useSearchSuggestions();
 * 
 * useEffect(() => {
 *   loadSuggestions(fetchEntities, MAX_RECENT_ITEMS);
 * }, []);
 * 
 * return (
 *   <div>
 *     {results.map(entity => (
 *       <button
 *         key={entity.$id}
 *         onClick={() => handleSelect(entity, onEntitySelected)}
 *       >
 *         {entity.name}
 *       </button>
 *     ))}
 *   </div>
 * );
 */
export const useSearchSuggestions = () => {
    const [results, setResults] = useState<Entity[]>([]);

    const handleSelect = useCallback((entity: Entity, onSelect: (entity: Entity) => void) => {
        console.log('SearchCommand: select entity', entity);
        if (!entity || !entity.$id) {
            console.error('SearchCommand: Entity has no ID!', entity);
            return;
        }
        saveRecentEntity(entity);
        onSelect(entity);
    }, []);

    const loadSuggestions = useCallback(async (fetchEntities: (options: any) => Promise<any>, MAX_RECENT_ITEMS: number) => {
        try {
            // Try to get recent searches from localStorage
            const recent = loadRecentEntities();
            if (recent.length > 0) {
                setResults(recent.slice(0, MAX_RECENT_ITEMS));
                return;
            }

            // If no recent searches, show some popular entities
            const response = await fetchEntities({ limit: MAX_RECENT_ITEMS });
            setResults(response.documents);
        } catch (error) {
            console.error('Error loading suggestions:', error);
        }
    }, []);

    return {
        results,
        setResults,
        handleSelect,
        loadSuggestions
    };
};
