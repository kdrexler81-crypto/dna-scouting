// src/hooks/useColleges.js
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import COLLEGES_JSON from '../data/colleges.json';

export const useColleges = (db, appId, isFirebaseActive = true) => {
  const [colleges, setColleges] = useState(COLLEGES_JSON);
  const [loadingColleges, setLoadingColleges] = useState(true);

  useEffect(() => {
    if (!isFirebaseActive || !db || !appId) {
      setColleges(COLLEGES_JSON);
      setLoadingColleges(false);
      return;
    }

    const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'colleges');
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        if (!snap.empty) {
          const liveList = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          setColleges(liveList);
        } else {
          // Keep colleges.json as fallback until you click "Sync from JSON" in AdminPanel
          setColleges(COLLEGES_JSON);
        }
        setLoadingColleges(false);
      },
      (err) => {
        console.warn('Firestore colleges listener failed, using local fallback:', err.message);
        setColleges(COLLEGES_JSON);
        setLoadingColleges(false);
      }
    );

    return () => unsub();
  }, [db, appId, isFirebaseActive]);

  return { colleges, loadingColleges };
};