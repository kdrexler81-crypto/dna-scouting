// src/pages/FamilyDashboard.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Shield, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const displayFont = { fontFamily: "'Outfit', sans-serif" };

// NOTICE: Added 'export' and the Firebase props (app, appId, db)
export const FamilyDashboard = ({ app, appId, db, user, onLogout }) => {
  
  // ... [THE REST OF YOUR PASTED FamilyDashboard CODE] ...

};

// --- FAMILY DASHBOARD ---
const FamilyDashboard = ({ user, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [loadingAction, setLoadingAction] = useState(null);

  useEffect(() => {
    if (!user?.email || !isFirebaseActive) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), where("guardianEmail", "==", user.email));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = []; snap.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
      msgs.sort((a,b) => b.timestamp - a.timestamp);
      setMessages(msgs);
    });
    return () => unsub();
  }, [user]);

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
      <div className="bg-slate-900 rounded-3xl p-8 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 mb-8 border border-slate-800" style={{ borderTop: '4px solid #059669' }}>
        <div className="flex items-center gap-5">
          <div className="p-4 bg-white/10 rounded-2xl"><Shield size={28} className="text-emerald-400" /></div>
          <div>
            <h2 className="text-2xl font-extrabold text-white uppercase tracking-tight" style={displayFont}>Family Inbox</h2>
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mt-1">Logged in as {user?.email}</p>
          </div>
        </div>
        <button onClick={onLogout} className="text-xs font-bold text-rose-400 border border-rose-400/30 bg-rose-400/10 px-5 py-2.5 rounded-full hover:bg-rose-400 hover:text-white transition-colors uppercase tracking-wider">Sign Out</button>
      </div>

      <div className="space-y-8">
        <div className="bg-white rounded-3xl border border-amber-200 shadow-md overflow-hidden">
          <div className="bg-amber-50 border-b border-amber-100 p-5 flex items-center gap-3">
            <Clock className="text-amber-500" size={20} />
            <h3 className="font-extrabold text-amber-900 uppercase tracking-widest text-sm">Action Required: Pending Coach Messages</h3>
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
            <h3 className="font-extrabold text-slate-700 uppercase tracking-widest text-sm">Approved Messages</h3>
          </div>
          <div className="p-6">
            {approvedMessages.length === 0 ? <p className="text-sm text-slate-500 italic">No approved messages yet.</p> : 
              approvedMessages.map(msg => (
                <div key={msg.id} className="mb-4 last:mb-0 border border-slate-100 rounded-2xl p-5">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-extrabold text-slate-900 text-sm uppercase">{msg.senderName} • <span className="text-[#1c7ed6]">{msg.senderSchool}</span></p>
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
    </div>
  );
};