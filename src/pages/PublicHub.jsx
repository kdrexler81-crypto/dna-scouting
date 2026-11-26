// src/pages/PublicHub.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import {
  Trophy, Activity, Megaphone, ExternalLink, Globe,
  Calendar, ChevronRight, Zap, Search, Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useColleges } from '../hooks/useColleges';
import { HeroSlideshow } from '../components/HeroSlideshow';
import { FeaturedAthleteBanner } from '../components/FeaturedAthleteBanner';
import { LandingInfoSections } from '../components/LandingInfoSections';

// HELPER FUNCTIONS
const getCategoryBadge = (category) => {
  switch (category) {
    case 'ANNOUNCEMENT': return 'bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/25';
    case 'COMBINE': return 'bg-rose-500/15 text-rose-400 border-rose-500/25';
    case 'RECRUITING': return 'bg-violet-500/15 text-violet-300 border-violet-500/25';
    case 'GLOBAL': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
    case 'COLLEGE': return 'bg-amber-500/15 text-amber-300 border-amber-500/25';
    default: return 'bg-white/10 text-zinc-300 border-white/10';
  }
};

const getRankColorClass = (index) => {
  if (index === 0) return 'text-amber-400';
  if (index === 1) return 'text-zinc-200';
  if (index === 2) return 'text-amber-600';
  return 'text-zinc-500';
};

const getNewsIcon = (news) => {
  if (news.source === 'web') return <Globe size={17} className="text-[#38bdf8]" />;
  if (news.category === 'COMBINE') return <Zap size={17} className="text-rose-400" />;
  return <Megaphone size={17} className="text-zinc-300" />;
};

export const PublicHub = ({ onSelect }) => {
  const { db, appId, players, isFirebaseActive, authRole } = useApp();
  const { colleges } = useColleges(db, appId, isFirebaseActive);
  const leaderboardRef = useRef(null);

  const [newsFeed, setNewsFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. FETCH INTERNAL & AUTOMATED NEWS FROM FIREBASE
  useEffect(() => {
    if (!isFirebaseActive || !db) return;
    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'news'),
      orderBy('timestamp', 'desc'),
      limit(15)
    );
    const unsub = onSnapshot(q, (snap) => {
      const newsItems = [];
      snap.forEach((doc) => newsItems.push({ id: doc.id, source: 'internal', ...doc.data() }));
      setNewsFeed(newsItems);
      setLoading(false);
    });
    return () => unsub();
  }, [db, appId, isFirebaseActive]);

  // 2. MIX IN EXTERNAL WEB NEWS
  const webNews = [
    { id: 'web1', title: "Flag Football Officially Added to the 2028 LA Olympic Games", category: "GLOBAL", timestamp: Date.now() - 86400000, source: 'web', link: "https://olympics.com" },
    { id: 'web2', title: "NAIA Announces Continued Expansion of Women's Flag Football Programs", category: "COLLEGE", timestamp: Date.now() - 172800000, source: 'web', link: "https://naia.org" },
    { id: 'web3', title: "NFL Pledges Additional Funding for High School Girls Flag Programs Nationwide", category: "INDUSTRY", timestamp: Date.now() - 432000000, source: 'web', link: "https://nfl.com/play60" }
  ];

  const combinedFeed = [...newsFeed, ...webNews].sort((a, b) => b.timestamp - a.timestamp);

  // 3. GENERATE FULL NATIONAL LEADERBOARD (Sorted by DNA Score)
  const fullLeaderboard = useMemo(() => {
    return [...players].sort((a, b) => (Number(b.dnaScore) || 0) - (Number(a.dnaScore) || 0));
  }, [players]);

  const filteredLeaderboard = useMemo(() => {
    if (!searchTerm.trim()) return fullLeaderboard;
    const lower = searchTerm.toLowerCase();
    return fullLeaderboard.filter((p) =>
      p.name?.toLowerCase().includes(lower) ||
      p.primaryPos?.toLowerCase().includes(lower) ||
      p.state?.toLowerCase().includes(lower) ||
      String(p.gradYear || '').includes(lower)
    );
  }, [fullLeaderboard, searchTerm]);

  const scrollToLeaderboard = () => {
    leaderboardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-zinc-100 animate-in fade-in">
      {/* 1. FULL-WIDTH ACTION SLIDESHOW HERO */}
      <HeroSlideshow onScrollToLeaderboard={scrollToLeaderboard} />

      {/* 2. FEATURED ATHLETE SPOTLIGHT */}
      <FeaturedAthleteBanner players={players} />

      {/* 3. MAIN CONTENT: LEADERBOARD (LEFT) & LIVE NEWS WIRE (RIGHT) */}
      <div ref={leaderboardRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 scroll-mt-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: FULL NATIONAL LEADERBOARD */}
          <div className="lg:col-span-7">
            <div className="bg-[#131316] rounded-xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                      <Trophy className="text-[#38bdf8]" size={24} /> National Leaderboard
                    </h2>
                    <p className="text-xs font-medium text-zinc-400 mt-1">
                      <span className="font-metric text-zinc-200">{fullLeaderboard.length}</span> verified prospects ranked by DNA Score
                    </p>
                  </div>

                  {/* Quick Search */}
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                    <input
                      type="text"
                      placeholder="Filter name, pos, state..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-[#0A0A0C] border border-white/10 text-white placeholder-zinc-500 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-[#38bdf8]"
                    />
                  </div>
                </div>

                {!authRole && (
                  <div className="mt-4 bg-[#0A0A0C] border border-white/10 rounded-lg px-3.5 py-2">
                    <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-2">
                      <Lock size={12} className="text-[#38bdf8] shrink-0" /> Click any athlete to preview profile • Log in to unlock full combine metrics
                    </span>
                  </div>
                )}
              </div>

              {/* Scrollable Full List */}
              <div className="divide-y divide-white/5 max-h-[720px] overflow-y-auto">
                {filteredLeaderboard.length === 0 ? (
                  <p className="text-center text-xs font-medium text-zinc-500 p-12">
                    No matching prospects found.
                  </p>
                ) : (
                  filteredLeaderboard.map((player) => {
                    const trueRank = fullLeaderboard.findIndex((p) => p.id === player.id);
                    return (
                      <div
                        key={player.id}
                        onClick={() => onSelect(player)}
                        className="p-4 sm:px-6 flex items-center gap-4 hover:bg-[#1C1C21] cursor-pointer transition-colors group"
                      >
                        {/* RANK NUMBER */}
                        <div className="shrink-0 w-9 text-center">
                          <span className={`text-base font-bold font-metric ${getRankColorClass(trueRank)}`}>
                            #{trueRank + 1}
                          </span>
                        </div>

                        {/* AVATAR */}
                        <img
                          src={player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`}
                          className="w-11 h-11 rounded-full border border-white/10 object-cover bg-[#0A0A0C] shrink-0"
                          alt={player.name}
                        />

                        {/* DETAILS */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-bold text-white truncate group-hover:text-[#38bdf8] transition-colors">
                            {player.name}
                          </p>
                          <p className="text-xs font-medium text-zinc-400 truncate mt-0.5">
                            {player.primaryPos} <span className="text-zinc-600 mx-1">•</span>
                            <span className="font-metric">'{String(player.gradYear || '').slice(-2) || 'N/A'}</span>
                            <span className="text-zinc-600 mx-1">•</span> {player.state}
                          </p>
                        </div>

                        {/* SCORE */}
                        <div className="text-right shrink-0 flex items-center gap-3">
                          <div>
                            <span className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">
                              DNA Score
                            </span>
                            <span className="text-lg sm:text-xl font-bold text-[#38bdf8] font-metric">
                              {player.dnaScore || '0.0'}
                            </span>
                          </div>
                          <ChevronRight size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE NEWS WIRE */}
          <div className="lg:col-span-5">
            <div className="bg-[#131316] rounded-xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                  <Megaphone className="text-[#38bdf8]" size={24} /> Live News Wire
                </h2>
                <p className="text-xs font-medium text-zinc-400 mt-1">
                  Latest DNA &amp; National Flag Football Headlines
                </p>
              </div>

              <div className="p-4 space-y-3 max-h-[720px] overflow-y-auto">
                {loading ? (
                  <div className="bg-[#0A0A0C] p-12 rounded-xl border border-white/10 text-center">
                    <div className="animate-spin w-7 h-7 border-2 border-[#38bdf8] border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-xs font-medium text-zinc-500">Loading latest updates...</p>
                  </div>
                ) : combinedFeed.length === 0 ? (
                  <div className="bg-[#0A0A0C] p-12 rounded-xl border border-white/10 text-center">
                    <Activity size={28} className="mx-auto text-zinc-600 mb-3" />
                    <p className="text-xs font-medium text-zinc-500">No news available.</p>
                  </div>
                ) : (
                  combinedFeed.map((news) => (
                    <div
                      key={news.id}
                      className="bg-[#0A0A0C] p-4 rounded-xl border border-white/10 hover:border-white/20 hover:bg-[#1C1C21]/60 transition-all flex gap-3.5"
                    >
                      {/* FEED ICON */}
                      <div className="shrink-0">
                        <div className="w-9 h-9 rounded-lg bg-[#131316] border border-white/10 flex items-center justify-center">
                          {getNewsIcon(news)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getCategoryBadge(news.category)}`}>
                            {news.category}
                          </span>
                          <span className="text-[11px] font-medium text-zinc-500 font-metric flex items-center gap-1">
                            <Calendar size={11} /> {new Date(news.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-zinc-100 leading-snug">
                          {news.title}
                        </h3>

                        {news.link && (
                          <a
                            href={news.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#38bdf8] mt-2.5 hover:underline"
                          >
                            Read Full Article <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 4. NEWEST COLLEGE PROGRAMS, VERIFIED DATA, ROADMAP & INSTAGRAM */}
      <LandingInfoSections colleges={colleges} />
    </div>
  );
};