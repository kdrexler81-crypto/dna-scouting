// src/components/CollegeLogo.jsx
import React, { useState, useMemo, useEffect } from 'react';

const GENERIC_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com',
  'armssoftware.com', 'frontrush.com', 'jumpforward.com', 'sidearmsports.com',
  'google.com', 'docs.google.com', 'forms.gle', 'jotform.com', 'formstack.com',
  'wufoo.com', 'typeform.com', 'ncsasports.org', 'fieldlevel.com'
]);

const CREST_COLORS = [
  'bg-[#1c7ed6]', 'bg-[#d6336c]', 'bg-slate-800', 'bg-emerald-700',
  'bg-violet-700', 'bg-amber-600', 'bg-cyan-700', 'bg-rose-700'
];

const extractDomain = (school = {}) => {
  if (school.email && school.email.includes('@')) {
    const emailDomain = school.email.split('@')[1].trim().toLowerCase().replace(/^www\./, '');
    if (emailDomain && !GENERIC_DOMAINS.has(emailDomain)) {
      return emailDomain;
    }
  }

  const rawUrl = school.website || school.questionnaireUrl || school.url || '';
  if (rawUrl) {
    try {
      const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
      const host = new URL(normalized).hostname.toLowerCase().replace(/^www\./, '');
      if (host && !GENERIC_DOMAINS.has(host)) {
        return host;
      }
    } catch {
      // Ignore malformed URLs
    }
  }

  return '';
};

// Generates likely .edu domains from a college name when email/URL is missing
const guessEduDomains = (name = '') => {
  if (!name) return [];
  const cleaned = name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const stopWords = new Set([
    'university', 'college', 'of', 'the', 'at', 'in', 'and',
    'state', 'community', 'technical', 'institute', 'school'
  ]);
  const coreWords = words.filter((w) => !stopWords.has(w));
  const candidates = new Set();

  // 1. Core name (e.g. "Montclair State University" -> montclair.edu)
  if (coreWords.length > 0) {
    candidates.add(`${coreWords.join('')}.edu`);
    candidates.add(`${coreWords[0]}.edu`);
  }

  // 2. Full name stripped of "of/the" (e.g. "Keiser University" -> keiseruniversity.edu)
  const noConnectors = words.filter((w) => !['of', 'the', 'at', 'in'].includes(w));
  if (noConnectors.length > 0) {
    candidates.add(`${noConnectors.join('')}.edu`);
  }

  // 3. Common "U" / "State" patterns (e.g. "Thomas University" -> thomasu.edu)
  if (coreWords.length === 1 && cleaned.includes('university')) {
    candidates.add(`${coreWords[0]}u.edu`);
  }
  if (coreWords.length === 1 && cleaned.includes('college')) {
    candidates.add(`${coreWords[0]}college.edu`);
  }

  // 4. Acronym for multi-word schools (e.g. "Florida International University" -> fiu.edu)
  if (words.length >= 2 && words.length <= 4) {
    const acronym = words
      .filter((w) => !['of', 'the', 'at', 'in', 'and'].includes(w))
      .map((w) => w[0])
      .join('');
    if (acronym.length >= 2) {
      candidates.add(`${acronym}.edu`);
    }
  }

  return Array.from(candidates);
};

const getSchoolInitials = (name = '') => {
  const ignore = new Set(['of', 'the', 'at', 'and', 'in', 'for', 'university', 'college']);
  const words = name
    .replace(/[^a-zA-Z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  const significant = words.filter((w) => !ignore.has(w.toLowerCase()));
  const pool = significant.length >= 2 ? significant : words;

  if (pool.length === 0) return 'FF';
  if (pool.length === 1) return pool[0].slice(0, 2).toUpperCase();
  return (pool[0][0] + pool[1][0]).toUpperCase();
};

const getCrestColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return CREST_COLORS[hash % CREST_COLORS.length];
};

export const CollegeLogo = ({ school = {}, size = 'md' }) => {
  const candidateUrls = useMemo(() => {
    const urls = [];

    if (school.logoUrl && /^https?:\/\//i.test(school.logoUrl)) {
      urls.push(school.logoUrl);
    }

    const domains = [];
    const directDomain = extractDomain(school);
    if (directDomain) domains.push(directDomain);

    guessEduDomains(school.name).forEach((d) => {
      if (!domains.includes(d)) domains.push(d);
    });

    domains.forEach((domain) => {
      urls.push(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`);
    });

    return urls;
  }, [school.logoUrl, school.email, school.website, school.questionnaireUrl, school.url, school.name]);

  const [candidateIdx, setCandidateIdx] = useState(0);

  // Reset when filters change which school is rendered in this slot
  useEffect(() => {
    setCandidateIdx(0);
  }, [school.name, school.logoUrl]);

  const activeUrl = candidateUrls[candidateIdx];

  const sizeClasses = {
    sm: 'w-9 h-9 text-xs rounded-xl',
    md: 'w-12 h-12 text-sm rounded-2xl',
    lg: 'w-14 h-14 text-base rounded-2xl'
  }[size] || 'w-12 h-12 text-sm rounded-2xl';

  const advanceCandidate = () => {
    setCandidateIdx((prev) => prev + 1);
  };

  if (!activeUrl) {
    return (
      <div
        className={`${sizeClasses} ${getCrestColor(school.name)} text-white font-black flex items-center justify-center shrink-0 shadow-sm tracking-wider`}
        title={school.name}
      >
        {getSchoolInitials(school.name)}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0 shadow-sm overflow-hidden`}
      title={school.name}
    >
      <img
        key={activeUrl}
        src={activeUrl}
        alt={`${school.name || 'College'} logo`}
        className="w-full h-full object-contain"
        loading="lazy"
        onError={advanceCandidate}
        onLoad={(e) => {
          // Skip Google's 16x16 default globe icon and try the next guessed domain
          if (e.currentTarget.naturalWidth <= 16 && e.currentTarget.naturalHeight <= 16) {
            advanceCandidate();
          }
        }}
      />
    </div>
  );
};