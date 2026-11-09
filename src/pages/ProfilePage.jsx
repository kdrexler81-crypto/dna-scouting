// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { 
  ArrowLeft, MapPin, GraduationCap, Trophy, Activity, Lock, 
  ExternalLink, PlayCircle, BookOpen, Shield, Zap, Users, 
  Calendar, Mail, FileText, Eye, EyeOff, Target,
  Edit3, Save, Upload, X, Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const displayFont = { fontFamily: "'Outfit', sans-serif" };

export const ProfilePage = ({ onBack }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { db, appId, isFirebaseActive, authRole, familyData, players } = useApp();
  
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forceBlurPreview, setForceBlurPreview] = useState(false);

  // --- FAMILY PROFILE EDITOR STATE ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const fetchPlayer = async () => {
      // 1. Check if player is already loaded in global state
      const cached = players?.find(p => String(p.id) === String(id));
      if (cached) {
        setPlayer(cached);
        setLoading(false);
      }

      // 2. Fetch fresh copy from Firestore if active
      if (!isFirebaseActive || !db) {
        if (!cached) setError("Database offline and player not found in local cache.");
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setPlayer({ id: docSnap.id, ...docSnap.data() });
        } else if (!cached) {
          setError("Athlete profile not found.");
        }
      } catch (err) {
        if (!cached) setError("Error loading profile: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [id, db, appId, isFirebaseActive, players]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#1c7ed6] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md shadow-sm">
          <Activity size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-extrabold uppercase text-slate-900 mb-2" style={displayFont}>Profile Unavailable</h2>
          <p className="text-sm font-medium text-slate-500 mb-6">{error || "This profile may have been removed."}</p>
          <button onClick={() => onBack ? onBack() : navigate(-1)} className="bg-slate-900 text-white font-bold py-3 px-6 rounded-xl uppercase tracking-wider text-xs w-full">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Safely check if user is logged in OR if you clicked the "Preview Public Blur" button
  const hasValidRole = ['admin', 'recruiter', 'scout', 'parent', 'athlete'].includes(authRole);
  const isLocked = !hasValidRole || forceBlurPreview;

  // Check if the logged-in Parent or Athlete owns this specific profile (or if user is Admin)
  const userEmail = familyData?.email?.toLowerCase();
  const isOwner = Boolean(
    userEmail && (
      player.athleteEmail?.toLowerCase() === userEmail ||
      player.email?.toLowerCase() === userEmail ||
      player.guardianEmail?.toLowerCase() === userEmail ||
      player.parentEmail?.toLowerCase() === userEmail
    )
  );
  const canCustomize = authRole === 'admin' || ((authRole === 'parent' || authRole === 'athlete') && isOwner);

  // Open the modal and pre-fill with current non-verified fields
  const openEditModal = () => {
    const m = player.metrics || {};
    setEditForm({
      name: player.name || '',
      avatar: player.avatar || player.photo || '',
      primaryPos: player.primaryPos || 'WR',
      secondaryPos: player.secondaryPos || '',
      gradYear: player.gradYear || '',
      state: player.state || '',
      externalClub: player.externalClub || player.thirdPartyClub || '',
      gpa: player.gpa || '',
      satAct: player.satAct || player.sat || '',
      twitter: player.twitter || player.social || '',
      hudlLink: player.hudlLink || player.highlightUrl || '',
      stat1Label: player.stat1Label || m.stat1Label || 'Touchdowns',
      stat1Value: player.stat1Value || m.stat1Value || '',
      stat2Label: player.stat2Label || m.stat2Label || 'All-Purpose Yds',
      stat2Value: player.stat2Value || m.stat2Value || '',
      stat3Label: player.stat3Label || m.stat3Label || 'Interceptions',
      stat3Value: player.stat3Value || m.stat3Value || ''
    });
    setIsEditModalOpen(true);
  };

  // Compress uploaded profile photo so it fits cleanly in Firestore
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 320;
        let width = img.width;
        let height = img.height;
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setEditForm(prev => ({ ...prev, avatar: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Save only the non-verified fields to Firestore
  const handleSaveCustomProfile = async (e) => {
    e.preventDefault();
    if (!db || !player?.id) return;
    setSavingProfile(true);
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', player.id);
      const updatedFields = {
        name: editForm.name.trim(),
        avatar: editForm.avatar,
        primaryPos: editForm.primaryPos,
        secondaryPos: editForm.secondaryPos,
        gradYear: editForm.gradYear,
        state: editForm.state.toUpperCase(),
        externalClub: editForm.externalClub,
        gpa: editForm.gpa,
        satAct: editForm.satAct,
        twitter: editForm.twitter,
        hudlLink: editForm.hudlLink,
        stat1Label: editForm.stat1Label,
        stat1Value: editForm.stat1Value,
        stat2Label: editForm.stat2Label,
        stat2Value: editForm.stat2Value,
        stat3Label: editForm.stat3Label,
        stat3Value: editForm.stat3Value
      };
      await updateDoc(docRef, updatedFields);
      setPlayer(prev => ({ ...prev, ...updatedFields }));
      setIsEditModalOpen(false);
    } catch (err) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // Helper to read nested metrics OR flat properties
  const m = player.metrics || {};
  const val = (key, altKey, suffix = '') => {
    const raw = m[key] !== undefined && m[key] !== '' ? m[key] 
              : player[key] !== undefined && player[key] !== '' ? player[key]
              : m[altKey] !== undefined && m[altKey] !== '' ? m[altKey]
              : player[altKey] !== undefined && player[altKey] !== '' ? player[altKey]
              : null;
    return raw !== null && raw !== undefined && raw !== '' ? `${raw}${suffix}` : 'N/A';
  };

  // Helper for In-Season Custom Stats
  const stat1Label = player.stat1Label || m.stat1Label || 'In-Season Stat 1';
  const stat1Value = player.stat1Value || m.stat1Value || player.stat1 || 'N/A';
  const stat2Label = player.stat2Label || m.stat2Label || 'In-Season Stat 2';
  const stat2Value = player.stat2Value || m.stat2Value || player.stat2 || 'N/A';
  const stat3Label = player.stat3Label || m.stat3Label || 'In-Season Stat 3';
  const stat3Value = player.stat3Value || m.stat3Value || player.stat3 || 'N/A';

  const highlightUrl = player.hudlLink || player.highlightUrl || player.videoUrl || player.filmLink || '';
  const twitterHandle = player.twitter || player.social || '';

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 animate-in fade-in">
      
      {/* 1. PUBLIC HEADER (Always Visible to Everyone: Image, Name, Pos, Grad Year, State, DNA Score) */}
      <div className="bg-slate-900 text-white pt-8 pb-20 relative border-b-4 border-[#1c7ed6]">
        <div className="max-w-6xl mx-auto px-4">
          
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <button onClick={() => onBack ? onBack() : navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
              <ArrowLeft size={16} /> Back to Directory
            </button>

            <div className="flex flex-wrap items-center gap-3">
              {/* Customize Button for Linked Athlete, Parent, or Admin */}
              {canCustomize && (
                <button
                  onClick={openEditModal}
                  className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full bg-gradient-to-r from-[#1c7ed6] to-[#d6336c] text-white shadow-lg hover:opacity-95 flex items-center gap-2 transition-all"
                >
                  <Edit3 size={14} /> Customize My Profile
                </button>
              )}

              {/* Admin/Logged-In Preview Toggle so you can test the blur effect */}
              {hasValidRole && (
                <button 
                  onClick={() => setForceBlurPreview(!forceBlurPreview)}
                  className={`text-[10px] font-bold uppercase tracking-widest px-3.5 py-2 rounded-full border flex items-center gap-2 transition-all ${
                    forceBlurPreview 
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg' 
                      : 'bg-white/10 text-slate-300 border-white/15 hover:bg-white/20'
                  }`}
                >
                  {forceBlurPreview ? <><Eye size={14} /> Exit Guest Preview (Unlock)</> : <><EyeOff size={14} /> Preview Public Blur</>}
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            
            {/* Athlete Avatar (Unblurred) */}
            <div className="relative shrink-0">
              <img 
                src={player.avatar || player.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} 
                alt={player.name} 
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-slate-800 object-cover bg-slate-800 shadow-xl"
              />
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full border-4 border-slate-900" title="Verified DNA Profile">
                <Shield size={16} />
              </div>
            </div>

            {/* Basic Info (Unblurred: Name, Primary/Secondary Pos, Grad Year, State) */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-3">
                Verified Prospect Profile
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tight mb-3" style={displayFont}>
                {player.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-6 text-slate-300 font-bold uppercase tracking-widest text-xs">
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  <Trophy size={14} className="text-[#d6336c]" /> 
                  {player.primaryPos || 'ATH'} {player.secondaryPos ? `/ ${player.secondaryPos}` : ''}
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  <GraduationCap size={14} className="text-[#1c7ed6]" /> 
                  Class of {player.gradYear || 'N/A'}
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  <MapPin size={14} className="text-emerald-400" /> 
                  {player.state || 'N/A'}
                </span>
              </div>
            </div>

            {/* Public DNA Score Badge (Unblurred) */}
            <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-3xl shrink-0 mt-4 md:mt-0 backdrop-blur-sm min-w-[150px] text-center shadow-xl">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Verified DNA Score</span>
              <span className="text-4xl md:text-5xl font-black text-[#d6336c]" style={displayFont}>{player.dnaScore || '0.0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PROTECTED METRICS & RECRUITING DATA SECTION (Blurred if not logged in) */}
      <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-10">
        
        {/* PAYWALL / AUTH GATE OVERLAY */}
        {isLocked && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-start pt-16 sm:pt-28 bg-slate-900/20 backdrop-blur-[6px] rounded-3xl">
            <div className="bg-white p-8 rounded-3xl text-center shadow-2xl max-w-md border border-slate-200 mx-4 sticky top-32">
              <div className="w-16 h-16 bg-gradient-to-br from-[#1c7ed6] to-[#d6336c] text-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                <Lock size={30} />
              </div>
              <h3 className="text-2xl font-extrabold uppercase tracking-tight text-slate-900 mb-2" style={displayFont}>
                Full Scouting Report Locked
              </h3>
              <p className="text-xs text-slate-600 font-medium mb-6 leading-relaxed">
                Laser-timed speed verifications, skill percentages, academic transcripts, club assignments, and game film are restricted to verified <strong>College Scouts, Parents, and Athletes</strong>.
              </p>
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl uppercase tracking-wider text-xs transition-all shadow-md"
              >
                Use "Portal Login" in Top Right Header
              </button>
              {forceBlurPreview && (
                <button 
                  onClick={() => setForceBlurPreview(false)} 
                  className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[#1c7ed6] hover:underline block w-full"
                >
                  Exit Guest Preview Mode
                </button>
              )}
            </div>
          </div>
        )}

        {/* BLURRED DATA CONTAINER */}
        <div 
          style={isLocked ? { filter: 'blur(12px)', WebkitFilter: 'blur(12px)' } : {}}
          className={`space-y-6 transition-all duration-300 ${isLocked ? 'select-none pointer-events-none opacity-60' : ''}`}
        >
          
          {/* ROW 1: CLUB TEAM ASSIGNMENT & CLINIC DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Club Team Assignment */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2 border-b border-slate-100 pb-3.5" style={displayFont}>
                <Users className="text-[#1c7ed6]" size={18} /> Club Team Assignment
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DNA Roster (Tournament Teams)</span>
                  <span className="text-sm font-extrabold text-slate-900">{isLocked ? 'DNA 17U National' : (player.dnaRoster || player.dnaTeam || player.clubTeam || 'Unassigned')}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">3rd Party / External Club</span>
                  <span className="text-sm font-extrabold text-slate-900">{isLocked ? 'External Select' : (player.externalClub || player.thirdPartyClub || 'None Listed')}</span>
                </div>
              </div>
            </div>

            {/* Verification Clinic Details */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2 border-b border-slate-100 pb-3.5" style={displayFont}>
                <Calendar className="text-[#d6336c]" size={18} /> Verification Clinic Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Clinic Location</span>
                  <span className="text-sm font-extrabold text-slate-900">{isLocked ? 'Horseshoe Lake Turf, NJ' : (player.combineLocation || m.location || player.location || 'Verified DNA Clinic')}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Verification Date</span>
                  <span className="text-sm font-extrabold text-slate-900">{isLocked ? 'October 2026' : (player.combineDate || m.date || player.date || 'Verified')}</span>
                </div>
              </div>
            </div>

          </div>

          {/* ROW 2: SPEED VERIFICATIONS */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4" style={displayFont}>
              <Zap className="text-[#d6336c]" size={18} /> Speed Verifications (Laser-Timed)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="40-Yd Dash (Sec)" value={isLocked ? '4.78s' : val('sprint', 'fortyYd', 's')} highlight />
              <MetricCard label="5-10-5 Shuttle (Sec)" value={isLocked ? '4.42s' : val('shuttle', 'proShuttle', 's')} highlight />
              <MetricCard label="L-Drill (Sec)" value={isLocked ? '7.15s' : val('lDrill', 'ldrill', 's')} />
              <MetricCard label="Max Speed (MPH)" value={isLocked ? '17.4 MPH' : val('maxSpeed', 'mph', ' MPH')} />
            </div>
          </div>

          {/* ROW 3: SKILLS & EXPLOSIVENESS */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4" style={displayFont}>
              <Target className="text-[#1c7ed6]" size={18} /> Skills, Measurables & Explosiveness
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
              <MetricCard label="Catching %" value={isLocked ? '92%' : val('catching', 'catchingPct', '%')} />
              <MetricCard label="Throwing %" value={isLocked ? '88%' : val('throwing', 'throwingPct', '%')} />
              <MetricCard label="Flag Pull %" value={isLocked ? '95%' : val('flagPull', 'flagPullPct', '%')} />
              <MetricCard label="Height" value={isLocked ? '5\'6"' : val('height', 'ht', '')} />
              <MetricCard label="Weight (lbs)" value={isLocked ? '130 lbs' : val('weight', 'wt', ' lbs')} />
              <MetricCard label="Broad Jump" value={isLocked ? '94"' : val('broad', 'broadJump', '"')} />
              <MetricCard label="Vertical (In)" value={isLocked ? '26.5"' : val('vertical', 'vert', '"')} />
            </div>
          </div>

          {/* ROW 4: MEDIA & IN-SEASON STATS + ACADEMIC & RECRUITING */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Media & In-Season Stats (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4" style={displayFont}>
                  <PlayCircle className="text-rose-500" size={18} /> Media & In-Season Stats
                </h3>
                
                {/* Highlight Tape URL */}
                <div className="mb-6">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Highlight Tape (Hudl / YouTube)</span>
                  {highlightUrl && !isLocked ? (
                    <a href={highlightUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
                          <PlayCircle size={20} />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900 uppercase">Watch Verified Game Film</h4>
                          <p className="text-[10px] font-bold text-rose-600 truncate max-w-[180px] mt-0.5">{highlightUrl}</p>
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-rose-600" />
                    </a>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {isLocked ? 'https://www.hudl.com/video/3/...' : 'No Highlight Link Uploaded'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Custom In-Season Stats 1, 2, 3 */}
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Verified In-Season Production</span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider truncate mb-1">
                      {isLocked ? 'Touchdowns' : stat1Label}
                    </span>
                    <span className="text-lg font-black text-slate-900" style={displayFont}>
                      {isLocked ? '18' : stat1Value}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider truncate mb-1">
                      {isLocked ? 'All-Purpose Yds' : stat2Label}
                    </span>
                    <span className="text-lg font-black text-slate-900" style={displayFont}>
                      {isLocked ? '1,240' : stat2Value}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider truncate mb-1">
                      {isLocked ? 'Interceptions' : stat3Label}
                    </span>
                    <span className="text-lg font-black text-slate-900" style={displayFont}>
                      {isLocked ? '7' : stat3Value}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic & Recruiting Profile (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4" style={displayFont}>
                <BookOpen className="text-violet-600" size={18} /> Academic & Recruiting Information
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cumulative GPA</span>
                  <span className="text-xl font-black text-slate-900" style={displayFont}>{isLocked ? '3.92' : (player.gpa || 'N/A')}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">SAT / ACT Score</span>
                  <span className="text-xl font-black text-slate-900" style={displayFont}>{isLocked ? '1340' : (player.satAct || player.sat || player.act || 'N/A')}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 col-span-2 sm:col-span-1">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Twitter / X</span>
                  <span className="text-sm font-extrabold text-[#1c7ed6] truncate block mt-1">
                    {isLocked ? '@AthleteFlag2027' : (twitterHandle || 'Not Listed')}
                  </span>
                </div>
              </div>

              {/* Compliance Contact Emails */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
                  <Shield size={18} className="text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-[9px] font-black text-emerald-700 uppercase tracking-widest">Guardian Compliance Email</span>
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      {isLocked ? 'parent.verified@email.com' : (player.guardianEmail || player.parentEmail || 'Protected via CRM Inbox')}
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-violet-50/60 border border-violet-100 flex items-center gap-3">
                  <Mail size={18} className="text-violet-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-[9px] font-black text-violet-700 uppercase tracking-widest">Athlete Locker Room Email</span>
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      {isLocked ? 'athlete.verified@email.com' : (player.athleteEmail || player.email || 'Protected via CRM Inbox')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Official Scout Notes */}
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <FileText size={12} /> Official DNA Evaluation & Scout Notes
                </span>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {isLocked 
                    ? "Elite lateral quickness in space with verified sub-4.5 shuttle mechanics. High-academic prospect with strong field vision and natural hands catching away from her frame."
                    : (player.scoutNotes || player.notes || player.bio || "No official evaluation notes recorded yet.")}
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* 3. SELF-SERVICE CUSTOMIZATION MODAL (Non-Verified Fields Only) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center border-b-4 border-[#1c7ed6]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <Shield size={12} /> Verified Clinic Metrics Remain Protected
                </span>
                <h3 className="text-xl font-extrabold uppercase tracking-tight mt-1" style={displayFont}>
                  Customize Athlete Profile
                </h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white bg-white/10 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomProfile} className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto space-y-6">
              
              {/* Photo Upload & URL */}
              <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <img 
                  src={editForm.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${editForm.name}`} 
                  alt="Preview" 
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-300 bg-white shrink-0"
                />
                <div className="flex-1 w-full space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Profile Picture</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors">
                      <Upload size={13} /> Upload Photo from Device
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">or paste image link below</span>
                  </div>
                  <input 
                    type="text" 
                    placeholder="https://..." 
                    value={editForm.avatar} 
                    onChange={e => setEditForm({...editForm, avatar: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#1c7ed6]"
                  />
                </div>
              </div>

              {/* Basic Identity */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 mb-3 border-b border-slate-100 pb-2" style={displayFont}>
                  1. Athlete Identity & Position
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Full Name</label>
                    <input required type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">3rd Party / External Club</label>
                    <input type="text" placeholder="Optional" value={editForm.externalClub} onChange={e => setEditForm({...editForm, externalClub: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Primary Pos</label>
                      <select value={editForm.primaryPos} onChange={e => setEditForm({...editForm, primaryPos: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold">
                        {['QB', 'WR', 'RB', 'C', 'DB', 'LB', 'RUSHER', 'ATH'].map(pos => <option key={pos} value={pos}>{pos}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Secondary Pos</label>
                      <select value={editForm.secondaryPos} onChange={e => setEditForm({...editForm, secondaryPos: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold">
                        <option value="">None</option>
                        {['QB', 'WR', 'RB', 'C', 'DB', 'LB', 'RUSHER', 'ATH'].map(pos => <option key={pos} value={pos}>{pos}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Grad Year</label>
                      <input type="number" placeholder="2027" value={editForm.gradYear} onChange={e => setEditForm({...editForm, gradYear: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">State (2-Letter)</label>
                      <input type="text" maxLength="2" placeholder="NJ" value={editForm.state} onChange={e => setEditForm({...editForm, state: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold uppercase" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Academics, Social & Film */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 mb-3 border-b border-slate-100 pb-2" style={displayFont}>
                  2. Academics, Social & Highlight Film
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Cumulative GPA</label>
                    <input type="text" placeholder="e.g. 3.85" value={editForm.gpa} onChange={e => setEditForm({...editForm, gpa: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">SAT / ACT</label>
                    <input type="text" placeholder="e.g. 1280" value={editForm.satAct} onChange={e => setEditForm({...editForm, satAct: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Twitter / X Handle</label>
                    <input type="text" placeholder="@handle" value={editForm.twitter} onChange={e => setEditForm({...editForm, twitter: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Highlight Tape URL (Hudl / YouTube)</label>
                  <input type="url" placeholder="https://www.hudl.com/..." value={editForm.hudlLink} onChange={e => setEditForm({...editForm, hudlLink: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold" />
                </div>
              </div>

              {/* In-Season Custom Stats */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 mb-3 border-b border-slate-100 pb-2" style={displayFont}>
                  3. Custom In-Season Stats
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                    <input type="text" placeholder="Stat 1 Label (e.g. TDs)" value={editForm.stat1Label} onChange={e => setEditForm({...editForm, stat1Label: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase" />
                    <input type="text" placeholder="Value (e.g. 14)" value={editForm.stat1Value} onChange={e => setEditForm({...editForm, stat1Value: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-black" />
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                    <input type="text" placeholder="Stat 2 Label (e.g. Yards)" value={editForm.stat2Label} onChange={e => setEditForm({...editForm, stat2Label: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase" />
                    <input type="text" placeholder="Value (e.g. 950)" value={editForm.stat2Value} onChange={e => setEditForm({...editForm, stat2Value: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-black" />
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                    <input type="text" placeholder="Stat 3 Label (e.g. INTs)" value={editForm.stat3Label} onChange={e => setEditForm({...editForm, stat3Label: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase" />
                    <input type="text" placeholder="Value (e.g. 6)" value={editForm.stat3Value} onChange={e => setEditForm({...editForm, stat3Value: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-black" />
                  </div>
                </div>
              </div>

              {/* Save Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-3 rounded-xl font-bold uppercase tracking-wider text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={savingProfile} className="px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs text-white bg-gradient-to-r from-[#1c7ed6] to-[#d6336c] hover:opacity-95 transition-all shadow-lg flex items-center gap-2">
                  {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Profile Updates</>}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// Helper component for stat cards
function MetricCard({ label, value, highlight = false }) {
  return (
    <div className={`rounded-2xl p-4 border text-center ${highlight ? 'bg-slate-900 text-white border-slate-800' : 'bg-slate-50 border-slate-100 text-slate-900'}`}>
      <span className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-slate-400">{label}</span>
      <span className={`text-xl md:text-2xl font-black ${highlight ? 'text-[#d6336c]' : 'text-slate-900'}`} style={displayFont}>{value}</span>
    </div>
  );
}