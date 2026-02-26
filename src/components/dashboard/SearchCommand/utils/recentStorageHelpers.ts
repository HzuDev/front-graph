import { RECENT_STORAGE_KEY, MAX_RECENT_ITEMS } from '../constants';
import type { Entity } from '../../../../lib/queries';

/**
 * Loads recently searched/viewed entities from browser localStorage
 *
 * Returns an empty array if storage is empty or data is corrupted
 *
 * @returns Array of Entity objects, ordered by most recent first
 *
 * @example
 * const recentEntities = loadRecentEntities();
 * console.log(recentEntities.length); // e.g., 5
 */
export const loadRecentEntities = (): Entity[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) || '[]');
  } catch (e) {
    console.error('Error loading recent entities:', e);
    return [];
  }
};

/**
 * Saves or updates an entity in the recent entities list
 *
 * Moves the entity to the top of the list if it already exists.
 * Limits the list to MAX_RECENT_ITEMS entries.
 *
 * @param entity - The entity to save to recent history
 *
 * @example
 * const entity = { $id: '123', name: 'Entity Name', ... };
 * saveRecentEntity(entity);
 *
 * // Later, load and verify
 * const recent = loadRecentEntities();
 * console.log(recent[0].$id); // '123' (most recent)
 */
export const saveRecentEntity = (entity: Entity) => {
  try {
    const recent = loadRecentEntities();
    const newRecent = [
      entity,
      ...recent.filter((e: Entity) => e.$id !== entity.$id),
    ].slice(0, MAX_RECENT_ITEMS);
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(newRecent));
  } catch (e) {
    console.error('Error saving recent entity:', e);
  }
};
