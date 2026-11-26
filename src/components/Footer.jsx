// src/components/Footer.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MapPin, Camera, ArrowRight, CheckCircle2, X, FileText } from 'lucide-react';

// Optional: Paste your hosted MailerLite or Jotform links below anytime
const MAILERLITE_FORM_URL = '';
const CONTACT_FORM_URL = 'https://form.jotform.com/262914891648168';

const LEGAL_DOCS = {
  privacy: {
    title: 'Privacy Policy',
    body: 'DNA Athletics LLC ("DNA Flag Ratings") respects the privacy of our athletes, parents, and coaches. Athlete profiles only display information submitted by verified DNA clinic staff or authorized family account holders. We never sell personal contact information to third parties. Families may update or delete their athlete profile at any time from their Family Dashboard or by emailing info@dnaflagfootball.com.'
  },
  refund: {
    title: 'Refund Policy',
    body: 'DNA Flag Ratings athlete profiles and directory browsing are free to access. For paid DNA Flag Football clinics, training cohorts, or showcases, refund or credit requests must be submitted prior to the event date by emailing info@dnaflagfootball.com. Weather cancellations are rescheduled or credited toward a future DNA event.'
  },
  terms: {
    title: 'Terms and Conditions',
    body: 'By using dnaflagratings.com, you agree to provide accurate athletic and academic information. Clinic-verified metrics (DNA Score, laser times, and agility drills) are locked and maintained exclusively by DNA staff. College directory listings are updated regularly for informational purposes; families should always confirm scholarship and roster details directly with each institution.'
  }
};

export const Footer = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [activeLegal, setActiveLegal] = useState(null); // 'privacy' | 'refund' | 'terms' | null

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    if (MAILERLITE_FORM_URL) {
      window.open(MAILERLITE_FORM_URL, '_blank', 'noreferrer');
    } else {
      window.location.href = `mailto:info@dnaflagfootball.com?subject=Subscribe%20to%20DNA%20Weekly%20Briefing&body=Please%20add%20${encodeURIComponent(email.trim())}%20to%20the%20weekly%20girls%27%20flag%20football%20mailing%20list.`;
    }
    setSubscribed(true);
    setEmail('');
  };

  return (
    <>
      <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Brand */}
          <div className="space-y-3">
            <h3 className="text-2xl font-extrabold uppercase tracking-wider text-white font-display">
              DNA Flag <span className="text-[#d6336c]">Ratings</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verified clinic metrics, national prospect rankings, and a live college directory built for women's flag football.
            </p>
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-400 pt-1">
              <MapPin size={14} className="text-[#d6336c]" /> Northern New Jersey
            </p>
          </div>

          {/* Column 2: Explore & Policies */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-white">
              Links & Policies
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-400">
              <li>
                <button onClick={() => navigate('/')} className="hover:text-white transition-colors">
                  Prospect Leaderboard
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/colleges')} className="hover:text-white transition-colors">
                  College Flag Directory
                </button>
              </li>
              <li className="pt-2 border-t border-slate-800/80">
                <button onClick={() => setActiveLegal('privacy')} className="hover:text-white transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => setActiveLegal('refund')} className="hover:text-white transition-colors">
                  Refund Policy
                </button>
              </li>
              <li>
                <button onClick={() => setActiveLegal('terms')} className="hover:text-white transition-colors">
                  Terms and Conditions
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Weekly Roundup / Mailing List */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-white">
              Weekly Flag Briefing
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Weekly women's flag football news, clinic dates, and new college programs. Unsubscribe anytime.
            </p>

            {subscribed ? (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                <CheckCircle2 size={15} /> You're subscribed!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2 pt-1">
                <input
                  type="email"
                  required
                  placeholder="Enter your email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-[#1c7ed6]"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white flex items-center justify-center gap-1.5 hover:opacity-95 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}
                >
                  Subscribe <ArrowRight size={13} />
                </button>
              </form>
            )}
          </div>

          {/* Column 4: Contact Info */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-white">
              Contact Info
            </h4>
            <div className="space-y-2.5 text-xs font-semibold">
              <a
                href={CONTACT_FORM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <FileText size={14} className="text-[#1c7ed6]" /> Fill out our Contact Form
              </a>
              <a
                href="mailto:info@dnaflagfootball.com"
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors pt-1"
              >
                <Mail size={14} className="text-[#1c7ed6]" /> info@dnaflagfootball.com
              </a>
              <a
                href="https://www.instagram.com/dna_girlsflagfootball/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <Camera size={14} className="text-pink-400" /> @dna_girlsflagfootball
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="border-t border-slate-800/80 py-5 px-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-semibold text-slate-500">
            <p>© {new Date().getFullYear()} DNA Athletics LLC / DNA Flag Ratings. All rights reserved.</p>
            <p>Built for Girls' Flag Football</p>
          </div>
        </div>
      </footer>

      {/* Legal Policy Modal */}
      {activeLegal && LEGAL_DOCS[activeLegal] && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xl font-extrabold uppercase tracking-tight text-slate-900 font-display">
                {LEGAL_DOCS[activeLegal].title}
              </h3>
              <button
                type="button"
                onClick={() => setActiveLegal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {LEGAL_DOCS[activeLegal].body}
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveLegal(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-[#1c7ed6] text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};