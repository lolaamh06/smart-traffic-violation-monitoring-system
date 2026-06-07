import { useState, useEffect } from 'react';

export const useMapFallback = () => {
  const [isGoogleMapsAvailable, setIsGoogleMapsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Hook into Google Maps auth failure callback
    window.gm_authFailure = () => {
      console.warn("Google Maps authentication failed. Switching to Leaflet renderer.");
      setIsGoogleMapsAvailable(false);
      setIsLoading(false);
    };

    // 2. Perform timeout check for script load
    const checkMapsApi = () => {
      if (window.google && window.google.maps) {
        setIsGoogleMapsAvailable(true);
        setIsLoading(false);
      } else {
        // Retry or fallback
        setIsGoogleMapsAvailable(false);
        setIsLoading(false);
      }
    };

    // Give it 3.5 seconds to load the Google Maps API script if present
    const timer = setTimeout(checkMapsApi, 3500);

    return () => clearTimeout(timer);
  }, []);

  return { isGoogleMapsAvailable, isLoading };
};
export default useMapFallback;
