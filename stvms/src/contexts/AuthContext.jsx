import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth, db, isSandbox, localDb,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut
} from '../config/firebase';

const AuthContext = createContext(null);

// Demo user profiles
const DEMO_OFFICER = {
  uid: 'demo-officer-001',
  email: 'ravi@stvms.gov',
  name: 'Officer Ravi Kumar',
  badgeNumber: 'KA-2024-TF-042',
  role: 'officer',
  zone: 'Central',
  jurisdiction: 'Bengaluru Urban',
};

const DEMO_CITIZEN = {
  uid: 'demo-citizen-001',
  email: 'citizen@stvms.in',
  name: 'Priya Sharma',
  regNumber: 'KA-01-MF-3456',
  role: 'citizen',
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hydrate from localStorage for sandbox
    if (isSandbox) {
      const saved = localStorage.getItem('stvms_session');
      if (saved) {
        try { setCurrentUser(JSON.parse(saved)); } catch { }
      }
      setLoading(false);
      return;
    }

    // Firebase auth state
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Try to load officer/citizen profile from Firestore
        try {
          const officerDoc = await db.collection('officers').doc(firebaseUser.uid).get();
          if (officerDoc.exists) {
            setCurrentUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'officer', ...officerDoc.data() });
            setLoading(false); return;
          }
          const citizenDoc = await db.collection('citizens').doc(firebaseUser.uid).get();
          if (citizenDoc.exists) {
            setCurrentUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'citizen', ...citizenDoc.data() });
            setLoading(false); return;
          }
        } catch { }
        setCurrentUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'officer' });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const saveSession = (user) => {
    localStorage.setItem('stvms_session', JSON.stringify(user));
    setCurrentUser(user);
  };

  /** Officer login */
  const login = async (email, password) => {
    if (isSandbox) {
      // Accept demo credentials or any password
      if (email === DEMO_OFFICER.email || email.endsWith('@stvms.gov')) {
        saveSession({ ...DEMO_OFFICER, email });
        return;
      }
      throw new Error('Officer not found in sandbox. Use ' + DEMO_OFFICER.email);
    }
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // Role will be resolved in onAuthStateChanged
  };

  /** Citizen login / register */
  const loginCitizen = async (email, password, profile = null, isRegister = false) => {
    if (isSandbox) {
      if (email === DEMO_CITIZEN.email || email.endsWith('@stvms.in') || !isRegister) {
        const user = profile
          ? { ...DEMO_CITIZEN, ...profile, email }
          : { ...DEMO_CITIZEN, email };
        saveSession(user);
        return;
      }
      if (isRegister && profile) {
        const newUser = { uid: `citizen-${Date.now()}`, ...DEMO_CITIZEN, ...profile, email };
        saveSession(newUser);
        // Also store in localDb
        const citizens = localDb.get('citizens') || [];
        citizens.push({ id: newUser.uid, ...newUser });
        localDb.set('citizens', citizens);
        return;
      }
      throw new Error('Citizen not found. Use ' + DEMO_CITIZEN.email);
    }
    if (isRegister) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (profile) {
        await db.collection('citizens').doc(cred.user.uid).set({ ...profile, email });
      }
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  };

  /** Demo bypass – no credentials needed */
  const loginAsDemo = (role = 'officer') => {
    const user = role === 'citizen' ? DEMO_CITIZEN : DEMO_OFFICER;
    saveSession(user);
  };

  const logout = async () => {
    if (isSandbox) {
      localStorage.removeItem('stvms_session');
      setCurrentUser(null);
      return;
    }
    await signOut(auth);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      login,
      loginCitizen,
      loginAsDemo,
      logout,
      sandboxMode: isSandbox,
      isOfficer: currentUser?.role === 'officer',
      isCitizen: currentUser?.role === 'citizen',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
