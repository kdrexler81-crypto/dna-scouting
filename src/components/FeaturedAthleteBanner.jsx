// src/components/FeaturedAthleteBanner.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Trophy, GraduationCap, MapPin, Shield, ArrowRight } from 'lucide-react';

export const FeaturedAthleteBanner = ({ players = [] }) => {
  const navigate = useNavigate();

  // Pick the most recently updated athlete marked as featured
  const featured = [...players]
    .filter((p) => p.featured === true)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];

  if (!featured) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-4 animate-in fade-in">
      {/* Section Header */}
      <div className="mb-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#38bdf8] flex items-center gap-1.5">
          <Sparkles size={13} /> Player of the Week
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-1.5">
          Featured Athlete Spotlight
        </h2>
      </div>

      {/* Spotlight Card */}
      <div className="rounded-xl bg-[#131316] border border-white/10 p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
        {/* Athlete Photo */}
        <div className="relative shrink-0">
          <img
            src={
              featured.avatar ||
              featured.photo ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${featured.name}`
            }
            alt={featured.name}
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-2 border-white/15 bg-[#0A0A0C]"
          />
          <div
            className="absolute -bottom-1 -right-1 bg-emerald-500 text-[#0A0A0C] p-1.5 rounded-full border-4 border-[#131316]"
            title="Verified DNA Prospect"
          >
            <Shield size={13} />
          </div>
        </div>

        {/* Center Details */}
        <div className="flex-1 text-center md:text-left min-w-0">
          <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3 truncate">
            {featured.name}
          </h3>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-zinc-300 text-xs font-medium mb-3">
            <span className="flex items-center gap-1.5 bg-[#1C1C21] px-3 py-1.5 rounded-lg border border-white/10">
              <Trophy size={13} className="text-[#38bdf8]" />
              {featured.primaryPos || 'ATH'}
              {featured.secondaryPos ? ` / ${featured.secondaryPos}` : ''}
            </span>
            <span className="flex items-center gap-1.5 bg-[#1C1C21] px-3 py-1.5 rounded-lg border border-white/10 font-metric">
              <GraduationCap size={13} className="text-zinc-400" />
              Class of {featured.gradYear || 'N/A'}
            </span>
            <span className="flex items-center gap-1.5 bg-[#1C1C21] px-3 py-1.5 rounded-lg border border-white/10">
              <MapPin size={13} className="text-emerald-400" />
              {featured.state || 'NJ'}
            </span>
          </div>

          {(featured.featuredBlurb || featured.scoutNotes) && (
            <p className="text-sm text-zinc-400 line-clamp-2 max-w-2xl leading-relaxed">
              {featured.featuredBlurb || featured.scoutNotes}
            </p>
          )}
        </div>

        {/* Right Side: DNA Score + CTA */}
        <div className="flex flex-row md:flex-col items-center gap-4 shrink-0">
          <div className="bg-[#0A0A0C] border border-white/10 px-6 py-3.5 rounded-xl text-center min-w-[130px]">
            <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.18em]">
              DNA Score
            </span>
            <span className="text-3xl sm:text-4xl font-bold text-[#38bdf8] font-metric">
              {featured.dnaScore || '0.0'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/player/${featured.id}`)}
            className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-[#0A0A0C] bg-white hover:bg-zinc-200 flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            View Profile <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};