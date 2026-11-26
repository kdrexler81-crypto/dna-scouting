// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { 
  ArrowLeft, MapPin, GraduationCap, Trophy, Activity, Lock, 
  ExternalLink, PlayCircle, BookOpen, Shield, Zap, Users, 
  Calendar, Mail, Sparkles, FileText, Eye, EyeOff, Target,
  Edit3, Save, Upload, X, Loader2, Trash2, Camera, Video, Share2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const displayFont = { fontFamily: "'Barlow Condensed', sans-serif" };

const ensureHttps = (url = '') => {
  const clean = url.trim();
  if (!clean) return '';
  return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
};

// --- SMART STAT PASTE PARSER (MaxPreps / Hudl / Box Score Text) ---
const parseSmartSeasonStats = (rawText) => {
  if (!rawText || !rawText.trim()) return { parsed: {}, count: 0 };
  const text = rawText.replace(/\r/g, ' ');
  const parsed = {};

  const matchers = [
    { key: 'games', regex: /(?:(?:games\s*played|games|gp|g)\s*[:\-]?\s*(\d+)|(\d+)\s*(?:games\s*played|games|gp))/i },
    { key: 'comp', regex: /(?:(?:completions|comp|cmp)\s*[:\-]?\s*(\d+)|(\d+)\s*(?:completions|comp|cmp))/i },
    { key: 'att', regex: /(?:(?:pass(?:ing)?\s*att(?:empts)?|att)\s*[:\-]?\s*(\d+)|(\d+)\s*(?:pass(?:ing)?\s*att(?:empts)?|attempts))/i },
    { key: 'passYds', regex: /(?:pass(?:ing)?\s*(?:yds|yards)\s*[:\-]?\s*([\d,]+)|([\d,]+)\s*pass(?:ing)?\s*(?:yds|yards))/i },
    { key: 'passTds', regex: /(?:pass(?:ing)?\s*(?:tds|touchdowns)\s*[:\-]?\s*(\d+)|(\d+)\s*pass(?:ing)?\s*(?:tds|touchdowns))/i },
    { key: 'passInts', regex: /(?:(?:ints?\s*thrown|pass(?:ing)?\s*ints?)\s*[:\-]?\s*(\d+)|(\d+)\s*ints?\s*thrown)/i },
    { key: 'rushAtt', regex: /(?:(?:rush(?:ing)?\s*att(?:empts)?|carries|rushes)\s*[:\-]?\s*(\d+)|(\d+)\s*(?:carries|rushes))/i },
    { key: 'rushYds', regex: /(?:rush(?:ing)?\s*(?:yds|yards)\s*[:\-]?\s*([\d,]+)|([\d,]+)\s*rush(?:ing)?\s*(?:yds|yards))/i },
    { key: 'rushTds', regex: /(?:rush(?:ing)?\s*(?:tds|touchdowns)\s*[:\-]?\s*(\d+)|(\d+)\s*rush(?:ing)?\s*(?:tds|touchdowns))/i },
    { key: 'rec', regex: /(?:(?:receptions|catches|rec)\s*[:\-]?\s*(\d+)|(\d+)\s*(?:receptions|catches))/i },
    { key: 'recYds', regex: /(?:rec(?:eiving)?\s*(?:yds|yards)\s*[:\-]?\s*([\d,]+)|([\d,]+)\s*rec(?:eiving)?\s*(?:yds|yards))/i },
    { key: 'recTds', regex: /(?:rec(?:eiving)?\s*(?:tds|touchdowns)\s*[:\-]?\s*(\d+)|(\d+)\s*rec(?:eiving)?\s*(?:tds|touchdowns))/i },
    { key: 'defInts', regex: /(?:(?:def(?:ensive)?\s*ints?|interceptions)\s*[:\-]?\s*(\d+)|(\d+)\s*(?:interceptions|ints))/i },
    { key: 'flagPullsPg', regex: /(?:flag\s*pulls\s*(?:\/g|per\s*game)\s*[:\-]?\s*([\d.]+)|([\d.]+)\s*flag\s*pulls\s*(?:\/g|per\s*game))/i },
    { key: 'flagPullsTotal', regex: /(?:(?:total\s*)?flag\s*pulls\s*[:\-]?\s*(\d+)|(\d+)\s*flag\s*pulls(?!\s*(?:\/g|per|for)))/i },
    { key: 'pbu', regex: /(?:(?:passes\s*defended|pass\s*breakups|pbu|pd)\s*[:\-]?\s*(\d+)|(\d+)\s*(?:passes\s*defended|pbu|pd))/i },
    { key: 'tfl', regex: /(?:(?:tfl|flag\s*pulls\s*for\s*loss|sacks)\s*[:\-]?\s*(\d+)|(\d+)\s*(?:tfl|sacks))/i },
  ];

  matchers.forEach(({ key, regex }) => {
    const m = text.match(regex);
    if (m) {
      const val = (m[1] || m[2] || '').replace(/,/g, '');
      if (val) parsed[key] = val;
    }
  });

  // Auto-calculate per-game averages when Games Played is included
  const gp = Number(parsed.games);
  if (gp > 0) {
    if (parsed.comp && !parsed.compPg) parsed.compPg = (Number(parsed.comp) / gp).toFixed(1);
    if (parsed.att && !parsed.attPg) parsed.attPg = (Number(parsed.att) / gp).toFixed(1);
    if (parsed.passYds && !parsed.passYdsPg) parsed.passYdsPg = (Number(parsed.passYds) / gp).toFixed(1);
    if (parsed.passTds && !parsed.passTdsPg) parsed.passTdsPg = (Number(parsed.passTds) / gp).toFixed(1);
    if (parsed.passInts && !parsed.passIntsPg) parsed.passIntsPg = (Number(parsed.passInts) / gp).toFixed(1);
    if (parsed.rushYds && !parsed.rushYdsPg) parsed.rushYdsPg = (Number(parsed.rushYds) / gp).toFixed(1);
    if (parsed.recYds && !parsed.recYdsPg) parsed.recYdsPg = (Number(parsed.recYds) / gp).toFixed(1);
    if (parsed.flagPullsTotal && !parsed.flagPullsPg) parsed.flagPullsPg = (Number(parsed.flagPullsTotal) / gp).toFixed(1);
  }

  delete parsed.games;
  delete parsed.flagPullsTotal;

  return { parsed, count: Object.keys(parsed).length };
};

// --- STAT SCHEMA & CAREER TOTALS HELPERS ---
const STAT_GROUPS = [
  {
    id: 'passing',
    title: 'Passing (QB)',
    fields: [
      { key: 'comp', label: 'Completions', type: 'sum' },
      { key: 'att', label: 'Attempts', type: 'sum' },
      { key: 'passYds', label: 'Passing Yds', type: 'sum' },
      { key: 'passTds', label: 'Passing TDs', type: 'sum' },
      { key: 'passInts', label: 'INTs Thrown', type: 'sum' },
      { key: 'compPg', label: 'Comp / Game', type: 'avg' },
      { key: 'attPg', label: 'Att / Game', type: 'avg' },
      { key: 'passYdsPg', label: 'Pass Yds / Game', type: 'avg' },
      { key: 'passTdsPg', label: 'Pass TDs / Game', type: 'avg' },
      { key: 'passIntsPg', label: 'INTs / Game', type: 'avg' },
    ],
  },
  {
    id: 'rushing',
    title: 'Rushing',
    fields: [
      { key: 'rushAtt', label: 'Rushes', type: 'sum' },
      { key: 'rushYds', label: 'Total Rush Yds', type: 'sum' },
      { key: 'rushYdsPg', label: 'Rush Yds / Game', type: 'avg' },
      { key: 'rushTds', label: 'Rushing TDs', type: 'sum' },
    ],
  },
  {
    id: 'receiving',
    title: 'Receiving',
    fields: [
      { key: 'rec', label: 'Receptions', type: 'sum' },
      { key: 'recYds', label: 'Total Rec Yds', type: 'sum' },
      { key: 'recYdsPg', label: 'Rec Yds / Game', type: 'avg' },
      { key: 'recTds', label: 'Receiving TDs', type: 'sum' },
    ],
  },
  {
    id: 'defense',
    title: 'Defense',
    fields: [
      { key: 'defInts', label: 'Interceptions', type: 'sum' },
      { key: 'flagPullsPg', label: 'Flag Pulls / Game', type: 'avg' },
      { key: 'pbu', label: 'Passes Defended', type: 'sum' },
      { key: 'tfl', label: 'Flag Pulls for Loss', type: 'sum' },
    ],
  },
];

const createEmptySeason = (year = String(new Date().getFullYear())) => ({
  year,
  comp: '', att: '', passYds: '', passTds: '', passInts: '',
  compPg: '', attPg: '', passYdsPg: '', passTdsPg: '', passIntsPg: '',
  rushAtt: '', rushYds: '', rushYdsPg: '', rushTds: '',
  rec: '', recYds: '', recYdsPg: '', recTds: '',
  defInts: '', flagPullsPg: '', pbu: '', tfl: '',
});

const buildCareerTotals = (yearlyStats = []) => {
  const career = { year: 'Career' };
  STAT_GROUPS.forEach(group => {
    group.fields.forEach(({ key, type }) => {
      const nums = yearlyStats
        .map(s => s[key])
        .filter(v => v !== '' && v !== null && v !== undefined && !isNaN(Number(v)))
        .map(Number);

      if (nums.length === 0) {
        career[key] = '';
      } else if (type === 'sum') {
        const sum = nums.reduce((a, b) => a + b, 0);
        career[key] = Number.isInteger(sum) ? String(sum) : sum.toFixed(1);
      } else {
        const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
        career[key] = avg.toFixed(1);
      }
    });
  });
  return career;
};

// --- SOCIAL MEDIA URL HELPER ---
const formatSocialUrl = (platform, value) => {
  if (!value) return '';
  const clean = value.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  const handle = clean.replace(/^@/, '');
  if (platform === 'twitter') return `https://x.com/${handle}`;
  if (platform === 'instagram') return `https://instagram.com/${handle}`;
  if (platform === 'tiktok') return `https://tiktok.com/@${handle}`;
  if (platform === 'youtube') return `https://youtube.com/@${handle}`;
  return `https://${clean}`;
};

// --- HUDL & YOUTUBE EMBED PARSER ---
const getVideoEmbedUrl = (input) => {
  if (!input || typeof input !== 'string') return null;
  let url = input.trim();

  const iframeSrcMatch = url.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch) {
    url = iframeSrcMatch[1];
  }

  // 1. YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
  }

  // 2. Hudl (already embed)
  if (url.includes('hudl.com/embed/video/')) {
    return url;
  }

  // 3. Hudl (standard highlight URL)
  const hudlMatch = url.match(/hudl\.com\/video\/(.+)/i);
  if (hudlMatch && hudlMatch[1]) {
    const cleanPath = hudlMatch[1].split('?')[0];
    return `https://www.hudl.com/embed/video/${cleanPath}`;
  }

  return null;
};

// --- COPY & PASTE PROFILE TEXT PARSER (HUDL / MAXPREPS / NCSA) ---
const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
]);

const parsePastedProfileText = (rawText) => {
  if (!rawText || !rawText.trim()) return { fields: {}, parsedStats: {}, foundLabels: [] };

  const text = rawText.replace(/\r/g, '');
  const fields = {};
  const parsedStats = {};
  const foundLabels = [];

  // 1. Grad Year (Class of 2027, Class of '27, c/o 2028)
  const gradExplicit = text.match(/(?:class\s+of|grad(?:uation)?(?:\s+year)?|c\/o)\s*[:\-]?\s*['’]?(20[2-3]\d|[2-3]\d)['’]?/i);
  if (gradExplicit) {
    const yr = gradExplicit[1].length === 2 ? `20${gradExplicit[1]}` : gradExplicit[1];
    fields.gradYear = yr;
    foundLabels.push(`Grad Year (${yr})`);
  } else {
    const gradFallback = text.match(/\b(202[6-9]|203[0-5])\b/);
    if (gradFallback) {
      fields.gradYear = gradFallback[1];
      foundLabels.push(`Grad Year (${gradFallback[1]})`);
    }
  }

  // 2. State (City, NJ or (NJ))
  const stateMatches = [...text.matchAll(/(?:,\s*|\()([A-Z]{2})(?:\)|\s|\.|,|$)/g)];
  for (const m of stateMatches) {
    if (US_STATES.has(m[1])) {
      fields.state = m[1];
      foundLabels.push(`State (${m[1]})`);
      break;
    }
  }

  // 3. Height (e.g., 5'6", 5' 6", 5'6, Height: 5-6)
  const heightMatch =
    text.match(/\b([4-6])\s*['’]\s*(1[0-1]|[0-9])\s*["”]?/) ||
    text.match(/\b(?:height|ht)\s*[:\-]?\s*([4-6])[-']\s*(1[0-1]|[0-9])\b/i);
  if (heightMatch) {
    fields.height = `${heightMatch[1]}'${heightMatch[2]}"`;
    foundLabels.push(`Height (${fields.height})`);
  }

  // 4. Weight (e.g., 125 lbs, 125lbs, Weight: 125)
  const weightMatch =
    text.match(/\b([7-9]\d|1\d{2}|2[0-4]\d)\s*(?:lbs?\.?|pounds)\b/i) ||
    text.match(/\b(?:weight|wt)\s*[:\-]?\s*([7-9]\d|1\d{2}|2[0-4]\d)\b/i);
  if (weightMatch) {
    fields.weight = weightMatch[1];
    foundLabels.push(`Weight (${weightMatch[1]} lbs)`);
  }

  // 5. GPA (4.1 GPA, GPA: 3.85, gpa of 3.9)
  const gpaMatch =
    text.match(/\bgpa\s*(?:of|:|-)?\s*([2-5]\.\d{1,2})\b/i) ||
    text.match(/\b([2-5]\.\d{1,2})\s*gpa\b/i);
  if (gpaMatch) {
    fields.gpa = gpaMatch[1];
    foundLabels.push(`GPA (${gpaMatch[1]})`);
  }

  // 6. SAT / ACT
  const satMatch = text.match(/\bsat\s*[:\-]?\s*(1[0-6]\d{2}|[89]\d{2})\b/i) || text.match(/\b(1[0-6]\d{2})\s*sat\b/i);
  const actMatch = text.match(/\bact\s*[:\-]?\s*([1-3]\d)\b/i) || text.match(/\b([1-3]\d)\s*act\b/i);
  if (satMatch) {
    fields.satAct = satMatch[1];
    foundLabels.push(`SAT (${satMatch[1]})`);
  } else if (actMatch) {
    fields.satAct = actMatch[1];
    foundLabels.push(`ACT (${actMatch[1]})`);
  }

  // 7. Positions
  const posMap = {
    QB: 'QB', QUARTERBACK: 'QB',
    WR: 'WR', 'WIDE RECEIVER': 'WR', RECEIVER: 'WR',
    RB: 'RB', 'RUNNING BACK': 'RB',
    C: 'C', CENTER: 'C',
    DB: 'DB', FS: 'DB', SS: 'DB', CB: 'DB', S: 'DB', SAFETY: 'DB', CORNERBACK: 'DB',
    LB: 'LB', OLB: 'LB', MLB: 'LB', ILB: 'LB', LINEBACKER: 'LB',
    RUSH: 'RUSH', RUSHER: 'RUSHER', BLITZER: 'RUSHER',
    ATH: 'ATH', ATHLETE: 'ATH'
  };
  const posRegex = /\b(QB|WR|RB|DB|FS|SS|CB|LB|OLB|MLB|ILB|RUSH|RUSHER|ATH|Quarterback|Wide Receiver|Running Back|Linebacker|Cornerback|Safety)\b/gi;
  const detectedPositions = [];
  for (const m of text.matchAll(posRegex)) {
    const normalized = posMap[m[1].toUpperCase()];
    if (normalized && !detectedPositions.includes(normalized)) {
      detectedPositions.push(normalized);
    }
    if (detectedPositions.length >= 2) break;
  }
  if (detectedPositions[0]) {
    fields.primaryPos = detectedPositions[0];
    foundLabels.push(`Pos (${detectedPositions.join('/')})`);
  }
  if (detectedPositions[1]) {
    fields.secondaryPos = detectedPositions[1];
  }

  // 8. Embedded Links (Hudl, YouTube, Instagram, X/Twitter, TikTok)
  const hudlUrl = text.match(/https?:\/\/(?:www\.)?hudl\.com\/(?:video|profile)\/[^\s"'<>]+/i);
  const ytUrl = text.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[^\s"'<>]+/i);
  if (hudlUrl) { fields.hudlLink = hudlUrl[0]; foundLabels.push('Hudl Link'); }
  else if (ytUrl) { fields.hudlLink = ytUrl[0]; foundLabels.push('YouTube Video'); }

  const igUrl = text.match(/https?:\/\/(?:www\.)?instagram\.com\/[^\s"'<>]+/i);
  if (igUrl) { fields.instagram = igUrl[0]; foundLabels.push('Instagram'); }

  const xUrl = text.match(/https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^\s"'<>]+/i);
  if (xUrl) { fields.twitter = xUrl[0]; foundLabels.push('X/Twitter'); }

  const ttUrl = text.match(/https?:\/\/(?:www\.)?tiktok\.com\/[^\s"'<>]+/i);
  if (ttUrl) { fields.tiktok = ttUrl[0]; foundLabels.push('TikTok'); }

  // 9. In-Season Stats
  const statMatchers = [
    { key: 'passYds', regex: /(?:pass(?:ing)?\s*(?:yds|yards)\s*[:\-]?\s*([\d,]+)|([\d,]+)\s*pass(?:ing)?\s*(?:yds|yards))/i },
    { key: 'passTds', regex: /(?:pass(?:ing)?\s*(?:tds|touchdowns)\s*[:\-]?\s*(\d+)|(\d+)\s*pass(?:ing)?\s*(?:tds|touchdowns))/i },
    { key: 'comp', regex: /(?:completions\s*[:\-]?\s*(\d+)|(\d+)\s*completions)/i },
    { key: 'rushYds', regex: /(?:rush(?:ing)?\s*(?:yds|yards)\s*[:\-]?\s*([\d,]+)|([\d,]+)\s*rush(?:ing)?\s*(?:yds|yards))/i },
    { key: 'rushTds', regex: /(?:rush(?:ing)?\s*(?:tds|touchdowns)\s*[:\-]?\s*(\d+)|(\d+)\s*rush(?:ing)?\s*(?:tds|touchdowns))/i },
    { key: 'rec', regex: /(?:receptions\s*[:\-]?\s*(\d+)|(\d+)\s*(?:receptions|catches))/i },
    { key: 'recYds', regex: /(?:rec(?:eiving)?\s*(?:yds|yards)\s*[:\-]?\s*([\d,]+)|([\d,]+)\s*rec(?:eiving)?\s*(?:yds|yards))/i },
    { key: 'recTds', regex: /(?:rec(?:eiving)?\s*(?:tds|touchdowns)\s*[:\-]?\s*(\d+)|(\d+)\s*rec(?:eiving)?\s*(?:tds|touchdowns))/i },
    { key: 'defInts', regex: /(?:interceptions\s*[:\-]?\s*(\d+)|(\d+)\s*(?:interceptions|ints))/i },
    { key: 'flagPullsPg', regex: /(?:flag\s*pulls\s*(?:\/g|per game)\s*[:\-]?\s*([\d.]+)|([\d.]+)\s*flag\s*pulls\s*(?:\/g|per game))/i },
    { key: 'pbu', regex: /(?:(?:passes\s*defended|pbu)\s*[:\-]?\s*(\d+)|(\d+)\s*(?:passes\s*defended|pbu))/i },
    { key: 'tfl', regex: /(?:(?:tfl|flag\s*pulls\s*for\s*loss)\s*[:\-]?\s*(\d+)|(\d+)\s*tfl)/i },
  ];

  let statsFoundCount = 0;
  statMatchers.forEach(({ key, regex }) => {
    const match = text.match(regex);
    if (match) {
      const rawNum = (match[1] || match[2] || '').replace(/,/g, '');
      if (rawNum) {
        parsedStats[key] = rawNum;
        statsFoundCount++;
      }
    }
  });
  if (statsFoundCount > 0) {
    foundLabels.push(`${statsFoundCount} Stat${statsFoundCount > 1 ? 's' : ''}`);
  }

  // 10. Athlete Name (clean 2-3 word name line, skipping site navigation)
  const skipLine = /hudl|maxpreps|skip to|log in|sign in|sign up|search|follow|highlights|schedule|stats|about|bio|menu|home|varsity|football|class of|gpa|http/i;
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 12)) {
    if (!skipLine.test(line) && /^[A-Z][a-z'-]+\s+[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+)?$/.test(line)) {
      fields.name = line;
      foundLabels.unshift(`Name (${line})`);
      break;
    }
  }

  return { fields, parsedStats, foundLabels };
};

export const ProfilePage = ({ onBack }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { app, db, appId, isFirebaseActive, authRole, familyData, players } = useApp();
  
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forceBlurPreview, setForceBlurPreview] = useState(false);

  // --- STATS TAB & EDITOR STATE ---
  const [selectedStatYear, setSelectedStatYear] = useState('career');
  const [activeEditYearIdx, setActiveEditYearIdx] = useState(0);
  const [statPasteText, setStatPasteText] = useState('');
  const [statPasteStatus, setStatPasteStatus] = useState('');

  // --- FAMILY PROFILE EDITOR & DELETE STATE ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [deletingProfile, setDeletingProfile] = useState(false);
  const [editForm, setEditForm] = useState({});

  // --- HUDL / EXTERNAL LINK & TEXT IMPORTER STATE ---
  const [showImportBar, setShowImportBar] = useState(true);
  const [importMode, setImportMode] = useState('url'); // 'url' | 'text'
  const [importUrl, setImportUrl] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [importingProfile, setImportingProfile] = useState(false);
  const [importStatus, setImportStatus] = useState(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      const cached = players?.find(p => String(p.id) === String(id));
      if (cached) {
        setPlayer(cached);
        setLoading(false);
      }

      if (!isFirebaseActive || !db) {
        if (!cached) setError("Database offline and player not found in local cache.");
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setPlayer({ id: docSnap.id, ...docSnap.data() });
        } else if (!cached) {
          setError("Athlete profile not found.");
        }
      } catch (err) {
        if (!cached) setError("Error loading profile: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [id, db, appId, isFirebaseActive, players]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#1c7ed6] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md shadow-sm">
          <Activity size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-extrabold uppercase text-slate-900 mb-2" style={displayFont}>Profile Unavailable</h2>
          <p className="text-sm font-medium text-slate-500 mb-6">{error || "This profile may have been removed."}</p>
          <button onClick={() => onBack ? onBack() : navigate(-1)} className="bg-slate-900 text-white font-bold py-3 px-6 rounded-xl uppercase tracking-wider text-xs w-full">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Auth & Privacy Gate
  const hasValidRole = ['admin', 'recruiter', 'scout', 'parent', 'athlete'].includes(authRole);
  const isLocked = !hasValidRole || forceBlurPreview;

  // Ownership check for self-service editing/deleting
  const userEmail = familyData?.email?.toLowerCase();
  const isOwner = Boolean(
    (userEmail && (
      player.athleteEmail?.toLowerCase() === userEmail ||
      player.email?.toLowerCase() === userEmail ||
      player.guardianEmail?.toLowerCase() === userEmail ||
      player.parentEmail?.toLowerCase() === userEmail
    )) ||
    (familyData?.athleteId && String(familyData.athleteId) === String(player.id))
  );
  const canCustomize = authRole === 'admin' || ((authRole === 'parent' || authRole === 'athlete') && isOwner);

  // Build edit form baseline from current player data + optional imported overrides
  const buildEditFormState = (overrides = {}) => {
    const existingSeasons = Array.isArray(player.yearlyStats) && player.yearlyStats.length > 0
      ? player.yearlyStats.map(s => ({ ...createEmptySeason(s.year), ...s }))
      : [createEmptySeason()];

    return {
      name: player.name || '',
      avatar: player.avatar || player.photo || '',
      primaryPos: player.primaryPos || 'WR',
      secondaryPos: player.secondaryPos || '',
      gradYear: player.gradYear || '',
      state: player.state || '',
      height: player.height || player.metrics?.height || '',
      weight: player.weight || player.metrics?.weight || '',
      externalClub: player.externalClub || player.thirdPartyClub || '',
      gpa: player.gpa || '',
      satAct: player.satAct || player.sat || '',
      twitter: player.twitter || player.social || '',
      instagram: player.instagram || '',
      youtube: player.youtube || '',
      tiktok: player.tiktok || '',
      hudlLink: player.hudlLink || player.highlightUrl || '',
      hudlProfileUrl: player.hudlProfileUrl || '',
      maxPrepsUrl: player.maxPrepsUrl || '',
      ncsaUrl: player.ncsaUrl || '',
      instagramReelsUrl: player.instagramReelsUrl || '',
      yearlyStats: existingSeasons,
      ...overrides
    };
  };

  // Open the modal pre-filled with current non-verified fields
  const handleSmartStatPaste = () => {
    if (!statPasteText.trim()) return;
    const { parsed, count } = parseSmartSeasonStats(statPasteText);
    if (count === 0) {
      setStatPasteStatus('No stats recognized. Example: "12 games, 42 rec, 680 rec yds, 11 rec TDs, 5 INTs"');
      return;
    }
    const updated = [...(editForm.yearlyStats || [createEmptySeason()])];
    const idx = updated[activeEditYearIdx] ? activeEditYearIdx : 0;
    updated[idx] = { ...updated[idx], ...parsed };
    setEditForm({ ...editForm, yearlyStats: updated });
    setStatPasteStatus(`Auto-filled ${count} stat fields into ${updated[idx].year || 'this season'}.`);
    setStatPasteText('');
  };
  const openEditModal = () => {
    setEditForm(buildEditFormState());
    setActiveEditYearIdx(0);
    setImportStatus(null);
    setIsEditModalOpen(true);
  };

  // Import from Hudl / MaxPreps / YouTube URL
  const handleImportFromLink = async (openModalAfter = false) => {
    if (!importUrl.trim()) return;
    setImportingProfile(true);
    setImportStatus(null);
    try {
      const importFn = httpsCallable(getFunctions(app), 'importExternalProfile');
      const { data } = await importFn({ url: importUrl.trim() });
      const found = data?.imported || {};
      const keys = Object.keys(found);

      if (keys.length === 0) {
        setImportStatus({
          type: 'error',
          text: 'Could not read public profile data from that link. Switch to "Paste Profile Text (Ctrl+A)" to pull all details directly.'
        });
      } else {
        if (openModalAfter && !isEditModalOpen) {
          setEditForm(buildEditFormState(found));
          setActiveEditYearIdx(0);
          setIsEditModalOpen(true);
        } else {
          setEditForm((prev) => ({
            ...prev,
            ...found
          }));
        }
        setImportStatus({
          type: 'success',
          text: data?.fetchBlocked
            ? `Saved link (${keys.join(', ')}). That site blocked automatic scraping—switch to "Paste Profile Text (Ctrl+A)" to also pull Height, Weight, GPA, Position, and Stats.`
            : `Auto-filled: ${keys.join(', ')}. Review the fields below and click Save Profile Updates.`
        });
        setImportUrl('');
      }
    } catch (err) {
      setImportStatus({
        type: 'error',
        text: err.message || 'Failed to import link. Make sure the importExternalProfile Cloud Function is deployed.'
      });
    } finally {
      setImportingProfile(false);
    }
  };

  // Import from Copy & Pasted Hudl / MaxPreps Profile Text
  const handleParsePastedText = (openModalAfter = false) => {
    if (!pastedText.trim()) return;
    const { fields, parsedStats, foundLabels } = parsePastedProfileText(pastedText);

    if (foundLabels.length === 0) {
      setImportStatus({
        type: 'error',
        text: 'Could not detect profile info in that text. Open the Hudl or MaxPreps About/Bio page, press Ctrl+A then Ctrl+C, and paste again.'
      });
      return;
    }

    const baseForm = openModalAfter && !isEditModalOpen ? buildEditFormState() : editForm;
    const updatedSeasons = Array.isArray(baseForm.yearlyStats) && baseForm.yearlyStats.length > 0
      ? [...baseForm.yearlyStats]
      : [createEmptySeason()];

    if (Object.keys(parsedStats).length > 0) {
      const targetIdx = openModalAfter && !isEditModalOpen ? 0 : activeEditYearIdx;
      updatedSeasons[targetIdx] = {
        ...updatedSeasons[targetIdx],
        ...parsedStats
      };
    }

    setEditForm({
      ...baseForm,
      ...fields,
      yearlyStats: updatedSeasons
    });

    if (openModalAfter && !isEditModalOpen) {
      setActiveEditYearIdx(0);
      setIsEditModalOpen(true);
    }

    setImportStatus({
      type: 'success',
      text: `Parsed from text: ${foundLabels.join(', ')}. Review the fields below and click Save Profile Updates.`
    });
    setPastedText('');
  };

  // Compress uploaded profile photo so it fits cleanly in Firestore
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 320;
        let width = img.width;
        let height = img.height;
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setEditForm(prev => ({ ...prev, avatar: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Save editable profile fields to Firestore
  const handleSaveCustomProfile = async (e) => {
    e.preventDefault();
    if (!db || !player?.id) return;
    setSavingProfile(true);
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', player.id);
      const updatedFields = {
        name: editForm.name.trim(),
        avatar: editForm.avatar,
        primaryPos: editForm.primaryPos,
        secondaryPos: editForm.secondaryPos,
        gradYear: Number(editForm.gradYear) || editForm.gradYear,
        state: editForm.state.toUpperCase(),
        height: (editForm.height || '').trim(),
        weight: editForm.weight !== '' && editForm.weight !== undefined
          ? (Number(editForm.weight) || String(editForm.weight).trim())
          : '',
        externalClub: editForm.externalClub,
        gpa: editForm.gpa,
        satAct: editForm.satAct,
        sat: editForm.satAct,
        twitter: (editForm.twitter || '').trim(),
        instagram: (editForm.instagram || '').trim(),
        youtube: (editForm.youtube || '').trim(),
        tiktok: (editForm.tiktok || '').trim(),
        hudlLink: (editForm.hudlLink || '').trim(),
        hudlProfileUrl: (editForm.hudlProfileUrl || '').trim(),
        maxPrepsUrl: (editForm.maxPrepsUrl || '').trim(),
        ncsaUrl: (editForm.ncsaUrl || '').trim(),
        instagramReelsUrl: (editForm.instagramReelsUrl || '').trim(),
        yearlyStats: editForm.yearlyStats || [],
        updatedAt: Date.now()
      };
      await updateDoc(docRef, updatedFields);
      setPlayer(prev => ({ ...prev, ...updatedFields }));
      setIsEditModalOpen(false);
    } catch (err) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // Self-service Delete Athlete Profile handler for linked Parent, Athlete, or Admin
  const handleDeleteAthleteProfile = async () => {
    if (!db || !player?.id) return;
    const confirmed = window.confirm(
      `PERMANENT ACTION: Are you sure you want to permanently delete ${player.name}'s athlete profile from the national leaderboard? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingProfile(true);
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', player.id));
      localStorage.removeItem(`dna_checklist_${player.id}`);
      setIsEditModalOpen(false);
      alert(`${player.name}'s profile has been permanently deleted.`);
      navigate('/');
    } catch (err) {
      alert("Failed to delete profile: " + err.message);
    } finally {
      setDeletingProfile(false);
    }
  };

  // Helper to read nested metrics OR flat properties WITHOUT duplicating %, s, ", or mph
  const m = player.metrics || {};
  const val = (key, altKey, suffix = '') => {
    const raw = m[key] !== undefined && m[key] !== '' ? m[key] 
              : player[key] !== undefined && player[key] !== '' ? player[key]
              : m[altKey] !== undefined && m[altKey] !== '' ? m[altKey]
              : player[altKey] !== undefined && player[altKey] !== '' ? player[altKey]
              : null;

    if (raw === null || raw === undefined || raw === '') return 'N/A';

    const strVal = String(raw).trim();
    if (!suffix) return strVal;

    const cleanSuffix = suffix.trim().toLowerCase();
    if (strVal.toLowerCase().endsWith(cleanSuffix)) {
      return strVal;
    }
    return `${strVal}${suffix}`;
  };

  // Video & Social values
  const highlightUrl = player.hudlLink || player.highlightUrl || player.videoUrl || player.filmLink || '';
  const embedUrl = getVideoEmbedUrl(highlightUrl);
  const twitterHandle = player.twitter || player.social || '';

  // Multi-Year & Career Stats Computation (hides empty fields & empty groups)
  const seasons = Array.isArray(player.yearlyStats)
    ? [...player.yearlyStats].sort((a, b) => Number(b.year) - Number(a.year))
    : [];
  const careerStats = seasons.length > 0 ? buildCareerTotals(seasons) : null;
  const activeStatsObj = selectedStatYear === 'career'
    ? careerStats
    : seasons.find(s => String(s.year) === String(selectedStatYear)) || careerStats;

  const visibleStatGroups = activeStatsObj
    ? STAT_GROUPS.map(group => ({
        ...group,
        filledFields: group.fields.filter(f => {
          const v = activeStatsObj[f.key];
          return v !== '' && v !== null && v !== undefined;
        }),
      })).filter(group => group.filledFields.length > 0)
    : [];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 animate-in fade-in">
      
      {/* 1. PUBLIC HEADER (Always Visible to Everyone) */}
      <div className="bg-slate-900 text-white pt-8 pb-20 relative border-b-4 border-[#1c7ed6]">
        <div className="max-w-6xl mx-auto px-4">
          
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <button onClick={() => onBack ? onBack() : navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
              <ArrowLeft size={16} /> Back to Directory
            </button>

            <div className="flex flex-wrap items-center gap-3">
              {canCustomize && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowImportBar(prev => !prev)}
                    className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full border flex items-center gap-2 transition-all shadow-lg ${
                      showImportBar
                        ? 'bg-[#1c7ed6] text-white border-blue-400'
                        : 'bg-blue-500/20 text-blue-200 border-blue-400/40 hover:bg-[#1c7ed6] hover:text-white'
                    }`}
                  >
                    <Sparkles size={14} /> Quick Auto-Fill (Hudl / Text)
                  </button>
                  <button
                    onClick={openEditModal}
                    className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full bg-gradient-to-r from-[#1c7ed6] to-[#d6336c] text-white shadow-lg hover:opacity-95 flex items-center gap-2 transition-all"
                  >
                    <Edit3 size={14} /> Customize My Profile
                  </button>
                  <button
                    onClick={handleDeleteAthleteProfile}
                    disabled={deletingProfile}
                    className="text-[10px] font-bold uppercase tracking-widest px-3.5 py-2 rounded-full bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 flex items-center gap-1.5 transition-all"
                  >
                    {deletingProfile ? <Loader2 size={13} className="animate-spin" /> : <><Trash2 size={13} /> Delete Profile</>}
                  </button>
                </>
              )}

              {hasValidRole && (
                <button 
                  onClick={() => setForceBlurPreview(!forceBlurPreview)}
                  className={`text-[10px] font-bold uppercase tracking-widest px-3.5 py-2 rounded-full border flex items-center gap-2 transition-all ${
                    forceBlurPreview 
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg' 
                      : 'bg-white/10 text-slate-300 border-white/15 hover:bg-white/20'
                  }`}
                >
                  {forceBlurPreview ? <><Eye size={14} /> Exit Guest Preview (Unlock)</> : <><EyeOff size={14} /> Preview Public Blur</>}
                </button>
              )}
            </div>
          </div>

          {/* PROMINENT ON-PAGE HUDL / PASTE TEXT AUTO-FILL BAR */}
          {canCustomize && showImportBar && (
            <div className="mb-8 bg-[#1c7ed6]/15 border border-blue-400/40 rounded-2xl p-4 sm:p-5 backdrop-blur-sm shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-blue-300 flex items-center gap-1.5 mr-2">
                    <Sparkles size={14} className="text-blue-400" /> Quick Auto-Fill
                  </span>
                  <div className="inline-flex bg-slate-900/70 p-0.5 rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() => { setImportMode('url'); setImportStatus(null); }}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        importMode === 'url' ? 'bg-[#1c7ed6] text-white' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Paste Link
                    </button>
                    <button
                      type="button"
                      onClick={() => { setImportMode('text'); setImportStatus(null); }}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        importMode === 'text' ? 'bg-[#1c7ed6] text-white' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Paste Profile Text (Ctrl+A)
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImportBar(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Hide Auto-Fill Bar"
                >
                  <X size={15} />
                </button>
              </div>

              {importMode === 'url' ? (
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="url"
                    placeholder="Paste public Hudl profile, highlight video, MaxPreps, or social URL..."
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    className="flex-1 bg-white text-slate-900 placeholder:text-slate-400 border border-blue-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleImportFromLink(true)}
                    disabled={importingProfile || !importUrl.trim()}
                    className="bg-[#1c7ed6] hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 text-white text-[11px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors shrink-0 shadow-md"
                  >
                    {importingProfile ? <><Loader2 size={14} className="animate-spin" /> Importing...</> : <><Sparkles size={14} /> Auto-Fill from Link</>}
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <textarea
                    rows={3}
                    placeholder="Open your Hudl or MaxPreps profile page, press Ctrl+A then Ctrl+C, and paste here (Ctrl+V) to pull Name, Grad Year, State, Position, Height, Weight, GPA, SAT/ACT, and Stats..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-blue-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleParsePastedText(true)}
                      disabled={!pastedText.trim()}
                      className="bg-[#1c7ed6] hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 text-white text-[11px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
                    >
                      <Sparkles size={14} /> Parse & Auto-Fill Profile
                    </button>
                  </div>
                </div>
              )}

              {importStatus && !isEditModalOpen && (
                <p className={`mt-2.5 text-xs font-bold ${importStatus.type === 'success' ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {importStatus.text}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            <div className="relative shrink-0">
              <img 
                src={player.avatar || player.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} 
                alt={player.name} 
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-slate-800 object-cover bg-slate-800 shadow-xl"
              />
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full border-4 border-slate-900" title="Verified DNA Profile">
                <Shield size={16} />
              </div>
            </div>

            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-3">
                Verified Prospect Profile
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tight mb-3" style={displayFont}>
                {player.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-6 text-slate-300 font-bold uppercase tracking-widest text-xs">
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  <Trophy size={14} className="text-[#d6336c]" /> 
                  {player.primaryPos || 'ATH'} {player.secondaryPos ? `/ ${player.secondaryPos}` : ''}
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  <GraduationCap size={14} className="text-[#1c7ed6]" /> 
                  Class of {player.gradYear || 'N/A'}
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  <MapPin size={14} className="text-emerald-400" /> 
                  {player.state || 'N/A'}
                </span>
              </div>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-3xl shrink-0 mt-4 md:mt-0 backdrop-blur-sm min-w-[150px] text-center shadow-xl">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Verified DNA Score</span>
              <span className="text-4xl md:text-5xl font-black text-[#d6336c]" style={displayFont}>{player.dnaScore || '0.0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PROTECTED METRICS & RECRUITING DATA SECTION */}
      <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-10">
        
        {isLocked && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-start pt-16 sm:pt-28 bg-slate-900/20 backdrop-blur-[6px] rounded-3xl">
            <div className="bg-white p-8 rounded-3xl text-center shadow-2xl max-w-md border border-slate-200 mx-4 sticky top-32">
              <div className="w-16 h-16 bg-gradient-to-br from-[#1c7ed6] to-[#d6336c] text-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                <Lock size={30} />
              </div>
              <h3 className="text-2xl font-extrabold uppercase tracking-tight text-slate-900 mb-2" style={displayFont}>
                Full Scouting Report Locked
              </h3>
              <p className="text-xs text-slate-600 font-medium mb-6 leading-relaxed">
                Laser-timed speed verifications, skill percentages, academic transcripts, club assignments, and game film are restricted to verified <strong>College Scouts, Parents, and Athletes</strong>.
              </p>
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl uppercase tracking-wider text-xs transition-all shadow-md"
              >
                Use "Portal Login" in Top Right Header
              </button>
              {forceBlurPreview && (
                <button 
                  onClick={() => setForceBlurPreview(false)} 
                  className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[#1c7ed6] hover:underline block w-full"
                >
                  Exit Guest Preview Mode
                </button>
              )}
            </div>
          </div>
        )}

        <div 
          style={isLocked ? { filter: 'blur(12px)', WebkitFilter: 'blur(12px)' } : {}}
          className={`space-y-6 transition-all duration-300 ${isLocked ? 'select-none pointer-events-none opacity-60' : ''}`}
        >
          
          {/* ROW 1: CLUB TEAM ASSIGNMENT & CLINIC DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2 border-b border-slate-100 pb-3.5" style={displayFont}>
                <Users className="text-[#1c7ed6]" size={18} /> Club Team Assignment
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DNA Roster (Tournament Teams)</span>
                  <span className="text-sm font-extrabold text-slate-900">{isLocked ? 'DNA 17U National' : (player.dnaRoster || player.dnaTeam || player.clubTeam || 'Unassigned')}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">3rd Party / External Club</span>
                  <span className="text-sm font-extrabold text-slate-900">{isLocked ? 'External Select' : (player.externalClub || player.thirdPartyClub || 'None Listed')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2 border-b border-slate-100 pb-3.5" style={displayFont}>
                <Calendar className="text-[#d6336c]" size={18} /> Verification Clinic Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Clinic Location</span>
                  <span className="text-sm font-extrabold text-slate-900">{isLocked ? 'Horseshoe Lake Turf, NJ' : (player.combineEvent?.location || player.combineLocation || m.location || player.location || 'Verified DNA Clinic')}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Verification Date</span>
                  <span className="text-sm font-extrabold text-slate-900">{isLocked ? 'October 2026' : (player.combineEvent?.date || player.combineDate || m.date || player.date || 'Verified')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: SPEED VERIFICATIONS */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4" style={displayFont}>
              <Zap className="text-[#d6336c]" size={18} /> Speed Verifications (Laser-Timed)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="40-Yd Dash (Sec)" value={isLocked ? '4.78s' : val('sprint', 'fortyYd', 's')} highlight />
              <MetricCard label="5-10-5 Shuttle (Sec)" value={isLocked ? '4.42s' : val('shuttle', 'proShuttle', 's')} highlight />
              <MetricCard label="L-Drill (Sec)" value={isLocked ? '7.15s' : val('lDrill', 'ldrill', 's')} />
              <MetricCard label="Max Speed (MPH)" value={isLocked ? '17.4 MPH' : val('mph', 'maxSpeed', ' mph')} />
            </div>
          </div>

          {/* ROW 3: SKILLS & EXPLOSIVENESS */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4" style={displayFont}>
              <Target className="text-[#1c7ed6]" size={18} /> Skills, Measurables & Explosiveness
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
              <MetricCard label="Catching %" value={isLocked ? '92%' : val('catching', 'catchingPct', '%')} />
              <MetricCard label="Throwing %" value={isLocked ? '88%' : val('throwing', 'throwingPct', '%')} />
              <MetricCard label="Flag Pull %" value={isLocked ? '95%' : val('flag', 'flagPull', '%')} />
              <MetricCard label="Height" value={isLocked ? '5\'6"' : (player.height || val('height', 'ht', ''))} />
              <MetricCard label="Weight (lbs)" value={isLocked ? '130 lbs' : (player.weight && Number(player.weight) > 0 ? `${player.weight} lbs` : 'N/A')} />
              <MetricCard label="Broad Jump" value={isLocked ? '94"' : val('broad', 'broadJump', '"')} />
              <MetricCard label="Vertical (In)" value={isLocked ? '26.5"' : val('vertical', 'vert', '"')} />
            </div>
          </div>

          {/* ROW 4: MEDIA & IN-SEASON STATS + ACADEMIC & RECRUITING */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Media & Multi-Year In-Season Stats (6 Cols) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4" style={displayFont}>
                  <PlayCircle className="text-rose-500" size={18} /> Game Film & In-Season Stats
                </h3>
                
                {/* Embedded Highlight Tape Player (Hudl / YouTube) */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Highlight Tape (Hudl / YouTube)
                    </span>
                    {highlightUrl && !isLocked && (
                      <a
                        href={highlightUrl.includes('<iframe') ? (embedUrl || '#') : highlightUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-1 uppercase tracking-wider"
                      >
                        Open Original <ExternalLink size={11} />
                      </a>
                    )}
                  </div>

                  {isLocked ? (
                    <div className="aspect-video w-full rounded-2xl bg-slate-900 flex flex-col items-center justify-center border border-slate-200">
                      <PlayCircle size={40} className="text-slate-600 mb-2" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Verified Game Film Locked
                      </span>
                    </div>
                  ) : embedUrl ? (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-sm">
                      <iframe
                        src={embedUrl}
                        title={`${player.name} Highlight Reel`}
                        className="absolute inset-0 w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                      />
                    </div>
                  ) : highlightUrl ? (
                    <a
                      href={highlightUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
                          <PlayCircle size={20} />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900 uppercase">Watch Verified Game Film</h4>
                          <p className="text-[10px] font-bold text-rose-600 truncate max-w-[180px] mt-0.5">{highlightUrl}</p>
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-rose-600" />
                    </a>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        No Highlight Link Uploaded
                      </p>
                    </div>
                  )}
                </div>

                {/* Verified In-Season & Career Production (Hides empty fields) */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    In-Season & Career Stats
                  </span>
                  {seasons.length > 0 && !isLocked && (
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedStatYear('career')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-colors ${
                          selectedStatYear === 'career'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        Career
                      </button>
                      {seasons.map(s => (
                        <button
                          key={s.year}
                          type="button"
                          onClick={() => setSelectedStatYear(String(s.year))}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-colors ${
                            String(selectedStatYear) === String(s.year)
                              ? 'bg-[#1c7ed6] text-white'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {s.year}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isLocked ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                      <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">Receptions</span>
                      <span className="text-lg font-black text-slate-900" style={displayFont}>42</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                      <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">Rec Yds</span>
                      <span className="text-lg font-black text-slate-900" style={displayFont}>680</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                      <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">Rec TDs</span>
                      <span className="text-lg font-black text-slate-900" style={displayFont}>11</span>
                    </div>
                  </div>
                ) : visibleStatGroups.length > 0 ? (
                  <div className="space-y-4">
                    {visibleStatGroups.map(group => (
                      <div key={group.id} className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                        <span className="block text-[10px] font-black text-[#1c7ed6] uppercase tracking-widest mb-2.5">
                          {group.title} ({selectedStatYear === 'career' ? 'Career' : selectedStatYear})
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {group.filledFields.map(field => (
                            <div key={field.key} className="bg-white p-2.5 rounded-xl border border-slate-100 text-center shadow-sm">
                              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate mb-0.5">
                                {field.label}
                              </span>
                              <span className="text-base font-black text-slate-900" style={displayFont}>
                                {activeStatsObj[field.key]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs font-bold text-slate-400">
                    No in-season stats recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* Academic, Social Media & Recruiting Profile (6 Cols) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4" style={displayFont}>
                <BookOpen className="text-violet-600" size={18} /> Academic & Recruiting Information
              </h3>

              {/* GPA & SAT/ACT Row */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cumulative GPA</span>
                  <span className="text-xl font-black text-slate-900" style={displayFont}>{isLocked ? '3.92' : (player.gpa || 'N/A')}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">SAT / ACT Score</span>
                  <span className="text-xl font-black text-slate-900" style={displayFont}>{isLocked ? '1340' : (player.satAct || player.sat || player.act || 'N/A')}</span>
                </div>
              </div>

              {/* Multi-Platform Social Media Links */}
              <div className="mb-6">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                  Social Media & Recruiting Channels
                </span>
                {isLocked ? (
                  <div className="flex flex-wrap gap-2.5">
                    <span className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">@AthleteFlag27</span>
                    <span className="px-3.5 py-2 rounded-xl bg-pink-50 text-pink-700 text-xs font-bold">Instagram</span>
                    <span className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">YouTube</span>
                  </div>
                ) : (twitterHandle || player.instagram || player.youtube || player.tiktok || player.hudlProfileUrl || player.maxPrepsUrl || player.ncsaUrl || player.instagramReelsUrl) ? (
                <div className="flex flex-wrap gap-2.5">
                  {player.hudlProfileUrl && (
                    <a href={ensureHttps(player.hudlProfileUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-sm">
                      <PlayCircle size={14} /> Hudl Profile <ExternalLink size={12} className="opacity-75" />
                    </a>
                  )}
                  {player.maxPrepsUrl && (
                    <a href={ensureHttps(player.maxPrepsUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-sm">
                      <Trophy size={14} /> MaxPreps <ExternalLink size={12} className="opacity-75" />
                    </a>
                  )}
                  {player.ncsaUrl && (
                    <a href={ensureHttps(player.ncsaUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm">
                      <GraduationCap size={14} /> NCSA Profile <ExternalLink size={12} className="opacity-75" />
                    </a>
                  )}
                  {player.instagramReelsUrl && (
                    <a href={ensureHttps(player.instagramReelsUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-pink-600 hover:opacity-95 text-white text-xs font-bold transition-all shadow-sm">
                      <Video size={14} /> IG Reels <ExternalLink size={12} className="opacity-75" />
                    </a>
                  )}
                    {twitterHandle && (
                      <a href={formatSocialUrl('twitter', twitterHandle)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm">
                        <Share2 size={14} /> X / Twitter <ExternalLink size={12} className="opacity-60" />
                      </a>
                    )}
                    {player.instagram && (
                      <a href={formatSocialUrl('instagram', player.instagram)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white text-xs font-bold transition-all shadow-sm">
                        <Camera size={14} /> Instagram <ExternalLink size={12} className="opacity-75" />
                      </a>
                    )}
                    {player.youtube && (
                      <a href={formatSocialUrl('youtube', player.youtube)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm">
                        <Video size={14} /> YouTube <ExternalLink size={12} className="opacity-75" />
                      </a>
                    )}
                    {player.tiktok && (
                      <a href={formatSocialUrl('tiktok', player.tiktok)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-black text-white text-xs font-bold transition-all shadow-sm">
                        <PlayCircle size={14} /> TikTok <ExternalLink size={12} className="opacity-75" />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-400">
                    No social media links added yet.
                  </div>
                )}
              </div>

              {/* Compliance Contact Emails */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
                  <Shield size={18} className="text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-[9px] font-black text-emerald-700 uppercase tracking-widest">Guardian Compliance Email</span>
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      {isLocked ? 'parent.verified@email.com' : (player.guardianEmail || player.parentEmail || 'Protected via CRM Inbox')}
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-violet-50/60 border border-violet-100 flex items-center gap-3">
                  <Mail size={18} className="text-violet-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-[9px] font-black text-violet-700 uppercase tracking-widest">Athlete Locker Room Email</span>
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      {isLocked ? 'athlete.verified@email.com' : (player.athleteEmail || player.email || 'Protected via CRM Inbox')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Official Scout Notes */}
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <FileText size={12} /> Official DNA Evaluation & Scout Notes
                </span>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {isLocked 
                    ? "Elite lateral quickness in space with verified sub-4.5 shuttle mechanics. High-academic prospect with strong field vision and natural hands catching away from her frame."
                    : (player.scoutNotes || player.notes || player.bio || "No official evaluation notes recorded yet.")}
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* 3. SELF-SERVICE CUSTOMIZATION MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center border-b-4 border-[#1c7ed6]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <Shield size={12} /> Verified Clinic Metrics Remain Protected
                </span>
                <h3 className="text-xl font-extrabold uppercase tracking-tight mt-1" style={displayFont}>
                  Customize Athlete Profile
                </h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white bg-white/10 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomProfile} className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto space-y-6">
              
              {/* Quick Auto-Fill from Link or Pasted Profile Text */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#1c7ed6] flex items-center gap-1.5">
                    <Sparkles size={13} /> Quick Auto-Fill
                  </span>
                  <div className="inline-flex bg-white p-0.5 rounded-lg border border-blue-200">
                    <button
                      type="button"
                      onClick={() => { setImportMode('url'); setImportStatus(null); }}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        importMode === 'url' ? 'bg-[#1c7ed6] text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Paste Link
                    </button>
                    <button
                      type="button"
                      onClick={() => { setImportMode('text'); setImportStatus(null); }}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        importMode === 'text' ? 'bg-[#1c7ed6] text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Paste Profile Text (Ctrl+A)
                    </button>
                  </div>
                </div>

                {importMode === 'url' ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      placeholder="Paste public Hudl profile, highlight video, or social URL..."
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      className="flex-1 bg-white border border-blue-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#1c7ed6]"
                    />
                    <button
                      type="button"
                      onClick={() => handleImportFromLink(false)}
                      disabled={importingProfile || !importUrl.trim()}
                      className="bg-slate-900 hover:bg-[#1c7ed6] disabled:bg-slate-400 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0"
                    >
                      {importingProfile ? <><Loader2 size={13} className="animate-spin" /> Importing...</> : 'Auto-Fill Link'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      placeholder="Open your Hudl or MaxPreps profile, press Ctrl+A then Ctrl+C, and paste here (Ctrl+V)..."
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      className="w-full bg-white border border-blue-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#1c7ed6]"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleParsePastedText(false)}
                        disabled={!pastedText.trim()}
                        className="bg-slate-900 hover:bg-[#1c7ed6] disabled:bg-slate-400 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Sparkles size={13} /> Parse & Auto-Fill
                      </button>
                    </div>
                  </div>
                )}

                {importStatus && (
                  <p className={`text-[11px] font-bold ${importStatus.type === 'success' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {importStatus.text}
                  </p>
                )}
              </div>

              {/* Photo Upload & URL */}
              <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <img 
                  src={editForm.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${editForm.name}`} 
                  alt="Preview" 
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-300 bg-white shrink-0"
                />
                <div className="flex-1 w-full space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Profile Picture</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors">
                      <Upload size={13} /> Upload Photo from Device
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">or paste image link below</span>
                  </div>
                  <input 
                    type="text" 
                    placeholder="https://..." 
                    value={editForm.avatar} 
                    onChange={e => setEditForm({...editForm, avatar: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#1c7ed6]"
                  />
                </div>
              </div>

              {/* 1. Basic Identity */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 mb-3 border-b border-slate-100 pb-2" style={displayFont}>
                  1. Athlete Identity & Position
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Full Name</label>
                    <input required type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">3rd Party / External Club</label>
                    <input type="text" placeholder="Optional" value={editForm.externalClub} onChange={e => setEditForm({...editForm, externalClub: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Primary Pos</label>
                      <select value={editForm.primaryPos} onChange={e => setEditForm({...editForm, primaryPos: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold">
                        {['QB', 'WR', 'RB', 'C', 'DB', 'LB', 'RUSH', 'RUSHER', 'ATH'].map(pos => <option key={pos} value={pos}>{pos}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Secondary Pos</label>
                      <select value={editForm.secondaryPos} onChange={e => setEditForm({...editForm, secondaryPos: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold">
                        <option value="">None</option>
                        {['QB', 'WR', 'RB', 'C', 'DB', 'LB', 'RUSH', 'RUSHER', 'ATH'].map(pos => <option key={pos} value={pos}>{pos}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Grad Year</label>
                      <input type="number" placeholder="2027" value={editForm.gradYear} onChange={e => setEditForm({...editForm, gradYear: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">State (2-Letter)</label>
                      <input type="text" maxLength="2" placeholder="NJ" value={editForm.state} onChange={e => setEditForm({...editForm, state: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold uppercase" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Height</label>
                      <input
                        type="text"
                        placeholder={`e.g. 5'6"`}
                        value={editForm.height || ''}
                        onChange={e => setEditForm({ ...editForm, height: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Weight (lbs)</label>
                      <input
                        type="number"
                        placeholder="e.g. 125"
                        value={editForm.weight || ''}
                        onChange={e => setEditForm({ ...editForm, weight: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Academics, Social & Highlight Film */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 mb-3 border-b border-slate-100 pb-2" style={displayFont}>
                  2. Academics, Social Media & Highlight Film
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Cumulative GPA</label>
                    <input type="text" placeholder="e.g. 3.85" value={editForm.gpa} onChange={e => setEditForm({...editForm, gpa: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">SAT / ACT</label>
                    <input type="text" placeholder="e.g. 1280" value={editForm.satAct} onChange={e => setEditForm({...editForm, satAct: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Twitter / X Handle or URL</label>
                    <input type="text" placeholder="@handle" value={editForm.twitter} onChange={e => setEditForm({...editForm, twitter: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Instagram Handle or URL</label>
                    <input type="text" placeholder="@handle" value={editForm.instagram} onChange={e => setEditForm({...editForm, instagram: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">YouTube Channel or Handle</label>
                    <input type="text" placeholder="https://youtube.com/@..." value={editForm.youtube} onChange={e => setEditForm({...editForm, youtube: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">TikTok Handle or URL</label>
                    <input type="text" placeholder="@handle" value={editForm.tiktok} onChange={e => setEditForm({...editForm, tiktok: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Highlight Tape URL or Embed Code (Hudl / YouTube)</label>
                  <input type="text" placeholder="https://www.hudl.com/video/... or https://youtu.be/..." value={editForm.hudlLink} onChange={e => setEditForm({...editForm, hudlLink: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold" />
                  <p className="text-[10px] text-slate-400 mt-1">Make sure your Hudl highlight privacy is set to Public so it plays directly on your profile.</p>
              </div>

              {/* Multi-Link Recruiting Hub */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Full Hudl Profile URL</label>
                  <input type="url" placeholder="https://www.hudl.com/profile/..." value={editForm.hudlProfileUrl || ''} onChange={e => setEditForm({...editForm, hudlProfileUrl: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">MaxPreps Profile URL</label>
                  <input type="url" placeholder="https://www.maxpreps.com/..." value={editForm.maxPrepsUrl || ''} onChange={e => setEditForm({...editForm, maxPrepsUrl: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">NCSA Recruiting URL</label>
                  <input type="url" placeholder="https://www.ncsasports.org/..." value={editForm.ncsaUrl || ''} onChange={e => setEditForm({...editForm, ncsaUrl: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Instagram Reels Highlight URL</label>
                  <input type="url" placeholder="https://www.instagram.com/reel/..." value={editForm.instagramReelsUrl || ''} onChange={e => setEditForm({...editForm, instagramReelsUrl: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold" />
                </div>
              </div>
              </div>

              {/* 3. Multi-Year In-Season Stats Editor */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900" style={displayFont}>
                    3. In-Season Stats (By Year • Leave Blank to Hide)
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const nextYear = String((Number(editForm.yearlyStats?.[0]?.year) || new Date().getFullYear()) - 1);
                      const updated = [...(editForm.yearlyStats || []), createEmptySeason(nextYear)];
                      setEditForm({ ...editForm, yearlyStats: updated });
                      setActiveEditYearIdx(updated.length - 1);
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 hover:bg-[#1c7ed6] text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    + Add Season
                  </button>
                </div>

                {/* Season Tabs */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {(editForm.yearlyStats || []).map((season, idx) => (
                    <div key={idx} className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setActiveEditYearIdx(idx)}
                        className={`px-3 py-1.5 rounded-l-lg text-xs font-extrabold uppercase transition-colors ${
                          activeEditYearIdx === idx ? 'bg-[#1c7ed6] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {season.year || `Season ${idx + 1}`}
                      </button>
                      {(editForm.yearlyStats || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = editForm.yearlyStats.filter((_, i) => i !== idx);
                            setEditForm({ ...editForm, yearlyStats: updated });
                            setActiveEditYearIdx(0);
                          }}
                          className="px-2 py-1.5 rounded-r-lg bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white text-xs font-bold transition-colors"
                          title="Remove Season"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Active Season Inputs */}
                {editForm.yearlyStats?.[activeEditYearIdx] && (
                  <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    {/* Smart Stat Paste Box */}
                  <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1c7ed6] flex items-center gap-1.5">
                      <Sparkles size={12} /> Smart Stat Paste (Auto-Calculates Per-Game Averages)
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder='e.g. "12 games, 42 rec, 680 rec yds, 11 rec TDs, 5 INTs, 38 flag pulls"'
                        value={statPasteText}
                        onChange={(e) => setStatPasteText(e.target.value)}
                        className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#1c7ed6]"
                      />
                      <button
                        type="button"
                        onClick={handleSmartStatPaste}
                        disabled={!statPasteText.trim()}
                        className="bg-slate-900 hover:bg-[#1c7ed6] disabled:bg-slate-400 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors shrink-0"
                      >
                        Fill Stats
                      </button>
                    </div>
                    {statPasteStatus && (
                      <p className="text-[11px] font-bold text-emerald-700">{statPasteStatus}</p>
                    )}
                  </div>
                    <div className="w-40">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Season Year</label>
                      <input
                        type="text"
                        placeholder="e.g. 2026"
                        value={editForm.yearlyStats[activeEditYearIdx].year}
                        onChange={e => {
                          const updated = [...editForm.yearlyStats];
                          updated[activeEditYearIdx] = { ...updated[activeEditYearIdx], year: e.target.value };
                          setEditForm({ ...editForm, yearlyStats: updated });
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-black"
                      />
                    </div>

                    {STAT_GROUPS.map(group => (
                      <div key={group.id} className="pt-2 border-t border-slate-200/70">
                        <span className="block text-[10px] font-black text-[#1c7ed6] uppercase tracking-widest mb-2">
                          {group.title}
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {group.fields.map(field => (
                            <div key={field.key}>
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1 truncate">
                                {field.label}
                              </label>
                              <input
                                type="number"
                                step="any"
                                placeholder="-"
                                value={editForm.yearlyStats[activeEditYearIdx][field.key] ?? ''}
                                onChange={e => {
                                  const updated = [...editForm.yearlyStats];
                                  updated[activeEditYearIdx] = {
                                    ...updated[activeEditYearIdx],
                                    [field.key]: e.target.value,
                                  };
                                  setEditForm({ ...editForm, yearlyStats: updated });
                                }}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Save & Delete Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleDeleteAthleteProfile}
                  disabled={deletingProfile || savingProfile}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl font-bold uppercase tracking-wider text-xs text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  {deletingProfile ? <Loader2 size={15} className="animate-spin" /> : <><Trash2 size={15} /> Permanently Delete Profile</>}
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-3 rounded-xl font-bold uppercase tracking-wider text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={savingProfile || deletingProfile} className="px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs text-white bg-gradient-to-r from-[#1c7ed6] to-[#d6336c] hover:opacity-95 transition-all shadow-lg flex items-center gap-2">
                    {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Profile Updates</>}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// Helper component for stat cards
function MetricCard({ label, value, highlight = false }) {
  return (
    <div className={`rounded-2xl p-4 border text-center ${highlight ? 'bg-slate-900 text-white border-slate-800' : 'bg-slate-50 border-slate-100 text-slate-900'}`}>
      <span className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-slate-400">{label}</span>
      <span className={`text-xl md:text-2xl font-black ${highlight ? 'text-[#d6336c]' : 'text-slate-900'}`} style={displayFont}>{value}</span>
    </div>
  );
}