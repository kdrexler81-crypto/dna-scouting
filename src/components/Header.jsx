// src/components/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

const displayFont = { fontFamily: "'Outfit', sans-serif" };

export const Header = () => {
  return (
    <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-50" style={{ borderBottom: '4px solid #d6336c' }}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo / Home Link */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="p-2 bg-white/10 rounded-xl">
            <Shield size={24} className="text-[#1c7ed6]" />
          </div>
          <span className="font-extrabold text-xl uppercase tracking-widest" style={displayFont}>
            DNA Scouting
          </span>
        </Link>
        
        {/* Navigation Links */}
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors">
            Hub
          </Link>
          <Link to="/roster" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors">
            Roster
          </Link>
        </nav>
      </div>
    </header>
  );
};