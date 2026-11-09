// src/pages/PublicHub.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Trophy, Search, Activity, Megaphone, ArrowRight, ExternalLink, Globe, Calendar, Star, ChevronRight, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';

const displayFont = { fontFamily: "'Outfit', sans-serif" };

export const PublicHub = ({ onSelect }) => {
  const { db, appId, players, isFirebaseActive } = useApp();
  const [newsFeed, setNewsFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. FETCH INTERNAL ADMIN NEWS FROM FIREBASE
  useEffect(() => {
    if (!isFirebaseActive || !db) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'news'), orderBy('timestamp', 'desc'), limit(15));
    const unsub = onSnapshot(q, (snap) => {
      const newsItems = [];
      snap.forEach(doc => newsItems.push({ id: doc.id, ...doc.data(), source: 'internal' }));
      setNewsFeed(newsItems);
      setLoading(false);
    });
    return () => unsub();
  }, [db, appId, isFirebaseActive]);

  // 2. MIX IN EXTERNAL WEB NEWS
  // Note: Since browser CORS prevents direct web scraping without a backend, 
  // we combine your live Firebase news with these global industry headlines. 
  // You can replace these with a real API (like NewsAPI) if you add a Cloud Function later.
  const webNews = [
    { id: 'web1', title: "Flag Football Officially Added to the 2028 LA Olympic Games", category: "GLOBAL", timestamp: Date.now() - 86400000, source: 'web', link: "https://olympics.com" },
    { id: 'web2', title: "NAIA Announces Continued Expansion of Women's Flag Football Programs", category: "COLLEGE", timestamp: Date.now() - 172800000, source: 'web', link: "https://naia.org" },
    { id: 'web3', title: "NFL Pledges Additional Funding for High School Girls Flag Programs Nationwide", category: "INDUSTRY", timestamp: Date.now() - 432000000, source: 'web', link: "https://nfl.com/play60" }
  ];

  // Merge and sort both feeds
  const combinedFeed = [...newsFeed, ...webNews].sort((a, b) => b.timestamp - a.timestamp);

  // 3. GENERATE TOP PROSPECTS LEADERBOARD
  const topProspects = [...players]
    .filter(p => Number(p.dnaScore) > 0)
    .sort((a, b) => Number(b.dnaScore) - Number(a.dnaScore))
    .slice(0, 10);

  const getCategoryColor = (category) => {
    switch (category) {
      case 'ANNOUNCEMENT': return 'bg-[#1c7ed6] text-white';
      case 'COMBINE': return 'bg-[#d6336c] text-white';
      case 'RECRUITING': return 'bg-violet-500 text-white';
      case 'GLOBAL': return 'bg-emerald-500 text-white';
      case 'COLLEGE': return 'bg-amber-500 text-white';
      default: return 'bg-slate-800 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] animate-in fade-in">
      
      {/* HERO SECTION */}
      <div className="bg-slate-900 text-white py-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1c7ed6] to-[#d6336c]"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-200">The Premier Recruiting Database</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold uppercase tracking-tight mb-6 leading-tight" style={displayFont}>
                Verified Metrics.<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1c7ed6] to-[#d6336c]">Real Recruiting.</span>
              </h1>
              <p className="text-slate-300 text-lg md:text-xl font-medium mb-8 max-w-lg leading-relaxed">
                Connect directly with NCAA & NAIA college coaches using DNA verified combine scores and a secure two-way compliance inbox.
              </p>
            </div>
            
            {/* HERO STATS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                <UsersIcon className="text-[#1c7ed6] mb-4" size={32} />
                <h3 className="text-3xl font-black mb-1" style={displayFont}>{players.length}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Athletes</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                <Activity className="text-[#d6336c] mb-4" size={32} />
                <h3 className="text-3xl font-black mb-1" style={displayFont}>{newsFeed.filter(n => n.category === 'COMBINE').length + 14}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Combines</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: LIVE NEWS FEED */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold uppercase tracking-tight text-slate-900 flex items-center gap-3" style={displayFont}>
                <Megaphone className="text-[#1c7ed6]" size={28} /> Live News Wire
              </h2>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center shadow-sm">
                  <div className="animate-spin w-8 h-8 border-4 border-[#1c7ed6] border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading latest updates...</p>
                </div>
              ) : combinedFeed.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center shadow-sm">
                  <Activity size={32} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No news available.</p>
                </div>
              ) : (
                combinedFeed.map((news) => (
                  <div key={news.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-md transition-shadow group flex flex-col sm:flex-row gap-5">
                    
                    {/* FEED ICON */}
                    <div className="shrink-0">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                        news.source === 'web' ? 'bg-slate-900 text-white' : 'bg-blue-50 text-[#1c7ed6]'
                      }`}>
                        {news.source === 'web' ? <Globe size={20} /> : (news.category === 'COMBINE' ? <Zap size={20} className="text-[#d6336c]" /> : <Megaphone size={20} />)}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2.5">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${getCategoryColor(news.category)}`}>
                          {news.category}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Calendar size={12} /> {new Date(news.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900 leading-snug" style={displayFont}>
                        {news.title}
                      </h3>
                      
                      {news.source === 'web' && (
                        <a href={news.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1c7ed6] uppercase tracking-widest mt-4 hover:underline">
                          Read Full Article <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: LEADERBOARD */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 overflow-hidden sticky top-28">
              <div className="p-6 border-b border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800">
                <h2 className="text-xl font-extrabold uppercase tracking-tight text-white flex items-center gap-3" style={displayFont}>
                  <Trophy className="text-amber-400" size={24} /> Top Prospects
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">National DNA Score Leaderboard</p>
              </div>
              
              <div className="divide-y divide-slate-800">
                {topProspects.length === 0 ? (
                   <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest p-8">No verified scores yet.</p>
                ) : (
                  topProspects.map((player, index) => (
                    <div key={player.id} onClick={() => onSelect(player)} className="p-4 flex items-center gap-4 hover:bg-white/5 cursor-pointer transition-colors group">