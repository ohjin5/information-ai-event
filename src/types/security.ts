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
  icon: string;
  iconName: string;
  question: string;
  passCriteria: string[];
  coreMessage: string;
  hint: string;
  failureAnswer: string;
}

export type AppPhase = 
  | 'IDLE'            // Initial standby screen
  | 'SCANNING'        // Webcam active, AI scanning for prop board
  | 'RECOGNIZED'      // Board detected: "✓ DETECTED - 의무기록"
  | 'QUESTIONING'     // AI speaking the question
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
