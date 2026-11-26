// src/components/LandingInfoSections.jsx
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, MapPin, ArrowRight, ShieldCheck, Video, FileCheck,
  Sparkles, Compass, Trophy, Users, Camera, ExternalLink
} from 'lucide-react';
import { CollegeLogo } from './CollegeLogo';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-24 py-16">
      {/* 1. RECENTLY ADDED COLLEGE PROGRAMS */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#38bdf8] flex items-center gap-1.5">
              <GraduationCap size={14} /> National Program Directory
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-1.5">
              Recently Added College Programs
            </h2>
          </div>

          <button
            type="button"
            onClick={() => navigate('/colleges')}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0A0A0C] bg-white hover:bg-zinc-200 px-5 py-3 rounded-xl transition-colors self-start sm:self-auto"
          >
            Browse All <span className="font-metric">{colleges.length || '300+'}</span> Schools <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {newestColleges.map((school, idx) => (
            <div
              key={school.id || `${school.name}-${idx}`}
              onClick={() => navigate('/colleges')}
              className="cursor-pointer bg-[#131316] border border-white/10 hover:border-white/25 hover:bg-[#1C1C21] rounded-xl p-5 transition-all flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-zinc-200 text-[10px] font-semibold uppercase tracking-wider">
                    {school.division || 'Varsity'}
                  </span>
                  <span className="text-xs font-medium text-zinc-400 flex items-center gap-1 font-metric">
                    <MapPin size={11} className="text-[#38bdf8]" /> {school.state || 'US'}
                  </span>
                </div>
                <div className="flex items-center gap-3.5">
                  <CollegeLogo school={school} size="md" />
                  <h3 className="text-base font-bold text-white leading-snug">
                    {school.name}
                  </h3>
                </div>
              </div>
              <p className="text-xs text-zinc-400 truncate border-t border-white/5 pt-3">
                Head Coach: <span className="text-zinc-200 font-medium">{school.coach || 'TBA'}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. VERIFIED DATA. ZERO GUESSWORK. */}
      <section className="bg-[#131316] border border-white/10 rounded-xl p-8 sm:p-12">
        <div className="max-w-2xl mb-10">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-1.5">
            <Sparkles size={14} /> The DNA Standard
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-2">
            Verified Data. Zero Guesswork.
          </h2>
          <p className="text-base text-zinc-400 mt-3 leading-relaxed">
            Recruiting shouldn't rely on self-reported times or scattered social links. DNA Flag Ratings gives college staffs one trusted hub with clinic-verified testing, game film, and academic credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0A0A0C] border border-white/10 rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#131316] border border-white/10 text-[#38bdf8] flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-white">
              Clinic-Verified Testing
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Every 40-yard dash, shuttle, and skill score is recorded live by DNA coaches and locked to the athlete's profile—giving scouts numbers they can trust.
            </p>
          </div>

          <div className="bg-[#0A0A0C] border border-white/10 rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#131316] border border-white/10 text-[#38bdf8] flex items-center justify-center">
              <Video size={20} />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-white">
              All Your Film in One Spot
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Watch Hudl and YouTube highlights right on the page, alongside direct links to MaxPreps, NCSA, and social reels—no jumping between five apps.
            </p>
          </div>

          <div className="bg-[#0A0A0C] border border-white/10 rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#131316] border border-white/10 text-emerald-400 flex items-center justify-center">
              <FileCheck size={20} />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-white">
              Ready for College Coaches
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Multi-year season stats, GPA, test scores, and family contact info organized cleanly for fast evaluation by NCAA, NAIA, and NJCAA programs.
            </p>
          </div>
        </div>
      </section>

      {/* 3. YOUR ROADMAP TO COLLEGE FLAG FOOTBALL */}
      <section className="space-y-8">
        <div className="max-w-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#38bdf8] flex items-center gap-1.5">
            <Compass size={14} /> Why Girls' Flag Football?
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-1.5">
            Your Roadmap to College Flag Football
          </h2>
          <p className="text-base text-zinc-400 mt-2 leading-relaxed">
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
                className="bg-[#131316] border border-white/10 rounded-xl p-6 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-zinc-600 font-metric">
                      {item.step}
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-[#0A0A0C] border border-white/10 text-[#38bdf8] flex items-center justify-center">
                      <Icon size={17} />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. LIVE FROM THE TURF (INSTAGRAM) */}
      <section className="bg-[#131316] border border-white/10 rounded-xl p-6 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#38bdf8] flex items-center gap-1.5">
              <Camera size={14} /> Live From The Turf
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-1.5">
              Follow DNA Flag Football
            </h2>
            <p className="text-xs font-medium text-zinc-400 mt-1 font-metric">{INSTAGRAM_HANDLE}</p>
          </div>

          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-[#0A0A0C] bg-white hover:bg-zinc-200 transition-colors self-start sm:self-auto"
          >
            <Camera size={15} /> Follow {INSTAGRAM_HANDLE} <ExternalLink size={13} />
          </a>
        </div>

        {INSTAGRAM_EMBED_URL ? (
          <div className="w-full overflow-hidden rounded-xl bg-[#0A0A0C] border border-white/10">
            <iframe
              src={INSTAGRAM_EMBED_URL}
              title="DNA Flag Instagram Feed"
              className="w-full h-[460px] border-0"
              scrolling="no"
              allowTransparency="true"
            />
          </div>
        ) : (
          <div className="bg-[#0A0A0C] border border-dashed border-white/15 rounded-xl p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-zinc-200">
              Live Instagram Feed Ready to Connect
            </p>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Create a free grid widget on <strong>SnapWidget</strong> or <strong>Behold</strong>, copy the embed URL, and paste it into <code className="bg-white/10 px-1.5 py-0.5 rounded">INSTAGRAM_EMBED_URL</code> at the top of this file.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};