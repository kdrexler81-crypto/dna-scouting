// src/context/AppContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// 1. Create the Context (The "Data Center")
const AppContext = createContext();

// 2. Create a custom hook so any file can easily access the data
export const useApp = () => useContext(AppContext);

// 3. Create the Provider (The wrapper that holds the state)
export const AppProvider = ({ children }) => {
  const [firebase, setFirebase] = useState({ app: null, auth: null, db: null, storage: null, appId: null, isFirebaseActive: false });
  const [players, setPlayers] = useState([]);
  const [news, setNews] = useState([]);
  const [scouts, setScouts] = useState([]);
  const [dbStatus, setDbStatus] = useState("OFFLINE");

  const [authRole, setAuthRole] = useState(() => sessionStorage.getItem('dna_auth_role') || null);
  const [recruiterData, setRecruiterData] = useState(() => JSON.parse(sessionStorage.getItem('dna_recruiter_data')) || null);
  const [familyData, setFamilyData] = useState(() => JSON.parse(sessionStorage.getItem('dna_family_data')) || null);

  // Initialize Firebase once
  useEffect(() => {
    try {
      const config = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
      };
      if (config.apiKey) {
        const app = initializeApp(config);
        setFirebase({ app, auth: getAuth(app), db: getFirestore(app), storage: getStorage(app), appId: config.appId, isFirebaseActive: true });
      }
    } catch (e) { console.error("Firebase init error", e); }
  }, []);

  // Live Sync the Database
  useEffect(() => {
    const { db, appId, isFirebaseActive } = firebase;
    if (!isFirebaseActive || !db) return;
    
    setDbStatus("CONNECTING...");
    const unsubPlayers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'players'), snap => {
      setPlayers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubNews = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'news'), snap => {
      setNews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setDbStatus("LIVE SYNC");
    });
    const unsubScouts = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'recruiters'), snap => {
      setScouts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubPlayers(); unsubNews(); unsubScouts(); };
  }, [firebase]);

  // Bundle all the data and functions we want to share globally
  const value = {
    ...firebase,
    players, news, scouts, dbStatus,
    authRole, setAuthRole,
    recruiterData, setRecruiterData,
    familyData, setFamilyData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};