import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { CheckCircle, Trash2, ShieldAlert, Loader2, Building, Clock } from 'lucide-react';

export const AdminScoutApproval = ({ db, appId }) => {
  const [pendingScouts, setPendingScouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (db && appId) {
      fetchPendingScouts();
    }
  }, [db, appId]);

  const fetchPendingScouts = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, `artifacts/${appId}/public/data/recruiters`),
        where('approved', '==', false)
      );
      const snapshot = await getDocs(q);
      const scouts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingScouts(scouts);
    } catch (error) {
      console.error("Error fetching pending scouts:", error);
    }
    setLoading(false);
  };

  const handleApprove = async (scoutId) => {
    setProcessingId(scoutId);
    try {
      const scoutRef = doc(db, `artifacts/${appId}/public/data/recruiters`, scoutId);
      await updateDoc(scoutRef, { approved: true });
      setPendingScouts(prev => prev.filter(scout => scout.id !== scoutId));
    } catch (error) {
      alert("Failed to approve scout: " + error.message);
    }
    setProcessingId(null);
  };

  const handleReject = async (scoutId) => {
    if (!window.confirm("Are you sure you want to permanently delete this scout request?")) return;
    setProcessingId(scoutId);
    try {
      const scoutRef = doc(db, `artifacts/${appId}/public/data/recruiters`, scoutId);
      await deleteDoc(scoutRef);
      setPendingScouts(prev => prev.filter(scout => scout.id !== scoutId));
    } catch (error) {
      alert("Failed to delete scout: " + error.message);
    }
    setProcessingId(null);
  };

  if (loading) return <div className="p-8 text-center text-slate-500"><Loader2 className="animate-spin inline mr-2" size={20}/> Loading pending scouts...</div>;

  return (
    <div className="animate-in fade-in slide-in-from-right-4">
      <h3 className="text-2xl font-extrabold text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-3 font-['Outfit']">
        <Building size={24} className="text-[#1c7ed6]"/> Scout Database Approvals
      </h3>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
          <ShieldAlert className="text-amber-500" size={20} />
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Pending Approvals</h2>
          <span className="ml-auto bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
            {pendingScouts.length} Awaiting
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {pendingScouts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium">No pending scouts to approve.</div>
          ) : (
            pendingScouts.map((scout) => (
              <div key={scout.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{scout.name}</h3>
                  <p className="text-sm text-slate-600 font-medium">{scout.school}</p>
                  <p className="text-xs text-slate-400 mt-1">{scout.email}</p>
                </div>
                
                <div className="flex items-center gap-3 mt-2 sm:mt-0">
                  <button 
                    onClick={() => handleReject(scout.id)}
                    disabled={processingId === scout.id}
                    className="flex items-center justify-center p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button 
                    onClick={() => handleApprove(scout.id)}
                    disabled={processingId === scout.id}
                    className="flex items-center gap-2 bg-[#1c7ed6] hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50"
                  >
                    {processingId === scout.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    Approve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};