import React from 'react';
import { 
  FileText, 
  ShieldAlert, 
  Lock, 
  Usb, 
  KeyRound, 
  MailWarning, 
  IdCard, 
  Printer, 
  MonitorCheck,
  Shield
} from 'lucide-react';

interface TopicIconProps {
  topic: string;
  className?: string;
}

export const TopicIcon: React.FC<TopicIconProps> = ({ topic, className = "w-6 h-6" }) => {
  switch (topic) {
    case 'medical_record':
    case '의무기록':
      return <FileText className={className} />;
    case '개인정보':
      return <ShieldAlert className={className} />;
    case 'drm':
    case 'DRM':
      return <Lock className={className} />;
    case 'usb':
    case 'USB':
      return <Usb className={className} />;
    case 'password':
    case '비밀번호':
      return <KeyRound className={className} />;
    case 'email':
    case '이메일':
    case '이메일 / 피싱메일':
      return <MailWarning className={className} />;
    case 'idcard':
    case '출입증':
      return <IdCard className={className} />;
    case 'print':
    case '출력물':
      return <Printer className={className} />;
    case 'pc':
    case 'PC 보안':
      return <MonitorCheck className={className} />;
    default:
      return <Shield className={className} />;
  }
};
