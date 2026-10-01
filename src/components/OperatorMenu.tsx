import React, { useState } from 'react';
import { AppPhase, PropTopicKey } from '../types/security';
import { PROP_TOPICS, PROP_TOPIC_KEYS } from '../data/topics';
import { Settings, RotateCcw, Camera, Mic, Volume2, Maximize, X, Sparkles, Shield } from 'lucide-react';

interface OperatorMenuProps {
  phase: AppPhase;
  currentTopicKey: PropTopicKey | null;
  ttsEnabled: boolean;
  onToggleTTS: () => void;
  onForceReset: () => void;
  onSimulateProp: (key: PropTopicKey) => void;
}

export const OperatorMenu: React.FC<OperatorMenuProps> = ({
  phase,
  currentTopicKey,
  ttsEnabled,
  onToggleTTS,
  onForceReset,
  onSimulateProp
}) => {
  const [open, setOpen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <>
      {/* Discrete Bottom Right Button */}
      <div className="fixed bottom-4 right-4 z-40 select-none opacity-40 hover:opacity-100 transition-opacity">
        <button
          onClick={() => setOpen(true)}
          className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white shadow-xl flex items-center space-x-2 text-xs font-bold"
          title="운영자 메뉴"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">운영자 메뉴</span>
        </button>
      </div>

      {/* Operator Drawer Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">행사장 운영자 제어판</h3>
                  <p className="text-xs text-slate-400">시스템 현황 점검 및 긴급 제어</p>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 text-xs text-slate-300">
              
              {/* Current Status Monitor */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-slate-400 font-bold">현재 AI 진행 상태:</div>
                <div className="text-sm font-black text-cyan-400">
                  ● {phase} {currentTopicKey ? `(${PROP_TOPICS[currentTopicKey]?.displayName})` : ''}
                </div>
              </div>

              {/* Quick Action Grid */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    onForceReset();
                    setOpen(false);
                  }}
                  className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold flex items-center space-x-2 hover:bg-rose-500/30 transition-all text-left"
                >
                  <RotateCcw className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-black">강제 초기화</div>
                    <div className="text-[10px] text-rose-300/80">처음 대기 화면으로 레셋</div>
                  </div>
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-white font-bold flex items-center space-x-2 hover:bg-slate-750 transition-all text-left"
                >
                  <Maximize className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-black">전체화면 토글</div>
                    <div className="text-[10px] text-slate-400">16:9 TV 모드 실행</div>
                  </div>
                </button>

                <button
                  onClick={onToggleTTS}
                  className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-white font-bold flex items-center space-x-2 hover:bg-slate-750 transition-all text-left"
                >
                  <Volume2 className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-black">음성 안내 {ttsEnabled ? 'OFF' : 'ON'}</div>
                    <div className="text-[10px] text-slate-400">TTS 스피커 제어</div>
                  </div>
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-white font-bold flex items-center space-x-2 hover:bg-slate-750 transition-all text-left"
                >
                  <Camera className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-black">장치 재연결</div>
                    <div className="text-[10px] text-slate-400">웹캠/마이크 새로고침</div>
                  </div>
                </button>
              </div>

              {/* Operator Prop Simulator (Emergency Test) */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  비상 소품 테스트 (웹캠 대신 소품 강제 인식):
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {PROP_TOPIC_KEYS.map((key) => {
                    const prop = PROP_TOPICS[key];
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          onSimulateProp(key);
                          setOpen(false);
                        }}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-center transition-all"
                      >
                        <div className="text-lg">{prop.icon}</div>
                        <div className="text-[10px] font-bold text-slate-300 truncate">
                          {prop.displayName}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
};
