/**
 * firebase.js — STVMS Firebase configuration + Sandbox LocalDB fallback
 *
 * If valid Firebase credentials are present in .env, connects to real Firebase.
 * Otherwise, uses a localStorage-backed LocalDB class for demo/sandbox mode.
 */
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, doc, getDoc, getDocs, addDoc, setDoc,
  updateDoc, deleteDoc, onSnapshot, query, where, orderBy, serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { seedData } from '../utils/seedData';

// ── Read env vars ─────────────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Detect sandbox mode: missing or placeholder API key
export const isSandbox =
  !FIREBASE_CONFIG.apiKey ||
  FIREBASE_CONFIG.apiKey === 'YOUR_FIREBASE_API_KEY' ||
  FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY' ||
  FIREBASE_CONFIG.apiKey === '' ||
  FIREBASE_CONFIG.apiKey.startsWith('VITE_');

// ── LocalDB — localStorage-backed database for sandbox mode ──────────────────
const SEED_KEY = 'stvms_seeded_v3';

class LocalDatabase {
  constructor() {
    this._listeners = {};
    if (!localStorage.getItem(SEED_KEY)) {
      this._seed();
    }
  }

  _seed() {
    const data = seedData();
    Object.entries(data).forEach(([collection, docs]) => {
      this.set(collection, docs);
    });
    localStorage.setItem(SEED_KEY, '1');
    console.info('[STVMS Sandbox] Database seeded with demo data.');
  }

  get(collectionName) {
    try {
      return JSON.parse(localStorage.getItem(`stvms_${collectionName}`) || '[]');
    } catch {
      return [];
    }
  }

  set(collectionName, data) {
    localStorage.setItem(`stvms_${collectionName}`, JSON.stringify(data));
    this._notify(collectionName);
  }

  getById(collectionName, id) {
    return this.get(collectionName).find(d => d.id === id) || null;
  }

  add(collectionName, docData) {
    const docs = this.get(collectionName);
    const newDoc = {
      ...docData,
      id: `${collectionName.slice(0, 3).toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };
    docs.push(newDoc);
    this.set(collectionName, docs);
    return newDoc;
  }

  update(collectionName, id, updates) {
    const docs = this.get(collectionName);
    const idx = docs.findIndex(d => d.id === id);
    if (idx === -1) throw new Error(`Document ${id} not found in ${collectionName}`);
    docs[idx] = { ...docs[idx], ...updates, updatedAt: new Date().toISOString() };
    this.set(collectionName, docs);
    return docs[idx];
  }

  delete(collectionName, id) {
    const docs = this.get(collectionName).filter(d => d.id !== id);
    this.set(collectionName, docs);
  }

  // Pub/sub for real-time listeners
  subscribe(collectionName, callback) {
    if (!this._listeners[collectionName]) this._listeners[collectionName] = [];
    this._listeners[collectionName].push(callback);
    // Fire immediately
    callback(this.get(collectionName));
    // Return unsubscribe function
    return () => {
      this._listeners[collectionName] = this._listeners[collectionName].filter(cb => cb !== callback);
    };
  }

  _notify(collectionName) {
    (this._listeners[collectionName] || []).forEach(cb => cb(this.get(collectionName)));
  }

  reset() {
    localStorage.removeItem(SEED_KEY);
    this._seed();
  }
}

export const localDb = new LocalDatabase();

// ── Firebase init (only when NOT in sandbox) ──────────────────────────────────
let app, db, auth;

if (!isSandbox) {
  try {
    app  = initializeApp(FIREBASE_CONFIG);
    db   = getFirestore(app);
    auth = getAuth(app);
  } catch (err) {
    console.error('[STVMS] Firebase init failed:', err);
  }
} else {
  // Stub objects so imports don't fail
  auth = {
    onAuthStateChanged: (cb) => { cb(null); return () => {}; },
    currentUser: null,
  };
  db = null;
  console.info('[STVMS] Running in Sandbox Mode — no Firebase connection.');
}

// ── Exports ───────────────────────────────────────────────────────────────────
export {
  db, auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  // Firestore helpers (used only when db is real)
  collection, doc, getDoc, getDocs, addDoc, setDoc,
  updateDoc, deleteDoc, onSnapshot, query, where, orderBy,
  serverTimestamp, Timestamp
};
