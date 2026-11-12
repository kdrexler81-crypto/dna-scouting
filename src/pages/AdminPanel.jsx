// src/pages/AdminPanel.jsx
import React, { useState, useMemo } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, updateDoc, addDoc, collection, deleteDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Activity, Megaphone, Building, Search, Camera, Users, GraduationCap, Trophy, MapPin, Zap, Ruler, ChevronLeft, Key, Check, Copy, Download, Loader2 } from 'lucide-react';
import { AdminScoutApproval } from '../components/admin/AdminScoutApproval';
import { useApp } from '../context/AppContext';

const InputLabel = ({ children }) => <label className="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-widest">{children}</label>;
const FormInput = (props) => <input {...props} className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium focus:outline-none focus:border-[#1c7ed6] focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all ${props.className || ''}`} />;

// Random code generator for brand-new athletes
const generateRandomAccessCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// Deterministic code generator for existing athletes missing an accessCode in Firestore
// (Guarantees the exact same 6-character code every time for a given player ID)
const getStableCodeFromId = (id = '') => {
  let hash = 0;
  const str = String(id) + '_DNA_SALT';
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
};

export const AdminPanel = ({ onBack, onLogout }) => {
  const { app, appId, db, storage, isFirebaseActive: dbConfigured, players, scouts } = useApp();

  const [activeTab, setActiveTab] = useState('athlete');
  const [savingAthlete, setSavingAthlete] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedExistingId, setSelectedExistingId] = useState("");
  const [athleteSearchTerm, setAthleteSearchTerm] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  
  const [newsTitle, setNewsTitle] = useState('');
  const [newsCategory, setNewsCategory] = useState('ANNOUNCEMENT');

  const today = new Date().toISOString().split('T')[0];

  const createDefaultMetrics = () => ({
    name: '', primaryPos: 'QB', secondaryPos: '', gradYear: '', city: '', state: '', dnaTeam: 'None', externalClub: '',
    gpa: '', sat: '', twitter: '', guardianEmail: '', athleteEmail: '', scoutNotes: '', heightFeet: '', heightInches: '', weight: '',
    sprint: '', sprintVerify: 'laser', shuttle: '', shuttleVerify: 'stopwatch', lDrill: '', lDrillVerify: 'stopwatch', mph: '', mphVerify: 'laser',
    broadFeet: '', broadInches: '', verticalInches: '', catchingPct: '', throwingPct: '', flagPullingPct: '', 
    hudlLink: '', stat1Label: 'Touchdowns', stat1Value: '', stat2Label: 'Interceptions', stat2Value: '', stat3Label: 'Yards / Rec', stat3Value: '',
    combineLocation: '', combineDate: today, accessCode: generateRandomAccessCode()
  });

  const [metrics, setMetrics] = useState(() => createDefaultMetrics());

  const filteredAdminPlayers = useMemo(() => {
    let list = [...players];
    if (athleteSearchTerm) {
      list = list.filter(p => p.id === selectedExistingId || (p.name || '').toLowerCase().includes(athleteSearchTerm.toLowerCase()));
    }
    return list.sort((a, b) => (a.name || '').split(' ').slice(-1)[0].localeCompare((b.name || '').split(' ').slice(-1)[0]));
  }, [players, athleteSearchTerm, selectedExistingId]);

  // --- ONE-CLICK BATCH LOCK & CSV EXPORT FOR MAIL MERGE ---
  const handleExportAccessCodesCSV = async () => {
    if (!players || players.length === 0) {
      alert("No athletes found in the database to export.");
      return;
    }

    setExportingCsv(true);
    try {
      const sorted = [...players].sort((a, b) =>
        (a.name || '').split(' ').slice(-1)[0].localeCompare((b.name || '').split(' ').slice(-1)[0])
      );

      // Escape values safely for CSV cells
      const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

      const headers = [
        'Athlete Name',
        'Athlete First Name',
        'Grad Year',
        'Primary Position',
        'DNA Score',
        'Access Code',
        'Guardian Email',
        'Athlete Email',
        'Direct Profile URL'
      ];

      const rows = [];

      for (const p of sorted) {
        const finalCode = p.accessCode || getStableCodeFromId(p.id);

        // If this athlete didn't have their code saved in Firestore yet, lock it into Firestore now!
        if (!p.accessCode && dbConfigured && db && p.id) {
          try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', p.id), {
              accessCode: finalCode
            });
          } catch (err) {
            console.error(`Failed to lock code for ${p.name}:`, err);
          }
        }

        const firstName = (p.name || '').trim().split(' ')[0] || '';
        const profileUrl = `https://www.dnaflagratings.com/player/${p.id}`;

        rows.push([
          escapeCsv(p.name || ''),
          escapeCsv(firstName),
          escapeCsv(p.gradYear || ''),
          escapeCsv(p.primaryPos || p.pos || ''),
          escapeCsv(p.dnaScore || '0.0'),
          escapeCsv(finalCode),
          escapeCsv(p.guardianEmail || p.parentEmail || ''),
          escapeCsv(p.athleteEmail || p.email || ''),
          escapeCsv(profileUrl)
        ].join(','));
      }

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DNA_Athlete_Access_Codes_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error exporting CSV: " + err.message);
    } finally {
      setExportingCsv(false);
    }
  };

  const handleSelectExisting = async (playerId) => {
    setSelectedExistingId(playerId);
    setCodeCopied(false);

    if (!playerId) {
      setMetrics(createDefaultMetrics());
      setPhotoPreview(null);
      return;
    }

    const p = players.find(player => player.id === playerId);
    if (p) {
      // Lock in the existing accessCode, or generate a deterministic one from their ID
      const lockedAccessCode = p.accessCode || getStableCodeFromId(p.id);

      // If this older profile didn't have an accessCode saved in Firestore yet, save it immediately
      if (!p.accessCode && dbConfigured && db) {
        try {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', p.id), {
            accessCode: lockedAccessCode
          });
        } catch (err) {
          console.error("Auto-locking accessCode failed:", err);
        }
      }

      setMetrics({
        name: p.name || '', primaryPos: p.primaryPos || p.pos || 'QB', secondaryPos: p.secondaryPos || '', dnaTeam: p.dnaTeam || 'None', externalClub: p.externalClub || '',
        gradYear: p.gradYear || '', city: p.city || '', state: p.state || '', gpa: p.gpa || '', sat: p.sat || '', twitter: p.twitter || '', 
        guardianEmail: p.guardianEmail || '', athleteEmail: p.athleteEmail || '',
        scoutNotes: p.scoutNotes || '', weight: p.weight || '', hudlLink: p.hudlLink || '', 
        stat1Label: p.seasonStats?.stat1Label || p.stat1Label || 'Touchdowns', stat1Value: p.seasonStats?.stat1Value || p.stat1Value || '',
        stat2Label: p.seasonStats?.stat2Label || p.stat2Label || 'Interceptions', stat2Value: p.seasonStats?.stat2Value || p.stat2Value || '',
        stat3Label: p.seasonStats?.stat3Label || p.stat3Label || 'Yards / Rec', stat3Value: p.seasonStats?.stat3Value || p.stat3Value || '',
        combineLocation: p.combineEvent?.location || p.combineLocation || '', combineDate: p.combineEvent?.date || p.combineDate || today,
        sprint: p.metrics?.sprint ? String(p.metrics.sprint).replace('s', '') : '', sprintVerify: p.speedVerifications?.sprint || 'laser',
        shuttle: p.metrics?.shuttle ? String(p.metrics.shuttle).replace('s', '') : '', shuttleVerify: p.speedVerifications?.shuttle || 'stopwatch',
        lDrill: p.metrics?.lDrill ? String(p.metrics.lDrill).replace('s', '') : '', lDrillVerify: p.speedVerifications?.lDrill || 'stopwatch',
        mph: p.metrics?.mph ? String(p.metrics.mph).replace(' mph', '') : '', mphVerify: p.speedVerifications?.mph || 'laser',
        verticalInches: p.metrics?.vertical ? String(p.metrics.vertical).replace('"', '') : '',
        heightFeet: p.height?.includes("'") ? p.height.split("'")[0] : '', heightInches: p.height?.includes("'") ? p.height.split("'")[1].replace('"', '') : '',
        broadFeet: p.metrics?.broad?.includes("'") ? p.metrics.broad.split("'")[0] : '', broadInches: p.metrics?.broad?.includes("'") ? p.metrics.broad.split("'")[1].replace('"', '') : '',
        catchingPct: p.metrics?.catching ? String(p.metrics.catching).replace('%', '') : '', throwingPct: p.metrics?.throwing ? String(p.metrics.throwing).replace('%', '') : '', flagPullingPct: p.metrics?.flag ? String(p.metrics.flag).replace('%', '') : '',
        accessCode: lockedAccessCode
      });
      setPhotoPreview(p.avatar || null);
    }
  };

  const handleCopyAccessCode = () => {
    if (!metrics.accessCode) return;
    navigator.clipboard.writeText(metrics.accessCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width, height = img.height;
          if (width > height) { if (width > 400) { height *= 400 / width; width = 400; } } else { if (height > 400) { width *= 400 / height; height = 400; } }
          canvas.width = width; canvas.height = height; canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          setPhotoPreview(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const submitCombineData = async (e) => {
    e.preventDefault();
    setSavingAthlete(true);
    try {
      const auth = getAuth(app);
      if (!auth.currentUser) { alert("Firebase Error: No secure session."); setSavingAthlete(false); return; }
      const secureToken = await auth.currentUser.getIdToken(true);
      const calculateDNAScore = httpsCallable(getFunctions(app), 'calculateDNAScore');

      const existingPlayer = selectedExistingId ? players.find(p => p.id === selectedExistingId) : null;
      let historyPool = existingPlayer?.combineHistory ? [...existingPlayer.combineHistory] : [];
      if (historyPool.length > 0 && historyPool[historyPool.length - 1].date === metrics.combineDate) historyPool.pop();

      // SAFE NUMBER PARSERS (Prevents Infinity and -Infinity when saving athletes with blank stats!)
      const parseNum = (val) => {
        const n = Number(String(val ?? '').replace(/[^0-9.]/g, ''));
        return Number.isFinite(n) && n > 0 ? n : 0;
      };
      const safeMin = (arr) => {
        const valid = arr.filter(v => Number.isFinite(v) && v > 0);
        return valid.length > 0 ? Math.min(...valid) : 0;
      };
      const safeMax = (arr) => {
        const valid = arr.filter(v => Number.isFinite(v) && v > 0);
        return valid.length > 0 ? Math.max(...valid) : 0;
      };

      const bestSprint = safeMin([...historyPool.map(e => parseNum(e.metrics?.sprint)), parseNum(metrics.sprint)]);
      const bestShuttle = safeMin([...historyPool.map(e => parseNum(e.metrics?.shuttle)), parseNum(metrics.shuttle)]);
      const bestLDrill = safeMin([...historyPool.map(e => parseNum(e.metrics?.lDrill)), parseNum(metrics.lDrill)]);
      const bestMph = safeMax([...historyPool.map(e => parseNum(e.metrics?.mph)), parseNum(metrics.mph)]);
      const currentBroadInches = (parseNum(metrics.broadFeet) * 12) + parseNum(metrics.broadInches);
      const catchingVal = parseNum(metrics.catchingPct);
      const throwingVal = parseNum(metrics.throwingPct);
      const flagVal = parseNum(metrics.flagPullingPct);
      const verticalVal = parseNum(metrics.verticalInches);

      // Only call the Cloud Function if at least one combine metric was entered; otherwise default to 0.0
      const hasAnyCombineMetric = (
        bestSprint > 0 || bestShuttle > 0 || bestLDrill > 0 || bestMph > 0 ||
        catchingVal > 0 || throwingVal > 0 || flagVal > 0 || currentBroadInches > 0 || verticalVal > 0
      );

      let computedScore = 0;
      if (hasAnyCombineMetric) {
        const overallResult = await calculateDNAScore({
          token: secureToken,
          sprint: bestSprint,
          shuttle: bestShuttle,
          lDrill: bestLDrill,
          mph: bestMph,
          catchingPct: catchingVal,
          throwingPct: throwingVal,
          flagPullingPct: flagVal,
          broadInches: currentBroadInches,
          vertical: verticalVal
        });
        const rawScore = Number(overallResult?.data?.dnaScore);
        computedScore = Number.isFinite(rawScore) ? rawScore : 0;
      }

      const newCombineRecord = {
        location: metrics.combineLocation || 'Verified DNA Clinic',
        date: metrics.combineDate || today,
        timestamp: new Date().toLocaleTimeString(),
        dnaScore: computedScore,
        height: (metrics.heightFeet || metrics.heightInches) ? `${metrics.heightFeet || 0}'${metrics.heightInches || 0}"` : "",
        weight: parseNum(metrics.weight),
        speedVerifications: {
          sprint: metrics.sprintVerify,
          shuttle: metrics.shuttleVerify,
          lDrill: metrics.lDrillVerify,
          mph: metrics.mphVerify
        },
        metrics: {
          sprint: metrics.sprint ? `${Number(metrics.sprint).toFixed(2)}s` : "",
          shuttle: metrics.shuttle ? `${Number(metrics.shuttle).toFixed(2)}s` : "",
          lDrill: metrics.lDrill ? `${Number(metrics.lDrill).toFixed(2)}s` : "",
          mph: metrics.mph ? `${metrics.mph} mph` : "",
          broad: (metrics.broadFeet || metrics.broadInches) ? `${metrics.broadFeet || 0}'${metrics.broadInches || 0}"` : "",
          vertical: metrics.verticalInches ? `${metrics.verticalInches}"` : "",
          catching: metrics.catchingPct ? `${metrics.catchingPct}%` : "",
          throwing: metrics.throwingPct ? `${metrics.throwingPct}%` : "",
          flag: metrics.flagPullingPct ? `${metrics.flagPullingPct}%` : ""
        }
      };

      const finalAccessCode = existingPlayer?.accessCode || metrics.accessCode || generateRandomAccessCode();

      const playerData = {
        name: metrics.name.trim(),
        primaryPos: metrics.primaryPos,
        secondaryPos: metrics.secondaryPos,
        gradYear: Number(metrics.gradYear) || 2028,
        city: metrics.city,
        state: (metrics.state || '').toUpperCase(),
        dnaTeam: metrics.dnaTeam,
        externalClub: metrics.externalClub,
        gpa: metrics.gpa,
        sat: metrics.sat,
        twitter: metrics.twitter,
        guardianEmail: (metrics.guardianEmail || '').trim(),
        athleteEmail: (metrics.athleteEmail || '').trim(),
        accessCode: finalAccessCode,
        scoutNotes: metrics.scoutNotes,
        hudlLink: metrics.hudlLink,
        seasonStats: {
          stat1Label: metrics.stat1Label, stat1Value: metrics.stat1Value,
          stat2Label: metrics.stat2Label, stat2Value: metrics.stat2Value,
          stat3Label: metrics.stat3Label, stat3Value: metrics.stat3Value
        },
        stat1Label: metrics.stat1Label, stat1Value: metrics.stat1Value,
        stat2Label: metrics.stat2Label, stat2Value: metrics.stat2Value,
        stat3Label: metrics.stat3Label, stat3Value: metrics.stat3Value,
        height: newCombineRecord.height,
        weight: newCombineRecord.weight,
        dnaScore: computedScore,
        combineEvent: { location: newCombineRecord.location, date: newCombineRecord.date },
        combineLocation: newCombineRecord.location,
        combineDate: newCombineRecord.date,
        speedVerifications: newCombineRecord.speedVerifications,
        metrics: newCombineRecord.metrics,
        updatedAt: Date.now()
      };

      if (dbConfigured && db) {
        let finalAvatarUrl = existingPlayer?.avatar || "";
        if (photoPreview && photoPreview.startsWith('data:image')) {
          const storageRef = ref(storage, `avatars/${Date.now()}_${metrics.name.replace(/\s+/g, '_')}.jpg`);
          await uploadString(storageRef, photoPreview, 'data_url');
          finalAvatarUrl = await getDownloadURL(storageRef);
        }

        if (selectedExistingId) {
          let updatedHistory = existingPlayer?.combineHistory ? [...existingPlayer.combineHistory] : [];
          if (updatedHistory.length > 0 && updatedHistory[updatedHistory.length - 1].date === newCombineRecord.date) {
            updatedHistory[updatedHistory.length - 1] = newCombineRecord;
          } else {
            updatedHistory.push(newCombineRecord);
          }
          
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', selectedExistingId), { 
            ...playerData, combineHistory: updatedHistory, avatar: finalAvatarUrl 
          });
          
          if (computedScore > 0) {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'news'), {
              title: `${metrics.name} posted a new verified DNA Score of ${computedScore}!`, category: 'COMBINE', timestamp: Date.now()
            });
          }
        } else {
          playerData.avatar = finalAvatarUrl;
          playerData.views = 0; 
          playerData.createdAt = Date.now(); 
          playerData.combineHistory = [newCombineRecord];
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'players'), playerData);
          
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'news'), {
            title: `New Prospect Added: ${metrics.name} (Class of ${metrics.gradYear}) joins the national leaderboard.`, category: 'ANNOUNCEMENT', timestamp: Date.now()
          });
        }
      }

      alert(`Saved ${metrics.name}! DNA Score: ${computedScore} | Family Access Code: ${finalAccessCode}`);
      setMetrics(createDefaultMetrics());
      setSelectedExistingId("");
      setPhotoPreview(null);
    } catch (err) {
      alert("Error saving: " + err.message);
    }
    setSavingAthlete(false);
  };

  const deleteAthlete = async () => {
    if (!selectedExistingId) return;
    if (!window.confirm(`Delete ${metrics.name}?`)) return;
    if (dbConfigured && db) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', selectedExistingId));
    setMetrics(createDefaultMetrics());
    setSelectedExistingId("");
    setPhotoPreview(null);
  };

  const submitNews = async (e) => {
    e.preventDefault(); if (!newsTitle) return;
    try { if (dbConfigured && db) { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'news'), { title: newsTitle, category: newsCategory, timestamp: Date.now() }); } setNewsTitle(''); alert('News update posted successfully!'); } 
    catch (err) { alert("Error posting news: " + err.message); }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 py-8 animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="font-semibold flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"><ChevronLeft size={18} /> Return to Hub</button>
        <button onClick={onLogout} className="text-xs font-bold text-rose-600 border border-rose-200 bg-rose-50 px-5 py-2.5 rounded-full hover:bg-rose-100 transition-colors uppercase tracking-wider">Sign Out Admin</button>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-4 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
         <button onClick={() => setActiveTab('athlete')} className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-2 transition-all ${activeTab === 'athlete' ? 'text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`} style={activeTab === 'athlete' ? { background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' } : {}}><Activity size={16} className="hidden sm:block"/> Athlete Entry</button>
         <button onClick={() => setActiveTab('news')} className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-2 transition-all ${activeTab === 'news' ? 'text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`} style={activeTab === 'news' ? { background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' } : {}}><Megaphone size={16} className="hidden sm:block"/> Post News</button>
         <button onClick={() => setActiveTab('scouts')} className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-2 transition-all ${activeTab === 'scouts' ? 'text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`} style={activeTab === 'scouts' ? { background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' } : {}}>
           <Building size={16} className="hidden sm:block"/> Manage Scouts {scouts.filter(s => !s.approved).length > 0 && <span className="bg-rose-500 text-white rounded-full px-2 py-0.5 text-[10px]">{scouts.filter(s => !s.approved).length}</span>}
         </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-10">
        {activeTab === 'athlete' && (
           <div className="animate-in fade-in slide-in-from-left-4">
              
              {/* ATHLETE SELECTOR + BATCH EXPORT CSV BUTTON */}
              <div className="bg-slate-50/80 p-6 rounded-2xl mb-8 border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <label className="text-xs font-extrabold uppercase tracking-widest text-slate-800">
                    Select Existing Athlete (Or Create New)
                  </label>
                  <button
                    type="button"
                    onClick={handleExportAccessCodesCSV}
                    disabled={exportingCsv}
                    className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
                  >
                    {exportingCsv ? (
                      <><Loader2 size={14} className="animate-spin" /> Locking & Exporting...</>
                    ) : (
                      <><Download size={14} className="text-emerald-400" /> Lock & Export All Codes (CSV)</>
                    )}
                  </button>
                </div>

                <div className="relative mb-3"><Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search athlete by name..." className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all focus:outline-none" value={athleteSearchTerm} onChange={(e) => setAthleteSearchTerm(e.target.value)} /></div>
                <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all focus:outline-none" value={selectedExistingId} onChange={(e) => handleSelectExisting(e.target.value)}><option value="">+ Create Brand New Athlete</option>{filteredAdminPlayers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.gradYear})</option>)}</select>
              </div>

              <form onSubmit={submitCombineData} className="space-y-8">
                
                {/* SECURE ACCESS CODE (Auto-Locked + One-Click Copy) */}
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-emerald-900 flex items-center gap-2 uppercase tracking-tight">
                      <Key size={16}/> Permanent Family Access Code
                    </h3>
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mt-1">
                      This code is permanently locked to this athlete. Share it with the family to claim their account.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-white border-2 border-emerald-300 rounded-xl px-6 py-3 text-2xl font-black text-emerald-600 tracking-widest select-all">
                      {metrics.accessCode}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAccessCode}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      {codeCopied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-8 bg-slate-50/80 p-6 rounded-2xl border border-slate-100">
                  <div className="relative w-36 h-36 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden shrink-0 group hover:border-[#1c7ed6] transition-colors cursor-pointer">
                     {photoPreview ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" /> : <div className="text-center p-2"><Camera className="w-8 h-8 mx-auto text-slate-300 mb-2 group-hover:text-[#1c7ed6] transition-colors" /></div>}
                     <input type="file" accept="image/*" onChange={handlePhotoCapture} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-5">
                     <div className="sm:col-span-2"><InputLabel>Name</InputLabel><FormInput required value={metrics.name} onChange={e => setMetrics({...metrics, name: e.target.value})} /></div>
                     <div><InputLabel>Primary Position</InputLabel><select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all focus:outline-none" value={metrics.primaryPos} onChange={e => setMetrics({...metrics, primaryPos: e.target.value})}>{["QB", "RB", "WR", "TE", "C", "DB", "LB", "RUSH", "ATH"].map(pos => <option key={pos} value={pos}>{pos}</option>)}</select></div>
                     <div><InputLabel>Secondary Position</InputLabel><select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all focus:outline-none" value={metrics.secondaryPos} onChange={e => setMetrics({...metrics, secondaryPos: e.target.value})}><option value="">None</option>{["QB", "RB", "WR", "TE", "C", "DB", "LB", "RUSH", "ATH"].map(pos => <option key={pos} value={pos}>{pos}</option>)}</select></div>
                     <div><InputLabel>Grad Year</InputLabel><FormInput required type="number" value={metrics.gradYear} onChange={e => setMetrics({...metrics, gradYear: e.target.value})} /></div>
                     <div><InputLabel>State</InputLabel><FormInput required maxLength="2" placeholder="NJ" value={metrics.state} onChange={e => setMetrics({...metrics, state: e.target.value.toUpperCase()})} /></div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-t-4 border-t-[#d6336c]">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest mb-6 flex items-center gap-2 text-[#d6336c]"><Users size={16} /> Club Team Assignment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <InputLabel>DNA Roster (Tournament Teams)</InputLabel>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#d6336c]/20 transition-all" value={metrics.dnaTeam} onChange={e => setMetrics({...metrics, dnaTeam: e.target.value})}>
                        <option value="None">Not Assigned</option><option value="DNA 18U Elite">DNA 18U Elite</option><option value="DNA 18U Select">DNA 18U Select</option><option value="DNA 15U Elite">DNA 15U Elite</option><option value="DNA 15U Select">DNA 15U Select</option><option value="DNA 12U">DNA 12U</option>
                      </select>
                    </div>
                    <div><InputLabel>3rd Party / External Club</InputLabel><FormInput type="text" placeholder="e.g. Next Level Athletics" value={metrics.externalClub} onChange={e => setMetrics({...metrics, externalClub: e.target.value})} /></div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-t-4 border-t-[#1c7ed6]">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest mb-6 flex items-center gap-2 text-[#1c7ed6]"><GraduationCap size={16} /> Academic & Recruiting</h3>
                  <div className="grid grid-cols-2 gap-5 mb-5">
                    <div><InputLabel>GPA</InputLabel><FormInput type="number" step="0.01" value={metrics.gpa} onChange={e => setMetrics({...metrics, gpa: e.target.value})} /></div>
                    <div><InputLabel>SAT/ACT</InputLabel><FormInput type="text" value={metrics.sat} onChange={e => setMetrics({...metrics, sat: e.target.value})} /></div>
                    <div><InputLabel>Twitter</InputLabel><FormInput type="text" value={metrics.twitter} onChange={e => setMetrics({...metrics, twitter: e.target.value})} /></div>
                    <div className="hidden md:block"></div>
                    <div><InputLabel>Guardian Email (Parent)</InputLabel><FormInput type="email" value={metrics.guardianEmail} onChange={e => setMetrics({...metrics, guardianEmail: e.target.value})} /></div>
                    <div><InputLabel>Athlete Email (Player)</InputLabel><FormInput type="email" value={metrics.athleteEmail} onChange={e => setMetrics({...metrics, athleteEmail: e.target.value})} /></div>
                  </div>
                  <div><InputLabel>Scout Notes</InputLabel><textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all focus:outline-none min-h-[100px]" value={metrics.scoutNotes} onChange={e => setMetrics({...metrics, scoutNotes: e.target.value})} /></div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-t-4 border-t-amber-500">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest mb-6 flex items-center gap-2 text-amber-500"><Trophy size={16} /> Media & In-Season Stats</h3>
                  <div className="mb-5"><InputLabel>Highlight Tape URL (Hudl / YouTube)</InputLabel><FormInput type="url" placeholder="https://..." value={metrics.hudlLink} onChange={e => setMetrics({...metrics, hudlLink: e.target.value})} /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div><InputLabel>Stat 1 Label & Value</InputLabel><div className="flex gap-2"><FormInput type="text" placeholder="TDs" className="w-1/2" value={metrics.stat1Label} onChange={e => setMetrics({...metrics, stat1Label: e.target.value})} /><FormInput type="text" placeholder="0" className="w-1/2" value={metrics.stat1Value} onChange={e => setMetrics({...metrics, stat1Value: e.target.value})} /></div></div>
                    <div><InputLabel>Stat 2 Label & Value</InputLabel><div className="flex gap-2"><FormInput type="text" placeholder="INTs" className="w-1/2" value={metrics.stat2Label} onChange={e => setMetrics({...metrics, stat2Label: e.target.value})} /><FormInput type="text" placeholder="0" className="w-1/2" value={metrics.stat2Value} onChange={e => setMetrics({...metrics, stat2Value: e.target.value})} /></div></div>
                    <div><InputLabel>Stat 3 Label & Value</InputLabel><div className="flex gap-2"><FormInput type="text" placeholder="Yds" className="w-1/2" value={metrics.stat3Label} onChange={e => setMetrics({...metrics, stat3Label: e.target.value})} /><FormInput type="text" placeholder="0" className="w-1/2" value={metrics.stat3Value} onChange={e => setMetrics({...metrics, stat3Value: e.target.value})} /></div></div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-t-4 border-t-slate-800">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest mb-6 flex items-center gap-2 text-slate-800"><MapPin size={16} /> Combine Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><div><InputLabel>Location</InputLabel><FormInput type="text" placeholder="e.g. Horseshoe Lake Turf, NJ" value={metrics.combineLocation} onChange={e => setMetrics({...metrics, combineLocation: e.target.value})} /></div><div><InputLabel>Date</InputLabel><FormInput type="date" value={metrics.combineDate} onChange={e => setMetrics({...metrics, combineDate: e.target.value})} /></div></div>
                </div>

                <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest mb-6 flex items-center gap-2 text-[#1c7ed6]"><Zap size={16} /> Speed Verifications</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    <div>
                      <InputLabel>40-Yd (Sec)</InputLabel><FormInput type="number" step="0.01" value={metrics.sprint} onChange={e => setMetrics({...metrics, sprint: e.target.value})} />
                      <select className="w-full mt-2 bg-white border border-slate-200 text-[10px] font-bold p-2 rounded-lg" value={metrics.sprintVerify} onChange={e => setMetrics({...metrics, sprintVerify: e.target.value})}><option value="laser">Laser</option><option value="stopwatch">Hand-Timed</option><option value="standard">DNA Verified</option></select>
                    </div>
                    <div>
                      <InputLabel>5-10-5 (Sec)</InputLabel><FormInput type="number" step="0.01" value={metrics.shuttle} onChange={e => setMetrics({...metrics, shuttle: e.target.value})} />
                      <select className="w-full mt-2 bg-white border border-slate-200 text-[10px] font-bold p-2 rounded-lg" value={metrics.shuttleVerify} onChange={e => setMetrics({...metrics, shuttleVerify: e.target.value})}><option value="stopwatch">Hand-Timed</option><option value="laser">Laser</option><option value="standard">DNA Verified</option></select>
                    </div>
                    <div>
                      <InputLabel>L Drill (Sec)</InputLabel><FormInput type="number" step="0.01" value={metrics.lDrill} onChange={e => setMetrics({...metrics, lDrill: e.target.value})} />
                      <select className="w-full mt-2 bg-white border border-slate-200 text-[10px] font-bold p-2 rounded-lg" value={metrics.lDrillVerify} onChange={e => setMetrics({...metrics, lDrillVerify: e.target.value})}><option value="stopwatch">Hand-Timed</option><option value="laser">Laser</option><option value="standard">DNA Verified</option></select>
                    </div>
                    <div>
                      <InputLabel>Max Speed (MPH)</InputLabel><FormInput type="number" step="0.1" value={metrics.mph} onChange={e => setMetrics({...metrics, mph: e.target.value})} />
                      <select className="w-full mt-2 bg-white border border-slate-200 text-[10px] font-bold p-2 rounded-lg" value={metrics.mphVerify} onChange={e => setMetrics({...metrics, mphVerify: e.target.value})}><option value="laser">Laser</option><option value="stopwatch">Hand-Timed</option><option value="standard">DNA Verified</option></select>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest mb-6 flex items-center gap-2 text-[#1c7ed6]"><Ruler size={16} /> Skills & Explosiveness</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    <div><InputLabel>Catching %</InputLabel><FormInput type="number" value={metrics.catchingPct} onChange={e => setMetrics({...metrics, catchingPct: e.target.value})} /></div>
                    <div><InputLabel>Throwing %</InputLabel><FormInput type="number" value={metrics.throwingPct} onChange={e => setMetrics({...metrics, throwingPct: e.target.value})} /></div>
                    <div><InputLabel>Flag Pull %</InputLabel><FormInput type="number" value={metrics.flagPullingPct} onChange={e => setMetrics({...metrics, flagPullingPct: e.target.value})} /></div>
                    <div className="hidden md:block"></div>
                    <div><InputLabel>Height</InputLabel><div className="flex gap-2"><FormInput type="number" placeholder="Ft" className="w-1/2" value={metrics.heightFeet} onChange={e => setMetrics({...metrics, heightFeet: e.target.value})} /><FormInput type="number" placeholder="In" className="w-1/2" value={metrics.heightInches} onChange={e => setMetrics({...metrics, heightInches: e.target.value})} /></div></div>
                    <div><InputLabel>Weight (lbs)</InputLabel><FormInput type="number" value={metrics.weight} onChange={e => setMetrics({...metrics, weight: e.target.value})} /></div>
                    <div><InputLabel>Broad Jump</InputLabel><div className="flex gap-2"><FormInput type="number" placeholder="Ft" className="w-1/2" value={metrics.broadFeet} onChange={e => setMetrics({...metrics, broadFeet: e.target.value})} /><FormInput type="number" placeholder="In" className="w-1/2" value={metrics.broadInches} onChange={e => setMetrics({...metrics, broadInches: e.target.value})} /></div></div>
                    <div><InputLabel>Vertical (Inches)</InputLabel><FormInput type="number" step="0.1" value={metrics.verticalInches} onChange={e => setMetrics({...metrics, verticalInches: e.target.value})} /></div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button type="submit" disabled={savingAthlete} className="flex-1 hover:-translate-y-0.5 transition-all text-white font-bold py-4 rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}>
                    {savingAthlete ? 'Saving...' : 'Save Profile'}
                  </button>
                  {selectedExistingId && <button type="button" onClick={deleteAthlete} className="px-8 hover:-translate-y-0.5 transition-all text-white font-bold rounded-xl shadow-md bg-rose-500 hover:bg-rose-600">Delete</button>}
                </div>
              </form>
           </div>
        )}
        
        {activeTab === 'news' && (
          <div className="animate-in fade-in slide-in-from-right-4 max-w-2xl mx-auto">
            <form onSubmit={submitNews} className="space-y-6">
              <div><InputLabel>Headline</InputLabel><FormInput required type="text" placeholder="e.g., DNA 15U Wins Tournament..." value={newsTitle} onChange={(e) => setNewsTitle(e.target.value)} /></div>
              <div><InputLabel>Category</InputLabel><select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all focus:outline-none" value={newsCategory} onChange={(e) => setNewsCategory(e.target.value)}><option value="ANNOUNCEMENT">Announcement</option><option value="RECRUITING">Recruiting</option><option value="TOURNAMENT">Tournament Result</option><option value="COMBINE">Combine Result</option></select></div>
              <button type="submit" className="w-full hover:-translate-y-0.5 transition-all text-white font-bold py-4 rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}>Post Update to Hub</button>
            </form>
          </div>
        )}

        {activeTab === 'scouts' && (
          <AdminScoutApproval db={db} appId={appId} />
        )}
      </div>
    </div>
  );
};