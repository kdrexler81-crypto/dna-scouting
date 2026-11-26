// src/pages/AdminPanel.jsx
import React, { useState, useMemo } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, updateDoc, addDoc, collection, deleteDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import {
  Activity, Megaphone, Building, Search, Camera, Users, GraduationCap,
  Trophy, MapPin, Zap, Ruler, ChevronLeft, Key, Check, Copy, Download,
  Loader2, Sparkles
} from 'lucide-react';
import { AdminScoutApproval } from '../components/admin/AdminScoutApproval';
import { AdminCollegeManager } from '../components/admin/AdminCollegeManager';
import { useApp } from '../context/AppContext';

const InputLabel = ({ children }) => <label className="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-widest">{children}</label>;
const FormInput = (props) => <input {...props} className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium focus:outline-none focus:border-[#1c7ed6] focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all ${props.className || ''}`} />;

// Random code generator for brand-new athletes
const generateRandomAccessCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// Deterministic code generator for existing athletes missing an accessCode in Firestore
const getStableCodeFromId = (id = '') => {
  let hash = 0;
  const str = String(id) + '_DNA_SALT';
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
};

// Hudl & YouTube Embed URL Parser
const getVideoEmbedUrl = (input) => {
  if (!input || typeof input !== 'string') return null;
  let url = input.trim();

  const iframeSrcMatch = url.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch) url = iframeSrcMatch[1];

  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
  }

  if (url.includes('hudl.com/embed/video/')) return url;

  const hudlMatch = url.match(/hudl\.com\/video\/(.+)/i);
  if (hudlMatch && hudlMatch[1]) {
    return `https://www.hudl.com/embed/video/${hudlMatch[1].split('?')[0]}`;
  }

  return null;
};

// --- COPY & PASTE PROFILE TEXT PARSER (HUDL / MAXPREPS / NCSA) ---
const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
]);

const normalizeAdminPos = (pos) => {
  if (!pos) return '';
  const upper = pos.toUpperCase();
  if (upper === 'RUSHER') return 'RUSH';
  return upper;
};

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

  // 3. Height (split into heightFeet & heightInches for AdminPanel)
  const heightMatch =
    text.match(/\b([4-6])\s*['’]\s*(1[0-1]|[0-9])\s*["”]?/) ||
    text.match(/\b(?:height|ht)\s*[:\-]?\s*([4-6])[-']\s*(1[0-1]|[0-9])\b/i);
  if (heightMatch) {
    fields.heightFeet = heightMatch[1];
    fields.heightInches = heightMatch[2];
    foundLabels.push(`Height (${heightMatch[1]}'${heightMatch[2]}")`);
  }

  // 4. Weight (e.g., 125 lbs, Weight: 125)
  const weightMatch =
    text.match(/\b([7-9]\d|1\d{2}|2[0-4]\d)\s*(?:lbs?\.?|pounds)\b/i) ||
    text.match(/\b(?:weight|wt)\s*[:\-]?\s*([7-9]\d|1\d{2}|2[0-4]\d)\b/i);
  if (weightMatch) {
    fields.weight = weightMatch[1];
    foundLabels.push(`Weight (${weightMatch[1]} lbs)`);
  }

  // 5. GPA (4.1 GPA, GPA: 3.85)
  const gpaMatch =
    text.match(/\bgpa\s*(?:of|:|-)?\s*([2-5]\.\d{1,2})\b/i) ||
    text.match(/\b([2-5]\.\d{1,2})\s*gpa\b/i);
  if (gpaMatch) {
    fields.gpa = gpaMatch[1];
    foundLabels.push(`GPA (${gpaMatch[1]})`);
  }

  // 6. SAT / ACT (maps to metrics.sat)
  const satMatch = text.match(/\bsat\s*[:\-]?\s*(1[0-6]\d{2}|[89]\d{2})\b/i) || text.match(/\b(1[0-6]\d{2})\s*sat\b/i);
  const actMatch = text.match(/\bact\s*[:\-]?\s*([1-3]\d)\b/i) || text.match(/\b([1-3]\d)\s*act\b/i);
  if (satMatch) {
    fields.sat = satMatch[1];
    foundLabels.push(`SAT (${satMatch[1]})`);
  } else if (actMatch) {
    fields.sat = actMatch[1];
    foundLabels.push(`ACT (${actMatch[1]})`);
  }

  // 7. Positions (matched to AdminPanel select options)
  const posMap = {
    QB: 'QB', QUARTERBACK: 'QB',
    WR: 'WR', 'WIDE RECEIVER': 'WR', RECEIVER: 'WR',
    RB: 'RB', 'RUNNING BACK': 'RB',
    TE: 'TE', 'TIGHT END': 'TE',
    C: 'C', CENTER: 'C',
    DB: 'DB', FS: 'DB', SS: 'DB', CB: 'DB', S: 'DB', SAFETY: 'DB', CORNERBACK: 'DB',
    LB: 'LB', OLB: 'LB', MLB: 'LB', ILB: 'LB', LINEBACKER: 'LB',
    RUSH: 'RUSH', RUSHER: 'RUSH', BLITZER: 'RUSH',
    ATH: 'ATH', ATHLETE: 'ATH'
  };
  const posRegex = /\b(QB|WR|RB|TE|DB|FS|SS|CB|LB|OLB|MLB|ILB|RUSH|RUSHER|ATH|Quarterback|Wide Receiver|Running Back|Tight End|Linebacker|Cornerback|Safety)\b/gi;
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

// Multi-Year In-Season Stat Schema (Matches ProfilePage.jsx)
const STAT_GROUPS = [
  {
    id: 'passing',
    title: 'Passing (QB)',
    fields: [
      { key: 'comp', label: 'Completions' },
      { key: 'att', label: 'Attempts' },
      { key: 'passYds', label: 'Passing Yds' },
      { key: 'passTds', label: 'Passing TDs' },
      { key: 'passInts', label: 'INTs Thrown' },
      { key: 'compPg', label: 'Comp / Game' },
      { key: 'attPg', label: 'Att / Game' },
      { key: 'passYdsPg', label: 'Pass Yds / Game' },
      { key: 'passTdsPg', label: 'Pass TDs / Game' },
      { key: 'passIntsPg', label: 'INTs / Game' },
    ],
  },
  {
    id: 'rushing',
    title: 'Rushing',
    fields: [
      { key: 'rushAtt', label: 'Rushes' },
      { key: 'rushYds', label: 'Total Rush Yds' },
      { key: 'rushYdsPg', label: 'Rush Yds / Game' },
      { key: 'rushTds', label: 'Rushing TDs' },
    ],
  },
  {
    id: 'receiving',
    title: 'Receiving',
    fields: [
      { key: 'rec', label: 'Receptions' },
      { key: 'recYds', label: 'Total Rec Yds' },
      { key: 'recYdsPg', label: 'Rec Yds / Game' },
      { key: 'recTds', label: 'Receiving TDs' },
    ],
  },
  {
    id: 'defense',
    title: 'Defense',
    fields: [
      { key: 'defInts', label: 'Interceptions' },
      { key: 'flagPullsPg', label: 'Flag Pulls / Game' },
      { key: 'pbu', label: 'Passes Defended' },
      { key: 'tfl', label: 'Flag Pulls for Loss' },
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

export const AdminPanel = ({ onBack, onLogout }) => {
  const { app, appId, db, storage, isFirebaseActive: dbConfigured, players, scouts } = useApp();

  const [activeTab, setActiveTab] = useState('athlete');
  const [savingAthlete, setSavingAthlete] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedExistingId, setSelectedExistingId] = useState("");
  const [athleteSearchTerm, setAthleteSearchTerm] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [activeSeasonIdx, setActiveSeasonIdx] = useState(0);

  // --- QUICK AUTO-FILL (LINK + PASTE TEXT) STATE ---
  const [importMode, setImportMode] = useState('url'); // 'url' | 'text'
  const [importUrl, setImportUrl] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [importingProfile, setImportingProfile] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  
  const [newsTitle, setNewsTitle] = useState('');
  const [newsCategory, setNewsCategory] = useState('ANNOUNCEMENT');

  const today = new Date().toISOString().split('T')[0];

  const createDefaultMetrics = () => ({
    name: '', primaryPos: 'QB', secondaryPos: '', gradYear: '', city: '', state: '', dnaTeam: 'None', externalClub: '',
    gpa: '', sat: '', twitter: '', instagram: '', youtube: '', tiktok: '', guardianEmail: '', athleteEmail: '', scoutNotes: '', heightFeet: '', heightInches: '', weight: '',
    sprint: '', sprintVerify: 'laser', shuttle: '', shuttleVerify: 'stopwatch', lDrill: '', lDrillVerify: 'stopwatch', mph: '', mphVerify: 'laser',
    broadFeet: '', broadInches: '', verticalInches: '', catchingPct: '', throwingPct: '', flagPullingPct: '', 
    hudlLink: '', yearlyStats: [createEmptySeason()],
    featured: false,
    featuredBlurb: '',
  
    combineLocation: '', combineDate: today, accessCode: generateRandomAccessCode()
  });

  const [metrics, setMetrics] = useState(() => createDefaultMetrics());

  const filteredAdminPlayers = useMemo(() => {
    let list = [...players];
    if (athleteSearchTerm) {
      list = list.filter(p => p.id === selectedExistingId || (p.name || '').toLowerCase().includes(athleteSearchTerm.toLowerCase()));
    }
    return list.sort((a, b) => (a.name || '').split(' ').slice(-1)[0].localeCompare((b.name || '').split(' ').slice(-1)[0]));
  }, [players, athleteSearchTerm, selectedExistingId]);

  // --- AUTO-FILL HANDLER 1: IMPORT FROM LINK ---
  const handleImportFromLink = async () => {
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
        setMetrics((prev) => ({
          ...prev,
          ...(found.name ? { name: found.name } : {}),
          ...(found.gradYear ? { gradYear: found.gradYear } : {}),
          ...(found.state ? { state: found.state.toUpperCase() } : {}),
          ...(found.primaryPos ? { primaryPos: normalizeAdminPos(found.primaryPos) } : {}),
          ...(found.hudlLink ? { hudlLink: found.hudlLink } : {}),
          ...(found.twitter ? { twitter: found.twitter } : {}),
          ...(found.instagram ? { instagram: found.instagram } : {}),
          ...(found.youtube ? { youtube: found.youtube } : {}),
          ...(found.tiktok ? { tiktok: found.tiktok } : {}),
        }));

        if (found.avatar) {
          setPhotoPreview(found.avatar);
        }

        setImportStatus({
          type: 'success',
          text: data?.fetchBlocked
            ? `Saved link (${keys.join(', ')}). That site blocked automatic scraping—switch to "Paste Profile Text (Ctrl+A)" to pull Height, Weight, GPA, Position, and Stats.`
            : `Auto-filled: ${keys.join(', ')}. Review the fields below and click Save Profile.`
        });
        setImportUrl('');
      }
    } catch (err) {
      setImportStatus({
        type: 'error',
        text: err.message || 'Failed to import link. Make sure importExternalProfile is deployed.'
      });
    } finally {
      setImportingProfile(false);
    }
  };

  // --- AUTO-FILL HANDLER 2: PARSE COPIED PROFILE TEXT ---
  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;
    const { fields, parsedStats, foundLabels } = parsePastedProfileText(pastedText);

    if (foundLabels.length === 0) {
      setImportStatus({
        type: 'error',
        text: 'Could not detect profile info in that text. Open the Hudl or MaxPreps About/Bio page, press Ctrl+A then Ctrl+C, and paste again.'
      });
      return;
    }

    setMetrics((prev) => {
      const updatedSeasons = Array.isArray(prev.yearlyStats) && prev.yearlyStats.length > 0
        ? [...prev.yearlyStats]
        : [createEmptySeason()];

      if (Object.keys(parsedStats).length > 0) {
        const targetIdx = updatedSeasons[activeSeasonIdx] ? activeSeasonIdx : 0;
        updatedSeasons[targetIdx] = {
          ...updatedSeasons[targetIdx],
          ...parsedStats
        };
      }

      return {
        ...prev,
        ...fields,
        yearlyStats: updatedSeasons
      };
    });

    setImportStatus({
      type: 'success',
      text: `Parsed from text: ${foundLabels.join(', ')}. Review the fields below and click Save Profile.`
    });
    setPastedText('');
  };

  // --- ONE-CLICK BATCH LOCK & CSV EXPORT FOR MAIL MERGE ---
  const handleExportAccessCodesCSV = async () => {
    if (!players || players.length === 0) {
      alert("No athletes found in the database to export.");
      return;
    }

    setExportingCsv(true);
    try {
      const sorted = [...players].sort((a, b) =>
        (a.name || '').split(' ').slice(-1)[0].localeCompare((b.name || '').split(' ').slice(-1)[0])
      );

      const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

      const headers = [
        'Athlete Name',
        'Athlete First Name',
        'Grad Year',
        'Primary Position',
        'DNA Score',
        'Access Code',
        'Guardian Email',
        'Athlete Email',
        'Direct Profile URL'
      ];

      const rows = [];

      for (const p of sorted) {
        const finalCode = p.accessCode || getStableCodeFromId(p.id);

        if (!p.accessCode && dbConfigured && db && p.id) {
          try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', p.id), {
              accessCode: finalCode
            });
          } catch (err) {
            console.error(`Failed to lock code for ${p.name}:`, err);
          }
        }

        const firstName = (p.name || '').trim().split(' ')[0] || '';
        const profileUrl = `https://www.dnaflagratings.com/player/${p.id}`;

        rows.push([
          escapeCsv(p.name || ''),
          escapeCsv(firstName),
          escapeCsv(p.gradYear || ''),
          escapeCsv(p.primaryPos || p.pos || ''),
          escapeCsv(p.dnaScore || '0.0'),
          escapeCsv(finalCode),
          escapeCsv(p.guardianEmail || p.parentEmail || ''),
          escapeCsv(p.athleteEmail || p.email || ''),
          escapeCsv(profileUrl)
        ].join(','));
      }

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DNA_Athlete_Access_Codes_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error exporting CSV: " + err.message);
    } finally {
      setExportingCsv(false);
    }
  };

  const handleSelectExisting = async (playerId) => {
    setSelectedExistingId(playerId);
    setCodeCopied(false);
    setActiveSeasonIdx(0);
    setImportStatus(null);
    setImportUrl('');
    setPastedText('');

    if (!playerId) {
      setMetrics(createDefaultMetrics());
      setPhotoPreview(null);
      return;
    }

    const p = players.find(player => player.id === playerId);
    if (p) {
      const lockedAccessCode = p.accessCode || getStableCodeFromId(p.id);

      if (!p.accessCode && dbConfigured && db) {
        try {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', p.id), {
            accessCode: lockedAccessCode
          });
        } catch (err) {
          console.error("Auto-locking accessCode failed:", err);
        }
      }

      const existingSeasons = Array.isArray(p.yearlyStats) && p.yearlyStats.length > 0
        ? p.yearlyStats.map(s => ({ ...createEmptySeason(s.year), ...s }))
        : [createEmptySeason()];

      setMetrics({
        name: p.name || '', primaryPos: p.primaryPos || p.pos || 'QB', secondaryPos: p.secondaryPos || '', dnaTeam: p.dnaTeam || 'None', externalClub: p.externalClub || '',
        gradYear: p.gradYear || '', city: p.city || '', state: p.state || '', gpa: p.gpa || '', sat: p.sat || p.satAct || '',
        twitter: p.twitter || '', instagram: p.instagram || '', youtube: p.youtube || '', tiktok: p.tiktok || '',
        guardianEmail: p.guardianEmail || '', athleteEmail: p.athleteEmail || '',
        scoutNotes: p.scoutNotes || '', weight: p.weight || '', hudlLink: p.hudlLink || '',
        yearlyStats: existingSeasons,
        combineLocation: p.combineEvent?.location || p.combineLocation || '', combineDate: p.combineEvent?.date || p.combineDate || today,
        sprint: p.metrics?.sprint ? String(p.metrics.sprint).replace('s', '') : '', sprintVerify: p.speedVerifications?.sprint || 'laser',
        shuttle: p.metrics?.shuttle ? String(p.metrics.shuttle).replace('s', '') : '', shuttleVerify: p.speedVerifications?.shuttle || 'stopwatch',
        lDrill: p.metrics?.lDrill ? String(p.metrics.lDrill).replace('s', '') : '', lDrillVerify: p.speedVerifications?.lDrill || 'stopwatch',
        mph: p.metrics?.mph ? String(p.metrics.mph).replace(' mph', '') : '', mphVerify: p.speedVerifications?.mph || 'laser',
        verticalInches: p.metrics?.vertical ? String(p.metrics.vertical).replace('"', '') : '',
        heightFeet: p.height?.includes("'") ? p.height.split("'")[0] : '', heightInches: p.height?.includes("'") ? p.height.split("'")[1].replace('"', '') : '',
        broadFeet: p.metrics?.broad?.includes("'") ? p.metrics.broad.split("'")[0] : '', broadInches: p.metrics?.broad?.includes("'") ? p.metrics.broad.split("'")[1].replace('"', '') : '',
        catchingPct: p.metrics?.catching ? String(p.metrics.catching).replace('%', '') : '', throwingPct: p.metrics?.throwing ? String(p.metrics.throwing).replace('%', '') : '', flagPullingPct: p.metrics?.flag ? String(p.metrics.flag).replace('%', '') : '',
        featured: Boolean(p.featured),
        featuredBlurb: p.featuredBlurb || '',
        accessCode: lockedAccessCode
      });
      setPhotoPreview(p.avatar || null);
    }
  };

  const handleCopyAccessCode = () => {
    if (!metrics.accessCode) return;
    navigator.clipboard.writeText(metrics.accessCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width, height = img.height;
          if (width > height) { if (width > 400) { height *= 400 / width; width = 400; } } else { if (height > 400) { width *= 400 / height; height = 400; } }
          canvas.width = width; canvas.height = height; canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          setPhotoPreview(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const submitCombineData = async (e) => {
    e.preventDefault();
    setSavingAthlete(true);
    try {
      const auth = getAuth(app);
      if (!auth.currentUser) { alert("Firebase Error: No secure session."); setSavingAthlete(false); return; }
      const secureToken = await auth.currentUser.getIdToken(true);
      const calculateDNAScore = httpsCallable(getFunctions(app), 'calculateDNAScore');

      const existingPlayer = selectedExistingId ? players.find(p => p.id === selectedExistingId) : null;
      let historyPool = existingPlayer?.combineHistory ? [...existingPlayer.combineHistory] : [];
      if (historyPool.length > 0 && historyPool[historyPool.length - 1].date === metrics.combineDate) historyPool.pop();

      const parseNum = (val) => {
        const n = Number(String(val ?? '').replace(/[^0-9.]/g, ''));
        return Number.isFinite(n) && n > 0 ? n : 0;
      };
      const safeMin = (arr) => {
        const valid = arr.filter(v => Number.isFinite(v) && v > 0);
        return valid.length > 0 ? Math.min(...valid) : 0;
      };
      const safeMax = (arr) => {
        const valid = arr.filter(v => Number.isFinite(v) && v > 0);
        return valid.length > 0 ? Math.max(...valid) : 0;
      };

      const bestSprint = safeMin([...historyPool.map(e => parseNum(e.metrics?.sprint)), parseNum(metrics.sprint)]);
      const bestShuttle = safeMin([...historyPool.map(e => parseNum(e.metrics?.shuttle)), parseNum(metrics.shuttle)]);
      const bestLDrill = safeMin([...historyPool.map(e => parseNum(e.metrics?.lDrill)), parseNum(metrics.lDrill)]);
      const bestMph = safeMax([...historyPool.map(e => parseNum(e.metrics?.mph)), parseNum(metrics.mph)]);
      const currentBroadInches = (parseNum(metrics.broadFeet) * 12) + parseNum(metrics.broadInches);
      const catchingVal = parseNum(metrics.catchingPct);
      const throwingVal = parseNum(metrics.throwingPct);
      const flagVal = parseNum(metrics.flagPullingPct);
      const verticalVal = parseNum(metrics.verticalInches);

      const hasAnyCombineMetric = (
        bestSprint > 0 || bestShuttle > 0 || bestLDrill > 0 || bestMph > 0 ||
        catchingVal > 0 || throwingVal > 0 || flagVal > 0 || currentBroadInches > 0 || verticalVal > 0
      );

      let computedScore = 0;
      if (hasAnyCombineMetric) {
        const overallResult = await calculateDNAScore({
          token: secureToken,
          sprint: bestSprint,
          shuttle: bestShuttle,
          lDrill: bestLDrill,
          mph: bestMph,
          catchingPct: catchingVal,
          throwingPct: throwingVal,
          flagPullingPct: flagVal,
          broadInches: currentBroadInches,
          vertical: verticalVal
        });
        const rawScore = Number(overallResult?.data?.dnaScore);
        computedScore = Number.isFinite(rawScore) ? rawScore : 0;
      }

      const newCombineRecord = {
        location: metrics.combineLocation || 'Verified DNA Clinic',
        date: metrics.combineDate || today,
        timestamp: new Date().toLocaleTimeString(),
        dnaScore: computedScore,
        height: (metrics.heightFeet || metrics.heightInches) ? `${metrics.heightFeet || 0}'${metrics.heightInches || 0}"` : "",
        weight: parseNum(metrics.weight),
        speedVerifications: {
          sprint: metrics.sprintVerify,
          shuttle: metrics.shuttleVerify,
          lDrill: metrics.lDrillVerify,
          mph: metrics.mphVerify
        },
        metrics: {
          sprint: metrics.sprint ? `${Number(metrics.sprint).toFixed(2)}s` : "",
          shuttle: metrics.shuttle ? `${Number(metrics.shuttle).toFixed(2)}s` : "",
          lDrill: metrics.lDrill ? `${Number(metrics.lDrill).toFixed(2)}s` : "",
          mph: metrics.mph ? `${metrics.mph} mph` : "",
          broad: (metrics.broadFeet || metrics.broadInches) ? `${metrics.broadFeet || 0}'${metrics.broadInches || 0}"` : "",
          vertical: metrics.verticalInches ? `${metrics.verticalInches}"` : "",
          catching: metrics.catchingPct ? `${metrics.catchingPct}%` : "",
          throwing: metrics.throwingPct ? `${metrics.throwingPct}%` : "",
          flag: metrics.flagPullingPct ? `${metrics.flagPullingPct}%` : ""
        }
      };

      const finalAccessCode = existingPlayer?.accessCode || metrics.accessCode || generateRandomAccessCode();

      const playerData = {
        name: metrics.name.trim(),
        primaryPos: metrics.primaryPos,
        secondaryPos: metrics.secondaryPos,
        gradYear: Number(metrics.gradYear) || 2028,
        city: metrics.city,
        state: (metrics.state || '').toUpperCase(),
        dnaTeam: metrics.dnaTeam,
        externalClub: metrics.externalClub,
        gpa: metrics.gpa,
        sat: metrics.sat,
        satAct: metrics.sat,
        twitter: (metrics.twitter || '').trim(),
        instagram: (metrics.instagram || '').trim(),
        youtube: (metrics.youtube || '').trim(),
        tiktok: (metrics.tiktok || '').trim(),
        guardianEmail: (metrics.guardianEmail || '').trim(),
        athleteEmail: (metrics.athleteEmail || '').trim(),
        accessCode: finalAccessCode,
        scoutNotes: metrics.scoutNotes,
        hudlLink: (metrics.hudlLink || '').trim(),
        yearlyStats: metrics.yearlyStats || [],
        height: newCombineRecord.height,
        weight: newCombineRecord.weight,
        dnaScore: computedScore,
        combineEvent: { location: newCombineRecord.location, date: newCombineRecord.date },
        combineLocation: newCombineRecord.location,
        combineDate: newCombineRecord.date,
        speedVerifications: newCombineRecord.speedVerifications,
        metrics: newCombineRecord.metrics,
        featured: Boolean(metrics.featured),
        featuredBlurb: (metrics.featuredBlurb || '').trim(),
        updatedAt: Date.now()
      };

      if (dbConfigured && db) {
        let finalAvatarUrl = existingPlayer?.avatar || "";
        if (photoPreview && photoPreview.startsWith('data:image')) {
          const storageRef = ref(storage, `avatars/${Date.now()}_${metrics.name.replace(/\s+/g, '_')}.jpg`);
          await uploadString(storageRef, photoPreview, 'data_url');
          finalAvatarUrl = await getDownloadURL(storageRef);
        } else if (photoPreview && /^https?:\/\//i.test(photoPreview)) {
          finalAvatarUrl = photoPreview;
        }

        if (selectedExistingId) {
          let updatedHistory = existingPlayer?.combineHistory ? [...existingPlayer.combineHistory] : [];
          if (updatedHistory.length > 0 && updatedHistory[updatedHistory.length - 1].date === newCombineRecord.date) {
            updatedHistory[updatedHistory.length - 1] = newCombineRecord;
          } else {
            updatedHistory.push(newCombineRecord);
          }
          
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', selectedExistingId), { 
            ...playerData, combineHistory: updatedHistory, avatar: finalAvatarUrl 
          });
          
          if (computedScore > 0) {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'news'), {
              title: `${metrics.name} posted a new verified DNA Score of ${computedScore}!`, category: 'COMBINE', timestamp: Date.now()
            });
          }
        } else {
          playerData.avatar = finalAvatarUrl;
          playerData.views = 0; 
          playerData.createdAt = Date.now(); 
          playerData.combineHistory = [newCombineRecord];
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'players'), playerData);
          
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'news'), {
            title: `New Prospect Added: ${metrics.name} (Class of ${metrics.gradYear}) joins the national leaderboard.`, category: 'ANNOUNCEMENT', timestamp: Date.now()
          });
        }
      }

      alert(`Saved ${metrics.name}! DNA Score: ${computedScore} | Family Access Code: ${finalAccessCode}`);
      setMetrics(createDefaultMetrics());
      setSelectedExistingId("");
      setPhotoPreview(null);
      setActiveSeasonIdx(0);
      setImportStatus(null);
      setImportUrl('');
      setPastedText('');
    } catch (err) {
      alert("Error saving: " + err.message);
    }
    setSavingAthlete(false);
  };

  const deleteAthlete = async () => {
    if (!selectedExistingId) return;
    if (!window.confirm(`Delete ${metrics.name}?`)) return;
    if (dbConfigured && db) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', selectedExistingId));
    setMetrics(createDefaultMetrics());
    setSelectedExistingId("");
    setPhotoPreview(null);
    setActiveSeasonIdx(0);
    setImportStatus(null);
  };

  const submitNews = async (e) => {
    e.preventDefault(); if (!newsTitle) return;
    try { if (dbConfigured && db) { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'news'), { title: newsTitle, category: newsCategory, timestamp: Date.now() }); } setNewsTitle(''); alert('News update posted successfully!'); } 
    catch (err) { alert("Error posting news: " + err.message); }
  };

  const previewEmbedUrl = getVideoEmbedUrl(metrics.hudlLink);

  return (
    <div className="max-w-4xl mx-auto p-4 py-8 animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="font-semibold flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"><ChevronLeft size={18} /> Return to Hub</button>
        <button onClick={onLogout} className="text-xs font-bold text-rose-600 border border-rose-200 bg-rose-50 px-5 py-2.5 rounded-full hover:bg-rose-100 transition-colors uppercase tracking-wider">Sign Out Admin</button>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-4 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
         <button onClick={() => setActiveTab('athlete')} className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-2 transition-all ${activeTab === 'athlete' ? 'text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`} style={activeTab === 'athlete' ? { background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' } : {}}><Activity size={16} className="hidden sm:block"/> Athlete Entry</button>
         <button onClick={() => setActiveTab('news')} className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-2 transition-all ${activeTab === 'news' ? 'text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`} style={activeTab === 'news' ? { background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' } : {}}><Megaphone size={16} className="hidden sm:block"/> Post News</button>
         <button onClick={() => setActiveTab('scouts')} className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-2 transition-all ${activeTab === 'scouts' ? 'text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`} style={activeTab === 'scouts' ? { background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' } : {}}>
           <Building size={16} className="hidden sm:block"/> Manage Scouts {scouts.filter(s => !s.approved).length > 0 && <span className="bg-rose-500 text-white rounded-full px-2 py-0.5 text-[10px]">{scouts.filter(s => !s.approved).length}</span>}
         </button>
         <button onClick={() => setActiveTab('colleges')} className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-2 transition-all ${activeTab === 'colleges' ? 'text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`} style={activeTab === 'colleges' ? { background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' } : {}}>
          <GraduationCap size={16} className="hidden sm:block"/> Manage Colleges
         </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-10">
        {activeTab === 'athlete' && (
           <div className="animate-in fade-in slide-in-from-left-4">
              
              {/* ATHLETE SELECTOR + BATCH EXPORT CSV BUTTON */}
              <div className="bg-slate-50/80 p-6 rounded-2xl mb-6 border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <label className="text-xs font-extrabold uppercase tracking-widest text-slate-800">
                    Select Existing Athlete (Or Create New)
                  </label>
                  <button
                    type="button"
                    onClick={handleExportAccessCodesCSV}
                    disabled={exportingCsv}
                    className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
                  >
                    {exportingCsv ? (
                      <><Loader2 size={14} className="animate-spin" /> Locking & Exporting...</>
                    ) : (
                      <><Download size={14} className="text-emerald-400" /> Lock & Export All Codes (CSV)</>
                    )}
                  </button>
                </div>

                <div className="relative mb-3"><Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search athlete by name..." className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all focus:outline-none" value={athleteSearchTerm} onChange={(e) => setAthleteSearchTerm(e.target.value)} /></div>
                <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-semibold focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all focus:outline-none" value={selectedExistingId} onChange={(e) => handleSelectExisting(e.target.value)}><option value="">+ Create Brand New Athlete</option>{filteredAdminPlayers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.gradYear})</option>)}</select>
              </div>

              {/* QUICK AUTO-FILL FROM HUDL / MAXPREPS / PASTE TEXT */}
              <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-5 mb-8 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#1c7ed6] flex items-center gap-1.5">
                    <Sparkles size={14} /> Quick Auto-Fill Prospect
                  </span>
                  <div className="inline-flex bg-white p-0.5 rounded-lg border border-blue-200">
                    <button
                      type="button"
                      onClick={() => { setImportMode('url'); setImportStatus(null); }}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        importMode === 'url' ? 'bg-[#1c7ed6] text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Paste Link
                    </button>
                    <button
                      type="button"
                      onClick={() => { setImportMode('text'); setImportStatus(null); }}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        importMode === 'text' ? 'bg-[#1c7ed6] text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Paste Profile Text (Ctrl+A)
                    </button>
                  </div>
                </div>

                {importMode === 'url' ? (
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="url"
                      placeholder="Paste public Hudl profile, highlight video, MaxPreps, or social URL..."
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      className="flex-1 bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#1c7ed6]"
                    />
                    <button
                      type="button"
                      onClick={handleImportFromLink}
                      disabled={importingProfile || !importUrl.trim()}
                      className="bg-slate-900 hover:bg-[#1c7ed6] disabled:bg-slate-400 text-white text-[11px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-sm"
                    >
                      {importingProfile ? <><Loader2 size={14} className="animate-spin" /> Importing...</> : <><Sparkles size={14} /> Auto-Fill Link</>}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <textarea
                      rows={3}
                      placeholder="Open a Hudl or MaxPreps profile page, press Ctrl+A then Ctrl+C, and paste here (Ctrl+V) to auto-fill Name, Grad Year, State, Position, Height, Weight, GPA, SAT/ACT, and Stats..."
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#1c7ed6]"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleParsePastedText}
                        disabled={!pastedText.trim()}
                        className="bg-slate-900 hover:bg-[#1c7ed6] disabled:bg-slate-400 text-white text-[11px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Sparkles size={14} /> Parse & Auto-Fill Form
                      </button>
                    </div>
                  </div>
                )}

                {importStatus && (
                  <p className={`text-xs font-bold ${importStatus.type === 'success' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {importStatus.text}
                  </p>
                )}
              </div>

              <form onSubmit={submitCombineData} className="space-y-8">
                {/* FEATURED ATHLETE SPOTLIGHT TOGGLE */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(metrics.featured)}
                    onChange={(e) =>
                      setMetrics({ ...metrics, featured: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-amber-300 text-amber-500 focus:ring-amber-400"
                  />
                  <div>
                    <span className="block text-xs font-extrabold uppercase tracking-wider text-amber-950">
                      Pin as Featured Athlete on Landing Page
                    </span>
                    <span className="block text-[10px] font-semibold text-amber-700">
                      Spotlights this athlete in the banner above the National Leaderboard.
                    </span>
                  </div>
                </label>

                {metrics.featured && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-amber-800 mb-1">
                      Optional Spotlight Blurb (1–2 sentences)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Blazing 4.72 laser 40 and 18 TDs this spring—top 2027 WR prospect."
                      value={metrics.featuredBlurb || ''}
                      onChange={(e) =>
                        setMetrics({ ...metrics, featuredBlurb: e.target.value })
                      }
                      className="w-full bg-white border border-amber-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>
                {/* SECURE ACCESS CODE */}
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-emerald-900 flex items-center gap-2 uppercase tracking-tight">
                      <Key size={16}/> Permanent Family Access Code
                    </h3>
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mt-1">
                      This code is permanently locked to this athlete. Share it with the family to claim their account.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-white border-2 border-emerald-300 rounded-xl px-6 py-3 text-2xl font-black text-emerald-600 tracking-widest select-all">
                      {metrics.accessCode}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAccessCode}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      {codeCopied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}
                    </button>
                  </div>
                </div>

                {/* BASIC IDENTITY */}
                <div className="flex flex-col sm:flex-row items-center gap-8 bg-slate-50/80 p-6 rounded-2xl border border-slate-100">
                  <div className="relative w-36 h-36 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden shrink-0 group hover:border-[#1c7ed6] transition-colors cursor-pointer">
                     {photoPreview ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" /> : <div className="text-center p-2"><Camera className="w-8 h-8 mx-auto text-slate-300 mb-2 group-hover:text-[#1c7ed6] transition-colors" /></div>}
                     <input type="file" accept="image/*" onChange={handlePhotoCapture} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-5">
                     <div className="sm:col-span-2"><InputLabel>Name</InputLabel><FormInput required value={metrics.name} onChange={e => setMetrics({...metrics, name: e.target.value})} /></div>
                     <div><InputLabel>Primary Position</InputLabel><select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all focus:outline-none" value={metrics.primaryPos} onChange={e => setMetrics({...metrics, primaryPos: e.target.value})}>{["QB", "RB", "WR", "TE", "C", "DB", "LB", "RUSH", "ATH"].map(pos => <option key={pos} value={pos}>{pos}</option>)}</select></div>
                     <div><InputLabel>Secondary Position</InputLabel><select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all focus:outline-none" value={metrics.secondaryPos} onChange={e => setMetrics({...metrics, secondaryPos: e.target.value})}><option value="">None</option>{["QB", "RB", "WR", "TE", "C", "DB", "LB", "RUSH", "ATH"].map(pos => <option key={pos} value={pos}>{pos}</option>)}</select></div>
                     <div><InputLabel>Grad Year</InputLabel><FormInput required type="number" value={metrics.gradYear} onChange={e => setMetrics({...metrics, gradYear: e.target.value})} /></div>
                     <div><InputLabel>State</InputLabel><FormInput required maxLength="2" placeholder="NJ" value={metrics.state} onChange={e => setMetrics({...metrics, state: e.target.value.toUpperCase()})} /></div>
                  </div>
                </div>

                {/* CLUB TEAM ASSIGNMENT */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-t-4 border-t-[#d6336c]">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest mb-6 flex items-center gap-2 text-[#d6336c]"><Users size={16} /> Club Team Assignment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <InputLabel>DNA Roster (Tournament Teams)</InputLabel>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#d6336c]/20 transition-all" value={metrics.dnaTeam} onChange={e => setMetrics({...metrics, dnaTeam: e.target.value})}>
                        <option value="None">Not Assigned</option><option value="DNA 18U Elite">DNA 18U Elite</option><option value="DNA 18U Select">DNA 18U Select</option><option value="DNA 15U Elite">DNA 15U Elite</option><option value="DNA 15U Select">DNA 15U Select</option><option value="DNA 12U">DNA 12U</option>
                      </select>
                    </div>
                    <div><InputLabel>3rd Party / External Club</InputLabel><FormInput type="text" placeholder="e.g. Next Level Athletics" value={metrics.externalClub} onChange={e => setMetrics({...metrics, externalClub: e.target.value})} /></div>
                  </div>
                </div>

                {/* ACADEMIC, SOCIAL MEDIA & RECRUITING */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-t-4 border-t-[#1c7ed6]">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest mb-6 flex items-center gap-2 text-[#1c7ed6]"><GraduationCap size={16} /> Academic, Social & Recruiting</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                    <div><InputLabel>GPA</InputLabel><FormInput type="number" step="0.01" value={metrics.gpa} onChange={e => setMetrics({...metrics, gpa: e.target.value})} /></div>
                    <div><InputLabel>SAT/ACT</InputLabel><FormInput type="text" value={metrics.sat} onChange={e => setMetrics({...metrics, sat: e.target.value})} /></div>
                    <div><InputLabel>Twitter / X</InputLabel><FormInput type="text" placeholder="@handle" value={metrics.twitter} onChange={e => setMetrics({...metrics, twitter: e.target.value})} /></div>
                    <div><InputLabel>Instagram</InputLabel><FormInput type="text" placeholder="@handle" value={metrics.instagram} onChange={e => setMetrics({...metrics, instagram: e.target.value})} /></div>
                    <div><InputLabel>YouTube Channel / Handle</InputLabel><FormInput type="text" placeholder="https://youtube.com/@..." value={metrics.youtube} onChange={e => setMetrics({...metrics, youtube: e.target.value})} /></div>
                    <div><InputLabel>TikTok</InputLabel><FormInput type="text" placeholder="@handle" value={metrics.tiktok} onChange={e => setMetrics({...metrics, tiktok: e.target.value})} /></div>
                    <div><InputLabel>Guardian Email (Parent)</InputLabel><FormInput type="email" value={metrics.guardianEmail} onChange={e => setMetrics({...metrics, guardianEmail: e.target.value})} /></div>
                    <div><InputLabel>Athlete Email (Player)</InputLabel><FormInput type="email" value={metrics.athleteEmail} onChange={e => setMetrics({...metrics, athleteEmail: e.target.value})} /></div>
                  </div>
                  <div><InputLabel>Scout Notes</InputLabel><textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all focus:outline-none min-h-[100px]" value={metrics.scoutNotes} onChange={e => setMetrics({...metrics, scoutNotes: e.target.value})} /></div>
                </div>

                {/* MEDIA (LIVE EMBED PREVIEW) & MULTI-YEAR IN-SEASON STATS */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-t-4 border-t-amber-500">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest mb-6 flex items-center gap-2 text-amber-500"><Trophy size={16} /> Game Film & Multi-Year In-Season Stats</h3>
                  
                  {/* Highlight Video Input + Live Embedded Preview */}
                  <div className="mb-6 space-y-3">
                    <div>
                      <InputLabel>Highlight Tape (Hudl / YouTube URL or Embed Code)</InputLabel>
                      <FormInput
                        type="text"
                        placeholder="https://www.hudl.com/video/... or https://youtu.be/..."
                        value={metrics.hudlLink}
                        onChange={e => setMetrics({...metrics, hudlLink: e.target.value})}
                      />
                    </div>
                    {metrics.hudlLink && (
                      previewEmbedUrl ? (
                        <div className="relative w-full max-w-md aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-sm">
                          <iframe
                            src={previewEmbedUrl}
                            title="Highlight Video Preview"
                            className="absolute inset-0 w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <p className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2">
                          Unrecognized embed format — this will save as a clickable link, but won't play inline.
                        </p>
                      )
                    )}
                  </div>

                  {/* Multi-Year In-Season Stats Editor */}
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        In-Season Stats (By Year • Leave Blank to Hide on Profile)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextYear = String((Number(metrics.yearlyStats?.[0]?.year) || new Date().getFullYear()) - 1);
                          const updated = [...(metrics.yearlyStats || []), createEmptySeason(nextYear)];
                          setMetrics({ ...metrics, yearlyStats: updated });
                          setActiveSeasonIdx(updated.length - 1);
                        }}
                        className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 hover:bg-[#1c7ed6] text-white px-3 py-1.5 rounded-lg transition-colors"
                      >
                        + Add Season
                      </button>
                    </div>

                    {/* Season Tabs */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {(metrics.yearlyStats || []).map((season, idx) => (
                        <div key={idx} className="flex items-center">
                          <button
                            type="button"
                            onClick={() => setActiveSeasonIdx(idx)}
                            className={`px-3 py-1.5 rounded-l-lg text-xs font-extrabold uppercase transition-colors ${
                              activeSeasonIdx === idx ? 'bg-[#1c7ed6] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {season.year || `Season ${idx + 1}`}
                          </button>
                          {(metrics.yearlyStats || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = metrics.yearlyStats.filter((_, i) => i !== idx);
                                setMetrics({ ...metrics, yearlyStats: updated });
                                setActiveSeasonIdx(0);
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

                    {/* Active Season Fields */}
                    {metrics.yearlyStats?.[activeSeasonIdx] && (
                      <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div className="w-40">
                          <InputLabel>Season Year</InputLabel>
                          <FormInput
                            type="text"
                            placeholder="e.g. 2026"
                            className="bg-white py-2 font-black"
                            value={metrics.yearlyStats[activeSeasonIdx].year}
                            onChange={e => {
                              const updated = [...metrics.yearlyStats];
                              updated[activeSeasonIdx] = { ...updated[activeSeasonIdx], year: e.target.value };
                              setMetrics({ ...metrics, yearlyStats: updated });
                            }}
                          />
                        </div>

                        {STAT_GROUPS.map(group => (
                          <div key={group.id} className="pt-3 border-t border-slate-200/70">
                            <span className="block text-[10px] font-black text-[#1c7ed6] uppercase tracking-widest mb-2.5">
                              {group.title}
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {group.fields.map(field => (
                                <div key={field.key}>
                                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1 truncate">
                                    {field.label}
                                  </label>
                                  <input
                                    type="number"
                                    step="any"
                                    placeholder="-"
                                    value={metrics.yearlyStats[activeSeasonIdx][field.key] ?? ''}
                                    onChange={e => {
                                      const updated = [...metrics.yearlyStats];
                                      updated[activeSeasonIdx] = {
                                        ...updated[activeSeasonIdx],
                                        [field.key]: e.target.value,
                                      };
                                      setMetrics({ ...metrics, yearlyStats: updated });
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold focus:outline-none focus:border-[#1c7ed6]"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* COMBINE DETAILS */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-t-4 border-t-slate-800">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest mb-6 flex items-center gap-2 text-slate-800"><MapPin size={16} /> Combine Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><div><InputLabel>Location</InputLabel><FormInput type="text" placeholder="e.g. Horseshoe Lake Turf, NJ" value={metrics.combineLocation} onChange={e => setMetrics({...metrics, combineLocation: e.target.value})} /></div><div><InputLabel>Date</InputLabel><FormInput type="date" value={metrics.combineDate} onChange={e => setMetrics({...metrics, combineDate: e.target.value})} /></div></div>
                </div>

                {/* SPEED VERIFICATIONS */}
                <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest mb-6 flex items-center gap-2 text-[#1c7ed6]"><Zap size={16} /> Speed Verifications</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    <div>
                      <InputLabel>40-Yd (Sec)</InputLabel><FormInput type="number" step="0.01" value={metrics.sprint} onChange={e => setMetrics({...metrics, sprint: e.target.value})} />
                      <select className="w-full mt-2 bg-white border border-slate-200 text-[10px] font-bold p-2 rounded-lg" value={metrics.sprintVerify} onChange={e => setMetrics({...metrics, sprintVerify: e.target.value})}><option value="laser">Laser</option><option value="stopwatch">Hand-Timed</option><option value="standard">DNA Verified</option></select>
                    </div>
                    <div>
                      <InputLabel>5-10-5 (Sec)</InputLabel><FormInput type="number" step="0.01" value={metrics.shuttle} onChange={e => setMetrics({...metrics, shuttle: e.target.value})} />
                      <select className="w-full mt-2 bg-white border border-slate-200 text-[10px] font-bold p-2 rounded-lg" value={metrics.shuttleVerify} onChange={e => setMetrics({...metrics, shuttleVerify: e.target.value})}><option value="stopwatch">Hand-Timed</option><option value="laser">Laser</option><option value="standard">DNA Verified</option></select>
                    </div>
                    <div>
                      <InputLabel>L Drill (Sec)</InputLabel><FormInput type="number" step="0.01" value={metrics.lDrill} onChange={e => setMetrics({...metrics, lDrill: e.target.value})} />
                      <select className="w-full mt-2 bg-white border border-slate-200 text-[10px] font-bold p-2 rounded-lg" value={metrics.lDrillVerify} onChange={e => setMetrics({...metrics, lDrillVerify: e.target.value})}><option value="stopwatch">Hand-Timed</option><option value="laser">Laser</option><option value="standard">DNA Verified</option></select>
                    </div>
                    <div>
                      <InputLabel>Max Speed (MPH)</InputLabel><FormInput type="number" step="0.1" value={metrics.mph} onChange={e => setMetrics({...metrics, mph: e.target.value})} />
                      <select className="w-full mt-2 bg-white border border-slate-200 text-[10px] font-bold p-2 rounded-lg" value={metrics.mphVerify} onChange={e => setMetrics({...metrics, mphVerify: e.target.value})}><option value="laser">Laser</option><option value="stopwatch">Hand-Timed</option><option value="standard">DNA Verified</option></select>
                    </div>
                  </div>
                </div>

                {/* SKILLS & EXPLOSIVENESS */}
                <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest mb-6 flex items-center gap-2 text-[#1c7ed6]"><Ruler size={16} /> Skills & Explosiveness</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    <div><InputLabel>Catching %</InputLabel><FormInput type="number" value={metrics.catchingPct} onChange={e => setMetrics({...metrics, catchingPct: e.target.value})} /></div>
                    <div><InputLabel>Throwing %</InputLabel><FormInput type="number" value={metrics.throwingPct} onChange={e => setMetrics({...metrics, throwingPct: e.target.value})} /></div>
                    <div><InputLabel>Flag Pull %</InputLabel><FormInput type="number" value={metrics.flagPullingPct} onChange={e => setMetrics({...metrics, flagPullingPct: e.target.value})} /></div>
                    <div className="hidden md:block"></div>
                    <div><InputLabel>Height</InputLabel><div className="flex gap-2"><FormInput type="number" placeholder="Ft" className="w-1/2" value={metrics.heightFeet} onChange={e => setMetrics({...metrics, heightFeet: e.target.value})} /><FormInput type="number" placeholder="In" className="w-1/2" value={metrics.heightInches} onChange={e => setMetrics({...metrics, heightInches: e.target.value})} /></div></div>
                    <div><InputLabel>Weight (lbs)</InputLabel><FormInput type="number" value={metrics.weight} onChange={e => setMetrics({...metrics, weight: e.target.value})} /></div>
                    <div><InputLabel>Broad Jump</InputLabel><div className="flex gap-2"><FormInput type="number" placeholder="Ft" className="w-1/2" value={metrics.broadFeet} onChange={e => setMetrics({...metrics, broadFeet: e.target.value})} /><FormInput type="number" placeholder="In" className="w-1/2" value={metrics.broadInches} onChange={e => setMetrics({...metrics, broadInches: e.target.value})} /></div></div>
                    <div><InputLabel>Vertical (Inches)</InputLabel><FormInput type="number" step="0.1" value={metrics.verticalInches} onChange={e => setMetrics({...metrics, verticalInches: e.target.value})} /></div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button type="submit" disabled={savingAthlete} className="flex-1 hover:-translate-y-0.5 transition-all text-white font-bold py-4 rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}>
                    {savingAthlete ? 'Saving...' : 'Save Profile'}
                  </button>
                  {selectedExistingId && <button type="button" onClick={deleteAthlete} className="px-8 hover:-translate-y-0.5 transition-all text-white font-bold rounded-xl shadow-md bg-rose-500 hover:bg-rose-600">Delete</button>}
                </div>
              </form>
           </div>
        )}
        
        {activeTab === 'news' && (
          <div className="animate-in fade-in slide-in-from-right-4 max-w-2xl mx-auto">
            <form onSubmit={submitNews} className="space-y-6">
              <div><InputLabel>Headline</InputLabel><FormInput required type="text" placeholder="e.g., DNA 15U Wins Tournament..." value={newsTitle} onChange={(e) => setNewsTitle(e.target.value)} /></div>
              <div><InputLabel>Category</InputLabel><select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-[#1c7ed6]/20 transition-all focus:outline-none" value={newsCategory} onChange={(e) => setNewsCategory(e.target.value)}><option value="ANNOUNCEMENT">Announcement</option><option value="RECRUITING">Recruiting</option><option value="TOURNAMENT">Tournament Result</option><option value="COMBINE">Combine Result</option></select></div>
              <button type="submit" className="w-full hover:-translate-y-0.5 transition-all text-white font-bold py-4 rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}>Post Update to Hub</button>
            </form>
          </div>
        )}

        {activeTab === 'scouts' && (
          <AdminScoutApproval db={db} appId={appId} />
        )}  
        {activeTab === 'colleges' && (
          <AdminCollegeManager db={db} appId={appId} />
        )}
      
      </div>
    </div>
  );
};