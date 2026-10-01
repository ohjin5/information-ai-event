export type PropTopicKey = 
  | 'medical_record'
  | 'drm'
  | 'usb'
  | 'email'
  | 'password'
  | 'idcard'
  | 'print'
  | 'pc';

export interface PropConfig {
  key: PropTopicKey;
  displayName: string;
  qrCodeString: string; // e.g. "SECURITY_ITEM:medical_record"
  icon: string;
  iconName: string;
  question: string;
  passCriteria: string[];
  coreMessage: string;
  hint: string;
  failureAnswer: string;
}

export type DetectionSource = 'QR' | 'GEMINI_VISION' | 'OPERATOR_SIMULATOR';

export type AppPhase = 
  | 'IDLE'            // Initial standby screen
  | 'SCANNING'        // Webcam active, searching QR code first, then fallback to Gemini Vision
  | 'RECOGNIZED'      // Item detected (QR or Gemini Vision): "✓ DETECTED - USB"
  | 'QUESTIONING'     // AI speaking question TTS
  | 'LISTENING'       // Microphone listening to participant's spoken answer
  | 'EVALUATING'      // AI checking user's answer
  | 'RESULT_PASS'     // Full screen PASS success celebration
  | 'RESULT_RETRY'    // Retry 1st attempt wrong hint
  | 'RESULT_FAIL';    // Fail 2nd attempt wrong explanation

export interface PropDetectionResult {
  topic: PropTopicKey | 'unknown';
  displayName: string;
  confidence: number;
}

export interface AnswerEvalResult {
  status: 'PASS' | 'RETRY' | 'FAIL';
  message: string;
  hint?: string;
  correctAnswerExplanation?: string;
  isAudioError?: boolean;
}
