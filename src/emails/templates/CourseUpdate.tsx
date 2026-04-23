import * as React from 'react';
import { EmailLayout, Header, Footer } from '../components/EmailLayout';
import type { CourseUpdateProps } from '../types';

const typeConfig: Record<string, { bg: string; text: string; hdr: string; badge_bg: string; label: string }> = {
  new_material: { bg: '#eff6ff', text: '#2563eb', hdr: '#dbeafe', badge_bg: '#2563eb', label: 'New Material' },
  assignment: { bg: '#fff7ed', text: '#ea580c', hdr: '#fed7aa', badge_bg: '#ea580c', label: 'Assignment' },
  quiz: { bg: '#fdf4ff', text: '#9333ea', hdr: '#e9d5ff', badge_bg: '#9333ea', label: 'Quiz' },
  live_session: { bg: '#f0fdf4', text: '#16a34a', hdr: '#bbf7d0', badge_bg: '#16a34a', label: 'Live Session' },
  grade_released: { bg: '#fff1f2', text: '#e11d48', hdr: '#fecdd3', badge_bg: '#e11d48', label: 'Grade Released' },
};

export const CourseUpdateTemplate: React.FC<CourseUpdateProps> = ({
  studentName,
  courseName,
  updateType,
  activityName,
  description,
  dueDate,
  actionUrl,
}) => {
  const cfg = typeConfig[updateType] || typeConfig.new_material;

  return (
    <EmailLayout title={`Course Update – APES UDOM`}>
      <div style={{ padding: '32px 40px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '24px', height: '24px' }}>
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', letterSpacing: '-.3px' }}>APES UDOM</span>
        </div>
        <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '.5px', background: cfg.badge_bg, color: '#fff' }}>
          {cfg.label}
        </span>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '-.3px', color: cfg.text }}>{courseName}</h1>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#64748b' }}>AI Powered E-Learning System</p>
      </div>
      <div style={{ padding: '32px 40px 40px' }}>
        <p style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: '24px 0 16px' }}>Hello {studentName},</p>
        <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.7, margin: '0 0 24px' }}>
          There&apos;s a new update in <strong>{courseName}</strong> that requires your attention.
        </p>
        <div style={{ borderRadius: '16px', padding: '28px', marginBottom: '24px', background: cfg.bg, border: `1px solid ${cfg.hdr}` }}>
          <p style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px', color: cfg.text }}>{activityName}</p>
          <p style={{ fontSize: '15px', lineHeight: 1.7, margin: '0 0 8px', color: '#475569' }}>{description}</p>
          {dueDate && (
            <p style={{ fontSize: '13px', margin: '12px 0 0', color: '#64748b' }}>📅 Due: <strong>{dueDate}</strong></p>
          )}
        </div>
        <div style={{ textAlign: 'center', margin: '28px 0 0' }}>
          <a
            href={actionUrl}
            style={{
              display: 'inline-block',
              color: '#fff',
              textDecoration: 'none',
              padding: '14px 32px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0,0,0,.15)',
              background: cfg.badge_bg,
            }}
          >
            Open in APES UDOM
          </a>
        </div>
        <hr style={{ border: 'none', height: '1px', background: 'linear-gradient(90deg,transparent,#e2e8f0,transparent)', margin: '32px 0' }} />
        <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, textAlign: 'center' }}>
          You are receiving this because you are enrolled in <strong>{courseName}</strong>.<br />
          Manage your notification preferences inside the apes udom site.
        </p>
      </div>
      <Footer showTagline={false} />
    </EmailLayout>
  );
};
