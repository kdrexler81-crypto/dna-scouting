import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, Lock, Camera, Ruler, Zap, Target, Newspaper, Trophy, 
  Activity, Database, Check, Loader2, Video, ExternalLink, Shield, Calendar, MapPin, Eye, TrendingUp, History, Search, Megaphone, X, User, Info
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, increment, arrayUnion, deleteDoc } from 'firebase/firestore';
// --- FIREBASE INITIALIZATION ---
let app, auth, db, appId;
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
    appId = firebaseConfig.appId || 'default-app-id';
    isFirebaseActive = true;
  }
} catch (e) {
  console.error("Firebase offline", e);
}

// --- INITIAL SEED DATA ---
const INITIAL_SEED = {
  players: [],
  news: []
};
// --- BRAND COMPONENTS ---
const DNALogo = () => (
  <div className="flex items-center gap-3">
    <img src="/DNA Logo.png" alt="DNA Football Logo" className="h-10 w-auto" onError={(e) => e.target.style.display='none'} />
    <span className="font-bold text-xl tracking-wide uppercase text-slate-900 hidden sm:block">DNA Football</span>
  </div>
);

// --- FOOTER COMPONENT ---
const SanctionedFooter = () => (
  <footer className="bg-white border-t border-slate-200 py-12 mt-20 text-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
    <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center space-y-6">
      <div className="flex flex-col items-center space-y-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Official Dual Sanctioned Organization</span>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-center gap-6">
          <img 
            src="/usa-football-logo.jpg" 
            alt="USA Football Sanctioned" 
            className="h-10 w-auto object-contain transition-all duration-300" 
            onError={(e) => { e.target.style.display = 'none'; }} 
          />
          <div className="h-8 w-px bg-slate-300"></div>
          <span className="text-xs font-display font-bold text-slate-800 uppercase tracking-wider">USA Football & NFL FLAG Partner</span>
        </div>
      </div>

      <div className="flex justify-center gap-8 pt-2">
        <a href="https://instagram.com/dna_girlsflagfootball" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-[#d6336c] transition flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"/></svg>
          <span className="text-xs font-semibold tracking-wide">@dna_girlsflagfootball</span>
        </a>
        <a href="https://x.com/DNA_girlsflag" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-[#1c7ed6] transition flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          <span className="text-xs font-semibold tracking-wide">@DNA_girlsflag</span>
        </a>
      </div>

      <p className="text-slate-400 text-[10px] uppercase tracking-widest pt-4">&copy; {new Date().getFullYear()} DNA Football. All rights reserved.</p>
    </div>
  </footer>
);

// --- ADMIN LOGIN MODAL ---
const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(auth, username, password);
    setError('');
    setUsername('');
    setPassword('');
    onLoginSuccess();
  } catch (err) {
    setError('Invalid email or password. Are you authorized?');
  }
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative" style={{ borderTop: '4px solid #d6336c' }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3" style={{ color: '#d6336c' }}>
            <Lock size={22} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Coach Portal Access</h2>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mt-1">Authorized Staff Only</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold p-3 rounded-lg text-center mb-4 uppercase tracking-wider">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <input 
                required 
                type="text" 
                placeholder="Enter username" 
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg pl-10 pr-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#1c7ed6] focus:ring-1 focus:ring-[#1c7ed6]"
                value={username} 
                onChange={e => setUsername(e.target.value)} 
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <input 
                required 
                type="password" 
                placeholder="Enter password" 
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg pl-10 pr-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#d6336c] focus:ring-1 focus:ring-[#d6336c]"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full hover:scale-[1.02] transition-transform text-white font-bold py-3.5 rounded-xl uppercase tracking-wider text-sm shadow-md mt-2" 
            style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}
          >
            Authenticate & Enter
          </button>
        </form>
      </div>
    </div>
  );
};

// --- ABOUT PAGE ---
const AboutPage = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in slide-in-from-bottom-8">
      <button onClick={onBack} className="mb-6 font-bold flex items-center gap-1 uppercase tracking-wider text-sm text-[#1c7ed6] hover:opacity-80 transition-opacity">
        <ChevronLeft size={16} /> Back to Hub
      </button>

      <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200 mb-8" style={{ borderTop: '4px solid #1c7ed6' }}>
        <div className="p-8 md:p-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-sm" style={{ color: '#d6336c' }}>
              <Shield size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">About DNA Athletics</h1>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Elevating the Game</p>
            </div>
          </div>
          
          <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
            <p className="text-lg leading-relaxed">
              <strong>DNA Athletics</strong> is a premier girls' flag football organization, officially sanctioned by both <strong>USA Football</strong> and <strong>NFL FLAG</strong>. We are dedicated to providing a high-level, competitive platform for female athletes to develop, showcase their skills, and gain exposure at the regional and national levels.
            </p>

            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight mt-8 mb-4 border-b border-slate-100 pb-2">Why It Matters</h2>
            <p className="leading-relaxed">
              Girls' flag football is one of the fastest-growing sports in the country, rapidly expanding across high school and collegiate levels. As the talent pool deepens and scouting becomes more competitive, athletes need a standardized, objective way to be evaluated. DNA Athletics bridges the gap between raw potential and verified performance, providing athletes with the concrete metrics that scouts and programs demand.
            </p>

            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight mt-8 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Activity size={20} style={{ color: '#d6336c' }} /> The DNA Score
            </h2>
            <p className="leading-relaxed">
              The <strong>DNA Score</strong> is our proprietary scouting metric, designed to give a comprehensive snapshot of an athlete's physical explosiveness and on-field positional skills. 
            </p>
            
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mt-4 shadow-sm">
              <ul className="space-y-3 mb-0">
                <li className="flex items-start gap-2">
                  <Target size={18} className="text-[#1c7ed6] mt-0.5 shrink-0" />
                  <span><strong>Physical Measurables:</strong> We independently verify speed, agility, and explosiveness through standardized combine events, including the 40-yard dash, 5-10-5 shuttle, broad jump, and vertical leap.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Target size={18} className="text-[#1c7ed6] mt-0.5 shrink-0" />
                  <span><strong>Positional Skills:</strong> Athletes are tested on game-specific mechanics, such as throwing accuracy, catching consistency, and flag-pulling efficiency under pressure.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Target size={18} className="text-[#1c7ed6] mt-0.5 shrink-0" />
                  <span><strong>The Formula:</strong> These weighted metrics are processed through our proprietary algorithm to generate a single composite DNA Score (scaled 1.0 to 10.0). This creates a completely objective, national benchmark, allowing athletes to see exactly where they stand and what they need to improve.</span>
                </li>
              </ul>
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-6 text-center">
              Verify your physicals. Earn your score. Secure your ranking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 1. PROFILE PAGE ---
const ProfilePage = ({ player, onBack }) => {
  if (!player) return null;

  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtu.be')) {
        videoId = url.split('/').pop().split('?')[0];
      } else {
        try { const urlObj = new URL(url); videoId = urlObj.searchParams.get('v'); } catch (e) { videoId = ''; }
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    return null;
  };

  const embedUrl = getEmbedUrl(player.hudlLink);

  const getMetricStyle = (val) => {
  if (!val && val !== 0) return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
  const strVal = String(val);
  const num = parseFloat(strVal);
  if (isNaN(num)) return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
  if (num >= 8.0 || (strVal.includes('%') && num >= 80)) return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' };
  if (num >= 6.0 || (strVal.includes('%') && num >= 60)) return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' };
  return { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' };
};

  const MetricRow = ({ icon: Icon, label, playerStat, avgStat }) => {
    const statStyle = getMetricStyle(playerStat);
    return (
      <div className="flex items-center justify-between py-4 border-b border-slate-100 group hover:bg-slate-50 transition-colors px-2 rounded-lg">
        <div className="flex items-center gap-3 w-[45%]">
          <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white border border-slate-200 transition-colors shrink-0">
            <Icon size={18} className="text-slate-700" />
          </div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-tight truncate">{label}</span>
        </div>
        <div className="w-[30%] text-center">
          <span className={`text-sm px-3 py-1 rounded-md font-bold ${statStyle.bg} ${statStyle.text} border ${statStyle.border} shadow-sm`}>
            {playerStat}
          </span>
        </div>
        <div className="w-[25%] text-right flex justify-end items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
          {avgStat} <ChevronLeft size={10} className="rotate-180" />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 py-8 animate-in slide-in-from-bottom-8">
      <button onClick={onBack} className="mb-6 font-bold flex items-center gap-1 uppercase tracking-wider text-sm hover:opacity-80 transition-opacity" style={{ color: '#d6336c' }}><ChevronLeft size={16} /> Back to Hub</button>
      
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT COLUMN: HERO & IDENTIFICATION */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200">
            <div className="bg-slate-900 p-4 pb-0 relative">
               <div className="absolute top-4 left-4"><DNALogo /></div>
               <div className="absolute top-4 right-4 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-md" style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}>Verified</div>
               <img src={player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} className="w-full h-64 object-cover mt-12 bg-slate-100 rounded-t-xl border-t border-x border-slate-200" style={{ borderBottom: '4px solid #d6336c' }} alt={player.name} />
            </div>
            
            <div className="bg-slate-900 text-center pb-6">
              <h1 className="text-3xl font-bold text-white uppercase">{player.name}</h1>
              <p className="font-semibold text-xs uppercase tracking-widest" style={{ color: '#1c7ed6' }}>{player.pos} • Class of {player.gradYear} • {player.city}, {player.state}</p>
            </div>

            <div className="flex bg-slate-50 border-b border-slate-200">
              <div className="w-1/3 p-4 text-center border-r border-slate-200">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">DNA Grade</span>
                <span className="text-3xl font-black" style={{ color: '#d6336c' }}>{player.dnaScore}</span>
              </div>
              <div className="w-1/3 p-4 text-center border-r border-slate-200 flex flex-col justify-center items-center">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Average</span>
                <span className="bg-slate-200 text-slate-700 font-bold text-lg px-3 py-0.5 rounded shadow-inner">7.0</span>
              </div>
              <div className="w-1/3 p-4 text-center flex flex-col justify-center items-center bg-white">
                <span className="block text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 mb-1" style={{ color: '#1c7ed6' }}><Eye size={10}/> Views</span>
                <span className="text-2xl font-bold text-slate-800 flex items-center gap-1">
                  {player.views || 0} <TrendingUp size={16} className="text-emerald-500"/>
                </span>
              </div>
            </div>

            <div className="bg-white p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center justify-center gap-2" style={{ color: '#d6336c' }}>
                <Shield size={16} /> Verified Regular Season Stats
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Passing Yds</span>
                  <span className="text-xl font-black" style={{ color: '#1c7ed6' }}>{player.seasonStats?.passingYards ?? 0}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Flag Pulls</span>
                  <span className="text-xl font-black" style={{ color: '#d6336c' }}>{player.seasonStats?.flagPulls ?? 0}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Intercept</span>
                  <span className="text-xl font-black text-slate-800">{player.seasonStats?.interceptions ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: METRICS & TAPE */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Verified Athletic Metrics</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Combine Results & Scoring</p>
              </div>
              {player.combineEvent && (
                <div className="bg-slate-50 py-2 px-4 rounded-lg border border-slate-200 flex items-center gap-2 shadow-sm text-right">
                  <Calendar size={14} className="text-slate-500" />
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                    {player.combineEvent.location}<br/>{player.combineEvent.date}
                  </span>
                </div>
              )}
            </div>
            
           <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
          <div>
            <MetricRow icon={Ruler} label="Height" playerStat={player?.height || "N/A"} avgStat={NAT_AVG.height} />
            <MetricRow icon={Activity} label="Weight" playerStat={player?.weight ? `${player.weight} lbs` : "N/A"} avgStat={NAT_AVG.weight} />
            <MetricRow icon={Zap} label="40-Yard Sprint" playerStat={player?.metrics?.sprint || "N/A"} avgStat={NAT_AVG.sprint} />
            <MetricRow icon={Activity} label="5-10-5 Shuttle" playerStat={player?.metrics?.shuttle || "N/A"} avgStat={NAT_AVG.shuttle} />
            <MetricRow icon={Target} label="Broad Jump" playerStat={player?.metrics?.broad || "N/A"} avgStat={NAT_AVG.broad} />
          </div>
          <div>
            <MetricRow icon={Target} label="Vertical Jump" playerStat={player?.metrics?.vertical || "N/A"} avgStat={NAT_AVG.vertical} />
            <MetricRow icon={Target} label="Catching Chal." playerStat={player?.metrics?.catching || "N/A"} avgStat={NAT_AVG.catching} />
            <MetricRow icon={Target} label="Throwing Acc." playerStat={player?.metrics?.throwing || "N/A"} avgStat={NAT_AVG.throwing} />
            <MetricRow icon={Target} label="Flag Pull Chal." playerStat={player?.metrics?.flag || "N/A"} avgStat={NAT_AVG.flag} />
          </div>
        </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {player.hudlLink && (
              <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200 p-6 flex flex-col h-full">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: '#1c7ed6' }}>
                  <Video size={16} /> Verified Film & Tape
                </h3>
                <div className="relative w-full flex-grow rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shadow-inner min-h-[200px]">
                  {embedUrl ? (
                    <iframe src={embedUrl} title="Highlight Reel" className="absolute inset-0 w-full h-full" allowFullScreen></iframe>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                      <p className="text-xs text-slate-500 mb-3 font-bold">Hudl / External Tape Link Connected</p>
                      <a href={player.hudlLink} target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-transform text-white text-xs font-bold px-5 py-2.5 rounded-lg uppercase tracking-wider flex items-center gap-2 shadow-md" style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}>
                        Watch Film On Hudl <ExternalLink size={14} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {player.combineHistory && player.combineHistory.length > 1 && (
              <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200 p-6 flex flex-col h-full">
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <History size={16} /> Progression History
                 </h3>
                 <div className="space-y-3 flex-grow overflow-y-auto max-h-[250px] pr-2">
                    {[...player.combineHistory].reverse().map((hist, idx) => (
                       <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{hist.date}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{hist.location}</p>
                            <p className="text-sm font-bold text-slate-800 mt-2">Score: <span className="text-lg font-black" style={{ color: '#d6336c' }}>{hist.dnaScore}</span></p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-600 font-bold block uppercase">{hist.height} | {hist.weight} lbs</span>
                            <span className="text-[10px] font-bold block uppercase mt-0.5" style={{ color: '#1c7ed6' }}>{hist.metrics.sprint} 40-yd</span>
                            <span className="text-[10px] font-bold block uppercase mt-0.5" style={{ color: '#1c7ed6' }}>{hist.metrics.vertical} Vert</span>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 2. PUBLIC HUB ---
const PublicHub = ({ players, news: localNews, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [posFilter, setPosFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  
  const [externalNews, setExternalNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    const fetchLiveNews = async () => {
      try {
        const rssUrl = encodeURIComponent('https://news.google.com/rss/search?q="girls+flag+football"&hl=en-US&gl=US&ceid=US:en');
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
        const data = await res.json();
        
        if (data.items) {
          const formattedNews = data.items.slice(0, 6).map(item => {
            const dateObj = new Date(item.pubDate);
            return {
              id: item.guid || item.link,
              title: item.title,
              date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              category: 'Global News',
              link: item.link,
              createdAt: dateObj.getTime()
            };
          });
          setExternalNews(formattedNews);
        }
      } catch (error) {
        console.error("Failed to fetch live news feed", error);
      } finally {
        setLoadingNews(false);
      }
    };
    fetchLiveNews();
  }, []);

  const uniquePositions = useMemo(() => {
    const posSet = new Set();
    players.forEach(p => {
      if (p.pos) { p.pos.split('/').forEach(pos => posSet.add(pos.trim())); }
    });
    return ['All', ...Array.from(posSet)].sort();
  }, [players]);

  const uniqueYears = useMemo(() => {
    const yearSet = new Set();
    players.forEach(p => {
      if (p.gradYear) yearSet.add(p.gradYear);
    });
    return ['All', ...Array.from(yearSet)].sort((a, b) => b - a);
  }, [players]);

  const filteredAndSortedPlayers = useMemo(() => {
    return players
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPos = posFilter === 'All' || (p.pos && p.pos.includes(posFilter));
        const matchesYear = yearFilter === 'All' || p.gradYear === Number(yearFilter);
        return matchesSearch && matchesPos && matchesYear;
      })
      .sort((a, b) => Number(b.dnaScore) - Number(a.dnaScore));
  }, [players, searchTerm, posFilter, yearFilter]);

  const sortedNews = useMemo(() => {
    const combined = [...localNews, ...externalNews];
    return combined.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 10);
  }, [localNews, externalNews]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* PERSISTENT HERO CTA BANNER */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden" style={{ borderTop: '4px solid #1c7ed6' }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[rgba(214,51,108,0.05)] to-transparent rounded-bl-full pointer-events-none"></div>
        <div className="relative z-10 text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 uppercase tracking-tight mb-2">
            Want to get on the <span style={{ color: '#d6336c' }}>Leaderboard?</span>
          </h2>
          <p className="text-slate-600 text-sm font-semibold max-w-2xl">
            Evaluation spots are strictly limited. Register for our next official combine to get your verified physicals, earn your DNA Score, and secure your national ranking.
          </p>
        </div>
        <a 
          href="https://form.jotform.com/261971178556065" 
          target="_blank" 
          rel="noopener noreferrer"
          className="relative z-10 shrink-0 hover:scale-105 transition-transform text-white font-bold px-8 py-4 rounded-xl uppercase tracking-wider shadow-md text-sm flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}
        >
          Register For Combine <ExternalLink size={16} />
        </a>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 order-2 md:order-1 space-y-6">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden p-6" style={{ borderTop: '4px solid #1c7ed6' }}>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4 uppercase"><Newspaper style={{ color: '#1c7ed6' }} /> Live News Feed</h2>
            <div className="space-y-4">
              
              {loadingNews && localNews.length === 0 ? (
                 <div className="flex items-center gap-2 text-slate-500 text-sm italic font-bold">
                   <Loader2 size={14} className="animate-spin text-[#d6336c]" /> Fetching latest headlines...
                 </div>
              ) : sortedNews.length === 0 ? (
                 <p className="text-slate-500 text-sm italic">No recent updates.</p>
              ) : (
                 sortedNews.map(item => {
                   const isExternal = !!item.link;
                   const Wrapper = isExternal ? 'a' : 'div';
                   
                   return (
                     <Wrapper
                       key={item.id}
                       href={item.link || undefined}
                       target={isExternal ? "_blank" : undefined}
                       rel={isExternal ? "noopener noreferrer" : undefined}
                       className={`block pl-3 transition-transform ${isExternal ? 'hover:-translate-y-0.5 cursor-pointer group' : ''}`}
                       style={{ borderLeft: `2px solid ${item.category === 'Global News' ? '#1c7ed6' : '#d6336c'}` }}
                     >
                       <div className="flex items-center gap-1.5">
                         <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: item.category === 'Global News' ? '#1c7ed6' : '#d6336c' }}>
                           {item.category} • {item.date}
                         </span>
                         {isExternal && <ExternalLink size={10} className="text-slate-400 group-hover:text-[#1c7ed6] transition-colors" />}
                       </div>
                       <p className={`text-sm font-bold text-slate-800 mt-1 transition-colors ${isExternal ? 'group-hover:text-[#1c7ed6]' : ''}`}>
                         {item.title}
                       </p>
                     </Wrapper>
                   );
                 })
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 order-1 md:order-2">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden" style={{ borderTop: '4px solid #d6336c' }}>
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 uppercase"><Trophy style={{ color: '#d6336c' }} /> National Leaderboard</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Player Evaluation Hub</p>
              </div>
              <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                 {filteredAndSortedPlayers.length} Athletes Found
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col md:flex-row gap-3">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                 <input 
                   type="text" 
                   placeholder="Search by athlete name..." 
                   className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg pl-10 pr-4 py-2.5 text-sm font-semibold focus:outline-none transition-colors focus:border-[#1c7ed6] focus:ring-1 focus:ring-[#1c7ed6]"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
               </div>
               <div className="flex gap-3 sm:w-auto w-full">
                  <div className="flex-1 md:w-36">
                     <select 
                       className="w-full bg-white border border-slate-300 text-slate-700 rounded-lg px-3 py-2.5 text-sm font-semibold focus:outline-none cursor-pointer focus:border-[#1c7ed6]"
                       value={posFilter}
                       onChange={(e) => setPosFilter(e.target.value)}
                     >
                       {uniquePositions.map(pos => <option key={pos} value={pos}>{pos === 'All' ? 'All Positions' : pos}</option>)}
                     </select>
                  </div>
                  <div className="flex-1 md:w-40">
                     <select 
                       className="w-full bg-white border border-slate-300 text-slate-700 rounded-lg px-3 py-2.5 text-sm font-semibold focus:outline-none cursor-pointer focus:border-[#1c7ed6]"
                       value={yearFilter}
                       onChange={(e) => setYearFilter(e.target.value)}
                     >
                       {uniqueYears.map(year => <option key={year} value={year}>{year === 'All' ? 'All Classes' : `Class of ${year}`}</option>)}
                     </select>
                  </div>
               </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {filteredAndSortedPlayers.length === 0 ? (
                 <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">
                   No athletes match your filters.
                 </div>
              ) : (
                 filteredAndSortedPlayers.map((p, i) => (
                   <div key={p.id} onClick={() => onSelect(p)} className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer group transition-colors">
                     <div className="flex items-center gap-4">
                       <div className="w-8 text-center text-slate-400 font-bold text-xl">#{i + 1}</div>
                       <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} alt={p.name} className="w-12 h-12 rounded-full border-2 border-slate-200 bg-slate-100 object-cover transition-colors group-hover:border-[#d6336c]" />
                       <div>
                         <p className="font-bold text-slate-900 text-lg uppercase flex items-center gap-2 transition-colors">
                           {p.name} {p.hudlLink && <Video size={14} style={{ color: '#1c7ed6' }} />}
                         </p>
                         <p className="text-slate-500 text-xs font-bold tracking-widest uppercase">{p.pos} • {p.city}, {p.state}</p>
                       </div>
                     </div>
                     <div className="text-center bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm transition-colors group-hover:border-slate-300">
                       <span className="block text-[10px] text-slate-500 uppercase font-bold">DNA Score</span>
                       <p className="font-black text-2xl" style={{ color: '#d6336c' }}>{p.dnaScore}</p>
                     </div>
                   </div>
                 ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- CUSTOM INPUT COMPONENTS FOR ADMIN PANEL ---
const InputLabel = ({ children }) => (
  <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-widest">{children}</label>
);

const FormInput = (props) => (
  <input 
    {...props} 
    className={`w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 text-sm focus:outline-none focus:border-[#1c7ed6] focus:ring-1 focus:ring-[#1c7ed6] ${props.className || ''}`}
  />
);

// --- 3. ADMIN PANEL ---
const AdminPanel = ({ onBack, dbConfigured, players, onLogout }) => {
  const [activeTab, setActiveTab] = useState('athlete');
  const [savingAthlete, setSavingAthlete] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedExistingId, setSelectedExistingId] = useState("");
  const today = new Date().toISOString().split('T')[0];

  const defaultMetrics = {
    name: '', pos: 'QB', gradYear: 2029, city: 'Randolph', state: 'NJ', 
    heightFeet: 5, heightInches: 2, weight: 105,
    sprint: 6.5, shuttle: 5.4, broadFeet: 6, broadInches: 0, verticalInches: 9.2,
    catchingPct: 70, throwingScore: 6.5, flagPullingPct: 60, hudlLink: '',
    passingYards: 0, flagPulls: 0, interceptions: 0,
    combineLocation: '', combineDate: today
  };
  const [metrics, setMetrics] = useState(defaultMetrics);

  const [savingNews, setSavingNews] = useState(false);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsCategory, setNewsCategory] = useState("DNA Official");

  const handleSelectExisting = (playerId) => {
    setSelectedExistingId(playerId);
    if (!playerId) {
      setMetrics(defaultMetrics);
      setPhotoPreview(null);
      return;
    }
    const p = players.find(player => player.id === playerId);
    if (p) {
      const hFeet = p.height ? parseInt(p.height.split("'")[0]) : 5;
      const hInches = p.height ? parseInt(p.height.split("'")[1].replace('"', '')) : 2;
      
      setMetrics({
        ...defaultMetrics,
        name: p.name, pos: p.pos, gradYear: p.gradYear, city: p.city, state: p.state,
        heightFeet: hFeet, heightInches: hInches, weight: p.weight,
        hudlLink: p.hudlLink || '',
        passingYards: p.seasonStats?.passingYards || 0,
        flagPulls: p.seasonStats?.flagPulls || 0,
        interceptions: p.seasonStats?.interceptions || 0,
        combineLocation: '', combineDate: today
      });
      setPhotoPreview(p.avatar || null);
    }
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const calculatedDNAScore = useMemo(() => {
    const sprintScore = Math.max(0, 10 - (metrics.sprint - 4.5) * 2);
    const shuttleScore = Math.max(0, 10 - (metrics.shuttle - 4.0) * 2);
    const speedRating = (sprintScore + shuttleScore) / 2;

    const skillRating = (
      (Number(metrics.catchingPct) / 10) + 
      Number(metrics.throwingScore) + 
      (Number(metrics.flagPullingPct) / 10)
    ) / 3;

    const rawScore = (speedRating * 0.5) + (skillRating * 0.5);
    return Math.min(10.0, Math.max(1.0, rawScore)).toFixed(1);
  }, [metrics]);

  const submitCombineData = async (e) => {
    e.preventDefault();
    setSavingAthlete(true);
    
    const uploadTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newCombineRecord = {
      location: metrics.combineLocation || "DNA Regional Combine",
      date: metrics.combineDate,
      timestamp: uploadTime,
      dnaScore: calculatedDNAScore,
      height: `${metrics.heightFeet}'${metrics.heightInches}"`,
      weight: Number(metrics.weight),
      metrics: {
        sprint: `${metrics.sprint}s`, shuttle: `${metrics.shuttle}s`,
        broad: `${metrics.broadFeet}'${metrics.broadInches}"`, vertical: `${metrics.verticalInches}"`,
        catching: `${metrics.catchingPct}%`, throwing: `${metrics.throwingScore}`, flag: `${metrics.flagPullingPct}%`
      }
    };

    const playerData = {
      name: metrics.name, pos: metrics.pos, gradYear: Number(metrics.gradYear),
      city: metrics.city, state: metrics.state,
      height: newCombineRecord.height, weight: newCombineRecord.weight,
      dnaScore: calculatedDNAScore, avatar: photoPreview || "",
      hudlLink: metrics.hudlLink,
      combineEvent: { location: newCombineRecord.location, date: newCombineRecord.date, timestamp: newCombineRecord.timestamp },
      seasonStats: { passingYards: Number(metrics.passingYards), flagPulls: Number(metrics.flagPulls), interceptions: Number(metrics.interceptions) },
      metrics: newCombineRecord.metrics,
      updatedAt: Date.now()
    };

    try {
      if (dbConfigured && db) {
        if (selectedExistingId) {
          const playerRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', selectedExistingId);
          await updateDoc(playerRef, {
            ...playerData,
            combineHistory: arrayUnion(newCombineRecord)
          });
        } else {
          playerData.views = 0;
          playerData.createdAt = Date.now();
          playerData.combineHistory = [newCombineRecord];
          const playersRef = collection(db, 'artifacts', appId, 'public', 'data', 'players');
          await addDoc(playersRef, playerData);
        }
      }
      alert(`Athlete saved! Verified DNA Score: ${calculatedDNAScore}`);
      setMetrics(defaultMetrics);
      setSelectedExistingId("");
      setPhotoPreview(null);
    } catch (err) {
      alert("Error saving athlete: " + err.message);
    }
    setSavingAthlete(false);
  };

  const deleteAthlete = async () => {
    if (!selectedExistingId) return;
    const confirmDelete = window.confirm(`Are you sure you want to completely remove ${metrics.name}? This cannot be undone.`);
    if (!confirmDelete) return;

    try {
      if (dbConfigured && db) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', selectedExistingId));
      }
      alert("Athlete deleted successfully.");
      setMetrics(defaultMetrics);
      setSelectedExistingId("");
      setPhotoPreview(null);
    } catch (err) {
      alert("Error deleting athlete: " + err.message);
    }
  };

  const submitNews = async (e) => {
    e.preventDefault();
    setSavingNews(true);

    const formattedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    const newArticle = {
       title: newsTitle,
       category: newsCategory,
       date: formattedDate,
       createdAt: Date.now()
    };

    try {
      if (dbConfigured && db) {
         const newsRef = collection(db, 'artifacts', appId, 'public', 'data', 'news');
         await addDoc(newsRef, newArticle);
      }
      alert("News Update Posted to Live Feed!");
      setNewsTitle("");
      setNewsCategory("DNA Official");
    } catch (err) {
      alert("Error posting news: " + err.message);
    }
    setSavingNews(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 py-8 animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="font-bold flex items-center gap-1 hover:opacity-80 text-sm" style={{ color: '#1c7ed6' }}>
          <ChevronLeft size={16} /> Return to Public Hub
        </button>
        <button onClick={onLogout} className="text-xs font-bold text-rose-600 border border-rose-200 bg-rose-50 px-4 py-2 rounded-lg hover:bg-rose-100 transition-colors uppercase tracking-wider shadow-sm">
          Sign Out Admin
        </button>
      </div>

      <div className="flex gap-2 sm:gap-4 mb-6 border-b border-slate-200 pb-2">
         <button 
           onClick={() => setActiveTab('athlete')} 
           className={`flex-1 py-3 px-4 rounded-t-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === 'athlete' ? 'text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
           style={activeTab === 'athlete' ? { background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' } : {}}
         >
           <Activity size={16} /> Athlete Combine Entry
         </button>
         <button 
           onClick={() => setActiveTab('news')} 
           className={`flex-1 py-3 px-4 rounded-t-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === 'news' ? 'text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
           style={activeTab === 'news' ? { background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' } : {}}
         >
           <Megaphone size={16} /> Post News Update
         </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-b-2xl rounded-tr-2xl shadow-xl p-6 sm:p-8">
        
        {activeTab === 'news' && (
           <div className="animate-in fade-in slide-in-from-right-4">
              <div className="mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 uppercase flex items-center gap-2"><Newspaper style={{color:'#1c7ed6'}}/> Broadcast Live Update</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Push announcements directly to the public feed.</p>
              </div>

              <form onSubmit={submitNews} className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div>
                   <InputLabel>Update Title / Headline</InputLabel>
                   <FormInput required type="text" placeholder="e.g. Schedule Change for Randolph Combine..." value={newsTitle} onChange={e => setNewsTitle(e.target.value)} />
                </div>
                
                <div>
                   <InputLabel>Category Tag</InputLabel>
                   <select className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 text-sm focus:outline-none focus:border-[#1c7ed6]" value={newsCategory} onChange={e => setNewsCategory(e.target.value)}>
                      <option value="DNA Official">DNA Official (Announcements)</option>
                      <option value="Scouting Report">Scouting Report (Player Spotlights)</option>
                      <option value="Event Update">Event Update (Logistics/Camps)</option>
                      <option value="External Feed">External Feed (USA Football/NFL Flag News)</option>
                   </select>
                </div>

                <button type="submit" disabled={savingNews} className="w-full hover:scale-[1.02] transition-transform text-white font-bold py-4 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-md mt-4" style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}>
                  {savingNews ? <Loader2 className="animate-spin" /> : <Megaphone size={20} />} Push Update to Feed
                </button>
              </form>
           </div>
        )}

        {activeTab === 'athlete' && (
           <div className="animate-in fade-in slide-in-from-left-4">
              <div className="bg-slate-50 p-5 rounded-xl mb-8 border border-slate-200 shadow-sm">
                <label className="text-xs font-bold uppercase tracking-widest block mb-3" style={{ color: '#d6336c' }}>Select Existing Athlete (Or Create New)</label>
                <select 
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 font-bold cursor-pointer focus:outline-none focus:border-[#d6336c]"
                  value={selectedExistingId}
                  onChange={(e) => handleSelectExisting(e.target.value)}
                >
                  <option value="">+ Create Brand New Athlete</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>Update Existing: {p.name} ({p.gradYear}) - {p.city}, {p.state}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-3 uppercase tracking-wider font-bold">Selecting an athlete will append this new combine score to their history.</p>
              </div>

              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 uppercase">Live iPad Combine Entry</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Coach Portal</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Calculated DNA Grade</span>
                  <span className="text-3xl font-black" style={{ color: '#d6336c' }}>{calculatedDNAScore}</span>
                </div>
              </div>

              <form onSubmit={submitCombineData} className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div className="relative w-32 h-32 bg-white rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden shrink-0 group transition-colors hover:border-[#d6336c]">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2">
                        <Camera className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-widest">Take Photo</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handlePhotoCapture} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="sm:col-span-2"><InputLabel>Name</InputLabel><FormInput required value={metrics.name} onChange={e => setMetrics({...metrics, name: e.target.value})} disabled={!!selectedExistingId} /></div>
                     <div><InputLabel>Position</InputLabel><FormInput value={metrics.pos} onChange={e => setMetrics({...metrics, pos: e.target.value})} /></div>
                     <div><InputLabel>Grad Year</InputLabel><FormInput type="number" value={metrics.gradYear} onChange={e => setMetrics({...metrics, gradYear: e.target.value})} disabled={!!selectedExistingId} /></div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: '#1c7ed6' }}>
                    <MapPin size={14} /> 1. Combine Verification Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <InputLabel>Combine Location / Camp</InputLabel>
                      <FormInput required type="text" placeholder="e.g. Tampa Regional" value={metrics.combineLocation} onChange={e => setMetrics({...metrics, combineLocation: e.target.value})} />
                    </div>
                    <div>
                      <InputLabel>Date</InputLabel>
                      <FormInput required type="date" value={metrics.combineDate} onChange={e => setMetrics({...metrics, combineDate: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: '#1c7ed6' }}>
                    <Ruler size={14} /> 2. Physicals & Explosiveness
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <InputLabel>Height</InputLabel>
                      <div className="flex gap-2">
                        <FormInput type="number" placeholder="Ft" className="w-1/2" value={metrics.heightFeet} onChange={e => setMetrics({...metrics, heightFeet: e.target.value})} />
                        <FormInput type="number" placeholder="In" className="w-1/2" value={metrics.heightInches} onChange={e => setMetrics({...metrics, heightInches: e.target.value})} />
                      </div>
                    </div>
                    <div><InputLabel>Weight (lbs)</InputLabel><FormInput type="number" value={metrics.weight} onChange={e => setMetrics({...metrics, weight: e.target.value})} /></div>
                    <div>
                      <InputLabel>Broad Jump</InputLabel>
                      <div className="flex gap-2">
                        <FormInput type="number" placeholder="Ft" className="w-1/2" value={metrics.broadFeet} onChange={e => setMetrics({...metrics, broadFeet: e.target.value})} />
                        <FormInput type="number" placeholder="In" className="w-1/2" value={metrics.broadInches} onChange={e => setMetrics({...metrics, broadInches: e.target.value})} />
                      </div>
                    </div>
                    <div><InputLabel>Vertical (Inches)</InputLabel><FormInput type="number" step="0.1" value={metrics.verticalInches} onChange={e => setMetrics({...metrics, verticalInches: e.target.value})} /></div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: '#1c7ed6' }}>
                    <Zap size={14} /> 3. Speed, Agility & Skills
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="md:col-span-1"><InputLabel>40-Yd (Sec)</InputLabel><FormInput type="number" step="0.01" value={metrics.sprint} onChange={e => setMetrics({...metrics, sprint: e.target.value})} /></div>
                    <div className="md:col-span-1"><InputLabel>5-10-5 (Sec)</InputLabel><FormInput type="number" step="0.01" value={metrics.shuttle} onChange={e => setMetrics({...metrics, shuttle: e.target.value})} /></div>
                    <div className="md:col-span-1"><InputLabel>Catching %</InputLabel><FormInput type="number" value={metrics.catchingPct} onChange={e => setMetrics({...metrics, catchingPct: e.target.value})} /></div>
                    <div className="md:col-span-1"><InputLabel>Throwing (1-10)</InputLabel><FormInput type="number" step="0.1" value={metrics.throwingScore} onChange={e => setMetrics({...metrics, throwingScore: e.target.value})} /></div>
                    <div className="md:col-span-1"><InputLabel>Flag Pull %</InputLabel><FormInput type="number" value={metrics.flagPullingPct} onChange={e => setMetrics({...metrics, flagPullingPct: e.target.value})} /></div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: '#1c7ed6' }}>
                    <Video size={14} /> 4. Tape & Video Highlight Link
                  </h3>
                  <FormInput type="url" placeholder="https://www.hudl.com/profile/... OR https://www.youtube.com/watch?v=..." value={metrics.hudlLink} onChange={e => setMetrics({...metrics, hudlLink: e.target.value})} />
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: '#d6336c' }}>
                    <Shield size={14} /> 5. Regular Season On-Field Stats
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div><InputLabel>Passing Yards</InputLabel><FormInput type="number" value={metrics.passingYards} onChange={e => setMetrics({...metrics, passingYards: e.target.value})} /></div>
                    <div><InputLabel>Flag Pulls</InputLabel><FormInput type="number" value={metrics.flagPulls} onChange={e => setMetrics({...metrics, flagPulls: e.target.value})} /></div>
                    <div><InputLabel>Interceptions</InputLabel><FormInput type="number" value={metrics.interceptions} onChange={e => setMetrics({...metrics, interceptions: e.target.value})} /></div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button type="submit" disabled={savingAthlete} className="flex-1 hover:scale-[1.02] transition-transform text-white font-bold py-4 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-md" style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}>
                    {savingAthlete ? <Loader2 className="animate-spin" /> : <Check size={20} />} Save Athlete to Cloud Database
                  </button>

                  {selectedExistingId && (
                    <button type="button" onClick={deleteAthlete} className="px-6 hover:scale-[1.02] transition-transform text-white font-bold py-4 rounded-xl uppercase tracking-wider shadow-md bg-rose-600 hover:bg-rose-700 flex items-center justify-center gap-2">
                      <X size={20} /> Delete
                    </button>
                  )}
                </div>
              </form>
           </div>
        )}
      </div>
    </div>
  );
};

// --- 4. MASTER APP CONTROLLER ---
export default function App() {
  const [view, setView] = useState('home'); // 'home', 'profile', 'admin', 'about'
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [players, setPlayers] = useState(INITIAL_SEED.players);
  const [news, setNews] = useState(INITIAL_SEED.news);
  const [dbStatus, setDbStatus] = useState("OFFLINE DEMO");

  // Admin Security States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('dna_admin_authenticated') === 'true';
  });

  useEffect(() => {
  if (!isFirebaseActive || !db) return;
  setDbStatus("CONNECTING...");
  
  // Direct connection for public reads
  onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'players'), (snapshot) => {
    const items = [];
    snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
    setPlayers(items); 
  });
  
  onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'news'), (snapshot) => {
    const newsItems = [];
    snapshot.forEach(doc => newsItems.push({ id: doc.id, ...doc.data() }));
    setNews(newsItems);
    setDbStatus("LIVE SYNC");
  });
}, []);

  const handleAdminClick = () => {
    if (isAdminLoggedIn) {
      setView('admin');
      window.scrollTo(0, 0);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    sessionStorage.setItem('dna_admin_authenticated', 'true');
    setIsLoginModalOpen(false);
    setView('admin');
    window.scrollTo(0, 0);
  };

 const handleLogout = async () => {
  if (auth) await signOut(auth);
  setIsAdminLoggedIn(false);
  sessionStorage.removeItem('dna_admin_authenticated');
  setView('home');
  window.scrollTo(0, 0);
};

  const handlePlayerSelect = async (p) => {
    setSelectedPlayer(p);
    setView('profile');
    window.scrollTo(0,0);

    if (isFirebaseActive && db && p.id && dbStatus === "LIVE SYNC") {
      try {
        const playerRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', p.id);
        await updateDoc(playerRef, { views: increment(1) });
      } catch (err) { }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-[#d6336c] selection:text-white flex flex-col justify-between">
      <div>
        <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
            <div className="cursor-pointer hover:scale-105 transition-transform" onClick={() => setView('home')}><DNALogo /></div>
            <div className="flex gap-4 items-center">
               
               
               <button 
                 onClick={() => { setView('about'); window.scrollTo(0,0); }} 
                 className="text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 px-4 py-2 rounded-full shadow-sm text-slate-600 hover:text-[#1c7ed6] hover:bg-slate-100 border border-slate-200" 
               >
                 <Info size={12}/> About
               </button>

               <button 
                 onClick={handleAdminClick} 
                 className="text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 px-4 py-2 rounded-full shadow-sm" 
                 style={{ 
                   color: isAdminLoggedIn ? '#059669' : '#d6336c', 
                   border: `1px solid ${isAdminLoggedIn ? 'rgba(5, 150, 105, 0.3)' : 'rgba(214, 51, 108, 0.3)'}`, 
                   backgroundColor: isAdminLoggedIn ? 'rgba(5, 150, 105, 0.1)' : 'rgba(214, 51, 108, 0.05)' 
                 }}
               >
                 <Lock size={12}/> {isAdminLoggedIn ? 'Admin Active' : 'Admin Login'}
               </button>
            </div>
          </div>
        </div>

        <main className="min-h-[calc(100vh-260px)]">
          {view === 'home' && <PublicHub players={players} news={news} onSelect={handlePlayerSelect} />}
          {view === 'profile' && <ProfilePage player={selectedPlayer} onBack={() => setView('home')} />}
          {view === 'about' && <AboutPage onBack={() => setView('home')} />}
          {view === 'admin' && isAdminLoggedIn && (
            <AdminPanel players={players} dbConfigured={isFirebaseActive} onBack={() => setView('home')} onLogout={handleLogout} />
          )}
        </main>
      </div>

      <SanctionedFooter />

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLoginSuccess={handleLoginSuccess} 
      />
    </div>
  );
}