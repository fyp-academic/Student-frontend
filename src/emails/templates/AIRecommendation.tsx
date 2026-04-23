import * as React from 'react';
import { EmailLayout, Header, Footer } from '../components/EmailLayout';
import type { AIRecommendationProps } from '../types';

const tierConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  green: { bg: '#dcfce7', text: '#16a34a', dot: '🟢', label: 'On Track' },
  amber: { bg: '#fef9c3', text: '#ca8a04', dot: '🟡', label: 'Needs Attention' },
  red: { bg: '#fee2e2', text: '#dc2626', dot: '🔴', label: 'At Risk' },
  critical: { bg: '#fce7f3', text: '#be185d', dot: '🚨', label: 'Critical' },
};

const impactColors: Record<string, { bg: string; text: string }> = {
  high: { bg: '#fee2e2', text: '#dc2626' },
  medium: { bg: '#fef9c3', text: '#ca8a04' },
  low: { bg: '#dcfce7', text: '#16a34a' },
};

const profileLabels: Record<string, string> = {
  H: 'Humanitarian (H)',
  A: 'Analytical (A)',
  T: 'Theoretical (T)',
  C: 'Creative (C)',
  mixed: 'Mixed Profile',
};

export const AIRecommendationTemplate: React.FC<AIRecommendationProps> = ({
  userName,
  courseName,
  profileType,
  riskTier,
  recommendations,
  actionUrl,
}) => {
  const tier = tierConfig[riskTier] || tierConfig.amber;
  const year = new Date().getFullYear();

  return (
    <EmailLayout title="AI Insights – APES UDOM">
      <div style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', padding: '48px 40px 40px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg,#22c55e,#4f46e5,#7c3aed)' }} />
        <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid rgba(255,255,255,.3)' }}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '32px', height: '32px' }}>
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 style={{ color: '#fff', margin: '0 0 6px', fontSize: '24px', fontWeight: 700, letterSpacing: '-.3px' }}>🤖 AI Learning Insights</h1>
        <p style={{ color: 'rgba(255,255,255,.85)', margin: 0, fontSize: '14px' }}>Personalised analysis for {courseName}</p>
      </div>
      <div style={{ padding: '40px' }}>
        <p style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: '0 0 6px' }}>Hello {userName},</p>
        <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.8, margin: '0 0 24px' }}>
          Your <strong>APES UDOM</strong> AI engine has analysed your activity patterns and generated personalised recommendations to help you succeed in your learning journey.
        </p>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, marginBottom: '20px', background: tier.bg, color: tier.text }}>
          {tier.dot} Status: {tier.label}
        </span>
        <br />
        <span style={{ display: 'inline-block', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', color: '#475569', marginBottom: '24px' }}>
          🧠 Learner Profile: <strong>{profileLabels[profileType] ?? profileType}</strong>
        </span>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '0 0 14px' }}>
          📋 Your Personalised Recommendations
        </h3>
        {recommendations.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center' }}>No recommendations at this time.</p>
        ) : (
          recommendations.map((rec, idx) => {
            const impact = impactColors[rec.impact_level] ?? impactColors.medium;
            return (
              <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px', marginBottom: '14px' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', margin: '0 0 6px' }}>{rec.title}</p>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: '0 0 8px' }}>{rec.description}</p>
                <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', background: impact.bg, color: impact.text }}>
                  {rec.impact_level.toUpperCase()} IMPACT
                </span>
              </div>
            );
          })
        )}
        <div style={{ textAlign: 'center', margin: '28px 0 0' }}>
          <a
            href={actionUrl}
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
              color: '#fff',
              textDecoration: 'none',
              padding: '13px 32px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            View Full AI Insights
          </a>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '32px 0' }} />
        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7, textAlign: 'center' }}>
          These insights are generated by the <strong>APES UDOM</strong> adaptive AI engine based on your engagement patterns in <strong>{courseName}</strong>.
        </p>
      </div>
      <div style={{ background: 'linear-gradient(180deg,#f8fafc,#f1f5f9)', padding: '32px 40px', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '0 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px' }}>
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          APES UDOM
        </p>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>AI Powered E-Learning System · University of Dodoma</p>
        <div style={{ width: '40px', height: '3px', background: 'linear-gradient(90deg,#4f46e5,#7c3aed)', borderRadius: '2px', margin: '16px auto' }} />
        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '12px 0 0' }}>© {year} APES UDOM. All rights reserved.</p>
        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '12px 0 0' }}>Manage notification preferences in your profile settings.</p>
      </div>
    </EmailLayout>
  );
};
