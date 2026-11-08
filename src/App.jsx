// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Lock, Loader2, X, User, Users, Building, LayoutDashboard, Trophy, Shield } from 'lucide-react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// --- PAGES ---
import { AdminPanel } from './pages/AdminPanel';
import { RecruiterPortal } from './pages/RecruiterPortal';
import { FamilyDashboard } from './pages/FamilyDashboard'; // This will become ParentDashboard
import { ProfilePage } from './pages/ProfilePage';
import { PublicHub } from './pages/PublicHub';
import { RosterPage } from './pages/RosterPage';

// --- GLOBAL STATE ---
import { useApp } from './context/AppContext';

// --- FIREBASE ACTIONS ---
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, updateDoc, increment, setDoc, getDoc } from 'firebase/firestore';

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

// --- SEPARATED LOGIN MODAL ---
const LoginModal = ({ isOpen, onClose, onLoginSuccess, initialMode }) => {
  const { auth, db, appId } = useApp(); 

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
      } else if (mode === 'parent_signup' || mode === 'athlete_signup') {
        const userRole = mode === 'parent_signup' ? 'parent' : 'athlete';
        const collectionName = userRole === 'parent' ? 'parents' : 'athletes';
        const userCred = await createUserWithEmailAndPassword(auth, username, password);
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, userCred.user.uid), { email: username, role: userRole, createdAt: Date.now() });
        onLoginSuccess(userRole, { email: username, uid: userCred.user.uid });
      } else if (mode === 'parent_login' || mode === 'athlete_login') {
        const userRole = mode === 'parent_login' ? 'parent' : 'athlete';
        const userCred = await signInWithEmailAndPassword(auth, username, password);
        onLoginSuccess(userRole, { email: username, uid: userCred.user.uid });
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

  const getActiveColor = () => {
    if (mode.includes('admin')) return '#d6336c';
    if (mode.includes('recruiter')) return '#1c7ed6';
    if (mode.includes('parent')) return '#059669'; // Emerald
    if (mode.includes('athlete')) return '#8b5cf6'; // Violet
    return '#334155';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: getActiveColor() }}></div>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 p-1.5 rounded-full"><X size={18} /></button>
        
        <div className="flex flex-wrap gap-1.5 mb-8 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
          <button onClick={() => {setMode('admin'); setError('');}} className={`flex-1 py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode === 'admin' ? 'bg-white shadow-sm text-[#d6336c]' : 'text-slate-500 hover:text-slate-700'}`}>Admin</button>
          <button onClick={() => {setMode('recruiter_login'); setError('');}} className={`flex-1 py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode.includes('recruiter') ? 'bg-white shadow-sm text-[#1c7ed6]' : 'text-slate-500 hover:text-slate-700'}`}>Scout</button>
          <button onClick={() => {setMode('parent_login'); setError('');}} className={`flex-1 py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode.includes('parent') ? 'bg-white shadow-sm text-[#059669]' : 'text-slate-500 hover:text-slate-700'}`}>Parent</button>
          <button onClick={() => {setMode('athlete_login'); setError('');}} className={`flex-1 py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode.includes('athlete') ? 'bg-white shadow-sm text-[#8b5cf6]' : 'text-slate-500 hover:text-slate-700'}`}>Athlete</button>
        </div>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4" style={{ color: getActiveColor() }}>
            {mode === 'admin' && <Lock size={24} />}
            {mode.includes('recruiter') && <Building size={24} />}
            {mode.includes('parent') && <Shield size={24} />}
            {mode.includes('athlete') && <Trophy size={24} />}
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 uppercase tracking-tight" style={displayFont}>
            {mode === 'admin' && 'Coach Portal'}
            {mode.includes('recruiter') && 'Scout / Recruiter'}
            {mode.includes('parent') && 'Parent Dashboard'}
            {mode.includes('athlete') && 'Athlete Locker Room'}
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">
            {mode === 'admin' && 'Authorized Staff Only'}
            {mode.includes('recruiter') && 'Verified .EDU Coaches Only'}
            {mode.includes('parent') && 'Parent/Guardian Inbox'}
            {mode.includes('athlete') && 'Approved Athlete Inbox'}
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
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
              {mode === 'recruiter_signup' ? 'University Email (.edu)' : 'Email Address'}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input required type="email" placeholder="Enter email" className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 transition-all" style={{ borderColor: getActiveColor() }} value={username} onChange={e => setUsername(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input required type="password" placeholder="Enter password" className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 transition-all" style={{ borderColor: getActiveColor() }} value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-full hover:-translate-y-0.5 transition-all text-white font-bold py-4 rounded-xl uppercase tracking-wider text-sm shadow-lg mt-4 flex justify-center items-center gap-2" style={{ background: mode === 'admin' ? 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' : getActiveColor() }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : (mode.includes('signup') ? 'Create Account' : 'Authenticate & Enter')}
          </button>
        </form>

        {(mode.includes('recruiter') || mode.includes('parent') || mode.includes('athlete')) && (
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
  const navigate = useNavigate();
  const location = useLocation();

  const { 
    app, auth, db, storage, appId, isFirebaseActive,
    players, news, scouts, dbStatus,
    authRole, setAuthRole,
    recruiterData, setRecruiterData,
    familyData, setFamilyData // We'll keep this generic naming for now so we don't break AppContext
  } = useApp();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState('admin');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById('dna-fonts')) {
      const link = document.createElement('link'); link.id = 'dna-fonts'; link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@700;900&display=swap'; link.rel = 'stylesheet'; document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetPlayerId = params.get('p');
    if (targetPlayerId) {
      navigate(`/player/${targetPlayerId}`, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLoginSuccess = (role, data) => { 
    setAuthRole(role); sessionStorage.setItem('dna_auth_role', role);
    if (role === 'recruiter') { setRecruiterData(data); sessionStorage.setItem('dna_recruiter_data', JSON.stringify(data)); }
    // Save both Parent and Athlete to the same generic familyData state object for now
    if (role === 'parent' || role === 'athlete') { setFamilyData(data); sessionStorage.setItem('dna_family_data', JSON.stringify(data)); }
    
    setIsLoginModalOpen(false); 
    
    if (role === 'admin') navigate('/admin');
    else if (role === 'recruiter') navigate('/scout');
    else if (role === 'parent') navigate('/parent');
    else if (role === 'athlete') navigate('/athlete');
    
    window.scrollTo(0, 0); 
  };
  
  const handleLogout = async () => { 
    if (auth) await signOut(auth); 
    setAuthRole(null); setRecruiterData(null); setFamilyData(null);
    sessionStorage.clear(); 
    navigate('/'); 
    window.scrollTo(0, 0); 
  };

  const handlePlayerSelect = async (p) => {
    navigate(`/player/${p.id}`);
    window.scrollTo(0, 0);
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

  const getDashboardRoute = () => {
    if (authRole === 'admin') return '/admin';
    if (authRole === 'recruiter') return '/scout';
    if (authRole === 'parent') return '/parent';
    if (authRole === 'athlete') return '/athlete';
    return '/';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between" style={bodyFont}>
      <nav className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="cursor-pointer flex items-center gap-4" onClick={() => navigate('/')}>
            <DNALogo />
            <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold tracking-widest uppercase flex items-center gap-1.5 ${dbStatus === "LIVE SYNC" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-500"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dbStatus === "LIVE SYNC" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
              {dbStatus}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => navigate('/roster')} 
              className={`text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-full transition-all flex items-center gap-1.5 ${location.pathname === '/roster' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <Users size={15} /> <span className="hidden sm:inline">Official</span> Roster
            </button>

            {authRole ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(getDashboardRoute())}
                  className="text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-full text-white shadow-sm flex items-center gap-1.5 transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}
                >
                  <LayoutDashboard size={15} /> Dashboard
                </button>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                  className="text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full text-white shadow-md hover:opacity-95 transition-all flex items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}
                >
                  <Lock size={14} /> Portal Login
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <button onClick={() => openModal('athlete_login')} className="w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                      <div className="p-1.5 rounded-lg bg-violet-50 text-violet-500"><Trophy size={16} /></div>
                      <div>
                        <div className="text-slate-900">Athlete Locker Room</div>
                        <div className="text-[9px] text-slate-400 font-semibold">Approved Messages</div>
                      </div>
                    </button>
                    <button onClick={() => openModal('parent_login')} className="w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600"><Shield size={16} /></div>
                      <div>
                        <div className="text-slate-900">Parent Dashboard</div>
                        <div className="text-[9px] text-slate-400 font-semibold">Inbox Moderation</div>
                      </div>
                    </button>
                    <button onClick={() => openModal('recruiter_login')} className="w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                      <div className="p-1.5 rounded-lg bg-blue-50 text-[#1c7ed6]"><Building size={16} /></div>
                      <div>
                        <div className="text-slate-900">College Scout</div>
                        <div className="text-[9px] text-slate-400 font-semibold">Verified .EDU Portal</div>
                      </div>
                    </button>
                    <div className="my-1 border-t border-slate-100"></div>
                    <button onClick={() => openModal('admin')} className="w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                      <div className="p-1.5 rounded-lg bg-pink-50 text-[#d6336c]"><Lock size={16} /></div>
                      <div>
                        <div className="text-slate-900">Coach / Admin</div>
                        <div className="text-[9px] text-slate-400 font-semibold">Combine Data Entry</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLoginSuccess={handleLoginSuccess} 
        initialMode={loginModalMode} 
      />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<PublicHub onSelect={handlePlayerSelect} />} />
          <Route path="/roster" element={<RosterPage onSelect={handlePlayerSelect} onBack={() => navigate('/')} />} />
          <Route path="/player/:id" element={<ProfilePage onBack={() => navigate(-1)} />} />

          <Route path="/admin" element={authRole === 'admin' ? <AdminPanel onLogout={handleLogout} onBack={() => navigate('/')} /> : <Navigate to="/" replace />} />
          
          <Route path="/scout" element={(authRole === 'recruiter' || authRole === 'scout') ? <RecruiterPortal onSelect={handlePlayerSelect} onLogout={handleLogout} onBack={() => navigate('/')} /> : <Navigate to="/" replace />} />

          {/* PARENT AND ATHLETE ROUTES ARE NOW SPLIT */}
          <Route path="/parent" element={authRole === 'parent' ? <FamilyDashboard viewMode="parent" onLogout={handleLogout} /> : <Navigate to="/" replace />} />
          
          <Route path="/athlete" element={authRole === 'athlete' ? <FamilyDashboard viewMode="athlete" onLogout={handleLogout} /> : <Navigate to="/" replace />} />
        </Routes>
      </main>

      <SanctionedFooter />
    </div>
  );
}