import React, { useState } from 'react';
import { AppPhase, PropTopicKey, AnswerEvalResult } from './types/security';
import { PROP_TOPICS } from './data/topics';
import { KioskHeader } from './components/KioskHeader';
import { KioskIdle } from './components/KioskIdle';
import { KioskCameraScanner } from './components/KioskCameraScanner';
import { KioskQuestionSpeech } from './components/KioskQuestionSpeech';
import { KioskResultView } from './components/KioskResultView';
import { OperatorMenu } from './components/OperatorMenu';
import { playSoundEffect, speakText } from './utils/audio';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('IDLE');
  const [currentTopicKey, setCurrentTopicKey] = useState<PropTopicKey | null>(null);
  const [evalResult, setEvalResult] = useState<AnswerEvalResult | null>(null);
  const [userAnswerText, setUserAnswerText] = useState<string>('');
  const [retryCount, setRetryCount] = useState<number>(0);
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);
  const [cameraErrorMsg, setCameraErrorMsg] = useState<string | null>(null);

  // START CHALLENGE
  const handleStartChallenge = () => {
    playSoundEffect('click');
    setPhase('SCANNING');
    setCurrentTopicKey(null);
    setEvalResult(null);
    setUserAnswerText('');
    setRetryCount(0);
    setCameraErrorMsg(null);
  };

  // PROP DETECTED BY CAMERA VISION
  const handlePropDetected = (topicKey: PropTopicKey) => {
    playSoundEffect('fanfare');
    setCurrentTopicKey(topicKey);
    setPhase('RECOGNIZED');
  };

  // EVALUATION RESULT RECEIVED FROM SPEECH
  const handleEvalResult = (result: AnswerEvalResult, text: string) => {
    setEvalResult(result);
    setUserAnswerText(text);

    if (result.status === 'PASS') {
      setPhase('RESULT_PASS');
    } else if (result.status === 'RETRY') {
      setPhase('RESULT_RETRY');
      setRetryCount(1);
    } else if (result.status === 'FAIL') {
      setPhase('RESULT_FAIL');
    }
  };

  // SECOND ATTEMPT EVALUATION RESULT
  const handleSecondAttemptEval = (result: AnswerEvalResult, text: string) => {
    setEvalResult(result);
    setUserAnswerText(text);

    if (result.status === 'PASS') {
      setPhase('RESULT_PASS');
    } else {
      setPhase('RESULT_FAIL');
    }
  };

  // COMPLETE RESET FOR NEXT PARTICIPANT
  const handleNextParticipant = () => {
    playSoundEffect('click');
    setPhase('IDLE');
    setCurrentTopicKey(null);
    setEvalResult(null);
    setUserAnswerText('');
    setRetryCount(0);
    setCameraErrorMsg(null);
  };

  // EMERGENCY OPERATOR SIMULATE PROP
  const handleOperatorSimulateProp = (key: PropTopicKey) => {
    playSoundEffect('click');
    setCurrentTopicKey(key);
    setPhase('RECOGNIZED');
  };

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      
      {/* 16:9 TV Kiosk Header */}
      <KioskHeader
        phase={phase}
        ttsEnabled={ttsEnabled}
        onToggleTTS={() => setTtsEnabled(prev => !prev)}
      />

      {/* Main Kiosk Stage */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Camera Error Alert if webcam fails */}
        {cameraErrorMsg && phase === 'SCANNING' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-rose-500/90 text-white font-bold px-6 py-3 rounded-2xl border border-rose-300 shadow-xl text-center text-sm">
            {cameraErrorMsg}
          </div>
        )}

        {/* Phase 1: IDLE STANDBY SCREEN */}
        {phase === 'IDLE' && (
          <KioskIdle onStart={handleStartChallenge} />
        )}

        {/* Phase 2: SCANNING WEBCAM STAGE */}
        {phase === 'SCANNING' && (
          <KioskCameraScanner
            onPropDetected={handlePropDetected}
            onCameraError={(err) => setCameraErrorMsg(err)}
            ttsEnabled={ttsEnabled}
            onSpeakNotice={(msg) => speakText(msg, ttsEnabled)}
          />
        )}

        {/* Phase 3 & 4: RECOGNIZED / QUESTIONING / LISTENING STAGE */}
        {(phase === 'RECOGNIZED' || phase === 'QUESTIONING' || phase === 'LISTENING' || phase === 'EVALUATING') && currentTopicKey && (
          <KioskQuestionSpeech
            topicKey={currentTopicKey}
            ttsEnabled={ttsEnabled}
            onEvalResult={handleEvalResult}
            retryCount={retryCount}
          />
        )}

        {/* Phase 5: RESULT DISPLAY STAGE (PASS / RETRY / FAIL) */}
        {(phase === 'RESULT_PASS' || phase === 'RESULT_RETRY' || phase === 'RESULT_FAIL') && currentTopicKey && evalResult && (
          <KioskResultView
            topicKey={currentTopicKey}
            evalResult={evalResult}
            userAnswerText={userAnswerText}
            ttsEnabled={ttsEnabled}
            onNextParticipant={handleNextParticipant}
            onSecondAttemptEval={handleSecondAttemptEval}
          />
        )}

      </main>

      {/* Discrete Operator Control Drawer */}
      <OperatorMenu
        phase={phase}
        currentTopicKey={currentTopicKey}
        ttsEnabled={ttsEnabled}
        onToggleTTS={() => setTtsEnabled(prev => !prev)}
        onForceReset={handleNextParticipant}
        onSimulateProp={handleOperatorSimulateProp}
      />

    </div>
  );
}
