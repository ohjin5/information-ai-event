import React, { useRef, useEffect, useState } from 'react';
import jsQR from 'jsqr';
import { PropTopicKey, DetectionSource } from '../types/security';
import { 
  PROP_TOPICS, 
  parseQrCodeString, 
  CONFIDENCE_THRESHOLD, 
  REQUIRED_CONSECUTIVE_FRAMES, 
  SCAN_INTERVAL_MS 
} from '../data/topics';
import { Camera, QrCode, Scan, RefreshCw, Sparkles } from 'lucide-react';

interface KioskCameraScannerProps {
  onPropDetected: (topicKey: PropTopicKey, source: DetectionSource) => void;
  onCameraError: (err: string) => void;
  ttsEnabled: boolean;
}

export const KioskCameraScanner: React.FC<KioskCameraScannerProps> = ({
  onPropDetected,
  onCameraError
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [analyzingGemini, setAnalyzingGemini] = useState<boolean>(false);
  const [statusBadge, setStatusBadge] = useState<string>('SEARCHING QR');
  const [statusMessage, setStatusMessage] = useState<string>('카메라에서 QR코드를 찾고 있습니다...');
  const [subMessage, setSubMessage] = useState<string>('판의 QR코드 또는 큰 글씨를 카메라 중앙에 비춰주세요.');
  const [lastDetectedQR, setLastDetectedQR] = useState<string | null>(null);

  const [candidateTopic, setCandidateTopic] = useState<PropTopicKey | null>(null);
  const [consecutiveCount, setConsecutiveCount] = useState<number>(0);

  const qrScanStartTimeRef = useRef<number>(Date.now());
  const isStoppingRef = useRef<boolean>(false);

  // Initialize camera stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;
    isStoppingRef.current = false;

    const startCamera = async () => {
      try {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              facingMode
            },
            audio: false
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }

        if (videoRef.current && isMounted) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          qrScanStartTimeRef.current = Date.now();
          setStatusBadge('SEARCHING QR');
          setStatusMessage('QR코드를 찾고 있습니다...');
        }
      } catch (err) {
        console.error('Camera stream error:', err);
        if (isMounted) {
          onCameraError('카메라 연결에 실패했습니다. 권한 허용 및 카메라 상태를 확인해주세요.');
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      isStoppingRef.current = true;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode, onCameraError]);

  // High-Speed Client QR Code Detector Loop (jsQR)
  useEffect(() => {
    let animFrameId: number;

    const scanQrFrame = () => {
      if (isStoppingRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === 4) {
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // ALWAYS DRAW NON-MIRRORED frame for QR & OCR recognition!
          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);

          // Run pure JS QR detection on image buffer
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (code && code.data) {
            const rawQr = code.data;
            const matchedKey = parseQrCodeString(rawQr);

            if (matchedKey) {
              setLastDetectedQR(rawQr);
              setStatusBadge('ITEM DETECTED (QR)');
              setStatusMessage(`✓ QR 코드 인식 성공! (${PROP_TOPICS[matchedKey].displayName})`);
              isStoppingRef.current = true;
              onPropDetected(matchedKey, 'QR');
              return;
            }
          }
        }
      }

      animFrameId = requestAnimationFrame(scanQrFrame);
    };

    animFrameId = requestAnimationFrame(scanQrFrame);
    return () => cancelAnimationFrame(animFrameId);
  }, [onPropDetected]);

  // Fallback Gemini Vision Loop if QR is not detected within ~2 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (isStoppingRef.current || analyzingGemini) return;

      const timeElapsed = Date.now() - qrScanStartTimeRef.current;
      if (timeElapsed < 2000) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== 4) return;

      setAnalyzingGemini(true);
      setStatusBadge('AI ANALYZING ITEM');
      setStatusMessage('AI가 보안 소품을 확인하고 있습니다...');

      try {
        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          const imageBase64 = canvas.toDataURL('image/jpeg', 0.85);

          const res = await fetch('/api/detect-prop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64 })
          });

          if (res.ok && !isStoppingRef.current) {
            const data = await res.json();

            if (
              data.topic && 
              data.topic !== 'unknown' && 
              PROP_TOPICS[data.topic as PropTopicKey] && 
              data.confidence >= CONFIDENCE_THRESHOLD
            ) {
              const detectedTopic = data.topic as PropTopicKey;

              if (candidateTopic === detectedTopic) {
                const newCount = consecutiveCount + 1;
                setConsecutiveCount(newCount);

                if (newCount >= REQUIRED_CONSECUTIVE_FRAMES) {
                  isStoppingRef.current = true;
                  clearInterval(interval);
                  setStatusBadge('ITEM DETECTED (AI)');
                  setStatusMessage(`✓ AI 소품 판별 성공! (${PROP_TOPICS[detectedTopic].displayName})`);
                  onPropDetected(detectedTopic, 'GEMINI_VISION');
                  return;
                }
              } else {
                setCandidateTopic(detectedTopic);
                setConsecutiveCount(1);
              }
            } else {
              setCandidateTopic(null);
              setConsecutiveCount(0);
              setStatusMessage('소품을 조금 더 가까이 보여주세요.');
              setSubMessage('판의 글자나 아이콘이 카메라 중앙 가이드에 들어오도록 조정해주세요.');
            }
          }
        }
      } catch (err) {
        console.warn('Gemini vision detection error:', err);
      } finally {
        setAnalyzingGemini(false);
      }
    }, SCAN_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [analyzingGemini, candidateTopic, consecutiveCount, onPropDetected]);

  // Toggle Front/Rear Camera
  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-4 sm:p-6 select-none relative overflow-hidden min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      
      {/* Top Banner */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="px-3.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-extrabold text-xs sm:text-sm tracking-wider uppercase flex items-center gap-1.5">
            <Scan className="w-4 h-4 animate-spin text-cyan-400" />
            <span>STEP 1</span>
          </div>
          <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
            QR코드 1순위 | Gemini Vision 2순위
          </span>
        </div>

        {/* Camera Facing Mode Toggle Button */}
        <button
          onClick={toggleFacingMode}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-xs font-bold text-slate-300 flex items-center space-x-1.5 shadow-md"
          title="카메라 전환"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>{facingMode === 'environment' ? '후면 카메라' : '전면 카메라'}</span>
        </button>
      </div>

      {/* Main Responsive Camera View */}
      <div className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border-4 border-cyan-500/50 shadow-2xl bg-black flex items-center justify-center my-auto">
        
        {/* Hidden Analysis Canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Live Video Feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`}
        />

        {/* HUD Scanner Animation Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
          
          {/* Top HUD Elements */}
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono text-cyan-400 font-bold tracking-widest">
            <div className="flex items-center space-x-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-cyan-500/30">
              <Camera className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>{facingMode.toUpperCase()} STREAM</span>
            </div>

            <div className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-cyan-500/30">
              {statusBadge}
            </div>
          </div>

          {/* Center Target Frame Box */}
          <div className="relative w-56 h-56 sm:w-80 sm:h-80 mx-auto border-2 border-dashed border-cyan-400/70 rounded-3xl flex flex-col items-center justify-center bg-cyan-500/5 backdrop-blur-[1px]">
            {/* Moving Scan Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-lg shadow-cyan-400 animate-scan-line" />

            {/* Target Corners */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-xl" />

            <div className="text-center space-y-1.5 p-3 sm:p-4 bg-slate-950/85 rounded-2xl border border-cyan-500/40 max-w-[200px] sm:max-w-xs shadow-xl">
              <QrCode className="w-6 h-6 text-cyan-300 mx-auto animate-pulse" />
              <div className="text-xs sm:text-sm font-extrabold text-white">
                보안 소품을 보여주세요
              </div>
            </div>
          </div>

          {/* Bottom HUD Feedback Bar */}
          <div className="bg-slate-950/90 border border-cyan-500/50 rounded-2xl p-3 sm:p-4 max-w-xl mx-auto w-full text-center space-y-1 shadow-2xl">
            <div className="text-sm sm:text-base font-black text-cyan-300 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>{statusMessage}</span>
            </div>
            <div className="text-[11px] sm:text-xs text-slate-300 font-semibold truncate">
              {subMessage}
            </div>
          </div>

        </div>

      </div>

      {/* Camera Privacy Disclaimer */}
      <div className="text-[11px] sm:text-xs text-slate-400 pt-2 text-center font-medium">
        * 카메라 영상은 AI 체험 진행을 위해서만 사용되며 별도로 저장되지 않습니다.
      </div>

    </div>
  );
};
