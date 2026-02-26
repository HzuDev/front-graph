import { useState, useEffect } from 'react';
import { loadUserLocationFromStorage } from '../utils/geomHelpers';

export const useUserLocationDetection = () => {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  useEffect(() => {
    const location = loadUserLocationFromStorage();
    if (location) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserLocation(location);
    }
  }, []);

  return userLocation;
};
