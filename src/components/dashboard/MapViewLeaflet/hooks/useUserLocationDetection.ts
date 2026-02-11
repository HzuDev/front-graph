import { useState, useEffect } from 'react';
import { loadUserLocationFromStorage } from '../utils/geomHelpers';

export const useUserLocationDetection = () => {
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

    // Load user location from localStorage (using helper to avoid duplication)
    useEffect(() => {
        const location = loadUserLocationFromStorage();
        if (location) {
            setUserLocation(location);
        }
    }, []);

    return userLocation;
};
