// src/pages/RecruiterPortal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { Search, LayoutDashboard, GitCompare, Building, Star, MessageSquare, AtSign, Video, GripVertical, X, Send, Loader2, Shield, Download, Check, CheckCheck, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';

const displayFont = { fontFamily: "'Outfit', sans-serif" };

const DatabaseRow = ({ player, onSelect, boardData, onMoveToBoard, isSelected, onToggleSelect, onMessageClick }) => {
  let currentStatus = '';
  if (boardData.priority.includes(player.id)) currentStatus = 'priority';
  else if (boardData.interested.includes(player.id)) currentStatus = 'interested';
  else if (boardData.pass.includes(player.id)) currentStatus = 'pass';

  return (
    <tr className={`hover:bg-slate-50/80 border-b border-slate-50 transition-colors group ${isSelected ? 'bg-blue-50/40' : ''}`}>
      <td className="p-4 md:p-5 text-center"><input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(player.id)} className="w-4 h-4 rounded border-slate-300 text-[#1c7ed6] focus:ring-[#1c7ed6] cursor-pointer" /></td>
      <td className="p-4 md:p-5">
         <div className="flex items-center gap-4">
           <img src={player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} alt={player.name} className="w-10 h-10 rounded-full border border-slate-200 object-cover cursor-pointer hover:border-[#1c7ed6] transition-colors" onClick={() => onSelect(player)} />
           <div onClick={() => onSelect(player)} className="cursor-pointer">
             <p className="font-extrabold text-slate-900 text-sm group-hover:text-[#1c7ed6] transition-colors" style={displayFont}>{player.name}</p>
             <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase mt-0.5">{player.city}, {player.state}</p>
           </div>
         </div>
      </td>
      <td className="p-4 md:p-5 text-center"><span className="font-black text-lg text-[#d6336c] bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm" style={displayFont}>{player.dnaScore}</span></td>
      <td className="p-4 md:p-5 text-center text-xs font-bold text-slate-600">{player.primaryPos} / {player.gradYear}</td>
      <td className="p-4 md:p-5 text-center text-xs font-semibold text-slate-600">{player.metrics?.sprint || '-'}</td>
      <td className="p-4 md:p-5 text-center text-xs font-semibold text-slate-600">{player.gpa || '-'}</td>
      <td className="p-4 md:p-5 text-center">
         <div className="flex flex-col items-center gap-2 w-full max-w-[100px] mx-auto">
           <button onClick={() => onMessageClick(player)} className="bg-[#1c7ed6] hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 w-full shadow-sm shadow-blue-500/20 transition-colors">
             <MessageSquare size={12}/> Message
           </button>
           {player.twitter && <a href={`https://twitter.com/${player.twitter.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-[10px] text-slate-400 hover:text-[#1c7ed6] font-bold transition-colors uppercase tracking-widest flex items-center gap-1"><AtSign size={10}/> Twitter</a>}
         </div>
      </td>
      <td className="p-4 md:p-5 text-center">
         <select className={`text-[10px] font-extrabold uppercase tracking-wider rounded-lg px-3 py-2 border cursor-pointer focus:outline-none transition-colors ${currentStatus ? 'bg-[#1c7ed6] text-white border-[#1c7ed6] shadow-md shadow-blue-500/20' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`} value={currentStatus} onChange={(e) => onMoveToBoard(player.id, e.target.value)}>
            <option value="">+ Add to Board</option><option value="priority">⭐ Priority</option><option value="interested">👀 Interested</option><option value="pass">🚫 Pass</option>
         </select>
      </td>
      <td className="p-4 md:p-5 text-center">{player.hudlLink ? <a href={player.hudlLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-white bg-slate-900 px-3 py-1.5 rounded-lg hover:bg-[#1c7ed6] transition-colors uppercase tracking-wide"><Video size={14}/> Film</a> : '-'}</td>
    </tr>
  );
};

const DraggableCard = ({ player, onClick }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: player.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 999, position: 'relative' } : undefined;
  
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-[0_4px_12px_rgb(0,0,0,0.03)] cursor-grab active:cursor-grabbing hover:border-[#1c7ed6]/50 hover:shadow-md transition-all flex items-center gap-3 relative group touch-none">
       <GripVertical size={16} className="text-slate-300 absolute left-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
       <img src={player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} className="w-12 h-12 rounded-full border border-slate-100 ml-3 object-cover" alt={player.name} />
       <div className="flex-1 min-w-0" onPointerDown={(e) => { e.stopPropagation(); onClick(player); }}>
         <p className="text-sm font-bold text-slate-800 truncate group-hover:text-[#1c7ed6] transition-colors" style={displayFont}>{player.name}</p>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">{player.primaryPos} • {player.gradYear}</p>
       </div>
       <div className="text-center shrink-0 pr-1">
         <span className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">DNA</span>
         <span className="text-sm font-black text-[#d6336c]" style={displayFont}>{player.dnaScore}</span>
       </div>
    </div>
  );
};

const DroppableColumn = ({ id, title, players, onPlayerClick }) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div className="flex flex-col bg-slate-50/50 rounded-3xl border border-slate-100 h-[650px] flex-1 min-w-[300px]">
       <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center rounded-t-3xl">
         <h3 className="font-extrabold text-slate-800 uppercase tracking-tight text-sm" style={displayFont}>{title}</h3>
         <span className="text-[11px] font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">{players.length}</span>
       </div>
       <div ref={setNodeRef} className={`flex-1 p-4 overflow-y-auto space-y-3 transition-colors rounded-b-3xl ${isOver ? 'bg-blue-50/50 ring-2 ring-inset ring-[#1c7ed6]/20' : ''}`}>
         {players.map(p => <DraggableCard key={p.id} player={p} onClick={onPlayerClick} />)}
       </div>
    </div>
  );
};

export const RecruiterPortal = ({ onSelect, onLogout }) => {
  const { app, appId, db, players, recruiterData } = useApp();

  const [activeTab, setActiveTab] = useState('database');
  const [boardData, setBoardData] = useState({ priority: [], interested: [], pass: [] });
  const [compareIds, setCompareIds] = useState([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  
  // Threaded Messaging State
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [activeAthlete, setActiveAthlete] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Filters
  const [minDna, setMinDna] = useState(0); const [minGpa, setMinGpa] = useState(0); const [maxSprint, setMaxSprint] = useState(10); const [maxShuttle, setMaxShuttle] = useState(10); const [maxLDrill, setMaxLDrill] = useState(10); const [minBroad, setMinBroad] = useState(0); const [minVert, setMinVert] = useState(0); const [posFilter, setPosFilter] = useState('All'); const [yearFilter, setYearFilter] = useState('All');

  useEffect(() => {
    if (!recruiterData?.uid || !db) return;
    
    // 1. Listen to Board Data
    const unsubBoard = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'recruiters', recruiterData.uid), (docSnap) => {
      if (docSnap.exists() && docSnap.data().board) setBoardData(docSnap.data().board);
    });

    // 2. Listen to active Threads for this scout
    const threadsQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'threads'), where("scoutId", "==", recruiterData.uid));
    const unsubThreads = onSnapshot(threadsQuery, (snap) => {
      const th = []; snap.forEach(doc => th.push({ id: doc.id, ...doc.data() }));
      th.sort((a,b) => b.lastUpdate - a.lastUpdate);
      setThreads(th);
    });

    return () => { unsubBoard(); unsubThreads(); };
  }, [recruiterData, db, appId]);

  useEffect(() => {
    if (!activeThreadId || !db) return;
    
    // 3. Listen to messages for the currently selected thread
    const msgQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), where("threadId", "==", activeThreadId));
    const unsubMsg = onSnapshot(msgQuery, (snap) => {
      const msgs = []; snap.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
      msgs.sort((a,b) => a.timestamp - b.timestamp);
      setThreadMessages(msgs);

      // Instantly mark incoming athlete messages as "read" if the scout is viewing the thread
      msgs.forEach(m => {
        if (m.senderRole === 'athlete' && m.status === 'approved' && !m.readAt) {
          httpsCallable(getFunctions(app), 'markMessageRead')({ messageId: m.id, appId }).catch(console.error);
        }
      });
    });
    
    return () => unsubMsg();
  }, [activeThreadId, db, appId, app]);

  const uniquePositions = useMemo(() => ['All', ...new Set(players.map(p => p.primaryPos).filter(Boolean))].sort(), [players]);
  const uniqueYears = useMemo(() => ['All', ...new Set(players.map(p => p.gradYear).filter(Boolean))].sort((a,b)=>b-a), [players]);
  const parseBroad = (str) => { if (!str) return 0; const ftMatch = str.match(/(\d+)'/); const inMatch = str.match(/(\d+)"/); return (ftMatch ? parseInt(ftMatch[1]) * 12 : 0) + (inMatch ? parseInt(inMatch[1]) : 0); };

  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      return (posFilter === 'All' || p.primaryPos === posFilter) && (yearFilter === 'All' || p.gradYear === Number(yearFilter)) && ((Number(p.dnaScore) || 0) >= Number(minDna)) && ((Number(p.gpa) || 0) >= Number(minGpa)) && (maxSprint >= 10 || (parseFloat(p.metrics?.sprint) || 99) <= Number(maxSprint)) && (maxShuttle >= 10 || (parseFloat(p.metrics?.shuttle) || 99) <= Number(maxShuttle)) && (maxLDrill >= 10 || (parseFloat(p.metrics?.lDrill) || 99) <= Number(maxLDrill)) && (minBroad <= 0 || parseBroad(p.metrics?.broad) >= Number(minBroad)) && (minVert <= 0 || (parseFloat(p.metrics?.vertical) || 0) >= Number(minVert));
    }).sort((a, b) => Number(b.dnaScore) - Number(a.dnaScore));
  }, [players, minDna, maxSprint, maxShuttle, maxLDrill, minBroad, minVert, minGpa, posFilter, yearFilter]);

  const getBoardStatus = (playerId) => { if (boardData.priority.includes(playerId)) return 'priority'; if (boardData.interested.includes(playerId)) return 'interested'; if (boardData.pass.includes(playerId)) return 'pass'; return ''; };
  const handleMoveToBoard = async (playerId, destCol) => { const newBoard = { priority: boardData.priority.filter(id => id !== playerId), interested: boardData.interested.filter(id => id !== playerId), pass: boardData.pass.filter(id => id !== playerId) }; if (destCol) newBoard[destCol].push(playerId); setBoardData(newBoard); try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'recruiters', recruiterData.uid), { board: newBoard }); } catch (err) { console.error("Error saving board", err); } };
  const handleBatchMoveToBoard = async (destCol) => { if (selectedPlayerIds.length === 0) return; const newBoard = { priority: boardData.priority.filter(id => !selectedPlayerIds.includes(id)), interested: boardData.interested.filter(id => !selectedPlayerIds.includes(id)), pass: boardData.pass.filter(id => !selectedPlayerIds.includes(id)) }; if (destCol) newBoard[destCol].push(...selectedPlayerIds); setBoardData(newBoard); setSelectedPlayerIds([]); try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'recruiters', recruiterData.uid), { board: newBoard }); } catch (err) { console.error("Error saving batch update", err); } };
  const toggleSelectPlayer = (id) => setSelectedPlayerIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  const toggleSelectAll = () => { const allFilteredIds = filteredPlayers.map(p => p.id); const areAllSelected = allFilteredIds.every(id => selectedPlayerIds.includes(id)); if (areAllSelected) setSelectedPlayerIds(prev => prev.filter(id => !allFilteredIds.includes(id))); else setSelectedPlayerIds(prev => [...new Set([...prev, ...allFilteredIds])]); };

  const handleOpenChat = (player) => {
    setActiveAthlete(player);
    setActiveThreadId(`${recruiterData.uid}_${player.id}`);
    setActiveTab('inbox');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageContent.trim() || !activeAthlete) return;
    if (!activeAthlete.guardianEmail) { alert("Cannot send message: Athlete has no Parent/Guardian email on file."); return; }
    
    setSendingMessage(true);
    try {
      const sendMessage = httpsCallable(getFunctions(app), 'sendMessage');
      await sendMessage({ 
        athleteId: activeAthlete.id, 
        scoutId: recruiterData.uid, 
        content: messageContent, 
        senderRole: 'scout',
        appId 
      });
      setMessageContent('');
      setActiveThreadId(`${recruiterData.uid}_${activeAthlete.id}`);
    } catch (err) { alert("Failed to send message: " + err.message); }
    setSendingMessage(false);
  };

  const BoardStatusDropdown = ({ playerId, className = "" }) => {
    const status = getBoardStatus(playerId);
    return (
      <select 
        className={`text-[10px] font-extrabold uppercase tracking-wider rounded-lg px-3 py-2 border cursor-pointer focus:outline-none transition-colors ${status ? 'bg-[#1c7ed6] text-white border-[#1c7ed6] shadow-md shadow-blue-500/20' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'} ${className}`}
        value={status} onChange={(e) => handleMoveToBoard(playerId, e.target.value)}
      >
         <option value="">+ Add to Board</option><option value="priority">⭐ Priority</option><option value="interested">👀 Interested</option><option value="pass">🚫 Pass</option>
      </select>
    );
  };

  const exportDatabaseCSV = () => {
    const headers = ["Name", "Position", "Class", "DNA Score", "GPA", "SAT", "40-Yd", "State", "Guardian Email", "Twitter", "Hudl Link"];
    const rows = filteredPlayers.map(p => [ `"${p.name}"`, p.primaryPos, p.gradYear, p.dnaScore, p.gpa || 'N/A', p.sat || 'N/A', p.metrics?.sprint || 'N/A', p.state, p.guardianEmail || 'N/A', p.twitter || 'N/A', p.hudlLink || 'N/A' ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", `DNA_Prospects_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); link.remove();
  };

  const exportBoardCSV = () => {
    const headers = ["Name", "Position", "Class", "Board Status", "DNA Score", "GPA", "SAT", "40-Yd", "State", "Guardian Email", "Twitter", "Hudl Link"];
    const getRows = (statusArr, statusLabel) => statusArr.map(id => {
      const p = players.find(player => player.id === id); if (!p) return null;
      return [ `"${p.name}"`, p.primaryPos, p.gradYear, statusLabel, p.dnaScore, p.gpa || 'N/A', p.sat || 'N/A', p.metrics?.sprint || 'N/A', p.state, p.guardianEmail || 'N/A', p.twitter || 'N/A', p.hudlLink || 'N/A' ];
    }).filter(Boolean);
    const rows = [...getRows(boardData.priority, "Priority"), ...getRows(boardData.interested, "Interested"), ...getRows(boardData.pass, "Pass")];
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", `DNA_Recruiting_Board_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); link.remove();
  };

  return (
    <DndContext onDragEnd={async (e) => { if (e.over) handleMoveToBoard(String(e.active.id), e.over.id); }}>
      <div className="max-w-7xl mx-auto p-4 py-8 animate-in fade-in relative">
        <div className="bg-slate-900 rounded-3xl p-8 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 mb-10 border border-slate-800" style={{ borderTop: '4px solid #1c7ed6' }}>
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white/10 rounded-2xl"><Building size={28} className="text-white" /></div>
            <div><h2 className="text-2xl font-extrabold text-white uppercase tracking-tight" style={displayFont}>Scout Portal: {recruiterData?.school}</h2><p className="text-xs font-bold text-[#1c7ed6] uppercase tracking-widest mt-1">Logged in as {recruiterData?.name}</p></div>
          </div>
          <button onClick={onLogout} className="text-xs font-bold text-rose-400 border border-rose-400/30 bg-rose-400/10 px-5 py-2.5 rounded-full hover:bg-rose-400 hover:text-white transition-colors uppercase tracking-wider">Sign Out</button>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-4 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
           <button onClick={() => setActiveTab('database')} className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'database' ? 'text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`} style={activeTab === 'database' ? { background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' } : {}}><Search size={16} className="hidden sm:block"/> Database</button>
           <button onClick={() => setActiveTab('inbox')} className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'inbox' ? 'text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`} style={activeTab === 'inbox' ? { background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' } : {}}><MessageSquare size={16} className="hidden sm:block"/> Inbox</button>
           <button onClick={() => setActiveTab('board')} className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'board' ? 'text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`} style={activeTab === 'board' ? { background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' } : {}}><LayoutDashboard size={16} className="hidden sm:block"/> Board</button>
           <button onClick={() => setActiveTab('compare')} className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'compare' ? 'text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`} style={activeTab === 'compare' ? { background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' } : {}}><GitCompare size={16} className="hidden sm:block"/> Compare</button>
        </div>

        {activeTab === 'database' && (
          <div className="animate-in fade-in slide-in-from-left-4">
             <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 md:p-8 mb-8">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                   <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-800" style={displayFont}>Advanced Filters</h3>
                   <button onClick={exportDatabaseCSV} className="text-[10px] font-bold text-white bg-slate-900 px-4 py-2 rounded-full flex items-center gap-2 uppercase tracking-wider hover:bg-[#1c7ed6] transition-colors shadow-sm"><Download size={14}/> Export CSV</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-5">
                   <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Pos</label><select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#1c7ed6] transition-all" value={posFilter} onChange={e=>setPosFilter(e.target.value)}>{uniquePositions.map(pos => <option key={pos} value={pos}>{pos}</option>)}</select></div>
                   <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Class</label><select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#1c7ed6] transition-all" value={yearFilter} onChange={e=>setYearFilter(e.target.value)}>{uniqueYears.map(yr => <option key={yr} value={yr}>{yr}</option>)}</select></div>
                   <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Min DNA ({minDna})</label><input type="range" min="0" max="10" step="0.1" value={minDna} onChange={e=>setMinDna(e.target.value)} className="w-full accent-[#d6336c]" /></div>
                   <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Min GPA ({minGpa})</label><input type="range" min="0" max="4.5" step="0.1" value={minGpa} onChange={e=>setMinGpa(e.target.value)} className="w-full accent-[#1c7ed6]" /></div>
                   <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Max 40-Yd ({maxSprint >= 10 ? 'Any' : maxSprint + 's'})</label><input type="range" min="4.5" max="10" step="0.1" value={maxSprint} onChange={e=>setMaxSprint(e.target.value)} className="w-full accent-emerald-500" /></div>
                   <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Max Shuttle ({maxShuttle >= 10 ? 'Any' : maxShuttle + 's'})</label><input type="range" min="4.0" max="10" step="0.1" value={maxShuttle} onChange={e=>setMaxShuttle(e.target.value)} className="w-full accent-emerald-500" /></div>
                   <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Max L-Drill ({maxLDrill >= 10 ? 'Any' : maxLDrill + 's'})</label><input type="range" min="4.0" max="10" step="0.1" value={maxLDrill} onChange={e=>setMaxLDrill(e.target.value)} className="w-full accent-emerald-500" /></div>
                   <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Min Broad ({minBroad <= 0 ? 'Any' : minBroad + '"'})</label><input type="range" min="0" max="120" step="1" value={minBroad} onChange={e=>setMinBroad(e.target.value)} className="w-full accent-amber-500" /></div>
                </div>
             </div>
             {selectedPlayerIds.length > 0 && (
               <div className="bg-slate-900 text-white p-4 rounded-2xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border border-slate-800 animate-in fade-in">
                  <div className="flex items-center gap-3"><span className="bg-[#1c7ed6] text-white text-xs font-black px-3 py-1 rounded-full">{selectedPlayerIds.length}</span><span className="text-xs font-extrabold uppercase tracking-widest">Athletes Selected</span></div>
                  <div className="flex items-center gap-2 flex-wrap">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Batch Add to:</span>
                     <button onClick={() => handleBatchMoveToBoard('priority')} className="text-[10px] font-extrabold uppercase px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors">⭐ Priority</button>
                     <button onClick={() => handleBatchMoveToBoard('interested')} className="text-[10px] font-extrabold uppercase px-3 py-2 rounded-xl bg-[#1c7ed6] hover:bg-blue-500 text-white shadow-sm transition-colors">👀 Interested</button>
                     <button onClick={() => handleBatchMoveToBoard('pass')} className="text-[10px] font-extrabold uppercase px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white shadow-sm transition-colors">🚫 Pass</button>
                     <button onClick={() => setSelectedPlayerIds([])} className="text-[10px] font-bold text-slate-400 hover:text-white px-2 py-1 ml-2 underline uppercase tracking-wider">Clear</button>
                  </div>
               </div>
             )}
             <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                           <th className="p-5 w-12 text-center"><input type="checkbox" checked={filteredPlayers.length > 0 && filteredPlayers.every(p => selectedPlayerIds.includes(p.id))} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-300 text-[#1c7ed6] focus:ring-[#1c7ed6] cursor-pointer" /></th>
                           <th className="p-5 w-[240px]">Athlete</th>
                           <th className="p-5 text-center">DNA Score</th>
                           <th className="p-5 text-center">Pos / Yr</th>
                           <th className="p-5 text-center">40-Yd</th>
                           <th className="p-5 text-center">GPA</th>
                           <th className="p-5 text-center">Contact</th>
                           <th className="p-5 text-center">Board Status</th>
                           <th className="p-5 text-center">Tape</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredPlayers.length === 0 ? <tr><td colSpan="9" className="p-16 text-center text-sm font-medium text-slate-400">No athletes match criteria.</td></tr> : 
                          filteredPlayers.map(p => <DatabaseRow key={p.id} player={p} onSelect={onSelect} boardData={boardData} onMoveToBoard={handleMoveToBoard} isSelected={selectedPlayerIds.includes(p.id)} onToggleSelect={toggleSelectPlayer} onMessageClick={handleOpenChat} />)
                        }
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'inbox' && (
          <div className="animate-in fade-in slide-in-from-right-4 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col md:flex-row overflow-hidden h-[700px]">
            {/* THREAD LIST (LEFT SIDEBAR) */}
            <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50 flex flex-col h-1/3 md:h-full">
              <div className="p-5 border-b border-slate-100 bg-white">
                <h3 className="font-extrabold uppercase tracking-tight text-slate-900" style={displayFont}>Active Conversations</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {threads.length === 0 ? (
                   <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest p-6">No messages yet.</p>
                ) : (
                   threads.map(t => (
                     <div key={t.threadId} onClick={() => { setActiveThreadId(t.threadId); setActiveAthlete(players.find(p=>p.id===t.athleteId)); }} className={`p-4 rounded-2xl cursor-pointer transition-all border ${activeThreadId === t.threadId ? 'bg-white border-[#1c7ed6] shadow-sm' : 'border-transparent hover:bg-slate-100'}`}>
                       <div className="flex justify-between items-start mb-1">
                         <p className="font-extrabold text-sm text-slate-900 truncate pr-2" style={displayFont}>{t.athleteName}</p>
                         <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">{new Date(t.lastUpdate).toLocaleDateString()}</span>
                       </div>
                       <p className="text-xs text-slate-500 truncate">{t.lastMessagePreview}</p>
                     </div>
                   ))
                )}
              </div>
            </div>

            {/* CHAT WINDOW (RIGHT PANE) */}
            <div className="w-full md:w-2/3 flex flex-col bg-white h-2/3 md:h-full">
               {activeAthlete ? (
                 <>
                   <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white shadow-sm z-10">
                     <div className="flex items-center gap-4">
                       <img src={activeAthlete.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeAthlete.name}`} className="w-12 h-12 rounded-full border border-slate-200 object-cover cursor-pointer hover:border-[#1c7ed6] transition-colors" onClick={() => onSelect(activeAthlete)} />
                       <div>
                         <h3 className="font-extrabold text-lg text-slate-900 uppercase cursor-pointer hover:text-[#1c7ed6] transition-colors" style={displayFont} onClick={() => onSelect(activeAthlete)}>{activeAthlete.name}</h3>
                         <p className="text-[10px] font-bold text-[#1c7ed6] uppercase tracking-widest">{activeAthlete.primaryPos} • Class of {activeAthlete.gradYear}</p>
                       </div>
                     </div>
                     <span className="hidden md:block font-black text-xl text-[#d6336c] bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-100 shadow-sm" style={displayFont}>{activeAthlete.dnaScore}</span>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 flex flex-col gap-4">
                     {threadMessages.filter(m => m.senderRole === 'scout' || m.status === 'approved').length === 0 ? (
                       <div className="m-auto text-center">
                         <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100"><Shield className="text-emerald-500" size={20} /></div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">NCAA Compliance Engine Active</p>
                         <p className="text-[11px] text-slate-500 mt-2 max-w-[250px] mx-auto">Messages sent will be routed to the athlete's Parent/Guardian Dashboard for approval before delivery.</p>
                       </div>
                     ) : (
                       threadMessages.filter(m => m.senderRole === 'scout' || m.status === 'approved').map(msg => {
                          const isScout = msg.senderRole === 'scout';
                          return (
                            <div key={msg.id} className={`flex flex-col max-w-[80%] md:max-w-[70%] ${isScout ? 'self-end items-end' : 'self-start items-start'}`}>
                              <div className={`p-4 rounded-2xl ${isScout ? 'bg-[#1c7ed6] text-white rounded-tr-sm shadow-md' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'}`}>
                                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1.5 px-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                                {isScout && (
                                  <span className="text-slate-400">
                                    {msg.readAt ? <CheckCheck size={12} className="text-[#1c7ed6]" /> : (msg.status === 'pending' ? <Clock size={10} /> : <Check size={12} />)}
                                  </span>
                                )}
                              </div>
                              {isScout && msg.status === 'pending' && <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest pr-1 mt-0.5">Delivered to Parent</span>}
                            </div>
                          )
                       })
                     )}
                   </div>
                   
                   <div className="p-4 bg-white border-t border-slate-100">
                     <form onSubmit={handleSendMessage} className="flex gap-3 relative">
                       <input type="text" placeholder={`Secure message to ${activeAthlete.name}...`} className="flex-1 bg-slate-50 border border-slate-200 rounded-full pl-5 pr-14 py-3 text-sm font-medium focus:outline-none focus:border-[#1c7ed6] focus:ring-1 focus:ring-[#1c7ed6] transition-all" value={messageContent} onChange={e => setMessageContent(e.target.value)} />
                       <button type="submit" disabled={sendingMessage || !messageContent.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#1c7ed6] hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-full flex items-center justify-center transition-colors shadow-sm">
                         {sendingMessage ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
                       </button>
                     </form>
                   </div>
                 </>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/30">
                   <MessageSquare size={48} className="text-slate-200 mb-4" />
                   <h3 className="font-extrabold text-slate-400 uppercase tracking-tight text-xl" style={displayFont}>No Conversation Selected</h3>
                   <p className="text-sm font-medium text-slate-400 mt-2">Select a thread from the sidebar, or start a new conversation from the Database tab.</p>
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'board' && (
          <div className="animate-in fade-in slide-in-from-right-4">
             <div className="mb-8 p-6 bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-amber-50 rounded-2xl"><Star className="text-amber-500 shrink-0" size={24} /></div>
                   <div>
                     <h3 className="text-lg font-extrabold uppercase tracking-tight text-slate-900" style={displayFont}>Recruiting Board</h3>
                     <p className="text-[11px] font-semibold text-slate-400 uppercase mt-0.5">Use the database tab to save prospects here.</p>
                   </div>
                </div>
                <button onClick={exportBoardCSV} className="text-[10px] font-bold text-white bg-slate-900 px-5 py-2.5 rounded-full flex items-center gap-2 uppercase tracking-wider hover:bg-[#1c7ed6] transition-colors shadow-sm whitespace-nowrap"><Download size={14}/> Export Board to CSV</button>
             </div>
             <div className="flex flex-col md:flex-row gap-6 overflow-x-auto pb-6">
                <DroppableColumn id="priority" title="High Priority" players={boardData.priority.map(id => players.find(p=>p.id===id)).filter(Boolean)} onPlayerClick={onSelect} />
                <DroppableColumn id="interested" title="Interested / Watch" players={boardData.interested.map(id => players.find(p=>p.id===id)).filter(Boolean)} onPlayerClick={onSelect} />
                <DroppableColumn id="pass" title="Pass / Archive" players={boardData.pass.map(id => players.find(p=>p.id===id)).filter(Boolean)} onPlayerClick={onSelect} />
             </div>
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="animate-in fade-in slide-in-from-right-4">
            <div className="mb-8 p-6 bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row items-center justify-between gap-5">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-50 rounded-2xl"><GitCompare className="text-purple-500 shrink-0" size={24} /></div>
                  <div>
                    <h3 className="text-lg font-extrabold uppercase tracking-tight text-slate-900" style={displayFont}>Head-to-Head Comparison</h3>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase mt-0.5">Select up to 4 athletes to compare metrics side-by-side.</p>
                  </div>
               </div>
               <div className="w-full md:w-80">
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all cursor-pointer" value="" onChange={(e) => { if (e.target.value && compareIds.length < 4 && !compareIds.includes(e.target.value)) setCompareIds([...compareIds, e.target.value]); }}>
                    <option value="" disabled>+ Add Athlete to Compare</option>
                    {players.filter(p => !compareIds.includes(p.id)).sort((a,b) => a.name.localeCompare(b.name)).map(p => <option key={p.id} value={p.id}>{p.name} ({p.primaryPos}) - {p.dnaScore}</option>)}
                  </select>
               </div>
            </div>

            {compareIds.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
                <GitCompare size={48} className="mx-auto text-slate-200 mb-4" />
                <h4 className="text-lg font-bold text-slate-800 uppercase tracking-tight" style={displayFont}>No Athletes Selected</h4>
                <p className="text-sm text-slate-400 mt-2 font-medium">Use the dropdown above to add prospects to your comparison matrix.</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr>
                        <th className="p-5 border-b border-r border-slate-100 bg-slate-50/80 w-48 align-bottom">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Measured Metric</span>
                        </th>
                        {compareIds.map(id => {
                          const p = players.find(player => player.id === id); if (!p) return null;
                          return (
                            <th key={p.id} className="p-5 border-b border-r last:border-r-0 border-slate-100 text-center relative w-64 bg-white">
                              <button onClick={() => setCompareIds(compareIds.filter(cid => cid !== p.id))} className="absolute top-4 right-4 text-rose-400 hover:bg-rose-50 hover:text-rose-600 p-1.5 rounded-full transition-colors"><X size={16}/></button>
                              <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-20 h-20 mx-auto rounded-full object-cover mb-3 border border-slate-200" alt={p.name} />
                              <div className="font-extrabold text-slate-900 uppercase text-sm tracking-tight cursor-pointer hover:text-[#1c7ed6] transition-colors" style={displayFont} onClick={() => onSelect(p)}>{p.name}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-3">{p.primaryPos} • Class of {p.gradYear}</div>
                              <BoardStatusDropdown playerId={p.id} className="w-full" />
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {[
                        { label: 'DNA Score', key: 'dnaScore' }, { label: 'High School GPA', key: 'gpa' }, { label: 'State / Location', key: 'state' }, { label: '40-Yd Dash', key: 'metrics.sprint' }, { label: '5-10-5 Shuttle', key: 'metrics.shuttle' }, { label: 'L-Drill', key: 'metrics.lDrill' }, { label: 'Max Speed', key: 'metrics.mph' }, { label: 'Broad Jump', key: 'metrics.broad' }, { label: 'Vertical Jump', key: 'metrics.vertical' }, { label: 'Catching %', key: 'metrics.catching' }, { label: 'Throwing %', key: 'metrics.throwing' }
                      ].map((metric, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="p-4 border-r border-slate-100 bg-slate-50/30 text-xs font-bold uppercase tracking-widest text-slate-600">{metric.label}</td>
                          {compareIds.map(id => {
                            const p = players.find(player => player.id === id);
                            if (!p) return <td key={id} className="p-4 border-r border-slate-100"></td>;
                            const val = metric.key.includes('.') ? p.metrics?.[metric.key.split('.')[1]] : p[metric.key];
                            return (
                              <td key={id} className={`p-4 text-center border-r last:border-r-0 border-slate-100 ${metric.key === 'dnaScore' ? 'bg-slate-50/30' : ''}`}>
                                {metric.key === 'dnaScore' ? <span className="font-black text-2xl text-[#d6336c]" style={displayFont}>{val || '0.0'}</span> : <span className="font-semibold text-sm text-slate-700">{val || '-'}</span>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr className="bg-slate-50/30">
                        <td className="p-4 border-r border-slate-100 text-xs font-bold uppercase tracking-widest text-slate-600 align-middle">Highlight Film</td>
                        {compareIds.map(id => {
                          const p = players.find(player => player.id === id);
                          return (
                            <td key={id} className="p-4 text-center border-r last:border-r-0 border-slate-100">
                               {p?.hudlLink ? <a href={p.hudlLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-white bg-slate-900 px-4 py-2 rounded-lg hover:bg-[#1c7ed6] transition-colors uppercase tracking-wide shadow-sm"><Video size={14}/> Film</a> : <span className="text-sm font-medium text-slate-400">-</span>}
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="bg-slate-100/60 border-t-2 border-slate-200">
                        <td className="p-4 border-r border-slate-200 text-xs font-black uppercase tracking-widest text-slate-700 align-middle">Board Status</td>
                        {compareIds.map(id => <td key={id} className="p-4 text-center border-r last:border-r-0 border-slate-200"><BoardStatusDropdown playerId={id} className="w-full" /></td>)}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DndContext>
  );
};