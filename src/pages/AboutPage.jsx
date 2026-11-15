// src/pages/AboutPage.jsx
import React from 'react';
import { 
  Shield, Trophy, Building, Mail, Lock, Zap, CheckCircle2, ChevronRight, 
  Database, Search, Send, CheckCheck, Sliders, Eye, EyeOff,
  GraduationCap, Compass, ListChecks, TrendingUp, BarChart3, 
  Star, Sparkles, Edit3, Columns, Key, CheckSquare, Square, Upload, HeartHandshake
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
      
      {/* ===================================================================== */}
      {/* 1. PARENT-FOCUSED HERO SECTION                                        */}
      {/* ===================================================================== */}
      <div className="bg-slate-900 text-white pt-16 pb-20 relative overflow-hidden border-b-4 border-[#1c7ed6]">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#1c7ed6] via-[#8b5cf6] to-[#d6336c]"></div>
        <div className="absolute -right-40 -top-40 w-[500px] h-[500px] bg-[#1c7ed6] rounded-full blur-[140px] opacity-20 pointer-events-none"></div>
        <div className="absolute -left-40 -bottom-40 w-[500px] h-[500px] bg-[#d6336c] rounded-full blur-[140px] opacity-20 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-400/30 mb-6 backdrop-blur-md">
            <Shield size={15} className="text-emerald-400" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">
              A Parent's Step-By-Step Guide to DNA Flag Ratings
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold uppercase tracking-tight mb-6 leading-[1.08] max-w-5xl mx-auto" style={displayFont}>
            How To Maximize Your Daughter's <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1c7ed6] via-violet-400 to-[#d6336c]">
              College Flag Football Opportunities
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg md:text-xl font-medium mb-10 max-w-3xl mx-auto leading-relaxed">
            Women's flag football is one of the fastest-growing varsity sports in college athletics, with <strong>320+ NCAA, NAIA, and JuCo programs</strong> actively recruiting. Here is how our platform takes your family from your first clinic to college scholarship conversations—while keeping you in complete control of her safety.
          </p>

          {/* INTERACTIVE 5-STEP PARENT JOURNEY BAR */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 max-w-5xl mx-auto mb-10 text-left">
            {[
              { step: 'Step 1', title: 'Claim & Protect Profile', target: 'step-1', color: 'border-emerald-500/40 hover:border-emerald-400' },
              { step: 'Step 2', title: 'Customize Her Resume', target: 'step-2', color: 'border-blue-500/40 hover:border-blue-400' },
              { step: 'Step 3', title: 'See Who Views Her', target: 'step-3', color: 'border-violet-500/40 hover:border-violet-400' },
              { step: 'Step 4', title: 'Match & Email Coaches', target: 'step-4', color: 'border-pink-500/40 hover:border-pink-400' },
              { step: 'Step 5', title: 'Parent-Safe Messaging', target: 'step-5', color: 'border-amber-500/40 hover:border-amber-400' }
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => scrollToSection(item.target)}
                className={`bg-slate-800/80 hover:bg-slate-800 border ${item.color} p-4 rounded-2xl transition-all group flex flex-col justify-between`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white flex items-center justify-between w-full mb-1">
                  {item.step} <ChevronRight size={13} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-tight" style={displayFont}>
                  {item.title}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button 
              onClick={() => scrollToSection('step-1')} 
              className="px-7 py-4 bg-gradient-to-r from-[#1c7ed6] to-[#d6336c] text-white rounded-full font-bold uppercase tracking-wider text-xs sm:text-sm hover:opacity-95 transition-all shadow-xl flex items-center gap-2"
            >
              Start The 5-Step Walkthrough <ChevronRight size={16} />
            </button>
            <button 
              onClick={() => scrollToSection('college-scouts')} 
              className="px-6 py-4 bg-white/10 hover:bg-white/15 text-slate-200 rounded-full font-bold uppercase tracking-wider text-xs sm:text-sm transition-all border border-white/15 flex items-center gap-2"
            >
              <Building size={16} className="text-[#1c7ed6]" /> Are You a College Coach? Jump to Scout Tools
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* THE 5-STEP PARENT & ATHLETE WALKTHROUGH                               */}
      {/* ===================================================================== */}
      <div className="max-w-7xl mx-auto px-4 py-20 space-y-28">

        {/* ------------------------------------------------------------------- */}
        {/* STEP 1: CLAIMING & PROTECTING HER PROFILE                           */}
        {/* ------------------------------------------------------------------- */}
        <div id="step-1" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center scroll-mt-24">
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-widest">
              <Key size={13} /> Step 1 • Claim & Protect Her Profile
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-slate-900 leading-tight" style={displayFont}>
              Unlock Her Profile With Your Private 6-Digit Family Code
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              After your daughter competes at a verified DNA Clinic, our staff emails you a permanent <strong>6-Digit Family Access Code</strong>. Clicking <strong>"Portal Login"</strong> at the top of the website lets both you (the Parent) and your daughter (the Athlete) create your linked accounts in under 60 seconds.
            </p>

            <div className="space-y-3 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 mt-0.5 shrink-0"><EyeOff size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase" style={displayFont}>Why Is Her Profile Blurred to the Public?</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    To protect minor athletes, random internet visitors can only see her name, position, grad year, state, and overall DNA Score. Her full clinic times, GPA, highlight video, and contact info are <strong>strictly blurred out</strong> unless a verified college coach or your family is logged in.
                  </p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-blue-50 text-[#1c7ed6] mt-0.5 shrink-0"><Shield size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase" style={displayFont}>Dual Accounts: One for Parent, One for Athlete</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Your parent login unlocks the <strong>Family Moderation Inbox</strong>, while her athlete login unlocks the <strong>Athlete Locker Room</strong>. Both accounts share the same 6-digit claim code.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* VISUAL MOCKUP FOR STEP 1 */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 text-white">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <Key size={14} /> Family Identity Verification & Privacy Gate
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest bg-white/10 text-slate-300 px-3 py-1 rounded-full">
                  Parent & Athlete Access
                </span>
              </div>

              {/* Code Box Mock */}
              <div className="bg-emerald-950/50 border border-emerald-500/30 rounded-2xl p-5 mb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">Issued By DNA Coaching Staff</span>
                  <h4 className="text-base font-extrabold uppercase text-white mt-0.5" style={displayFont}>Permanent 6-Digit Claim Code</h4>
                  <p className="text-xs text-slate-300 mt-0.5">Links your email directly to your daughter's official roster spot.</p>
                </div>
                <div className="bg-white text-emerald-700 font-black text-2xl tracking-widest px-5 py-2.5 rounded-xl border-2 border-emerald-400 shrink-0">
                  7K9X2M
                </div>
              </div>

              {/* Public vs Logged-In Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Lock size={11} /> Anonymous Web Visitor View
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white mb-2">Public Leaderboard Summary Only:</p>
                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex justify-between bg-slate-900/70 px-3 py-1.5 rounded-lg"><span>Name & Pos:</span> <strong className="text-white">Jane Doe (QB)</strong></div>
                    <div className="flex justify-between bg-slate-900/70 px-3 py-1.5 rounded-lg"><span>DNA Score:</span> <strong className="text-[#d6336c]">9.4 / 10.0</strong></div>
                    <div className="flex justify-between bg-slate-900/70 px-3 py-1.5 rounded-lg opacity-50 blur-[2px]"><span>40-Yd & GPA:</span> <strong>4.78s • 3.92 GPA</strong></div>
                  </div>
                </div>

                <div className="bg-slate-800/80 border border-emerald-500/40 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Eye size={11} /> Verified .EDU Coach & Family View
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white mb-2">Full Unblurred Scouting Report:</p>
                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex justify-between bg-slate-900/70 px-3 py-1.5 rounded-lg"><span>Laser 40 & Shuttle:</span> <strong className="text-emerald-400">4.78s • 4.41s</strong></div>
                    <div className="flex justify-between bg-slate-900/70 px-3 py-1.5 rounded-lg"><span>GPA & SAT:</span> <strong className="text-emerald-400">3.92 • 1340</strong></div>
                    <div className="flex justify-between bg-slate-900/70 px-3 py-1.5 rounded-lg"><span>Game Film & Stats:</span> <strong className="text-emerald-400">Unlocked ✓</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* STEP 2: CUSTOMIZING HER PROFILE PAGE                                */}
        {/* ------------------------------------------------------------------- */}
        <div id="step-2" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center scroll-mt-24">
          
          {/* VISUAL MOCKUP FOR STEP 2 */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 text-white">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Edit3 size={16} className="text-[#1c7ed6]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Self-Service Profile Customizer</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#1c7ed6] to-[#d6336c] text-white text-[9px] font-bold uppercase tracking-wider">
                  Customize My Profile Button
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Editable by Parent/Athlete */}
                <div className="bg-white text-slate-900 rounded-2xl p-5 border border-slate-200">
                  <span className="text-[9px] font-black uppercase tracking-widest bg-blue-100 text-[#1c7ed6] px-2.5 py-1 rounded-full inline-block mb-3">
                    Editable By Parent & Athlete Anytime
                  </span>
                  <h4 className="text-sm font-extrabold uppercase text-slate-900 mb-3" style={displayFont}>
                    What Your Family Controls:
                  </h4>
                  <ul className="space-y-2 text-xs font-semibold text-slate-600">
                    <li className="flex items-center gap-2"><Upload size={14} className="text-[#1c7ed6] shrink-0" /> Upload Headshot / Action Photo</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#1c7ed6] shrink-0" /> Primary & Secondary Positions</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#1c7ed6] shrink-0" /> Cumulative GPA & SAT/ACT Scores</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#1c7ed6] shrink-0" /> Hudl / YouTube Highlight Tape Link</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#1c7ed6] shrink-0" /> 3 Custom High School Season Stats</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#1c7ed6] shrink-0" /> Twitter / X Handle & External Club</li>
                  </ul>
                </div>

                {/* Locked & Verified by DNA */}
                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5">
                  <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full inline-block mb-3">
                    Certified & Locked By DNA Staff
                  </span>
                  <h4 className="text-sm font-extrabold uppercase text-white mb-3" style={displayFont}>
                    Why Coaches Trust Our Numbers:
                  </h4>
                  <ul className="space-y-2 text-xs font-medium text-slate-300">
                    <li className="flex items-center gap-2"><Shield size={14} className="text-emerald-400 shrink-0" /> Official Verified DNA Score (0–10.0)</li>
                    <li className="flex items-center gap-2"><Shield size={14} className="text-emerald-400 shrink-0" /> Laser-Timed 40-Yard Dash</li>
                    <li className="flex items-center gap-2"><Shield size={14} className="text-emerald-400 shrink-0" /> 5-10-5 Pro Agility Shuttle & L-Drill</li>
                    <li className="flex items-center gap-2"><Shield size={14} className="text-emerald-400 shrink-0" /> Radar Max Speed (MPH)</li>
                    <li className="flex items-center gap-2"><Shield size={14} className="text-emerald-400 shrink-0" /> Catching, Throwing & Flag Pull %</li>
                    <li className="flex items-center gap-2"><Shield size={14} className="text-emerald-400 shrink-0" /> Verified Height, Weight & Jump Metrics</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* TEXT EXPLANATION FOR STEP 2 */}
          <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-[#1c7ed6] text-[10px] font-black uppercase tracking-widest">
              <Edit3 size={13} /> Step 2 • Customize Her Profile Page
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-slate-900 leading-tight" style={displayFont}>
              Keep Her Highlight Film, GPA & Season Stats Fresh
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              As your daughter progresses through high school, her grades improve, she records new game film, and she racks up varsity touchdowns or flag pulls. You don't have to wait on an administrator to update her bio.
            </p>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Simply click <strong>"View & Customize Profile"</strong> inside your dashboard to upload a new profile picture from your phone, paste her latest Hudl or YouTube highlight link, and update her GPA.
            </p>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
              <h4 className="font-extrabold text-amber-900 text-xs uppercase flex items-center gap-1.5" style={displayFont}>
                <Trophy size={15} className="text-amber-600" /> The Best of Both Worlds
              </h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Because DNA strictly locks her laser-timed combine testing while letting your family update her film and academics, college coaches know her physical numbers are <strong>100% authentic and never inflated</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* STEP 3: VIEWING REAL-TIME SCOUT ANALYTICS                           */}
        {/* ------------------------------------------------------------------- */}
        <div id="step-3" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center scroll-mt-24">
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-black uppercase tracking-widest">
              <TrendingUp size={13} /> Step 3 • Track College Scout Analytics
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-slate-900 leading-tight" style={displayFont}>
              See Exactly Which College Coaches Are Looking At Her
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              In traditional recruiting, families send out emails and highlights into a black hole, wondering if anyone ever watched them. Our <strong>Profile Analytics</strong> tab eliminates the guesswork.
            </p>
            <div className="space-y-3 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 mt-0.5 shrink-0"><GraduationCap size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase" style={displayFont}>Live "Who Viewed Your Profile" Log</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Every time a logged-in college coach with a verified <strong>.edu university email</strong> opens your daughter's profile, we record the university name, the coach's name, and the exact time of the visit.
                  </p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 mt-0.5 shrink-0"><Mail size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase" style={displayFont}>Turn a Profile View Into a Conversation</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Right next to every coach view in her log is a <strong>"Pitch Coach Back"</strong> button. If a university checks out her numbers on Tuesday, she can click one button on Tuesday night to send that coach a personalized follow-up email.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* VISUAL MOCKUP FOR STEP 3 */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 text-white">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <BarChart3 size={18} className="text-violet-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Real-Time Recruiting Radar • 14-Day Scout Activity</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  Verified .EDU Coaches
                </span>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-slate-800/90 border border-slate-700 p-3.5 rounded-2xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Total Profile Hits</span>
                  <span className="text-2xl font-black text-white" style={displayFont}>148</span>
                </div>
                <div className="bg-slate-800/90 border border-slate-700 p-3.5 rounded-2xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Verified Coach Views</span>
                  <span className="text-2xl font-black text-[#1c7ed6]" style={displayFont}>19</span>
                </div>
                <div className="bg-slate-800/90 border border-slate-700 p-3.5 rounded-2xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Unique Colleges</span>
                  <span className="text-2xl font-black text-[#d6336c]" style={displayFont}>11</span>
                </div>
              </div>

              {/* 14-Day Bar Chart */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">14-Day Verified Coach Traffic</span>
                  <span className="text-[10px] font-bold text-emerald-400">Spike After Clinic & Outbound Emails</span>
                </div>
                <div className="grid grid-cols-14 gap-1.5 items-end h-16 pt-2">
                  {[15, 25, 15, 45, 75, 35, 15, 60, 85, 40, 25, 90, 65, 100].map((h, i) => (
                    <div key={i} style={{ height: `${h}%` }} className={`rounded-t-md ${h > 30 ? 'bg-gradient-to-t from-[#1c7ed6] to-[#d6336c]' : 'bg-slate-800'}`}></div>
                  ))}
                </div>
              </div>

              {/* Who Viewed List */}
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
                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400"><GraduationCap size={18} /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold uppercase text-white" style={displayFont}>Keiser University</span>
                        <span className="text-[8px] font-black uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">Verified .EDU</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Viewed by Coach Justin Hilliker • Yesterday</span>
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

        {/* ------------------------------------------------------------------- */}
        {/* STEP 4: PROACTIVELY REACHING OUT TO 320+ COLLEGES                   */}
        {/* ------------------------------------------------------------------- */}
        <div id="step-4" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center scroll-mt-24">
          
          {/* VISUAL MOCKUP FOR STEP 4 */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 text-white">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Compass size={18} className="text-pink-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Smart College Match + 1-Click Email Generator</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2.5 py-1 rounded-full">
                  320+ Colleges Built-In
                </span>
              </div>

              {/* Match Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Star size={10} className="fill-emerald-300" /> 98% Match Fit
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
                      <Star size={10} className="fill-emerald-300" /> 96% Match Fit
                    </span>
                    <span className="text-[9px] font-black text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full uppercase">NCAA DIII</span>
                  </div>
                  <h4 className="font-extrabold text-white uppercase text-sm" style={displayFont}>Centenary University</h4>
                  <p className="text-[10px] font-bold text-violet-300 mt-0.5">In-State NJ Program + Academic Fit</p>
                  <p className="text-[10px] text-slate-400 mt-2">New Jersey • Direct Email Ready</p>
                </div>
              </div>

              {/* Webmail Launcher Mockup */}
              <div className="bg-white text-slate-900 rounded-2xl p-5 border border-slate-200">
                <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 block mb-2.5">
                  Auto-Writes Her Recruiting Pitch & Opens In Her Email:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 font-bold py-2 px-2 rounded-xl text-[10px] uppercase text-center">Gmail Web</div>
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 font-bold py-2 px-2 rounded-xl text-[10px] uppercase text-center">Outlook Web</div>
                  <div className="bg-purple-50 border border-purple-200 text-purple-700 font-bold py-2 px-2 rounded-xl text-[10px] uppercase text-center">Yahoo Web</div>
                  <div className="bg-slate-100 border border-slate-200 text-slate-700 font-bold py-2 px-2 rounded-xl text-[10px] uppercase text-center">Copy Text</div>
                </div>
                <p className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium leading-relaxed">
                  <strong>Pre-Loaded Template:</strong> "Coach Barbarise, My name is Jane Doe ('27 QB, NJ). Here are my verified DNA Athletics metrics: <strong>DNA Score: 9.4/10.0</strong> • <strong>40-Yd Dash: 4.78s</strong> • <strong>GPA: 3.92</strong> • Highlight Film & Verified Profile Link included..."
                </p>
              </div>
            </div>
          </div>

          {/* TEXT EXPLANATION FOR STEP 4 */}
          <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-100 text-[#d6336c] text-[10px] font-black uppercase tracking-widest">
              <Compass size={13} /> Step 4 • Match & Reach Out to Coaches
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-slate-900 leading-tight" style={displayFont}>
              Find Her Best-Fit Schools & Email Coaches In One Click
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Most families don't know which colleges offer women's flag football or what to write in a first email to a head coach. We built a complete <strong>Outbound Recruiting Engine</strong> to do the heavy lifting for you:
            </p>
            <div className="space-y-3 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-pink-50 text-[#d6336c] mt-0.5 shrink-0"><Sparkles size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase" style={displayFont}>Algorithmic "College Match" Recommendations</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Automatically compares her DNA Score, GPA, and home state (In-State, Northeast, or National) against 320+ NCAA DI, DII, DIII, NAIA, and JuCo programs to show her top percentage matches.
                  </p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-blue-50 text-[#1c7ed6] mt-0.5 shrink-0"><Send size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase" style={displayFont}>Pre-Written Emails That Launch in Gmail, Outlook, or Yahoo</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Clicking <strong>"Auto-Generate Email"</strong> writes a professional recruiting letter addressed to that school's head coach—automatically inserting her verified DNA Score, 40-yard dash, shuttle, GPA, Hudl link, and profile URL.
                  </p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 mt-0.5 shrink-0"><ListChecks size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase" style={displayFont}>Interactive 10-Step Recruiting Roadmap Checklist</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    A built-in checklist guides your family step-by-step from NCAA/NAIA Eligibility registration to campus visits, automatically checking off milestones as she completes her profile.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* STEP 5: PARENT-MODERATED SAFE COMMUNICATION SYSTEM                  */}
        {/* ------------------------------------------------------------------- */}
        <div id="step-5" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center scroll-mt-24">
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-widest">
              <HeartHandshake size={13} /> Step 5 • 100% Parent-Moderated Messaging
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-slate-900 leading-tight" style={displayFont}>
              Zero Unsupervised DMs. Every Message Goes Through You First.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              When a college coach messages your daughter inside the DNA Flag Ratings platform, it <strong>never</strong> goes straight to her phone unmoderated. Instead, our <strong>Two-Way Parent Compliance Gateway</strong> puts you in the driver's seat:
            </p>
            <div className="space-y-3 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 mt-0.5 shrink-0"><CheckCircle2 size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase" style={displayFont}>1. Inbound Coach Messages Require Your Approval</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    When a college coach sends an invite or recruiting message, it lands in your <strong>Parent Family Inbox</strong> first. Once you click <em>"Approve & Forward to Athlete,"</em> it unlocks inside her Locker Room.
                  </p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-blue-50 text-[#1c7ed6] mt-0.5 shrink-0"><Send size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase" style={displayFont}>2. Outbound Athlete Replies Are Reviewed By You</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    When your daughter types a reply back to a college coach, it saves as a draft in your Parent Inbox so you can proofread it and click <em>"Approve & Send to College."</em>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* VISUAL MOCKUP FOR STEP 5 */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Parent Family Inbox • Two-Way Moderation Queue</span>
                </div>
                <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-widest">
                  SafeSport Aligned
                </span>
              </div>

              {/* Queue 1 Mock */}
              <div className="bg-white rounded-2xl p-5 mb-4 border-l-4 border-l-amber-400">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                    Queue 1: Inbound From College Coach
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Held For Parent Review</span>
                </div>
                <p className="text-xs font-extrabold text-slate-900 uppercase mb-2">
                  Coach Steve Arnold • <span className="text-[#1c7ed6]">Fairleigh Dickinson University (NCAA DI)</span>
                </p>
                <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                  "We were impressed by your verified clinic speed and film. We would love to invite you and your parents to our upcoming prospect day on campus."
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-500 text-white font-bold py-2.5 rounded-xl uppercase tracking-wider text-[10px] flex justify-center items-center gap-1.5">
                    <CheckCircle2 size={14} /> Approve & Forward to Daughter
                  </div>
                  <div className="bg-rose-100 text-rose-700 font-bold py-2.5 rounded-xl uppercase tracking-wider text-[10px] flex justify-center items-center">
                    Reject & Block
                  </div>
                </div>
              </div>

              {/* Queue 2 Mock */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 block mb-0.5">
                    Queue 2: Daughter's Drafted Reply (Awaiting Your Sign-Off)
                  </span>
                  <p className="text-xs text-white font-medium">
                    "Thank you Coach Arnold! My parents and I would love to attend prospect day..."
                  </p>
                </div>
                <span className="bg-[#1c7ed6] text-white text-[10px] font-bold px-4 py-2.5 rounded-xl uppercase tracking-wider shrink-0 flex items-center justify-center gap-1.5">
                  <Send size={12} /> Approve & Send to Coach
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ===================================================================== */}
      {/* SECONDARY SECTION: FOR COLLEGE SCOUTS & RECRUITERS (.EDU PORTAL)      */}
      {/* ===================================================================== */}
      <div id="college-scouts" className="bg-white border-t border-slate-200 py-20 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-8 md:p-10 text-white shadow-xl border border-blue-500/30 mb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-black uppercase tracking-widest mb-3">
                  <Building size={13} /> Why College Coaches Use DNA Flag Ratings
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight" style={displayFont}>
                  Built For Verified <span className="text-[#1c7ed6]">.EDU Coaching Staffs</span>
                </h2>
                <p className="text-slate-300 text-sm sm:text-base font-medium mt-2 max-w-2xl leading-relaxed">
                  Your daughter's profile is seen by college recruiters because we give university staffs the fastest, most reliable evaluation tools in women's flag football:
                </p>
              </div>
              <div className="shrink-0">
                <span className="px-5 py-3 rounded-2xl bg-[#1c7ed6] text-white text-xs font-black uppercase tracking-widest block text-center shadow-lg">
                  Verified .EDU Portal Only
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#1c7ed6] flex items-center justify-center mb-4">
                <Sliders size={22} />
              </div>
              <h3 className="text-lg font-extrabold uppercase text-slate-900 mb-2" style={displayFont}>
                Precision Combine Filters
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Coaches filter our national database by minimum DNA Score, laser-timed 40-yard dash, 5-10-5 shuttle, L-Drill, cumulative GPA, grad year, and state to discover prospects who fit their exact recruiting standards.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#1c7ed6] flex items-center justify-center mb-4">
                <Zap size={22} />
              </div>
              <h3 className="text-lg font-extrabold uppercase text-slate-900 mb-2" style={displayFont}>
                4-Player Compare Matrix
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Recruiting coordinators can select up to 4 athletes side-by-side to compare laser speed verifications, catching/throwing/flag-pull percentages, height, jump numbers, and academics on one screen.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#1c7ed6] flex items-center justify-center mb-4">
                <Columns size={22} />
              </div>
              <h3 className="text-lg font-extrabold uppercase text-slate-900 mb-2" style={displayFont}>
                Kanban Boards & Read Receipts
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Coaches organize prospects into Priority Target, Interested, and Watchlist boards and message families through our parent-moderated inbox with live read receipts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* BOTTOM CALL TO ACTION FOR FAMILIES                                    */}
      {/* ===================================================================== */}
      <div className="bg-slate-900 text-white py-16 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight mb-4" style={displayFont}>
            Ready To Claim Your Daughter's Profile?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-medium mb-8 max-w-2xl mx-auto leading-relaxed">
            Have your <strong>6-Digit Family Access Code</strong> ready? Click <strong>"Portal Login"</strong> in the top right corner of the navigation bar, select <strong>Parent</strong> or <strong>Athlete</strong>, and unlock her full recruiting suite today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => navigate('/')} className="px-8 py-4 bg-gradient-to-r from-[#1c7ed6] to-[#d6336c] text-white rounded-full font-bold uppercase tracking-wider text-xs sm:text-sm hover:opacity-95 transition-all shadow-xl flex items-center gap-2">
              Explore National Leaderboard <ChevronRight size={18} />
            </button>
            <button onClick={() => navigate('/roster')} className="px-8 py-4 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-full font-bold uppercase tracking-wider text-xs sm:text-sm transition-all">
              View Official DNA Roster
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};