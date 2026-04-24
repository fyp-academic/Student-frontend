import * as React from 'react';
import { EmailLayout, Header, Footer, Button } from '../components/EmailLayout';
import type { PasswordResetProps } from '../types';

export const PasswordResetTemplate: React.FC<PasswordResetProps> = ({
  userName,
  resetUrl,
  expiresIn,
}) => {
  return (
    <EmailLayout title="Reset your password – apes udom">
      <Header subtitle="AI Powered E-Learning System" />
      <div style={{ padding: '48px 40px' }}>
        <p style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          Hello, {userName} <span style={{ fontSize: '28px' }}>🔐</span>
        </p>
        <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.8, margin: '0 0 28px' }}>
          We received a request to reset the password for your <strong style={{ color: '#4f46e5', fontWeight: 600 }}>APES UDOM</strong> account. Click the button below to create a new password.
        </p>
        <Button href={resetUrl}>Reset Password</Button>
        <div style={{ background: 'linear-gradient(135deg,#fee2e2,#fecaca)', borderLeft: '4px solid #ef4444', padding: '16px 20px', borderRadius: '0 12px 12px 0', margin: '24px 0' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#991b1b', fontWeight: 500 }}>
            ⏰ This password reset link will expire in <strong>{expiresIn}</strong>. If you don't reset your password within this time, you'll need to request a new link.
          </p>
        </div>
        <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.8, margin: '0 0 28px' }}>
          If you did not request a password reset, please ignore this email or contact support if you have concerns. No changes will be made to your account.
        </p>
        <hr style={{ border: 'none', height: '1px', background: 'linear-gradient(90deg,transparent,#e2e8f0,transparent)', margin: '36px 0' }} />
        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7, margin: '0 0 12px' }}>Having trouble with the button? Copy and paste this URL into your browser:</p>
        <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '10px', padding: '16px', fontSize: '13px', color: '#475569', wordBreak: 'break-all', fontFamily: "'SF Mono',Monaco,monospace", lineHeight: 1.6 }}>
          {resetUrl}
        </div>
      </div>
      <Footer />
    </EmailLayout>
  );
};
