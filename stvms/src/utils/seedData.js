/**
 * seedData.js — Generates realistic demo data for STVMS sandbox mode
 * Covers Bengaluru traffic zones, violation types, vehicles, officers,
 * violations, fines, citizens, locations, and contests.
 */

const uid = (prefix = 'ID') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 14) + 7); // 7am–9pm
  d.setMinutes(Math.floor(Math.random() * 60));
  return d.toISOString();
};

// ── Static Reference Data ──────────────────────────────────────────────────

const LOCATIONS = [
  // Central Zone
  { id: 'LOC-001', name: 'MG Road Metro Junction',      zone: 'Central',   lat: 12.9756, lng: 77.6097, type: 'Intersection' },
  { id: 'LOC-013', name: 'Trinity Circle',              zone: 'Central',   lat: 12.9731, lng: 77.6172, type: 'Circle' },
  { id: 'LOC-014', name: 'Brigade Road Signal',         zone: 'Central',   lat: 12.9705, lng: 77.6067, type: 'Signal' },
  { id: 'LOC-015', name: 'Kinnara Circle (Hudson Cir)', zone: 'Central',   lat: 12.9698, lng: 77.5891, type: 'Circle' },
  { id: 'LOC-016', name: 'Richmond Circle Flyover',     zone: 'Central',   lat: 12.9602, lng: 77.5982, type: 'Flyover' },
  
  // South Zone
  { id: 'LOC-002', name: 'Silk Board Junction',         zone: 'South',     lat: 12.9176, lng: 77.6233, type: 'Flyover' },
  { id: 'LOC-004', name: 'Koramangala 100ft Rd Signal', zone: 'South',     lat: 12.9352, lng: 77.6245, type: 'Signal' },
  { id: 'LOC-008', name: 'JP Nagar 3rd Phase Signal',   zone: 'South',     lat: 12.9063, lng: 77.5857, type: 'Signal' },
  { id: 'LOC-017', name: 'Jayanagar 4th Block Circle',  zone: 'South',     lat: 12.9290, lng: 77.5830, type: 'Circle' },
  { id: 'LOC-018', name: 'Banashankari TTMC Signal',    zone: 'South',     lat: 12.9156, lng: 77.5736, type: 'Signal' },
  { id: 'LOC-019', name: 'BTM Layout Water Tank Junc',  zone: 'South',     lat: 12.9165, lng: 77.6101, type: 'Intersection' },
  
  // North Zone
  { id: 'LOC-003', name: 'Hebbal Flyover Junction',     zone: 'North',     lat: 13.0359, lng: 77.5970, type: 'Flyover' },
  { id: 'LOC-020', name: 'Mekhri Circle Underpass',     zone: 'North',     lat: 13.0145, lng: 77.5898, type: 'Underpass' },
  { id: 'LOC-021', name: 'RT Nagar Police Station Junc',zone: 'North',     lat: 13.0182, lng: 77.5925, type: 'Intersection' },
  { id: 'LOC-022', name: 'Yelahanka Police Station Junc',zone: 'North',    lat: 13.1008, lng: 77.5963, type: 'Intersection' },
  { id: 'LOC-023', name: 'Mathikere Cross',             zone: 'North',     lat: 13.0334, lng: 77.5641, type: 'Road' },
  
  // East Zone
  { id: 'LOC-005', name: 'Whitefield ITPL Main Road',   zone: 'East',      lat: 12.9868, lng: 77.7399, type: 'Road' },
  { id: 'LOC-007', name: 'Indiranagar 12th Main Road',  zone: 'East',      lat: 12.9784, lng: 77.6408, type: 'Road' },
  { id: 'LOC-010', name: 'Marathahalli Multiplex Junc', zone: 'East',      lat: 12.9591, lng: 77.6974, type: 'Intersection' },
  { id: 'LOC-011', name: 'KR Puram Hanging Bridge',     zone: 'East',      lat: 13.0007, lng: 77.6951, type: 'Bridge' },
  { id: 'LOC-024', name: 'HAL Old Airport Road',        zone: 'East',      lat: 12.9602, lng: 77.6601, type: 'Road' },
  { id: 'LOC-025', name: 'Hoodi Circle',                zone: 'East',      lat: 12.9918, lng: 77.7161, type: 'Circle' },
  { id: 'LOC-026', name: 'Varthur Kodi Junction',       zone: 'East',      lat: 12.9555, lng: 77.7472, type: 'Intersection' },

  // West Zone
  { id: 'LOC-006', name: 'Yeshwanthpur Metro Station',  zone: 'West',      lat: 13.0227, lng: 77.5432, type: 'Intersection' },
  { id: 'LOC-009', name: 'Malleshwaram 8th Cross',      zone: 'West',      lat: 13.0035, lng: 77.5700, type: 'Circle' },
  { id: 'LOC-012', name: 'Rajajinagar 1st Block',       zone: 'West',      lat: 12.9924, lng: 77.5535, type: 'Circle' },
  { id: 'LOC-027', name: 'Vijayanagar Bus Stand Junc',  zone: 'West',      lat: 12.9682, lng: 77.5372, type: 'Intersection' },
  { id: 'LOC-028', name: 'Nayandahalli Metro Junc',     zone: 'West',      lat: 12.9515, lng: 77.5255, type: 'Intersection' },
  { id: 'LOC-029', name: 'Kengeri Satellite Town',     zone: 'West',      lat: 12.9174, lng: 77.4839, type: 'Road' }
];

const VIOLATION_TYPES = [
  { id: 'VT-001', name: 'Signal Jumping',        baseFine: 1000, severity: 'High',   points: 3 },
  { id: 'VT-002', name: 'Over Speeding',         baseFine: 2000, severity: 'High',   points: 4 },
  { id: 'VT-003', name: 'No Helmet',             baseFine: 500,  severity: 'Medium', points: 2 },
  { id: 'VT-004', name: 'Triple Riding',         baseFine: 1000, severity: 'Medium', points: 2 },
  { id: 'VT-005', name: 'Drunk Driving',         baseFine: 5000, severity: 'Critical',points: 6 },
  { id: 'VT-006', name: 'No Seat Belt',          baseFine: 500,  severity: 'Low',    points: 1 },
  { id: 'VT-007', name: 'Wrong Side Driving',    baseFine: 1500, severity: 'High',   points: 3 },
  { id: 'VT-008', name: 'No Parking Violation',  baseFine: 500,  severity: 'Low',    points: 1 },
  { id: 'VT-009', name: 'Using Mobile While Driving', baseFine: 1000, severity: 'Medium', points: 2 },
  { id: 'VT-010', name: 'Overloading',           baseFine: 2000, severity: 'High',   points: 3 },
  { id: 'VT-011', name: 'No Valid Licence',      baseFine: 5000, severity: 'Critical',points: 5 },
  { id: 'VT-012', name: 'No Insurance',          baseFine: 2000, severity: 'High',   points: 3 },
];

const OFFICERS = [
  { id: 'OFF-001', name: 'Officer Ravi Kumar',       email: 'ravi@stvms.gov',    badgeNumber: 'KA-2024-TF-042', zone: 'Central', jurisdiction: 'Bengaluru Urban' },
  { id: 'OFF-002', name: 'Officer Preethi Singh',    email: 'preethi@stvms.gov', badgeNumber: 'KA-2024-TF-031', zone: 'South',   jurisdiction: 'Bengaluru Urban' },
  { id: 'OFF-003', name: 'Officer Manjunath Rao',    email: 'manju@stvms.gov',   badgeNumber: 'KA-2023-TF-019', zone: 'North',   jurisdiction: 'Bengaluru Urban' },
  { id: 'OFF-004', name: 'Officer Deepika Nair',     email: 'deepika@stvms.gov', badgeNumber: 'KA-2024-TF-055', zone: 'East',    jurisdiction: 'Bengaluru Urban' },
];

const CITIZENS = [
  { id: 'CIT-001', name: 'Priya Sharma',      email: 'citizen@stvms.in',    phone: '9876543210', regNumber: 'KA-01-MF-3456' },
  { id: 'CIT-002', name: 'Arjun Gowda',       email: 'arjun@example.com',   phone: '9845012345', regNumber: 'KA-05-HK-7890' },
  { id: 'CIT-003', name: 'Lakshmi Reddy',     email: 'lakshmi@example.com', phone: '9731234567', regNumber: 'KA-02-AB-2233' },
  { id: 'CIT-004', name: 'Mohammed Farhan',   email: 'farhan@example.com',  phone: '9900112233', regNumber: 'KA-53-CX-9900' },
  { id: 'CIT-005', name: 'Sneha Kulkarni',    email: 'sneha@example.com',   phone: '8877665544', regNumber: 'KA-01-ZZ-0001' },
];

// Vehicle pool — mix of all citizen vehicles + some extra
const VEHICLE_POOL = [
  { id: 'VEH-001', regNumber: 'KA-01-MF-3456', ownerName: 'Priya Sharma',       ownerPhone: '9876543210', vehicleType: 'Car',   citizenId: 'CIT-001' },
  { id: 'VEH-002', regNumber: 'KA-05-HK-7890', ownerName: 'Arjun Gowda',        ownerPhone: '9845012345', vehicleType: 'Bike',  citizenId: 'CIT-002' },
  { id: 'VEH-003', regNumber: 'KA-02-AB-2233', ownerName: 'Lakshmi Reddy',      ownerPhone: '9731234567', vehicleType: 'Car',   citizenId: 'CIT-003' },
  { id: 'VEH-004', regNumber: 'KA-53-CX-9900', ownerName: 'Mohammed Farhan',    ownerPhone: '9900112233', vehicleType: 'Auto',  citizenId: 'CIT-004' },
  { id: 'VEH-005', regNumber: 'KA-01-ZZ-0001', ownerName: 'Sneha Kulkarni',     ownerPhone: '8877665544', vehicleType: 'Bike',  citizenId: 'CIT-005' },
  { id: 'VEH-006', regNumber: 'KA-09-QR-5566', ownerName: 'Ramesh Babu',        ownerPhone: '9632587410', vehicleType: 'Truck', citizenId: null },
  { id: 'VEH-007', regNumber: 'KA-03-DC-8800', ownerName: 'Sunita Hegde',       ownerPhone: '7760123456', vehicleType: 'Car',   citizenId: null },
  { id: 'VEH-008', regNumber: 'KA-41-EF-1122', ownerName: 'Kiran Shetty',       ownerPhone: '9988776655', vehicleType: 'Bike',  citizenId: null },
  { id: 'VEH-009', regNumber: 'KA-57-GH-3344', ownerName: 'Ananya Krishnan',    ownerPhone: '8765432109', vehicleType: 'Car',   citizenId: null },
  { id: 'VEH-010', regNumber: 'KA-01-AB-9999', ownerName: 'Venkatesh Murthy',   ownerPhone: '9876012345', vehicleType: 'Bus',   citizenId: null },
  // Repeat offenders
  { id: 'VEH-011', regNumber: 'KA-19-RT-6677', ownerName: 'Harish Srinivas',    ownerPhone: '9811223344', vehicleType: 'Car',   citizenId: null },
  { id: 'VEH-012', regNumber: 'KA-04-LM-4488', ownerName: 'Vinayak Pai',        ownerPhone: '9654321087', vehicleType: 'Bike',  citizenId: null },
];

// ── Generate Violations + Fines ───────────────────────────────────────────────

function generateViolationsAndFines() {
  const violations = [];
  const fines      = [];

  // Track recent violations per vehicle for repeat-offender escalation
  const vehicleRecentCounts = {};

  // Helper: check if a vehicle has >= 3 violations in last 90 days at time of logging
  const isRepeat = (vehicleId, atDate) => {
    const cutoff = new Date(atDate);
    cutoff.setDate(cutoff.getDate() - 90);
    return (violations
      .filter(v => v.vehicleId === vehicleId && new Date(v.violationTime) >= cutoff)
      .length) >= 3;
  };

  // Generate ~80 violations spread over 60 days
  const allPairs = [
    // High-frequency repeat offenders
    ...Array(6).fill('VEH-011'),
    ...Array(5).fill('VEH-012'),
    ...Array(4).fill('VEH-002'),
    // Regular
    ...Array(3).fill('VEH-001'),
    ...Array(3).fill('VEH-003'),
    ...Array(2).fill('VEH-004'),
    ...Array(2).fill('VEH-005'),
    ...Array(3).fill('VEH-006'),
    ...Array(2).fill('VEH-007'),
    ...Array(2).fill('VEH-008'),
    ...Array(3).fill('VEH-009'),
    ...Array(2).fill('VEH-010'),
  ];

  allPairs.forEach((vehicleId, i) => {
    const dayOffset = Math.floor(Math.random() * 60);
    const vioTime = daysAgo(dayOffset);
    const type = randomFrom(VIOLATION_TYPES);
    const loc  = randomFrom(LOCATIONS);
    const officer = randomFrom(OFFICERS);
    const statuses = ['Pending', 'Pending', 'Pending', 'Contested', 'Closed'];
    const status = i < 5 ? 'Pending' : randomFrom(statuses);

    const vioId = `VIO-${String(violations.length + 1).padStart(4, '0')}`;
    violations.push({
      id: vioId,
      vehicleId,
      officerId:        officer.id,
      locationId:       loc.id,
      typeId:           type.id,
      violationTime:    vioTime,
      evidenceImageUrl: '',
      status,
      createdAt:        vioTime,
    });

    // Fine amount — 50% escalation for repeat offenders
    const repeat = isRepeat(vehicleId, vioTime);
    const amount = repeat ? Math.round(type.baseFine * 1.5) : type.baseFine;
    const dueDate = new Date(vioTime);
    dueDate.setDate(dueDate.getDate() + 30);

    const isPaid = status === 'Closed' ? Math.random() > 0.2 : Math.random() > 0.7;
    const paidAt = isPaid ? new Date(new Date(vioTime).getTime() + Math.random() * 15 * 86400000).toISOString() : null;

    fines.push({
      id: `FIN-${String(fines.length + 1).padStart(4, '0')}`,
      violationId: vioId,
      vehicleId,
      amount,
      isRepeatOffender: repeat,
      isPaid,
      paidAt,
      dueDate: dueDate.toISOString(),
      createdAt: vioTime,
    });
  });

  return { violations, fines };
}

// ── Main seedData export ───────────────────────────────────────────────────────

export const seedData = () => {
  const { violations, fines } = generateViolationsAndFines();

  return {
    officers:        OFFICERS,
    citizens:        CITIZENS,
    vehicles:        VEHICLE_POOL,
    locations:       LOCATIONS,
    violation_types: VIOLATION_TYPES,
    violations,
    fines,
    contests:        [],
  };
};
