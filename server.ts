import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Increase payload limit for camera base64 frame images
app.use(express.json({ limit: '10mb' }));

// Gemini Client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey && !apiKey.includes('MY_GEMINI_API_KEY') ? new GoogleGenAI({ apiKey }) : null;

// Topic definitions & questions
const TOPIC_STANDARDS: Record<string, {
  name: string;
  question: string;
  passCriteria: string[];
  coreMessage: string;
  hint: string;
  failureAnswer: string;
}> = {
  medical_record: {
    name: "의무기록",
    question: "의무기록을 다룰 때 조심해야 하는 점 한 가지를 말씀해주세요.",
    passCriteria: [
      "업무상 필요한 경우에만 조회",
      "호기심이나 개인적 이유로 조회하지 않음",
      "환자정보를 타인에게 함부로 전달하지 않음",
      "환자정보가 노출되지 않도록 관리",
      "화면을 켜둔 채 자리를 비우지 않음"
    ],
    coreMessage: "의무기록은 업무 목적 외 조회가 금지되며 환자 정보 노출 방지가 핵심입니다.",
    hint: "이 정보를 지금 꼭 확인해야 하는 업무상 이유가 있는지를 생각해보세요.",
    failureAnswer: "의무기록은 업무상 필요한 경우에만 조회해야 하며 호기심이나 개인적 이유로 열람해서는 안 됩니다."
  },
  drm: {
    name: "DRM",
    question: "DRM이 적용된 업무자료를 다룰 때 조심해야 하는 점 한 가지를 말씀해주세요.",
    passCriteria: [
      "DRM 임의 해제 금지",
      "업무자료 외부 무단 전송 금지",
      "개인 이메일 / 개인 클라우드 사용 금지",
      "정식 반출 절차 이용"
    ],
    coreMessage: "DRM은 무단 외부 유출 방지 장치이므로 임의 해제나 외부 전송을 하면 안 됩니다.",
    hint: "DRM 보안을 임의로 해제하거나 개인 메일, 외부 클라우드로 전송해도 되는지 생각해보세요.",
    failureAnswer: "DRM이 적용된 자료는 임의로 보안을 해제해서는 안 되며 정식 승인 절차 없이 외부로 전송해서는 안 됩니다."
  },
  usb: {
    name: "USB",
    question: "출처가 불분명한 USB를 발견했다면 어떻게 해야 할까요?",
    passCriteria: [
      "출처 불분명 USB 연결 금지",
      "승인되지 않은 USB 사용 금지",
      "정보보호 담당자에게 신고 또는 문의",
      "중요자료 무단 저장 금지"
    ],
    coreMessage: "출처를 모르는 USB는 바이러스/악성코드 감염 위험이 있으므로 연결하지 말고 신고해야 합니다.",
    hint: "출처를 모르는 USB를 업무 PC에 꽂았을 때 어떤 위험이 생길지 생각해보세요.",
    failureAnswer: "출처가 불분명한 USB는 업무 PC에 연결하지 말고 정보보호 담당자에게 신고해야 합니다."
  },
  email: {
    name: "피싱메일",
    question: "의심스러운 이메일이나 링크를 받았다면 어떻게 해야 할까요?",
    passCriteria: [
      "의심스러운 링크 클릭 금지",
      "첨부파일 실행 금지",
      "발신자 확인",
      "정보보호 담당부서 신고",
      "계정정보 입력 금지"
    ],
    coreMessage: "출처가 의심되는 메일의 링크나 첨부파일은 클릭하지 말고 즉시 신고해야 합니다.",
    hint: "모르는 발신자가 보낸 링크나 첨부파일을 실행하는 것에 대해 생각해보세요.",
    failureAnswer: "수상한 이메일의 링크나 첨부파일은 절대 클릭하지 말고 정보보호 담당부서로 신고해야 합니다."
  },
  password: {
    name: "비밀번호",
    question: "비밀번호를 안전하게 관리하는 방법 한 가지를 말씀해주세요.",
    passCriteria: [
      "타인과 공유하지 않음",
      "쉽게 추측 가능한 비밀번호 사용 금지",
      "동일 비밀번호 반복 사용 금지",
      "비밀번호 노출 금지 (모니터 부착 등 금지)"
    ],
    coreMessage: "비밀번호는 본인만 알고 있어야 하며 모니터 부착이나 타인 공유를 금지해야 합니다.",
    hint: "비밀번호를 다른 사람에게 알려주거나 모니터 옆 포스트잇에 적어두는 것에 대해 생각해보세요.",
    failureAnswer: "비밀번호는 본인만 알고 있어야 하며 타인과 공유하거나 모니터에 적어두어서는 안 됩니다."
  },
  idcard: {
    name: "출입증",
    question: "출입증을 사용할 때 지켜야 하는 보안수칙 한 가지를 말씀해주세요.",
    passCriteria: [
      "타인에게 빌려주지 않음",
      "분실 즉시 신고",
      "권한 없는 사람 동반 출입 금지"
    ],
    coreMessage: "출입증은 개인 전용 보안수단이므로 빌려주거나 미인가자 동반 출입을 시켜서는 안 됩니다.",
    hint: "동료에게 출입증을 빌려주거나 권한 없는 사람을 따라 들어오게 해도 되는지 생각해보세요.",
    failureAnswer: "출입증은 타인에게 빌려주지 않아야 하며 권한 없는 외부인을 함께 출입시켜서는 안 됩니다."
  },
  print: {
    name: "출력물",
    question: "개인정보가 포함된 출력물을 어떻게 관리해야 할까요?",
    passCriteria: [
      "개인정보 출력물 방치 금지",
      "안전하게 파기 (세쇄기/파쇄함)",
      "일반 쓰레기통 폐기 금지",
      "타인이 볼 수 있는 곳에 두지 않음"
    ],
    coreMessage: "개인정보 출력물은 프린터 방치 금지 및 세쇄기를 통한 즉시 파기가 필수적입니다.",
    hint: "프린터에 인쇄물을 그냥 두거나 일반 쓰레기통에 개인정보 서류를 버려도 되는지 생각해보세요.",
    failureAnswer: "개인정보가 포함된 출력물은 방치하지 말고 사용 후 반드시 세쇄기에 안전하게 파기해야 합니다."
  },
  pc: {
    name: "PC 보안",
    question: "업무 중 자리를 비울 때 PC에서 해야 하는 행동은 무엇일까요?",
    passCriteria: [
      "화면 잠금 (Win + L)",
      "로그아웃",
      "업무화면 노출 방지"
    ],
    coreMessage: "잠시 자리를 비울 때도 화면 잠금(Win+L) 또는 로그아웃을 하여 화면 노출을 막아야 합니다.",
    hint: "자리를 비울 때 PC 화면 단축키(Win + L)로 무엇을 해야 할지 생각해보세요.",
    failureAnswer: "자리를 비울 때는 타인이 업무화면을 볼 수 없도록 반드시 화면 잠금(Win+L)을 해야 합니다."
  }
};

// 1. Camera Frame Vision Prop Detection Endpoint
app.post('/api/detect-prop', async (req, res) => {
  const { imageBase64 } = req.body;

  if (!imageBase64) {
    return res.json({
      topic: 'unknown',
      displayName: '',
      confidence: 0
    });
  }

  // Clean base64 string
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  try {
    if (ai) {
      const visionPrompt = `
당신은 병원 정보보호주간 행사의 카메라 이미지 분석 AI입니다.
참가자가 카메라에 들고 보여주는 "행사 소품 판"을 분석하세요.

[판에 인쇄된 8가지 보안 주제 아이콘 및 텍스트]:
1. medical_record (의무기록 / 📋 / medical_record / 의무기록차트)
2. drm (DRM / 🔒 / drm)
3. usb (USB / 💾 / usb)
4. email (피싱메일 / 이메일 / ✉️ / email)
5. password (비밀번호 / 🔑 / password)
6. idcard (출입증 / 🪪 / 사원증 / idcard)
7. print (출력물 / 🖨️ / print)
8. pc (PC 보안 / 💻 / pc)

[판정 지침]:
- 판에 적힌 큰 한글 글자(예: "의무기록", "USB", "DRM", "피싱메일", "비밀번호", "출입증", "출력물", "PC 보안") 또는 아이콘을 확인하세요.
- 확실한 소품 판이 보이고 주제를 분명히 알 수 있는 경우 해당 주제 코드("medical_record", "drm", "usb", "email", "password", "idcard", "print", "pc")를 반환하세요.
- 사람이 소품 판을 들고 있지 않거나, 손만 보이고 판이 안 보이거나, 글자를 읽을 수 없거나, 이미지 흐림/확신할 수 없는 경우는 절대로 임의 추측하지 말고 "unknown"을 반환하세요.

[JSON 반환 형식]:
{
  "topic": "medical_record" | "drm" | "usb" | "email" | "password" | "idcard" | "print" | "pc" | "unknown",
  "displayName": "의무기록" | "DRM" | "USB" | "피싱메일" | "비밀번호" | "출입증" | "출력물" | "PC 보안" | "",
  "confidence": 0.0 ~ 1.0 사이의 확신도 숫자로 표기
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: visionPrompt
          }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '';
      try {
        const jsonRes = JSON.parse(responseText.trim());
        if (jsonRes && jsonRes.topic) {
          return res.json(jsonRes);
        }
      } catch (pErr) {
        console.warn('Vision detection JSON parse error:', pErr);
      }
    }
  } catch (err) {
    console.error('Vision detection API call failed:', err);
  }

  // Fallback default
  return res.json({
    topic: 'unknown',
    displayName: '',
    confidence: 0
  });
});

// 2. Evaluate Spoken Answer Endpoint
app.post('/api/evaluate-answer', async (req, res) => {
  const { topicKey, userAnswer, retryCount = 0 } = req.body;

  const topicConfig = TOPIC_STANDARDS[topicKey] || TOPIC_STANDARDS['medical_record'];

  if (!userAnswer || userAnswer.trim() === '') {
    return res.json({
      status: 'RETRY',
      message: '잘 듣지 못했어요. 조금 더 크게 다시 말씀해주세요!',
      isAudioError: true
    });
  }

  try {
    if (ai) {
      const evalPrompt = `
당신은 병원 정보보호주간 행사 AI 평가자입니다.

[보안 주제]: ${topicConfig.name}
[질문]: ${topicConfig.question}
[참가자의 음성 답변]: "${userAnswer}"
[시도 횟수]: ${retryCount === 0 ? "첫 번째 답변" : "두 번째(최종) 답변"}

[평가 지침 - 의미 기반 판단]:
- 정확한 문장이 아니더라도 답변에 핵심 수칙의 '의미'가 올바르게 포함되어 있다면 PASS 처리하세요.
- 예: "제 환자도 아닌데 궁금하다고 열어보면 안 돼요" -> "업무 목적 외 조회 금지" 의미이므로 PASS!
- 단, 실제로 위험한 행동을 안전하다고 답한 경우는 오답으로 처리하세요.

결과는 다음 세 가지 중 하나로 판정하세요:
- PASS: 첫 번째 또는 두 번째 답변에서 올바른 정보보호 수칙 의미를 말한 경우
- RETRY: 첫 번째 답변이 틀렸거나 의미가 너무 모호한 경우 (힌트 제공)
- FAIL: 두 번째 답변도 틀린 경우 (정답 수칙 설명)

[정답 수칙 기준]:
- 핵심 의미: ${topicConfig.coreMessage}
- 인정 예시: ${topicConfig.passCriteria.join(', ')}

[JSON 응답 형식]:
{
  "status": "PASS" | "RETRY" | "FAIL",
  "message": "참가자에게 안내할 친절하고 확실한 한국어 응답 문장",
  "hint": "RETRY 판정 시 전달할 1문장 힌트",
  "correctAnswerExplanation": "FAIL 판정 시 알려줄 정답 수칙 1문장"
}
`;

      const evalResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: evalPrompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = evalResponse.text || '';
      try {
        const jsonEval = JSON.parse(responseText.trim());
        if (jsonEval && jsonEval.status) {
          return res.json(jsonEval);
        }
      } catch (pErr) {
        console.warn('Answer eval JSON parse error:', pErr);
      }
    }
  } catch (err) {
    console.error('Answer eval API call failed:', err);
  }

  // Smart local fallback evaluation
  const localRes = evaluateLocalAnswer(topicKey, topicConfig, userAnswer, retryCount);
  return res.json(localRes);
});

function evaluateLocalAnswer(
  topicKey: string, 
  topicConfig: typeof TOPIC_STANDARDS[string], 
  userAnswer: string, 
  retryCount: number
) {
  const norm = userAnswer.toLowerCase().replace(/\s+/g, '');
  const dangerousKeywords = ['상관없다', '괜찮다', '아무나', '빌려준', '공유한', '해제', '방치', '버린', '클릭', '해제해도'];
  const isDangerous = dangerousKeywords.some(k => norm.includes(k) && (norm.includes('해도') || norm.includes('괜찮')));

  const keyConcepts = topicConfig.passCriteria.map(c => c.replace(/\s+/g, ''));
  const hasKeyword = keyConcepts.some(kc => norm.includes(kc.substring(0, 4)) || norm.includes('필요') || norm.includes('잠금') || norm.includes('신고') || norm.includes('파기') || norm.includes('금지') || norm.includes('안함'));

  if (isDangerous) {
    if (retryCount === 0) {
      return {
        status: 'RETRY',
        message: '❌ 아쉽습니다! 힌트를 드릴게요.',
        hint: topicConfig.hint
      };
    } else {
      return {
        status: 'FAIL',
        message: '💡 이번에는 아쉽네요!',
        correctAnswerExplanation: topicConfig.failureAnswer
      };
    }
  }

  if (hasKeyword || norm.length >= 4) {
    return {
      status: 'PASS',
      message: '🎉 정답입니다! 정보보호 수칙을 정확하게 알고 계시네요.'
    };
  }

  if (retryCount === 0) {
    return {
      status: 'RETRY',
      message: '❌ 아쉽습니다! 힌트를 드릴게요.',
      hint: topicConfig.hint
    };
  } else {
    return {
      status: 'FAIL',
      message: '💡 이번에는 아쉽네요!',
      correctAnswerExplanation: topicConfig.failureAnswer
    };
  }
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
