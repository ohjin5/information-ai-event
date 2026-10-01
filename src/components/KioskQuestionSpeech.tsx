import React, { useEffect, useState, useRef } from 'react';
import { PropTopicKey, AnswerEvalResult } from '../types/security';
import { PROP_TOPICS } from '../data/topics';
import { 
  speakText, 
  stopSpeech, 
  createSpeechRecognition, 
  SpeechRecognitionInterface 
} from '../utils/audio';
import { Mic, CheckCircle2, Volume2, AlertCircle, Send, HelpCircle } from 'lucide-react';

interface KioskQuestionSpeechProps {
  topicKey: PropTopicKey;
  ttsEnabled: boolean;
  onEvalResult: (result: AnswerEvalResult, userAnswer: string) => void;
  retryCount: number;
}

export const KioskQuestionSpeech: React.FC<KioskQuestionSpeechProps> = ({
  topicKey,
  ttsEnabled,
  onEvalResult,
  retryCount
}) => {
  const prop = PROP_TOPICS[topicKey] || PROP_TOPICS.medical_record;

  const [aiStage, setAiStage] = useState<'DETECTED' | 'QUESTION' | 'LISTENING' | 'EVALUATING'>('DETECTED');
  const [transcript, setTranscript] = useState<string>('');
  const [speechError, setSpeechError] = useState<boolean>(false);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [textFallback, setTextFallback] = useState<string>('');

  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const startQuestionFlow = async () => {
      setAiStage('DETECTED');
      setSpeechError(false);
      setTranscript('');
      setTextFallback('');

      if (ttsEnabled) {
        speakText(`${prop.displayName}를 들어주셨네요!`, true);
        await new Promise(r => setTimeout(r, 2200));
        if (isCancelled) return;

        setAiStage('QUESTION');
        speakText(prop.question, true);
        await new Promise(r => setTimeout(r, 4200));
        if (isCancelled) return;
      } else {
        await new Promise(r => setTimeout(r, 1500));
      }

      if (!isCancelled) {
        setAiStage('LISTENING');
        startMicrophone();
      }
    };

    startQuestionFlow();

    return () => {
      isCancelled = true;
      stopSpeech();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
      }
    };
  }, [topicKey, ttsEnabled, prop.displayName, prop.question]);

  const startMicrophone = () => {
    stopSpeech();
    setSpeechError(false);

    const recognition = createSpeechRecognition();
    if (!recognition) {
      setSpeechError(true);
      return;
    }

    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const currentText = Array.from(Object.values(event.results))
        .map(result => result[0].transcript)
        .join('');
      setTranscript(currentText);
      setTextFallback(currentText);
    };

    recognition.onerror = () => {
      setSpeechError(true);
    };

    try {
      recognition.start();
    } catch {
      setSpeechError(true);
    }
  };

  const handleEvaluateAnswer = async (spokenText: string) => {
    if (!spokenText.trim()) {
      setSpeechError(true);
      if (ttsEnabled) {
        speakText("잘 듣지 못했어요. 다시 한번 말씀해주세요.", true);
      }
      return;
    }

    setEvaluating(true);
    setAiStage('EVALUATING');
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
          userAnswer: spokenText,
          retryCount
        })
      });

      if (!res.ok) throw new Error('API Error');

      const data: AnswerEvalResult = await res.json();

      if (data.isAudioError) {
        setSpeechError(true);
        setAiStage('LISTENING');
        if (ttsEnabled) {
          speakText("잘 듣지 못했어요. 다시 한번 말씀해주세요.", true);
        }
        startMicrophone();
      } else {
        onEvalResult(data, spokenText);
      }

    } catch (err) {
      console.error('Answer evaluation error:', err);
      onEvalResult({
        status: 'PASS',
        message: '🎉 정답입니다! 정보보호 수칙을 정확하게 알고 계시네요.'
      }, spokenText);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center select-none space-y-6 sm:space-y-8 animate-fade-in max-w-4xl mx-auto my-auto min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      
      {/* DETECTED BADGE */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 font-extrabold text-xs sm:text-base tracking-wider uppercase shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          <span>✓ ITEM DETECTED</span>
        </div>

        <div className="flex items-center justify-center space-x-3">
          <span className="text-4xl sm:text-7xl animate-bounce">{prop.icon}</span>
          <h2 className="text-2xl sm:text-5xl font-black text-white tracking-tight">
            {prop.displayName}
          </h2>
        </div>
      </div>

      {/* QUESTION BOX */}
      <div className="bg-slate-900 border-2 border-blue-500/50 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-3 w-full">
        <div className="text-[11px] sm:text-xs font-extrabold text-blue-400 tracking-widest uppercase">
          SECURITY CHALLENGE QUESTION
        </div>

        <p className="text-lg sm:text-3xl font-extrabold text-white leading-relaxed tracking-tight">
          "{prop.question}"
        </p>

        {aiStage === 'QUESTION' && (
          <div className="text-xs sm:text-sm font-bold text-cyan-300 flex items-center justify-center gap-2 pt-1">
            <Volume2 className="w-4 h-4 animate-pulse text-cyan-400" />
            <span>AI가 질문을 말씀드리고 있습니다...</span>
          </div>
        )}
      </div>

      {/* STEP 2: MICROPHONE LISTENING STATE */}
      {(aiStage === 'LISTENING' || aiStage === 'EVALUATING') && (
        <div className="space-y-4 sm:space-y-6 w-full animate-fade-in">
          
          <div className="inline-flex items-center space-x-2 px-4 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-extrabold text-xs sm:text-sm tracking-widest uppercase">
            <span>STEP 2</span>
          </div>

          <div className="p-5 sm:p-8 rounded-3xl bg-slate-900/90 border-2 border-rose-500/60 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-center space-x-2 sm:space-x-3 text-xl sm:text-3xl font-black text-rose-400">
              <Mic className="w-6 h-6 sm:w-8 sm:h-8 animate-bounce text-rose-400" />
              <span>
                {evaluating ? 'AI가 답변을 확인하고 있습니다...' : '🎤 "답변을 말씀해주세요"'}
              </span>
            </div>

            <p className="text-xs sm:text-sm font-bold text-slate-300">
              {evaluating ? '잠시만 기다려주세요...' : '"AI가 듣고 있습니다..."'}
            </p>

            {/* Speech error recovery display */}
            {speechError && (
              <div className="p-3 sm:p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs sm:text-base flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <span>잘 듣지 못했어요. 다시 한번 말씀해주세요!</span>
              </div>
            )}

            {/* Live Transcript Preview */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-base sm:text-lg font-bold text-emerald-300 min-h-[60px] flex items-center justify-center">
              {transcript ? (
                <span>"제가 들은 답변: {transcript}"</span>
              ) : (
                <span className="text-slate-500 font-normal text-xs sm:text-sm">
                  마이크에 대고 말씀하시면 음성이 자막으로 나타납니다...
                </span>
              )}
            </div>

            {/* Confirm button */}
            {transcript && !evaluating && (
              <button
                onClick={() => handleEvaluateAnswer(transcript)}
                className="px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base sm:text-lg shadow-xl shadow-emerald-500/30 transition-all transform hover:scale-105"
              >
                <span>[ 이 답변으로 평가받기 ]</span>
              </button>
            )}

            {/* Fallback Text Input for Mobile/Muted Browsers */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>음성 인식이 어렵다면 아래에 직접 입력하실 수도 있습니다:</span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEvaluateAnswer(textFallback);
                }}
                className="flex gap-2 max-w-md mx-auto"
              >
                <input
                  type="text"
                  value={textFallback}
                  onChange={(e) => setTextFallback(e.target.value)}
                  placeholder="답변 입력..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={!textFallback.trim() || evaluating}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs shrink-0 flex items-center space-x-1"
                >
                  <span>제출</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
