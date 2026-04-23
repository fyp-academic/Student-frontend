import * as React from 'react';
import { EmailLayout, Header, Footer, Button } from '../components/EmailLayout';
import type { EmailVerificationProps } from '../types';

export const EmailVerificationTemplate: React.FC<EmailVerificationProps> = ({
  userName,
  verificationUrl,
  expiresIn,
}) => {
  return (
    <EmailLayout title="Verify your email – APES UDOM">
      <Header subtitle="AI Powered E-Learning System" />
      <div style={{ padding: '48px 40px' }}>
        <p style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          Hello, {userName} <span style={{ fontSize: '28px' }}>👋</span>
        </p>
        <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.8, margin: '0 0 28px' }}>
          Welcome to <strong style={{ color: '#4f46e5', fontWeight: 600 }}>APES UDOM</strong>! Thank you for registering on our platform. To activate your account and unlock full access to all learning resources, please verify your email address by clicking the button below.
        </p>
        <Button href={verificationUrl}>Verify Email Address</Button>
        <div style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)', borderLeft: '4px solid #f59e0b', padding: '16px 20px', borderRadius: '0 12px 12px 0', margin: '24px 0' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#92400e', fontWeight: 500 }}>
            ⏰ This verification link will expire in <strong>{expiresIn}</strong>. Please verify promptly to secure your account.
          </p>
        </div>
        <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.8, margin: '0 0 28px' }}>
          If you did not create this account, you can safely ignore this email. No further action is required.
        </p>
        <hr style={{ border: 'none', height: '1px', background: 'linear-gradient(90deg,transparent,#e2e8f0,transparent)', margin: '36px 0' }} />
        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7, margin: '0 0 12px' }}>Having trouble with the button? Copy and paste this URL into your browser:</p>
        <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '10px', padding: '16px', fontSize: '13px', color: '#475569', wordBreak: 'break-all', fontFamily: "'SF Mono',Monaco,monospace", lineHeight: 1.6 }}>
          {verificationUrl}
        </div>
      </div>
      <Footer />
    </EmailLayout>
  );
};
