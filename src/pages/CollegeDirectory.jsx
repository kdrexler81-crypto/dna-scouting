// src/pages/CollegeDirectory.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import {
  Search, MapPin, GraduationCap, Lock, Mail, Phone, User,
  ExternalLink, Shield, Building2, Filter, ArrowLeft, Eye, EyeOff, Plus, Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const displayFont = { fontFamily: "'Outfit', sans-serif" };

// Starter programs so the directory works immediately (Admins can seed these to Firestore in 1 click)
const STARTER_COLLEGES = [
  {
    name: 'Kean University',
    state: 'NJ',
    city: 'Union',
    division: 'NCAA D3',
    conference: 'Atlantic East',
    status: 'Active',
    coachName: 'Head Coach',
    coachEmail: 'flagfootball@kean.edu',
    coachPhone: '(908) 737-0600',
    questionnaireUrl: 'https://keanathletics.com',
  },
  {
    name: 'Centenary University',
    state: 'NJ',
    city: 'Hackettstown',
    division: 'NCAA D3',
    conference: 'Atlantic East',
    status: 'Active',
    coachName: 'Head Coach',
    coachEmail: 'athletics@centenaryuniversity.edu',
    coachPhone: '(908) 852-1400',
    questionnaireUrl: 'https://centenarycyclones.com',
  },
  {
    name: 'Fairleigh Dickinson University',
    state: 'NJ',
    city: 'Teaneck',
    division: 'NCAA D1',
    conference: 'NEC',
    status: 'Active',
    coachName: 'Head Coach',
    coachEmail: 'fduathletics@fdu.edu',
    coachPhone: '(201) 692-2208',
    questionnaireUrl: 'https://fduknights.com',
  },
  {
    name: 'Mercyhurst University',
    state: 'PA',
    city: 'Erie',
    division: 'NCAA D1',
    conference: 'NEC',
    status: 'Active',
    coachName: 'Head Coach',
    coachEmail: 'athletics@mercyhurst.edu',
    coachPhone: '(814) 824-2228',
    questionnaireUrl: 'https://hurstathletics.com',
  },
  {
    name: 'Mount St. Mary\'s University',
    state: 'MD',
    city: 'Emmitsburg',
    division: 'NCAA D1',
    conference: 'MAAC',
    status: 'Active',
    coachName: 'Head Coach',
    coachEmail: 'athletics@msmary.edu',
    coachPhone: '(301) 447-5296',
    questionnaireUrl: 'https://mountathletics.com',
  },
  {
    name: 'Keiser University',
    state: 'FL',
    city: 'West Palm Beach',
    division: 'NAIA',
    conference: 'Sun Conference',
    status: 'Active',
    coachName: 'Head Coach',
    coachEmail: 'athletics@keiseruniversity.edu',
    coachPhone: '(561) 478-5500',
    questionnaireUrl: 'https://kuseahawks.com',
  },
  {
    name: 'Ottawa University',
    state: 'KS',
    city: 'Ottawa',
    division: 'NAIA',
    conference: 'KCAC',
    status: 'Active',
    coachName: 'Head Coach',
    coachEmail: 'athletics@ottawa.edu',
    coachPhone: '(785) 242-5200',
    questionnaireUrl: 'https://ottawabraves.com',
  },
  {
    name: 'Alabama State University',
    state: 'AL',
    city: 'Montgomery',
    division: 'NCAA D1',
    conference: 'SWAC',
    status: 'Active',
    coachName: 'Head Coach',
    coachEmail: 'athletics@alasu.edu',
    coachPhone: '(334) 229-4507',
    questionnaireUrl: 'https://bamastatesports.com',
  },
];

const DIVISIONS = ['All', 'NCAA D1', 'NCAA D2', 'NCAA D3', 'NAIA', 'NJCAA', 'Club'];

export const CollegeDirectory = ({ onBack }) => {
  const navigate = useNavigate();
  const { db, appId, isFirebaseActive, authRole } = useApp();

  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [forceBlurPreview, setForceBlurPreview] = useState(false);

  // Same auth gate as ProfilePage.jsx
  const hasValidRole = ['admin', 'recruiter', 'scout', 'parent', 'athlete'].includes(authRole);
  const isLocked = !hasValidRole || forceBlurPreview;

  // Live sync colleges from Firestore
  useEffect(() => {
    if (!isFirebaseActive || !db || !appId) {
      setColleges(STARTER_COLLEGES);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'colleges'),
      (snap) => {
        if (snap.empty) {
          setColleges(STARTER_COLLEGES);
        } else {
          setColleges(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error loading colleges:', err);
        setColleges(STARTER_COLLEGES);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [db, appId, isFirebaseActive]);

  // One-click Admin seed into Firestore
  const handleSeedColleges = async () => {
    if (!db || !appId) return;
    if (!window.confirm('Seed starter college programs into Firestore?')) return;
    setSeeding(true);
    try {
      const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'colleges');
      for (const school of STARTER_COLLEGES) {
        await addDoc(colRef, { ...school, createdAt: Date.now() });
      }
      alert('Starter colleges added to Firestore!');
    } catch (err) {
      alert('Error seeding colleges: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  // Unique sorted states for dropdown
  const availableStates = useMemo(() => {
    const states = new Set(colleges.map((c) => (c.state || '').toUpperCase()).filter(Boolean));
    return ['All', ...Array.from(states).sort()];
  }, [colleges]);

  // Filtered list
  const filteredColleges = useMemo(() => {
    return colleges
      .filter((c) => {
        const matchesSearch =
          !searchTerm ||
          (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.conference || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDiv = selectedDivision === 'All' || c.division === selectedDivision;
        const matchesState = selectedState === 'All' || (c.state || '').toUpperCase() === selectedState;
        return matchesSearch && matchesDiv && matchesState;
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [colleges, searchTerm, selectedDivision, selectedState]);

  const isUsingStarterData = colleges.length > 0 && !colleges[0].id;

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

            <div className="flex flex-wrap items-center gap-3">
              {authRole === 'admin' && isUsingStarterData && (
                <button
                  onClick={handleSeedColleges}
                  disabled={seeding}
                  className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1.5 transition-all shadow-lg"
                >
                  {seeding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Seed Starter Colleges to DB
                </button>
              )}

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
                    <><Eye size={14} /> Exit Guest Preview</>
                  ) : (
                    <><EyeOff size={14} /> Preview Public Blur</>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-3">
              <GraduationCap size={13} /> Open Recruiting Directory
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight mb-3" style={displayFont}>
              College Women's Flag Football Database
            </h1>
            <p className="text-sm text-slate-300 font-medium leading-relaxed">
              Browse active and emerging collegiate women's flag football programs across NCAA, NAIA, NJCAA, and Club divisions. Direct coaching staff contact info is unlocked for verified DNA Families and Athletes.
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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search school, city, or conference..."
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
                  <option key={div} value={div}>
                    {div === 'All' ? 'All Divisions' : div}
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

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-slate-500">
            <span>Showing {filteredColleges.length} of {colleges.length} Programs</span>
            {isLocked && (
              <span className="flex items-center gap-1.5 text-[#d6336c]">
                <Lock size={13} /> Sign in via Portal Login to unlock Coach Emails & Phone Numbers
              </span>
            )}
          </div>
        </div>

        {/* COLLEGE CARDS GRID */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={36} className="animate-spin text-[#1c7ed6]" />
          </div>
        ) : filteredColleges.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-extrabold uppercase text-slate-900 mb-1" style={displayFont}>
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
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wider">
                      {school.status || 'Active'}
                    </span>
                  </div>

                  <h2 className="text-xl font-extrabold text-slate-900 leading-tight mb-2" style={displayFont}>
                    {school.name}
                  </h2>

                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500 mb-5">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-[#1c7ed6]" />
                      {school.city ? `${school.city}, ` : ''}{school.state}
                    </span>
                    {school.conference && (
                      <span className="flex items-center gap-1">
                        <Shield size={13} className="text-[#d6336c]" />
                        {school.conference}
                      </span>
                    )}
                  </div>
                </div>

                {/* GATED COACH CONTACT SECTION */}
                <div className="relative rounded-2xl bg-slate-50 border border-slate-200/80 p-4 mb-4 overflow-hidden">
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                    Recruiting Staff Contact
                  </span>

                  <div
                    style={isLocked ? { filter: 'blur(6px)', WebkitFilter: 'blur(6px)' } : {}}
                    className={`space-y-2 text-xs font-bold text-slate-700 ${
                      isLocked ? 'select-none pointer-events-none opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <User size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{isLocked ? 'Coach Alex Morgan' : (school.coachName || 'Contact Athletics')}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Mail size={13} className="text-[#1c7ed6] shrink-0" />
                      {isLocked ? (
                        <span>coach@university.edu</span>
                      ) : school.coachEmail ? (
                        <a href={`mailto:${school.coachEmail}`} className="text-[#1c7ed6] hover:underline truncate">
                          {school.coachEmail}
                        </a>
                      ) : (
                        <span>N/A</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Phone size={13} className="text-emerald-600 shrink-0" />
                      <span>{isLocked ? '(555) 123-4567' : (school.coachPhone || 'N/A')}</span>
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

                {/* PUBLIC RECRUITING LINK */}
                {school.questionnaireUrl && (
                  <a
                    href={school.questionnaireUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-[#1c7ed6] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    Athletics / Recruiting Site <ExternalLink size={13} />
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