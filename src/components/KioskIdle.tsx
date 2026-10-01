import React from 'react';
import { Shield, Sparkles, Play, Camera } from 'lucide-react';

interface KioskIdleProps {
  onStart: () => void;
}

export const KioskIdle: React.FC<KioskIdleProps> = ({ onStart }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden select-none">
      
      {/* Background Cyber Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Content Box */}
      <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-fade-in">
        
        {/* Shield Icon Badge */}
        <div className="inline-block relative">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-blue-600 via-teal-500 to-cyan-400 p-1 mx-auto shadow-2xl shadow-blue-500/30">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
              <Shield className="w-16 h-16 text-cyan-400" />
            </div>
          </div>
          <Sparkles className="w-8 h-8 text-cyan-300 absolute -top-2 -right-2 animate-bounce" />
        </div>

        {/* Title Group */}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 font-extrabold text-sm tracking-widest uppercase">
            <span>INFORMATION SECURITY WEEK</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            AI SECURITY CHALLENGE
          </h1>

          <p className="text-xl sm:text-3xl font-extrabold text-cyan-300">
            "AI 앞에서 당신의 정보보호 실력을 보여주세요!"
          </p>
        </div>

        {/* Giant Start Button */}
        <div className="pt-4">
          <button
            onClick={onStart}
            className="group relative px-12 py-7 rounded-3xl bg-gradient-to-r from-blue-600 via-teal-500 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-slate-950 font-black text-2xl sm:text-3xl shadow-2xl shadow-cyan-500/40 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-4 mx-auto"
          >
            <Play className="w-8 h-8 fill-current text-slate-950 group-hover:animate-pulse" />
            <span>[ CHALLENGE START ]</span>
          </button>
        </div>

        {/* Bottom Instruction */}
        <div className="pt-6 flex items-center justify-center space-x-2 text-base sm:text-lg font-bold text-slate-400">
          <Camera className="w-5 h-5 text-cyan-400" />
          <span>START를 누른 후 보안 소품 하나를 들어주세요.</span>
        </div>

      </div>

    </div>
  );
};
