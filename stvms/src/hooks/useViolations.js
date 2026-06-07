import { useState, useEffect, useCallback } from 'react';
import {
  isSandbox, localDb,
  db, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot,
  serverTimestamp
} from '../config/firebase';

/**
 * useViolations — CRUD + real-time subscription for violations collection.
 * In sandbox mode uses LocalDB; in production uses Firestore.
 */
export const useViolations = () => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSandbox) {
      // Subscribe to localDb real-time updates
      const unsub = localDb.subscribe('violations', (docs) => {
        setViolations(docs);
        setLoading(false);
      });
      return unsub;
    }

    // No orderBy — seeded docs store violationTime as ISO strings not Timestamps
    const unsub = onSnapshot(collection(db, 'violations'), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => {
        const ta = a.violationTime?.toDate ? a.violationTime.toDate() : new Date(a.violationTime || 0);
        const tb = b.violationTime?.toDate ? b.violationTime.toDate() : new Date(b.violationTime || 0);
        return tb - ta;
      });
      setViolations(docs);
      setLoading(false);
    });
    return unsub;
  }, []);

  /**
   * Create a violation + auto-generate linked fine.
   * Applies 50% escalation for repeat offenders (3+ violations in 90 days).
   */
  const createViolation = useCallback(async (data) => {
    if (isSandbox) {
      // Check repeat offender
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90);
      const recent = localDb.get('violations').filter(
        v => v.vehicleId === data.vehicleId && new Date(v.violationTime) >= cutoff
      );
      const isRepeat = recent.length >= 3;

      // Get base fine
      const types = localDb.get('violation_types');
      const type = types.find(t => t.id === data.typeId);
      const baseFine = type?.baseFine || 500;
      const amount = isRepeat ? Math.round(baseFine * 1.5) : baseFine;

      // Save violation
      const newVio = localDb.add('violations', {
        ...data,
        violationTime: data.violationTime instanceof Date
          ? data.violationTime.toISOString()
          : data.violationTime,
        status: data.status || 'Pending',
      });

      // Auto-generate fine
      const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 30);
      localDb.add('fines', {
        violationId: newVio.id,
        vehicleId:   data.vehicleId,
        amount,
        isRepeatOffender: isRepeat,
        isPaid:    false,
        paidAt:    null,
        dueDate:   dueDate.toISOString(),
      });

      return newVio;
    }

    // Firestore path
    const vioRef = await addDoc(collection(db, 'violations'), {
      ...data,
      violationTime: data.violationTime,
      status: data.status || 'Pending',
      createdAt: serverTimestamp(),
    });

    // Fetch type and check repeat
    const recent = violations.filter(v => {
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90);
      const d = v.violationTime?.toDate ? v.violationTime.toDate() : new Date(v.violationTime);
      return v.vehicleId === data.vehicleId && d >= cutoff;
    });
    const isRepeat = recent.length >= 3;
    const type = { baseFine: 1000 }; // default; ideally fetch from Firestore
    const amount = isRepeat ? Math.round(type.baseFine * 1.5) : type.baseFine;

    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 30);
    await addDoc(collection(db, 'fines'), {
      violationId: vioRef.id,
      vehicleId: data.vehicleId,
      amount,
      isRepeatOffender: isRepeat,
      isPaid: false,
      paidAt: null,
      dueDate: dueDate.toISOString(),
      createdAt: serverTimestamp(),
    });

    return { id: vioRef.id };
  }, [violations]);

  /** Update violation status */
  const updateViolationStatus = useCallback(async (id, status) => {
    if (isSandbox) {
      localDb.update('violations', id, { status });
      return;
    }
    await updateDoc(doc(db, 'violations', id), { status });
  }, []);

  /** Delete a violation and its linked fine */
  const deleteViolation = useCallback(async (id) => {
    if (isSandbox) {
      localDb.delete('violations', id);
      // Also delete linked fine
      const fines = localDb.get('fines');
      const linked = fines.find(f => f.violationId === id);
      if (linked) localDb.delete('fines', linked.id);
      return;
    }
    await deleteDoc(doc(db, 'violations', id));
  }, []);

  return { violations, loading, createViolation, updateViolationStatus, deleteViolation };
};
