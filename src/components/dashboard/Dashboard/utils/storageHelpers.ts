/**
 * Retrieves the detected municipality from browser localStorage
 *
 * @returns Object with municipality name and entityId, or null if not found or invalid
 * @returns {string} returns.name - The municipality name
 * @returns {string} returns.entityId - The municipality's unique identifier
 *
 * @example
 * const municipality = loadMunicipalityFromStorage();
 * if (municipality) {
 *   console.log(municipality.name); // e.g., "Bogotá"
 * }
 */
export const loadMunicipalityFromStorage = () => {
  const detectedMunicipalityStr = localStorage.getItem('detected_municipality');
  if (detectedMunicipalityStr) {
    try {
      const detectedMunicipality = JSON.parse(detectedMunicipalityStr);
      if (detectedMunicipality && detectedMunicipality.municipalityName) {
        return {
          name: detectedMunicipality.municipalityName,
          entityId: detectedMunicipality.municipalityId, // Corregido: usar municipalityId
        };
      }
    } catch (e) {
      console.error('Error loading municipality from storage:', e);
    }
  }
  return null;
};

/**
 * Retrieves the user's geographic location from browser localStorage
 *
 * @returns Object with latitude and longitude, or null if not found or invalid
 * @returns {number} returns.lat - The latitude coordinate
 * @returns {number} returns.lon - The longitude coordinate
 *
 * @example
 * const location = loadLocationFromStorage();
 * if (location) {
 *   console.log(`${location.lat}, ${location.lon}`); // e.g., "4.7110, -74.0055"
 * }
 */
export const loadLocationFromStorage = () => {
  const userLocationStr = localStorage.getItem('user_location');
  if (userLocationStr) {
    try {
      const location = JSON.parse(userLocationStr);
      if (
        location &&
        typeof location.lat === 'number' &&
        typeof location.lon === 'number'
      ) {
        return location;
      }
    } catch {
      // Ignored
    }
  }
  return null;
};
