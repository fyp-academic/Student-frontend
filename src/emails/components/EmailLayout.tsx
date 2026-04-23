import * as React from 'react';

interface EmailLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({ children, title }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <title>{title}</title>
      </head>
      <body style={{ margin: 0, padding: 0, background: 'linear-gradient(135deg,#f1f5f9,#e0e7ff)', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif", minHeight: '100vh' }}>
        <div style={{ padding: '40px 20px' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,.12)' }}>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
};

interface HeaderProps {
  subtitle?: string;
  showLogo?: boolean;
  gradient?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ subtitle, showLogo = true, gradient = true }) => {
  const headerStyle: React.CSSProperties = gradient
    ? { background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', padding: '48px 40px 40px', textAlign: 'center', position: 'relative' }
    : { padding: '32px 40px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' };

  return (
    <div style={headerStyle}>
      {gradient && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg,#22c55e,#4f46e5,#7c3aed)' }} />
      )}
      {showLogo && (
        <div style={{ width: '64px', height: '64px', background: gradient ? 'rgba(255,255,255,.15)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)', backdropFilter: gradient ? 'blur(10px)' : undefined, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: gradient ? '2px solid rgba(255,255,255,.3)' : undefined }}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '36px', height: '36px' }}>
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
      <h1 style={{ color: gradient ? '#fff' : '#1e293b', margin: 0, fontSize: '26px', fontWeight: 800, letterSpacing: '-.5px', textTransform: 'uppercase' }}>APES UDOM</h1>
      {subtitle && <p style={{ color: gradient ? 'rgba(255,255,255,.85)' : '#64748b', margin: '8px 0 0', fontSize: '14px', fontWeight: 500, letterSpacing: '.3px' }}>{subtitle}</p>}
    </div>
  );
};

interface FooterProps {
  showTagline?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ showTagline = true }) => {
  const year = new Date().getFullYear();

  return (
    <div style={{ background: 'linear-gradient(180deg,#f8fafc,#f1f5f9)', padding: '32px 40px', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
      <p style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '0 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px' }}>
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        APES UDOM
      </p>
      {showTagline && <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>AI Powered E-Learning System · University of Dodoma</p>}
      <div style={{ width: '40px', height: '3px', background: 'linear-gradient(90deg,#4f46e5,#7c3aed)', borderRadius: '2px', margin: '16px auto' }} />
      <p style={{ fontSize: '12px', color: '#94a3b8', margin: '12px 0 0' }}>© {year} APES UDOM. All rights reserved.</p>
      <p style={{ fontSize: '12px', color: '#94a3b8', margin: '12px 0 0' }}>This is an automated message. Please do not reply to this email.</p>
    </div>
  );
};

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  color?: string;
}

export const Button: React.FC<ButtonProps> = ({ href, children, color = 'linear-gradient(135deg,#4f46e5,#7c3aed)' }) => {
  return (
    <div style={{ textAlign: 'center', margin: '32px 0' }}>
      <a
        href={href}
        style={{
          display: 'inline-block',
          background: color,
          color: '#fff',
          textDecoration: 'none',
          padding: '16px 40px',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: 700,
          letterSpacing: '.5px',
          boxShadow: '0 4px 16px rgba(79,70,229,.35)',
        }}
      >
        {children}
      </a>
    </div>
  );
};
