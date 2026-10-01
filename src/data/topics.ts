import { PropConfig, PropTopicKey } from '../types/security';

export const PROP_TOPICS: Record<PropTopicKey, PropConfig> = {
  medical_record: {
    key: "medical_record",
    displayName: "의무기록",
    icon: "📋",
    iconName: "FileText",
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
    key: "drm",
    displayName: "DRM",
    icon: "🔒",
    iconName: "Lock",
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
    key: "usb",
    displayName: "USB",
    icon: "💾",
    iconName: "Usb",
    question: "출처가 불분명한 USB를 발견했다면 어떻게 해야 할까요?",
    passCriteria: [
      "출처 불분명 USB 연결 금지",
      "승인되지 않은 USB 사용 금지",
      "정보보호 담당자에게 신고 또는 문의",
      "중요자료 무단 저장 금지"
    ],
    coreMessage: "출처를 모르는 USB는 악성코드 감염 위험이 있으므로 PC에 꽂지 말고 신고해야 합니다.",
    hint: "출처를 모르는 USB를 업무 PC에 꽂았을 때 어떤 위험이 생길지 생각해보세요.",
    failureAnswer: "출처가 불분명한 USB는 업무 PC에 연결하지 말고 정보보호 담당자에게 신고해야 합니다."
  },
  email: {
    key: "email",
    displayName: "피싱메일",
    icon: "✉️",
    iconName: "MailWarning",
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
    key: "password",
    displayName: "비밀번호",
    icon: "🔑",
    iconName: "KeyRound",
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
    key: "idcard",
    displayName: "출입증",
    icon: "🪪",
    iconName: "IdCard",
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
    key: "print",
    displayName: "출력물",
    icon: "🖨️",
    iconName: "Printer",
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
    key: "pc",
    displayName: "PC 보안",
    icon: "💻",
    iconName: "MonitorCheck",
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

export const PROP_TOPIC_KEYS = Object.keys(PROP_TOPICS) as PropTopicKey[];

// Configurable constants for camera vision detection
export const CONFIDENCE_THRESHOLD = 0.80; // Minimum confidence to accept frame candidate
export const REQUIRED_CONSECUTIVE_FRAMES = 2; // Must detect same topic twice in a row
export const SCAN_INTERVAL_MS = 1500; // Frame capture interval (1.5 seconds)
