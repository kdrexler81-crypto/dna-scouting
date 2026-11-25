// src/App.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Lock, Loader2, X, User, Building, Trophy, Shield, Key } from 'lucide-react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';

// --- PAGES ---
import { AdminPanel } from './pages/AdminPanel';
import { RecruiterPortal } from './pages/RecruiterPortal';
import { FamilyDashboard } from './pages/FamilyDashboard';
import { ProfilePage } from './pages/ProfilePage';
import { PublicHub } from './pages/PublicHub';
import { RosterPage } from './pages/RosterPage';
import { AboutPage } from './pages/AboutPage';
import { CollegeDirectory } from './pages/CollegeDirectory';

// --- LAYOUT COMPONENTS ---
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ReportIssueButton } from './components/ReportIssueButton';

// --- GLOBAL STATE ---
import { useApp } from './context/AppContext';

// --- FIREBASE ACTIONS ---
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, updateDoc, increment, setDoc, getDoc } from 'firebase/firestore';

// --- ANALYTICS ---
import { Analytics } from '@vercel/analytics/react';

// --- TYPOGRAPHY HELPERS ---
const displayFont = { fontFamily: "'Barlow Condensed', sans-serif" };
const bodyFont = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

// --- UPGRADED REGISTRATION MODAL ---
const LoginModal = ({ isOpen, onClose, onLoginSuccess, initialMode }) => {
  const { app, auth, db, appId, players } = useApp(); 

  const [mode, setMode] = useState(initialMode || 'admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [zip, setZip] = useState('');
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [coachName, setCoachName] = useState('');
  const [schoolName, setSchoolName] = useState('');

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => a.name.split(' ').slice(-1)[0].localeCompare(b.name.split(' ').slice(-1)[0]));
  }, [players]);

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
        const userCred = await createUserWithEmailAndPassword(auth, username, password);
        
        try {
          const linkAccount = httpsCallable(getFunctions(app), 'linkFamilyAccount');
          await linkAccount({
            athleteId: selectedAthleteId,
            accessCode,
            role: userRole,
            phone, address, city, state: stateCode, zip, fullName, appId
          });
          onLoginSuccess(userRole, { email: username, uid: userCred.user.uid });
        } catch (linkErr) {
          await userCred.user.delete();
          throw new Error(linkErr.message || "Failed to verify Access Code.");
        }

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
    } catch (err) { setError(err.message || 'Authentication failed. Please verify your credentials.'); }
    setLoading(false);
  };

  const getActiveColor = () => {
    if (mode.includes('admin')) return '#d6336c';
    if (mode.includes('recruiter')) return '#1c7ed6';
    if (mode.includes('parent')) return '#059669';
    if (mode.includes('athlete')) return '#8b5cf6';
    return '#334155';
  };

  const InputLabel = ({ children }) => <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-widest">{children}</label>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden my-8">
        <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: getActiveColor() }}></div>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 p-1.5 rounded-full z-10"><X size={18} /></button>
        
        <div className="p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
          <div className="flex flex-wrap gap-1.5 mb-8 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
            <button type="button" onClick={() => {setMode('admin'); setError('');}} className={`flex-1 py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode === 'admin' ? 'bg-white shadow-sm text-[#d6336c]' : 'text-slate-500 hover:text-slate-700'}`}>Admin</button>
            <button type="button" onClick={() => {setMode('recruiter_login'); setError('');}} className={`flex-1 py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode.includes('recruiter') ? 'bg-white shadow-sm text-[#1c7ed6]' : 'text-slate-500 hover:text-slate-700'}`}>Scout</button>
            <button type="button" onClick={() => {setMode('parent_login'); setError('');}} className={`flex-1 py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode.includes('parent') ? 'bg-white shadow-sm text-[#059669]' : 'text-slate-500 hover:text-slate-700'}`}>Parent</button>
            <button type="button" onClick={() => {setMode('athlete_login'); setError('');}} className={`flex-1 py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode.includes('athlete') ? 'bg-white shadow-sm text-[#8b5cf6]' : 'text-slate-500 hover:text-slate-700'}`}>Athlete</button>
          </div>

          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4" style={{ color: getActiveColor() }}>
              {mode === 'admin' && <Lock size={24} />}
              {mode.includes('recruiter') && <Building size={24} />}
              {mode.includes('parent') && <Shield size={24} />}
              {mode.includes('athlete') && <Trophy size={24} />}
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tight" style={displayFont}>
              {mode === 'admin' && 'Coach Portal'}
              {mode.includes('recruiter') && 'Scout Portal'}
              {mode.includes('parent') && 'Parent Account'}
              {mode.includes('athlete') && 'Athlete Account'}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">
              {mode.includes('signup') ? 'Secure Registration' : 'Account Login'}
            </p>
          </div>
          
          {error && <div className={`border text-xs font-semibold p-3.5 rounded-xl text-center mb-6 leading-relaxed ${error.includes('successfully') ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <InputLabel>{mode === 'recruiter_signup' ? 'University Email (.edu)' : 'Email Address'}</InputLabel>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input required type="email" placeholder="Enter email" className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 transition-all" style={{ borderColor: getActiveColor() }} value={username} onChange={e => setUsername(e.target.value)} />
              </div>
            </div>
            <div>
              <InputLabel>Password</InputLabel>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input required type="password" placeholder="Enter password" className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 transition-all" style={{ borderColor: getActiveColor() }} value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>

            {mode === 'recruiter_signup' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div><InputLabel>Coach Name</InputLabel><input required type="text" placeholder="John Doe" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1c7ed6] focus:ring-2 transition-all" value={coachName} onChange={e => setCoachName(e.target.value)} /></div>
                <div><InputLabel>University</InputLabel><input required type="text" placeholder="State Univ." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1c7ed6] focus:ring-2 transition-all" value={schoolName} onChange={e => setSchoolName(e.target.value)} /></div>
              </div>
            )}

            {(mode === 'parent_signup' || mode === 'athlete_signup') && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-3">
                  <div><InputLabel>Full Name</InputLabel><input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all" style={{ '--tw-ring-color': getActiveColor() }} value={fullName} onChange={e => setFullName(e.target.value)} /></div>
                  <div><InputLabel>Phone Number</InputLabel><input required type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all" style={{ '--tw-ring-color': getActiveColor() }} value={phone} onChange={e => setPhone(e.target.value)} /></div>
                </div>

                {mode === 'parent_signup' && (
                  <>
                    <div><InputLabel>Street Address</InputLabel><input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all" style={{ '--tw-ring-color': getActiveColor() }} value={address} onChange={e => setAddress(e.target.value)} /></div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-1"><InputLabel>City</InputLabel><input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all" style={{ '--tw-ring-color': getActiveColor() }} value={city} onChange={e => setCity(e.target.value)} /></div>
                      <div className="col-span-1"><InputLabel>State</InputLabel><input required type="text" maxLength="2" placeholder="NJ" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all uppercase" style={{ '--tw-ring-color': getActiveColor() }} value={stateCode} onChange={e => setStateCode(e.target.value.toUpperCase())} /></div>
                      <div className="col-span-1"><InputLabel>Zip</InputLabel><input required type="text" maxLength="5" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all" style={{ '--tw-ring-color': getActiveColor() }} value={zip} onChange={e => setZip(e.target.value)} /></div>
                    </div>
                  </>
                )}

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-6">
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2"><Key size={14}/> Identity Verification</h4>
                  <div className="space-y-4">
                    <div>
                      <InputLabel>Select Athlete Profile</InputLabel>
                      <select required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 transition-all" style={{ '--tw-ring-color': getActiveColor() }} value={selectedAthleteId} onChange={e => setSelectedAthleteId(e.target.value)}>
                        <option value="" disabled>-- Choose Profile --</option>
                        {sortedPlayers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.gradYear})</option>)}
                      </select>
                    </div>
                    <div>
                      <InputLabel>6-Digit Access Code</InputLabel>
                      <input required type="text" maxLength="6" placeholder="e.g. A1B2C3" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold tracking-widest uppercase focus:outline-none focus:ring-2 transition-all" style={{ '--tw-ring-color': getActiveColor() }} value={accessCode} onChange={e => setAccessCode(e.target.value.toUpperCase())} />
                      <p className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">Provided by your coach to secure this profile.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <button type="submit" disabled={loading} className="w-full hover:-translate-y-0.5 transition-all text-white font-bold py-4 rounded-xl uppercase tracking-wider text-sm shadow-lg mt-6 flex justify-center items-center gap-2" style={{ background: mode === 'admin' ? 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' : getActiveColor() }}>
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
    </div>
  );
};

// --- MASTER APP CONTROLLER ---
export default function App() {
  const navigate = useNavigate();

  const { 
    auth, db, appId, isFirebaseActive,
    dbStatus,
    authRole, setAuthRole,
    recruiterData, setRecruiterData,
    setFamilyData
  } = useApp();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState('admin');

  // Load Barlow Condensed + Plus Jakarta Sans fonts
  useEffect(() => {
    if (!document.getElementById('dna-fonts-v2')) {
      const link = document.createElement('link');
      link.id = 'dna-fonts-v2';
      link.href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetPlayerId = params.get('p');
    if (targetPlayerId) {
      navigate(`/player/${targetPlayerId}`, { replace: true });
    }
  }, [navigate]);

  const handleLoginSuccess = (role, data) => { 
    setAuthRole(role); sessionStorage.setItem('dna_auth_role', role);
    if (role === 'recruiter') { setRecruiterData(data); sessionStorage.setItem('dna_recruiter_data', JSON.stringify(data)); }
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

  const openModal = (mode) => {
    setLoginModalMode(mode);
    setIsLoginModalOpen(true);
  };

  const getDashboardRoute = () => {
    if (authRole === 'admin') return '/admin';
    if (authRole === 'recruiter') return '/scout';
    if (authRole === 'parent') return '/parent';
    if (authRole === 'athlete') return '/athlete';
    return '/';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between" style={bodyFont}>
      <Navbar
        authRole={authRole}
        dbStatus={dbStatus}
        dashboardRoute={getDashboardRoute()}
        onOpenLogin={openModal}
        onLogout={handleLogout}
      />

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
          <Route path="/about" element={<AboutPage />} />
          <Route path="/player/:id" element={<ProfilePage onBack={() => navigate(-1)} />} />
          <Route path="/admin" element={authRole === 'admin' ? <AdminPanel onLogout={handleLogout} onBack={() => navigate('/')} /> : <Navigate to="/" replace />} />
          <Route path="/scout" element={(authRole === 'recruiter' || authRole === 'scout') ? <RecruiterPortal onSelect={handlePlayerSelect} onLogout={handleLogout} onBack={() => navigate('/')} /> : <Navigate to="/" replace />} />
          <Route path="/parent" element={authRole === 'parent' ? <FamilyDashboard viewMode="parent" onLogout={handleLogout} /> : <Navigate to="/" replace />} />
          <Route path="/athlete" element={authRole === 'athlete' ? <FamilyDashboard viewMode="athlete" onLogout={handleLogout} /> : <Navigate to="/" replace />} />
          <Route path="/colleges" element={<CollegeDirectory />} />
        </Routes>
      </main>

      <Footer />
      <ReportIssueButton />
      <Analytics />
    </div>
  );
}