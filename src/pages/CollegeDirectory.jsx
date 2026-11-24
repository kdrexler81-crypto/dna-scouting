// src/pages/CollegeDirectory.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, GraduationCap, Lock, Mail, User,
  ExternalLink, Building2, Filter, ArrowLeft, Eye, EyeOff
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import COLLEGES_DB from '../data/colleges.json';

const displayFont = { fontFamily: "'Outfit', sans-serif" };

const DIVISIONS = [
  { value: 'All', label: 'All Divisions' },
  { value: 'NCAA DI', label: 'NCAA Division I' },
  { value: 'NCAA DII', label: 'NCAA Division II' },
  { value: 'NCAA DIII', label: 'NCAA Division III' },
  { value: 'NAIA', label: 'NAIA' },
  { value: 'NJCAA', label: 'NJCAA (JuCo)' },
  { value: '3C2A', label: '3C2A (Cali JuCo)' },
  { value: 'USCAA', label: 'USCAA' },
];

export const CollegeDirectory = ({ onBack }) => {
  const navigate = useNavigate();
  const { authRole } = useApp();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [forceBlurPreview, setForceBlurPreview] = useState(false);

  // Same auth gate as ProfilePage.jsx
  const hasValidRole = ['admin', 'recruiter', 'scout', 'parent', 'athlete'].includes(authRole);
  const isLocked = !hasValidRole || forceBlurPreview;

  // Unique sorted states from colleges.json
  const availableStates = useMemo(() => {
    const states = new Set(
      COLLEGES_DB.map((c) => (c.state || '').trim().toUpperCase()).filter(Boolean)
    );
    return ['All', ...Array.from(states).sort()];
  }, []);

  // Filtered & sorted list
  const filteredColleges = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return COLLEGES_DB.filter((c) => {
      const matchesSearch =
        !term ||
        (c.name || '').toLowerCase().includes(term) ||
        (c.state || '').toLowerCase().includes(term) ||
        (c.division || '').toLowerCase().includes(term);

      const matchesDiv =
        selectedDivision === 'All' || (c.division || '').includes(selectedDivision);

      const matchesState =
        selectedState === 'All' ||
        (c.state || '').trim().toUpperCase() === selectedState;

      return matchesSearch && matchesDiv && matchesState;
    }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [searchTerm, selectedDivision, selectedState]);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 animate-in fade-in">
      {/* HEADER */}
      <div className="bg-slate-900 text-white pt-8 pb-16 border-b-4 border-[#1c7ed6]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <button
              onClick={() => (onBack ? onBack() : navigate('/'))}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
            >
              <ArrowLeft size={16} /> Back to Hub
            </button>

            {hasValidRole && (
              <button
                onClick={() => setForceBlurPreview(!forceBlurPreview)}
                className={`text-[10px] font-bold uppercase tracking-widest px-3.5 py-2 rounded-full border flex items-center gap-2 transition-all ${
                  forceBlurPreview
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg'
                    : 'bg-white/10 text-slate-300 border-white/15 hover:bg-white/20'
                }`}
              >
                {forceBlurPreview ? (
                  <>
                    <Eye size={14} /> Exit Guest Preview
                  </>
                ) : (
                  <>
                    <EyeOff size={14} /> Preview Public Blur
                  </>
                )}
              </button>
            )}
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-3">
              <GraduationCap size={13} /> Open Recruiting Directory
            </div>
            <h1
              className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight mb-3"
              style={displayFont}
            >
              College Women's Flag Football Database
            </h1>
            <p className="text-sm text-slate-300 font-medium leading-relaxed">
              Browse all {COLLEGES_DB.length} active and emerging collegiate women's flag football
              programs across NCAA, NAIA, and JuCo divisions. Direct coaching staff contact info is
              unlocked for verified DNA Families and Athletes.
            </p>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-3xl p-5 shadow-md border border-slate-200/80 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Search */}
            <div className="md:col-span-5 relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search school or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#1c7ed6]"
              />
            </div>

            {/* Division Filter */}
            <div className="md:col-span-4 flex items-center gap-2">
              <Filter size={16} className="text-slate-400 shrink-0 hidden sm:block" />
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#1c7ed6]"
              >
                {DIVISIONS.map((div) => (
                  <option key={div.value} value={div.value}>
                    {div.label}
                  </option>
                ))}
              </select>
            </div>

            {/* State Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#1c7ed6]"
              >
                {availableStates.map((st) => (
                  <option key={st} value={st}>
                    {st === 'All' ? 'All States' : st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-slate-500">
            <span>
              Showing {filteredColleges.length} of {COLLEGES_DB.length} Programs
            </span>
            {isLocked && (
              <span className="flex items-center gap-1.5 text-[#d6336c]">
                <Lock size={13} /> Sign in via Portal Login to unlock Coach Names & Emails
              </span>
            )}
          </div>
        </div>

        {/* COLLEGE CARDS GRID */}
        {filteredColleges.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
            <h3
              className="text-lg font-extrabold uppercase text-slate-900 mb-1"
              style={displayFont}
            >
              No Programs Match Your Filters
            </h3>
            <p className="text-xs font-medium text-slate-500">
              Try clearing your search or switching to All Divisions / All States.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredColleges.map((school, idx) => (
              <div
                key={school.id || idx}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                {/* PUBLIC TOP SECTION */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                      {school.division || 'College'}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <MapPin size={13} className="text-[#1c7ed6]" />
                      {school.state || 'USA'}
                    </span>
                  </div>

                  <h2
                    className="text-xl font-extrabold text-slate-900 leading-tight mb-4"
                    style={displayFont}
                  >
                    {school.name}
                  </h2>
                </div>

                {/* GATED COACH CONTACT SECTION */}
                <div className="relative rounded-2xl bg-slate-50 border border-slate-200/80 p-4 mb-4 overflow-hidden">
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                    Recruiting Staff Contact
                  </span>

                  <div
                    style={
                      isLocked
                        ? { filter: 'blur(6px)', WebkitFilter: 'blur(6px)' }
                        : {}
                    }
                    className={`space-y-2 text-xs font-bold text-slate-700 ${
                      isLocked ? 'select-none pointer-events-none opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <User size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">
                        {isLocked
                          ? 'Coach Alex Morgan'
                          : school.coach || 'Contact Athletics'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Mail size={13} className="text-[#1c7ed6] shrink-0" />
                      {isLocked ? (
                        <span>coach@university.edu</span>
                      ) : school.email ? (
                        <a
                          href={`mailto:${school.email}`}
                          className="text-[#1c7ed6] hover:underline truncate"
                        >
                          {school.email}
                        </a>
                      ) : (
                        <span className="text-slate-400">Lookup Staff Directory</span>
                      )}
                    </div>
                  </div>

                  {/* Lock Overlay for Guests */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-slate-900/15 backdrop-blur-[2px] flex flex-col items-center justify-center p-3 text-center">
                      <div className="bg-white/95 px-3.5 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2">
                        <Lock size={13} className="text-[#d6336c]" />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-900">
                          Login to Unlock Contact
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ACTION BUTTON */}
                {isLocked ? (
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <Lock size={13} /> Portal Login to Contact Coach
                  </button>
                ) : school.email ? (
                  <a
                    href={`mailto:${school.email}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-[#1c7ed6] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <Mail size={13} /> Email Coaching Staff
                  </a>
                ) : (
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(
                      `${school.name} women's flag football coach email staff directory`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    Lookup Staff Directory <ExternalLink size={13} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};