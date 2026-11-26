// src/components/CollegeLogo.jsx
import React, { useState, useMemo } from 'react';

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
  // 1. Try coach email domain first (most reliable for .edu schools)
  if (school.email && school.email.includes('@')) {
    const emailDomain = school.email.split('@')[1].trim().toLowerCase().replace(/^www\./, '');
    if (emailDomain && !GENERIC_DOMAINS.has(emailDomain)) {
      return emailDomain;
    }
  }

  // 2. Fallback to questionnaireUrl or website
  const rawUrl = school.questionnaireUrl || school.website || school.url || '';
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
  const [imgFailed, setImgFailed] = useState(false);

  const logoSrc = useMemo(() => {
    if (school.logoUrl && /^https?:\/\//i.test(school.logoUrl)) {
      return school.logoUrl;
    }
    const domain = extractDomain(school);
    if (!domain) return '';
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
  }, [school]);

  const sizeClasses = {
    sm: 'w-9 h-9 text-xs rounded-xl',
    md: 'w-12 h-12 text-sm rounded-2xl',
    lg: 'w-14 h-14 text-base rounded-2xl'
  }[size] || 'w-12 h-12 text-sm rounded-2xl';

  if (!logoSrc || imgFailed) {
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
        src={logoSrc}
        alt={`${school.name || 'College'} logo`}
        className="w-full h-full object-contain"
        loading="lazy"
        onError={() => setImgFailed(true)}
        onLoad={(e) => {
          // Google returns a tiny 16x16 default globe when no real favicon exists
          if (e.currentTarget.naturalWidth <= 16 && e.currentTarget.naturalHeight <= 16) {
            setImgFailed(true);
          }
        }}
      />
    </div>
  );
};