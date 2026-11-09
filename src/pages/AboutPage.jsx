// src/pages/AboutPage.jsx
import React from 'react';
import { Shield, Trophy, Building, Mail, Lock, Zap, CheckCircle2, ChevronRight, Database, Search, Send, CheckCheck, Sliders, Users, Eye, FileText, ExternalLink, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const displayFont = { fontFamily: "'Outfit', sans-serif" };

export const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* 1. HERO SECTION */}
      <div className="bg-slate-900 text-white pt-20 pb-28 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#1c7ed6] via-[#8b5cf6] to-[#d6336c]"></div>
        <div className="absolute -right-40 -top-40 w-[500px] h-[500px] bg-[#1c7ed6] rounded-full blur-[140px] opacity-20 pointer-events-none"></div>
        <div className="absolute -left-40 -bottom-40 w-[500px] h-[500px] bg-[#d6336c] rounded-full blur-[140px] opacity-20 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 mb-8 backdrop-blur-md">
            <Shield size={15} className="text-emerald-400" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-200">USA Football & NFL FLAG Partner Ecosystem</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-tight mb-6 leading-[1.05] max-w-5xl mx-auto" style={displayFont}>
            The Recruiting Engine For <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1c7ed6] via-violet-400 to-[#d6336c]">Girls Flag Football</span>
          </h1>
          <p className="text-slate-300 text-base sm:text-lg md:text-xl font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
            Built for athletes, protected by parents, and trusted by college scouts. Explore how our proprietary combine scoring and NCAA-compliant CRM connects verified prospects with 320+ college programs.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button onClick={() => navigate('/')} className="px-8 py-4 bg-gradient-to-r from-[#1c7ed6] to-[#d6336c] text-white rounded-full font-bold uppercase tracking-wider text-xs sm:text-sm hover:opacity-95 transition-all shadow-xl flex items-center gap-2">
              Explore National Leaderboard <ChevronRight size={18} />
            </button>
            <button onClick={() => navigate('/roster')} className="px-8 py-4 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-full font-bold uppercase tracking-wider text-xs sm:text-sm transition-all flex items-center gap-2">
              View Official Roster
            </button>
          </div>

          {/* PLATFORM STATS STRIP */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-16 pt-12 border-t border-white/10">
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

      {/* 2. VISUAL FEATURE SHOWCASE 1: FOR ATHLETES */}
      <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 border-b border-slate-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* TEXT COLUMN */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-black uppercase tracking-widest">
              <Trophy size={14} /> For High School Athletes
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-slate-900 leading-tight" style={displayFont}>
              Verified Combine Data & One-Click College Outreach
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Stop hoping college coaches stumble across your highlight tape. Your Locker Room equips you with a verified <strong>DNA Athletic Score</strong> and a built-in directory of over 320+ NCAA DI, DII, DIII, NAIA, and JuCo programs.
            </p>
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-violet-50 text-violet-600 mt-0.5"><Zap size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm uppercase" style={displayFont}>Auto-Generated Recruiting Emails</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-0.5">Select any college and click one button to launch a pre-written cover letter pre-loaded with your 40-yd dash, shuttle, GPA, and Hudl film link.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-violet-50 text-violet-600 mt-0.5"><Eye size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm uppercase" style={displayFont}>Real-Time Scout View Tracking</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-0.5">See when verified university coaches view your profile and message them back inside your secure Locker Room inbox.</p>
                </div>
              </div>
            </div>
          </div>

          {/* GRAPHIC MOCKUP: ATHLETE OUTBOUND ENGINE */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-2">Athlete Locker Room • Outbound Engine</span>
                </div>
                <span className="text-[10px] font-black bg-violet-500/20 text-violet-300 border border-violet-500/30 px-3 py-1 rounded-full uppercase tracking-widest">320+ Colleges</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Mock College Card 1 */}
                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-slate-900 rounded-xl text-violet-400"><GraduationCap size={18}/></div>
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full uppercase tracking-widest">NCAA DI</span>
                  </div>
                  <h4 className="font-extrabold text-white uppercase text-sm" style={displayFont}>Long Island University</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5 mb-3">Head Coach: Jimmy Barbarise</p>
                  <div className="w-full bg-violet-600 text-white font-bold py-2 rounded-xl uppercase tracking-wider text-[10px] flex justify-center items-center gap-1.5">
                    <FileText size={12} /> Auto-Generate Email <ExternalLink size={10} />
                  </div>
                </div>

                {/* Mock College Card 2 */}
                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-slate-900 rounded-xl text-violet-400"><GraduationCap size={18}/></div>
                    <span className="text-[9px] font-black text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full uppercase tracking-widest">NAIA Varsity</span>
                  </div>
                  <h4 className="font-extrabold text-white uppercase text-sm" style={displayFont}>Keiser University</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5 mb-3">Head Coach: Justin Hilliker</p>
                  <div className="w-full bg-violet-600 text-white font-bold py-2 rounded-xl uppercase tracking-wider text-[10px] flex justify-center items-center gap-1.5">
                    <FileText size={12} /> Auto-Generate Email <ExternalLink size={10} />
                  </div>
                </div>
              </div>

              {/* Mock Auto-Generated Email Preview */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 text-left">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">
                  <span className="text-violet-600">Subject:</span> 2027 Prospect - Jordan Taylor - QB/WR - DNA Score: 9.4
                </div>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  "Coach Hilliker, My name is Jordan Taylor and I am a 2027 QB from NJ. Here are my verified DNA Athletics metrics: <strong className="text-slate-900">DNA Score: 9.4/10.0 • 40-Yd Dash: 4.78s • Shuttle: 4.41s • GPA: 3.9</strong>..."
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. VISUAL FEATURE SHOWCASE 2: FOR PARENTS */}
      <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 border-b border-slate-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* GRAPHIC MOCKUP: PARENT COMPLIANCE GATEWAY */}
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
                  <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">Inbound From College Scout</span>
                  <span className="text-[10px] font-bold text-slate-400">Action Required</span>
                </div>
                <p className="text-xs font-extrabold text-slate-900 uppercase mb-2">Coach Steve Arnold • <span className="text-[#1c7ed6]">Fairleigh Dickinson University (NCAA DI)</span></p>
                <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                  "We were blown away by your combine numbers and film. We would love to invite you and your family to our upcoming campus recruiting day."
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
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 block mb-0.5">Outbound Athlete Reply Draft</span>
                  <p className="text-xs text-white font-medium">"Thank you Coach! My parents and I would love to visit campus..."</p>
                </div>
                <span className="bg-[#1c7ed6] text-white text-[10px] font-bold px-3.5 py-2 rounded-xl uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                  <Send size={12} /> Release to Coach
                </span>
              </div>
            </div>
          </div>

          {/* TEXT COLUMN */}
          <div className="lg:col-span-5 space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-widest">
              <Shield size={14} /> For Parents & Guardians
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-slate-900 leading-tight" style={displayFont}>
              100% Transparency & Parent-Moderated Messaging
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Recruiting with minors requires uncompromising safety. No college coach can message your daughter directly without your explicit approval, and no athlete reply leaves the platform without your sign-off.
            </p>
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 mt-0.5"><Lock size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm uppercase" style={displayFont}>6-Digit Access Code Protection</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-0.5">Athlete profiles are locked behind a unique 6-digit code provided by your coach, ensuring only verified parents and athletes can claim their account.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 mt-0.5"><Mail size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm uppercase" style={displayFont}>Instant Email Compliance Alerts</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-0.5">Receive real-time email notifications the moment a university recruiter reaches out or when your daughter drafts a response.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 4. VISUAL FEATURE SHOWCASE 3: FOR COLLEGE SCOUTS */}
      <div className="max-w-7xl mx-auto px-4 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* TEXT COLUMN */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-[#1c7ed6] text-[10px] font-black uppercase tracking-widest">
              <Building size={14} /> For College Coaches & Scouts
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-slate-900 leading-tight" style={displayFont}>
              Advanced Combine Filtering & Recruiting Boards
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Exclusively accessible with a verified <strong>.edu university email</strong>. Filter the entire national database by laser-timed 40-yard dash, shuttle, graduation year, position, and GPA.
            </p>
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-[#1c7ed6] mt-0.5"><Sliders size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm uppercase" style={displayFont}>Head-to-Head Compare Matrix</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-0.5">Select up to 4 prospects simultaneously to compare sprint speed, agility, vertical jump, and catching efficiency side-by-side.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-[#1c7ed6] mt-0.5"><CheckCheck size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm uppercase" style={displayFont}>Read Receipts & Kanban Board</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-0.5">Organize prospects into Priority, Interested, and Pass columns and track double-checkmark read receipts on every recruiting message.</p>
                </div>
              </div>
            </div>
          </div>

          {/* GRAPHIC MOCKUP: SCOUT PORTAL */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <Database size={18} className="text-[#1c7ed6]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Scout Portal • Head-To-Head Compare Matrix</span>
                </div>
                <span className="text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full uppercase tracking-widest">Verified .EDU Only</span>
              </div>

              {/* Mock Compare Table */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-3 bg-slate-950/60 p-3.5 border-b border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <div>Combine Metric</div>
                  <div className="text-center text-white">Prospect A ('27 QB)</div>
                  <div className="text-center text-white">Prospect B ('26 WR)</div>
                </div>
                <div className="divide-y divide-slate-700/70 text-xs">
                  <div className="grid grid-cols-3 p-3.5 items-center">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Verified DNA Score</span>
                    <span className="text-center font-black text-emerald-400 text-sm" style={displayFont}>9.4 ★</span>
                    <span className="text-center font-black text-white text-sm" style={displayFont}>8.9</span>
                  </div>
                  <div className="grid grid-cols-3 p-3.5 items-center">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">40-Yard Sprint</span>
                    <span className="text-center font-bold text-white">4.82s</span>
                    <span className="text-center font-black text-emerald-400">4.69s ★</span>
                  </div>
                  <div className="grid grid-cols-3 p-3.5 items-center">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">5-10-5 Pro Shuttle</span>
                    <span className="text-center font-black text-emerald-400">4.38s ★</span>
                    <span className="text-center font-bold text-white">4.51s</span>
                  </div>
                  <div className="grid grid-cols-3 p-3.5 items-center">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Top Speed (MPH)</span>
                    <span className="text-center font-bold text-white">16.8 MPH</span>
                    <span className="text-center font-black text-emerald-400">17.4 MPH ★</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};