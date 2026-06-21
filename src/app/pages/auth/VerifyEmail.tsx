import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router';
import { Mail, CheckCircle, XCircle, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import { authApi } from '../../services/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('Enter the 6-digit code sent to your email.');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleVerify = async () => {
    if (!email || code.length !== 6) {
      setStatus('error');
      setMessage('Please enter a valid email and 6-digit code.');
      return;
    }
    setStatus('loading');
    try {
      const res = await authApi.verifyEmailCode(email, code);
      setStatus('success');
      setMessage(res.data?.message || 'Your email has been verified successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; expired?: boolean } } })?.response?.data;
      setStatus('error');
      setMessage(data?.message || 'Invalid or expired verification code.');
    }
  };

  const handleResend = async () => {
    if (!email) {
      setMessage('Please enter your email to resend the code.');
      return;
    }
    setResending(true);
    setResendSuccess(false);
    try {
      const res = await authApi.resendVerification(email);
      setResendSuccess(true);
      setMessage(res.data?.message || 'Verification code resent! Check your inbox.');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setMessage(data?.message || 'Failed to resend verification code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const icon = {
    idle: <Mail className="w-9 h-9 text-clay" />,
    loading: <Loader2 className="w-9 h-9 text-clay animate-spin" />,
    success: <CheckCircle className="w-9 h-9 text-emerald-600" />,
    error: <XCircle className="w-9 h-9 text-red-600" />,
  }[status];

  const bgColor = {
    idle: 'bg-paper-2',
    loading: 'bg-paper-2',
    success: 'bg-emerald-100',
    error: 'bg-red-50',
  }[status];

  const fieldCls =
    'w-full px-4 py-3 rounded-md border text-step-2 text-ink outline-none transition-all placeholder:text-ink-2/60 border-line bg-paper focus:border-clay focus:ring-1 focus:ring-clay';

  return (
    <>
      <div className={`w-16 h-16 ${bgColor} rounded-full flex items-center justify-center mb-6`}>
        {icon}
      </div>

      <p className="eyebrow mb-4">Email verification</p>
      <h1 className="font-display ed-display text-step-6 text-ink mb-2">
        {status === 'success' ? 'Email verified!' : 'Verify your email'}
      </h1>
      <p className="text-step-2 text-ink-2 mb-7">{message}</p>

      {status === 'success' ? (
        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-ink hover:bg-clay-deep text-paper font-semibold text-step-2 transition-colors duration-300"
        >
          Continue to login <ArrowRight className="w-4 h-4" />
        </Link>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="block text-step-1 font-medium text-ink-2 mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={fieldCls}
            />
          </div>

          <div>
            <label className="block text-step-1 font-medium text-ink-2 mb-1.5">Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className={`${fieldCls} tracking-[0.5em] text-center font-mono`}
            />
          </div>

          <button
            onClick={handleVerify}
            disabled={status === 'loading' || !email || code.length !== 6}
            className="w-full py-3.5 rounded-full bg-ink hover:bg-clay-deep text-paper font-semibold text-step-2 transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
            ) : (
              'Verify Email'
            )}
          </button>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-step-1 text-clay hover:text-clay-deep font-semibold inline-flex items-center gap-1 disabled:opacity-50"
            >
              {resending ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</>
              ) : (
                <><RefreshCw className="w-3.5 h-3.5" /> Resend code</>
              )}
            </button>
            <Link to="/login" className="text-step-1 text-ink-2 hover:text-clay transition-colors">
              Back to login
            </Link>
          </div>

          {resendSuccess && (
            <p className="text-step-1 text-emerald-700 font-medium text-center">
              ✓ New verification code sent!
            </p>
          )}
        </div>
      )}
    </>
  );
}
