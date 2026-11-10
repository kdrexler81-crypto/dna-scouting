// src/pages/AboutPage.jsx
import React from 'react';
import { 
  Shield, Trophy, Building, Mail, Lock, Zap, CheckCircle2, ChevronRight, 
  Database, Search, Send, CheckCheck, Sliders, Users, Eye, FileText, 
  ExternalLink, GraduationCap, Compass, ListChecks, TrendingUp, BarChart3, 
  Star, Sparkles, Edit3, Columns, Key, CheckSquare, Square
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const displayFont = { fontFamily: "'Outfit', sans-serif" };

export const AboutPage = () => {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      
      {/* 1. HERO SECTION */}
      <div className="bg-slate-900 text-white pt-16 pb-24 relative overflow-hidden border-b-4 border-[#1c7ed6]">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#1c7ed6] via-[#8b5cf6] to-[#d6336c]"></div>
        <div className="absolute -right-40 -top-40 w-[500px] h-[500px] bg-[#1c7ed6] rounded-full blur-[140px] opacity-20 pointer-events-none"></div>
        <div className="absolute -left-40 -bottom-40 w-[500px] h-[500px] bg-[#d6336c] rounded-full blur-[140px] opacity-20 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 mb-8 backdrop-blur-md">
            <Shield size={15} className="text-emerald-400" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-200">USA Football & NFL FLAG Partner Ecosystem</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-tight mb-6 leading-[1.05] max-w-5xl mx-auto" style={displayFont}>
            The Recruiting Operating System For <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1c7ed6] via-violet-400 to-[#d6336c]">Girls Flag Football</span>
          </h1>
          <p className="text-slate-300 text-base sm:text-lg md:text-xl font-medium mb-10 max-w-3xl mx-auto leading-relaxed">
            Built to empower families, protect minor athletes, and give college coaching staffs laser-verified clinic data. Explore our dedicated suites for <strong>Athletes & Parents</strong> and <strong>Verified .EDU College Scouts</strong>.
          </p>

          {/* AUDIENCE JUMP PILLS */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <button 
              onClick={() => scrollToSection('family-suite')} 
              className="px-7 py-4 bg-gradient-to-r from-violet-600 to-emerald-600 text-white rounded-full font-bold uppercase tracking-wider text-xs sm:text-sm hover:opacity-95 transition-all shadow-xl flex items-center gap-2.5 border border-white/20"
            >
              <Trophy size={17} /> Athlete & Parent Features <ChevronRight size={16} />
            </button>
            <button 
              onClick={() => scrollToSection('scout-suite')} 
              className="px-7 py-4 bg-[#1c7ed6] hover:bg-blue-600 text-white rounded-full font-bold uppercase tracking-wider text-xs sm:text-sm transition-all shadow-xl flex items-center gap-2.5 border border-white/20"
            >
              <Building size={17} /> College Scout & Recruiter Features <ChevronRight size={16} />
            </button>
          </div>

          {/* PLATFORM STATS STRIP */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 border-t border-white/10">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-white" style={displayFont}>320+</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">NCAA, NAIA & JuCo Programs</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-[#1c7ed6]" style={displayFont}>10.0</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Laser-Verified DNA Scale</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400" style={displayFont}>100%</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Parent-Moderated Safety</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-[#d6336c]" style={displayFont}>.EDU</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Verified College Coaches</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PART 1: ATHLETE & PARENT-FORWARD SUITE                                */}
      {/* ===================================================================== */}
      <div id="family-suite" className="max-w-7xl mx-auto px-4 pt-20 pb-16">
        
        {/* PROMINENT CATEGORY HEADER BANNER */}
        <div className="bg-gradient-to-r from-slate-900 via-violet-950 to-slate-900 rounded-3xl p-8 md:p-10 text-white shadow-xl border border-violet-500/30 mb-16 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-[10px] font-black uppercase tracking-widest mb-3">
                <Trophy size={13} /> Part 1 • Athlete & Parent-Forward Features
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight" style={displayFont}>
                Built For Families. <span className="text-emerald-400">Protected By Parents.</span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base font-medium mt-2 max-w-2xl leading-relaxed">
                Everything a high school prospect needs to get discovered, track real-time college interest, and proactively contact 320+ coaching staffs—wrapped inside a parent-approved compliance wall.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
              <span className="px-4 py-2 rounded-xl bg-violet-500/20 border border-violet-400/30 text-violet-200 text-[10px] font-black uppercase tracking-widest text-center">
                Athlete Locker Room Portal
              </span>
              <span className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-widest text-center">
                Parent Compliance Gateway
              </span>
            </div>
          </div>
        </div>

        {/* FEATURE BLOCK 1A: PROFILE ANALYTICS & 14-DAY SCOUT RADAR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-24">
          <div className="lg:col-span-5 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp size={12} /> Athlete-Forward Feature
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Eye size={12} /> Parent Visibility
              </span>
            </div>
            <h3 className="text-3xl font-extrabold uppercase tracking-tight text-slate-900 leading-tight" style={displayFont}>
              Real-Time Scout View Analytics & 14-Day Activity Radar
            </h3>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Never wonder if college coaches are looking at your profile. Every time a verified <strong>.edu university coach</strong> clicks on your profile, our system logs their name, university, and timestamp inside your Locker Room.
            </p>
            <div className="space-y-3 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
                <div className="p-2 rounded-xl bg-violet-50 text-violet-600 mt-0.5"><BarChart3 size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase" style={displayFont}>14-Day Verified Coach Momentum Chart</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Track daily traffic spikes after DNA Verification Clinics or outbound email campaigns.</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
                <div className="p-2 rounded-xl bg-violet-50 text-violet-600 mt-0.5"><Mail size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase" style={displayFont}>One-Click "Pitch Coach Back"</h4>
                  <p className="text-xs text-slate-500 mt-0.5">See a coach viewed your profile? Click one button right next to their view log to launch an introductory email back to their staff.</p>
                </div>
              </div>
            </div>
          </div>

          {/* VISUAL GRAPHIC: 14-DAY ANALYTICS & WHO VIEWED */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 text-white">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <BarChart3 size={18} className="text-violet-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Athlete Locker Room • Profile Analytics Tab</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  Live .EDU Tracking
                </span>
              </div>

              {/* Mini KPI Row */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-800/90 border border-slate-700 p-3.5 rounded-2xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Total Profile Hits</span>
                  <span className="text-2xl font-black text-white" style={displayFont}>148</span>
                </div>
                <div className="bg-slate-800/90 border border-slate-700 p-3.5 rounded-2xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Verified .EDU Views</span>
                  <span className="text-2xl font-black text-[#1c7ed6]" style={displayFont}>19</span>
                </div>
                <div className="bg-slate-800/90 border border-slate-700 p-3.5 rounded-2xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Unique Colleges</span>
                  <span className="text-2xl font-black text-[#d6336c]" style={displayFont}>11</span>
                </div>
              </div>

              {/* Mock 14-Day Bar Chart */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">14-Day Verified Coach Activity</span>
                  <span className="text-[10px] font-bold text-emerald-400">+6 Views This Week</span>
                </div>
                <div className="grid grid-cols-14 gap-1.5 items-end h-20 pt-2">
                  {[15, 30, 15, 45, 70, 35, 15, 60, 85, 40, 20, 90, 65, 100].map((h, i) => (
                    <div key={i} style={{ height: `${h}%` }} className={`rounded-t-md ${h > 30 ? 'bg-gradient-to-t from-[#1c7ed6] to-[#d6336c]' : 'bg-slate-800'}`}></div>
                  ))}
                </div>
              </div>

              {/* Mock Scout View Log */}
              <div className="space-y-2.5">
                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400"><GraduationCap size={18} /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold uppercase text-white" style={displayFont}>Fairleigh Dickinson University</span>
                        <span className="text-[8px] font-black uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">Verified .EDU</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Viewed by Coach Steve Arnold • Today, 2:14 PM</span>
                    </div>
                  </div>
                  <span className="bg-violet-600 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl shrink-0 flex items-center gap-1">
                    <Mail size={11} /> Pitch Coach Back
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURE BLOCK 1B: ALGORITHMIC COLLEGE MATCH & WEBMAIL OUTBOUND ENGINE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-24">
          
          {/* VISUAL GRAPHIC: COLLEGE MATCH + WEBMAIL LAUNCHER */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 text-white">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Compass size={18} className="text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Smart College Match + Browser Webmail Launcher</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2.5 py-1 rounded-full">
                  320+ Programs
                </span>
              </div>

              {/* Match Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Star size={10} className="fill-emerald-300" /> 98% Match
                    </span>
                    <span className="text-[9px] font-black text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full uppercase">NCAA DI</span>
                  </div>
                  <h4 className="font-extrabold text-white uppercase text-sm" style={displayFont}>Long Island University</h4>
                  <p className="text-[10px] font-bold text-violet-300 mt-0.5">Northeast Region + DNA Score & GPA Fit</p>
                  <p className="text-[10px] text-slate-400 mt-2">Head Coach: Jimmy Barbarise • NY</p>
                </div>

                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Star size={10} className="fill-emerald-300" /> 95% Match
                    </span>
                    <span className="text-[9px] font-black text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full uppercase">NAIA Varsity</span>
                  </div>
                  <h4 className="font-extrabold text-white uppercase text-sm" style={displayFont}>Keiser University</h4>
                  <p className="text-[10px] font-bold text-violet-300 mt-0.5">Coach Viewed Your Profile + Athletic Fit</p>
                  <p className="text-[10px] text-slate-400 mt-2">Head Coach: Justin Hilliker • FL</p>
                </div>
              </div>

              {/* Webmail Launcher Mockup */}
              <div className="bg-white text-slate-900 rounded-2xl p-5 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-violet-600">Instant Browser Webmail Launcher (No Default Mail App Needed)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 font-bold py-2 px-2.5 rounded-xl text-[10px] uppercase text-center">Gmail Web</div>
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 font-bold py-2 px-2.5 rounded-xl text-[10px] uppercase text-center">Outlook Web</div>
                  <div className="bg-purple-50 border border-purple-200 text-purple-700 font-bold py-2 px-2.5 rounded-xl text-[10px] uppercase text-center">Yahoo Web</div>
                  <div className="bg-slate-100 border border-slate-200 text-slate-700 font-bold py-2 px-2.5 rounded-xl text-[10px] uppercase text-center">One-Click Copy</div>
                </div>
                <p className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium leading-relaxed">
                  <strong>Auto-Filled Pitch:</strong> "Coach Barbarise, My name is Jordan Taylor ('27 QB/WR, NJ). Verified DNA Score: <strong>9.4/10.0</strong> • 40-Yd Dash: <strong>4.78s</strong> • Shuttle: <strong>4.41s</strong> • GPA: <strong>3.92</strong>..."
                </p>
              </div>
            </div>
          </div>

          {/* TEXT COLUMN */}
          <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Compass size={12} /> Athlete-Forward Feature
              </span>
            </div>
            <h3 className="text-3xl font-extrabold uppercase tracking-tight text-slate-900 leading-tight" style={displayFont}>
              Algorithmic "College Match" & Browser Webmail Engine
            </h3>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Our <strong>Smart Match Engine</strong> cross-references your daughter's verified DNA Score, cumulative GPA, and home region against 320+ NCAA DI, DII, DIII, NAIA, and JuCo programs to recommend her highest-probability recruiting targets.
            </p>
            <div className="space-y-3 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
                <div className="p-2 rounded-xl bg-violet-50 text-violet-600 mt-0.5"><Sparkles size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase" style={displayFont}>Regional & Division Fit Scoring</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Filter your top college matches by National Fit, Home Region (e.g., Northeast), or In-State programs.</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
                <div className="p-2 rounded-xl bg-violet-50 text-violet-600 mt-0.5"><Send size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase" style={displayFont}>Direct Gmail, Outlook & Yahoo Browser Compose</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Works on school Chromebooks, laptops, and phones—launches a pre-written recruiting pitch directly inside your browser email tab.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* FEATURE BLOCK 1C: RECRUITING ROADMAP CHECKLIST & PROFILE CUSTOMIZER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-24">
          <div className="lg:col-span-5 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <ListChecks size={12} /> Athlete & Parent Feature
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-100 text-[#1c7ed6] text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Edit3 size={12} /> Self-Service Customizer
              </span>
            </div>
            <h3 className="text-3xl font-extrabold uppercase tracking-tight text-slate-900 leading-tight" style={displayFont}>
              Interactive 10-Step Recruiting Roadmap & Profile Customizer
            </h3>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Families never have to guess what step comes next. Our built-in <strong>Recruiting Roadmap</strong> tracks your progress from 8th/9th grade clinic verification all the way to official college campus visits.
            </p>
            <div className="space-y-3 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 mt-0.5"><CheckSquare size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase" style={displayFont}>Auto-Verified + Manual Milestones</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Automatically checks off milestones when you complete a DNA Clinic, add your GPA, or upload Hudl film, and syncs your progress bar with your parents.</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-[#1c7ed6] mt-0.5"><Edit3 size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase" style={displayFont}>Family Profile Customizer (With Verified Metric Lock)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Parents and athletes can upload a custom profile photo, update GPA/SAT, link Hudl tape, and post 3 custom in-season stats—while laser-timed DNA Clinic metrics stay strictly locked.</p>
                </div>
              </div>
            </div>
          </div>

          {/* VISUAL GRAPHIC: ROADMAP CHECKLIST & CUSTOMIZER */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 text-white">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Recruiting Roadmap & Self-Service Customizer</span>
                  <h4 className="text-lg font-extrabold uppercase mt-0.5" style={displayFont}>70% Recruiting Milestones Complete</h4>
                </div>
                <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#1c7ed6] to-[#d6336c] text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 size={12} /> Customize My Profile
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-5">
                <div className="w-[70%] h-full bg-gradient-to-r from-[#1c7ed6] via-violet-500 to-emerald-400 rounded-full"></div>
              </div>

              {/* Checklist Rows */}
              <div className="space-y-2.5">
                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckSquare size={20} className="text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-xs font-extrabold uppercase line-through text-slate-400 block" style={displayFont}>Complete Official DNA Verification Clinic</span>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase">Auto-Verified by DNA • Score: 9.4</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckSquare size={20} className="text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-xs font-extrabold uppercase line-through text-slate-400 block" style={displayFont}>Upload Highlight Tape & In-Season Stats</span>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase">Auto-Verified • Hudl Linked + 18 TDs Posted</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white text-slate-900 rounded-2xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Square size={20} className="text-violet-600 shrink-0" />
                    <div>
                      <span className="text-xs font-extrabold uppercase text-slate-900 block" style={displayFont}>Send Introductory Emails to Top 5 College Matches</span>
                      <span className="text-[10px] text-slate-500 font-semibold">Phase 3: Proactive College Outreach</span>
                    </div>
                  </div>
                  <span className="bg-slate-900 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shrink-0">Go to Matches</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURE BLOCK 1D: PARENT COMPLIANCE GATEWAY & PUBLIC PRIVACY BLUR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* VISUAL GRAPHIC: PARENT COMPLIANCE GATEWAY */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Parent Compliance Gateway • Two-Way Moderation</span>
                </div>
                <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-widest">6-Digit Access Code</span>
              </div>

              {/* Mock Pending Message */}
              <div className="bg-white rounded-2xl p-5 mb-4 border-l-4 border-l-amber-400">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">Queue 1: Inbound From College Scout</span>
                  <span className="text-[10px] font-bold text-slate-400">Parent Action Required</span>
                </div>
                <p className="text-xs font-extrabold text-slate-900 uppercase mb-2">Coach Steve Arnold • <span className="text-[#1c7ed6]">Fairleigh Dickinson University (NCAA DI)</span></p>
                <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                  "We were blown away by your clinic numbers and film. We would love to invite you and your family to our upcoming campus recruiting day."
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-500 text-white font-bold py-2.5 rounded-xl uppercase tracking-wider text-[10px] flex justify-center items-center gap-1.5">
                    <CheckCircle2 size={14} /> Approve & Forward to Athlete
                  </div>
                  <div className="bg-rose-100 text-rose-700 font-bold py-2.5 rounded-xl uppercase tracking-wider text-[10px] flex justify-center items-center">
                    Reject & Block
                  </div>
                </div>
              </div>

              {/* Mock Outbound Draft */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 block mb-0.5">Queue 2: Outbound Athlete Reply Draft</span>
                  <p className="text-xs text-white font-medium">"Thank you Coach! My parents and I would love to visit campus..."</p>
                </div>
                <span className="bg-[#1c7ed6] text-white text-[10px] font-bold px-3.5 py-2 rounded-xl uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                  <Send size={12} /> Approve & Send
                </span>
              </div>
            </div>
          </div>

          {/* TEXT COLUMN */}
          <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Shield size={12} /> Parent-Forward Safety Suite
              </span>
            </div>
            <h3 className="text-3xl font-extrabold uppercase tracking-tight text-slate-900 leading-tight" style={displayFont}>
              Two-Way Parent Moderation & Public Privacy Blur
            </h3>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Recruiting with minor athletes demands uncompromising protection. No college coach can message your daughter directly without your explicit approval, and anonymous web visitors cannot view sensitive academic or clinic details.
            </p>
            <div className="space-y-3 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 mt-0.5"><Lock size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase" style={displayFont}>Public Guest Blur Gate</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Unauthenticated visitors can see an athlete's name, position, state, and overall DNA Score on the leaderboard, but full clinic times, GPA, and film are blurred out until a verified account logs in.</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 mt-0.5"><Key size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase" style={displayFont}>6-Digit Access Code Identity Verification</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Profiles can only be claimed using a private 6-digit security code issued directly to the family.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ===================================================================== */}
      {/* PART 2: COLLEGE SCOUT & RECRUITER-FORWARD SUITE                       */}
      {/* ===================================================================== */}
      <div id="scout-suite" className="bg-white border-t border-slate-200 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4">
          
          {/* PROMINENT SCOUT HEADER BANNER */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-8 md:p-10 text-white shadow-xl border border-blue-500/30 mb-16">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-black uppercase tracking-widest mb-3">
                  <Building size={13} /> Part 2 • College Scout & Recruiter-Forward Features
                </div>
                <h2 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight" style={displayFont}>
                  Verified Metrics. <span className="text-[#1c7ed6]">Zero Guesswork.</span>
                </h2>
                <p className="text-slate-300 text-sm sm:text-base font-medium mt-2 max-w-2xl leading-relaxed">
                  Exclusively accessible to college coaches with a verified <strong>.edu university email</strong>. Filter the national database by laser-timed clinic data, compare prospects side-by-side, and manage your recruiting board.
                </p>
              </div>
              <div className="shrink-0">
                <span className="px-5 py-3 rounded-2xl bg-[#1c7ed6] text-white text-xs font-black uppercase tracking-widest block text-center shadow-lg">
                  Verified .EDU Portal Only
                </span>
              </div>
            </div>
          </div>

          {/* SCOUT FEATURE 2A: ADVANCED COMBINE FILTERING & HEAD-TO-HEAD COMPARE MATRIX */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-24">
            <div className="lg:col-span-5 space-y-5">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-[#1c7ed6] text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
                <Sliders size={12} /> Scout & Recruiter-Forward Feature
              </span>
              <h3 className="text-3xl font-extrabold uppercase tracking-tight text-slate-900 leading-tight" style={displayFont}>
                Multi-Metric Filtering & 4-Player Compare Matrix
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Stop sifting through unverified social media clips. Every DNA Score is backed by standardized, laser-timed clinic testing equally weighting straight-line speed and change-of-direction agility.
              </p>
              <div className="space-y-3 pt-2">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 text-[#1c7ed6] mt-0.5"><Search size={18} /></div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase" style={displayFont}>Precision Threshold Sliders</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Filter the entire database by minimum DNA Score, maximum 40-Yard Dash, 5-10-5 Pro Shuttle, L-Drill, Top MPH, GPA, Grad Year, and State.</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 text-[#1c7ed6] mt-0.5"><Zap size={18} /></div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase" style={displayFont}>Side-By-Side Head-to-Head Matrix</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Select up to 4 prospects simultaneously to compare speed verifications, catching/throwing/flag-pull percentages, and measurables with automatic winner highlights.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* VISUAL GRAPHIC: COMPARE MATRIX */}
            <div className="lg:col-span-7">
              <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <Database size={18} className="text-[#1c7ed6]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Scout Portal • Head-To-Head Compare Matrix</span>
                  </div>
                  <span className="text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full uppercase tracking-widest">Up to 4 Athletes</span>
                </div>

                {/* Mock Compare Table */}
                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-3 bg-slate-950/60 p-3.5 border-b border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <div>Verified Clinic Metric</div>
                    <div className="text-center text-white">Prospect A ('27 QB)</div>
                    <div className="text-center text-white">Prospect B ('27 WR)</div>
                  </div>
                  <div className="divide-y divide-slate-700/70 text-xs">
                    <div className="grid grid-cols-3 p-3.5 items-center">
                      <span className="font-bold text-slate-400 uppercase text-[10px]">Verified DNA Score</span>
                      <span className="text-center font-black text-emerald-400 text-sm" style={displayFont}>9.4 ★</span>
                      <span className="text-center font-black text-white text-sm" style={displayFont}>9.1</span>
                    </div>
                    <div className="grid grid-cols-3 p-3.5 items-center">
                      <span className="font-bold text-slate-400 uppercase text-[10px]">40-Yard Sprint (Laser)</span>
                      <span className="text-center font-bold text-white">4.82s</span>
                      <span className="text-center font-black text-emerald-400">4.69s ★</span>
                    </div>
                    <div className="grid grid-cols-3 p-3.5 items-center">
                      <span className="font-bold text-slate-400 uppercase text-[10px]">5-10-5 Pro Shuttle</span>
                      <span className="text-center font-black text-emerald-400">4.38s ★</span>
                      <span className="text-center font-bold text-white">4.51s</span>
                    </div>
                    <div className="grid grid-cols-3 p-3.5 items-center">
                      <span className="font-bold text-slate-400 uppercase text-[10px]">Catching / Throwing %</span>
                      <span className="text-center font-black text-emerald-400">94% Throw ★</span>
                      <span className="text-center font-black text-emerald-400">96% Catch ★</span>
                    </div>
                    <div className="grid grid-cols-3 p-3.5 items-center">
                      <span className="font-bold text-slate-400 uppercase text-[10px]">Cumulative GPA</span>
                      <span className="text-center font-black text-emerald-400">3.92 ★</span>
                      <span className="text-center font-bold text-white">3.75</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SCOUT FEATURE 2B: KANBAN RECRUITING BOARD & READ-RECEIPT CRM */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* VISUAL GRAPHIC: KANBAN BOARD & READ RECEIPTS */}
            <div className="lg:col-span-7 order-2 lg:order-1">
              <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 text-white">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <Columns size={18} className="text-[#1c7ed6]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Scout Kanban Recruiting Board & CRM Read Receipts</span>
                  </div>
                </div>

                {/* 3 Kanban Columns Mock */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-slate-800/90 border border-emerald-500/30 rounded-2xl p-3">
                    <div className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-2 flex justify-between">
                      <span>Priority Targets</span>
                      <span>4</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 mb-2">
                      <p className="text-[11px] font-extrabold text-white truncate">Jordan Taylor ('27)</p>
                      <p className="text-[9px] font-bold text-[#d6336c]">QB • DNA: 9.4</p>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-700">
                      <p className="text-[11px] font-extrabold text-white truncate">Maya Lin ('26)</p>
                      <p className="text-[9px] font-bold text-[#d6336c]">WR/DB • DNA: 9.1</p>
                    </div>
                  </div>

                  <div className="bg-slate-800/90 border border-blue-500/30 rounded-2xl p-3">
                    <div className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-2 flex justify-between">
                      <span>Interested /Eval</span>
                      <span>7</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-700">
                      <p className="text-[11px] font-extrabold text-white truncate">Alexis Vance ('28)</p>
                      <p className="text-[9px] font-bold text-[#d6336c]">RUSHER • DNA: 8.8</p>
                    </div>
                  </div>

                  <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-3">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 flex justify-between">
                      <span>Watchlist / Pass</span>
                      <span>2</span>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <p className="text-[11px] font-bold text-slate-400 truncate">Class of 2029</p>
                      <p className="text-[9px] text-slate-500">Follow up next fall</p>
                    </div>
                  </div>
                </div>

                {/* Read Receipt Chat Bubble Mock */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block mb-0.5">Direct Compliance Inbox • Live Status</span>
                    <p className="text-xs text-slate-200">"Parent approved message • Viewed by Athlete at 4:18 PM"</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 text-blue-300 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase shrink-0">
                    <CheckCheck size={14} /> Read Receipt
                  </div>
                </div>
              </div>
            </div>

            {/* TEXT COLUMN */}
            <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-[#1c7ed6] text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
                <Building size={12} /> Scout & Recruiter-Forward Feature
              </span>
              <h3 className="text-3xl font-extrabold uppercase tracking-tight text-slate-900 leading-tight" style={displayFont}>
                Kanban Recruiting Boards & Verified Read Receipts
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Built like a modern front-office CRM. College coaches can organize national prospects into custom recruiting tiers and message families with full compliance audit trails.
              </p>
              <div className="space-y-3 pt-2">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 text-[#1c7ed6] mt-0.5"><Columns size={18} /></div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase" style={displayFont}>Priority, Interested & Watchlist Boards</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Save prospects directly to your university's private cloud board so your entire coaching staff stays aligned.</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 text-[#1c7ed6] mt-0.5"><CheckCheck size={18} /></div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase" style={displayFont}>Double-Checkmark Read Receipts</h4>
                    <p className="text-xs text-slate-500 mt-0.5">See real-time status indicators showing when a parent approves your message and the exact minute the athlete reads it.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* 4. BOTTOM CALL TO ACTION */}
      <div className="bg-slate-900 text-white py-16 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight mb-4" style={displayFont}>
            Ready To Experience The Platform?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-medium mb-8 max-w-xl mx-auto">
            Browse the national leaderboard or use the <strong>Portal Login</strong> button in the top navigation bar to access your Athlete, Parent, or Verified College Scout account.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => navigate('/')} className="px-8 py-4 bg-gradient-to-r from-[#1c7ed6] to-[#d6336c] text-white rounded-full font-bold uppercase tracking-wider text-xs sm:text-sm hover:opacity-95 transition-all shadow-xl flex items-center gap-2">
              View National Leaderboard <ChevronRight size={18} />
            </button>
            <button onClick={() => navigate('/roster')} className="px-8 py-4 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-full font-bold uppercase tracking-wider text-xs sm:text-sm transition-all">
              Browse Official Roster
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};