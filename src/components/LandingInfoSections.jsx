// src/components/LandingInfoSections.jsx
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, MapPin, ArrowRight, ShieldCheck, Video, FileCheck,
  Sparkles, Compass, Trophy, Users, Camera, ExternalLink
} from 'lucide-react';

const displayFont = { fontFamily: "'Barlow Condensed', sans-serif" };

// --- INSTAGRAM SETTINGS (Edit these 2 lines anytime) ---
const INSTAGRAM_HANDLE = '@dna_girlsflagfootball';
const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/dna_girlsflagfootball/';
// Paste your SnapWidget or Behold iframe "src" URL below when ready
const INSTAGRAM_EMBED_URL = '';

export const LandingInfoSections = ({ colleges = [] }) => {
  const navigate = useNavigate();

  // Pull the 6 most recently added college programs
  const newestColleges = useMemo(() => {
    return [...colleges]
      .sort((a, b) => (b.createdAt || b.updatedAt || 0) - (a.createdAt || a.updatedAt || 0))
      .slice(0, 6);
  }, [colleges]);

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-16 py-12">
      {/* 1. RECENTLY ADDED COLLEGE PROGRAMS */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#1c7ed6] flex items-center gap-1.5">
              <GraduationCap size={14} /> National Program Directory
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-slate-900 mt-1"
              style={displayFont}
            >
              Recently Added College Programs
            </h2>
          </div>

          <button
            type="button"
            onClick={() => navigate('/colleges')}
            className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-white bg-slate-900 hover:bg-[#1c7ed6] px-5 py-3 rounded-xl transition-colors shadow-sm self-start sm:self-auto"
          >
            Browse All {colleges.length || '300+'} Schools <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {newestColleges.map((school, idx) => (
            <div
              key={school.id || `${school.name}-${idx}`}
              onClick={() => navigate('/colleges')}
              className="cursor-pointer bg-white border border-slate-200 hover:border-[#1c7ed6] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider">
                    {school.division || 'Varsity'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <MapPin size={11} className="text-[#d6336c]" /> {school.state || 'US'}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                  {school.name}
                </h3>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 truncate">
                Head Coach: <span className="text-slate-800 font-bold">{school.coach || 'TBA'}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. VERIFIED DATA. ZERO GUESSWORK. */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ background: 'linear-gradient(90deg, #1c7ed6 0%, #d6336c 100%)' }}
        />

        <div className="max-w-2xl mb-10">
          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
            <Sparkles size={14} /> The DNA Standard
          </span>
          <h2
            className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight mt-2"
            style={displayFont}
          >
            Verified Data. Zero Guesswork.
          </h2>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            Recruiting shouldn't rely on self-reported times or scattered social links. DNA Flag Ratings gives college staffs one trusted hub with clinic-verified testing, game film, and academic credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#1c7ed6]/20 text-[#1c7ed6] flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-lg font-extrabold uppercase tracking-tight" style={displayFont}>
              Clinic-Verified Testing
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every 40-yard dash, shuttle, and skill score is recorded live by DNA coaches and locked to the athlete's profile—giving scouts numbers they can trust.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#d6336c]/20 text-[#d6336c] flex items-center justify-center">
              <Video size={20} />
            </div>
            <h3 className="text-lg font-extrabold uppercase tracking-tight" style={displayFont}>
              All Your Film in One Spot
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Watch Hudl and YouTube highlights right on the page, alongside direct links to MaxPreps, NCSA, and social reels—no jumping between five apps.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileCheck size={20} />
            </div>
            <h3 className="text-lg font-extrabold uppercase tracking-tight" style={displayFont}>
              Ready for College Coaches
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Multi-year season stats, GPA, test scores, and family contact info organized cleanly for fast evaluation by NCAA, NAIA, and NJCAA programs.
            </p>
          </div>
        </div>
      </section>

      {/* 3. YOUR ROADMAP TO COLLEGE FLAG FOOTBALL */}
      <section className="space-y-8">
        <div className="max-w-2xl">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#d6336c] flex items-center gap-1.5">
            <Compass size={14} /> Why Girls' Flag Football?
          </span>
          <h2
            className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-slate-900 mt-1"
            style={displayFont}
          >
            Your Roadmap to College Flag Football
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            With hundreds of college varsity programs launching nationwide and flag football debuting at the 2028 Olympics, there has never been a better time for female athletes to compete and earn roster spots.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              step: '01',
              icon: Users,
              title: 'Hit The Field',
              desc: 'Start with a youth league, high school varsity squad, or travel club to master route running, footwork, and flag-pulling angles.'
            },
            {
              step: '02',
              icon: Trophy,
              title: 'Get Verified',
              desc: 'Attend a DNA Clinic to record official laser-timed speed, agility shuttles, and position drills that establish your national DNA Score.'
            },
            {
              step: '03',
              icon: Video,
              title: 'Own Your Profile',
              desc: 'Claim your DNA Flag Ratings page, embed your best Hudl or YouTube highlights, and keep your GPA and season stats current.'
            },
            {
              step: '04',
              icon: GraduationCap,
              title: 'Target & Connect',
              desc: 'Explore our live College Directory, save your Target Schools, complete recruiting questionnaires, and email coaches directly.'
            }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-slate-200" style={displayFont}>
                      {item.step}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#1c7ed6] flex items-center justify-center">
                      <Icon size={18} />
                    </div>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight" style={displayFont}>
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. LIVE FROM THE TURF (INSTAGRAM) */}
      <section className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#d6336c] flex items-center gap-1.5">
              <Camera size={14} /> Live From The Turf
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-slate-900 mt-1"
              style={displayFont}
            >
              Follow DNA Flag Football
            </h2>
            <p className="text-xs font-bold text-slate-500 mt-1">{@dna_girlsflagfootball}</p>
          </div>

          <a
            href="https://www.instagram.com/dna_girlsflagfootball/"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white shadow-md hover:opacity-95 transition-opacity self-start sm:self-auto"
            style={{ background: 'linear-gradient(135deg, #f59f00 0%, #d6336c 50%, #7950f2 100%)' }}
          >
            <Camera size={15} /> Follow {@dna_girlsflagfootball} />
          </a>
        </div>

        {INSTAGRAM_EMBED_URL ? (
          <div className="w-full overflow-hidden rounded-2xl bg-white border border-slate-200">
            <iframe
              src={<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/dna_girlsflagfootball/?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14" style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"><div style="padding:16px;"> <a href="https://www.instagram.com/dna_girlsflagfootball/?utm_source=ig_embed&amp;utm_campaign=loading" style=" background:#FFFFFF; line-height:0; padding:0 0; text-align:center; text-decoration:none; width:100%;" target="_blank"> <div style=" display: flex; flex-direction: row; align-items: center;"> <div style="background-color: #F4F4F4; border-radius: 50%; flex-grow: 0; height: 40px; margin-right: 14px; width: 40px;"></div> <div style="display: flex; flex-direction: column; flex-grow: 1; justify-content: center;"> <div style=" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; margin-bottom: 6px; width: 100px;"></div> <div style=" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; width: 60px;"></div></div></div><div style="padding: 19% 0;"></div> <div style="display:block; height:50px; margin:0 auto 12px; width:50px;"><svg width="50px" height="50px" viewBox="0 0 60 60" version="1.1" xmlns="https://www.w3.org/2000/svg" xmlns:xlink="https://www.w3.org/1999/xlink"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-511.000000, -20.000000)" fill="#000000"><g><path d="M556.869,30.41 C554.814,30.41 553.148,32.076 553.148,34.131 C553.148,36.186 554.814,37.852 556.869,37.852 C558.924,37.852 560.59,36.186 560.59,34.131 C560.59,32.076 558.924,30.41 556.869,30.41 M541,60.657 C535.114,60.657 530.342,55.887 530.342,50 C530.342,44.114 535.114,39.342 541,39.342 C546.887,39.342 551.658,44.114 551.658,50 C551.658,55.887 546.887,60.657 541,60.657 M541,33.886 C532.1,33.886 524.886,41.1 524.886,50 C524.886,58.899 532.1,66.113 541,66.113 C549.9,66.113 557.115,58.899 557.115,50 C557.115,41.1 549.9,33.886 541,33.886 M565.378,62.101 C565.244,65.022 564.756,66.606 564.346,67.663 C563.803,69.06 563.154,70.057 562.106,71.106 C561.058,72.155 560.06,72.803 558.662,73.347 C557.607,73.757 556.021,74.244 553.102,74.378 C549.944,74.521 548.997,74.552 541,74.552 C533.003,74.552 532.056,74.521 528.898,74.378 C525.979,74.244 524.393,73.757 523.338,73.347 C521.94,72.803 520.942,72.155 519.894,71.106 C518.846,70.057 518.197,69.06 517.654,67.663 C517.244,66.606 516.755,65.022 516.623,62.101 C516.479,58.943 516.448,57.996 516.448,50 C516.448,42.003 516.479,41.056 516.623,37.899 C516.755,34.978 517.244,33.391 517.654,32.338 C518.197,30.938 518.846,29.942 519.894,28.894 C520.942,27.846 521.94,27.196 523.338,26.654 C524.393,26.244 525.979,25.756 528.898,25.623 C532.057,25.479 533.004,25.448 541,25.448 C548.997,25.448 549.943,25.479 553.102,25.623 C556.021,25.756 557.607,26.244 558.662,26.654 C560.06,27.196 561.058,27.846 562.106,28.894 C563.154,29.942 563.803,30.938 564.346,32.338 C564.756,33.391 565.244,34.978 565.378,37.899 C565.522,41.056 565.552,42.003 565.552,50 C565.552,57.996 565.522,58.943 565.378,62.101 M570.82,37.631 C570.674,34.438 570.167,32.258 569.425,30.349 C568.659,28.377 567.633,26.702 565.965,25.035 C564.297,23.368 562.623,22.342 560.652,21.575 C558.743,20.834 556.562,20.326 553.369,20.18 C550.169,20.033 549.148,20 541,20 C532.853,20 531.831,20.033 528.631,20.18 C525.438,20.326 523.257,20.834 521.349,21.575 C519.376,22.342 517.703,23.368 516.035,25.035 C514.368,26.702 513.342,28.377 512.574,30.349 C511.834,32.258 511.326,34.438 511.181,37.631 C511.035,40.831 511,41.851 511,50 C511,58.147 511.035,59.17 511.181,62.369 C511.326,65.562 511.834,67.743 512.574,69.651 C513.342,71.625 514.368,73.296 516.035,74.965 C517.703,76.634 519.376,77.658 521.349,78.425 C523.257,79.167 525.438,79.673 528.631,79.82 C531.831,79.965 532.853,80.001 541,80.001 C549.148,80.001 550.169,79.965 553.369,79.82 C556.562,79.673 558.743,79.167 560.652,78.425 C562.623,77.658 564.297,76.634 565.965,74.965 C567.633,73.296 568.659,71.625 569.425,69.651 C570.167,67.743 570.674,65.562 570.82,62.369 C570.966,59.17 571,58.147 571,50 C571,41.851 570.966,40.831 570.82,37.631"></path></g></g></g></svg></div><div style="padding-top: 8px;"> <div style=" color:#3897f0; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:550; line-height:18px;">View this profile on Instagram</div></div><div style="padding: 12.5% 0;"></div> <div style="display: flex; flex-direction: row; margin-bottom: 14px; align-items: center;"><div> <div style="background-color: #F4F4F4; border-radius: 50%; height: 12.5px; width: 12.5px; transform: translateX(0px) translateY(7px);"></div> <div style="background-color: #F4F4F4; height: 12.5px; transform: rotate(-45deg) translateX(3px) translateY(1px); width: 12.5px; flex-grow: 0; margin-right: 14px; margin-left: 2px;"></div> <div style="background-color: #F4F4F4; border-radius: 50%; height: 12.5px; width: 12.5px; transform: translateX(9px) translateY(-18px);"></div></div><div style="margin-left: 8px;"> <div style=" background-color: #F4F4F4; border-radius: 50%; flex-grow: 0; height: 20px; width: 20px;"></div> <div style=" width: 0; height: 0; border-top: 2px solid transparent; border-left: 6px solid #f4f4f4; border-bottom: 2px solid transparent; transform: translateX(16px) translateY(-4px) rotate(30deg)"></div></div><div style="margin-left: auto;"> <div style=" width: 0px; border-top: 8px solid #F4F4F4; border-right: 8px solid transparent; transform: translateY(16px);"></div> <div style=" background-color: #F4F4F4; flex-grow: 0; height: 12px; width: 16px; transform: translateY(-4px);"></div> <div style=" width: 0; height: 0; border-top: 8px solid #F4F4F4; border-left: 8px solid transparent; transform: translateY(-4px) translateX(8px);"></div></div></div> <div style="display: flex; flex-direction: column; flex-grow: 1; justify-content: center; margin-bottom: 24px;"> <div style=" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; margin-bottom: 6px; width: 224px;"></div> <div style=" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; width: 144px;"></div></div></a><p style=" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; line-height:17px; margin-bottom:0; margin-top:8px; overflow:hidden; padding:8px 0 7px; text-align:center; text-overflow:ellipsis; white-space:nowrap;"><a href="https://www.instagram.com/dna_girlsflagfootball/?utm_source=ig_embed&amp;utm_campaign=loading" style=" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:normal; line-height:17px;" target="_blank">DNA Athletics</a> (@<a href="https://www.instagram.com/dna_girlsflagfootball/?utm_source=ig_embed&amp;utm_campaign=loading" style=" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:normal; line-height:17px;" target="_blank">dna_girlsflagfootball</a>) • Instagram photos and videos</p></div></blockquote>
                <script async src="//www.instagram.com/embed.js"></script>}
              title="DNA Flag Instagram Feed"
              className="w-full h-[460px] border-0"
              scrolling="no"
              allowTransparency="true"
            />
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3">
            <p className="text-sm font-bold text-slate-700">
              Live Instagram Feed Ready to Connect
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Create a free grid widget on <strong>SnapWidget</strong> or <strong>Behold</strong>, copy the embed URL, and paste it into <code className="bg-slate-100 px-1.5 py-0.5 rounded">INSTAGRAM_EMBED_URL</code> at the top of this file.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};