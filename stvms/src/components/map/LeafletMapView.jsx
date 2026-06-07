import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Polyline } from 'react-leaflet';

// Fix Leaflet default marker icon issue with bundlers
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Auto-fit map bounds to markers
const FitBounds = ({ markers }) => {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [markers, map]);
  return null;
};

export const LeafletMapView = ({ markers = [], routes = [], activeRouteIndex = 0, onError }) => {
  // Bengaluru centre
  const DEFAULT_CENTER = [12.9716, 77.5946];
  const DEFAULT_ZOOM   = 12;

  const mapContainerRef = useRef(null);

  // Collect marker coordinates for fitting bounds
  const hasMarkers = markers.length > 0;
  const hasActiveRoute = routes[activeRouteIndex]?.waypoints?.length > 0;

  // Render routing helper in hook or simple sub-element
  const FitCombinedBounds = () => {
    const map = useMap();
    useEffect(() => {
      let activeBounds = [];
      if (markers.length > 0) {
        markers.forEach(m => activeBounds.push([m.lat, m.lng]));
      }
      if (routes[activeRouteIndex]?.waypoints) {
        routes[activeRouteIndex].waypoints.forEach(w => activeBounds.push([w.lat, w.lng]));
      }
      if (activeBounds.length === 0) return;
      map.fitBounds(activeBounds, { padding: [40, 40] });
    }, [map]);
    return null;
  };

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: '100%', width: '100%', zIndex: 1 }}
      className="rounded-b-lg"
    >
      {/* Dark tile layer from CartoDB */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />

      <FitCombinedBounds />

      {/* Render Hotspots/Markers */}
      {markers.map((m) => (
        <CircleMarker
          key={m.id}
          center={[m.lat, m.lng]}
          radius={Math.max(8, Math.min(24, (m.count || 1) * 3))}
          pathOptions={{
            color:       m.color || '#3182CE',
            fillColor:   m.color || '#3182CE',
            fillOpacity: 0.55,
            weight:      2,
          }}
        >
          <Popup>
            <div style={{ fontFamily: 'DM Sans, sans-serif', minWidth: 160 }}>
              <p style={{ fontWeight: 700, color: '#E2E8F0', marginBottom: 4, fontSize: 13 }}>
                {m.name}
              </p>
              <p style={{ color: '#94A3B8', fontSize: 11 }}>Zone: {m.zone}</p>
              <p style={{ color: '#94A3B8', fontSize: 11 }}>Violations: <strong style={{ color: m.color }}>{m.count}</strong></p>
              <p style={{ color: '#94A3B8', fontSize: 11 }}>Risk: <strong style={{ color: m.color }}>{m.severity}</strong></p>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* Render Route Polylines */}
      {routes.map((route, idx) => {
        if (!route.waypoints || route.waypoints.length === 0) return null;
        const polyPoints = route.waypoints.map(w => [w.lat, w.lng]);
        const isActive = idx === activeRouteIndex;

        let strokeColor = '#38A169'; // Green (Safe)
        if (route.riskLabel === 'Moderate') strokeColor = '#D69E2E'; // Amber
        if (route.riskLabel === 'High Risk') strokeColor = '#E53E3E'; // Red

        const PolylineComponent = L.Polyline; // reference
        return (
          <CircleMarker
            key={`rt-start-${idx}`}
            center={polyPoints[0]}
            radius={isActive ? 6 : 4}
            pathOptions={{ color: strokeColor, fillColor: strokeColor, fillOpacity: 0.9 }}
          >
            <Popup>Route {idx + 1} Start</Popup>
          </CircleMarker>
        );
      })}

      {routes.map((route, idx) => {
        if (!route.waypoints || route.waypoints.length === 0) return null;
        const polyPoints = route.waypoints.map(w => [w.lat, w.lng]);
        const isActive = idx === activeRouteIndex;

        let strokeColor = '#38A169'; // Green (Safe)
        if (route.riskLabel === 'Moderate') strokeColor = '#D69E2E'; // Amber
        if (route.riskLabel === 'High Risk') strokeColor = '#E53E3E'; // Red

        return (
          <Polyline
            key={`route-poly-${idx}`}
            positions={polyPoints}
            pathOptions={{
              color: strokeColor,
              weight: isActive ? 6 : 3,
              opacity: isActive ? 0.95 : 0.4
            }}
          />
        );
      })}
    </MapContainer>
  );
};

export default LeafletMapView;
