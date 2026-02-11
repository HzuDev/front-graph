import { useState, useEffect } from 'react';

/**
 * Hook to manage dashboard state including selected municipality and entity
 * 
 * Handles:
 * - Selected municipality tracking (name and department)
 * - Selected entity ID tracking
 * - Automatic municipality updates when geolocation is detected
 * 
 * @param selectedMunicipality - Initial selected municipality with name and department
 * @param userMunicipalityName - User's detected municipality name (auto-detected)
 * @param userLocation - User's geographic coordinates (for geolocation detection)
 * 
 * @returns Object containing municipality and entity state with setters
 * @returns {Object|null} returns.selectedMunicipality - Current selected municipality
 * @returns {Function} returns.setSelectedMunicipality - Function to update selected municipality
 * @returns {string|null} returns.selectedEntityId - Currently selected entity ID
 * @returns {Function} returns.setSelectedEntityId - Function to update selected entity
 * 
 * @example
 * const {
 *   selectedMunicipality,
 *   setSelectedMunicipality,
 *   selectedEntityId,
 *   setSelectedEntityId
 * } = useDashboardState(initialMunicipality, detectedMunicipalityName, userCoordinates);
 */
export const useDashboardState = (selectedMunicipality: { name: string; department: string } | null, userMunicipalityName: string | null, userLocation: { lat: number; lon: number } | null) => {
    const [selectedMunicipality_, setSelectedMunicipality] = useState<{ name: string; department: string } | null>(selectedMunicipality);
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

    // Consolidado: Actualizar municipio cuando se detecta del mapa o actualizar cuando lo selecciona
    useEffect(() => {
        if (selectedMunicipality && !userMunicipalityName && userLocation) {
            setSelectedMunicipality({
                name: selectedMunicipality.name,
                department: selectedMunicipality.department
            });
        }
    }, [selectedMunicipality, userMunicipalityName, userLocation]);

    return {
        selectedMunicipality: selectedMunicipality_,
        setSelectedMunicipality,
        selectedEntityId,
        setSelectedEntityId
    };
};
