// Re-export all types
export type { Entity, Claim, PolygonData } from './types';

// Re-export all constants
export { PROPERTY_IDS, DEPARTMENT_IDS, CACHE_DURATION } from './constants';

// Re-export search functions
export { 
    fetchEntities,
    fetchEntitiesFiltered,
    getEntitiesByType,
    getEntitiesByDepartment
} from './search';

// Re-export entity functions
export {
    fetchEntityById,
    getEntityById,
    getEntityCount,
    getClaimCount,
    getPropertyCount,
    fetchEntityDetails
} from './entities';

// Re-export polygon functions
export {
    fetchPolygons,
    findMunicipalityByCoordinates
} from './polygons';

// Re-export administrative functions
export {
    fetchAdministrativeLevels,
    searchMunicipalities
} from './administrative';
