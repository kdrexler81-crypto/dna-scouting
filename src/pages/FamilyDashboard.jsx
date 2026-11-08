// src/pages/FamilyDashboard.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Shield, Clock, CheckCircle2, XCircle, Loader2, User, Mail, Building, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext';

const displayFont = { fontFamily: "'Outfit', sans-serif" };

export const FamilyDashboard = ({ onLogout }) => {
  const { app, appId, db, familyData: user } = useApp();

  const [messages, setMessages] = useState([]);
  const [loadingAction, setLoadingAction] = useState(null);
  const [viewMode, setViewMode] = useState('parent'); // 'parent' or 'athlete'

  useEffect(() => {
    if (!user?.email || !db) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), where("guardianEmail", "==", user.email));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = []; snap.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
      msgs.sort((a,b) => b.timestamp - a.timestamp);
      setMessages(msgs);
    });
    return () => unsub();
  }, [user, db, appId]);

  const handleModerate = async (msgId, action) => {
    setLoadingAction(msgId);
    try {
      const moderateMessage = httpsCallable(getFunctions(app), 'moderateMessage');
      await moderateMessage({ messageId: msgId, action, appId });
    } catch (e) { alert("Error updating message: " + e.message); }
    setLoadingAction(null);
  };

  const pendingMessages = messages.filter(m => m.status === 'pending');
  const approvedMessages = messages.filter(m => m.status === 'approved');

  return (
    <div className="max-w-4xl mx-auto p-4 py-8 animate-in fade-in">
      
      {/* GLOBAL HEADER */}
      <div className={`rounded-3xl p-8 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 mb-8 border transition-colors ${viewMode === 'parent' ? 'bg-slate-900 border-slate-800 border-t-4 border-t-[#059669]' : 'bg-white border-slate-100 border-t-4 border-t-[#1c7ed6]'}`}>
        <div className="flex items-center gap-5">
          <div className={`p-4 rounded-2xl ${viewMode === 'parent' ? 'bg-white/10' : 'bg-blue-50 border border-blue-100'}`}>
            {viewMode === 'parent' ? <Shield size={28} className="text-emerald-400" /> : <User size={28} className="text-[#1c7ed6]" />}
          </div>
          <div>
            <h2 className={`text-2xl font-extrabold uppercase tracking-tight ${viewMode === 'parent' ? 'text-white' : 'text-slate-900'}`} style={displayFont}>
              {viewMode === 'parent' ? 'Family Inbox' : 'Athlete Locker Room'}
            </h2>
            <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${viewMode === 'parent' ? 'text-emerald-400' : 'text-slate-400'}`}>
              Account: {user?.email}
            </p>
          </div>
        </div>
        <button onClick={onLogout} className={`text-xs font-bold border px-5 py-2.5 rounded-full uppercase tracking-wider transition-colors ${viewMode === 'parent' ? 'text-rose-400 border-rose-400/30 bg-rose-400/10 hover:bg-rose-400 hover:text-white' : 'text-rose-500 border-rose-200 bg-rose-50 hover:bg-rose-100'}`}>
          Sign Out
        </button>
      </div>

      {/* VIEW TOGGLE */}
      <div className="flex bg-white rounded-full p-1.5 shadow-sm border border-slate-100 mb-8 max-w-sm mx-auto">
        <button onClick={() => setViewMode('parent')} className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-2 transition-all ${viewMode === 'parent' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Shield size={14} /> Parent Mode
        </button>
        <button onClick={() => setViewMode('athlete')} className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-2 transition-all ${viewMode === 'athlete' ? 'bg-[#1c7ed6] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Trophy size={14} /> Athlete Mode
        </button>
      </div>

      {/* PARENT VIEW (MODERATION HUB) */}
      {viewMode === 'parent' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
          <div className="bg-white rounded-3xl border border-amber-200 shadow-md overflow-hidden">
            <div className="bg-amber-50 border-b border-amber-100 p-5 flex items-center gap-3">
              <Clock className="text-amber-500" size={20} />
              <h3 className="font-extrabold text-amber-900 uppercase tracking-widest text-sm">Action Required: Pending Approvals</h3>
              <span className="ml-auto bg-amber-200 text-amber-800 font-bold px-3 py-1 rounded-full text-xs">{pendingMessages.length}</span>
            </div>
            <div className="p-6">
              {pendingMessages.length === 0 ? <p className="text-sm text-slate-500 italic">No pending messages from recruiters.</p> : 
                pendingMessages.map(msg => (
                  <div key={msg.id} className="mb-4 last:mb-0 border border-slate-200 rounded-2xl p-5 bg-slate-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-extrabold text-slate-900 text-sm uppercase">{msg.senderName} <span className="text-slate-400 lowercase font-medium">from</span> <span className="text-[#1c7ed6]">{msg.senderSchool}</span></p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Message for: {msg.athleteName}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">{new Date(msg.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 text-sm text-slate-700 leading-relaxed italic">"{msg.content}"</div>
                    <div className="flex gap-3">
                      <button onClick={() => handleModerate(msg.id, 'approve')} disabled={loadingAction === msg.id} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl uppercase tracking-wider text-[11px] flex justify-center items-center gap-2 transition-colors">
                        {loadingAction === msg.id ? <Loader2 size={14} className="animate-spin"/> : <><CheckCircle2 size={16}/> Approve Message</>}
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

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500" size={20} />
              <h3 className="font-extrabold text-slate-700 uppercase tracking-widest text-sm">Approved Messages History</h3>
            </div>
            <div className="p-6">
              {approvedMessages.length === 0 ? <p className="text-sm text-slate-500 italic">No approved messages yet.</p> : 
                approvedMessages.map(msg => (
                  <div key={msg.id} className="mb-4 last:mb-0 border border-slate-100 rounded-2xl p-5">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-extrabold text-slate-900 text-sm uppercase">{msg.senderName} <span className="text-[#1c7ed6]">{msg.senderSchool}</span></p>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-bold uppercase tracking-wider">Approved</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">For: {msg.athleteName}</p>
                    <p className="text-sm text-slate-700 leading-relaxed">"{msg.content}"</p>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* ATHLETE VIEW (CLEAN INBOX) */}
      {viewMode === 'athlete' && (
        <div className="animate-in fade-in slide-in-from-right-4">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#1c7ed6]"></div>
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-blue-100">
              <Mail className="text-[#1c7ed6]" size={28}/>
            </div>
            <h3 className="text-2xl font-extrabold uppercase tracking-tight text-slate-900" style={displayFont}>My Recruiting Inbox</h3>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-2">Only messages approved by your guardian appear here.</p>
          </div>

          <div className="space-y-5">
             {approvedMessages.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4"><Building className="text-slate-300" size={24}/></div>
                  <p className="text-slate-900 font-extrabold uppercase tracking-tight text-lg" style={displayFont}>Inbox Empty</p>
                  <p className="text-slate-500 text-sm font-medium mt-2 max-w-sm mx-auto">Keep grinding on the field! When college scouts reach out through the DNA network, your approved messages will appear here.</p>
                </div>
             ) : (
                approvedMessages.map(msg => (
                  <div key={msg.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:border-[#1c7ed6]/40 hover:shadow-md transition-all group">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 pb-5 border-b border-slate-50 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100 shrink-0 group-hover:bg-[#1c7ed6] transition-colors"><Building className="text-[#1c7ed6] group-hover:text-white transition-colors" size={20}/></div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-lg uppercase tracking-tight" style={displayFont}>{msg.senderSchool}</p>
                          <p className="text-[10px] font-bold text-[#1c7ed6] uppercase tracking-widest mt-0.5">Coach {msg.senderName}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full border border-slate-100">{new Date(msg.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-sm font-medium whitespace-pre-wrap">"{msg.content}"</p>
                  </div>
                ))
             )}
          </div>
        </div>
      )}

    </div>
  );
};