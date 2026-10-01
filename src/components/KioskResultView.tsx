import React, { useEffect, useState, useRef } from 'react';
import { PropTopicKey, AnswerEvalResult } from '../types/security';
import { PROP_TOPICS } from '../data/topics';
import { 
  speakText, 
  stopSpeech, 
  createSpeechRecognition, 
  SpeechRecognitionInterface 
} from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Gift, 
  Mic, 
  Lightbulb, 
  Sparkles,
  ArrowRight,
  Send
} from 'lucide-react';

interface KioskResultViewProps {
  topicKey: PropTopicKey;
  evalResult: AnswerEvalResult;
  userAnswerText: string;
  ttsEnabled: boolean;
  onNextParticipant: () => void;
  onSecondAttemptEval: (result: AnswerEvalResult, text: string) => void;
}

export const KioskResultView: React.FC<KioskResultViewProps> = ({
  topicKey,
  evalResult,
  ttsEnabled,
  onNextParticipant,
  onSecondAttemptEval
}) => {
  const prop = PROP_TOPICS[topicKey] || PROP_TOPICS.medical_record;

  const [secondListening, setSecondListening] = useState<boolean>(false);
  const [secondTranscript, setSecondTranscript] = useState<string>('');
  const [evaluatingSecond, setEvaluatingSecond] = useState<boolean>(false);

  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null);

  useEffect(() => {
    if (evalResult.status === 'PASS') {
      try {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 }
        });
      } catch { /* ignore */ }

      if (ttsEnabled) {
        speakText("정답입니다! 정보보호 수칙을 정확하게 알고 계시네요. 축하합니다!", true);
      }
    } else if (evalResult.status === 'RETRY') {
      if (ttsEnabled) {
        const hintText = evalResult.hint || prop.hint;
        speakText(`아쉽습니다! 힌트를 드릴게요. ${hintText}. 한 번 더 말씀해주세요.`, true);
      }

      const timer = setTimeout(() => {
        startSecondMicrophone();
      }, 3500);

      return () => clearTimeout(timer);
    } else if (evalResult.status === 'FAIL') {
      if (ttsEnabled) {
        const expText = evalResult.correctAnswerExplanation || prop.failureAnswer;
        speakText(`이번에는 아쉽네요! 정답은 ${expText}`, true);
      }
    }

    return () => {
      stopSpeech();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
      }
    };
  }, [evalResult, ttsEnabled, prop.hint, prop.failureAnswer]);

  const startSecondMicrophone = () => {
    stopSpeech();
    setSecondListening(true);
    setSecondTranscript('');

    const recognition = createSpeechRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const text = Array.from(Object.values(event.results))
        .map(result => result[0].transcript)
        .join('');
      setSecondTranscript(text);
    };

    recognition.onerror = () => {
      setSecondListening(false);
    };

    try {
      recognition.start();
    } catch {
      setSecondListening(false);
    }
  };

  const handleSecondSubmit = async (text: string) => {
    if (!text.trim()) return;

    setEvaluatingSecond(true);
    stopSpeech();

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }

    try {
      const res = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicKey,
          userAnswer: text,
          retryCount: 1
        })
      });

      if (!res.ok) throw new Error('API Error');

      const data: AnswerEvalResult = await res.json();
      onSecondAttemptEval(data, text);

    } catch (err) {
      console.error('Second attempt eval error:', err);
      onSecondAttemptEval({
        status: 'PASS',
        message: '🎉 정답입니다!'
      }, text);
    } finally {
      setEvaluatingSecond(false);
    }
  };

  // 1. PASS FULL-SCREEN SUCCESS VIEW
  if (evalResult.status === 'PASS') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center select-none space-y-6 sm:space-y-8 animate-fade-in bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950 border-4 border-emerald-400 m-2 sm:m-4 rounded-3xl shadow-2xl min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        
        {/* Giant Badge */}
        <div className="relative">
          <div className="w-28 h-28 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-300 p-1 mx-auto shadow-2xl shadow-emerald-400/50 animate-bounce flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-16 h-16 sm:w-24 sm:h-24 text-emerald-400" />
            </div>
          </div>
          <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-300 absolute -top-2 -right-2 animate-spin" />
        </div>

        {/* Clear Title */}
        <div className="space-y-2 sm:space-y-3">
          <div className="inline-block px-4 py-1.5 sm:px-6 sm:py-2 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 font-black text-xs sm:text-lg tracking-widest uppercase">
            SECURITY CHALLENGE CLEAR
          </div>

          <h1 className="text-3xl sm:text-7xl font-black text-white tracking-tight leading-none">
            ✅ PASS!
          </h1>

          <p className="text-lg sm:text-4xl font-extrabold text-emerald-300">
            "정답입니다! 정보보호 수칙을 정확하게 알고 계시네요!"
          </p>
        </div>

        {/* Prize Callout Box */}
        <div className="bg-slate-900/90 border-4 border-dashed border-emerald-400 rounded-3xl p-4 sm:p-8 max-w-2xl w-full shadow-2xl space-y-2 sm:space-y-3">
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 text-amber-300 font-black text-xl sm:text-3xl">
            <Gift className="w-7 h-7 sm:w-9 sm:h-9 animate-pulse" />
            <span>🎁 상품을 받아가세요!</span>
          </div>
          <p className="text-sm sm:text-xl text-slate-100 font-bold leading-relaxed">
            이 성공 화면을 <strong className="text-emerald-400 underline font-black">운영 직원</strong>에게 보여주세요.
          </p>
          <div className="text-xs sm:text-sm text-slate-400 pt-1 font-semibold">
            이수한 보안 미션: {prop.displayName} ({prop.icon})
          </div>
        </div>

        {/* Next Participant Reset Button */}
        <div className="pt-2 sm:pt-4">
          <button
            onClick={onNextParticipant}
            className="px-8 py-4 sm:px-12 sm:py-6 rounded-3xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-lg sm:text-3xl shadow-2xl shadow-emerald-500/40 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-3 mx-auto"
          >
            <span>[ 다음 참가자 ]</span>
            <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        </div>

      </div>
    );
  }

  // 2. RETRY VIEW
  if (evalResult.status === 'RETRY') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center select-none space-y-6 sm:space-y-8 animate-fade-in max-w-4xl mx-auto my-auto min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        
        <div className="space-y-4 w-full">
          
          <div className="p-5 sm:p-8 rounded-3xl bg-slate-900 border-2 border-rose-500/60 shadow-2xl space-y-3 sm:space-y-4 text-center">
            <div className="text-2xl sm:text-4xl font-black text-rose-400">
              ❌ "아쉽습니다!"
            </div>

            <div className="text-base sm:text-xl font-bold text-slate-200">
              "힌트를 드릴게요."
            </div>

            <div className="bg-slate-950 p-4 sm:p-6 rounded-2xl border border-rose-500/30 text-base sm:text-2xl font-extrabold text-rose-200 leading-relaxed">
              "{evalResult.hint || prop.hint}"
            </div>
          </div>

          <div className="p-5 sm:p-8 rounded-3xl bg-slate-900/90 border-2 border-rose-500/60 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-center space-x-2 sm:space-x-3 text-xl sm:text-3xl font-black text-rose-400">
              <Mic className="w-6 h-6 sm:w-8 sm:h-8 animate-bounce text-rose-400" />
              <span>
                {evaluatingSecond ? 'AI가 답변을 확인하고 있습니다...' : '🎤 "한 번 더 말씀해주세요."' }
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-sm sm:text-lg font-bold text-emerald-300 min-h-[60px] flex items-center justify-center">
              {secondTranscript ? (
                <span>"제가 들은 답변: {secondTranscript}"</span>
              ) : (
                <span className="text-slate-500 font-normal text-xs sm:text-sm">
                  마이크에 대고 다시 말씀해주세요...
                </span>
              )}
            </div>

            {secondTranscript && !evaluatingSecond && (
              <button
                onClick={() => handleSecondSubmit(secondTranscript)}
                className="px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base sm:text-lg shadow-xl shadow-emerald-500/30 transition-all transform hover:scale-105"
              >
                <span>[ 이 답변으로 평가받기 ]</span>
              </button>
            )}

            {/* Fallback Text Input */}
            <div className="pt-2 border-t border-slate-800/80 flex gap-2 max-w-md mx-auto">
              <input
                type="text"
                value={secondTranscript}
                onChange={(e) => setSecondTranscript(e.target.value)}
                placeholder="답변 직접 입력..."
                className="flex-1 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none"
              />
              <button
                onClick={() => handleSecondSubmit(secondTranscript)}
                disabled={!secondTranscript.trim() || evaluatingSecond}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs shrink-0 flex items-center space-x-1"
              >
                <span>제출</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>
    );
  }

  // 3. FAIL VIEW
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center select-none space-y-6 sm:space-y-8 animate-fade-in max-w-4xl mx-auto my-auto min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-amber-500/50 shadow-2xl space-y-4 sm:space-y-6 w-full">
        
        <div className="flex items-center justify-center space-x-2 sm:space-x-3 text-2xl sm:text-4xl font-black text-amber-400">
          <Lightbulb className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 animate-pulse" />
          <span>💡 "이번에는 아쉽네요!"</span>
        </div>

        <div className="text-base sm:text-xl font-bold text-slate-300">
          "정답을 알려드릴게요."
        </div>

        <div className="bg-slate-950 p-5 sm:p-6 rounded-2xl border border-amber-500/30 text-lg sm:text-2xl font-extrabold text-amber-200 leading-relaxed">
          "{evalResult.correctAnswerExplanation || prop.failureAnswer}"
        </div>

      </div>

      <div className="pt-2 sm:pt-4">
        <button
          onClick={onNextParticipant}
          className="px-8 py-4 sm:px-12 sm:py-6 rounded-3xl bg-gradient-to-r from-blue-600 via-teal-500 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-slate-950 font-black text-lg sm:text-3xl shadow-2xl shadow-cyan-500/40 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-3 mx-auto"
        >
          <span>[ 다음 참가자 ]</span>
          <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      </div>

    </div>
  );
};
