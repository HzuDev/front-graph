// MapViewLeaflet constants

// Constant para nivel names
export const LEVEL_NAMES: Record<number, string> = {
    0: 'País',
    1: 'Departamento',
    2: 'Provincia',
    3: 'Municipio',
};

// Color mapping by administrative level
export const LEVEL_COLORS = {
    0: '#ec4899', // País - Rosa
    1: '#a855f7', // Departamento - Púrpura
    2: '#3b82f6', // Provincia - Azul
    3: '#10b981', // Municipio - Verde
} as const;
