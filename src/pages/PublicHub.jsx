// src/pages/PublicHub.jsx
import React, { useState, useMemo } from 'react';
import { Search, Trophy, ChevronLeft, Video } from 'lucide-react';
import { useApp } from '../context/AppContext';

const displayFont = { fontFamily: "'Outfit', sans-serif" };

// --- PUBLIC HUB ---
export const PublicHub = ({ onSelect }) => {
  // Grab players directly from Context!
  const { players } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [posFilter, setPosFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'dnaScore', direction: 'desc' });
  
  const uniquePositions = useMemo(() => ['All', ...new Set(players.map(p => p.primaryPos).filter(Boolean))].sort(), [players]);
  const uniqueYears = useMemo(() => ['All', ...new Set(players.map(p => p.gradYear).filter(Boolean))].sort((a,b)=>b-a), [players]);
  const parseBroad = (str) => { if (!str) return 0; const ftMatch = str.match(/(\d+)'/); const inMatch = str.match(/(\d+)"/); return (ftMatch ? parseInt(ftMatch[1]) * 12 : 0) + (inMatch ? parseInt(inMatch[1]) : 0); };

  const filteredAndSortedPlayers = useMemo(() => {
    return players.filter(p => {
      return (p.name.toLowerCase().includes(searchTerm.toLowerCase())) && 
             (posFilter === 'All' || p.primaryPos === posFilter || (p.pos && p.pos.includes(posFilter))) && 
             (yearFilter === 'All' || p.gradYear === Number(yearFilter));
    }).sort((a, b) => {
      let aVal, bVal;
      if (sortConfig.key === 'name') return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      if (sortConfig.key === 'dnaScore') { aVal = Number(a.dnaScore) || 0; bVal = Number(b.dnaScore) || 0; } 
      else if (['sprint', 'shuttle', 'lDrill'].includes(sortConfig.key)) {
        const missingVal = sortConfig.direction === 'asc' ? 999 : -1;
        aVal = a.metrics?.[sortConfig.key] ? parseFloat(a.metrics[sortConfig.key]) : missingVal;
        bVal = b.metrics?.[sortConfig.key] ? parseFloat(b.metrics[sortConfig.key]) : missingVal;
      } else if (sortConfig.key === 'broad') { aVal = parseBroad(a.metrics?.broad); bVal = parseBroad(b.metrics?.broad); }
      else { aVal = parseFloat(a.metrics?.[sortConfig.key]) || 0; bVal = parseFloat(b.metrics?.[sortConfig.key]) || 0; }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [players, searchTerm, posFilter, yearFilter, sortConfig]);

  const requestSort = (key) => {
    if (sortConfig.key === key) { setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' }); } 
    else { const ascDefault = ['sprint', 'shuttle', 'lDrill', 'name']; setSortConfig({ key, direction: ascDefault.includes(key) ? 'asc' : 'desc' }); }
  };
  
  const SortableHeader = ({ label, sortKey, align = 'center' }) => (
    <th className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors text-${align} whitespace-nowrap group select-none`} onClick={() => requestSort(sortKey)}>
      <div className={`flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : ''} ${align === 'right' ? 'justify-end' : ''}`}>
        {label}
        <div className="flex flex-col -space-y-1">
          <ChevronLeft size={10} className={`rotate-90 ${sortConfig.key === sortKey && sortConfig.direction === 'asc' ? 'text-[#1c7ed6] opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
          <ChevronLeft size={10} className={`-rotate-90 ${sortConfig.key === sortKey && sortConfig.direction === 'desc' ? 'text-[#1c7ed6] opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
        </div>
      </div>
    </th>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5 uppercase tracking-tight" style={displayFont}><Trophy style={{ color: '#d6336c' }} size={24}/> National Leaderboard</h2>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1.5">Combine Results Tracker</p>
          </div>
          <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">{filteredAndSortedPlayers.length} Athletes Found</div>
        </div>
        <div className="bg-slate-50/50 p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4">
           <div className="relative flex-1">
             <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
             <input type="text" placeholder="Search by athlete name..." className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl pl-12 pr-4 py-3 text-sm font-medium focus:outline-none transition-all focus:border-[#1c7ed6] focus:ring-2 focus:ring-[#1c7ed6]/20 shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
           </div>
           <div className="flex gap-4 sm:w-auto w-full">
              <div className="flex-1 md:w-40"><select className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none cursor-pointer shadow-sm" value={posFilter} onChange={(e) => setPosFilter(e.target.value)}>{uniquePositions.map(pos => <option key={pos} value={pos}>{pos === 'All' ? 'All Positions' : pos}</option>)}</select></div>
              <div className="flex-1 md:w-44"><select className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none cursor-pointer shadow-sm" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>{uniqueYears.map(year => <option key={year} value={year}>{year === 'All' ? 'All Classes' : `Class of ${year}`}</option>)}</select></div>
           </div>
        </div>
        <div className="overflow-x-auto w-full relative">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-white text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <SortableHeader label="Athlete" sortKey="name" align="left" />
                <SortableHeader label="DNA Score" sortKey="dnaScore" />
                <SortableHeader label="40-Yd" sortKey="sprint" />
                <SortableHeader label="5-10-5" sortKey="shuttle" />
                <SortableHeader label="L-Drill" sortKey="lDrill" />
                <SortableHeader label="MPH" sortKey="mph" />
                <SortableHeader label="Broad" sortKey="broad" />
                <SortableHeader label="Vert" sortKey="vertical" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAndSortedPlayers.length === 0 ? (
                 <tr><td colSpan="8" className="p-16 text-center text-slate-400 font-medium text-sm">No athletes match your filters.</td></tr>
              ) : (
                 filteredAndSortedPlayers.map((p, i) => (
                   <tr key={p.id} onClick={() => onSelect(p)} className="hover:bg-slate-50/80 cursor-pointer transition-colors group border-b border-slate-50">
                     <td className="p-4 md:p-5">
                       <div className="flex items-center gap-4">
                         <div className="w-6 text-center text-slate-300 font-bold text-xs">{i + 1}</div>
                         <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} alt={p.name} className="w-11 h-11 rounded-full border border-slate-200 bg-slate-50 object-cover transition-colors group-hover:border-[#d6336c]" />
                         <div>
                           <p className="font-extrabold text-slate-900 text-sm uppercase flex items-center gap-1.5 transition-colors group-hover:text-[#1c7ed6]" style={displayFont}>{p.name} {p.hudlLink && <Video size={14} style={{ color: '#1c7ed6' }} />}</p>
                           <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase mt-0.5">{p.primaryPos || p.pos} • {p.gradYear}</p>
                         </div>
                       </div>
                     </td>
                     <td className="p-4 md:p-5 text-center"><span className="font-black text-xl px-4 py-1.5 rounded-lg border border-slate-100 bg-white shadow-sm" style={{ color: '#d6336c', ...displayFont }}>{p.dnaScore}</span></td>
                     <td className="p-4 md:p-5 text-center font-medium text-sm text-slate-600">{p.metrics?.sprint || '-'}</td>
                     <td className="p-4 md:p-5 text-center font-medium text-sm text-slate-600">{p.metrics?.shuttle || '-'}</td>
                     <td className="p-4 md:p-5 text-center font-medium text-sm text-slate-600">{p.metrics?.lDrill || '-'}</td>
                     <td className="p-4 md:p-5 text-center font-medium text-sm text-slate-600">{p.metrics?.mph || '-'}</td>
                     <td className="p-4 md:p-5 text-center font-medium text-sm text-slate-600">{p.metrics?.broad || '-'}</td>
                     <td className="p-4 md:p-5 text-center font-medium text-sm text-slate-600">{p.metrics?.vertical || '-'}</td>
                   </tr>
                 ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};