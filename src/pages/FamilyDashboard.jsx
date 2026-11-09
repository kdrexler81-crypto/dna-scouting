// src/pages/FamilyDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Shield, Clock, CheckCircle2, XCircle, Loader2, User, Mail, Building, Trophy, Send, Check, CheckCheck, AlertCircle, Search, ExternalLink, GraduationCap, MapPin, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';

// 1. IMPORT THE NEW DATABASE (This replaces the old hardcoded array)
import COLLEGES_DB from '../data/colleges.json';

const displayFont = { fontFamily: "'Outfit', sans-serif" };

export const FamilyDashboard = ({ viewMode, onLogout }) => {
  const { app, appId, db, familyData: user, players } = useApp();

  // --- PARENT STATE ---
  const [parentMessages, setParentMessages] = useState([]);
  const [loadingAction, setLoadingAction] = useState(null);

  // --- ATHLETE STATE ---
  const activeAthlete = players.find(p => p.athleteEmail?.toLowerCase() === user?.email?.toLowerCase());
  const [athleteTab, setAthleteTab] = useState('inbox'); 
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  
  // OUTBOUND ENGINE STATE
  const [collegeSearch, setCollegeSearch] = useState('');
  const [collegeDivision, setCollegeDivision] = useState('All'); 

  // DATA FETCHING: PARENT MODERATION QUEUE
  useEffect(() => {
    if (viewMode !== 'parent' || !user?.email || !db) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), where("guardianEmail", "==", user.email));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = []; snap.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
      msgs.sort((a,b) => b.timestamp - a.timestamp);
      setParentMessages(msgs);
    });
    return () => unsub();
  }, [viewMode, user, db, appId]);

  // DATA FETCHING: ATHLETE THREADS
  useEffect(() => {
    if (viewMode !== 'athlete' || !activeAthlete || !db) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'threads'), where("athleteId", "==", activeAthlete.id));
    const unsub = onSnapshot(q, (snap) => {
      const th = []; snap.forEach(doc => th.push({ id: doc.id, ...doc.data() }));
      th.sort((a,b) => b.lastUpdate - a.lastUpdate);
      setThreads(th);
    });
    return () => unsub();
  }, [viewMode, activeAthlete, db, appId]);

  // DATA FETCHING: ATHLETE ACTIVE THREAD MESSAGES
  useEffect(() => {
    if (viewMode !== 'athlete' || !activeThread || !db) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), where("threadId", "==", activeThread.threadId));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = []; snap.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
      msgs.sort((a,b) => a.timestamp - b.timestamp);
      setThreadMessages(msgs);

      msgs.forEach(m => {
        if (m.senderRole === 'scout' && m.status === 'approved' && !m.readAt) {
          httpsCallable(getFunctions(app), 'markMessageRead')({ messageId: m.id, appId }).catch(console.error);
        }
      });
    });
    return () => unsub();
  }, [viewMode, activeThread, db, appId, app]);

  // PARENT ACTION: APPROVE/REJECT
  const handleModerate = async (msgId, action) => {
    setLoadingAction(msgId);
    try {
      const moderateMessage = httpsCallable(getFunctions(app), 'moderateMessage');
      await moderateMessage({ messageId: msgId, action, appId });
    } catch (e) { alert("Error updating message: " + e.message); }
    setLoadingAction(null);
  };

  // ATHLETE ACTION: SEND REPLY
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !activeThread || !activeAthlete) return;
    setSendingReply(true);
    try {
      const sendMessage = httpsCallable(getFunctions(app), 'sendMessage');
      await sendMessage({ 
        athleteId: activeAthlete.id, scoutId: activeThread.scoutId, content: replyContent, senderRole: 'athlete', appId 
      });
      setReplyContent('');
    } catch (err) { alert("Failed to send message: " + err.message); }
    setSendingReply(false);
  };

  // ATHLETE ACTION: AUTO-GENERATE OUTBOUND EMAIL
  const generateOutboundEmail = (college) => {
    if (!activeAthlete) return;

    // Smart Fallback: If no email is available, run a Google search for their staff directory
    if (!college.email) {
      const searchQuery = `${college.name} women's flag football coach email staff directory`;
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
      return;
    }

    const coachLastName = college.coach && college.coach !== 'TBA' ? college.coach.split(' ').pop() : 'Coach';
    const subject = `${activeAthlete.gradYear} Prospect - ${activeAthlete.name} - ${activeAthlete.primaryPos} - DNA Score: ${activeAthlete.dnaScore}`;
    const body = `Coach ${coachLastName},\n\n` +
      `My name is ${activeAthlete.name} and I am a ${activeAthlete.gradYear} ${activeAthlete.primaryPos} from ${activeAthlete.state}. I am very interested in ${college.name}'s women's flag football program and would love to learn more about your recruiting process.\n\n` +
      `Here are my verified DNA Athletics metrics:\n` +
      `- DNA Score: ${activeAthlete.dnaScore}/10.0\n` +
      `- 40-Yd Dash: ${activeAthlete.metrics?.sprint || 'N/A'}\n` +
      `- Shuttle: ${activeAthlete.metrics?.shuttle || 'N/A'}\n` +
      `- GPA: ${activeAthlete.gpa || 'N/A'}\n\n` +
      `Highlight Film: ${activeAthlete.hudlLink || '[Insert Hudl Link Here]'}\n` +
      `Verified Profile: https://www.dnaflagratings.com/player/${activeAthlete.id}\n\n` +
      `I would love to connect to discuss how I could be a fit for your program.\n\n` +
      `Best regards,\n${activeAthlete.name}\n${activeAthlete.athletePhone || ''}\n${activeAthlete.athleteEmail}`;
    
    window.open(`mailto:${college.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  // SMART FILTERING ALGORITHM
  const filteredColleges = useMemo(() => {
    return COLLEGES_DB.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(collegeSearch.toLowerCase()) || 
                            c.state.toLowerCase().includes(collegeSearch.toLowerCase());
      const matchesDiv = collegeDivision === 'All' || c.division.includes(collegeDivision);
      return matchesSearch && matchesDiv;
    });
  }, [collegeSearch, collegeDivision]);

  const pendingInbound = parentMessages.filter(m => m.status === 'pending' && m.senderRole === 'scout');
  const pendingOutbound = parentMessages.filter(m => m.status === 'draft' && m.senderRole === 'athlete');
  const approvedHistory = parentMessages.filter(m => m.status === 'approved');

  return (
    <div className="max-w-7xl mx-auto p-4 py-8 animate-in fade-in">
      
      {/* GLOBAL HEADER */}
      <div className={`rounded-3xl p-8 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 mb-8 border transition-colors ${viewMode === 'parent' ? 'bg-slate-900 border-slate-800 border-t-4 border-t-[#059669]' : 'bg-white border-slate-100 border-t-4 border-t-[#8b5cf6]'}`}>
        <div className="flex items-center gap-5">
          <div className={`p-4 rounded-2xl ${viewMode === 'parent' ? 'bg-white/10' : 'bg-violet-50 border border-violet-100'}`}>
            {viewMode === 'parent' ? <Shield size={28} className="text-emerald-400" /> : <User size={28} className="text-violet-500" />}
          </div>
          <div>
            <h2 className={`text-2xl font-extrabold uppercase tracking-tight ${viewMode === 'parent' ? 'text-white' : 'text-slate-900'}`} style={displayFont}>
              {viewMode === 'parent' ? 'Family Inbox' : 'Athlete Locker Room'}
            </h2>
            <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${viewMode === 'parent' ? 'text-emerald-400' : 'text-violet-500'}`}>
              Account: {user?.email}
            </p>
          </div>
        </div>
        <button onClick={onLogout} className={`text-xs font-bold border px-5 py-2.5 rounded-full uppercase tracking-wider transition-colors ${viewMode === 'parent' ? 'text-rose-400 border-rose-400/30 bg-rose-400/10 hover:bg-rose-400 hover:text-white' : 'text-rose-500 border-rose-200 bg-rose-50 hover:bg-rose-100'}`}>
          Sign Out
        </button>
      </div>

      {/* PARENT VIEW (MODERATION HUB) */}
      {viewMode === 'parent' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 max-w-4xl mx-auto">
          {/* QUEUE 1: INBOUND FROM SCOUTS */}
          <div className="bg-white rounded-3xl border border-amber-200 shadow-md overflow-hidden">
            <div className="bg-amber-50 border-b border-amber-100 p-5 flex items-center gap-3">
              <Clock className="text-amber-500" size={20} />
              <h3 className="font-extrabold text-amber-900 uppercase tracking-widest text-sm">Action Required: Inbound Scout Messages</h3>
              <span className="ml-auto bg-amber-200 text-amber-800 font-bold px-3 py-1 rounded-full text-xs">{pendingInbound.length}</span>
            </div>
            <div className="p-6">
              {pendingInbound.length === 0 ? <p className="text-sm text-slate-500 italic">No pending inbound messages from recruiters.</p> : 
                pendingInbound.map(msg => (
                  <div key={msg.id} className="mb-4 last:mb-0 border border-slate-200 rounded-2xl p-5 bg-slate-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-extrabold text-slate-900 text-sm uppercase">{msg.senderName} <span className="text-slate-400 lowercase font-medium">from</span> <span className="text-[#1c7ed6]">{msg.senderSchool}</span></p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Message to: {msg.athleteName}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">{new Date(msg.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 text-sm text-slate-700 leading-relaxed italic whitespace-pre-wrap">"{msg.content}"</div>
                    <div className="flex gap-3">
                      <button onClick={() => handleModerate(msg.id, 'approve')} disabled={loadingAction === msg.id} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl uppercase tracking-wider text-[11px] flex justify-center items-center gap-2 transition-colors">
                        {loadingAction === msg.id ? <Loader2 size={14} className="animate-spin"/> : <><CheckCircle2 size={16}/> Approve & Forward to Athlete</>}
                      </button>
                      <button onClick={() => handleModerate(msg.id, 'reject')} disabled={loadingAction === msg.id} className="flex-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold py-3 rounded-xl uppercase tracking-wider text-[11px] flex justify-center items-center gap-2 transition-colors">
                        {loadingAction === msg.id ? <Loader2 size={14} className="animate-spin"/> : <><XCircle size={16}/> Reject & Block</>}
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* QUEUE 2: OUTBOUND FROM ATHLETE */}
          <div className="bg-white rounded-3xl border border-[#1c7ed6]/30 shadow-md overflow-hidden">
            <div className="bg-blue-50 border-b border-blue-100 p-5 flex items-center gap-3">
              <AlertCircle className="text-[#1c7ed6]" size={20} />
              <h3 className="font-extrabold text-blue-900 uppercase tracking-widest text-sm">Action Required: Athlete Draft Replies</h3>
              <span className="ml-auto bg-blue-200 text-blue-800 font-bold px-3 py-1 rounded-full text-xs">{pendingOutbound.length}</span>
            </div>
            <div className="p-6">
              {pendingOutbound.length === 0 ? <p className="text-sm text-slate-500 italic">No drafted replies pending approval.</p> : 
                pendingOutbound.map(msg => (
                  <div key={msg.id} className="mb-4 last:mb-0 border border-slate-200 rounded-2xl p-5 bg-slate-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-extrabold text-slate-900 text-sm uppercase">{msg.senderName} <span className="text-slate-400 lowercase font-medium">replying to</span> <span className="text-[#1c7ed6]">{msg.senderSchool}</span></p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">{new Date(msg.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 text-sm text-slate-700 leading-relaxed italic whitespace-pre-wrap">"{msg.content}"</div>
                    <div className="flex gap-3">
                      <button onClick={() => handleModerate(msg.id, 'approve')} disabled={loadingAction === msg.id} className="flex-1 bg-[#1c7ed6] hover:bg-blue-600 text-white font-bold py-3 rounded-xl uppercase tracking-wider text-[11px] flex justify-center items-center gap-2 transition-colors">
                        {loadingAction === msg.id ? <Loader2 size={14} className="animate-spin"/> : <><Send size={14}/> Approve & Send to College</>}
                      </button>
                      <button onClick={() => handleModerate(msg.id, 'reject')} disabled={loadingAction === msg.id} className="flex-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold py-3 rounded-xl uppercase tracking-wider text-[11px] flex justify-center items-center gap-2 transition-colors">
                        {loadingAction === msg.id ? <Loader2 size={14} className="animate-spin"/> : <><XCircle size={16}/> Delete Draft</>}
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* ATHLETE VIEW */}
      {viewMode === 'athlete' && (
        <div className="animate-in fade-in slide-in-from-right-4">
          {!activeAthlete ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-lg mx-auto mt-12">
              <AlertCircle size={48} className="mx-auto text-amber-400 mb-4" />
              <h3 className="text-xl font-extrabold uppercase tracking-tight text-slate-900" style={displayFont}>Profile Not Found</h3>
              <p className="text-sm font-medium text-slate-500 mt-2">Your email ({user?.email}) is not linked to an active athlete roster spot.</p>
            </div>
          ) : (
            <>
              {/* ATHLETE SUB-NAVIGATION */}
              <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                <button onClick={() => setAthleteTab('inbox')} className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${athleteTab === 'inbox' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}><Mail size={16} /> My Inbox</button>
                <button onClick={() => setAthleteTab('directory')} className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${athleteTab === 'directory' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}><Search size={16} /> College Directory</button>
              </div>

              {athleteTab === 'inbox' && (
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col md:flex-row overflow-hidden h-[700px] animate-in fade-in">
                  {/* THREAD LIST (LEFT SIDEBAR) */}
                  <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50 flex flex-col h-1/3 md:h-full">
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                      {threads.length === 0 ? (
                         <div className="text-center p-6 mt-4">
                           <Mail size={32} className="mx-auto text-slate-300 mb-3" />
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inbox Empty</p>
                           <p className="text-[10px] text-slate-500 mt-2">When colleges message you, they will appear here.</p>
                         </div>
                      ) : (
                         threads.map(t => (
                           <div key={t.threadId} onClick={() => setActiveThread(t)} className={`p-4 rounded-2xl cursor-pointer transition-all border ${activeThread?.threadId === t.threadId ? 'bg-white border-violet-300 shadow-sm' : 'border-transparent hover:bg-slate-100'}`}>
                             <div className="flex justify-between items-start mb-1">
                               <p className="font-extrabold text-sm text-slate-900 truncate pr-2 uppercase" style={displayFont}>{t.scoutSchool}</p>
                               <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">{new Date(t.lastUpdate).toLocaleDateString()}</span>
                             </div>
                             <p className="text-[10px] font-bold text-[#1c7ed6] uppercase tracking-widest mb-1.5">Coach {t.scoutName}</p>
                             <p className="text-xs text-slate-500 truncate">{t.lastMessagePreview}</p>
                           </div>
                         ))
                      )}
                    </div>
                  </div>

                  {/* CHAT WINDOW (RIGHT PANE) */}
                  <div className="w-full md:w-2/3 flex flex-col bg-white h-2/3 md:h-full">
                     {activeThread ? (
                       <>
                         <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white shadow-sm z-10">
                           <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100"><Building className="text-[#1c7ed6]" size={20}/></div>
                             <div>
                               <h3 className="font-extrabold text-lg text-slate-900 uppercase" style={displayFont}>{activeThread.scoutSchool}</h3>
                               <p className="text-[10px] font-bold text-[#1c7ed6] uppercase tracking-widest">Coach {activeThread.scoutName}</p>
                             </div>
                           </div>
                         </div>
                         
                         <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 flex flex-col gap-4">
                           {threadMessages.filter(m => m.senderRole === 'athlete' || m.status === 'approved').map(msg => {
                              const isAthlete = msg.senderRole === 'athlete';
                              return (
                                <div key={msg.id} className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isAthlete ? 'self-end items-end' : 'self-start items-start'}`}>
                                  <div className={`p-4 rounded-2xl ${isAthlete ? (msg.status === 'draft' ? 'bg-violet-400' : 'bg-violet-600') + ' text-white rounded-tr-sm shadow-md' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'}`}>
                                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-1.5 px-1">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                    {isAthlete && (
                                      <span className="text-slate-400">
                                        {msg.readAt ? <CheckCheck size={12} className="text-violet-500" /> : (msg.status === 'draft' ? <Clock size={10} /> : <Check size={12} />)}
                                      </span>
                                    )}
                                  </div>
                                  {isAthlete && msg.status === 'draft' && <span className="text-[8px] font-bold text-amber-500 uppercase tracking-widest pr-1 mt-0.5">Pending Parent Approval</span>}
                                </div>
                              )
                           })}
                         </div>
                         
                         <div className="p-4 bg-white border-t border-slate-100">
                           <form onSubmit={handleSendReply} className="flex gap-3 relative">
                             <input type="text" placeholder={`Draft reply to Coach ${activeThread.scoutName}...`} className="flex-1 bg-slate-50 border border-slate-200 rounded-full pl-5 pr-14 py-3 text-sm font-medium focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all" value={replyContent} onChange={e => setReplyContent(e.target.value)} />
                             <button type="submit" disabled={sendingReply || !replyContent.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white rounded-full flex items-center justify-center transition-colors shadow-sm">
                               {sendingReply ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
                             </button>
                           </form>
                         </div>
                       </>
                     ) : (
                       <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/30">
                         <Mail size={48} className="text-slate-200 mb-4" />
                         <h3 className="font-extrabold text-slate-400 uppercase tracking-tight text-xl" style={displayFont}>Select a Conversation</h3>
                         <p className="text-sm font-medium text-slate-400 mt-2 max-w-sm">Select an active recruiting thread from the sidebar to view messages and draft replies.</p>
                       </div>
                     )}
                  </div>
                </div>
              )}

              {/* OUTBOUND COLLEGE DIRECTORY TAB */}
              {athleteTab === 'directory' && (
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 md:p-8 animate-in fade-in">
                  
                  {/* NEW DIRECTORY HEADER W/ DROPDOWN */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 pb-6">
                    <div>
                      <h3 className="text-xl font-extrabold uppercase tracking-tight text-slate-900" style={displayFont}>NCAA & NAIA Directory</h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Take control of your recruiting. Reach out directly.</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      <select 
                        className="bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-violet-500/20 transition-all focus:outline-none cursor-pointer"
                        value={collegeDivision} 
                        onChange={(e) => setCollegeDivision(e.target.value)}
                      >
                        <option value="All">All Divisions</option>
                        <option value="NCAA DI">NCAA Division I</option>
                        <option value="NCAA DII">NCAA Division II</option>
                        <option value="NCAA DIII">NCAA Division III</option>
                        <option value="NAIA">NAIA</option>
                        <option value="NJCAA">NJCAA (JuCo)</option>
                        <option value="3C2A">3C2A (Cali JuCo)</option>
                        <option value="USCAA">USCAA</option>
                      </select>

                      <div className="relative w-full sm:w-72">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" placeholder="Search by name or state..." className="w-full bg-slate-50 border border-slate-200 rounded-full pl-11 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-violet-500/20 transition-all focus:outline-none" value={collegeSearch} onChange={(e) => setCollegeSearch(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredColleges.map((college) => (
                      <div key={college.id} className="border border-slate-200 rounded-2xl p-5 hover:border-violet-300 hover:shadow-md transition-all bg-slate-50/50 group flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-white border border-slate-200 rounded-xl group-hover:border-violet-300 transition-colors"><GraduationCap className="text-slate-700 group-hover:text-violet-600 transition-colors" size={20}/></div>
                          <span className="text-[10px] font-black text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full uppercase tracking-widest">{college.division}</span>
                        </div>
                        <h4 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight mb-1" style={displayFont}>{college.name}</h4>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                          <MapPin size={12}/> {college.state}
                        </div>
                        <div className="mt-auto pt-4 border-t border-slate-200/60">
                          <p className="text-[11px] font-semibold text-slate-500 mb-3">Head Coach: <span className="font-bold text-slate-900">{college.coach}</span></p>
                          <button 
                            onClick={() => generateOutboundEmail(college)} 
                            className={`w-full font-bold py-2.5 rounded-xl uppercase tracking-wider text-[11px] flex justify-center items-center gap-2 transition-all shadow-sm ${
                              college.email 
                                ? 'bg-violet-600 hover:bg-violet-700 text-white' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <FileText size={14} /> 
                            {college.email ? 'Auto-Generate Email' : 'Lookup Staff Directory'} 
                            <ExternalLink size={12} className="ml-1 opacity-50"/>
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredColleges.length === 0 && (
                      <div className="col-span-full text-center py-12 text-slate-400 text-sm font-medium">No colleges match your search.</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

    </div>
  );
};