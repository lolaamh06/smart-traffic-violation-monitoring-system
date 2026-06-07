import { db, collection, addDoc, setDoc, doc } from '../config/firebase';
import { seedData } from './seedData';

/**
 * Seeds a real Firestore instance with structured documents.
 * Run this by clicking the "Seed Database" button in settings or setup.
 */
export const seedFirestore = async () => {
  const data = seedData();
  const errors = [];

  try {
    // 1. Seed static location metadata
    for (const loc of data.locations) {
      await setDoc(doc(db, 'locations', loc.id), loc);
    }

    // 2. Seed static violation types
    for (const vt of data.violation_types) {
      await setDoc(doc(db, 'violation_types', vt.id), vt);
    }

    // 3. Seed demo officers
    for (const off of data.officers) {
      await setDoc(doc(db, 'officers', off.id), {
        name: off.name,
        email: off.email,
        badgeNumber: off.badgeNumber,
        zone: off.zone,
        jurisdiction: off.jurisdiction,
        role: 'officer'
      });
    }

    // 4. Seed demo citizens
    for (const cit of data.citizens) {
      await setDoc(doc(db, 'citizens', cit.id), {
        name: cit.name,
        email: cit.email,
        phone: cit.phone,
        regNumber: cit.regNumber,
        role: 'citizen'
      });
    }

    // 5. Seed vehicles
    for (const veh of data.vehicles) {
      await setDoc(doc(db, 'vehicles', veh.id), veh);
    }

    // 6. Seed a subset of violations and fines to keep write footprint low but complete
    const sampleViolations = data.violations.slice(0, 15);
    for (const vio of sampleViolations) {
      await setDoc(doc(db, 'violations', vio.id), vio);
    }

    const sampleFines = data.fines.slice(0, 15);
    for (const fine of sampleFines) {
      await setDoc(doc(db, 'fines', fine.id), fine);
    }

    return { success: true };
  } catch (err) {
    console.error('Firestore Seeding Error: ', err);
    return { success: false, error: err.message };
  }
};
