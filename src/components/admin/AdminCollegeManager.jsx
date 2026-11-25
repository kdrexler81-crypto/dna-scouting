// src/components/admin/AdminCollegeManager.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, writeBatch
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap, Upload, Plus, Search, Trash2, Edit3, Save, X,
  Loader2, Radar, ExternalLink, Database, CheckCircle2, Mail, MapPin
} from 'lucide-react';
import COLLEGES_JSON from '../../data/colleges.json';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useApp } from '../../context/AppContext';
const DIVISIONS = [
  'NCAA DI', 'NCAA DII', 'NCAA DIII', 'NAIA', 'NJCAA', '3C2A', 'USCAA', 'Club'
];

const EMPTY_FORM = {
  name: '',
  state: '',
  division: 'NCAA DIII',
  conference: '',
  coach: '',
  email: '',
  phone: '',
  questionnaireUrl: ''
};

// Handles quoted CSV values (e.g., "University of Texas, Austin")
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
};

const normalizeName = (name = '') =>
  name.toLowerCase().replace(/[^a-z0-9]/g, '');

export const AdminCollegeManager = ({ db, appId }) => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('All');
  const { app } = useApp();
  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [scanningRadar, setScanningRadar] = useState(false);
  const [activePendingId, setActivePendingId] = useState(null);

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Bulk Import State
  const [importing, setImporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const { app } = useApp();
  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [scanningRadar, setScanningRadar] = useState(false);
  const [activePendingId, setActivePendingId] = useState(null);
  // Live Firestore Listener
  useEffect(() => {
    if (!db || !appId) {
      setLoading(false);
      return;
    }
    const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'colleges');
    const unsub = onSnapshot(colRef, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setColleges(list);
      setLoading(false);
    });
    return () => unsub();
  }, [db, appId]);
useEffect(() => {
    if (!db || !appId) return;
    const pendingRef = collection(db, 'artifacts', appId, 'public', 'data', 'pendingCollegeUpdates');
    const unsub = onSnapshot(pendingRef, (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((item) => item.status === 'pending')
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setPendingUpdates(items);
    });
    return () => unsub();
  }, [db, appId]);
  const filteredColleges = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return colleges.filter((c) => {
      const matchesTerm =
        !term ||
        (c.name || '').toLowerCase().includes(term) ||
        (c.state || '').toLowerCase().includes(term) ||
        (c.coach || '').toLowerCase().includes(term);
      const matchesDiv =
        divisionFilter === 'All' ||
        new RegExp(`\\b${divisionFilter}\\b`, 'i').test(c.division || '');
      return matchesTerm && matchesDiv;
    });
  }, [colleges, searchTerm, divisionFilter]);
const handleRunRadarNow = async () => {
    setScanningRadar(true);
    setStatusMsg(null);
    try {
      const scanFn = httpsCallable(getFunctions(app), 'triggerCollegeScan');
      const { data } = await scanFn();
      setStatusMsg({
        type: 'success',
        text: data.added > 0
          ? `Radar scan complete: found ${data.added} new program or coaching update${data.added > 1 ? 's' : ''}.`
          : 'Radar scan complete: no new college updates found since last check.'
      });
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Radar scan failed: ' + err.message });
    } finally {
      setScanningRadar(false);
    }
  };

  const handleDismissPending = async (pendingId) => {
    if (!db) return;
    await updateDoc(
      doc(db, 'artifacts', appId, 'public', 'data', 'pendingCollegeUpdates', pendingId),
      { status: 'dismissed', reviewedAt: Date.now() }
    );
    if (activePendingId === pendingId) setActivePendingId(null);
  };

  const handleStartFromPending = (item) => {
    const cleanHeadline = (item.title || '').replace(/\s*[-|]\s*[^-|]+$/, '').trim();
    setEditingId(null);
    setActivePendingId(item.id);
    setForm({ ...EMPTY_FORM, name: cleanHeadline });
    setStatusMsg({
      type: 'success',
      text: 'Loaded headline into the form below. Trim to the school name, add details, and click Add Program to publish and clear this alert.'
    });
  };
  // --- MANUAL SAVE (ADD OR UPDATE) ---
  const handleSaveCollege = async (e) => {
    e.preventDefault();
    if (!db || !form.name.trim()) return;
    setSaving(true);
    setStatusMsg(null);
    try {
      const payload = {
        name: form.name.trim(),
        state: (form.state || '').trim().toUpperCase(),
        division: form.division || 'NCAA DIII',
        conference: (form.conference || '').trim(),
        coach: (form.coach || '').trim() || 'TBA',
        email: (form.email || '').trim(),
        phone: (form.phone || '').trim(),
        questionnaireUrl: (form.questionnaireUrl || '').trim(),
        updatedAt: Date.now()
      };

      const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'colleges');
      if (editingId) {
        await updateDoc(doc(colRef, editingId), payload);
        setStatusMsg({ type: 'success', text: `Updated ${payload.name}.` });
      } else {
        // Deduplicate by school name on manual add
        const existing = colleges.find(
          (c) => normalizeName(c.name) === normalizeName(payload.name)
        );
        if (existing) {
          await updateDoc(doc(colRef, existing.id), payload);
          setStatusMsg({ type: 'success', text: `${payload.name} already existed — updated in place.` });
        } else {
          await addDoc(colRef, { ...payload, createdAt: Date.now() });
          setStatusMsg({ type: 'success', text: `Added ${payload.name} to live directory.` });
        }
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Save failed: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (college) => {
    setEditingId(college.id);
    setForm({
      name: college.name || '',
      state: college.state || '',
      division: college.division || 'NCAA DIII',
      conference: college.conference || '',
      coach: college.coach || '',
      email: college.email || '',
      phone: college.phone || '',
      questionnaireUrl: college.questionnaireUrl || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCollege = async (college) => {
    if (!window.confirm(`Remove ${college.name} from the college directory?`)) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'colleges', college.id));
      if (editingId === college.id) {
        setEditingId(null);
        setForm(EMPTY_FORM);
      }
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  // --- SHARED BATCH UPSERT WITH DEDUPLICATION ---
  const batchUpsertColleges = async (records) => {
    if (!db || records.length === 0) return;
    setImporting(true);
    setStatusMsg(null);
    try {
      const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'colleges');
      const existingByKey = new Map(
        colleges.map((c) => [normalizeName(c.name), c])
      );

      let added = 0;
      let updated = 0;
      const CHUNK_SIZE = 400; // Firestore batch limit is 500

      for (let i = 0; i < records.length; i += CHUNK_SIZE) {
        const chunk = records.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);

        chunk.forEach((rec) => {
          if (!rec.name || !rec.name.trim()) return;
          const key = normalizeName(rec.name);
          const existing = existingByKey.get(key);

          const payload = {
            name: rec.name.trim(),
            state: (rec.state || '').trim().toUpperCase(),
            division: (rec.division || 'NCAA DIII').trim(),
            conference: (rec.conference || '').trim(),
            coach: (rec.coach || '').trim() || 'TBA',
            email: (rec.email || '').trim(),
            phone: (rec.phone || '').trim(),
            questionnaireUrl: (rec.questionnaireUrl || '').trim(),
            updatedAt: Date.now()
          };

          if (existing) {
            batch.update(doc(colRef, existing.id), payload);
            updated++;
          } else {
            const newDocRef = doc(colRef);
            batch.set(newDocRef, { ...payload, createdAt: Date.now() });
            existingByKey.set(key, { id: newDocRef.id, ...payload });
            added++;
          }
        });

        await batch.commit();
      }

      setStatusMsg({
        type: 'success',
        text: `Import complete: ${added} new schools added, ${updated} existing schools updated.`
      });
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Bulk import failed: ' + err.message });
    } finally {
      setImporting(false);
    }
  };

  // --- 1-CLICK SEED FROM colleges.json ---
  const handleSeedFromJson = async () => {
    const ok = window.confirm(
      `Import all ${COLLEGES_JSON.length} schools from colleges.json into Firestore? Existing schools will be updated without creating duplicates.`
    );
    if (!ok) return;
    await batchUpsertColleges(COLLEGES_JSON);
  };

  // --- BULK CSV UPLOAD ---
  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = String(event.target?.result || '').replace(/\r/g, '');
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setStatusMsg({ type: 'error', text: 'CSV must include a header row and at least one school.' });
        return;
      }

      const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const findCol = (aliases) => headers.findIndex((h) => aliases.includes(h));

      const nameIdx = findCol(['name', 'school', 'schoolname', 'college', 'university', 'program']);
      const stateIdx = findCol(['state', 'st', 'location']);
      const divIdx = findCol(['division', 'div', 'level', 'association']);
      const confIdx = findCol(['conference', 'conf']);
      const coachIdx = findCol(['coach', 'headcoach', 'coachname']);
      const emailIdx = findCol(['email', 'coachemail', 'contactemail']);
      const phoneIdx = findCol(['phone', 'coachphone']);
      const questIdx = findCol(['questionnaire', 'questionnaireurl', 'recruitingurl', 'url']);

      if (nameIdx === -1) {
        setStatusMsg({
          type: 'error',
          text: 'Could not find a "Name" or "School" column in your CSV header.'
        });
        return;
      }

      const parsedRecords = lines.slice(1).map((line) => {
        const cols = parseCSVLine(line);
        return {
          name: cols[nameIdx] || '',
          state: stateIdx !== -1 ? cols[stateIdx] : '',
          division: divIdx !== -1 ? cols[divIdx] : 'NCAA DIII',
          conference: confIdx !== -1 ? cols[confIdx] : '',
          coach: coachIdx !== -1 ? cols[coachIdx] : '',
          email: emailIdx !== -1 ? cols[emailIdx] : '',
          phone: phoneIdx !== -1 ? cols[phoneIdx] : '',
          questionnaireUrl: questIdx !== -1 ? cols[questIdx] : ''
        };
      }).filter((r) => r.name.trim().length > 0);

      await batchUpsertColleges(parsedRecords);
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* TOP ACTION BAR: SEED + CSV UPLOAD */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
            <GraduationCap size={14} /> Live College Directory Database
          </span>
          <h3 className="text-xl font-extrabold uppercase tracking-tight mt-1">
            {colleges.length} Programs in Firestore
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Upload a CSV (columns: Name, State, Division, Coach, Email) or sync your built-in 320-school list. Duplicates are automatically merged by school name.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleSeedFromJson}
            disabled={importing}
            className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors border border-white/15"
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} className="text-emerald-400" />}
            Sync {COLLEGES_JSON.length} from JSON
          </button>

          <label className="cursor-pointer bg-[#1c7ed6] hover:bg-blue-500 text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-md">
            <Upload size={14} /> Bulk Upload CSV
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvUpload}
              disabled={importing}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
          statusMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <CheckCircle2 size={16} className="shrink-0" />
          {statusMsg.text}
        </div>
      )}
{/* WEEKLY RADAR: PENDING APPROVAL QUEUE */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 flex items-center gap-1.5">
              <Radar size={14} /> Weekly Program & Coach Radar
            </span>
            <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
              {pendingUpdates.length} Pending Update{pendingUpdates.length !== 1 ? 's' : ''} to Review
            </h4>
          </div>
          <button
            type="button"
            onClick={handleRunRadarNow}
            disabled={scanningRadar}
            className="bg-slate-900 hover:bg-[#1c7ed6] disabled:bg-slate-400 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
          >
            {scanningRadar ? <><Loader2 size={13} className="animate-spin" /> Scanning News...</> : <><Radar size={13} /> Scan Now</>}
          </button>
        </div>

        {pendingUpdates.length > 0 ? (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {pendingUpdates.map((item) => (
              <div key={item.id} className="bg-white border border-amber-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                      item.type === 'COACH HIRE' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {item.type}
                    </span>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-[#1c7ed6] hover:underline flex items-center gap-1"
                      >
                        Read Article <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-snug">{item.title}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartFromPending(item)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
                  >
                    Use in Form
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDismissPending(item.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 text-[10px] font-bold uppercase tracking-wider transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs font-semibold text-amber-800/80">
            All caught up. The radar runs automatically every Monday at 9:00 AM ET, or click <strong>Scan Now</strong> to check immediately.
          </p>
        )}
      </div>
      {/* MANUAL ADD / EDIT FORM */}
      <form onSubmit={handleSaveCollege} className="bg-slate-50/80 border border-slate-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-800 flex items-center gap-2">
            <Plus size={15} className="text-[#1c7ed6]" />
            {editingId ? `Editing: ${form.name}` : 'Add or Update Single Program'}
          </h4>
          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <X size={14} /> Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">School Name *</label>
            <input
              required
              type="text"
              placeholder="e.g. Montclair State University"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#1c7ed6]"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">State (2-Letter) *</label>
            <input
              required
              type="text"
              maxLength={2}
              placeholder="NJ"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold uppercase focus:outline-none focus:border-[#1c7ed6]"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Division</label>
            <select
              value={form.division}
              onChange={(e) => setForm({ ...form, division: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#1c7ed6]"
            >
              {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Head Coach</label>
            <input
              type="text"
              placeholder="e.g. Jane Smith"
              value={form.coach}
              onChange={(e) => setForm({ ...form, coach: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#1c7ed6]"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Coach Email</label>
            <input
              type="email"
              placeholder="coach@university.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#1c7ed6]"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Conference</label>
            <input
              type="text"
              placeholder="e.g. NJAC"
              value={form.conference}
              onChange={(e) => setForm({ ...form, conference: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#1c7ed6]"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Questionnaire URL</label>
            <input
              type="url"
              placeholder="https://..."
              value={form.questionnaireUrl}
              onChange={(e) => setForm({ ...form, questionnaireUrl: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#1c7ed6]"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-slate-900 hover:bg-[#1c7ed6] disabled:bg-slate-400 text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {editingId ? 'Save Changes' : 'Add Program'}
          </button>
        </div>
      </form>

      {/* SEARCHABLE LIVE DIRECTORY LIST */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search live colleges by name, state, or coach..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#1c7ed6]"
            />
          </div>
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-[#1c7ed6]"
          >
            <option value="All">All Divisions ({colleges.length})</option>
            {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase">Loading directory...</div>
        ) : filteredColleges.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs font-bold">
            No colleges in Firestore yet. Click "Sync {COLLEGES_JSON.length} from JSON" or "Bulk Upload CSV" above to populate your directory.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden max-h-[520px] overflow-y-auto">
            {filteredColleges.map((school) => (
              <div key={school.id} className="p-4 bg-white hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h5 className="text-sm font-extrabold text-slate-900 truncate">{school.name}</h5>
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider">
                      {school.division}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-0.5">
                      <MapPin size={11} className="text-[#1c7ed6]" /> {school.state}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-1 flex flex-wrap items-center gap-3">
                    <span>Coach: <strong className="text-slate-800">{school.coach || 'TBA'}</strong></span>
                    {school.email && (
                      <span className="flex items-center gap-1 text-[#1c7ed6]">
                        <Mail size={11} /> {school.email}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEditClick(school)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#1c7ed6] text-slate-700 hover:text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCollege(school)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white transition-colors"
                    title="Delete Program"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};