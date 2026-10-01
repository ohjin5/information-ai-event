import React from 'react';
import { Shield, Volume2, VolumeX, Award, QrCode, RotateCcw } from 'lucide-react';

interface HeaderProps {
  ttsEnabled: boolean;
  onToggleTTS: () => void;
  onOpenStamps: () => void;
  onOpenQRScanner: () => void;
  onOpenQRPrinter: () => void;
  onResetProgress: () => void;
  completedCount: number;
  totalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  ttsEnabled,
  onToggleTTS,
  onOpenStamps,
  onOpenQRScanner,
  onOpenQRPrinter,
  onResetProgress,
  completedCount,
  totalCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Event Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                병원 정보보호주간
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline-block">AI 호스트 부스</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>AI Security Challenge</span>
            </h1>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center space-x-2">
          
          {/* Audio TTS Voice Toggle */}
          <button
            onClick={onToggleTTS}
            title={ttsEnabled ? 'AI 음성 안내 끄기' : 'AI 음성 안내 켜기'}
            className={`p-2 rounded-lg border transition-all text-xs flex items-center space-x-1.5 ${
              ttsEnabled 
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30' 
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700/80'
            }`}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline font-medium">{ttsEnabled ? '음성 ON' : '음성 OFF'}</span>
          </button>

          {/* QR Scanner / Prop Simulator */}
          <button
            onClick={onOpenQRScanner}
            className="p-2 sm:px-3 sm:py-2 rounded-lg bg-teal-600/20 border border-teal-500/40 text-teal-300 hover:bg-teal-600/30 transition-all text-xs font-semibold flex items-center space-x-1.5"
            title="소품 QR 코드 스캔"
          >
            <QrCode className="w-4 h-4 text-teal-400" />
            <span className="hidden sm:inline">QR 스캔</span>
          </button>

          {/* Stamp Board Passport */}
          <button
            onClick={onOpenStamps}
            className="relative px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-900/30 transition-all text-xs font-bold flex items-center space-x-1.5"
          >
            <Award className="w-4 h-4" />
            <span>스탬프 판 ({completedCount}/{totalCount})</span>
            {completedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          {/* Organizer QR Printable Cards */}
          <button
            onClick={onOpenQRPrinter}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all text-xs hidden lg:flex items-center space-x-1"
            title="행사장 소품 QR 출력용 모음"
          >
            <span>소품 QR 모음</span>
          </button>

          {/* Reset progress */}
          <button
            onClick={() => {
              if (window.confirm('모든 스탬프 및 진행 상황을 초기화하시겠습니까?')) {
                onResetProgress();
              }
            }}
            className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-all text-xs"
            title="초기화"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
};
