import React, { useState, useEffect, useRef } from 'react';
import { LeafletMapView } from './LeafletMapView';
import { MapPin } from 'lucide-react';

/**
 * MapWrapper — renders Leaflet map with hotspot markers.
 * Falls back gracefully if Leaflet fails to load.
 */
const MapWrapper = ({ markers = [], routes = [], activeRouteIndex = 0 }) => {
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Small delay to let the DOM settle before Leaflet initialises
    const t = setTimeout(() => setMapReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-surface-2 gap-4">
        <MapPin className="w-10 h-10 text-text-muted" />
        <p className="text-sm text-text-secondary">Map unavailable</p>
      </div>
    );
  }

  if (!mapReady) {
    return (
      <div className="h-full flex items-center justify-center bg-surface-2">
        <div className="text-xs text-text-muted animate-pulse">Loading map…</div>
      </div>
    );
  }

  return (
    <LeafletMapView
      markers={markers}
      routes={routes}
      activeRouteIndex={activeRouteIndex}
      onError={() => setError(true)}
    />
  );
};

export default MapWrapper;
