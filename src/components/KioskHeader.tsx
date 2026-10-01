import React from 'react';
import { AppPhase } from '../types/security';
import { Shield } from 'lucide-react';

interface KioskHeaderProps {
  phase: AppPhase;
  ttsEnabled: boolean;
  onToggleTTS: () => void;
}

export const KioskHeader: React.FC<KioskHeaderProps> = ({
  phase,
  ttsEnabled,
  onToggleTTS
}) => {
  const getStatusBadge = () => {
    switch (phase) {
      case 'IDLE':
        return { text: 'CAMERA READY', color: 'bg-slate-700 text-slate-300 border-slate-600' };
      case 'SCANNING':
        return { text: 'SEARCHING SECURITY ITEM', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse' };
      case 'RECOGNIZED':
        return { text: 'ITEM DETECTED', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'QUESTIONING':
        return { text: 'AI ASKING', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 'LISTENING':
        return { text: 'LISTENING', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' };
      case 'EVALUATING':
        return { text: 'AI CHECKING ANSWER', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse' };
      case 'RESULT_PASS':
        return { text: 'PASS - MISSION CLEAR', color: 'bg-emerald-500 text-slate-950 font-black border-emerald-400' };
      case 'RESULT_RETRY':
        return { text: 'RETRY', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      case 'RESULT_FAIL':
        return { text: 'FAIL', color: 'bg-slate-800 text-slate-400 border-slate-700' };
      default:
        return { text: 'READY', color: 'bg-slate-800 text-slate-400 border-slate-700' };
    }
  };

  const badge = getStatusBadge();

  return (
    <header className="h-20 bg-slate-950/90 border-b border-slate-800/80 px-8 flex items-center justify-between shrink-0 select-none">
      
      {/* Title */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Shield className="w-7 h-7 text-cyan-400" />
          </div>
        </div>

        <div>
          <div className="text-xs font-bold text-cyan-400 tracking-wider uppercase">
            HOSPITAL INFORMATION SECURITY WEEK
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">
            AI SECURITY CHALLENGE
          </h1>
        </div>
      </div>

      {/* Live AI Status HUD Indicator */}
      <div className="flex items-center space-x-4">
        <div className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest border flex items-center space-x-2 transition-all ${badge.color}`}>
          <span className="w-2.5 h-2.5 rounded-full bg-current animate-ping" />
          <span>● {badge.text}</span>
        </div>

        <button
          onClick={onToggleTTS}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white"
        >
          음성 {ttsEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

    </header>
  );
};
