// Important Property IDs (from your data)
export const PROPERTY_IDS = {
    INSTANCE_OF: '69814ee90009513e4f69', // "es instancia de"
    PART_OF: '6983977fdc3b15edf3f5', // "es parte de"
    TERRITORIAL_CODE: '6982c462b97710531954', // "Codigo Territorial"
    TERRITORY: '6982cd215f22d1c5d613', // "Territorio"
} as const;

// Department Entity IDs
export const DEPARTMENT_IDS = {
    'La Paz': '6983986b655f81d387ea',
    'Santa Cruz': '69839869e17caed5adf0',
    'Cochabamba': '698398675bb38121fa86',
    'Oruro': '6983986c6c9ac55f6440',
    'Potosí': '6983986da5e5ba7df366',
    'Chuquisaca': '698398662dbd3f8849d5',
    // 'Tarija': '', // TODO: Add Tarija ID when available
    'Beni': '6983986484ff3fbbd1ce',
    'Pando': '69839868858161e0b8a0',
} as const;

// Cache configuration
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
