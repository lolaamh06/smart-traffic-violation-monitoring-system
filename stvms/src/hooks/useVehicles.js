import { useState, useEffect, useCallback } from 'react';
import {
  isSandbox, localDb,
  db, collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, serverTimestamp
} from '../config/firebase';

/**
 * useVehicles — Real-time vehicle registry with CRUD
 */
export const useVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSandbox) {
      const unsub = localDb.subscribe('vehicles', (docs) => {
        setVehicles(docs);
        setLoading(false);
      });
      return unsub;
    }

    const q = collection(db, 'vehicles');
    const unsub = onSnapshot(q, (snap) => {
      setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  /** Register a new vehicle */
  const createVehicle = useCallback(async (data) => {
    // Check duplicate reg number
    const existing = vehicles.find(v =>
      v.regNumber?.replace(/[^A-Z0-9]/gi, '').toUpperCase() ===
      data.regNumber?.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    );
    if (existing) throw new Error(`Vehicle ${data.regNumber} is already registered.`);

    if (isSandbox) {
      return localDb.add('vehicles', data);
    }
    const ref = await addDoc(collection(db, 'vehicles'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return { id: ref.id, ...data };
  }, [vehicles]);

  /** Update vehicle details */
  const updateVehicle = useCallback(async (id, updates) => {
    if (isSandbox) {
      return localDb.update('vehicles', id, updates);
    }
    await updateDoc(doc(db, 'vehicles', id), updates);
  }, []);

  /** Remove vehicle from registry */
  const deleteVehicle = useCallback(async (id) => {
    if (isSandbox) {
      localDb.delete('vehicles', id);
      return;
    }
    await deleteDoc(doc(db, 'vehicles', id));
  }, []);

  /** Look up vehicle by reg number */
  const findByRegNumber = useCallback((regNumber) => {
    const clean = r => r?.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    return vehicles.find(v => clean(v.regNumber) === clean(regNumber)) || null;
  }, [vehicles]);

  return { vehicles, loading, createVehicle, updateVehicle, deleteVehicle, findByRegNumber };
};
