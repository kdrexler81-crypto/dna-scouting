// src/pages/RosterPage.jsx
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ChevronLeft, FileText } from 'lucide-react';

const displayFont = { fontFamily: "'Outfit', sans-serif" };

export const RosterPage = ({ players, onSelect, onBack }) => {
  const rosteredPlayers = players.filter(p => p.dnaTeam && p.dnaTeam !== 'None');
  const teams = [...new Set(rosteredPlayers.map(p => p.dnaTeam))].sort();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in slide-in-from-bottom-8">
       <div className="flex justify-between items-center mb-8 print:hidden">
          <button onClick={onBack} className="font-semibold flex items-center gap-1.5 uppercase tracking-wider text-sm text-slate-500 hover:text-slate-800 transition-colors"><ChevronLeft size={18} /> Back to Hub</button>
          <button onClick={() => window.print()} className="font-semibold flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm uppercase tracking-wider shadow-md hover:bg-slate-800 hover:-translate-y-0.5 transition-all"><FileText size={16}/> Print QR Brochures</button>
       </div>
       {teams.map((team, index) => (
         <div key={team} className={`mb-16 print:m-0 ${index !== teams.length - 1 ? 'print:page-break-after-always' : ''}`}>
            <div className="mb-8 pb-3 border-b-2 border-slate-900 flex justify-between items-end">
              <div>
                 <h2 className="text-4xl font-extrabold uppercase tracking-tight text-slate-900" style={displayFont}>{team}</h2>
                 <p className="text-sm font-bold text-[#d6336c] uppercase tracking-widest mt-1.5">Official Tournament Roster & Scouting QR</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-4 print:gap-4">
               {rosteredPlayers.filter(p => p.dnaTeam === team).sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                  <div key={p.id} className="bg-white border border-slate-100 rounded-3xl p-5 flex flex-col items-center text-center cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg hover:border-[#1c7ed6]/30 transition-all group" onClick={() => onSelect(p)}>
                     <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-20 h-20 rounded-full object-cover mb-4 border border-slate-100" alt={p.name} />
                     <h4 className="font-extrabold text-sm uppercase truncate w-full group-hover:text-[#1c7ed6] transition-colors" style={displayFont}>{p.name}</h4>
                     <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{p.primaryPos} • {p.gradYear}</p>
                     <div className="my-5 p-2 bg-white rounded-xl border border-slate-100 shadow-sm"><QRCodeSVG value={`https://www.dnaflagratings.com/?p=${p.id}`} size={96} /></div>
                     <div className="w-full bg-slate-50/80 p-2.5 rounded-xl flex justify-between items-center mt-auto border border-slate-100/50">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">DNA Score</span>
                        <span className="font-black text-sm text-[#d6336c]" style={displayFont}>{p.dnaScore || "N/A"}</span>
                     </div>
                  </div>
               ))}
            </div>
         </div>
       ))}
    </div>
  );
};