import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ChevronLeft, Lock, Camera, Ruler, Zap, Target, Newspaper, Trophy, 
  Activity, Loader2, Video, ExternalLink, Shield, MapPin, Eye, Search, 
  X, User, GraduationCap, Mail, AtSign, FileText, Award, Users, QrCode, 
  Download, LayoutDashboard, Star, GripVertical, Building, Megaphone,
  CheckCircle, Clock, Globe, GitCompare, MessageSquare, Send, CheckCircle2, XCircle
} from 'lucide-react';
import { AdminPanel } from './pages/AdminPanel';
import { RecruiterPortal } from './pages/RecruiterPortal';
import { FamilyDashboard } from './pages/FamilyDashboard';
import { ProfilePage } from './pages/ProfilePage';
import { PublicHub } from './pages/PublicHub';
import { RosterPage } from './pages/RosterPage';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, increment, deleteDoc, setDoc, getDoc, arrayUnion, query, where } from 'firebase/firestore';
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
      setError(''); setUsername(''); setPassword('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    
    if (mode === 'recruiter_signup' && !username.toLowerCase().endsWith('.edu')) {
      setError("Access denied. Scout accounts require a valid .edu university email address.");
      setLoading(false); return;
    }

    try {
      if (mode === 'recruiter_signup') {
        const userCred = await createUserWithEmailAndPassword(auth, username, password);
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'recruiters', userCred.user.uid), { name: coachName, school: schoolName, email: username, role: 'recruiter', approved: false, board: { priority: [], interested: [], pass: [] }, createdAt: Date.now() });
        await signOut(auth);
        setError("Account created successfully. It is currently pending Admin approval.");
        setMode('recruiter_login');
      } else if (mode === 'family_signup') {
        const userCred = await createUserWithEmailAndPassword(auth, username, password);
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'families', userCred.user.uid), { email: username, role: 'family', createdAt: Date.now() });
        onLoginSuccess('family', { email: username, uid: userCred.user.uid });
      } else if (mode === 'family_login') {
        const userCred = await signInWithEmailAndPassword(auth, username, password);
        onLoginSuccess('family', { email: username, uid: userCred.user.uid });
      } else {
        const userCred = await signInWithEmailAndPassword(auth, username, password);
        if (mode === 'recruiter_login') {
          const docSnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'recruiters', userCred.user.uid));
          if (docSnap.exists() && docSnap.data().role === 'recruiter') {
            if (docSnap.data().approved !== true) { await signOut(auth); throw new Error("Your scout account is pending Admin approval."); }
            onLoginSuccess('recruiter', { ...docSnap.data(), uid: userCred.user.uid });
          } else { await signOut(auth); throw new Error("Not authorized as a recruiter."); }
        } else {
           onLoginSuccess('admin', null);
        }
      }
      if (!mode.includes('signup')) { setUsername(''); setPassword(''); setCoachName(''); setSchoolName(''); }
    } catch (err) { setError(err.message || 'Authentication failed. Please verify your credentials.'); }
    setLoading(false);
  };

  const activeColor = mode === 'admin' ? '#d6336c' : (mode.includes('recruiter') ? '#1c7ed6' : '#059669');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: activeColor }}></div>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 p-1.5 rounded-full"><X size={18} /></button>
        
        <div className="flex gap-1.5 mb-8 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
          <button onClick={() => {setMode('admin'); setError('');}} className={`flex-1 py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode === 'admin' ? 'bg-white shadow-sm text-[#d6336c]' : 'text-slate-500 hover:text-slate-700'}`}>Admin</button>
          <button onClick={() => {setMode('recruiter_login'); setError('');}} className={`flex-1 py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode.includes('recruiter') ? 'bg-white shadow-sm text-[#1c7ed6]' : 'text-slate-500 hover:text-slate-700'}`}>Scout</button>
          <button onClick={() => {setMode('family_login'); setError('');}} className={`flex-1 py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode.includes('family') ? 'bg-white shadow-sm text-[#059669]' : 'text-slate-500 hover:text-slate-700'}`}>Parent / Athlete</button>
        </div>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4" style={{ color: activeColor }}>
            {mode === 'admin' ? <Lock size={24} /> : (mode.includes('recruiter') ? <Building size={24} /> : <Users size={24} />)}
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 uppercase tracking-tight" style={displayFont}>
            {mode === 'admin' ? 'Coach Portal' : (mode.includes('recruiter') ? 'Scout / Recruiter' : 'Parent Dashboard')}
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">
            {mode === 'admin' ? 'Authorized Staff Only' : (mode.includes('recruiter') ? 'Verified .EDU Coaches Only' : 'Athlete Parents & Guardians')}
          </p>
        </div>
        
        {error && <div className={`border text-xs font-semibold p-3.5 rounded-xl text-center mb-6 leading-relaxed ${error.includes('successfully') ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'recruiter_signup' && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Coach Name</label><input required type="text" placeholder="John Doe" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1c7ed6] focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all" value={coachName} onChange={e => setCoachName(e.target.value)} /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">University</label><input required type="text" placeholder="State Univ." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1c7ed6] focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all" value={schoolName} onChange={e => setSchoolName(e.target.value)} /></div>
            </div>
          )}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">{mode === 'recruiter_signup' ? 'University Email (.edu)' : 'Email Address'}</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input required type="email" placeholder="Enter email" className={`w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 transition-all`} style={{ borderColor: activeColor }} value={username} onChange={e => setUsername(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input required type="password" placeholder="Enter password" className={`w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 transition-all`} style={{ borderColor: activeColor }} value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-full hover:-translate-y-0.5 transition-all text-white font-bold py-4 rounded-xl uppercase tracking-wider text-sm shadow-lg mt-4 flex justify-center items-center gap-2" style={{ background: mode === 'admin' ? 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' : activeColor }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : (mode.includes('signup') ? 'Create Account' : 'Authenticate & Enter')}
          </button>
        </form>

        {(mode.includes('recruiter') || mode.includes('family')) && (
           <div className="mt-5 text-center">
             <button type="button" onClick={() => setMode(mode.includes('login') ? mode.replace('login', 'signup') : mode.replace('signup', 'login'))} className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors">
               {mode.includes('login') ? "Don't have an account? Create one." : "Already registered? Sign In."}
             </button>
           </div>
        )}
      </div>
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
  const [dbStatus, setDbStatus] = useState("OFFLINE");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState('admin');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const [authRole, setAuthRole] = useState(() => sessionStorage.getItem('dna_auth_role') || null);
  const [recruiterData, setRecruiterData] = useState(() => JSON.parse(sessionStorage.getItem('dna_recruiter_data')) || null);
  const [familyData, setFamilyData] = useState(() => JSON.parse(sessionStorage.getItem('dna_family_data')) || null);

  useEffect(() => {
    if (!document.getElementById('dna-fonts')) {
      const link = document.createElement('link'); link.id = 'dna-fonts'; link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@700;900&display=swap'; link.rel = 'stylesheet'; document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseActive || !db) return;
    setDbStatus("CONNECTING...");
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'players'), (snapshot) => { const items = []; snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() })); setPlayers(items); });
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'news'), (snapshot) => { const newsItems = []; snapshot.forEach(doc => newsItems.push({ id: doc.id, ...doc.data() })); setNews(newsItems); setDbStatus("LIVE SYNC"); }, (err) => { console.error("Firebase News Error:", err); });
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'recruiters'), (snapshot) => { const scoutItems = []; snapshot.forEach(doc => scoutItems.push({ id: doc.id, ...doc.data() })); setScouts(scoutItems); });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetPlayerId = params.get('p');
    if (targetPlayerId && players.length > 0) {
      const p = players.find(p => p.id === targetPlayerId);
      if (p) { setSelectedPlayer(p); setView('profile'); window.history.replaceState(null, '', window.location.pathname); }
    }
  }, [players]);

  useEffect(() => {
    const handleClickOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLoginSuccess = (role, data) => { 
    setAuthRole(role); sessionStorage.setItem('dna_auth_role', role);
    if (role === 'recruiter') { setRecruiterData(data); sessionStorage.setItem('dna_recruiter_data', JSON.stringify(data)); }
    if (role === 'family') { setFamilyData(data); sessionStorage.setItem('dna_family_data', JSON.stringify(data)); }
    setIsLoginModalOpen(false); 
    setView(role === 'admin' ? 'admin' : (role === 'recruiter' ? 'recruiter' : 'family')); 
    window.scrollTo(0, 0); 
  };
  
  const handleLogout = async () => { 
    if (auth) await signOut(auth); 
    setAuthRole(null); setRecruiterData(null); setFamilyData(null);
    sessionStorage.clear(); setView('home'); window.scrollTo(0, 0); 
  };

  const handlePlayerSelect = async (p) => {
    setSelectedPlayer(p); setView('profile'); window.scrollTo(0,0);
    if (isFirebaseActive && db && p.id && dbStatus === "LIVE SYNC") { 
      try { 
        let updates = {};
        if (authRole === 'recruiter' && recruiterData) {
          const now = Date.now(); const twentyFourHours = 24 * 60 * 60 * 1000; const existingViews = p.recentViews || [];
          const recentlyViewed = existingViews.some(view => view.coach === recruiterData.name && (now - view.time) < twentyFourHours);
          if (!recentlyViewed) { const updatedViews = [...existingViews, { coach: recruiterData.name, school: recruiterData.school, time: now }].slice(-50); updates.views = increment(1); updates.recentViews = updatedViews; }
        } else { updates.views = increment(1); }
        if (Object.keys(updates).length > 0) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', p.id), updates); 
      } catch (err) { console.error("Error logging view", err); } 
    }
  };

  const openModal = (mode) => { setLoginModalMode(mode); setIsDropdownOpen(false); setIsLoginModalOpen(true); };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased flex flex-col justify-between" style={bodyFont}>
      <div>
        <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50 shadow-sm print:hidden">
          <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
            <div className="cursor-pointer hover:scale-105 transition-transform" onClick={() => setView('home')}><DNALogo /></div>
            <div className="flex gap-2 sm:gap-4 items-center">
               {authRole === 'recruiter' && <button onClick={() => { setView('recruiter'); window.scrollTo(0,0); }} className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white bg-[#1c7ed6] px-4 py-2.5 rounded-full shadow-md shadow-blue-500/20 hover:bg-[#155a9e] flex items-center gap-1.5 transition-colors"><Building size={14}/> Portal</button>}
               {authRole === 'family' && <button onClick={() => { setView('family'); window.scrollTo(0,0); }} className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white bg-[#059669] px-4 py-2.5 rounded-full shadow-md hover:bg-emerald-700 flex items-center gap-1.5 transition-colors"><Shield size={14}/> Family Dashboard</button>}
               <button onClick={() => { setView('rosters'); window.scrollTo(0,0); }} className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 px-4 py-2.5 rounded-full text-slate-500 hover:text-[#1c7ed6] hover:bg-slate-50 border border-slate-200/50"><QrCode size={14}/> Rosters</button>
               
               <div className="relative" ref={dropdownRef}>
                 <button onClick={() => { authRole ? setView(authRole) : setIsDropdownOpen(!isDropdownOpen); }} className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 px-4 py-2.5 rounded-full shadow-sm" style={{ color: authRole === 'admin' ? '#059669' : (authRole === 'recruiter' ? '#1c7ed6' : (authRole === 'family' ? '#059669' : '#d6336c')), border: `1px solid ${authRole ? 'rgba(0,0,0,0.1)' : 'rgba(214,51,108,0.3)'}`, backgroundColor: authRole ? 'white' : 'rgba(214,51,108,0.05)' }}>
                   <Lock size={14}/> <span className="hidden sm:inline">{authRole ? 'Active Session' : 'Portal Login'}</span><span className="sm:hidden">Login</span>
                 </button>
                 {isDropdownOpen && !authRole && (
                   <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-2 z-50 animate-in fade-in slide-in-from-top-2">
                     <button onClick={() => openModal('admin')} className="w-full text-left px-4 py-3 text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:text-[#d6336c] rounded-xl uppercase tracking-wider flex items-center gap-2.5 transition-colors"><Shield size={16}/> Admin Portal</button>
                     <div className="h-px bg-slate-100 my-1 mx-2"></div>
                     <button onClick={() => openModal('recruiter_login')} className="w-full text-left px-4 py-3 text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:text-[#1c7ed6] rounded-xl uppercase tracking-wider flex items-center gap-2.5 transition-colors"><Building size={16}/> Scout Portal</button>
                     <div className="h-px bg-slate-100 my-1 mx-2"></div>
                     <button onClick={() => openModal('family_login')} className="w-full text-left px-4 py-3 text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 rounded-xl uppercase tracking-wider flex items-center gap-2.5 transition-colors"><Users size={16}/> Parent / Athlete Portal</button>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>
        <main className="min-h-[calc(100vh-260px)]">
          {view === 'home' && <PublicHub players={players} news={news} onSelect={handlePlayerSelect} />}
          {view === 'profile' && <ProfilePage player={selectedPlayer} onBack={() => { if(authRole==='recruiter'){setView('recruiter')} else if (authRole==='family'){setView('family')} else {setView('home')} }} />}
          {view === 'rosters' && <RosterPage players={players} onSelect={handlePlayerSelect} onBack={() => setView('home')} />}
          {view === 'admin' && authRole === 'admin' && <AdminPanel app={app} appId={appId} db={db} storage={storage} players={players} scouts={scouts} dbConfigured={isFirebaseActive} onBack={() => setView('home')} onLogout={handleLogout} />}
          {view === 'recruiter' && authRole === 'recruiter' && <RecruiterPortal app={app} appId={appId} db={db} players={players} recruiterData={recruiterData} onSelect={handlePlayerSelect} onLogout={handleLogout} />}
          {view === 'family' && authRole === 'family' && <FamilyDashboard app={app} appId={appId} db={db} user={familyData} onLogout={handleLogout} />}
        </main>
      </div>
      <SanctionedFooter />
      <LoginModal isOpen={isLoginModalOpen} initialMode={loginModalMode} onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={handleLoginSuccess} />
    </div>
  );
}