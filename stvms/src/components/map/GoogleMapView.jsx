import React, { useEffect, useRef } from 'react';

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0B1120" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#718096" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0B1120" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1C2A40" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#141E30" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1E3A5F" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#060D1A" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

export const GoogleMapView = ({ 
  center, 
  zoom, 
  hotspots = [], 
  routes = [], 
  activeRouteIndex = 0,
  onMarkerClick 
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);

  // 1. Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !window.google) return;

    const map = new window.google.maps.Map(containerRef.current, {
      center: center,
      zoom: zoom,
      styles: DARK_MAP_STYLE,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    mapRef.current = map;
  }, [center, zoom]);

  // 2. Render Layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google) return;

    // Clear previous markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // Clear previous polylines
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    // Render Hotspots (Circle pins)
    hotspots.forEach(hot => {
      const color = hot.violationCount > 10 ? '#E53E3E' : (hot.violationCount > 3 ? '#D69E2E' : '#38A169');
      
      const marker = new window.google.maps.Marker({
        position: { lat: hot.latitude, lng: hot.longitude },
        map: map,
        title: `${hot.name} (${hot.violationCount} Violations)`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 0.7,
          strokeColor: '#0B1120',
          strokeWeight: 1.5,
          scale: Math.min(10 + (hot.violationCount || 0) * 0.5, 25)
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="color: #0B1120; font-family: sans-serif; padding: 4px;">
            <h4 style="margin: 0 0 4px 0; font-weight: bold;">${hot.name}</h4>
            <p style="margin: 0; font-size: 11px;">Zone: ${hot.zone}</p>
            <p style="margin: 4px 0 0 0; color: ${color}; font-weight: bold; font-size: 12px;">${hot.violationCount || 0} Violations</p>
          </div>
        `
      });

      marker.addListener('mouseover', () => {
        infoWindow.open(map, marker);
      });

      marker.addListener('mouseout', () => {
        infoWindow.close();
      });

      if (onMarkerClick) {
        marker.addListener('click', () => onMarkerClick(hot));
      }

      markersRef.current.push(marker);
    });

    // Render Routes
    routes.forEach((route, idx) => {
      if (!route.waypoints || route.waypoints.length === 0) return;

      const pathPoints = route.waypoints.map(w => ({ lat: w.lat, lng: w.lng }));
      const isActive = idx === activeRouteIndex;

      let strokeColor = '#38A169'; // Green (Safe)
      if (route.riskLabel === 'Moderate') strokeColor = '#D69E2E'; // Amber
      if (route.riskLabel === 'High Risk') strokeColor = '#E53E3E'; // Red

      const polyline = new window.google.maps.Polyline({
        path: pathPoints,
        geodesic: true,
        strokeColor: strokeColor,
        strokeOpacity: isActive ? 0.9 : 0.4,
        strokeWeight: isActive ? 6 : 3,
        map: map
      });

      polylinesRef.current.push(polyline);
    });

  }, [hotspots, routes, activeRouteIndex]);

  return <div ref={containerRef} className="w-full h-full" />;
};
export default GoogleMapView;
