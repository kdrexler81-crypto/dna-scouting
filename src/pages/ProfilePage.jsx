// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, MapPin, GraduationCap, Trophy, Activity, Lock, ExternalLink, PlayCircle, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';

const displayFont = { fontFamily: "'Outfit', sans-serif" };

export const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { db, appId, isFirebaseActive, authRole } = useApp();
  
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlayer = async () => {
      if (!isFirebaseActive || !db) return;
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setPlayer({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Athlete profile not found.");
        }
      } catch (err) {
        setError("Error loading profile: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [id, db, appId, isFirebaseActive]);

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
          <button onClick={() => navigate(-1)} className="bg-slate-900 text-white font-bold py-3 px-6 rounded-xl uppercase tracking-wider text-xs w-full">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check if user is unauthenticated
  const isLocked = !authRole;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 animate-in fade-in">
      
      {/* 1. PUBLIC HEADER (Always Visible) */}
      <div className="bg-slate-900 text-white pt-10 pb-20 relative border-b-4 border-[#1c7ed6]">
        <div className="max-w-5xl mx-auto px-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-8">
            <ArrowLeft size={16} /> Back to Directory
          </button>

          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            
            {/* Athlete Avatar */}
            <div className="relative shrink-0">
              <img 
                src={player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} 
                alt={player.name} 
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-slate-800 object-cover bg-slate-800 shadow-xl"
              />
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full border-4 border-slate-900" title="Verified DNA Profile">
                <Shield size={16} />
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tight mb-2" style={displayFont}>
                {player.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-6 text-slate-300 font-bold uppercase tracking-widest text-[11px] sm:text-xs">
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[#1c7ed6]" /> {player.state}</span>
                <span className="flex items-center gap-1.5"><GraduationCap size={14} className="text-[#1c7ed6]" /> Class of {player.gradYear}</span>
                <span className="flex items-center gap-1.5"><Trophy size={14} className="text-[#1c7ed6]" /> {player.primaryPos} {player.secondaryPos ? `/ ${player.secondaryPos}` : ''}</span>
              </div>
            </div>

            {/* Public DNA Score Badge */}
            <div className="bg-slate-800/80 border border-slate-700 p-4 md:p-5 rounded-3xl shrink-0 mt-6 md:mt-0 backdrop-blur-sm min-w-[140px] text-center shadow-lg">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DNA Score</span>
              <span className="text-4xl md:text-5xl font-black text-[#d6336c]" style={displayFont}>{player.dnaScore || '0.0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PROTECTED METRICS SECTION */}
      <div className="max-w-5xl mx-auto px-4 -mt-10 relative z-10">
        
        {/* PAYWALL OVERLAY */}
        {isLocked && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/30 backdrop-blur-md rounded-3xl border border-white/50 mx-4 mt-12 shadow-2xl h-[400px]">
            <div className="bg-white p-8 rounded-3xl text-center shadow-xl max-w-sm border border-slate-100">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={32} />
              </div>
              <h3 className="text-xl font-extrabold uppercase tracking-tight text-slate-900 mb-2" style={displayFont}>Metrics Locked</h3>
              <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed">
                Log in to your <strong>Scout, Parent, or Athlete</strong> account to view verified combine data, academics, and highlight films.
              </p>
              <button onClick={() => window.scrollTo(0, 0)} className="w-full bg-[#1c7ed6] hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl uppercase tracking-wider text-xs transition-colors shadow-md">
                Log In Now
              </button>
            </div>
          </div>
        )}

        {/* BLUR CONTAINER */}
        <div className={`space-y-6 ${isLocked ? 'blur-md select-none pointer-events-none opacity-50' : ''}`}>
          
          {/* COMBINE STATS GRID */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Zap className="text-[#d6336c]" size={18} /> Verified Combine Metrics
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="40-Yd Dash" value={player.metrics?.sprint ? `${player.metrics.sprint}s` : 'N/A'} />
              <MetricCard label="5-10-5 Shuttle" value={player.metrics?.shuttle ? `${player.metrics.shuttle}s` : 'N/A'} />
              <MetricCard label="Vertical Jump" value={player.metrics?.vertical ? `${player.metrics.vertical}"` : 'N/A'} />
              <MetricCard label="Broad Jump" value={player.metrics?.broad ? `${player.metrics.broad}"` : 'N/A'} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ACADEMICS & HIGH SCHOOL */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                <BookOpen className="text-violet-500" size={18} /> Academics & School
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">GPA</span>
                  <span className="text-lg font-black text-slate-900">{player.gpa || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-slate-50">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">High School</span>
                  <span className="text-sm font-bold text-slate-900">{player.highSchool || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* HIGHLIGHT FILM */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                <PlayCircle className="text-rose-500" size={18} /> Game Film
              </h3>
              
              {player.hudlLink ? (
                <a href={player.hudlLink} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                      <PlayCircle size={20} className="ml-0.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">Watch Highlight Reel</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">External Link (Hudl/YouTube)</p>
                    </div>
                  </div>
                  <ExternalLink size={16} className="text-slate-400 group-hover:text-rose-500 transition-colors" />
                </a>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Film Provided</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for stat cards
function MetricCard({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</span>
      <span className="text-xl md:text-2xl font-black text-slate-900" style={displayFont}>{value}</span>
    </div>
  );
}