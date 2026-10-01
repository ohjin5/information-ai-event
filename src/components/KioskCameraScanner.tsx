import React, { useRef, useEffect, useState } from 'react';
import { PropTopicKey, PropDetectionResult } from '../types/security';
import { PROP_TOPICS, CONFIDENCE_THRESHOLD, REQUIRED_CONSECUTIVE_FRAMES, SCAN_INTERVAL_MS } from '../data/topics';
import { Camera, Scan, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface KioskCameraScannerProps {
  onPropDetected: (topicKey: PropTopicKey) => void;
  onCameraError: (err: string) => void;
  ttsEnabled: boolean;
  onSpeakNotice: (msg: string) => void;
}

export const KioskCameraScanner: React.FC<KioskCameraScannerProps> = ({
  onPropDetected,
  onCameraError,
  onSpeakNotice
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [candidateTopic, setCandidateTopic] = useState<PropTopicKey | null>(null);
  const [consecutiveCount, setConsecutiveCount] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('카메라 연결 중...');
  const [subMessage, setSubMessage] = useState<string>('소품 판을 카메라 중앙 가이드라인 안에 보여주세요');

  // Camera initialization
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    const startWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: 'user'
          },
          audio: false
        });

        if (videoRef.current && isMounted) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStatusMessage('소품을 인식하고 있습니다');
          setSubMessage('판의 글자가 보이도록 카메라 중앙에 조금 더 가까이 보여주세요.');
        }
      } catch (err) {
        console.error('Webcam stream error:', err);
        if (isMounted) {
          onCameraError('카메라를 찾을 수 없거나 권한이 차단되었습니다. 웹캠을 연결해주세요.');
        }
      }
    };

    startWebcam();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onCameraError]);

  // Frame Capture & Vision API Analysis Interval
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || analyzing) return;

      const video = videoRef.current;
      if (video.readyState !== 4) return;

      setAnalyzing(true);

      try {
        // Draw non-mirrored frame to hidden canvas for Gemini
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageBase64 = canvas.toDataURL('image/jpeg', 0.85);

          const res = await fetch('/api/detect-prop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64 })
          });

          if (res.ok) {
            const data: PropDetectionResult = await res.json();

            if (
              data.topic && 
              data.topic !== 'unknown' && 
              PROP_TOPICS[data.topic] && 
              data.confidence >= CONFIDENCE_THRESHOLD
            ) {
              const detectedTopic = data.topic as PropTopicKey;

              if (candidateTopic === detectedTopic) {
                const newCount = consecutiveCount + 1;
                setConsecutiveCount(newCount);

                if (newCount >= REQUIRED_CONSECUTIVE_FRAMES) {
                  // Final Confirmation!
                  clearInterval(interval);
                  onPropDetected(detectedTopic);
                  return;
                }
              } else {
                setCandidateTopic(detectedTopic);
                setConsecutiveCount(1);
              }
            } else {
              // Unknown / Low confidence
              setCandidateTopic(null);
              setConsecutiveCount(0);
              setStatusMessage('소품을 인식하고 있습니다');
              setSubMessage('판의 글자가 보이도록 카메라 중앙에 조금 더 가까이 보여주세요.');
            }
          }
        }
      } catch (err) {
        console.warn('Frame detection loop error:', err);
      } finally {
        setAnalyzing(false);
      }
    }, SCAN_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [analyzing, candidateTopic, consecutiveCount, onPropDetected]);

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-6 select-none relative overflow-hidden">
      
      {/* Top Banner Step 1 */}
      <div className="text-center space-y-1 mb-4">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-extrabold text-sm tracking-wider uppercase">
          <Scan className="w-4 h-4 animate-spin" />
          <span>STEP 1</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          "보안 소품을 카메라에 보여주세요"
        </h2>
      </div>

      {/* Main 16:9 Camera Container (occupies 65-75% height) */}
      <div className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border-4 border-cyan-500/50 shadow-2xl bg-black flex items-center justify-center">
        
        {/* Hidden Canvas for Frame Capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Live Mirrored Video Feed for User Mirror View */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="w-full h-full object-cover transform scale-x-[-1]"
        />

        {/* HUD Scanner Animation Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
          
          {/* Top HUD Elements */}
          <div className="flex items-center justify-between text-xs font-mono text-cyan-400 font-bold tracking-widest">
            <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-cyan-500/30">
              <Camera className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>LIVE WEBCAM FEED</span>
            </div>

            <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-cyan-500/30">
              {analyzing ? 'AI ANALYZING FRAME...' : 'OBJECT DETECTION ACTIVE'}
            </div>
          </div>

          {/* Center Target Frame Box */}
          <div className="relative w-72 h-72 sm:w-96 sm:h-96 mx-auto border-2 border-dashed border-cyan-400/60 rounded-3xl flex flex-col items-center justify-center bg-cyan-500/5 backdrop-blur-[2px]">
            {/* Moving Scan Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-lg shadow-cyan-400 animate-scan-line" />

            {/* Target Corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-2xl" />

            <div className="text-center space-y-2 p-4 bg-slate-950/80 rounded-2xl border border-cyan-500/30 max-w-xs">
              <Sparkles className="w-6 h-6 text-cyan-300 mx-auto animate-pulse" />
              <div className="text-sm font-extrabold text-white">
                소품 판을 이곳에 맞춰주세요
              </div>
            </div>
          </div>

          {/* Bottom HUD Feedback Bar */}
          <div className="bg-slate-950/90 border border-cyan-500/40 rounded-2xl p-4 max-w-xl mx-auto w-full text-center space-y-1">
            <div className="text-base sm:text-lg font-black text-cyan-300 flex items-center justify-center gap-2">
              <span>🤔 {statusMessage}</span>
            </div>
            <div className="text-xs text-slate-300 font-semibold">
              {subMessage}
            </div>
          </div>

        </div>

      </div>

      {/* Camera Disclaimer */}
      <div className="text-xs text-slate-400 pt-3 text-center">
        * 카메라 영상은 AI 체험 진행 용도로만 사용되며 별도로 저장되지 않습니다.
      </div>

    </div>
  );
};
