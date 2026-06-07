import { useState, useEffect, useCallback } from 'react';
import {
  isSandbox, localDb,
  db, collection, updateDoc, doc, onSnapshot
} from '../config/firebase';

/**
 * useFines — Real-time fines with mark-paid capability
 */
export const useFines = () => {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSandbox) {
      const unsub = localDb.subscribe('fines', (docs) => {
        setFines(docs);
        setLoading(false);
      });
      return unsub;
    }

    // No orderBy — seeded docs use ISO string dates not Firestore Timestamps
    const unsub = onSnapshot(collection(db, 'fines'), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by dueDate descending client-side
      docs.sort((a, b) => new Date(b.dueDate || 0) - new Date(a.dueDate || 0));
      setFines(docs);
      setLoading(false);
    });
    return unsub;
  }, []);

  /** Mark a fine as paid — sets isPaid=true and records paidAt timestamp */
  const markFinePaid = useCallback(async (id) => {
    const paidAt = new Date().toISOString();
    if (isSandbox) {
      localDb.update('fines', id, { isPaid: true, paidAt });
      return;
    }
    await updateDoc(doc(db, 'fines', id), { isPaid: true, paidAt });
  }, []);

  /** Update fine amount (for waiver/escalation scenarios) */
  const updateFineAmount = useCallback(async (id, amount) => {
    if (isSandbox) {
      localDb.update('fines', id, { amount });
      return;
    }
    await updateDoc(doc(db, 'fines', id), { amount });
  }, []);

  return { fines, loading, markFinePaid, updateFineAmount };
};
