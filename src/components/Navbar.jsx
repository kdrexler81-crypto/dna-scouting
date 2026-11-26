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
      {/* Performance Lab Obsidian Top Banner */}
      <header className="sticky top-0 z-40 bg-[#0A0A0C]/90 backdrop-blur-xl border-b border-white/10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-24 sm:h-32 flex items-center justify-between gap-6">
          {/* Left: Enlarged Brand Logo + Wordmark */}
          <button
            type="button"
            onClick={() => goTo('/')}
            className="flex items-center gap-4 text-left group shrink-0"
          >
            <img
              src="/DNA Logo.png"
              alt="DNA Flag Football Logo"
              className="h-16 sm:h-24 w-auto object-contain transition-transform group-hover:scale-105"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div>
              <span className="block text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-none">
                DNA Flag <span className="text-[#38bdf8]">Ratings</span>
              </span>
              <span className="hidden sm:block text-xs font-medium tracking-[0.18em] uppercase text-zinc-400 mt-1.5">
                Verified Biometrics &amp; Recruiting
              </span>
            </div>
          </button>

          {/* Center: Clean Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {[
              { label: 'Leaderboard', path: '/' },
              { label: 'College Directory', path: '/colleges' },
              { label: 'Roster', path: '/roster' },
              { label: 'Features', path: '/about' },
            ].map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => goTo(item.path)}
                className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right: Crisp White CTA + Minimal Menu Button */}
          <div className="flex items-center gap-3">
            {authRole ? (
              <button
                type="button"
                onClick={() => goTo(dashboardRoute)}
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#0A0A0C] bg-white hover:bg-zinc-200 transition-colors"
              >
                <LayoutDashboard size={15} /> Dashboard
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#0A0A0C] bg-white hover:bg-zinc-200 transition-colors"
              >
                <Lock size={14} /> Portal Login
              </button>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#131316] hover:bg-[#1C1C21] text-white transition-colors flex items-center gap-2 border border-white/10"
              aria-label="Open navigation menu"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Menu</span>
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Slide-Out Navigation Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          <div className="relative z-10 w-full max-w-xs bg-[#0A0A0C] text-white h-full border-l border-white/10 flex flex-col justify-between p-6 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg font-bold tracking-tight">Navigation</span>
                  {dbStatus === 'LIVE SYNC' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Live Sync Active" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-xl bg-[#131316] hover:bg-[#1C1C21] text-zinc-400 hover:text-white border border-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => goTo('/')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#131316] text-sm font-medium text-zinc-300 hover:text-white transition-colors text-left"
                >
                  <Home size={16} className="text-[#38bdf8]" /> Home &amp; Leaderboard
                </button>
                <button
                  type="button"
                  onClick={() => goTo('/colleges')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#131316] text-sm font-medium text-zinc-300 hover:text-white transition-colors text-left"
                >
                  <GraduationCap size={16} className="text-[#38bdf8]" /> College Directory
                </button>
                <button
                  type="button"
                  onClick={() => goTo('/roster')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#131316] text-sm font-medium text-zinc-300 hover:text-white transition-colors text-left"
                >
                  <Users size={16} className="text-zinc-400" /> Official Roster
                </button>
                <button
                  type="button"
                  onClick={() => goTo('/about')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#131316] text-sm font-medium text-zinc-300 hover:text-white transition-colors text-left"
                >
                  <Sparkles size={16} className="text-zinc-400" /> Platform Features
                </button>
                <a
                  href="https://www.dnaflagfootball.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[#131316] text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <Trophy size={16} className="text-zinc-400" /> DNA Club &amp; Clinics
                  </span>
                  <ExternalLink size={13} className="text-zinc-500" />
                </a>
              </nav>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10 space-y-2.5">
              <span className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 px-1 mb-2">
                {authRole ? `Signed In (${authRole})` : 'Portal Access'}
              </span>

              {authRole ? (
                <>
                  <button
                    type="button"
                    onClick={() => goTo(dashboardRoute)}
                    className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-[#0A0A0C] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <LayoutDashboard size={15} /> Go to Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={triggerLogout}
                    className="w-full py-3 px-4 rounded-xl bg-[#131316] hover:bg-rose-500/20 text-rose-400 border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => triggerLogin('athlete_login')}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-[#0A0A0C] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trophy size={14} /> Athlete Login
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerLogin('parent_login')}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#131316] hover:bg-[#1C1C21] text-white border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <Shield size={14} className="text-emerald-400" /> Parent Login
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerLogin('recruiter_login')}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#131316] hover:bg-[#1C1C21] text-white border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <Building size={14} className="text-[#38bdf8]" /> College Scout Login
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerLogin('admin')}
                    className="w-full py-2 px-4 rounded-xl bg-transparent hover:bg-[#131316] text-zinc-400 hover:text-white text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
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