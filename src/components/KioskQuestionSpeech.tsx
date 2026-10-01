import React, { useEffect, useState, useRef } from 'react';
import { PropTopicKey, AnswerEvalResult } from '../types/security';
import { PROP_TOPICS } from '../data/topics';
import { 
  speakText, 
  stopSpeech, 
  createSpeechRecognition, 
  SpeechRecognitionInterface 
} from '../utils/audio';
import { Mic, MicOff, CheckCircle2, Sparkles, Volume2, AlertCircle } from 'lucide-react';

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

  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null);

  // Flow: 1. DETECTED ("의무기록을 들어주셨네요!") -> 2. QUESTION ("의무기록을 다룰 때...") -> 3. LISTENING
  useEffect(() => {
    let isCancelled = false;

    const startQuestionFlow = async () => {
      setAiStage('DETECTED');
      setSpeechError(false);
      setTranscript('');

      if (ttsEnabled) {
        // Speak initial detection acknowledgement
        speakText(`${prop.displayName}을 들어주셨네요!`, true);
        await new Promise(r => setTimeout(r, 2200));
        if (isCancelled) return;

        // Speak actual question
        setAiStage('QUESTION');
        speakText(prop.question, true);
        await new Promise(r => setTimeout(r, 4200));
        if (isCancelled) return;
      } else {
        await new Promise(r => setTimeout(r, 1500));
      }

      // Transition to LISTENING stage and open microphone
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

  // Microphone STT starter
  const startMicrophone = () => {
    stopSpeech();
    setSpeechError(false);

    const recognition = createSpeechRecognition();
    if (!recognition) {
      // Fallback if browser STT not supported
      setSpeechError(true);
      return;
    }

    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const currentText = Array.from(Object.values(event.results))
        .map(result => result[0].transcript)
        .join('');
      setTranscript(currentText);
    };

    recognition.onerror = () => {
      setSpeechError(true);
    };

    recognition.onend = () => {
      // Auto submit transcript when spoken phrase ends
      if (recognitionRef.current) {
        // handled in explicit submit or trigger
      }
    };

    try {
      recognition.start();
    } catch {
      setSpeechError(true);
    }
  };

  // Submit Spoken Answer to AI Evaluation
  const handleEvaluateAnswer = async (spokenText: string) => {
    if (!spokenText.trim()) {
      setSpeechError(true);
      if (ttsEnabled) {
        speakText("잘 듣지 못했어요. 조금 더 크게 다시 말씀해주세요.", true);
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
          speakText("잘 듣지 못했어요. 조금 더 크게 다시 말씀해주세요.", true);
        }
        startMicrophone();
      } else {
        onEvalResult(data, spokenText);
      }

    } catch (err) {
      console.error('Answer evaluation error:', err);
      // Fallback
      onEvalResult({
        status: 'PASS',
        message: '🎉 정답입니다! 정보보호 수칙을 정확하게 알고 계시네요.'
      }, spokenText);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none space-y-8 animate-fade-in max-w-4xl mx-auto my-auto">
      
      {/* DETECTED BADGE */}
      <div className="space-y-3">
        <div className="inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 font-extrabold text-base tracking-wider uppercase shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>✓ DETECTED</span>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <span className="text-6xl sm:text-7xl animate-bounce">{prop.icon}</span>
          <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            {prop.displayName}
          </h2>
        </div>
      </div>

      {/* QUESTION BOX */}
      <div className="bg-slate-900 border-2 border-blue-500/50 rounded-3xl p-8 shadow-2xl space-y-4 w-full">
        <div className="text-xs font-extrabold text-blue-400 tracking-widest uppercase">
          SECURITY CHALLENGE QUESTION
        </div>

        <p className="text-2xl sm:text-4xl font-extrabold text-white leading-relaxed tracking-tight">
          "{prop.question}"
        </p>

        {aiStage === 'QUESTION' && (
          <div className="text-sm font-bold text-cyan-300 flex items-center justify-center gap-2 pt-2">
            <Volume2 className="w-5 h-5 animate-pulse text-cyan-400" />
            <span>AI가 질문을 말씀드리고 있습니다...</span>
          </div>
        )}
      </div>

      {/* STEP 2: MICROPHONE LISTENING STATE */}
      {(aiStage === 'LISTENING' || aiStage === 'EVALUATING') && (
        <div className="space-y-6 w-full animate-fade-in">
          
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-extrabold text-sm tracking-widest uppercase">
            <span>STEP 2</span>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/90 border-2 border-rose-500/60 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-center space-x-3 text-2xl sm:text-3xl font-black text-rose-400">
              <Mic className="w-8 h-8 animate-bounce text-rose-400" />
              <span>
                {evaluating ? 'AI가 답변을 확인하고 있습니다...' : '🎤 "답변을 말씀해주세요!"'}
              </span>
            </div>

            <p className="text-sm font-bold text-slate-300">
              {evaluating ? '잠시만 기다려주세요...' : '"AI가 듣고 있습니다..."'}
            </p>

            {/* Speech error recovery display */}
            {speechError && (
              <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-base flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <span>잘 듣지 못했어요. 조금 더 크게 다시 말씀해주세요!</span>
              </div>
            )}

            {/* Live Transcript Preview */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-lg font-bold text-emerald-300 min-h-[70px] flex items-center justify-center">
              {transcript ? (
                <span>"{transcript}"</span>
              ) : (
                <span className="text-slate-500 font-normal text-sm">
                  마이크에 대고 말씀하시면 음성이 자막으로 나타납니다...
                </span>
              )}
            </div>

            {/* Manual Confirm / Evaluate Button if needed */}
            {transcript && !evaluating && (
              <button
                onClick={() => handleEvaluateAnswer(transcript)}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-lg shadow-xl shadow-emerald-500/30 transition-all transform hover:scale-105"
              >
                <span>[ 이 답변으로 평가받기 ]</span>
              </button>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
