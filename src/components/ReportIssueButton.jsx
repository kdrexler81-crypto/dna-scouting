// src/components/ReportIssueButton.jsx
import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { Flag, X, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ReportIssueButton = () => {
  const { db, appId, user } = useApp();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('Outdated College / Coach Info');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      const pageUrl = window.location.pathname;

      if (db && appId && user) {
        await addDoc(
          collection(db, 'artifacts', appId, 'public', 'data', 'pendingCollegeUpdates'),
          {
            title: `[${category}] ${message.trim()} (Page: ${pageUrl})`,
            type: 'SITE ISSUE',
            link: window.location.href,
            source: user.email || 'Logged-in User',
            status: 'pending',
            timestamp: Date.now()
          }
        );
      } else {
        const subject = encodeURIComponent(`DNA Flag Ratings Issue: ${category}`);
        const body = encodeURIComponent(`Page: ${window.location.href}\n\nDetails:\n${message.trim()}`);
        window.location.href = `mailto:info@dnaflagfootball.com?subject=${subject}&body=${body}`;
      }

      setSubmitted(true);
      setMessage('');
      setTimeout(() => {
        setSubmitted(false);
        setOpen(false);
      }, 2000);
    } catch (err) {
      alert('Could not send report: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Lower-Right Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 bg-slate-900 hover:bg-[#d6336c] text-white text-[11px] font-extrabold uppercase tracking-wider px-4 py-3 rounded-full shadow-2xl border border-white/15 flex items-center gap-2 transition-all hover:-translate-y-0.5"
      >
        <Flag size={13} className="text-[#d6336c] group-hover:text-white" />
        Report Issue
      </button>

      {/* Popup Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Flag size={15} className="text-[#d6336c]" /> Report an Issue
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {submitted ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
                <p className="text-sm font-extrabold text-slate-900">Thanks for the heads up!</p>
                <p className="text-xs text-slate-500">Our team has received your report.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                    What needs attention?
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1c7ed6]"
                  >
                    <option>Outdated College / Coach Info</option>
                    <option>Athlete Profile Correction</option>
                    <option>Broken Link or Video</option>
                    <option>Website Bug / Suggestion</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                    Details
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Tell us what looks off or what we should update..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#1c7ed6]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="w-full py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Submit Report
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};