import type { Models } from 'appwrite';

// Types
export interface Entity extends Models.Document {
    label?: string;
    description?: string;
    aliases?: string[];
}

export interface Claim extends Models.Document {
    subject?: Entity;
    property?: Entity;
    value_raw?: string;
    value_relation?: Entity;
    datatype: 'string' | 'date' | 'boolean' | 'coordinate' | 'image' | 'json' | 'number' | 'url' | 'relation' | 'polygon' | 'color' | 'entity';
}

export interface PolygonData {
    entityId: string;
    entityLabel: string;
    coordinates: number[][][]; // GeoJSON Polygon format
    administrativeLevel: number; // 1: Department, 2: Province, 3: Municipality, 0: Unknown
}
