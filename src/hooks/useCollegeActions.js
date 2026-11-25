// src/hooks/useCollegeActions.js
import { useState } from 'react';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';

export const useCollegeActions = ({ db, appId, linkedPlayer, userEmail }) => {
  const [savingTarget, setSavingTarget] = useState(null);
  const [reportingSchool, setReportingSchool] = useState(null);

  const targetSchools = Array.isArray(linkedPlayer?.targetSchools)
    ? linkedPlayer.targetSchools
    : [];

  const isTargetSchool = (schoolName) =>
    targetSchools.some(
      (s) => (s.name || '').toLowerCase() === (schoolName || '').toLowerCase()
    );

  // Add or remove a school from the athlete's Target List
  const toggleTargetSchool = async (school) => {
    if (!db || !linkedPlayer?.id) {
      alert('Please log in to your Family or Athlete account to save Target Schools.');
      return;
    }

    setSavingTarget(school.name);
    try {
      const alreadySaved = isTargetSchool(school.name);
      const updatedList = alreadySaved
        ? targetSchools.filter(
            (s) => (s.name || '').toLowerCase() !== (school.name || '').toLowerCase()
          )
        : [
            ...targetSchools,
            {
              name: school.name || '',
              state: school.state || '',
              division: school.division || '',
              coach: school.coach || 'TBA',
              email: school.email || '',
              addedAt: Date.now()
            }
          ];

      const playerRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', linkedPlayer.id);
      await updateDoc(playerRef, {
        targetSchools: updatedList,
        updatedAt: Date.now()
      });
    } catch (err) {
      alert('Could not update Target Schools: ' + err.message);
    } finally {
      setSavingTarget(null);
    }
  };

  // Send an outdated coach/email report straight to the Admin Panel queue
  const reportOutdatedSchool = async (school) => {
    if (!db) return;
    const note = window.prompt(
      `Report outdated info for ${school.name}:\n(Example: "New head coach", "Email bounced", or "Wrong division")`
    );
    if (!note || !note.trim()) return;

    setReportingSchool(school.name);
    try {
      const pendingRef = collection(db, 'artifacts', appId, 'public', 'data', 'pendingCollegeUpdates');
      await addDoc(pendingRef, {
        title: `${school.name} — User Report: ${note.trim()}`,
        type: 'USER REPORT',
        link: school.questionnaireUrl || '',
        source: userEmail || 'Family Portal User',
        status: 'pending',
        timestamp: Date.now()
      });
      alert(`Thanks! Your update for ${school.name} has been sent to the DNA Admin team.`);
    } catch (err) {
      alert('Could not submit report (make sure you are logged in): ' + err.message);
    } finally {
      setReportingSchool(null);
    }
  };

  return {
    targetSchools,
    isTargetSchool,
    toggleTargetSchool,
    reportOutdatedSchool,
    savingTarget,
    reportingSchool
  };
};