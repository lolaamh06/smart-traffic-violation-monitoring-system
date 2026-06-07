import React, { useState, useEffect, useMemo } from 'react';
import { isSandbox, localDb } from '../../config/firebase';
import MapWrapper from '../../components/map/MapWrapper';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Navigation, AlertTriangle, ShieldCheck, MapPin, Clock, Route } from 'lucide-react';
import toast from 'react-hot-toast';

// ── All Bengaluru origin/destination areas ─────────────────────────────────
export const AREA_OPTIONS = [
  { id: 'MG_ROAD',       label: 'MG Road Metro Junction',         zone: 'Central', lat: 12.9756, lng: 77.6097 },
  { id: 'HEBBAL',        label: 'Hebbal Flyover Junction',         zone: 'North',   lat: 13.0359, lng: 77.5970 },
  { id: 'WHITEFIELD',    label: 'Whitefield ITPL Main Gate',       zone: 'East',    lat: 12.9868, lng: 77.7399 },
  { id: 'SILK_BOARD',    label: 'Silk Board Junction',             zone: 'South',   lat: 12.9176, lng: 77.6233 },
  { id: 'KORAMANGALA',   label: 'Koramangala 80ft Road Signal',    zone: 'South',   lat: 12.9352, lng: 77.6245 },
  { id: 'INDIRANAGAR',   label: 'Indiranagar 12th Main Road',      zone: 'East',    lat: 12.9784, lng: 77.6408 },
  { id: 'YESHWANTHPUR',  label: 'Yeshwanthpur Metro Station',      zone: 'West',    lat: 13.0227, lng: 77.5432 },
  { id: 'MARATHAHALLI',  label: 'Marathahalli Multiplex Junc',     zone: 'East',    lat: 12.9591, lng: 77.6974 },
  { id: 'JP_NAGAR',      label: 'JP Nagar 3rd Phase Signal',       zone: 'South',   lat: 12.9063, lng: 77.5857 },
  { id: 'MALLESHWARAM',  label: 'Malleshwaram 8th Cross',          zone: 'West',    lat: 13.0035, lng: 77.5700 },
  { id: 'BANASHANKARI',  label: 'Banashankari TTMC Signal',        zone: 'South',   lat: 12.9156, lng: 77.5736 },
  { id: 'YELAHANKA',     label: 'Yelahanka Police Station Junc',   zone: 'North',   lat: 13.1008, lng: 77.5963 },
  { id: 'JAYANAGAR',     label: 'Jayanagar 4th Block Circle',      zone: 'South',   lat: 12.9290, lng: 77.5830 },
  { id: 'ELECTRONIC_CITY', label: 'Electronic City Phase 1',       zone: 'South',   lat: 12.8399, lng: 77.6770 },
  { id: 'KR_PURAM',      label: 'KR Puram Hanging Bridge',         zone: 'East',    lat: 13.0007, lng: 77.6951 },
];

// ── Route datasets keyed by "ORIGIN__DEST" ────────────────────────────────
const ROUTES = {};

// MG Road → Silk Board
ROUTES['MG_ROAD__SILK_BOARD'] = [
  {
    id: 'R-A1', rank: 3,
    name: 'Route A: Richmond Rd → Hosur Rd (Direct Highway)',
    riskLabel: 'High Risk', riskScore: 88, violationCount: 14,
    description: 'Direct corridor. High-density speed cameras & signal traps at Madiwala.',
    distance: '9.2 km', duration: '22 mins',
    waypoints: [
      { lat: 12.9756, lng: 77.6097 },
      { lat: 12.9705, lng: 77.6067 },
      { lat: 12.9602, lng: 77.5982 },
      { lat: 12.9515, lng: 77.6101 },
      { lat: 12.9302, lng: 77.6180 },
      { lat: 12.9176, lng: 77.6233 },
    ],
  },
  {
    id: 'R-A2', rank: 2,
    name: 'Route B: Koramangala 80ft Road (Alternative Arterial)',
    riskLabel: 'Moderate', riskScore: 45, violationCount: 6,
    description: 'Urban lanes via Domlur. Moderate enforcement. Manageable parking tickets.',
    distance: '10.5 km', duration: '28 mins',
    waypoints: [
      { lat: 12.9756, lng: 77.6097 },
      { lat: 12.9731, lng: 77.6172 },
      { lat: 12.9784, lng: 77.6408 },
      { lat: 12.9582, lng: 77.6321 },
      { lat: 12.9352, lng: 77.6245 },
      { lat: 12.9176, lng: 77.6233 },
    ],
  },
  {
    id: 'R-A3', rank: 1,
    name: 'Route C: Lalbagh → Jayanagar Loop (Residential Bypass)',
    riskLabel: 'Safe', riskScore: 12, violationCount: 1,
    description: 'Scenic bypass through quiet zones. Minimal traffic camera coverage.',
    distance: '11.8 km', duration: '31 mins',
    waypoints: [
      { lat: 12.9756, lng: 77.6097 },
      { lat: 12.9698, lng: 77.5891 },
      { lat: 12.9515, lng: 77.5802 },
      { lat: 12.9290, lng: 77.5830 },
      { lat: 12.9063, lng: 77.5857 },
      { lat: 12.9176, lng: 77.6233 },
    ],
  },
];

// Hebbal → JP Nagar
ROUTES['HEBBAL__JP_NAGAR'] = [
  {
    id: 'R-B1', rank: 3,
    name: 'Route A: Mekhri Circle → Hosur Rd Highway',
    riskLabel: 'High Risk', riskScore: 92, violationCount: 22,
    description: 'Direct North-South expressway. Highly active speed traps and lane checks.',
    distance: '18.4 km', duration: '42 mins',
    waypoints: [
      { lat: 13.0359, lng: 77.5970 },
      { lat: 13.0145, lng: 77.5898 },
      { lat: 12.9756, lng: 77.6097 },
      { lat: 12.9602, lng: 77.5982 },
      { lat: 12.9176, lng: 77.6233 },
      { lat: 12.9063, lng: 77.5857 },
    ],
  },
  {
    id: 'R-B2', rank: 2,
    name: 'Route B: RT Nagar → Domlur → Koramangala Bypass',
    riskLabel: 'Moderate', riskScore: 50, violationCount: 9,
    description: 'Bypasses major junctions via residential loops. High traffic density.',
    distance: '20.1 km', duration: '54 mins',
    waypoints: [
      { lat: 13.0359, lng: 77.5970 },
      { lat: 13.0182, lng: 77.5925 },
      { lat: 12.9784, lng: 77.6408 },
      { lat: 12.9591, lng: 77.6974 },
      { lat: 12.9352, lng: 77.6245 },
      { lat: 12.9063, lng: 77.5857 },
    ],
  },
  {
    id: 'R-B3', rank: 1,
    name: 'Route C: Malleshwaram → Banashankari Link (Cam-Free)',
    riskLabel: 'Safe', riskScore: 15, violationCount: 2,
    description: 'Inner-city loop through traditional suburbs. Zero known speed trap zones.',
    distance: '21.5 km', duration: '59 mins',
    waypoints: [
      { lat: 13.0359, lng: 77.5970 },
      { lat: 13.0035, lng: 77.5700 },
      { lat: 12.9924, lng: 77.5535 },
      { lat: 12.9682, lng: 77.5372 },
      { lat: 12.9156, lng: 77.5736 },
      { lat: 12.9063, lng: 77.5857 },
    ],
  },
];

// Whitefield → MG Road
ROUTES['WHITEFIELD__MG_ROAD'] = [
  {
    id: 'R-C1', rank: 3,
    name: 'Route A: Old Airport Rd → Indiranagar (Busy Corridor)',
    riskLabel: 'High Risk', riskScore: 84, violationCount: 18,
    description: 'Tech-park commuter belt. ITPL-to-Indiranagar corridor has heavy camera enforcement.',
    distance: '17.6 km', duration: '38 mins',
    waypoints: [
      { lat: 12.9868, lng: 77.7399 },
      { lat: 12.9918, lng: 77.7161 },
      { lat: 12.9602, lng: 77.6601 },
      { lat: 12.9784, lng: 77.6408 },
      { lat: 12.9756, lng: 77.6097 },
    ],
  },
  {
    id: 'R-C2', rank: 2,
    name: 'Route B: Varthur Kodi → Marathahalli → Domlur',
    riskLabel: 'Moderate', riskScore: 52, violationCount: 8,
    description: 'Slightly longer via Marathahalli. Manageable camera density.',
    distance: '19.2 km', duration: '44 mins',
    waypoints: [
      { lat: 12.9868, lng: 77.7399 },
      { lat: 12.9555, lng: 77.7472 },
      { lat: 12.9591, lng: 77.6974 },
      { lat: 12.9582, lng: 77.6321 },
      { lat: 12.9756, lng: 77.6097 },
    ],
  },
  {
    id: 'R-C3', rank: 1,
    name: 'Route C: KR Puram → Tin Factory → Ramamurthy Nagar',
    riskLabel: 'Safe', riskScore: 22, violationCount: 3,
    description: 'Outer loop through residential sectors. Fewest signal-jump traps.',
    distance: '21.0 km', duration: '52 mins',
    waypoints: [
      { lat: 12.9868, lng: 77.7399 },
      { lat: 13.0007, lng: 77.6951 },
      { lat: 13.0100, lng: 77.6600 },
      { lat: 12.9900, lng: 77.6300 },
      { lat: 12.9756, lng: 77.6097 },
    ],
  },
];

// Koramangala → Whitefield
ROUTES['KORAMANGALA__WHITEFIELD'] = [
  {
    id: 'R-D1', rank: 3,
    name: 'Route A: HAL Old Airport Rd → ITPL (Fast but Risky)',
    riskLabel: 'High Risk', riskScore: 79, violationCount: 16,
    description: 'Fastest but passes through high-enforcement HAL junction zone.',
    distance: '20.3 km', duration: '35 mins',
    waypoints: [
      { lat: 12.9352, lng: 77.6245 },
      { lat: 12.9602, lng: 77.6601 },
      { lat: 12.9784, lng: 77.6408 },
      { lat: 12.9918, lng: 77.7161 },
      { lat: 12.9868, lng: 77.7399 },
    ],
  },
  {
    id: 'R-D2', rank: 2,
    name: 'Route B: Domlur → Marathahalli Flyover',
    riskLabel: 'Moderate', riskScore: 41, violationCount: 7,
    description: 'Moderate enforcement via Marathahalli multi-level interchange.',
    distance: '21.5 km', duration: '43 mins',
    waypoints: [
      { lat: 12.9352, lng: 77.6245 },
      { lat: 12.9582, lng: 77.6321 },
      { lat: 12.9591, lng: 77.6974 },
      { lat: 12.9555, lng: 77.7472 },
      { lat: 12.9868, lng: 77.7399 },
    ],
  },
  {
    id: 'R-D3', rank: 1,
    name: 'Route C: Ejipura → Bellandur → Varthur (Suburban Route)',
    riskLabel: 'Safe', riskScore: 18, violationCount: 2,
    description: 'Suburban fringe route. Very few traffic cameras on Bellandur stretch.',
    distance: '23.0 km', duration: '51 mins',
    waypoints: [
      { lat: 12.9352, lng: 77.6245 },
      { lat: 12.9200, lng: 77.6400 },
      { lat: 12.9180, lng: 77.6700 },
      { lat: 12.9300, lng: 77.7200 },
      { lat: 12.9555, lng: 77.7472 },
      { lat: 12.9868, lng: 77.7399 },
    ],
  },
];

// Yeshwanthpur → Silk Board
ROUTES['YESHWANTHPUR__SILK_BOARD'] = [
  {
    id: 'R-E1', rank: 3,
    name: 'Route A: Chord Rd → KH Rd → Hosur Rd (Ring Road)',
    riskLabel: 'High Risk', riskScore: 86, violationCount: 20,
    description: 'Passes through Rajajinagar & Richmond Circle — both high-violation zones.',
    distance: '22.1 km', duration: '46 mins',
    waypoints: [
      { lat: 13.0227, lng: 77.5432 },
      { lat: 12.9924, lng: 77.5535 },
      { lat: 12.9756, lng: 77.6097 },
      { lat: 12.9602, lng: 77.5982 },
      { lat: 12.9176, lng: 77.6233 },
    ],
  },
  {
    id: 'R-E2', rank: 2,
    name: 'Route B: Tumkur Rd → Magadi Rd → Banashankari',
    riskLabel: 'Moderate', riskScore: 47, violationCount: 8,
    description: 'Western loop through Vijayanagar & Banashankari. Steady traffic.',
    distance: '24.4 km', duration: '58 mins',
    waypoints: [
      { lat: 13.0227, lng: 77.5432 },
      { lat: 13.0035, lng: 77.5700 },
      { lat: 12.9682, lng: 77.5372 },
      { lat: 12.9515, lng: 77.5255 },
      { lat: 12.9156, lng: 77.5736 },
      { lat: 12.9176, lng: 77.6233 },
    ],
  },
  {
    id: 'R-E3', rank: 1,
    name: 'Route C: Peenya → Kengeri → JP Nagar (Outer Loop)',
    riskLabel: 'Safe', riskScore: 19, violationCount: 2,
    description: 'Outer ring via Kengeri Satellite Town. Far fewer enforcement cameras.',
    distance: '27.0 km', duration: '65 mins',
    waypoints: [
      { lat: 13.0227, lng: 77.5432 },
      { lat: 12.9800, lng: 77.5100 },
      { lat: 12.9174, lng: 77.4839 },
      { lat: 12.9063, lng: 77.5857 },
      { lat: 12.9176, lng: 77.6233 },
    ],
  },
];

// Yelahanka → Electronic City
ROUTES['YELAHANKA__ELECTRONIC_CITY'] = [
  {
    id: 'R-F1', rank: 3,
    name: 'Route A: NH-44 → NICE Road Corridor (Expressway)',
    riskLabel: 'High Risk', riskScore: 91, violationCount: 25,
    description: 'Fastest route but passes through Hebbal, Silk Board — both camera hotspots.',
    distance: '38.5 km', duration: '55 mins',
    waypoints: [
      { lat: 13.1008, lng: 77.5963 },
      { lat: 13.0359, lng: 77.5970 },
      { lat: 12.9756, lng: 77.6097 },
      { lat: 12.9176, lng: 77.6233 },
      { lat: 12.8399, lng: 77.6770 },
    ],
  },
  {
    id: 'R-F2', rank: 2,
    name: 'Route B: Tumkur Rd → Outer Ring Rd → Bannerghatta',
    riskLabel: 'Moderate', riskScore: 53, violationCount: 11,
    description: 'Passes Peenya industrial area. Speed traps active in morning hours.',
    distance: '41.0 km', duration: '68 mins',
    waypoints: [
      { lat: 13.1008, lng: 77.5963 },
      { lat: 13.0227, lng: 77.5432 },
      { lat: 12.9682, lng: 77.5372 },
      { lat: 12.9156, lng: 77.5736 },
      { lat: 12.8700, lng: 77.5900 },
      { lat: 12.8399, lng: 77.6770 },
    ],
  },
  {
    id: 'R-F3', rank: 1,
    name: 'Route C: Doddaballapur Rd → Kodigehalli → Kengeri Loop',
    riskLabel: 'Safe', riskScore: 24, violationCount: 3,
    description: 'Rural fringe road. Very low camera density across entire stretch.',
    distance: '44.0 km', duration: '78 mins',
    waypoints: [
      { lat: 13.1008, lng: 77.5963 },
      { lat: 13.0500, lng: 77.5400 },
      { lat: 12.9800, lng: 77.4900 },
      { lat: 12.9174, lng: 77.4839 },
      { lat: 12.8600, lng: 77.5500 },
      { lat: 12.8399, lng: 77.6770 },
    ],
  },
];

// Indiranagar → Malleshwaram
ROUTES['INDIRANAGAR__MALLESHWARAM'] = [
  {
    id: 'R-G1', rank: 3,
    name: 'Route A: CMH Rd → MG Road → Jayamahal (Central)',
    riskLabel: 'High Risk', riskScore: 75, violationCount: 13,
    description: 'City centre route. Passes through MG Road & Mekhri Circle — both high enforcement.',
    distance: '8.8 km', duration: '22 mins',
    waypoints: [
      { lat: 12.9784, lng: 77.6408 },
      { lat: 12.9756, lng: 77.6097 },
      { lat: 12.9731, lng: 77.5800 },
      { lat: 13.0035, lng: 77.5700 },
    ],
  },
  {
    id: 'R-G2', rank: 2,
    name: 'Route B: Domlur → Vasanth Nagar → Sankey Rd',
    riskLabel: 'Moderate', riskScore: 38, violationCount: 5,
    description: 'Moderate enforcement. Sankey Road section has no speed cameras.',
    distance: '9.5 km', duration: '26 mins',
    waypoints: [
      { lat: 12.9784, lng: 77.6408 },
      { lat: 12.9700, lng: 77.6000 },
      { lat: 12.9900, lng: 77.5800 },
      { lat: 13.0035, lng: 77.5700 },
    ],
  },
  {
    id: 'R-G3', rank: 1,
    name: 'Route C: Halasuru → Hebbal Spur → Sadashivanagar (Quiet)',
    riskLabel: 'Safe', riskScore: 14, violationCount: 1,
    description: 'Through diplomatic enclave area. Essentially zero camera enforcement.',
    distance: '11.0 km', duration: '30 mins',
    waypoints: [
      { lat: 12.9784, lng: 77.6408 },
      { lat: 12.9900, lng: 77.6200 },
      { lat: 13.0100, lng: 77.5900 },
      { lat: 13.0035, lng: 77.5700 },
    ],
  },
];

// Jayanagar → KR Puram
ROUTES['JAYANAGAR__KR_PURAM'] = [
  {
    id: 'R-H1', rank: 3,
    name: 'Route A: Hosur Rd → Silk Board → Outer Ring Rd',
    riskLabel: 'High Risk', riskScore: 82, violationCount: 19,
    description: 'Direct via Silk Board — Bengaluru\'s most violated junction.',
    distance: '16.4 km', duration: '34 mins',
    waypoints: [
      { lat: 12.9290, lng: 77.5830 },
      { lat: 12.9176, lng: 77.6233 },
      { lat: 12.9352, lng: 77.6245 },
      { lat: 12.9784, lng: 77.6408 },
      { lat: 13.0007, lng: 77.6951 },
    ],
  },
  {
    id: 'R-H2', rank: 2,
    name: 'Route B: Bannerghatta Rd → Koramangala → HAL',
    riskLabel: 'Moderate', riskScore: 44, violationCount: 7,
    description: 'Koramangala stretch has some cameras but manageable.',
    distance: '17.8 km', duration: '42 mins',
    waypoints: [
      { lat: 12.9290, lng: 77.5830 },
      { lat: 12.9400, lng: 77.6000 },
      { lat: 12.9352, lng: 77.6245 },
      { lat: 12.9602, lng: 77.6601 },
      { lat: 13.0007, lng: 77.6951 },
    ],
  },
  {
    id: 'R-H3', rank: 1,
    name: 'Route C: Basavanagudi → Shivajinagar → Banaswadi (Residential)',
    riskLabel: 'Safe', riskScore: 16, violationCount: 2,
    description: 'Longer but through lower-enforcement residential areas.',
    distance: '20.0 km', duration: '51 mins',
    waypoints: [
      { lat: 12.9290, lng: 77.5830 },
      { lat: 12.9450, lng: 77.5700 },
      { lat: 12.9756, lng: 77.5850 },
      { lat: 12.9900, lng: 77.6400 },
      { lat: 13.0007, lng: 77.6951 },
    ],
  },
];

// Marathahalli → Banashankari
ROUTES['MARATHAHALLI__BANASHANKARI'] = [
  {
    id: 'R-I1', rank: 3,
    name: 'Route A: Outer Ring Rd → Silk Board → Jayanagar',
    riskLabel: 'High Risk', riskScore: 80, violationCount: 17,
    description: 'ORR to Silk Board to Jayanagar — all three are camera hotspots.',
    distance: '15.5 km', duration: '32 mins',
    waypoints: [
      { lat: 12.9591, lng: 77.6974 },
      { lat: 12.9352, lng: 77.6245 },
      { lat: 12.9176, lng: 77.6233 },
      { lat: 12.9290, lng: 77.5830 },
      { lat: 12.9156, lng: 77.5736 },
    ],
  },
  {
    id: 'R-I2', rank: 2,
    name: 'Route B: Bellandur → BTM Layout → 100ft Road',
    riskLabel: 'Moderate', riskScore: 43, violationCount: 6,
    description: 'Via BTM Water Tank junction — moderate enforcement zone.',
    distance: '16.8 km', duration: '41 mins',
    waypoints: [
      { lat: 12.9591, lng: 77.6974 },
      { lat: 12.9200, lng: 77.6700 },
      { lat: 12.9165, lng: 77.6101 },
      { lat: 12.9063, lng: 77.5857 },
      { lat: 12.9156, lng: 77.5736 },
    ],
  },
  {
    id: 'R-I3', rank: 1,
    name: 'Route C: Varthur → Sarjapur Rd → JP Nagar (Quiet Loop)',
    riskLabel: 'Safe', riskScore: 17, violationCount: 2,
    description: 'Sarjapur fringe road. Minimal surveillance cameras on this stretch.',
    distance: '19.2 km', duration: '49 mins',
    waypoints: [
      { lat: 12.9591, lng: 77.6974 },
      { lat: 12.9555, lng: 77.7472 },
      { lat: 12.9300, lng: 77.7100 },
      { lat: 12.9100, lng: 77.6500 },
      { lat: 12.9063, lng: 77.5857 },
      { lat: 12.9156, lng: 77.5736 },
    ],
  },
];

// Default fallback for any other combination
const buildDefaultRoutes = (origin, dest) => [
  {
    id: 'R-X1', rank: 3,
    name: 'Route A: Main Road (Direct)',
    riskLabel: 'High Risk', riskScore: 78, violationCount: 15,
    description: 'Direct route. High camera density on major arterials.',
    distance: '15.0 km', duration: '35 mins',
    waypoints: [
      { lat: origin.lat, lng: origin.lng },
      { lat: (origin.lat + dest.lat) / 2 + 0.005, lng: (origin.lng + dest.lng) / 2 },
      { lat: dest.lat, lng: dest.lng },
    ],
  },
  {
    id: 'R-X2', rank: 2,
    name: 'Route B: Ring Road Bypass',
    riskLabel: 'Moderate', riskScore: 45, violationCount: 8,
    description: 'Slightly longer via ring road. Medium enforcement.',
    distance: '17.0 km', duration: '42 mins',
    waypoints: [
      { lat: origin.lat, lng: origin.lng },
      { lat: (origin.lat + dest.lat) / 2, lng: (origin.lng + dest.lng) / 2 + 0.02 },
      { lat: dest.lat, lng: dest.lng },
    ],
  },
  {
    id: 'R-X3', rank: 1,
    name: 'Route C: Residential Inner Loop (Safest)',
    riskLabel: 'Safe', riskScore: 16, violationCount: 2,
    description: 'Longer but through low-enforcement residential areas.',
    distance: '19.0 km', duration: '50 mins',
    waypoints: [
      { lat: origin.lat, lng: origin.lng },
      { lat: origin.lat - 0.015, lng: (origin.lng + dest.lng) / 2 - 0.02 },
      { lat: (origin.lat + dest.lat) / 2 - 0.01, lng: dest.lng - 0.01 },
      { lat: dest.lat, lng: dest.lng },
    ],
  },
];

// ── Component ──────────────────────────────────────────────────────────────
export const RouteSafetyFinder = () => {
  const [locations, setLocations] = useState([]);
  const [originId, setOriginId] = useState('MG_ROAD');
  const [destId, setDestId] = useState('SILK_BOARD');
  const [activeRouteIdx, setActiveRouteIdx] = useState(0); // 0 = safest (rank 1)

  useEffect(() => {
    if (isSandbox) {
      setLocations(localDb.get('locations') || []);
    } else {
      import('../../config/firebase').then(async ({ db, collection, getDocs }) => {
        try {
          const snap = await getDocs(collection(db, 'locations'));
          setLocations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
          console.error(e);
        }
      });
    }
  }, []);

  const originArea  = AREA_OPTIONS.find(a => a.id === originId);
  const destArea    = AREA_OPTIONS.find(a => a.id === destId);

  const routesDataset = useMemo(() => {
    const key = `${originId}__${destId}`;
    const reverseKey = `${destId}__${originId}`;
    if (ROUTES[key]) return ROUTES[key];
    if (ROUTES[reverseKey]) {
      // reverse waypoints for reverse direction
      return ROUTES[reverseKey].map(r => ({
        ...r,
        waypoints: [...r.waypoints].reverse(),
      }));
    }
    if (originArea && destArea) return buildDefaultRoutes(originArea, destArea);
    return [];
  }, [originId, destId, originArea, destArea]);

  // Sorted safest first
  const rankedRoutes = useMemo(() =>
    [...routesDataset].sort((a, b) => a.riskScore - b.riskScore),
  [routesDataset]);

  const selectedRoute = rankedRoutes[activeRouteIdx] || rankedRoutes[0];

  const mapHotspots = useMemo(() => {
    return locations.map(l => ({
      id: l.id,
      lat: l.lat,
      lng: l.lng,
      name: l.name,
      zone: l.zone,
      count: ['LOC-001','LOC-002','LOC-003','LOC-010'].includes(l.id) ? 18 : 4,
      severity: ['LOC-001','LOC-002','LOC-003','LOC-010'].includes(l.id) ? 'High' : 'Moderate',
      color: ['LOC-001','LOC-002','LOC-003','LOC-010'].includes(l.id) ? '#E53E3E' : '#D69E2E',
    }));
  }, [locations]);

  const handleSwap = () => {
    const tmp = originId;
    setOriginId(destId);
    setDestId(tmp);
    setActiveRouteIdx(0);
    toast.success('Origin & destination swapped!');
  };

  const availableDests = AREA_OPTIONS.filter(a => a.id !== originId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display font-bold text-xl text-text-primary">Safe Route Finder</h2>
        <p className="text-xs text-text-secondary">
          Find routes ranked by safety &amp; traffic camera violation score across Bengaluru
        </p>
      </div>

      {/* Input controls */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-card grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="text-xs font-semibold text-text-secondary font-display uppercase tracking-wider block mb-1.5">
            <MapPin className="w-3 h-3 inline mr-1" />Origin
          </label>
          <select
            value={originId}
            onChange={e => { setOriginId(e.target.value); setActiveRouteIdx(0); toast.success('Route recalculated!'); }}
            className="w-full bg-surface-2 border border-border rounded px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent"
          >
            {AREA_OPTIONS.map(a => (
              <option key={a.id} value={a.id}>{a.label} ({a.zone})</option>
            ))}
          </select>
        </div>

        <div className="flex items-end justify-center pb-0.5">
          <button
            onClick={handleSwap}
            className="bg-surface-2 border border-border rounded-full p-2 hover:border-accent hover:bg-accent/10 transition-all text-text-muted hover:text-accent"
            title="Swap origin & destination"
          >
            <Route className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-secondary font-display uppercase tracking-wider block mb-1.5">
            <MapPin className="w-3 h-3 inline mr-1" />Destination
          </label>
          <select
            value={destId}
            onChange={e => { setDestId(e.target.value); setActiveRouteIdx(0); toast.success('Route recalculated!'); }}
            className="w-full bg-surface-2 border border-border rounded px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent"
          >
            {availableDests.map(a => (
              <option key={a.id} value={a.id}>{a.label} ({a.zone})</option>
            ))}
          </select>
        </div>

        <Button
          variant="primary"
          onClick={() => { setActiveRouteIdx(0); toast.success('Showing safest route!'); }}
          className="w-full py-2.5 flex items-center justify-center gap-2"
        >
          <Navigation className="w-4 h-4" /> Find Safe Route
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Ranked route cards */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-sm text-text-secondary uppercase tracking-wider">
            Routes Ranked by Safety
          </h3>
          <div className="space-y-3">
            {rankedRoutes.map((route, idx) => {
              const isSelected = idx === activeRouteIdx;
              const badgeVariant = route.riskLabel === 'Safe' ? 'safe' : route.riskLabel === 'Moderate' ? 'warn' : 'danger';

              return (
                <div
                  key={route.id}
                  onClick={() => setActiveRouteIdx(idx)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? 'bg-accent/10 border-accent shadow-card scale-[1.02]'
                      : 'bg-surface border-border hover:border-accent/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-safe text-bg' : idx === 1 ? 'bg-warn text-bg' : 'bg-primary/20 text-primary'
                      }`}>
                        {idx + 1}
                      </span>
                      <h4 className="font-display font-bold text-sm text-text-primary">
                        {idx === 0 ? '🛡️ Safest Choice' : idx === 1 ? '⚡ Balanced' : '🚨 Fastest (Risky)'}
                      </h4>
                    </div>
                    <Badge variant={badgeVariant}>{route.riskLabel}</Badge>
                  </div>

                  <p className="text-xs text-text-secondary font-semibold mt-2">{route.name}</p>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">{route.description}</p>

                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/40 text-xs text-text-secondary">
                    <div className="flex items-center gap-1">
                      <Route className="w-3 h-3 text-text-muted" />
                      <strong className="text-text-primary">{route.distance}</strong>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-text-muted" />
                      <strong className="text-text-primary">{route.duration}</strong>
                    </div>
                    <div>
                      <span className="text-text-muted">Risk:</span>{' '}
                      <strong className={`${
                        route.riskLabel === 'Safe' ? 'text-safe' : route.riskLabel === 'Moderate' ? 'text-warn' : 'text-primary'
                      }`}>{route.riskScore}%</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary card */}
          <div className="p-4 rounded-xl bg-surface-2 border border-border text-xs text-text-secondary space-y-1">
            <p className="font-semibold text-text-primary font-display">ℹ️ How We Rank Routes</p>
            <p>Risk score is calculated from the density of traffic violations logged by officers at locations along each route — higher score = more cameras &amp; enforcement.</p>
          </div>
        </div>

        {/* Map */}
        <div className="xl:col-span-2 bg-surface border border-border rounded-xl overflow-hidden shadow-card flex flex-col h-[520px]">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h4 className="font-display font-bold text-sm text-text-primary">
                {originArea?.label} → {destArea?.label}
              </h4>
              <p className="text-xs text-text-muted">
                {selectedRoute?.name || 'Select a route'} · {selectedRoute?.distance} · {selectedRoute?.duration}
              </p>
            </div>
            {selectedRoute?.riskLabel === 'Safe' ? (
              <div className="flex items-center gap-1.5 text-xs text-safe bg-safe/10 px-2 py-1 rounded-md border border-safe/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Optimal Safe Path
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-warn bg-warn/10 px-2 py-1 rounded-md border border-warn/20">
                <AlertTriangle className="w-3.5 h-3.5" /> Camera Enforcement Zone
              </div>
            )}
          </div>
          <div className="flex-1">
            <MapWrapper
              markers={mapHotspots}
              routes={rankedRoutes}
              activeRouteIndex={activeRouteIdx}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteSafetyFinder;
