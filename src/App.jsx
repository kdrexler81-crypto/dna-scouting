import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ChevronLeft, Lock, Camera, Ruler, Zap, Target, Newspaper, Trophy, 
  Activity, Loader2, Video, ExternalLink, Shield, MapPin, Eye, Search, 
  X, User, GraduationCap, Mail, AtSign, FileText, Award, Users, QrCode, 
  Download, LayoutDashboard, Star, GripVertical, Building, Megaphone,
  CheckCircle, Clock, Globe
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, increment, deleteDoc, setDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { QRCodeSVG } from 'qrcode.react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';

// --- FIREBASE INITIALIZATION ---
let app, auth, db, appId, storage;
let isFirebaseActive = false;

try {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    appId = firebaseConfig.appId || 'default-app-id';
    isFirebaseActive = true;
  }
} catch (e) {
  console.error("Firebase offline", e);
}

const INITIAL_SEED = { players: [], news: [], scouts: [] };

// --- TYPOGRAPHY HELPERS ---
const displayFont = { fontFamily: "'Outfit', sans-serif" };
const bodyFont = { fontFamily: "'Inter', sans-serif" };

// --- BRAND COMPONENTS ---
const DNALogo = () => (
  <div className="flex items-center gap-3">
    <img src="/DNA Logo.png" alt="DNA Football Logo" className="h-9 w-auto" onError={(e) => e.target.style.display='none'} />
    <span className="font-extrabold text-xl tracking-wide uppercase text-slate-900 hidden sm:block print:block" style={displayFont}>DNA Football</span>
  </div>
);

const SanctionedFooter = () => (
  <footer className="bg-white border-t border-slate-200 py-12 mt-20 text-center shadow-sm print:hidden">
    <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center space-y-6">
      <div className="flex flex-col items-center space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Dual Sanctioned Organization</span>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-center gap-6 shadow-sm">
          <img src="/usa-football-logo.jpg" alt="USA Football Sanctioned" className="h-10 w-auto object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
          <div className="h-8 w-px bg-slate-200"></div>
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider" style={displayFont}>USA Football & NFL FLAG Partner</span>
        </div>
      </div>
      <p className="text-slate-400 text-[10px] uppercase tracking-widest pt-4">&copy; {new Date().getFullYear()} DNA Football. All rights reserved.</p>
    </div>
  </footer>
);

// --- MODALS & PAGES ---
const LoginModal = ({ isOpen, onClose, onLoginSuccess, initialMode }) => {
  const [mode, setMode] = useState(initialMode || 'admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [coachName, setCoachName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'admin');
      setError('');
      setUsername('');
      setPassword('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    
    if (mode === 'recruiter_signup' && !username.toLowerCase().endsWith('.edu')) {
      setError("Access denied. Scout accounts require a valid .edu university email address.");
      setLoading(false);
      return;
    }

    try {
      if (mode === 'recruiter_signup') {
        const userCred = await createUserWithEmailAndPassword(auth, username, password);
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'recruiters', userCred.user.uid), {
          name: coachName, school: schoolName, email: username, role: 'recruiter', approved: false, board: { priority: [], interested: [], pass: [] }, createdAt: Date.now()
        });
        await signOut(auth);
        setError("Account created successfully. It is currently pending Admin approval.");
        setMode('recruiter_login');
      } else {
        const userCred = await signInWithEmailAndPassword(auth, username, password);
        if (mode === 'recruiter_login') {
          const docSnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'recruiters', userCred.user.uid));
          if (docSnap.exists() && docSnap.data().role === 'recruiter') {
            if (docSnap.data().approved !== true) {
               await signOut(auth);
               throw new Error("Your scout account is pending Admin approval. Please check back later.");
            }
            onLoginSuccess('recruiter', { ...docSnap.data(), uid: userCred.user.uid });
          } else {
            await signOut(auth); throw new Error("Not authorized as a recruiter.");
          }
        } else {
           onLoginSuccess('admin', null);
        }
      }
      if (mode !== 'recruiter_signup') {
        setUsername(''); setPassword(''); setCoachName(''); setSchoolName('');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: mode === 'admin' ? '#d6336c' : '#1c7ed6' }}></div>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 p-1.5 rounded-full"><X size={18} /></button>
        
        <div className="flex gap-2 mb-8 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
          <button onClick={() => {setMode('admin'); setError('');}} className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all duration-200 ${mode === 'admin' ? 'bg-white shadow-sm text-[#d6336c]' : 'text-slate-500 hover:text-slate-700'}`}>Admin</button>
          <button onClick={() => {setMode('recruiter_login'); setError('');}} className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all duration-200 ${mode.includes('recruiter') ? 'bg-white shadow-sm text-[#1c7ed6]' : 'text-slate-500 hover:text-slate-700'}`}>Scout</button>
        </div>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4" style={{ color: mode === 'admin' ? '#d6336c' : '#1c7ed6' }}>
            {mode === 'admin' ? <Lock size={24} /> : <Building size={24} />}
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 uppercase tracking-tight" style={displayFont}>{mode === 'admin' ? 'Coach Portal Access' : 'Scout / Recruiter'}</h2>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1.5">{mode === 'admin' ? 'Authorized Staff Only' : 'Verified .EDU Coaches Only'}</p>
        </div>
        
        {error && <div className={`border text-xs font-semibold p-3.5 rounded-xl text-center mb-6 leading-relaxed ${error.includes('successfully') ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'recruiter_signup' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Coach Name</label>
                <input required type="text" placeholder="John Doe" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1c7ed6] focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all" value={coachName} onChange={e => setCoachName(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">University / College</label>
                <input required type="text" placeholder="State Univ." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1c7ed6] focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all" value={schoolName} onChange={e => setSchoolName(e.target.value)} />
              </div>
            </div>
          )}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">{mode === 'recruiter_signup' ? 'University Email (.edu)' : 'Email Address'}</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input required type="email" placeholder={mode === 'recruiter_signup' ? "coach@university.edu" : "Enter email"} className={`w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 transition-all ${mode === 'admin' ? 'focus:border-[#d6336c] focus:ring-[#d6336c]/20' : 'focus:border-[#1c7ed6] focus:ring-[#1c7ed6]/20'}`} value={username} onChange={e => setUsername(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input required type="password" placeholder="Enter password" className={`w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 transition-all ${mode === 'admin' ? 'focus:border-[#d6336c] focus:ring-[#d6336c]/20' : 'focus:border-[#1c7ed6] focus:ring-[#1c7ed6]/20'}`} value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-full hover:-translate-y-0.5 transition-all text-white font-bold py-4 rounded-xl uppercase tracking-wider text-sm shadow-lg mt-4 flex justify-center items-center gap-2" style={{ background: mode === 'admin' ? 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' : '#1c7ed6' }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : (mode === 'recruiter_signup' ? 'Create Scout Account' : 'Authenticate & Enter')}
          </button>
        </form>

        {mode.includes('recruiter') && (
           <div className="mt-5 text-center">
             <button type="button" onClick={() => setMode(mode === 'recruiter_login' ? 'recruiter_signup' : 'recruiter_login')} className="text-[11px] font-semibold text-slate-500 hover:text-[#1c7ed6] transition-colors">
               {mode === 'recruiter_login' ? "Don't have an account? Create one." : "Already registered? Sign In."}
             </button>
           </div>
        )}
      </div>
    </div>
  );
};

// --- 1. PROFILE PAGE ---
const ProfilePage = ({ player, onBack }) => {
  if (!player) return null;

  const getEmbedUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtu.be')) videoId = url.split('/').pop().split('?')[0];
      else try { const urlObj = new URL(url); videoId = urlObj.searchParams.get('v'); } catch (e) { videoId = ''; }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    return null;
  };

  const getMetricStyle = (val, label) => {
    try {
      if (!val || val === "N/A" || label === 'Height' || label === 'Weight') return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
      const green = { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
      const yellow = { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
      const red = { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
      const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
      if (isNaN(num)) return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
      if (label.includes('Sprint')) return num <= 6.0 ? green : num <= 6.5 ? yellow : red;
      if (label.includes('Shuttle')) return num <= 5.25 ? green : num <= 5.5 ? yellow : red;
      if (label.includes('Drill')) return num <= 5.2 ? green : num <= 6.0 ? yellow : red;
      if (label.includes('MPH')) return num >= 14.0 ? green : num >= 12.0 ? yellow : red;
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
    } catch (e) { return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }; }
  };

  const MetricRow = ({ icon: Icon, label, playerStat, verifyStatus }) => {
    const statStyle = getMetricStyle(playerStat, label); 
    const hasData = playerStat && playerStat !== "N/A" && playerStat !== "";
    return (
      <div className="flex items-center justify-between py-3 border-b border-slate-100/60 group hover:bg-slate-50/50 transition-colors px-2 rounded-xl gap-2 print:py-1.5">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-white border border-slate-100 transition-colors shrink-0 print:hidden">
            {Icon && <Icon size={16} className="text-slate-500" />}
          </div>
          <div className="flex flex-col justify-center gap-1">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide leading-tight whitespace-normal">{label}</span>
            {hasData && verifyStatus === 'laser' && <span title="Hardware Laser Verified" className="w-fit bg-amber-100 text-amber-800 text-[9px] px-2 py-0.5 rounded-full font-bold tracking-widest flex items-center gap-1"><Award size={10}/> LASER</span>}
            {hasData && verifyStatus === 'stopwatch' && <span title="Stopwatch Verified" className="w-fit bg-slate-100 text-slate-500 text-[9px] px-2 py-0.5 rounded-full font-bold tracking-widest flex items-center gap-1"><Activity size={10}/> MANUAL</span>}
            {hasData && verifyStatus === 'standard' && <span title="DNA Staff Verified" className="w-fit bg-slate-800 text-white text-[9px] px-2 py-0.5 rounded-full font-bold tracking-widest flex items-center gap-1"><Shield size={10}/> DNA VERIFIED</span>}
          </div>
        </div>
        <div className="w-24 shrink-0 text-right pr-2">
          <span className={`text-sm px-4 py-1.5 rounded-full font-semibold ${statStyle.bg} ${statStyle.text} border ${statStyle.border} shadow-sm whitespace-nowrap`}>
            {playerStat || "N/A"}
          </span>
        </div>
      </div>
    );
  };

  const getVerify = (metricKey) => {
    if (player?.speedVerifications) return player.speedVerifications[metricKey] || 'stopwatch';
    return player?.verificationLevel === 'Hardware Verified (Laser)' ? 'laser' : 'stopwatch';
  };

  return (
    <div className="max-w-7xl mx-auto p-4 py-8 animate-in slide-in-from-bottom-8 print:p-0 print:m-0 print:max-w-full">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <button onClick={onBack} className="font-semibold flex items-center gap-1 uppercase tracking-wider text-sm hover:opacity-80 transition-opacity text-slate-500"><ChevronLeft size={18} /> Back</button>
        <button onClick={() => window.print()} className="font-semibold flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm uppercase tracking-wider shadow-md hover:bg-slate-800 hover:-translate-y-0.5 transition-all"><FileText size={16}/> Print Report</button>
      </div>
      
      <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-8 flex flex-col md:flex-row print:flex-row print:shadow-none print:border-2 print:mb-6">
        <div className="w-full md:w-1/3 print:w-1/3 bg-slate-900 relative shrink-0">
           <div className="absolute top-4 right-4 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg print:bg-black" style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}>Verified Profile</div>
           <img src={player?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player?.name || 'athlete'}`} className="w-full h-[320px] sm:h-full object-cover print:h-[220px]" style={{ borderBottom: '4px solid #d6336c' }} alt={player?.name} />
        </div>
        
        <div className="w-full md:w-2/3 print:w-2/3 flex flex-col">
          <div className="bg-slate-900 text-left p-8 md:p-10 flex-1 flex flex-col justify-center print:bg-white print:text-slate-900 print:p-4">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white uppercase print:text-black tracking-tight" style={displayFont}>{player?.name}</h1>
            <p className="font-bold text-sm md:text-lg uppercase tracking-widest mt-3 text-slate-300" style={displayFont}>
              <span className="text-[#1c7ed6]">{player?.primaryPos}</span> • Class of {player?.gradYear} 
              {player?.dnaTeam && player.dnaTeam !== 'None' ? ` • ${player.dnaTeam}` : (player?.externalClub ? ` • ${player.externalClub}` : '')}
            </p>
          </div>

          <div className="flex bg-slate-50 border-t border-slate-800 divide-x divide-slate-200 print:bg-white print:border-slate-200">
            <div className="flex-1 p-6 text-center bg-slate-50 print:bg-white print:p-3">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">DNA Score</span>
              <span className="text-5xl md:text-6xl font-black" style={{ ...displayFont, color: '#d6336c' }}>{player?.dnaScore || "0.0"}</span>
            </div>
            <div className="flex-1 p-6 flex flex-col justify-center gap-3 bg-white print:p-3">
              <div className="flex items-center gap-3 print:gap-2"><div className="p-2 bg-blue-50 rounded-lg"><GraduationCap size={18} className="text-[#1c7ed6]"/></div> <span className="text-xs print:text-xs font-semibold uppercase text-slate-400 tracking-wider">GPA:</span> <span className="text-xl print:text-sm font-bold text-slate-800">{player?.gpa || 'N/A'}</span></div>
              <div className="flex items-center gap-3 print:gap-2"><div className="p-2 bg-blue-50 rounded-lg"><FileText size={18} className="text-[#1c7ed6]"/></div> <span className="text-xs print:text-xs font-semibold uppercase text-slate-400 tracking-wider">SAT:</span> <span className="text-xl print:text-sm font-bold text-slate-800">{player?.sat || 'N/A'}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start print:grid-cols-3 print:gap-4">
        <div className="lg:col-span-2 print:col-span-2 flex flex-col gap-8 print:gap-4">
          <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 print:shadow-none print:border-2 print:p-4">
            <h3 className="text-2xl print:text-lg font-extrabold text-slate-900 uppercase tracking-tight mb-6 print:mb-3" style={displayFont}>Verified Combine Metrics</h3>
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-3">
              <div>
                <MetricRow icon={Zap} label="40-Yard Sprint" playerStat={player.metrics?.sprint} verifyStatus={getVerify('sprint')} />
                <MetricRow icon={Activity} label="5-10-5 Shuttle" playerStat={player.metrics?.shuttle} verifyStatus={getVerify('shuttle')} />
                <MetricRow icon={Activity} label="L Drill" playerStat={player.metrics?.lDrill} verifyStatus={getVerify('lDrill')} />
                <MetricRow icon={Zap} label="Max Speed (MPH)" playerStat={player.metrics?.mph} verifyStatus={getVerify('mph')} />
              </div>
              <div>
                <MetricRow icon={Target} label="Broad Jump" playerStat={player.metrics?.broad} verifyStatus="standard" />
                <MetricRow icon={Target} label="Vertical Jump" playerStat={player.metrics?.vertical} verifyStatus="standard" />
                <MetricRow icon={Target} label="Catching Chal." playerStat={player.metrics?.catching} verifyStatus="standard" />
                <MetricRow icon={Target} label="Throwing Acc." playerStat={player.metrics?.throwing} verifyStatus="standard" />
              </div>
            </div>
          </div>

          {(player?.seasonStats?.stat1Label || player?.seasonStats?.stat2Label || player?.seasonStats?.stat3Label) && (
            <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 print:border-2 print:shadow-none print:p-4">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-amber-500 print:mb-2"><Trophy size={18} /> In-Season Performance Stats</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 overflow-hidden">
                  <span className="block text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-2 truncate" title={player.seasonStats.stat1Label || 'Touchdowns'}>{player.seasonStats.stat1Label || 'Touchdowns'}</span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-800" style={displayFont}>{player.seasonStats.stat1Value || '0'}</span>
                </div>
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 overflow-hidden">
                  <span className="block text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-2 truncate" title={player.seasonStats.stat2Label || 'Interceptions'}>{player.seasonStats.stat2Label || 'Interceptions'}</span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-800" style={displayFont}>{player.seasonStats.stat2Value || '0'}</span>
                </div>
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 overflow-hidden">
                  <span className="block text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-2 truncate" title={player.seasonStats.stat3Label || 'Yards / Rec'}>{player.seasonStats.stat3Label || 'Yards / Rec'}</span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-800" style={displayFont}>{player.seasonStats.stat3Value || '0'}</span>
                </div>
              </div>
            </div>
          )}

          {player?.hudlLink && (
            <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 flex flex-col h-[400px] print:hidden">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-[#1c7ed6]"><Video size={18} /> Highlight Film</h3>
              <div className="relative w-full flex-grow rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                {getEmbedUrl(player.hudlLink) ? <iframe src={getEmbedUrl(player.hudlLink)} title="Highlight Reel" className="absolute inset-0 w-full h-full" allowFullScreen></iframe> : 
                <a href={player.hudlLink} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center bg-slate-800 text-white font-bold uppercase tracking-wider text-sm hover:bg-slate-700 transition-colors">Watch Film On Hudl</a>}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1 print:col-span-1 flex flex-col gap-8 print:gap-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] print:shadow-none print:p-4 print:border-2">
             <h3 className="text-[11px] font-bold uppercase tracking-widest mb-5 text-slate-400 border-b border-slate-100 pb-3 print:mb-2">Recruiting Contact</h3>
             <div className="space-y-4 print:space-y-2">
               {player?.twitter && <a href={`https://twitter.com/${player.twitter.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-[#1c7ed6] transition-colors print:text-black"><div className="p-2.5 bg-blue-50 rounded-xl print:hidden"><AtSign size={16} className="text-[#1c7ed6]"/></div> {player.twitter}</a>}
               <a href={`mailto:${player?.guardianEmail || ''}`} className="flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-[#d6336c] transition-colors print:text-black"><div className="p-2.5 bg-pink-50 rounded-xl print:hidden"><Mail size={16} className="text-[#d6336c]"/></div> Contact Parent/Guardian</a>
             </div>
          </div>

          {player?.scoutNotes && (
            <div className="bg-slate-900 rounded-3xl p-8 shadow-xl print:bg-white print:border-2 print:border-slate-200 print:p-4 print:shadow-none">
               <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4 text-white flex items-center gap-2 print:text-black print:mb-1"><Eye size={16} style={{ color: '#d6336c' }}/> Scout Notes</h3>
               <p className="text-sm print:text-xs text-slate-300 italic print:text-slate-700 leading-relaxed font-medium">"{player.scoutNotes}"</p>
            </div>
          )}

          {player?.recentViews && Array.isArray(player.recentViews) && player.recentViews.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#1c7ed6]/20 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] print:hidden">
               <h3 className="text-[11px] font-bold uppercase tracking-widest mb-5 text-[#1c7ed6] border-b border-slate-100 pb-3 flex items-center gap-2"><Eye size={16}/> Recent Scout Views</h3>
               <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                 {[...player.recentViews].reverse().slice(0, 10).map((view, i) => (
                   <div key={i} className="flex gap-3.5 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                     <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100"><Building size={16} className="text-slate-400" /></div>
                     <div>
                       <p className="text-xs font-bold text-slate-700 leading-tight">{view.coach} <span className="text-slate-400 font-medium">from</span></p>
                       <p className="text-[10px] font-extrabold text-[#1c7ed6] uppercase tracking-widest truncate max-w-[160px] mt-0.5">{view.school}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- PUBLIC HUB ---
const PublicHub = ({ players, news: localNews, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [posFilter, setPosFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'dnaScore', direction: 'desc' });
  const [externalNews, setExternalNews] = useState([]);

  useEffect(() => {
    const fetchExternalNews = async () => {
      try {
        const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%2Fsearch%3Fq%3D%22flag%2Bfootball%22%26hl%3Den-US%26gl%3DUS%26ceid%3DUS%3Aen');
        const data = await response.json();
        if (data.status === 'ok') {
          const formattedNews = data.items.slice(0, 8).map(item => ({
            id: item.guid || Math.random().toString(),
            title: item.title,
            category: 'WEB NEWS',
            timestamp: new Date(item.pubDate).getTime(),
            link: item.link,
            isExternal: true
          }));
          setExternalNews(formattedNews);
        }
      } catch (err) {
        console.error("Failed to fetch external news", err);
      }
    };
    fetchExternalNews();
  }, []);

  const combinedNews = useMemo(() => {
    return [...(localNews || []), ...externalNews].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [localNews, externalNews]);

  const requestSort = (key) => {
    if (sortConfig.key === key) { setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' }); } 
    else { const ascDefault = ['sprint', 'shuttle', 'lDrill', 'name']; setSortConfig({ key, direction: ascDefault.includes(key) ? 'asc' : 'desc' }); }
  };

  const parseBroad = (str) => { if (!str) return 0; const ftMatch = str.match(/(\d+)'/); const inMatch = str.match(/(\d+)"/); return (ftMatch ? parseInt(ftMatch[1]) * 12 : 0) + (inMatch ? parseInt(inMatch[1]) : 0); };

  const uniquePositions = useMemo(() => ['All', ...new Set(players.map(p => p.primaryPos).filter(Boolean))].sort(), [players]);
  const uniqueYears = useMemo(() => ['All', ...new Set(players.map(p => p.gradYear).filter(Boolean))].sort((a,b)=>b-a), [players]);

  const filteredAndSortedPlayers = useMemo(() => {
    return players.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPos = posFilter === 'All' || p.primaryPos === posFilter || (p.pos && p.pos.includes(posFilter));
      const matchesYear = yearFilter === 'All' || p.gradYear === Number(yearFilter);
      return matchesSearch && matchesPos && matchesYear;
    }).sort((a, b) => {
      let aVal, bVal;
      if (sortConfig.key === 'name') return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      if (sortConfig.key === 'dnaScore') { aVal = Number(a.dnaScore) || 0; bVal = Number(b.dnaScore) || 0; } 
      else if (['sprint', 'shuttle', 'lDrill'].includes(sortConfig.key)) {
        const missingVal = sortConfig.direction === 'asc' ? 999 : -1;
        aVal = a.metrics?.[sortConfig.key] ? parseFloat(a.metrics[sortConfig.key]) : missingVal;
        bVal = b.metrics?.[sortConfig.key] ? parseFloat(b.metrics[sortConfig.key]) : missingVal;
      } else if (sortConfig.key === 'broad') { aVal = parseBroad(a.metrics?.broad); bVal = parseBroad(b.metrics?.broad); }
      else { aVal = parseFloat(a.metrics?.[sortConfig.key]) || 0; bVal = parseFloat(b.metrics?.[sortConfig.key]) || 0; }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [players, searchTerm, posFilter, yearFilter, sortConfig]);

  const SortableHeader = ({ label, sortKey, align = 'center' }) => (
    <th className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors text-${align} whitespace-nowrap group select-none`} onClick={() => requestSort(sortKey)}>
      <div className={`flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : ''} ${align === 'right' ? 'justify-end' : ''}`}>
        {label}
        <div className="flex flex-col -space-y-1">
          <ChevronLeft size={10} className={`rotate-90 ${sortConfig.key === sortKey && sortConfig.direction === 'asc' ? 'text-[#1c7ed6] opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
          <ChevronLeft size={10} className={`-rotate-90 ${sortConfig.key === sortKey && sortConfig.direction === 'desc' ? 'text-[#1c7ed6] opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
        </div>
      </div>
    </th>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 md:p-10 mb-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-[rgba(214,51,108,0.06)] to-transparent rounded-bl-full pointer-events-none"></div>
        <div className="relative z-10 text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 uppercase tracking-tight mb-3" style={displayFont}>Want to get on the <span style={{ color: '#d6336c' }}>Leaderboard?</span></h2>
          <p className="text-slate-500 text-sm font-medium max-w-2xl leading-relaxed">Evaluation spots are strictly limited. Register for our next official combine to get your verified physicals, earn your DNA Score, and secure your national ranking.</p>
        </div>
        <a href="https://form.jotform.com/262914891648168" target="_blank" rel="noopener noreferrer" className="relative z-10 shrink-0 hover:-translate-y-0.5 transition-all text-white font-bold px-8 py-4 rounded-full uppercase tracking-wider shadow-lg shadow-blue-500/20 text-sm flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}>
          Register For Combine <ExternalLink size={16} />
        </a>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 order-2 lg:order-1 space-y-6">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden p-7">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5 mb-6 uppercase tracking-tight" style={displayFont}><Megaphone style={{ color: '#1c7ed6' }} size={22}/> Live News</h2>
            <div className="space-y-5 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {combinedNews.length === 0 ? <p className="text-slate-400 text-sm italic">No recent updates.</p> : (
                 combinedNews.map(item => (
                   <div key={item.id} className="block pl-3.5 transition-transform relative group" style={{ borderLeft: `2px solid ${item.isExternal ? '#94a3b8' : '#d6336c'}` }}>
                     <div className="flex items-center gap-1.5">
                       <span className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: item.isExternal ? '#64748b' : '#d6336c' }}>
                         {item.category}
                       </span>
                     </div>
                     {item.isExternal ? (
                       <a href={item.link} target="_blank" rel="noopener noreferrer" className="block mt-1.5">
                         <p className="text-sm font-semibold text-slate-700 group-hover:text-[#1c7ed6] transition-colors leading-snug">{item.title}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 flex items-center gap-1.5"><Globe size={12}/> Read Article</p>
                       </a>
                     ) : (
                       <p className="text-sm font-semibold text-slate-900 mt-1.5 leading-snug">{item.title}</p>
                     )}
                   </div>
                 ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5 uppercase tracking-tight" style={displayFont}><Trophy style={{ color: '#d6336c' }} size={24}/> National Leaderboard</h2>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1.5">Combine Results Tracker</p>
              </div>
              <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">{filteredAndSortedPlayers.length} Athletes Found</div>
            </div>

            <div className="bg-slate-50/50 p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4">
               <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                 <input type="text" placeholder="Search by athlete name..." className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl pl-12 pr-4 py-3 text-sm font-medium focus:outline-none transition-all focus:border-[#1c7ed6] focus:ring-2 focus:ring-[#1c7ed6]/20 shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
               </div>
               <div className="flex gap-4 sm:w-auto w-full">
                  <div className="flex-1 md:w-40">
                     <select className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none cursor-pointer transition-all focus:border-[#1c7ed6] focus:ring-2 focus:ring-[#1c7ed6]/20 shadow-sm" value={posFilter} onChange={(e) => setPosFilter(e.target.value)}>
                       {uniquePositions.map(pos => <option key={pos} value={pos}>{pos === 'All' ? 'All Positions' : pos}</option>)}
                     </select>
                  </div>
                  <div className="flex-1 md:w-44">
                     <select className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none cursor-pointer transition-all focus:border-[#1c7ed6] focus:ring-2 focus:ring-[#1c7ed6]/20 shadow-sm" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                       {uniqueYears.map(year => <option key={year} value={year}>{year === 'All' ? 'All Classes' : `Class of ${year}`}</option>)}
                     </select>
                  </div>
               </div>
            </div>

            <div className="md:hidden flex items-center justify-start gap-2 px-5 py-3 bg-slate-50/80 border-b border-slate-100 text-slate-500 shadow-inner w-full overflow-hidden">
              <ChevronLeft size={14} className="animate-pulse text-[#1c7ed6] shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 truncate">Swipe table to view all metrics</span>
              <ChevronLeft size={14} className="rotate-180 animate-pulse text-[#1c7ed6] shrink-0" />
            </div>

            <div className="overflow-x-auto w-full relative">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-white text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <SortableHeader label="Athlete" sortKey="name" align="left" />
                    <SortableHeader label="DNA Score" sortKey="dnaScore" />
                    <SortableHeader label="40-Yd" sortKey="sprint" />
                    <SortableHeader label="5-10-5" sortKey="shuttle" />
                    <SortableHeader label="L-Drill" sortKey="lDrill" />
                    <SortableHeader label="MPH" sortKey="mph" />
                    <SortableHeader label="Broad" sortKey="broad" />
                    <SortableHeader label="Vert" sortKey="vertical" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAndSortedPlayers.length === 0 ? (
                     <tr><td colSpan="8" className="p-16 text-center text-slate-400 font-medium text-sm">No athletes match your filters.</td></tr>
                  ) : (
                     filteredAndSortedPlayers.map((p, i) => (
                       <tr key={p.id} onClick={() => onSelect(p)} className="hover:bg-slate-50/80 cursor-pointer transition-colors group border-b border-slate-50">
                         <td className="p-4 md:p-5">
                           <div className="flex items-center gap-4">
                             <div className="w-6 text-center text-slate-300 font-bold text-xs">{i + 1}</div>
                             <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} alt={p.name} className="w-11 h-11 rounded-full border border-slate-200 bg-slate-50 object-cover transition-colors group-hover:border-[#d6336c]" />
                             <div>
                               <p className="font-extrabold text-slate-900 text-sm uppercase flex items-center gap-1.5 transition-colors group-hover:text-[#1c7ed6]" style={displayFont}>{p.name} {p.hudlLink && <Video size={14} style={{ color: '#1c7ed6' }} />}</p>
                               <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase mt-0.5">{p.primaryPos || p.pos} • {p.gradYear}</p>
                             </div>
                           </div>
                         </td>
                         <td className="p-4 md:p-5 text-center">
                           <span className="font-black text-xl px-4 py-1.5 rounded-lg border border-slate-100 bg-white group-hover:border-slate-200 shadow-sm transition-colors" style={{ color: '#d6336c', ...displayFont }}>{p.dnaScore}</span>
                         </td>
                         <td className="p-4 md:p-5 text-center font-medium text-sm text-slate-600">{p.metrics?.sprint || '-'}</td>
                         <td className="p-4 md:p-5 text-center font-medium text-sm text-slate-600">{p.metrics?.shuttle || '-'}</td>
                         <td className="p-4 md:p-5 text-center font-medium text-sm text-slate-600">{p.metrics?.lDrill || '-'}</td>
                         <td className="p-4 md:p-5 text-center font-medium text-sm text-slate-600">{p.metrics?.mph || '-'}</td>
                         <td className="p-4 md:p-5 text-center font-medium text-sm text-slate-600">{p.metrics?.broad || '-'}</td>
                         <td className="p-4 md:p-5 text-center font-medium text-sm text-slate-600">{p.metrics?.vertical || '-'}</td>
                       </tr>
                     ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- ADMIN PANEL ---
const InputLabel = ({ children }) => <label className="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-widest">{children}</label>;
const FormInput = (props) => <input {...props} className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium focus:outline-none focus:border-[#1c7ed6] focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all ${props.className || ''}`} />;

const AdminPanel = ({ onBack, dbConfigured, players, scouts, onLogout }) => {
  const [activeTab, setActiveTab] = useState('athlete');
  const [savingAthlete, setSavingAthlete] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedExistingId, setSelectedExistingId] = useState("");
  const [athleteSearchTerm, setAthleteSearchTerm] = useState("");
  
  const [newsTitle, setNewsTitle] = useState('');
  const [newsCategory, setNewsCategory] = useState('ANNOUNCEMENT');

  const today = new Date().toISOString().split('T')[0];

  const defaultMetrics = {
    name: '', primaryPos: 'QB', secondaryPos: '', gradYear: '', city: '', state: '', dnaTeam: 'None', externalClub: '',
    gpa: '', sat: '', twitter: '', guardianEmail: '', scoutNotes: '', heightFeet: '', heightInches: '', weight: '',
    sprint: '', sprintVerify: 'laser', shuttle: '', shuttleVerify: 'stopwatch', lDrill: '', lDrillVerify: 'stopwatch', mph: '', mphVerify: 'laser',
    broadFeet: '', broadInches: '', verticalInches: '', catchingPct: '', throwingPct: '', flagPullingPct: '', 
    hudlLink: '', stat1Label: 'Touchdowns', stat1Value: '', stat2Label: 'Interceptions', stat2Value: '', stat3Label: 'Yards / Rec', stat3Value: '',
    combineLocation: '', combineDate: today
  };
  const [metrics, setMetrics] = useState(defaultMetrics);

  const filteredAdminPlayers = useMemo(() => {
    let list = players;
    if (athleteSearchTerm) list = players.filter(p => p.id === selectedExistingId || p.name.toLowerCase().includes(athleteSearchTerm.toLowerCase()));
    return list.sort((a, b) => a.name.split(' ').slice(-1)[0].localeCompare(b.name.split(' ').slice(-1)[0]));
  }, [players, athleteSearchTerm, selectedExistingId]);

  const handleSelectExisting = (playerId) => {
    setSelectedExistingId(playerId);
    if (!playerId) { setMetrics(defaultMetrics); setPhotoPreview(null); return; }
    const p = players.find(player => player.id === playerId);
    if (p) {
      setMetrics({
        name: p.name || '', primaryPos: p.primaryPos || p.pos || 'QB', secondaryPos: p.secondaryPos || '', dnaTeam: p.dnaTeam || 'None', externalClub: p.externalClub || '',
        gradYear: p.gradYear || '', city: p.city || '', state: p.state || '', gpa: p.gpa || '', sat: p.sat || '', twitter: p.twitter || '', guardianEmail: p.guardianEmail || '', 
        scoutNotes: p.scoutNotes || '', weight: p.weight || '', hudlLink: p.hudlLink || '', 
        stat1Label: p.seasonStats?.stat1Label || 'Touchdowns', stat1Value: p.seasonStats?.stat1Value || '',
        stat2Label: p.seasonStats?.stat2Label || 'Interceptions', stat2Value: p.seasonStats?.stat2Value || '',
        stat3Label: p.seasonStats?.stat3Label || 'Yards / Rec', stat3Value: p.seasonStats?.stat3Value || '',
        combineLocation: p.combineEvent?.location || '', combineDate: p.combineEvent?.date || today,
        sprint: p.metrics?.sprint ? p.metrics.sprint.replace('s', '') : '', sprintVerify: p.speedVerifications?.sprint || 'laser',
        shuttle: p.metrics?.shuttle ? p.metrics.shuttle.replace('s', '') : '', shuttleVerify: p.speedVerifications?.shuttle || 'stopwatch',
        lDrill: p.metrics?.lDrill ? p.metrics.lDrill.replace('s', '') : '', lDrillVerify: p.speedVerifications?.lDrill || 'stopwatch',
        mph: p.metrics?.mph ? p.metrics.mph.replace(' mph', '') : '', mphVerify: p.speedVerifications?.mph || 'laser',
        verticalInches: p.metrics?.vertical ? p.metrics.vertical.replace('"', '') : '',
        heightFeet: p.height?.includes("'") ? p.height.split("'")[0] : '', heightInches: p.height?.includes("'") ? p.height.split("'")[1].replace('"', '') : '',
        broadFeet: p.metrics?.broad?.includes("'") ? p.metrics.broad.split("'")[0] : '', broadInches: p.metrics?.broad?.includes("'") ? p.metrics.broad.split("'")[1].replace('"', '') : '',
        catchingPct: p.metrics?.catching ? p.metrics.catching.replace('%', '') : '', throwingPct: p.metrics?.throwing ? p.metrics.throwing.replace('%', '') : '', flagPullingPct: p.metrics?.flag ? p.metrics.flag.replace('%', '') : ''
      });
      setPhotoPreview(p.avatar || null);
    }
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
    e.preventDefault(); setSavingAthlete(true);
    try {
      const auth = getAuth(app);
      if (!auth.currentUser) { alert("Firebase Error: No secure session."); setSavingAthlete(false); return; }
      const secureToken = await auth.currentUser.getIdToken(true);
      const calculateDNAScore = httpsCallable(getFunctions(app), 'calculateDNAScore');

      const existingPlayer = selectedExistingId ? players.find(p => p.id === selectedExistingId) : null;
      let historyPool = existingPlayer?.combineHistory ? [...existingPlayer.combineHistory] : [];
      if (historyPool.length > 0 && historyPool[historyPool.length - 1].date === metrics.combineDate) historyPool.pop();

      const parseNum = (val) => Number(String(val).replace(/[^0-9.]/g, '')) || 0;
      const bestSprint = Math.min(...[...historyPool.map(e => parseNum(e.metrics?.sprint)), parseNum(metrics.sprint)].filter(v => v > 0)) || 0;
      const bestShuttle = Math.min(...[...historyPool.map(e => parseNum(e.metrics?.shuttle)), parseNum(metrics.shuttle)].filter(v => v > 0)) || 0;
      const bestLDrill = Math.min(...[...historyPool.map(e => parseNum(e.metrics?.lDrill)), parseNum(metrics.lDrill)].filter(v => v > 0)) || 0;
      const bestMph = Math.max(...[...historyPool.map(e => parseNum(e.metrics?.mph)), parseNum(metrics.mph)].filter(v => v > 0)) || 0;
      const currentBroadInches = (Number(metrics.broadFeet) || 0) * 12 + (Number(metrics.broadInches) || 0);

      const overallResult = await calculateDNAScore({ token: secureToken, sprint: bestSprint, shuttle: bestShuttle, lDrill: bestLDrill, mph: bestMph, catchingPct: Number(metrics.catchingPct) || 0, throwingPct: Number(metrics.throwingPct) || 0, flagPullingPct: Number(metrics.flagPullingPct) || 0, broadInches: currentBroadInches, vertical: Number(metrics.verticalInches) || 0 });
      
      const newCombineRecord = { location: metrics.combineLocation, date: metrics.combineDate, timestamp: new Date().toLocaleTimeString(), dnaScore: overallResult.data.dnaScore, height: `${metrics.heightFeet || 0}'${metrics.heightInches || 0}"`, weight: Number(metrics.weight) || 0, speedVerifications: { sprint: metrics.sprintVerify, shuttle: metrics.shuttleVerify, lDrill: metrics.lDrillVerify, mph: metrics.mphVerify }, metrics: { sprint: metrics.sprint ? `${Number(metrics.sprint).toFixed(2)}s` : "", shuttle: metrics.shuttle ? `${Number(metrics.shuttle).toFixed(2)}s` : "", lDrill: metrics.lDrill ? `${Number(metrics.lDrill).toFixed(2)}s` : "", mph: metrics.mph ? `${metrics.mph} mph` : "", broad: (metrics.broadFeet || metrics.broadInches) ? `${metrics.broadFeet || 0}'${metrics.broadInches || 0}"` : "", vertical: metrics.verticalInches ? `${metrics.verticalInches}"` : "", catching: metrics.catchingPct ? `${metrics.catchingPct}%` : "", throwing: metrics.throwingPct ? `${metrics.throwingPct}%` : "", flag: metrics.flagPullingPct ? `${metrics.flagPullingPct}%` : "" } };

      const playerData = {
        name: metrics.name, primaryPos: metrics.primaryPos, secondaryPos: metrics.secondaryPos, gradYear: Number(metrics.gradYear), city: metrics.city, state: metrics.state, dnaTeam: metrics.dnaTeam, externalClub: metrics.externalClub,
        gpa: metrics.gpa, sat: metrics.sat, twitter: metrics.twitter, guardianEmail: metrics.guardianEmail, scoutNotes: metrics.scoutNotes, hudlLink: metrics.hudlLink, 
        seasonStats: { stat1Label: metrics.stat1Label, stat1Value: metrics.stat1Value, stat2Label: metrics.stat2Label, stat2Value: metrics.stat2Value, stat3Label: metrics.stat3Label, stat3Value: metrics.stat3Value },
        height: newCombineRecord.height, weight: newCombineRecord.weight, dnaScore: overallResult.data.dnaScore, combineEvent: { location: newCombineRecord.location, date: newCombineRecord.date },
        speedVerifications: newCombineRecord.speedVerifications, metrics: newCombineRecord.metrics, updatedAt: Date.now()
      };

      if (dbConfigured && db) {
        // --- NEW: FIREBASE STORAGE UPLOAD LOGIC ---
        let finalAvatarUrl = existingPlayer?.avatar || ""; 
        // Only upload to Storage if photoPreview has a new Base64 string
        if (photoPreview && photoPreview.startsWith('data:image')) {
           const storageRef = ref(storage, `avatars/${Date.now()}_${metrics.name.replace(/\s+/g, '_')}.jpg`);
           await uploadString(storageRef, photoPreview, 'data_url');
           finalAvatarUrl = await getDownloadURL(storageRef);
        }

        if (selectedExistingId) {
          let updatedHistory = existingPlayer?.combineHistory ? [...existingPlayer.combineHistory] : [];
          if (updatedHistory.length > 0 && updatedHistory[updatedHistory.length - 1].date === newCombineRecord.date) updatedHistory[updatedHistory.length - 1] = newCombineRecord; else updatedHistory.push(newCombineRecord);
          
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', selectedExistingId), { 
            ...playerData, 
            combineHistory: updatedHistory, 
            avatar: finalAvatarUrl 
          });
          
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'news'), {
            title: `${metrics.name} posted a new verified DNA Score of ${overallResult.data.dnaScore}!`,
            category: 'COMBINE',
            timestamp: Date.now()
          });

        } else {
          playerData.avatar = finalAvatarUrl;
          playerData.views = 0; 
          playerData.createdAt = Date.now(); 
          playerData.combineHistory = [newCombineRecord];
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'players'), playerData);
          
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'news'), {
            title: `New Prospect Added: ${metrics.name} (Class of ${metrics.gradYear}) joins the national leaderboard.`,
            category: 'ANNOUNCEMENT',
            timestamp: Date.now()
          });
        }
      }
      alert(`Saved! Score: ${overallResult.data.dnaScore}`); setMetrics(defaultMetrics); setSelectedExistingId(""); setPhotoPreview(null);
    } catch (err) { alert("Error saving: " + err.message); }
    setSavingAthlete(false);
  };

  const deleteAthlete = async () => {
    if (!selectedExistingId) return;
    if (!window.confirm(`Delete ${metrics.name}?`)) return;
    if (dbConfigured && db) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', selectedExistingId));
    setMetrics(defaultMetrics); setSelectedExistingId(""); setPhotoPreview(null);
  };

  const submitNews = async (e) => {
    e.preventDefault();
    if (!newsTitle) return;
    try {
      if (dbConfigured && db) {
         await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'news'), {
           title: newsTitle, category: newsCategory, timestamp: Date.now()
         });
      }
      setNewsTitle('');
      alert('News update posted successfully!');
    } catch (err) {
      alert("Error posting news: " + err.message);
    }
  };

  const toggleScoutApproval = async (scoutId, currentStatus) => {
    if (dbConfigured && db) {
       try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'recruiters', scoutId), { approved: !currentStatus }); } 
       catch (e) { alert("Failed to update status: " + e.message); }
    }
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
              <div className="bg-slate-50/80 p-6 rounded-2xl mb-8 border border-slate-100">
                <label className="text-xs font-extrabold uppercase tracking-widest block mb-4 text-slate-800">Select Existing Athlete (Or Create New)</label>
                <div className="relative mb-3"><Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search athlete by name..." className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all focus:outline-none" value={athleteSearchTerm} onChange={(e) => setAthleteSearchTerm(e.target.value)} /></div>
                <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all focus:outline-none" value={selectedExistingId} onChange={(e) => handleSelectExisting(e.target.value)}><option value="">+ Create Brand New Athlete</option>{filteredAdminPlayers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.gradYear})</option>)}</select>
              </div>

              <form onSubmit={submitCombineData} className="space-y-8">
                <div className="flex flex-col sm:flex-row items-center gap-8 bg-slate-50/80 p-6 rounded-2xl border border-slate-100">
                  <div className="relative w-36 h-36 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden shrink-0 group hover:border-[#1c7ed6] transition-colors cursor-pointer">
                     {photoPreview ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" /> : <div className="text-center p-2"><Camera className="w-8 h-8 mx-auto text-slate-300 mb-2 group-hover:text-[#1c7ed6] transition-colors" /></div>}
                     <input type="file" accept="image/*" onChange={handlePhotoCapture} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-5">
                     <div className="sm:col-span-2"><InputLabel>Name</InputLabel><FormInput required value={metrics.name} onChange={e => setMetrics({...metrics, name: e.target.value})} disabled={!!selectedExistingId} /></div>
                     <div><InputLabel>Primary Position</InputLabel><select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all focus:outline-none" value={metrics.primaryPos} onChange={e => setMetrics({...metrics, primaryPos: e.target.value})}>{["QB", "RB", "WR", "TE", "C", "DB", "LB", "RUSH", "ATH"].map(pos => <option key={pos} value={pos}>{pos}</option>)}</select></div>
                     <div><InputLabel>Secondary Position</InputLabel><select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all focus:outline-none" value={metrics.secondaryPos} onChange={e => setMetrics({...metrics, secondaryPos: e.target.value})}><option value="">None</option>{["QB", "RB", "WR", "TE", "C", "DB", "LB", "RUSH", "ATH"].map(pos => <option key={pos} value={pos}>{pos}</option>)}</select></div>
                     <div><InputLabel>Grad Year</InputLabel><FormInput required type="number" value={metrics.gradYear} onChange={e => setMetrics({...metrics, gradYear: e.target.value})} disabled={!!selectedExistingId} /></div>
                     <div><InputLabel>State</InputLabel><FormInput required maxLength="2" placeholder="NJ" value={metrics.state} onChange={e => setMetrics({...metrics, state: e.target.value.toUpperCase()})} /></div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-t-4 border-t-[#d6336c]">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest mb-6 flex items-center gap-2 text-[#d6336c]"><Users size={16} /> Club Team Assignment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <InputLabel>DNA Roster (Tournament Teams)</InputLabel>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#d6336c]/20 transition-all" value={metrics.dnaTeam} onChange={e => setMetrics({...metrics, dnaTeam: e.target.value})}>
                        <option value="None">Not Assigned</option>
                        <option value="DNA 18U Elite">DNA 18U Elite</option>
                        <option value="DNA 18U Select">DNA 18U Select</option>
                        <option value="DNA 15U Elite">DNA 15U Elite</option>
                        <option value="DNA 15U Select">DNA 15U Select</option>
                        <option value="DNA 12U">DNA 12U</option>
                      </select>
                    </div>
                    <div>
                      <InputLabel>3rd Party / External Club</InputLabel>
                      <FormInput type="text" placeholder="e.g. Next Level Athletics" value={metrics.externalClub} onChange={e => setMetrics({...metrics, externalClub: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-t-4 border-t-[#1c7ed6]">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest mb-6 flex items-center gap-2 text-[#1c7ed6]"><GraduationCap size={16} /> Academic & Recruiting</h3>
                  <div className="grid grid-cols-2 gap-5 mb-5">
                    <div><InputLabel>GPA</InputLabel><FormInput type="number" step="0.1" value={metrics.gpa} onChange={e => setMetrics({...metrics, gpa: e.target.value})} /></div>
                    <div><InputLabel>SAT/ACT</InputLabel><FormInput type="text" value={metrics.sat} onChange={e => setMetrics({...metrics, sat: e.target.value})} /></div>
                    <div><InputLabel>Twitter</InputLabel><FormInput type="text" value={metrics.twitter} onChange={e => setMetrics({...metrics, twitter: e.target.value})} /></div>
                    <div><InputLabel>Guardian Email</InputLabel><FormInput type="email" value={metrics.guardianEmail} onChange={e => setMetrics({...metrics, guardianEmail: e.target.value})} /></div>
                  </div>
                  <div><InputLabel>Scout Notes</InputLabel><textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all focus:outline-none min-h-[100px]" value={metrics.scoutNotes} onChange={e => setMetrics({...metrics, scoutNotes: e.target.value})} /></div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-t-4 border-t-amber-500">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest mb-6 flex items-center gap-2 text-amber-500"><Trophy size={16} /> Media & In-Season Stats</h3>
                  <div className="mb-5">
                    <InputLabel>Highlight Tape URL (Hudl / YouTube)</InputLabel>
                    <FormInput type="url" placeholder="https://..." value={metrics.hudlLink} onChange={e => setMetrics({...metrics, hudlLink: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <InputLabel>Stat 1 Label & Value</InputLabel>
                      <div className="flex gap-2">
                        <FormInput type="text" placeholder="TDs" className="w-1/2" value={metrics.stat1Label} onChange={e => setMetrics({...metrics, stat1Label: e.target.value})} />
                        <FormInput type="number" placeholder="0" className="w-1/2" value={metrics.stat1Value} onChange={e => setMetrics({...metrics, stat1Value: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <InputLabel>Stat 2 Label & Value</InputLabel>
                      <div className="flex gap-2">
                        <FormInput type="text" placeholder="INTs" className="w-1/2" value={metrics.stat2Label} onChange={e => setMetrics({...metrics, stat2Label: e.target.value})} />
                        <FormInput type="number" placeholder="0" className="w-1/2" value={metrics.stat2Value} onChange={e => setMetrics({...metrics, stat2Value: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <InputLabel>Stat 3 Label & Value</InputLabel>
                      <div className="flex gap-2">
                        <FormInput type="text" placeholder="Yds" className="w-1/2" value={metrics.stat3Label} onChange={e => setMetrics({...metrics, stat3Label: e.target.value})} />
                        <FormInput type="number" placeholder="0" className="w-1/2" value={metrics.stat3Value} onChange={e => setMetrics({...metrics, stat3Value: e.target.value})} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-t-4 border-t-slate-800">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest mb-6 flex items-center gap-2 text-slate-800"><MapPin size={16} /> Combine Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><div><InputLabel>Location</InputLabel><FormInput required type="text" value={metrics.combineLocation} onChange={e => setMetrics({...metrics, combineLocation: e.target.value})} /></div><div><InputLabel>Date</InputLabel><FormInput required type="date" value={metrics.combineDate} onChange={e => setMetrics({...metrics, combineDate: e.target.value})} /></div></div>
                </div>

                <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest mb-6 flex items-center gap-2 text-[#1c7ed6]"><Zap size={16} /> Speed Verifications</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    <div>
                      <InputLabel>40-Yd (Sec)</InputLabel>
                      <FormInput type="number" step="0.01" value={metrics.sprint} onChange={e => setMetrics({...metrics, sprint: e.target.value})} />
                      <select className="w-full mt-2 bg-white border border-slate-200 text-[10px] font-bold p-2 rounded-lg" value={metrics.sprintVerify} onChange={e => setMetrics({...metrics, sprintVerify: e.target.value})}>
                        <option value="laser">Laser</option>
                        <option value="stopwatch">Hand-Timed</option>
                        <option value="standard">DNA Verified</option>
                      </select>
                    </div>
                    <div>
                      <InputLabel>5-10-5 (Sec)</InputLabel>
                      <FormInput type="number" step="0.01" value={metrics.shuttle} onChange={e => setMetrics({...metrics, shuttle: e.target.value})} />
                      <select className="w-full mt-2 bg-white border border-slate-200 text-[10px] font-bold p-2 rounded-lg" value={metrics.shuttleVerify} onChange={e => setMetrics({...metrics, shuttleVerify: e.target.value})}>
                        <option value="stopwatch">Hand-Timed</option>
                        <option value="laser">Laser</option>
                        <option value="standard">DNA Verified</option>
                      </select>
                    </div>
                    <div>
                      <InputLabel>L Drill (Sec)</InputLabel>
                      <FormInput type="number" step="0.01" value={metrics.lDrill} onChange={e => setMetrics({...metrics, lDrill: e.target.value})} />
                      <select className="w-full mt-2 bg-white border border-slate-200 text-[10px] font-bold p-2 rounded-lg" value={metrics.lDrillVerify} onChange={e => setMetrics({...metrics, lDrillVerify: e.target.value})}>
                        <option value="stopwatch">Hand-Timed</option>
                        <option value="laser">Laser</option>
                        <option value="standard">DNA Verified</option>
                      </select>
                    </div>
                    <div>
                      <InputLabel>Max Speed (MPH)</InputLabel>
                      <FormInput type="number" step="0.1" value={metrics.mph} onChange={e => setMetrics({...metrics, mph: e.target.value})} />
                      <select className="w-full mt-2 bg-white border border-slate-200 text-[10px] font-bold p-2 rounded-lg" value={metrics.mphVerify} onChange={e => setMetrics({...metrics, mphVerify: e.target.value})}>
                        <option value="laser">Laser</option>
                        <option value="stopwatch">Hand-Timed</option>
                        <option value="standard">DNA Verified</option>
                      </select>
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
                  <button type="submit" disabled={savingAthlete} className="flex-1 hover:-translate-y-0.5 transition-all text-white font-bold py-4 rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}>Save Profile</button>
                  {selectedExistingId && <button type="button" onClick={deleteAthlete} className="px-8 hover:-translate-y-0.5 transition-all text-white font-bold rounded-xl shadow-md bg-rose-500 hover:bg-rose-600">Delete</button>}
                </div>
              </form>
           </div>
        )}

        {activeTab === 'news' && (
          <div className="animate-in fade-in slide-in-from-right-4 max-w-2xl mx-auto">
            <form onSubmit={submitNews} className="space-y-6">
              <div>
                <InputLabel>Headline</InputLabel>
                <FormInput required type="text" placeholder="e.g., DNA 15U Wins Tournament..." value={newsTitle} onChange={(e) => setNewsTitle(e.target.value)} />
              </div>
              <div>
                <InputLabel>Category</InputLabel>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all focus:outline-none" value={newsCategory} onChange={(e) => setNewsCategory(e.target.value)}>
                  <option value="ANNOUNCEMENT">Announcement</option>
                  <option value="RECRUITING">Recruiting</option>
                  <option value="TOURNAMENT">Tournament Result</option>
                  <option value="COMBINE">Combine Result</option>
                </select>
              </div>
              <button type="submit" className="w-full hover:-translate-y-0.5 transition-all text-white font-bold py-4 rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}>Post Update to Hub</button>
            </form>
          </div>
        )}

        {activeTab === 'scouts' && (
          <div className="animate-in fade-in slide-in-from-right-4">
            <h3 className="text-2xl font-extrabold text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-3" style={displayFont}><Building size={24} className="text-[#1c7ed6]"/> Scout Database Approvals</h3>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                     <th className="p-5">Coach Name</th>
                     <th className="p-5">University</th>
                     <th className="p-5">Email (.edu)</th>
                     <th className="p-5 text-center">Access Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {scouts.length === 0 ? <tr><td colSpan="4" className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No registered scouts yet.</td></tr> : 
                    scouts.sort((a,b) => (a.approved === b.approved) ? 0 : a.approved ? 1 : -1).map(scout => (
                     <tr key={scout.id} className="hover:bg-slate-50/50 transition-colors">
                       <td className="p-5 font-bold text-slate-800 text-sm">{scout.name}</td>
                       <td className="p-5 font-bold text-slate-500 text-sm">{scout.school}</td>
                       <td className="p-5 text-sm font-medium text-slate-500">{scout.email}</td>
                       <td className="p-5 text-center">
                         <button 
                           onClick={() => toggleScoutApproval(scout.id, scout.approved)}
                           className={`text-[10px] font-extrabold uppercase tracking-widest px-4 py-2 rounded-full flex items-center justify-center gap-1.5 mx-auto transition-colors ${scout.approved ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100' : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100'}`}
                         >
                           {scout.approved ? <><CheckCircle size={14}/> Approved</> : <><Clock size={14}/> Pending Approval</>}
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- PHASE 2: THE RECRUITER PORTAL ---
const DraggableCard = ({ player, onClick }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: player.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 999, position: 'relative' } : undefined;
  
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-[0_4px_12px_rgb(0,0,0,0.03)] cursor-grab active:cursor-grabbing hover:border-[#1c7ed6]/50 hover:shadow-md transition-all flex items-center gap-3 relative group touch-none">
       <GripVertical size={16} className="text-slate-300 absolute left-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
       <img src={player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} className="w-12 h-12 rounded-full border border-slate-100 ml-3 object-cover" alt={player.name} />
       <div className="flex-1 min-w-0" onPointerDown={(e) => { e.stopPropagation(); onClick(player); }}>
         <p className="text-sm font-bold text-slate-800 truncate group-hover:text-[#1c7ed6] transition-colors" style={displayFont}>{player.name}</p>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">{player.primaryPos} • {player.gradYear}</p>
       </div>
       <div className="text-center shrink-0 pr-1">
         <span className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">DNA</span>
         <span className="text-sm font-black text-[#d6336c]" style={displayFont}>{player.dnaScore}</span>
       </div>
    </div>
  );
};

const DroppableColumn = ({ id, title, players, onPlayerClick }) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div className="flex flex-col bg-slate-50/50 rounded-3xl border border-slate-100 h-[650px] flex-1 min-w-[300px]">
       <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center rounded-t-3xl">
         <h3 className="font-extrabold text-slate-800 uppercase tracking-tight text-sm" style={displayFont}>{title}</h3>
         <span className="text-[11px] font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">{players.length}</span>
       </div>
       <div ref={setNodeRef} className={`flex-1 p-4 overflow-y-auto space-y-3 transition-colors rounded-b-3xl ${isOver ? 'bg-blue-50/50 ring-2 ring-inset ring-[#1c7ed6]/20' : ''}`}>
         {players.map(p => <DraggableCard key={p.id} player={p} onClick={onPlayerClick} />)}
       </div>
    </div>
  );
};

const DatabaseRow = ({ player, onSelect, boardData, onMoveToBoard }) => {
  let currentStatus = '';
  if (boardData.priority.includes(player.id)) currentStatus = 'priority';
  else if (boardData.interested.includes(player.id)) currentStatus = 'interested';
  else if (boardData.pass.includes(player.id)) currentStatus = 'pass';

  return (
    <tr className="hover:bg-slate-50/80 border-b border-slate-50 transition-colors group">
      <td className="p-4 md:p-5">
         <div className="flex items-center gap-4">
           <img src={player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} alt={player.name} className="w-10 h-10 rounded-full border border-slate-200 object-cover cursor-pointer hover:border-[#1c7ed6] transition-colors" onClick={() => onSelect(player)} />
           <div onClick={() => onSelect(player)} className="cursor-pointer">
             <p className="font-extrabold text-slate-900 text-sm group-hover:text-[#1c7ed6] transition-colors" style={displayFont}>{player.name}</p>
             <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase mt-0.5">{player.city}, {player.state}</p>
           </div>
         </div>
      </td>
      <td className="p-4 md:p-5 text-center"><span className="font-black text-lg text-[#d6336c] bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm" style={displayFont}>{player.dnaScore}</span></td>
      <td className="p-4 md:p-5 text-center text-xs font-bold text-slate-600">{player.primaryPos} / {player.gradYear}</td>
      <td className="p-4 md:p-5 text-center text-xs font-semibold text-slate-600">{player.metrics?.sprint || '-'}</td>
      <td className="p-4 md:p-5 text-center text-xs font-semibold text-slate-600">{player.gpa || '-'}</td>
      <td className="p-4 md:p-5 text-center">
         <div className="flex flex-col items-center gap-1.5">
           {player.guardianEmail && <a href={`mailto:${player.guardianEmail}`} title="Email Guardian" className="text-slate-400 hover:text-[#d6336c] transition-colors"><Mail size={16}/></a>}
           {player.twitter && <a href={`https://twitter.com/${player.twitter.replace('@', '')}`} target="_blank" rel="noreferrer" title="Twitter" className="text-slate-400 hover:text-[#1c7ed6] transition-colors"><AtSign size={16}/></a>}
           {!player.guardianEmail && !player.twitter && <span className="text-slate-300">-</span>}
         </div>
      </td>
      <td className="p-4 md:p-5 text-center">
         <select 
           className={`text-[10px] font-extrabold uppercase tracking-wider rounded-lg px-3 py-2 border cursor-pointer focus:outline-none transition-colors ${currentStatus ? 'bg-[#1c7ed6] text-white border-[#1c7ed6] shadow-md shadow-blue-500/20' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
           value={currentStatus}
           onChange={(e) => onMoveToBoard(player.id, e.target.value)}
         >
            <option value="">+ Add to Board</option>
            <option value="priority">⭐ Priority</option>
            <option value="interested">👀 Interested</option>
            <option value="pass">🚫 Pass</option>
         </select>
      </td>
      <td className="p-4 md:p-5 text-center">{player.hudlLink ? <a href={player.hudlLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-white bg-slate-900 px-3 py-1.5 rounded-lg hover:bg-[#1c7ed6] transition-colors uppercase tracking-wide"><Video size={14}/> Film</a> : '-'}</td>
    </tr>
  );
};

const RecruiterPortal = ({ players, recruiterData, onSelect, onLogout }) => {
  const [activeTab, setActiveTab] = useState('database');
  const [boardData, setBoardData] = useState({ priority: [], interested: [], pass: [] });
  
  // Filtering States
  const [minDna, setMinDna] = useState(0);
  const [minGpa, setMinGpa] = useState(0);
  const [maxSprint, setMaxSprint] = useState(10);
  const [maxShuttle, setMaxShuttle] = useState(10);
  const [maxLDrill, setMaxLDrill] = useState(10);
  const [minBroad, setMinBroad] = useState(0);
  const [minVert, setMinVert] = useState(0);
  const [posFilter, setPosFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');

  useEffect(() => {
    if (!recruiterData?.uid || !isFirebaseActive) return;
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'recruiters', recruiterData.uid), (docSnap) => {
      if (docSnap.exists() && docSnap.data().board) setBoardData(docSnap.data().board);
    });
    return () => unsub();
  }, [recruiterData]);

  const uniquePositions = useMemo(() => ['All', ...new Set(players.map(p => p.primaryPos).filter(Boolean))].sort(), [players]);
  const uniqueYears = useMemo(() => ['All', ...new Set(players.map(p => p.gradYear).filter(Boolean))].sort((a,b)=>b-a), [players]);
  const parseBroad = (str) => { if (!str) return 0; const ftMatch = str.match(/(\d+)'/); const inMatch = str.match(/(\d+)"/); return (ftMatch ? parseInt(ftMatch[1]) * 12 : 0) + (inMatch ? parseInt(inMatch[1]) : 0); };

  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      const matchPos = posFilter === 'All' || p.primaryPos === posFilter;
      const matchYear = yearFilter === 'All' || p.gradYear === Number(yearFilter);
      const matchDna = (Number(p.dnaScore) || 0) >= Number(minDna);
      const matchGpa = (Number(p.gpa) || 0) >= Number(minGpa);
      
      const sprintNum = parseFloat(p.metrics?.sprint) || 99;
      const matchSprint = maxSprint >= 10 || sprintNum <= Number(maxSprint);
      
      const shuttleNum = parseFloat(p.metrics?.shuttle) || 99;
      const matchShuttle = maxShuttle >= 10 || shuttleNum <= Number(maxShuttle);

      const lDrillNum = parseFloat(p.metrics?.lDrill) || 99;
      const matchLDrill = maxLDrill >= 10 || lDrillNum <= Number(maxLDrill);

      const broadInches = parseBroad(p.metrics?.broad);
      const matchBroad = minBroad <= 0 || broadInches >= Number(minBroad);

      const vertNum = parseFloat(p.metrics?.vertical) || 0;
      const matchVert = minVert <= 0 || vertNum >= Number(minVert);

      return matchPos && matchYear && matchDna && matchGpa && matchSprint && matchShuttle && matchLDrill && matchBroad && matchVert;
    }).sort((a, b) => Number(b.dnaScore) - Number(a.dnaScore));
  }, [players, minDna, maxSprint, maxShuttle, maxLDrill, minBroad, minVert, minGpa, posFilter, yearFilter]);

  const exportDatabaseCSV = () => {
    const headers = ["Name", "Position", "Class", "DNA Score", "GPA", "SAT", "40-Yd", "State", "Guardian Email", "Twitter", "Hudl Link"];
    const rows = filteredPlayers.map(p => [ `"${p.name}"`, p.primaryPos, p.gradYear, p.dnaScore, p.gpa || 'N/A', p.sat || 'N/A', p.metrics?.sprint || 'N/A', p.state, p.guardianEmail || 'N/A', p.twitter || 'N/A', p.hudlLink || 'N/A' ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DNA_Prospects_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click(); link.remove();
  };

  const exportBoardCSV = () => {
    const headers = ["Name", "Position", "Class", "Board Status", "DNA Score", "GPA", "SAT", "40-Yd", "State", "Guardian Email", "Twitter", "Hudl Link"];
    
    const getRows = (statusArr, statusLabel) => statusArr.map(id => {
      const p = players.find(player => player.id === id);
      if (!p) return null;
      return [ `"${p.name}"`, p.primaryPos, p.gradYear, statusLabel, p.dnaScore, p.gpa || 'N/A', p.sat || 'N/A', p.metrics?.sprint || 'N/A', p.state, p.guardianEmail || 'N/A', p.twitter || 'N/A', p.hudlLink || 'N/A' ];
    }).filter(Boolean);

    const rows = [
      ...getRows(boardData.priority, "Priority"),
      ...getRows(boardData.interested, "Interested"),
      ...getRows(boardData.pass, "Pass")
    ];

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DNA_Recruiting_Board_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click(); link.remove();
  };

  const handleMoveToBoard = async (playerId, destCol) => {
    const newBoard = {
      priority: boardData.priority.filter(id => id !== playerId),
      interested: boardData.interested.filter(id => id !== playerId),
      pass: boardData.pass.filter(id => id !== playerId),
    };
    if (destCol) newBoard[destCol].push(playerId);
    
    setBoardData(newBoard);
    try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'recruiters', recruiterData.uid), { board: newBoard }); } 
    catch (err) { console.error("Error saving board", err); }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    const playerId = String(active.id);
    const destCol = over.id; 
    
    const newBoard = {
      priority: boardData.priority.filter(id => id !== playerId),
      interested: boardData.interested.filter(id => id !== playerId),
      pass: boardData.pass.filter(id => id !== playerId),
    };
    newBoard[destCol].push(playerId);
    
    setBoardData(newBoard);
    try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'recruiters', recruiterData.uid), { board: newBoard }); } 
    catch (err) { console.error("Error saving board", err); }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="max-w-7xl mx-auto p-4 py-8 animate-in fade-in">
        <div className="bg-slate-900 rounded-3xl p-8 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 mb-10 border border-slate-800" style={{ borderTop: '4px solid #1c7ed6' }}>
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white/10 rounded-2xl"><Building size={28} className="text-white" /></div>
            <div>
              <h2 className="text-2xl font-extrabold text-white uppercase tracking-tight" style={displayFont}>Scout Portal: {recruiterData?.school}</h2>
              <p className="text-xs font-bold text-[#1c7ed6] uppercase tracking-widest mt-1">Logged in as {recruiterData?.name}</p>
            </div>
          </div>
          <button onClick={onLogout} className="text-xs font-bold text-rose-400 border border-rose-400/30 bg-rose-400/10 px-5 py-2.5 rounded-full hover:bg-rose-400 hover:text-white transition-colors uppercase tracking-wider">Sign Out</button>
        </div>

        <div className="flex gap-2 sm:gap-4 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
           <button onClick={() => setActiveTab('database')} className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'database' ? 'text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`} style={activeTab === 'database' ? { background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' } : {}}><Search size={16} /> Prospect Database</button>
           <button onClick={() => setActiveTab('board')} className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'board' ? 'text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`} style={activeTab === 'board' ? { background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' } : {}}><LayoutDashboard size={16} /> My Recruiting Board</button>
        </div>

        {activeTab === 'database' && (
          <div className="animate-in fade-in slide-in-from-left-4">
             <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 md:p-8 mb-8">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                   <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-800" style={displayFont}>Advanced Filters</h3>
                   <button onClick={exportDatabaseCSV} className="text-[10px] font-bold text-white bg-slate-900 px-4 py-2 rounded-full flex items-center gap-2 uppercase tracking-wider hover:bg-[#1c7ed6] transition-colors shadow-sm"><Download size={14}/> Export CSV</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-5">
                   <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Pos</label>
                     <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#1c7ed6] focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all" value={posFilter} onChange={e=>setPosFilter(e.target.value)}>{uniquePositions.map(pos => <option key={pos} value={pos}>{pos}</option>)}</select>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Class</label>
                     <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#1c7ed6] focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all" value={yearFilter} onChange={e=>setYearFilter(e.target.value)}>{uniqueYears.map(yr => <option key={yr} value={yr}>{yr}</option>)}</select>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Min DNA ({minDna})</label>
                     <input type="range" min="0" max="10" step="0.1" value={minDna} onChange={e=>setMinDna(e.target.value)} className="w-full accent-[#d6336c]" />
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Min GPA ({minGpa})</label>
                     <input type="range" min="0" max="4.5" step="0.1" value={minGpa} onChange={e=>setMinGpa(e.target.value)} className="w-full accent-[#1c7ed6]" />
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Max 40-Yd ({maxSprint >= 10 ? 'Any' : maxSprint + 's'})</label>
                     <input type="range" min="4.5" max="10" step="0.1" value={maxSprint} onChange={e=>setMaxSprint(e.target.value)} className="w-full accent-emerald-500" />
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Max Shuttle ({maxShuttle >= 10 ? 'Any' : maxShuttle + 's'})</label>
                     <input type="range" min="4.0" max="10" step="0.1" value={maxShuttle} onChange={e=>setMaxShuttle(e.target.value)} className="w-full accent-emerald-500" />
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Max L-Drill ({maxLDrill >= 10 ? 'Any' : maxLDrill + 's'})</label>
                     <input type="range" min="4.0" max="10" step="0.1" value={maxLDrill} onChange={e=>setMaxLDrill(e.target.value)} className="w-full accent-emerald-500" />
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Min Broad ({minBroad <= 0 ? 'Any' : minBroad + '"'})</label>
                     <input type="range" min="0" max="120" step="1" value={minBroad} onChange={e=>setMinBroad(e.target.value)} className="w-full accent-amber-500" />
                   </div>
                   <div className="xl:col-start-8">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Min Vert ({minVert <= 0 ? 'Any' : minVert + '"'})</label>
                     <input type="range" min="0" max="40" step="1" value={minVert} onChange={e=>setMinVert(e.target.value)} className="w-full accent-amber-500" />
                   </div>
                </div>
             </div>
             <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead><tr className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100"><th className="p-5 w-[240px]">Athlete</th><th className="p-5 text-center">DNA Score</th><th className="p-5 text-center">Pos / Yr</th><th className="p-5 text-center">40-Yd</th><th className="p-5 text-center">GPA</th><th className="p-5 text-center">Contact</th><th className="p-5 text-center">Board Status</th><th className="p-5 text-center">Tape</th></tr></thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredPlayers.length === 0 ? (
                          <tr><td colSpan="8" className="p-16 text-center text-sm font-medium text-slate-400">No athletes match these strict criteria.</td></tr>
                        ) : (
                          filteredPlayers.map(p => <DatabaseRow key={p.id} player={p} onSelect={onSelect} boardData={boardData} onMoveToBoard={handleMoveToBoard} />)
                        )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'board' && (
          <div className="animate-in fade-in slide-in-from-right-4">
             <div className="mb-8 p-6 bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-amber-50 rounded-2xl"><Star className="text-amber-500 shrink-0" size={24} /></div>
                   <div>
                     <h3 className="text-lg font-extrabold uppercase tracking-tight text-slate-900" style={displayFont}>Recruiting Board</h3>
                     <p className="text-[11px] font-semibold text-slate-400 uppercase mt-0.5">Use the database tab to save prospects here.</p>
                   </div>
                </div>
                <button onClick={exportBoardCSV} className="text-[10px] font-bold text-white bg-slate-900 px-5 py-2.5 rounded-full flex items-center gap-2 uppercase tracking-wider hover:bg-[#1c7ed6] transition-colors shadow-sm whitespace-nowrap"><Download size={14}/> Export Board to CSV</button>
             </div>
             <div className="flex flex-col md:flex-row gap-6 overflow-x-auto pb-6">
                <DroppableColumn id="priority" title="High Priority" players={boardData.priority.map(id => players.find(p=>p.id===id)).filter(Boolean)} onPlayerClick={onSelect} />
                <DroppableColumn id="interested" title="Interested / Watch" players={boardData.interested.map(id => players.find(p=>p.id===id)).filter(Boolean)} onPlayerClick={onSelect} />
                <DroppableColumn id="pass" title="Pass / Archive" players={boardData.pass.map(id => players.find(p=>p.id===id)).filter(Boolean)} onPlayerClick={onSelect} />
             </div>
          </div>
        )}
      </div>
    </DndContext>
  );
};

// --- PHASE 2: TEAM ROSTERS & QR BROCHURES ---
const RosterPage = ({ players, onSelect, onBack }) => {
  const rosteredPlayers = players.filter(p => p.dnaTeam && p.dnaTeam !== 'None');
  const teams = [...new Set(rosteredPlayers.map(p => p.dnaTeam))].sort();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in slide-in-from-bottom-8">
       <div className="flex justify-between items-center mb-8 print:hidden">
          <button onClick={onBack} className="font-semibold flex items-center gap-1.5 uppercase tracking-wider text-sm text-slate-500 hover:text-slate-800 transition-colors"><ChevronLeft size={18} /> Back to Hub</button>
          <button onClick={() => window.print()} className="font-semibold flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm uppercase tracking-wider shadow-md hover:bg-slate-800 hover:-translate-y-0.5 transition-all"><FileText size={16}/> Print QR Brochures</button>
       </div>
       {teams.map((team, index) => (
         <div key={team} className={`mb-16 print:m-0 ${index !== teams.length - 1 ? 'print:page-break-after-always' : ''}`}>
            <div className="mb-8 pb-3 border-b-2 border-slate-900 flex justify-between items-end">
              <div>
                 <h2 className="text-4xl font-extrabold uppercase tracking-tight text-slate-900" style={displayFont}>{team}</h2>
                 <p className="text-sm font-bold text-[#d6336c] uppercase tracking-widest mt-1.5">Official Tournament Roster & Scouting QR</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-4 print:gap-4">
               {rosteredPlayers.filter(p => p.dnaTeam === team).sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                  <div key={p.id} className="bg-white border border-slate-100 rounded-3xl p-5 flex flex-col items-center text-center cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg hover:border-[#1c7ed6]/30 transition-all group" onClick={() => onSelect(p)}>
                     <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-20 h-20 rounded-full object-cover mb-4 border border-slate-100" alt={p.name} />
                     <h4 className="font-extrabold text-sm uppercase truncate w-full group-hover:text-[#1c7ed6] transition-colors" style={displayFont}>{p.name}</h4>
                     <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{p.primaryPos} • {p.gradYear}</p>
                     <div className="my-5 p-2 bg-white rounded-xl border border-slate-100 shadow-sm"><QRCodeSVG value={`https://www.dnaflagratings.com/?p=${p.id}`} size={96} /></div>
                     <div className="w-full bg-slate-50/80 p-2.5 rounded-xl flex justify-between items-center mt-auto border border-slate-100/50">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">DNA Score</span>
                        <span className="font-black text-sm text-[#d6336c]" style={displayFont}>{p.dnaScore || "N/A"}</span>
                     </div>
                  </div>
               ))}
            </div>
         </div>
       ))}
    </div>
  );
};

// --- MASTER APP CONTROLLER ---
export default function App() {
  const [view, setView] = useState('home'); 
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [players, setPlayers] = useState(INITIAL_SEED.players);
  const [news, setNews] = useState(INITIAL_SEED.news);
  const [scouts, setScouts] = useState(INITIAL_SEED.scouts);
  const [dbStatus, setDbStatus] = useState("OFFLINE DEMO");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState('admin');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const [authRole, setAuthRole] = useState(() => sessionStorage.getItem('dna_auth_role') || null);
  const [recruiterData, setRecruiterData] = useState(() => JSON.parse(sessionStorage.getItem('dna_recruiter_data')) || null);

  useEffect(() => {
    if (!document.getElementById('dna-fonts')) {
      const link = document.createElement('link');
      link.id = 'dna-fonts';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@700;900&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseActive || !db) return;
    setDbStatus("CONNECTING...");
    
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'players'), (snapshot) => {
      const items = []; snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() })); setPlayers(items); 
    });
    
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'news'), (snapshot) => {
      const newsItems = []; snapshot.forEach(doc => newsItems.push({ id: doc.id, ...doc.data() }));
      setNews(newsItems); setDbStatus("LIVE SYNC");
    }, (err) => { console.error("Firebase News Error:", err); });

    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'recruiters'), (snapshot) => {
      const scoutItems = []; snapshot.forEach(doc => scoutItems.push({ id: doc.id, ...doc.data() }));
      setScouts(scoutItems);
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetPlayerId = params.get('p');
    if (targetPlayerId && players.length > 0) {
      const p = players.find(p => p.id === targetPlayerId);
      if (p) {
        setSelectedPlayer(p);
        setView('profile');
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, [players]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLoginSuccess = (role, data) => { 
    setAuthRole(role); sessionStorage.setItem('dna_auth_role', role);
    if (role === 'recruiter') { setRecruiterData(data); sessionStorage.setItem('dna_recruiter_data', JSON.stringify(data)); }
    setIsLoginModalOpen(false); 
    setView(role === 'admin' ? 'admin' : 'recruiter'); 
    window.scrollTo(0, 0); 
  };
  
  const handleLogout = async () => { 
    if (auth) await signOut(auth); 
    setAuthRole(null); setRecruiterData(null);
    sessionStorage.removeItem('dna_auth_role'); sessionStorage.removeItem('dna_recruiter_data'); 
    setView('home'); window.scrollTo(0, 0); 
  };

  const handlePlayerSelect = async (p) => {
    setSelectedPlayer(p); setView('profile'); window.scrollTo(0,0);
    if (isFirebaseActive && db && p.id && dbStatus === "LIVE SYNC") { 
      try { 
        const updates = { views: increment(1) };
        if (authRole === 'recruiter' && recruiterData) {
          updates.recentViews = arrayUnion({ coach: recruiterData.name, school: recruiterData.school, time: Date.now() });
        }
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', p.id), updates); 
      } catch (err) { console.error("Error logging view", err); } 
    }
  };

  const openModal = (mode) => {
    setLoginModalMode(mode);
    setIsDropdownOpen(false);
    setIsLoginModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-[#d6336c] selection:text-white flex flex-col justify-between" style={bodyFont}>
      <div>
        <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50 shadow-sm print:hidden">
          <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
            <div className="cursor-pointer hover:scale-105 transition-transform" onClick={() => setView('home')}><DNALogo /></div>
            <div className="flex gap-2 sm:gap-4 items-center">
               {authRole === 'recruiter' && <button onClick={() => { setView('recruiter'); window.scrollTo(0,0); }} className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white bg-[#1c7ed6] px-4 py-2.5 rounded-full shadow-md shadow-blue-500/20 hover:bg-[#155a9e] flex items-center gap-1.5 transition-colors"><Building size={14}/> Portal</button>}
               <button onClick={() => { setView('rosters'); window.scrollTo(0,0); }} className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 px-4 py-2.5 rounded-full text-slate-500 hover:text-[#1c7ed6] hover:bg-slate-50 border border-slate-200/50"><QrCode size={14}/> Rosters</button>
               
               <div className="relative" ref={dropdownRef}>
                 <button onClick={() => { authRole ? setView(authRole) : setIsDropdownOpen(!isDropdownOpen); }} className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 px-4 py-2.5 rounded-full shadow-sm" style={{ color: authRole === 'admin' ? '#059669' : (authRole === 'recruiter' ? '#1c7ed6' : '#d6336c'), border: `1px solid ${authRole === 'admin' ? 'rgba(5,150,105,0.3)' : (authRole === 'recruiter' ? 'rgba(28,126,214,0.3)' : 'rgba(214,51,108,0.3)')}`, backgroundColor: authRole === 'admin' ? 'rgba(5,150,105,0.1)' : (authRole === 'recruiter' ? 'rgba(28,126,214,0.1)' : 'rgba(214,51,108,0.05)') }}>
                   <Lock size={14}/> <span className="hidden sm:inline">{authRole ? 'Active Session' : 'Portal Login'}</span><span className="sm:hidden">Login</span>
                 </button>
                 {isDropdownOpen && !authRole && (
                   <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-2 z-50 animate-in fade-in slide-in-from-top-2">
                     <button onClick={() => openModal('admin')} className="w-full text-left px-4 py-3 text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:text-[#d6336c] rounded-xl uppercase tracking-wider flex items-center gap-2.5 transition-colors"><Shield size={16}/> Admin Portal</button>
                     <div className="h-px bg-slate-100 my-1 mx-2"></div>
                     <button onClick={() => openModal('recruiter_login')} className="w-full text-left px-4 py-3 text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:text-[#1c7ed6] rounded-xl uppercase tracking-wider flex items-center gap-2.5 transition-colors"><Building size={16}/> Scout Portal</button>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>
        <main className="min-h-[calc(100vh-260px)]">
          {view === 'home' && <PublicHub players={players} news={news} onSelect={handlePlayerSelect} />}
          {view === 'profile' && <ProfilePage player={selectedPlayer} onBack={() => { if(authRole==='recruiter'){setView('recruiter')} else {setView('home')} }} />}
          {view === 'rosters' && <RosterPage players={players} onSelect={handlePlayerSelect} onBack={() => setView('home')} />}
          {view === 'admin' && authRole === 'admin' && <AdminPanel players={players} scouts={scouts} dbConfigured={isFirebaseActive} onBack={() => setView('home')} onLogout={handleLogout} />}
          {view === 'recruiter' && authRole === 'recruiter' && <RecruiterPortal players={players} recruiterData={recruiterData} onSelect={handlePlayerSelect} onLogout={handleLogout} />}
        </main>
      </div>
      <SanctionedFooter />
      <LoginModal isOpen={isLoginModalOpen} initialMode={loginModalMode} onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={handleLoginSuccess} />
    </div>
  );
}