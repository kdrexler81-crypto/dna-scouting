// src/pages/ProfilePage.jsx
import React from 'react';
import { ChevronLeft, FileText, Award, Activity, Shield, Zap, Target, Video, AtSign, Mail, Eye } from 'lucide-react';

const displayFont = { fontFamily: "'Outfit', sans-serif" };

export const ProfilePage = ({ player, onBack }) => {
  if (!player) return null;
  const getEmbedUrl = (url) => { if (!url || typeof url !== 'string') return null; if (url.includes('youtube.com') || url.includes('youtu.be')) { let videoId = ''; if (url.includes('youtu.be')) videoId = url.split('/').pop().split('?')[0]; else try { const urlObj = new URL(url); videoId = urlObj.searchParams.get('v'); } catch (e) { videoId = ''; } return videoId ? `https://www.youtube.com/embed/${videoId}` : null; } return null; };
  const getMetricStyle = (val, label) => { try { if (!val || val === "N/A" || label === 'Height' || label === 'Weight') return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }; const green = { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }; const yellow = { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' }; const red = { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }; const num = parseFloat(String(val).replace(/[^0-9.]/g, '')); if (isNaN(num)) return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }; if (label.includes('Sprint')) return num <= 6.0 ? green : num <= 6.5 ? yellow : red; if (label.includes('Shuttle')) return num <= 5.25 ? green : num <= 5.5 ? yellow : red; if (label.includes('Drill')) return num <= 5.2 ? green : num <= 6.0 ? yellow : red; if (label.includes('MPH')) return num >= 14.0 ? green : num >= 12.0 ? yellow : red; return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }; } catch (e) { return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }; } };
  const MetricRow = ({ icon: Icon, label, playerStat, verifyStatus }) => { const statStyle = getMetricStyle(playerStat, label); const hasData = playerStat && playerStat !== "N/A" && playerStat !== ""; return ( <div className="flex items-center justify-between py-3 border-b border-slate-100/60 group hover:bg-slate-50/50 transition-colors px-2 rounded-xl gap-2 print:py-1.5"> <div className="flex items-center gap-3 flex-1 min-w-0"> <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-white border border-slate-100 transition-colors shrink-0 print:hidden"> {Icon && <Icon size={16} className="text-slate-500" />} </div> <div className="flex flex-col justify-center gap-1"> <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide leading-tight whitespace-normal">{label}</span> {hasData && verifyStatus === 'laser' && <span title="Hardware Laser Verified" className="w-fit bg-amber-100 text-amber-800 text-[9px] px-2 py-0.5 rounded-full font-bold tracking-widest flex items-center gap-1"><Award size={10}/> LASER</span>} {hasData && verifyStatus === 'stopwatch' && <span title="Stopwatch Verified" className="w-fit bg-slate-100 text-slate-500 text-[9px] px-2 py-0.5 rounded-full font-bold tracking-widest flex items-center gap-1"><Activity size={10}/> MANUAL</span>} {hasData && verifyStatus === 'standard' && <span title="DNA Staff Verified" className="w-fit bg-slate-800 text-white text-[9px] px-2 py-0.5 rounded-full font-bold tracking-widest flex items-center gap-1"><Shield size={10}/> DNA VERIFIED</span>} </div> </div> <div className="w-24 shrink-0 text-right pr-2"> <span className={`text-sm px-4 py-1.5 rounded-full font-semibold ${statStyle.bg} ${statStyle.text} border ${statStyle.border} shadow-sm whitespace-nowrap`}> {playerStat || "N/A"} </span> </div> </div> ); };
  const getVerify = (metricKey) => { if (player?.speedVerifications) return player.speedVerifications[metricKey] || 'stopwatch'; return player?.verificationLevel === 'Hardware Verified (Laser)' ? 'laser' : 'stopwatch'; };

  return (
    <div className="max-w-7xl mx-auto p-4 py-8 animate-in slide-in-from-bottom-8 print:p-0 print:m-0 print:max-w-full">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <button onClick={onBack} className="font-semibold flex items-center gap-1 uppercase tracking-wider text-sm hover:opacity-80 transition-opacity text-slate-500"><ChevronLeft size={18} /> Back</button>
        <button onClick={() => window.print()} className="font-semibold flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm uppercase tracking-wider shadow-md hover:bg-slate-800 hover:-translate-y-0.5 transition-all"><FileText size={16}/> Print Report</button>
      </div>
      <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-8 flex flex-col md:flex-row print:flex-row print:shadow-none print:border-2 print:mb-6">
        <div className="w-full md:w-1/3 print:w-1/3 bg-slate-900 relative shrink-0">
           <div className="absolute top-4 right-4 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg print:bg-black" style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #d6336c 100%)' }}>Verified Profile</div>
           <img src={player?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player?.name || 'athlete'}`} className="w-full h-[320px] sm:h-full object-cover print:h-[220px]" style={{ borderBottom: '4px solid #d6336c' }} alt={player?.name} />
        </div>
        <div className="w-full md:w-2/3 print:w-2/3 flex flex-col">
          <div className="bg-slate-900 text-left p-8 md:p-10 flex-1 flex flex-col justify-center print:bg-white print:text-slate-900 print:p-4">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white uppercase print:text-black tracking-tight" style={displayFont}>{player?.name}</h1>
            <p className="font-bold text-sm md:text-lg uppercase tracking-widest mt-3 text-slate-300" style={displayFont}><span className="text-[#1c7ed6]">{player?.primaryPos}</span> • Class of {player?.gradYear} {player?.dnaTeam && player.dnaTeam !== 'None' ? ` • ${player.dnaTeam}` : (player?.externalClub ? ` • ${player.externalClub}` : '')}</p>
          </div>
          <div className="flex bg-slate-50 border-t border-slate-800 divide-x divide-slate-200 print:bg-white print:border-slate-200">
            <div className="flex-1 p-6 text-center bg-slate-50 print:bg-white print:p-3">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">DNA Score</span>
              <span className="text-5xl md:text-6xl font-black" style={{ ...displayFont, color: '#d6336c' }}>{player?.dnaScore || "0.0"}</span>
            </div>
            <div className="flex-1 p-6 flex flex-col justify-center gap-3 bg-white print:p-3">
              <div className="flex items-center gap-3 print:gap-2"><div className="p-2 bg-blue-50 rounded-lg"><GraduationCap size={18} className="text-[#1c7ed6]"/></div> <span className="text-xs print:text-xs font-semibold uppercase text-slate-400 tracking-wider">GPA:</span> <span className="text-xl print:text-sm font-bold text-slate-800">{player?.gpa || 'N/A'}</span></div>
              <div className="flex items-center gap-3 print:gap-2"><div className="p-2 bg-blue-50 rounded-lg"><FileText size={18} className="text-[#1c7ed6]"/></div> <span className="text-xs print:text-xs font-semibold uppercase text-slate-400 tracking-wider">SAT:</span> <span className="text-xl print:text-sm font-bold text-slate-800">{player?.sat || 'N/A'}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start print:grid-cols-3 print:gap-4">
        <div className="lg:col-span-2 print:col-span-2 flex flex-col gap-8 print:gap-4">
          <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 print:shadow-none print:border-2 print:p-4">
            <h3 className="text-2xl print:text-lg font-extrabold text-slate-900 uppercase tracking-tight mb-6 print:mb-3" style={displayFont}>Verified Combine Metrics</h3>
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-3">
              <div>
                <MetricRow icon={Zap} label="40-Yard Sprint" playerStat={player.metrics?.sprint} verifyStatus={getVerify('sprint')} />
                <MetricRow icon={Activity} label="5-10-5 Shuttle" playerStat={player.metrics?.shuttle} verifyStatus={getVerify('shuttle')} />
                <MetricRow icon={Activity} label="L Drill" playerStat={player.metrics?.lDrill} verifyStatus={getVerify('lDrill')} />
                <MetricRow icon={Zap} label="Max Speed (MPH)" playerStat={player.metrics?.mph} verifyStatus={getVerify('mph')} />
              </div>
              <div>
                <MetricRow icon={Target} label="Broad Jump" playerStat={player.metrics?.broad} verifyStatus="standard" />
                <MetricRow icon={Target} label="Vertical Jump" playerStat={player.metrics?.vertical} verifyStatus="standard" />
                <MetricRow icon={Target} label="Catching Chal." playerStat={player.metrics?.catching} verifyStatus="standard" />
                <MetricRow icon={Target} label="Throwing Acc." playerStat={player.metrics?.throwing} verifyStatus="standard" />
              </div>
            </div>
          </div>
          {player?.hudlLink && (
            <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 flex flex-col h-[400px] print:hidden">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-[#1c7ed6]"><Video size={18} /> Highlight Film</h3>
              <div className="relative w-full flex-grow rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                {getEmbedUrl(player.hudlLink) ? <iframe src={getEmbedUrl(player.hudlLink)} title="Highlight Reel" className="absolute inset-0 w-full h-full" allowFullScreen></iframe> : 
                <a href={player.hudlLink} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center bg-slate-800 text-white font-bold uppercase tracking-wider text-sm hover:bg-slate-700 transition-colors">Watch Film On Hudl</a>}
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-1 print:col-span-1 flex flex-col gap-8 print:gap-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] print:shadow-none print:p-4 print:border-2">
             <h3 className="text-[11px] font-bold uppercase tracking-widest mb-5 text-slate-400 border-b border-slate-100 pb-3 print:mb-2">Recruiting Contact</h3>
             <div className="space-y-4 print:space-y-2">
               {player?.twitter && <a href={`https://twitter.com/${player.twitter.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-[#1c7ed6] transition-colors print:text-black"><div className="p-2.5 bg-blue-50 rounded-xl print:hidden"><AtSign size={16} className="text-[#1c7ed6]"/></div> {player.twitter}</a>}
               <a href={`mailto:${player?.guardianEmail || ''}`} className="flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-[#d6336c] transition-colors print:text-black"><div className="p-2.5 bg-pink-50 rounded-xl print:hidden"><Mail size={16} className="text-[#d6336c]"/></div> Contact Parent/Guardian</a>
             </div>
          </div>
          {player?.scoutNotes && (
            <div className="bg-slate-900 rounded-3xl p-8 shadow-xl print:bg-white print:border-2 print:border-slate-200 print:p-4 print:shadow-none">
               <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4 text-white flex items-center gap-2 print:text-black print:mb-1"><Eye size={16} style={{ color: '#d6336c' }}/> Scout Notes</h3>
               <p className="text-sm print:text-xs text-slate-300 italic print:text-slate-700 leading-relaxed font-medium">"{player.scoutNotes}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};