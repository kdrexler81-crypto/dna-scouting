// src/components/FeaturedAthleteBanner.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Trophy, GraduationCap, MapPin, Shield, ArrowRight } from 'lucide-react';

const displayFont = { fontFamily: "'Barlow Condensed', sans-serif" };

export const FeaturedAthleteBanner = ({ players = [] }) => {
  const navigate = useNavigate();

  // Pick the most recently updated athlete marked as featured
  const featured = [...players]
    .filter((p) => p.featured === true)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];

  if (!featured) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 mb-8 animate-in fade-in">
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl">
        {/* Accent Top Bar */}
        <div
          className="h-1.5 w-full"
          style={{ background: 'linear-gradient(90deg, #1c7ed6 0%, #d6336c 100%)' }}
        />

        <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
          {/* Athlete Photo */}
          <div className="relative shrink-0">
            <img
              src={
                featured.avatar ||
                featured.photo ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${featured.name}`
              }
              alt={featured.name}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-[#1c7ed6] bg-slate-800 shadow-xl"
            />
            <div
              className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full border-4 border-slate-900"
              title="Verified DNA Prospect"
            >
              <Shield size={14} />
            </div>
          </div>

          {/* Center Details */}
          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-widest mb-2.5">
              <Sparkles size={12} /> Featured Athlete Spotlight
            </div>
            <h2
              className="text-4xl sm:text-5xl font-extrabold uppercase tracking-tight text-slate-900 mb-4"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Featured Athlete <span className="text-[#d6336c]">Spotlight</span>
            </h2>

            <h2
              className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white mb-2 truncate"
              style={displayFont}
            >
              {featured.name}
            </h2>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-slate-300 text-[11px] font-bold uppercase tracking-widest mb-3">
              <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                <Trophy size={12} className="text-[#d6336c]" />
                {featured.primaryPos || 'ATH'}
                {featured.secondaryPos ? ` / ${featured.secondaryPos}` : ''}
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                <GraduationCap size={12} className="text-[#1c7ed6]" />
                Class of {featured.gradYear || 'N/A'}
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                <MapPin size={12} className="text-emerald-400" />
                {featured.state || 'NJ'}
              </span>
            </div>

            {(featured.featuredBlurb || featured.scoutNotes) && (
              <p className="text-xs sm:text-sm text-slate-300 font-medium line-clamp-2 max-w-2xl">
                {featured.featuredBlurb || featured.scoutNotes}
              </p>
            )}
          </div>

          {/* Right Side: DNA Score + Button */}
          <div className="flex flex-row md:flex-col items-center gap-4 shrink-0">
            <div className="bg-slate-800/90 border border-slate-700 px-5 py-3 rounded-2xl text-center min-w-[120px]">
              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
                DNA Score
              </span>
              <span
                className="text-3xl sm:text-4xl font-black text-[#d6336c]"
                style={displayFont}
              >
                {featured.dnaScore || '0.0'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/player/${featured.id}`)}
              className="px-5 py-3 rounded-xl font-bold uppercase tracking-wider text-xs text-white flex items-center gap-2 transition-all hover:opacity-95 shadow-lg whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}
            >
              View Profile <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};