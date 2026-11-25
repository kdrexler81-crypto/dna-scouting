// src/components/HeroSlideshow.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, GraduationCap, ShieldCheck } from 'lucide-react';

// Replace these URLs with your own clinic / action photos (stored in /public/images/ or Firebase Storage)
const HERO_SLIDES = [
  '\hero\DNA-Clinic1-152(1).jpg',
  '\hero\DNA-Clinic1-140.jpg',
  '\hero\DNA-Clinic1-083.jpg'
  '\hero\DNA-Clinic1-125.jpg'
];

export const HeroSlideshow = ({ onScrollToLeaderboard }) => {
  const navigate = useNavigate();
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full min-h-[520px] sm:min-h-[600px] flex items-center overflow-hidden bg-slate-950 mb-10">
      {/* Rotating Background Photos */}
      {HERO_SLIDES.map((imgUrl, idx) => (
        <div
          key={imgUrl}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            idx === activeIdx ? 'opacity-45 scale-105' : 'opacity-0 scale-100'
          }`}
          style={{
            backgroundImage: `url(${imgUrl})`,
            transition: 'opacity 1000ms ease-in-out, transform 6000ms ease-out'
          }}
        />
      ))}

      {/* Dark Gradient Overlay for Crisp Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/40" />

      {/* Foreground Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-16 w-full">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-emerald-300 text-[11px] font-extrabold uppercase tracking-widest">
            <ShieldCheck size={14} /> Verified Girls' Flag Football Recruiting
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase text-white leading-[0.95] tracking-tight font-display">
            Verified Metrics. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1c7ed6] to-[#d6336c]">
              College Exposure.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-200 max-w-xl leading-relaxed font-medium">
            The national prospect hub for women's flag football. Compare clinic-verified speed and agility scores, watch game film, and explore every NCAA, NAIA, and NJCAA college program in one place.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={onScrollToLeaderboard}
              className="px-6 py-3.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-2 shadow-xl hover:opacity-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}
            >
              Browse Prospect Rankings <ArrowRight size={15} />
            </button>

            <button
              type="button"
              onClick={() => navigate('/colleges')}
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all"
            >
              <GraduationCap size={16} /> College Directory
            </button>
          </div>
        </div>

        {/* Slide Indicator Dots */}
        <div className="flex items-center gap-2 mt-12">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                idx === activeIdx ? 'w-8 bg-[#d6336c]' : 'w-2.5 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};