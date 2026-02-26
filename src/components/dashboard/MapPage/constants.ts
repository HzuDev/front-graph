// MapPage constants
export const DEPARTMENTS = [
  'Todos',
  'La Paz',
  'Santa Cruz',
  'Cochabamba',
  'Oruro',
  'Potosí',
  'Chuquisaca',
  'Tarija',
  'Beni',
  'Pando',
] as const;

export const ENTITY_TYPES = [
  { value: 'Todas', label: 'Todas las entidades', icon: 'Globe' },
  { value: 'Municipio', label: 'Municipios', icon: 'Building2' },
  { value: 'Persona', label: 'Personas', icon: 'Users' },
  { value: 'Partido', label: 'Partidos Políticos', icon: 'Vote' },
  { value: 'Territorio', label: 'Territorios', icon: 'MapPin' },
] as const;

export const RESULTS_PREVIEW_LIMIT = 10;
