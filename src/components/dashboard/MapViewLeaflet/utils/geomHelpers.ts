/**
 * Loads user's saved location from browser localStorage
 * 
 * Used to restore the map view and geolocation state across sessions
 * 
 * @returns Object with lat and lon, or null if not found or invalid
 * @returns {number} returns.lat - Latitude coordinate
 * @returns {number} returns.lon - Longitude coordinate
 * 
 * @example
 * const location = loadUserLocationFromStorage();
 * if (location) {
 *   map.setView([location.lat, location.lon], 10);
 * }
 */
export const loadUserLocationFromStorage = () => {
    const userLocationStr = localStorage.getItem('user_location');
    if (userLocationStr) {
        try {
            const location = JSON.parse(userLocationStr);
            if (location?.lat && location?.lon) {
                return location;
            }
        } catch (e) {
            console.error('Error parsing user location:', e);
        }
    }
    return null;
};

/**
 * Creates a debounce function with configurable delay
 * 
 * Used to prevent rapid repeated function calls (e.g., preventing multiple
 * localStorage writes when the user is dragging the map)
 * 
 * @param delay - Debounce delay in milliseconds
 * @returns Function that executes the provided callback after the delay
 * 
 * @example
 * const debouncedSave = createDebounce(300);
 * 
 * mapElement.addEventListener('dragend', () => {
 *   debouncedSave(() => {
 *     localStorage.setItem('mapCenter', JSON.stringify(mapCenter));
 *   });
 * });
 */
export const createDebounce = (delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return (fn: () => void) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(fn, delay);
    };
};

/**
 * Debounced function to save municipality to localStorage with 300ms delay
 * 
 * Prevents excessive writes during rapid map interactions
 * 
 * @example
 * saveMunicipalityToStorage(() => {
 *   localStorage.setItem('detected_municipality', JSON.stringify(municipality));
 * });
 */
export const saveMunicipalityToStorage = createDebounce(300);

/**
 * Ray-casting algorithm to determine if a point is inside a polygon
 * 
 * Optimized implementation using the ray-casting algorithm.
 * Critical for performance as it's called frequently during map interactions.
 * 
 * @param point - [longitude, latitude] coordinate to test
 * @param polygon - GeoJSON polygon coordinates (array of rings)
 * @returns True if point is inside polygon, false otherwise
 * 
 * @example
 * const isInsideMunicipality = pointInPolygon(
 *   [mapCenter.lng, mapCenter.lat],
 *   municipalityPolygon
 * );
 * 
 * @complexity O(n) where n is the number of vertices in the polygon
 */
export const pointInPolygon = (point: [number, number], polygon: number[][][]) => {
    const [x, y] = point;
    for (let ring of polygon) {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const [xi, yi] = ring[i];
            const [xj, yj] = ring[j];
            const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
            if (intersect) inside = !inside;
        }
        if (inside) return true;
    }
    return false;
};
