// Re-export all types
export type { Entity, Claim, PolygonData } from './queries/types';

// Re-export all constants
export { PROPERTY_IDS, DEPARTMENT_IDS, CACHE_DURATION } from './queries/constants';

// Re-export search functions
export { 
    fetchEntities,
    fetchEntitiesFiltered,
    getEntitiesByType,
    getEntitiesByDepartment
} from './queries/search';

// Re-export entity functions
export {
    fetchEntityById,
    getEntityById,
    getEntityCount,
    getClaimCount,
    getPropertyCount,
    fetchEntityDetails
} from './queries/entities';

// Re-export polygon functions
export {
    fetchPolygons,
    findMunicipalityByCoordinates
} from './queries/polygons';

// Re-export administrative functions
export {
    fetchAdministrativeLevels,
    searchMunicipalities
} from './queries/administrative';

