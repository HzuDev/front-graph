import { useState, useEffect } from 'react';
import { loadMunicipalityFromStorage, loadLocationFromStorage } from '../utils/storageHelpers';

/**
 * Hook to initialize and retrieve user's municipality and location data from storage
 * 
 * On component mount, loads:
 * - User's detected location (latitude, longitude)
 * - User's detected municipality (name and entity ID)
 * 
 * This hook persists user data across sessions for quick initialization
 * 
 * @returns Object containing user location, municipality info, and their setters
 * @returns {Object|null} returns.userLocation - User's geographic coordinates
 * @returns {number} returns.userLocation.lat - Latitude
 * @returns {number} returns.userLocation.lon - Longitude
 * @returns {Function} returns.setUserLocation - Function to update user location
 * @returns {string|null} returns.municipalityEntityId - ID of detected municipality
 * @returns {Function} returns.setMunicipalityEntityId - Function to update municipality ID
 * @returns {string|null} returns.userMunicipalityName - Name of detected municipality
 * @returns {Function} returns.setUserMunicipalityName - Function to update municipality name
 * 
 * @example
 * const {
 *   userLocation,
 *   userMunicipalityName,
 *   municipalityEntityId
 * } = useMunicipalityInitialization();
 * 
 * useEffect(() => {
 *   if (userMunicipalityName) {
 *     console.log(`Detected municipality: ${userMunicipalityName}`);
 *   }
 * }, [userMunicipalityName]);
 */
export const useMunicipalityInitialization = () => {
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [municipalityEntityId, setMunicipalityEntityId] = useState<string | null>(null);
    const [userMunicipalityName, setUserMunicipalityName] = useState<string | null>(null);

    // Consolidado: Cargar ubicación e municipio desde localStorage al montar
    useEffect(() => {
        const location = loadLocationFromStorage();
        if (location) {
            setUserLocation(location);
        }

        const municipality = loadMunicipalityFromStorage();
        if (municipality) {
            setUserMunicipalityName(municipality.name);
            setMunicipalityEntityId(municipality.entityId);
        }
    }, []);

    return {
        userLocation,
        setUserLocation,
        municipalityEntityId,
        setMunicipalityEntityId,
        userMunicipalityName,
        setUserMunicipalityName
    };
};
