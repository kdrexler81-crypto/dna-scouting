// src/pages/FamilyDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { 
  Shield, Clock, CheckCircle2, XCircle, Loader2, User, Mail, 
  Building, Trophy, Send, Check, CheckCheck, AlertCircle, Search, 
  ExternalLink, GraduationCap, MapPin, FileText, Eye, TrendingUp, 
  BarChart3, Sparkles, Compass, ListChecks, Star, Square, CheckSquare
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

// 1. IMPORT THE COLLEGE DATABASE
import COLLEGES_DB from '../data/colleges.json';

const displayFont = { fontFamily: "'Outfit', sans-serif" };

// REGIONAL PROXIMITY GROUPS FOR SMART MATCHING
const REGION_GROUPS = {
  Northeast: ['NJ', 'NY', 'PA', 'CT', 'MA', 'DE', 'MD', 'RI', 'VT', 'NH', 'ME', 'DC'],
  Southeast: ['FL', 'GA', 'NC', 'SC', 'VA', 'WV', 'AL', 'MS', 'TN', 'KY', 'LA'],
  Midwest: ['OH', 'MI', 'IN', 'IL', 'WI', 'MN', 'IA', 'MO', 'KS', 'NE', 'ND', 'SD'],
  Southwest: ['TX', 'OK', 'AR', 'AZ', 'NM'],
  West: ['CA', 'NV', 'OR', 'WA', 'UT', 'CO', 'ID', 'MT', 'WY', 'AK', 'HI']
};

const getRegion = (stateCode) => {
  if (!stateCode) return 'Unknown';
  const clean = stateCode.trim().toUpperCase();
  for (const [region, states] of Object.entries(REGION_GROUPS)) {
    if (states.includes(clean)) return region;
  }
  return 'Other';
};

export const FamilyDashboard = ({ viewMode, onLogout }) => {
  const { app, appId, db, familyData: user, players } = useApp();
  const navigate = useNavigate();

  const myLinkedAthlete = players.find(p => 
    p.athleteEmail?.toLowerCase() === user?.email?.toLowerCase() ||
    p.guardianEmail?.toLowerCase() === user?.email?.toLowerCase()
  );
  
  // --- PARENT STATE ---
  const [parentMessages, setParentMessages] = useState([]);
  const [loadingAction, setLoadingAction] = useState(null);

  // --- ATHLETE STATE ---
  const activeAthlete = players.find(p => p.athleteEmail?.toLowerCase() === user?.email?.toLowerCase()) || myLinkedAthlete;
  const [athleteTab, setAthleteTab] = useState('inbox'); 
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  
  // --- OUTBOUND ENGINE & MATCH STATE ---
  const [collegeSearch, setCollegeSearch] = useState('');
  const [collegeDivision, setCollegeDivision] = useState('All'); 
  const [matchRegionPref, setMatchRegionPref] = useState('Any'); // 'Any', 'HomeRegion', 'InState'
  const [emailModalCollege, setEmailModalCollege] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // --- INTERACTIVE RECRUITING CHECKLIST STATE ---
  const [completedTasks, setCompletedTasks] = useState({});

  // Load saved checklist state from Firestore or localStorage
  useEffect(() => {
    if (!activeAthlete?.id) return;
    const localSaved = localStorage.getItem(`dna_checklist_${activeAthlete.id}`);
    const parsedLocal = localSaved ? JSON.parse(localSaved) : {};
    const firestoreSaved = activeAthlete.recruitingChecklist || {};
    setCompletedTasks({ ...parsedLocal, ...firestoreSaved });
  }, [activeAthlete?.id, activeAthlete?.recruitingChecklist]);

  const toggleChecklistTask = async (taskId) => {
    if (!activeAthlete?.id) return;
    const updated = { ...completedTasks, [taskId]: !completedTasks[taskId] };
    setCompletedTasks(updated);
    localStorage.setItem(`dna_checklist_${activeAthlete.id}`, JSON.stringify(updated));

    if (db) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', activeAthlete.id);
        await updateDoc(docRef, { recruitingChecklist: updated });
      } catch (err) {
        console.error("Checklist sync fallback to local:", err);
      }
    }
  };

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

  // ATHLETE ACTION: BUILD & LAUNCH OUTBOUND EMAIL
  const buildEmailPayload = (college) => {
    if (!activeAthlete || !college) return { to: '', subject: '', body: '' };
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

    return { to: college.email, subject, body };
  };

  const generateOutboundEmail = (college) => {
    if (!activeAthlete) return;

    if (!college.email) {
      const searchQuery = `${college.name} women's flag football coach email staff directory`;
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
      return;
    }

    setEmailModalCollege(college);
  };

  const launchEmailClient = (provider) => {
    if (!emailModalCollege) return;
    const { to, subject, body } = buildEmailPayload(emailModalCollege);
    const encTo = encodeURIComponent(to);
    const encSub = encodeURIComponent(subject);
    const encBody = encodeURIComponent(body);

    let url = '';
    if (provider === 'gmail') {
      url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encTo}&su=${encSub}&body=${encBody}`;
    } else if (provider === 'outlook') {
      url = `https://outlook.live.com/mail/0/deeplink/compose?to=${encTo}&subject=${encSub}&body=${encBody}`;
    } else if (provider === 'yahoo') {
      url = `https://compose.mail.yahoo.com/?to=${encTo}&subj=${encSub}&body=${encBody}`;
    } else if (provider === 'default') {
      window.location.href = `mailto:${to}?subject=${encSub}&body=${encBody}`;
      setEmailModalCollege(null);
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    setEmailModalCollege(null);
  };

  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // SMART FILTERING ALGORITHM FOR COLLEGE DIRECTORY
  const filteredColleges = useMemo(() => {
    return COLLEGES_DB.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(collegeSearch.toLowerCase()) || 
                            c.state.toLowerCase().includes(collegeSearch.toLowerCase());
      const matchesDiv = collegeDivision === 'All' || c.division.includes(collegeDivision);
      return matchesSearch && matchesDiv;
    });
  }, [collegeSearch, collegeDivision]);

  // --- SMART COLLEGE MATCH RECOMMENDATION ENGINE ---
  const collegeMatches = useMemo(() => {
    if (!activeAthlete) return { tierLabel: 'Developing Prospect', topMatches: [] };
    const score = Number(activeAthlete.dnaScore) || 7.0;
    const gpa = parseFloat(activeAthlete.gpa) || 3.2;
    const athleteState = (activeAthlete.state || 'NJ').trim().toUpperCase();
    const athleteRegion = getRegion(athleteState);

    let tierLabel = 'NAIA / NCAA DII-DIII Target';
    let targetDivs = ['NAIA', 'NCAA DII', 'NCAA DIII'];
    if (score >= 8.3 && gpa >= 3.0) {
      tierLabel = 'NCAA Division I / Top NAIA Target';
      targetDivs = ['NCAA DI', 'NAIA', 'NCAA DII'];
    } else if (score >= 7.4 && gpa >= 2.8) {
      tierLabel = 'NCAA DII / DIII & NAIA Varsity Target';
      targetDivs = ['NCAA DII', 'NAIA', 'NCAA DIII'];
    } else {
      tierLabel = 'NCAA DIII / NAIA / NJCAA Target';
      targetDivs = ['NCAA DIII', 'NAIA', 'NJCAA', '3C2A'];
    }

    // Score each college in COLLEGES_DB
    const scored = COLLEGES_DB.filter(c => {
      if (matchRegionPref === 'InState') return c.state?.toUpperCase() === athleteState;
      if (matchRegionPref === 'HomeRegion') return getRegion(c.state) === athleteRegion;
      return true;
    }).map(c => {
      let fitScore = 72; // Base compatibility

      // 1. Division Alignment (+16 pts)
      if (targetDivs[0] && c.division?.includes(targetDivs[0])) fitScore += 16;
      else if (targetDivs.some(d => c.division?.includes(d))) fitScore += 11;

      // 2. Academic & GPA Synergy (+5 pts)
      if (gpa >= 3.5 && (c.division?.includes('NCAA DIII') || c.division?.includes('NCAA DI'))) fitScore += 5;
      else if (gpa >= 2.8) fitScore += 3;

      // 3. Geographic Proximity (+5 pts)
      if (c.state?.toUpperCase() === athleteState) fitScore += 5;
      else if (getRegion(c.state) === athleteRegion) fitScore += 3;

      // 4. Direct Coach Email Bonus (+3 pts so athletes can act immediately)
      if (c.email) fitScore += 3;

      // 5. Bonus if a coach from this school already viewed the athlete's profile!
      const viewedBySchool = (activeAthlete.recentViews || []).some(
        v => v.school?.toLowerCase()?.includes(c.name?.toLowerCase())
      );
      if (viewedBySchool) fitScore += 6;

      const finalPct = Math.min(99, fitScore);
      return {
        ...c,
        matchPct: finalPct,
        viewedBySchool,
        matchReason: viewedBySchool
          ? 'Coach Viewed Your Profile + Athletic Fit'
          : c.state?.toUpperCase() === athleteState
          ? `In-State ${c.division} Target`
          : `Strong ${c.division} Athletic & GPA Fit`
      };
    });

    scored.sort((a, b) => b.matchPct - a.matchPct);
    return {
      tierLabel,
      topMatches: scored.slice(0, 6)
    };
  }, [activeAthlete, matchRegionPref]);

  // --- ANALYTICS CALCULATIONS (SCOUT VIEWS & 14-DAY CHART) ---
  const scoutViews = useMemo(() => {
    if (!activeAthlete?.recentViews || !Array.isArray(activeAthlete.recentViews)) return [];
    return [...activeAthlete.recentViews].sort((a, b) => (b.time || 0) - (a.time || 0));
  }, [activeAthlete]);

  const analyticsSummary = useMemo(() => {
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const viewsLast30Days = scoutViews.filter(v => (now - (v.time || 0)) <= thirtyDaysMs);
    const uniqueSchools = new Set(scoutViews.map(v => v.school).filter(Boolean));

    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
      const count = scoutViews.filter(v => v.time >= startOfDay && v.time < endOfDay).length;
      days.push({ label: dayStr, count });
    }
    const maxCount = Math.max(...days.map(d => d.count), 1);

    return {
      totalPublicViews: Number(activeAthlete?.views) || 0,
      totalScoutViews: scoutViews.length,
      last30DaysCount: viewsLast30Days.length,
      uniqueSchoolsCount: uniqueSchools.size,
      chartDays: days,
      maxCount
    };
  }, [scoutViews, activeAthlete]);

  // --- RECRUITING ROADMAP CHECKLIST ITEMS (AUTO + MANUAL) ---
  const checklistItems = useMemo(() => {
    if (!activeAthlete) return [];
    const hasDnaScore = Number(activeAthlete.dnaScore) > 0;
    const hasGpa = Boolean(activeAthlete.gpa && String(activeAthlete.gpa).trim() !== '' && activeAthlete.gpa !== 'N/A');
    const hasFilm = Boolean(activeAthlete.hudlLink || activeAthlete.highlightUrl);
    const hasCustomStats = Boolean(activeAthlete.stat1Value || activeAthlete.metrics?.stat1Value);

    return [
      {
        id: 'claim_profile',
        phase: 'Phase 1: Profile Verification',
        title: 'Claim & Link Official DNA Locker Room Profile',
        desc: 'Verified via 6-digit family access code.',
        autoDone: true
      },
      {
        id: 'dna_combine',
        phase: 'Phase 1: Profile Verification',
        title: 'Complete Official DNA Verification Clinic',
        desc: 'Get laser-timed 40-yard dash, shuttle, and official DNA Score.',
        autoDone: hasDnaScore
      },
      {
        id: 'academic_gpa',
        phase: 'Phase 1: Profile Verification',
        title: 'Add Cumulative GPA & Academic Info to Profile',
        desc: 'College scouts filter heavily by GPA for academic scholarship money.',
        autoDone: hasGpa,
        actionLabel: 'Update GPA',
        onAction: () => navigate(`/player/${activeAthlete.id}`)
      },
      {
        id: 'upload_film',
        phase: 'Phase 2: Film & Athletic Resume',
        title: 'Link Highlight Reel (Hudl / YouTube)',
        desc: 'Put your best 8-10 plays at the very beginning of your tape.',
        autoDone: hasFilm,
        actionLabel: 'Add Film URL',
        onAction: () => navigate(`/player/${activeAthlete.id}`)
      },
      {
        id: 'inseason_stats',
        phase: 'Phase 2: Film & Athletic Resume',
        title: 'Post Verified In-Season Production Stats',
        desc: 'Add touchdowns, yardage, or defensive flag pulls/INTs to your public bio.',
        autoDone: hasCustomStats,
        actionLabel: 'Add Stats',
        onAction: () => navigate(`/player/${activeAthlete.id}`)
      },
      {
        id: 'ncaa_naia_reg',
        phase: 'Phase 2: Film & Athletic Resume',
        title: 'Register with NCAA Eligibility Center & PlayNAIA',
        desc: 'Required to receive official athletic scholarship offers at the college level.',
        autoDone: false
      },
      {
        id: 'email_5_matches',
        phase: 'Phase 3: Proactive College Outreach',
        title: 'Send Introductory Emails to Your Top 5 College Matches',
        desc: 'Use our 1-click Outbound Engine to send your verified DNA metrics to coaches.',
        autoDone: false,
        actionLabel: 'Go to Matches',
        onAction: () => setAthleteTab('directory')
      },
      {
        id: 'pitch_viewing_coaches',
        phase: 'Phase 3: Proactive College Outreach',
        title: 'Follow Up With Every Coach Who Views Your Profile',
        desc: 'Check your Profile Analytics tab weekly and click "Pitch Coach Back".',
        autoDone: false,
        actionLabel: 'Check Views',
        onAction: () => setAthleteTab('analytics')
      },
      {
        id: 'social_bio',
        phase: 'Phase 4: Recruiting Momentum & Visits',
        title: 'Pin Your DNA Profile Link to Your Twitter/X & Instagram Bio',
        desc: `Share https://www.dnaflagratings.com/player/${activeAthlete.id} so scouts can verify your numbers.`,
        autoDone: false
      },
      {
        id: 'campus_visit',
        phase: 'Phase 4: Recruiting Momentum & Visits',
        title: 'Schedule Unofficial Campus Visits or College Prospect Days',
        desc: 'Coordinate with your parents to visit top-choice programs in person.',
        autoDone: false
      }
    ];
  }, [activeAthlete, navigate]);

  const checklistProgress = useMemo(() => {
    if (checklistItems.length === 0) return { done: 0, total: 0, pct: 0 };
    const done = checklistItems.filter(item => item.autoDone || completedTasks[item.id]).length;
    return {
      done,
      total: checklistItems.length,
      pct: Math.round((done / checklistItems.length) * 100)
    };
  }, [checklistItems, completedTasks]);

  const pendingInbound = parentMessages.filter(m => m.status === 'pending' && m.senderRole === 'scout');
  const pendingOutbound = parentMessages.filter(m => m.status === 'draft' && m.senderRole === 'athlete');

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

        <div className="flex flex-wrap items-center gap-3">
          {myLinkedAthlete && (
            <button 
              onClick={() => navigate(`/player/${myLinkedAthlete.id}`)} 
              className="text-xs font-bold bg-gradient-to-r from-[#1c7ed6] to-[#d6336c] text-white px-5 py-2.5 rounded-full uppercase tracking-wider shadow-md hover:opacity-95 transition-all flex items-center gap-2"
            >
              <User size={14} /> View & Customize Profile
            </button>
          )}
          <button onClick={onLogout} className={`text-xs font-bold border px-5 py-2.5 rounded-full uppercase tracking-wider transition-colors ${viewMode === 'parent' ? 'text-rose-400 border-rose-400/30 bg-rose-400/10 hover:bg-rose-400 hover:text-white' : 'text-rose-500 border-rose-200 bg-rose-50 hover:bg-rose-100'}`}>
            Sign Out
          </button>
        </div>
      </div>

      {/* PARENT VIEW (MODERATION HUB + SCOUT INTEREST SUMMARY) */}
      {viewMode === 'parent' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 max-w-4xl mx-auto">
          
          {/* PARENT SCOUT ACTIVITY SNAPSHOT */}
          {myLinkedAthlete && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Eye size={22} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">Recruiting Radar • {myLinkedAthlete.name}</span>
                  <h3 className="text-lg font-extrabold text-slate-900 uppercase" style={displayFont}>
                    {analyticsSummary.totalScoutViews} Verified College Coach Views ({analyticsSummary.uniqueSchoolsCount} Schools)
                  </h3>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Recruiting Roadmap</span>
                <span className="text-2xl font-black text-emerald-600" style={displayFont}>{checklistProgress.pct}% Complete</span>
              </div>
            </div>
          )}

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
              {/* ATHLETE 4-TAB SUB-NAVIGATION */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                <button 
                  onClick={() => setAthleteTab('inbox')} 
                  className={`py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${athleteTab === 'inbox' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                >
                  <Mail size={16} /> My Inbox
                </button>
                <button 
                  onClick={() => setAthleteTab('analytics')} 
                  className={`py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${athleteTab === 'analytics' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                >
                  <TrendingUp size={16} /> Profile Analytics
                  {analyticsSummary.totalScoutViews > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${athleteTab === 'analytics' ? 'bg-white text-violet-700' : 'bg-violet-100 text-violet-700'}`}>
                      {analyticsSummary.totalScoutViews}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setAthleteTab('directory')} 
                  className={`py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${athleteTab === 'directory' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                >
                  <Compass size={16} /> Matches & Directory
                </button>
                <button 
                  onClick={() => setAthleteTab('checklist')} 
                  className={`py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${athleteTab === 'checklist' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                >
                  <ListChecks size={16} /> Recruiting Roadmap
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${athleteTab === 'checklist' ? 'bg-white text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {checklistProgress.pct}%
                  </span>
                </button>
              </div>

              {/* TAB 1: INBOX */}
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

              {/* TAB 2: PROFILE ANALYTICS & SCOUT VIEWS */}
              {athleteTab === 'analytics' && (
                <div className="space-y-6 animate-in fade-in">
                  
                  {/* KPI CARDS */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Profile Hits</span>
                        <div className="p-2 rounded-xl bg-slate-100 text-slate-700"><Eye size={16} /></div>
                      </div>
                      <div className="text-3xl font-black text-slate-900" style={displayFont}>{analyticsSummary.totalPublicViews}</div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">All-Time Traffic</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified Scout Views</span>
                        <div className="p-2 rounded-xl bg-blue-50 text-[#1c7ed6]"><Building size={16} /></div>
                      </div>
                      <div className="text-3xl font-black text-[#1c7ed6]" style={displayFont}>{analyticsSummary.totalScoutViews}</div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">.EDU Logged-In Coaches</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last 30 Days</span>
                        <div className="p-2 rounded-xl bg-violet-50 text-violet-600"><TrendingUp size={16} /></div>
                      </div>
                      <div className="text-3xl font-black text-violet-600" style={displayFont}>{analyticsSummary.last30DaysCount}</div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Recent Scout Momentum</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unique Colleges</span>
                        <div className="p-2 rounded-xl bg-pink-50 text-[#d6336c]"><GraduationCap size={16} /></div>
                      </div>
                      <div className="text-3xl font-black text-[#d6336c]" style={displayFont}>{analyticsSummary.uniqueSchoolsCount}</div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Distinct Programs</p>
                    </div>
                  </div>

                  {/* 14-DAY SCOUT VIEW ACTIVITY CHART */}
                  <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-8">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 flex items-center gap-1.5">
                          <BarChart3 size={14} /> Real-Time Recruiting Radar
                        </span>
                        <h3 className="text-xl font-extrabold uppercase tracking-tight mt-1" style={displayFont}>
                          14-Day Verified Coach Activity
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-full text-slate-300">
                        Updated Live via .EDU Portal Tracking
                      </span>
                    </div>

                    <div className="grid grid-cols-14 gap-1.5 sm:gap-3 items-end h-40 pt-6 px-2 border-b border-slate-800">
                      {analyticsSummary.chartDays.map((day, idx) => {
                        const heightPct = day.count === 0 ? 6 : Math.max(18, Math.round((day.count / analyticsSummary.maxCount) * 100));
                        return (
                          <div key={idx} className="flex flex-col items-center justify-end h-full group">
                            <span className={`text-[10px] font-black mb-1.5 transition-opacity ${day.count > 0 ? 'text-emerald-400 opacity-100' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`}>
                              {day.count}
                            </span>
                            <div 
                              style={{ height: `${heightPct}%` }} 
                              className={`w-full max-w-[28px] rounded-t-lg transition-all ${
                                day.count > 0 
                                  ? 'bg-gradient-to-t from-[#1c7ed6] to-[#d6336c] shadow-lg' 
                                  : 'bg-slate-800 hover:bg-slate-700'
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-14 gap-1.5 sm:gap-3 mt-2.5 text-center">
                      {analyticsSummary.chartDays.map((day, idx) => (
                        <div key={idx} className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase truncate">
                          {day.label.split(' ')[1]}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* VERIFIED SCOUT LOG LIST */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
                      <div>
                        <h3 className="text-xl font-extrabold uppercase tracking-tight text-slate-900" style={displayFont}>
                          Who Viewed Your Profile
                        </h3>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          Verified College Coaches & Recruiting Coordinators
                        </p>
                      </div>
                      <button 
                        onClick={() => setAthleteTab('directory')}
                        className="text-xs font-bold uppercase tracking-wider text-violet-600 hover:text-violet-800 flex items-center gap-1.5"
                      >
                        Proactively Pitch More Schools <ExternalLink size={14} />
                      </button>
                    </div>

                    {scoutViews.length === 0 ? (
                      <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <Sparkles size={36} className="mx-auto text-violet-400 mb-3" />
                        <h4 className="text-base font-extrabold uppercase text-slate-900" style={displayFont}>No Verified Coach Views Logged Yet</h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
                          The fastest way to get college scouts on your profile is to send your verified DNA Score and highlight tape using the <strong>Matches & Directory</strong> tab!
                        </p>
                        <button 
                          onClick={() => setAthleteTab('directory')}
                          className="mt-5 bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-3 rounded-xl uppercase tracking-wider text-xs transition-colors shadow-md"
                        >
                          View My College Matches
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {scoutViews.map((view, index) => {
                          const matchedCollege = COLLEGES_DB.find(
                            c => c.name?.toLowerCase() === view.school?.toLowerCase() ||
                                 view.school?.toLowerCase()?.includes(c.name?.toLowerCase())
                          );

                          return (
                            <div key={index} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 px-3 rounded-2xl transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-[#1c7ed6] flex items-center justify-center shrink-0">
                                  <GraduationCap size={22} />
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-base font-extrabold text-slate-900 uppercase" style={displayFont}>
                                      {view.school || 'Verified University'}
                                    </h4>
                                    <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                                      Verified .EDU Scout
                                    </span>
                                  </div>
                                  <p className="text-xs font-bold text-slate-500 mt-0.5">
                                    Viewed by <span className="text-slate-800">Coach {view.coach || 'Recruiting Staff'}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                                <div className="text-left sm:text-right">
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {view.time ? new Date(view.time).toLocaleDateString() : 'Recently'}
                                  </span>
                                  <span className="block text-[10px] font-semibold text-slate-400">
                                    {view.time ? new Date(view.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </span>
                                </div>

                                <button
                                  onClick={() => generateOutboundEmail(matchedCollege || { name: view.school, coach: view.coach, email: '' })}
                                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-2.5 rounded-xl uppercase tracking-wider text-[10px] flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                                >
                                  <Mail size={13} /> Pitch Coach Back
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 3: SMART COLLEGE MATCH + FULL DIRECTORY */}
              {athleteTab === 'directory' && (
                <div className="space-y-8 animate-in fade-in">
                  
                  {/* SMART COLLEGE MATCH ENGINE BANNER */}
                  <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1c7ed6] via-violet-500 to-[#d6336c]"></div>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 mb-6 border-b border-slate-800">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[10px] font-black uppercase tracking-widest mb-3">
                          <Sparkles size={12} /> Algorithmic Recruiting Fit • {collegeMatches.tierLabel}
                        </div>
                        <h3 className="text-2xl font-extrabold uppercase tracking-tight" style={displayFont}>
                          Recommended College Matches For {activeAthlete.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                          Calculated from your verified <strong className="text-white">DNA Score ({activeAthlete.dnaScore || 'N/A'})</strong>, <strong className="text-white">GPA ({activeAthlete.gpa || '3.2'})</strong>, and <strong className="text-white">Home State ({activeAthlete.state || 'NJ'})</strong>.
                        </p>
                      </div>

                      {/* Region Filter Toggle for Match Engine */}
                      <div className="flex bg-slate-800 p-1.5 rounded-2xl border border-slate-700 shrink-0 self-start lg:self-auto">
                        {[
                          { id: 'Any', label: 'National Fit' },
                          { id: 'HomeRegion', label: `${getRegion(activeAthlete.state)} Region` },
                          { id: 'InState', label: `In-State (${activeAthlete.state || 'NJ'})` }
                        ].map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => setMatchRegionPref(opt.id)}
                            className={`px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                              matchRegionPref === opt.id ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {collegeMatches.topMatches.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
                        No programs found in this specific geographic filter. Switch to "National Fit" to see top matches.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {collegeMatches.topMatches.map((college) => (
                          <div key={`match-${college.id}`} className="bg-slate-800/90 border border-slate-700 hover:border-violet-400 rounded-2xl p-5 flex flex-col justify-between transition-all">
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                                  <Star size={11} className="fill-emerald-300" /> {college.matchPct}% Match
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full">
                                  {college.division}
                                </span>
                              </div>
                              <h4 className="text-base font-extrabold text-white uppercase tracking-tight" style={displayFont}>
                                {college.name}
                              </h4>
                              <p className="text-[10px] font-bold text-violet-300 uppercase tracking-wider mt-1">
                                {college.matchReason}
                              </p>
                              <p className="text-[11px] text-slate-400 font-semibold mt-3">
                                Head Coach: <span className="text-white font-bold">{college.coach}</span> • {college.state}
                              </p>
                            </div>

                            <button 
                              onClick={() => generateOutboundEmail(college)} 
                              className="mt-4 w-full bg-gradient-to-r from-[#1c7ed6] to-[#d6336c] hover:opacity-95 text-white font-bold py-2.5 rounded-xl uppercase tracking-wider text-[10px] flex justify-center items-center gap-1.5 shadow-md transition-all"
                            >
                              <Mail size={13} /> Pitch Matched Coach
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* FULL SEARCHABLE COLLEGE DIRECTORY */}
                  <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 pb-6">
                      <div>
                        <h3 className="text-xl font-extrabold uppercase tracking-tight text-slate-900" style={displayFont}>Full NCAA, NAIA & JuCo Directory</h3>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Search all {COLLEGES_DB.length} women's flag football programs nationwide.</p>
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

                </div>
              )}

              {/* TAB 4: INTERACTIVE RECRUITING ROADMAP & CHECKLIST */}
              {athleteTab === 'checklist' && (
                <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto">
                  
                  {/* PROGRESS HEADER */}
                  <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                          <ListChecks size={14} /> Step-By-Step College Recruiting Gameplan
                        </span>
                        <h3 className="text-2xl font-extrabold uppercase tracking-tight mt-1" style={displayFont}>
                          Recruiting Timeline & Checklist
                        </h3>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-3xl font-black text-emerald-400" style={displayFont}>
                          {checklistProgress.done}/{checklistProgress.total}
                        </span>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Milestones Completed ({checklistProgress.pct}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                      <div 
                        style={{ width: `${checklistProgress.pct}%` }} 
                        className="h-full rounded-full bg-gradient-to-r from-[#1c7ed6] via-violet-500 to-emerald-400 transition-all duration-500"
                      />
                    </div>
                  </div>

                  {/* CHECKLIST ITEMS */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                    {checklistItems.map((item) => {
                      const isChecked = item.autoDone || Boolean(completedTasks[item.id]);
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => !item.autoDone && toggleChecklistTask(item.id)}
                          className={`p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                            item.autoDone ? 'bg-emerald-50/30' : 'hover:bg-slate-50 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!item.autoDone) toggleChecklistTask(item.id);
                              }}
                              className={`mt-0.5 shrink-0 transition-transform ${
                                isChecked ? 'text-emerald-500' : 'text-slate-300 hover:text-violet-500'
                              }`}
                            >
                              {isChecked ? <CheckSquare size={24} /> : <Square size={24} />}
                            </button>

                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full">
                                  {item.phase}
                                </span>
                                {item.autoDone && (
                                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                    Auto-Verified by DNA
                                  </span>
                                )}
                              </div>
                              <h4 className={`text-sm sm:text-base font-extrabold uppercase tracking-tight ${isChecked ? 'line-through text-slate-400' : 'text-slate-900'}`} style={displayFont}>
                                {item.title}
                              </h4>
                              <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                                {item.desc}
                              </p>
                            </div>
                          </div>

                          {item.actionLabel && !isChecked && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                item.onAction();
                              }}
                              className="self-start sm:self-center shrink-0 bg-slate-900 hover:bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-colors"
                            >
                              {item.actionLabel}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* WEBMAIL LAUNCHER MODAL */}
      {emailModalCollege && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center border-b-4 border-violet-500">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Outbound Recruiting Engine</span>
                <h3 className="text-xl font-extrabold uppercase tracking-tight mt-0.5" style={displayFont}>
                  Email {emailModalCollege.name}
                </h3>
              </div>
              <button onClick={() => setEmailModalCollege(null)} className="text-slate-400 hover:text-white bg-white/10 p-2 rounded-full transition-colors">
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                Choose how you want to send your pre-written recruiting pitch to <span className="font-bold text-slate-900">Coach {emailModalCollege.coach}</span> ({emailModalCollege.email}):
              </p>

              {/* BROWSER EMAIL BUTTONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => launchEmailClient('gmail')}
                  className="bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 font-bold py-3.5 px-4 rounded-2xl uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Mail size={16} /> Open in Gmail (Web)
                </button>

                <button
                  onClick={() => launchEmailClient('outlook')}
                  className="bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 font-bold py-3.5 px-4 rounded-2xl uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Mail size={16} /> Open in Outlook (Web)
                </button>

                <button
                  onClick={() => launchEmailClient('yahoo')}
                  className="bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200 font-bold py-3.5 px-4 rounded-2xl uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Mail size={16} /> Open in Yahoo (Web)
                </button>

                <button
                  onClick={() => launchEmailClient('default')}
                  className="bg-slate-100 hover:bg-slate-800 text-slate-700 hover:text-white border border-slate-200 font-bold py-3.5 px-4 rounded-2xl uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <ExternalLink size={16} /> Apple / Phone Mail App
                </button>
              </div>

              {/* PREVIEW & COPY FALLBACK */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Or Copy & Paste Manually</span>
                  <button
                    onClick={() => {
                      const { to, subject, body } = buildEmailPayload(emailModalCollege);
                      handleCopyText(`To: ${to}\nSubject: ${subject}\n\n${body}`, 'all');
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                  >
                    {copiedField === 'all' ? <><Check size={12} /> Copied!</> : 'Copy Full Email'}
                  </button>
                </div>
                <p className="text-[11px] font-bold text-slate-700 truncate mb-1">
                  To: <span className="font-medium text-slate-600">{emailModalCollege.email}</span>
                </p>
                <p className="text-[11px] font-bold text-slate-700 truncate mb-2">
                  Subject: <span className="font-medium text-slate-600">{buildEmailPayload(emailModalCollege).subject}</span>
                </p>
                <pre className="text-[11px] text-slate-600 bg-white border border-slate-200 rounded-xl p-3 max-h-36 overflow-y-auto whitespace-pre-wrap font-sans leading-relaxed">
                  {buildEmailPayload(emailModalCollege).body}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};