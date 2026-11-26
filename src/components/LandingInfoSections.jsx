// src/components/LandingInfoSections.jsx
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, MapPin, ArrowRight, ShieldCheck, Video, FileCheck,
  Sparkles, Compass, Trophy, Users, Camera, ExternalLink
} from 'lucide-react';

const displayFont = { fontFamily: "'Barlow Condensed', sans-serif" };

// --- INSTAGRAM SETTINGS (Edit these anytime) ---
const INSTAGRAM_HANDLE = '@dna_girlsflagfootball';
const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/dna_girlsflagfootball/';
const INSTAGRAM_EMBED_URL = 'https://www.instagram.com/dna_girlsflagfootball/embed';

export const LandingInfoSections = ({ colleges = [] }) => {
  const navigate = useNavigate();

  // Pull the 6 most recently added college programs
  const newestColleges = useMemo(() => {
    return [...colleges]
      .sort((a, b) => (b.createdAt || b.updatedAt || 0) - (a.createdAt || a.updatedAt || 0))
      .slice(0, 6);
  }, [colleges]);

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-24 py-16">
      {/* 1. RECENTLY ADDED COLLEGE PROGRAMS */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#1c7ed6] flex items-center gap-1.5">
              <GraduationCap size={14} /> National Program Directory
            </span>
            <h2
              className="text-4xl sm:text-5xl font-extrabold uppercase tracking-tight text-slate-900 mt-1"
              style={displayFont}
            >
              Recently Added College Programs
            </h2>
          </div>

          <button
            type="button"
            onClick={() => navigate('/colleges')}
            className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-white bg-slate-900 hover:bg-[#1c7ed6] px-5 py-3 rounded-xl transition-colors shadow-sm self-start sm:self-auto"
          >
            Browse All {colleges.length || '300+'} Schools <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {newestColleges.map((school, idx) => (
            <div
              key={school.id || `${school.name}-${idx}`}
              onClick={() => navigate('/colleges')}
              className="cursor-pointer bg-white border border-slate-200 hover:border-[#1c7ed6] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider">
                    {school.division || 'Varsity'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <MapPin size={11} className="text-[#d6336c]" /> {school.state || 'US'}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                  {school.name}
                </h3>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 truncate">
                Head Coach: <span className="text-slate-800 font-bold">{school.coach || 'TBA'}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. VERIFIED DATA. ZERO GUESSWORK. */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ background: 'linear-gradient(90deg, #1c7ed6 0%, #d6336c 100%)' }}
        />

        <div className="max-w-2xl mb-10">
          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
            <Sparkles size={14} /> The DNA Standard
          </span>
          <h2
            className="text-4xl sm:text-5xl font-extrabold uppercase tracking-tight mt-2"
            style={displayFont}
          >
            Verified Data. Zero Guesswork.
          </h2>
          <p className="text-base text-slate-300 mt-3 leading-relaxed">
            Recruiting shouldn't rely on self-reported times or scattered social links. DNA Flag Ratings gives college staffs one trusted hub with clinic-verified testing, game film, and academic credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#1c7ed6]/20 text-[#1c7ed6] flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-lg font-extrabold uppercase tracking-tight" style={displayFont}>
              Clinic-Verified Testing
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every 40-yard dash, shuttle, and skill score is recorded live by DNA coaches and locked to the athlete's profile—giving scouts numbers they can trust.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#d6336c]/20 text-[#d6336c] flex items-center justify-center">
              <Video size={20} />
            </div>
            <h3 className="text-lg font-extrabold uppercase tracking-tight" style={displayFont}>
              All Your Film in One Spot
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Watch Hudl and YouTube highlights right on the page, alongside direct links to MaxPreps, NCSA, and social reels—no jumping between five apps.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileCheck size={20} />
            </div>
            <h3 className="text-lg font-extrabold uppercase tracking-tight" style={displayFont}>
              Ready for College Coaches
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Multi-year season stats, GPA, test scores, and family contact info organized cleanly for fast evaluation by NCAA, NAIA, and NJCAA programs.
            </p>
          </div>
        </div>
      </section>

      {/* 3. YOUR ROADMAP TO COLLEGE FLAG FOOTBALL */}
      <section className="space-y-8">
        <div className="max-w-2xl">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#d6336c] flex items-center gap-1.5">
            <Compass size={14} /> Why Girls' Flag Football?
          </span>
          <h2
            className="text-4xl sm:text-5xl font-extrabold uppercase tracking-tight text-slate-900 mt-1"
            style={displayFont}
          >
            Your Roadmap to College Flag Football
          </h2>
          <p className="ext-base text-slate-600 mt-2 leading-relaxed">
            With hundreds of college varsity programs launching nationwide and flag football debuting at the 2028 Olympics, there has never been a better time for female athletes to compete and earn roster spots.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              step: '01',
              icon: Users,
              title: 'Hit The Field',
              desc: 'Start with a youth league, high school varsity squad, or travel club to master route running, footwork, and flag-pulling angles.'
            },
            {
              step: '02',
              icon: Trophy,
              title: 'Get Verified',
              desc: 'Attend a DNA Clinic to record official laser-timed speed, agility shuttles, and position drills that establish your national DNA Score.'
            },
            {
              step: '03',
              icon: Video,
              title: 'Own Your Profile',
              desc: 'Claim your DNA Flag Ratings page, embed your best Hudl or YouTube highlights, and keep your GPA and season stats current.'
            },
            {
              step: '04',
              icon: GraduationCap,
              title: 'Target & Connect',
              desc: 'Explore our live College Directory, save your Target Schools, complete recruiting questionnaires, and email coaches directly.'
            }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-slate-200" style={displayFont}>
                      {item.step}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#1c7ed6] flex items-center justify-center">
                      <Icon size={18} />
                    </div>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight" style={displayFont}>
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. LIVE FROM THE TURF (INSTAGRAM) */}
      <section className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#d6336c] flex items-center gap-1.5">
              <Camera size={14} /> Live From The Turf
            </span>
            <h2
              className="text-4xl sm:text-5xl font-extrabold uppercase tracking-tight text-slate-900 mt-1"
              style={displayFont}
            >
              Follow DNA Flag Football
            </h2>
            <p className="text-xs font-bold text-slate-500 mt-1">{INSTAGRAM_HANDLE}</p>
          </div>

          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white shadow-md hover:opacity-95 transition-opacity self-start sm:self-auto"
            style={{ background: 'linear-gradient(135deg, #f59f00 0%, #d6336c 50%, #7950f2 100%)' }}
          >
            <Camera size={15} /> Follow {INSTAGRAM_HANDLE} <ExternalLink size={13} />
          </a>
        </div>

        {INSTAGRAM_EMBED_URL ? (
          <div className="w-full overflow-hidden rounded-2xl bg-white border border-slate-200">
            <iframe
              src={INSTAGRAM_EMBED_URL}
              title="DNA Flag Instagram Feed"
              className="w-full h-[460px] border-0"
              scrolling="no"
              allowTransparency="true"
            />
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3">
            <p className="text-sm font-bold text-slate-700">
              Live Instagram Feed Ready to Connect
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Create a free grid widget on <strong>SnapWidget</strong> or <strong>Behold</strong>, copy the embed URL, and paste it into <code className="bg-slate-100 px-1.5 py-0.5 rounded">INSTAGRAM_EMBED_URL</code> at the top of this file.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};