// src/components/Navbar.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, X, Trophy, GraduationCap, Home, Shield, Users, Sparkles,
  LogOut, LayoutDashboard, Building, Lock, ExternalLink
} from 'lucide-react';

export const Navbar = ({
  authRole,
  dbStatus,
  dashboardRoute,
  onOpenLogin,
  onLogout
}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const triggerLogin = (mode) => {
    setMenuOpen(false);
    onOpenLogin(mode);
  };

  const triggerLogout = () => {
    setMenuOpen(false);
    onLogout();
  };

  return (
    <>
      {/* Clean Sticky Top Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-white/10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
          {/* Left: Brand Logo + Live Sync Badge */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => goTo('/')}
              className="flex items-center gap-3 text-left"
            >
              <img
                src="/DNA Logo.png"
                alt="DNA Football Logo"
                className="h-9 w-auto"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div>
                <span className="block text-xl font-extrabold uppercase tracking-wider text-white leading-none font-display">
                  DNA Flag <span className="text-[#d6336c]">Ratings</span>
                </span>
                <span className="hidden sm:block text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                  Verified Prospect Hub
                </span>
              </div>
            </button>

            <span
              className={`hidden md:inline-flex text-[9px] px-2.5 py-1 rounded-full font-bold tracking-widest uppercase items-center gap-1.5 ${
                dbStatus === 'LIVE SYNC'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/10 text-slate-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  dbStatus === 'LIVE SYNC' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                }`}
              />
              {dbStatus}
            </span>
          </div>

          {/* Right: Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-2 border border-white/10"
            aria-label="Open navigation menu"
          >
            <span className="text-[11px] font-extrabold uppercase tracking-widest">Menu</span>
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Slide-Out Navigation Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          <div className="relative z-10 w-full max-w-xs bg-slate-950 text-white h-full shadow-2xl border-l border-white/10 flex flex-col justify-between p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <span className="text-xl font-extrabold uppercase tracking-wider font-display">
                  Navigation
                </span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Site Links */}
              <nav className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => goTo('/')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-sm font-bold text-slate-200 hover:text-white transition-colors text-left"
                >
                  <Home size={16} className="text-[#1c7ed6]" /> Home & Leaderboard
                </button>
                <button
                  type="button"
                  onClick={() => goTo('/colleges')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-sm font-bold text-slate-200 hover:text-white transition-colors text-left"
                >
                  <GraduationCap size={16} className="text-[#d6336c]" /> College Directory
                </button>
                <button
                  type="button"
                  onClick={() => goTo('/roster')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-sm font-bold text-slate-200 hover:text-white transition-colors text-left"
                >
                  <Users size={16} className="text-emerald-400" /> Official Roster
                </button>
                <button
                  type="button"
                  onClick={() => goTo('/about')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-sm font-bold text-slate-200 hover:text-white transition-colors text-left"
                >
                  <Sparkles size={16} className="text-amber-400" /> Platform Features
                </button>
                <a
                  href="https://www.dnaflagfootball.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/10 text-sm font-bold text-slate-200 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <Trophy size={16} className="text-sky-400" /> DNA Club & Clinics
                  </span>
                  <ExternalLink size={13} className="text-slate-500" />
                </a>
              </nav>
            </div>

            {/* Unified Account Section: Login OR Dashboard + Sign Out */}
            <div className="pt-6 mt-6 border-t border-white/10 space-y-2.5">
              <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 mb-2">
                {authRole ? `Signed In (${authRole})` : 'Portal Login'}
              </span>

              {authRole ? (
                <>
                  <button
                    type="button"
                    onClick={() => goTo(dashboardRoute)}
                    className="w-full py-3 px-4 rounded-xl text-white text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md"
                    style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}
                  >
                    <LayoutDashboard size={15} /> Go to Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={triggerLogout}
                    className="w-full py-3 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => triggerLogin('athlete_login')}
                    className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trophy size={14} /> Athlete Login
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerLogin('parent_login')}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <Shield size={14} /> Parent Login
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerLogin('recruiter_login')}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#1c7ed6] hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <Building size={14} /> College Scout Login
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerLogin('admin')}
                    className="w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Lock size={13} /> Coach / Admin Login
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};