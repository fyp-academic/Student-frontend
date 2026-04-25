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
    idle: <Mail className="w-12 h-12 text-indigo-600" />,
    loading: <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />,
    success: <CheckCircle className="w-12 h-12 text-emerald-600" />,
    error: <XCircle className="w-12 h-12 text-red-600" />,
  }[status];

  const bgColor = {
    idle: 'bg-indigo-50',
    loading: 'bg-indigo-50',
    success: 'bg-emerald-50',
    error: 'bg-red-50',
  }[status];

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -left-16 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            Email<br />verification
          </h1>
          <p className="text-indigo-200 text-base mb-12 max-w-xs">
            Enter the verification code sent to your email to activate your account.
          </p>
        </div>

        <div className="relative z-10">
          <div className="h-px bg-white/10 mb-4" />
          <p className="text-indigo-400 text-xs">© 2026 apes-udom · GPT-o4 Analytics Pipeline</p>
        </div>
      </div>

      {/* ── Right content panel ── */}
      <div className="flex-1 flex items-start sm:items-center justify-center p-6 sm:p-10 bg-gray-50">
        <div className="w-full max-w-md text-center">
          <div className={`w-20 h-20 ${bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
            {icon}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'success' ? 'Email Verified!' : 'Verify Your Email'}
          </h2>

          <p className="text-gray-500 mb-8">{message}</p>

          {status === 'success' ? (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
            >
              Continue to Login <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Verification code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm tracking-[0.5em] text-center font-mono outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <button
                onClick={handleVerify}
                disabled={status === 'loading' || !email || code.length !== 6}
                className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
                ) : (
                  'Verify Email'
                )}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1 disabled:opacity-50"
                >
                  {resending ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</>
                  ) : (
                    <><RefreshCw className="w-3.5 h-3.5" /> Resend code</>
                  )}
                </button>
                <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
                  Back to login
                </Link>
              </div>

              {resendSuccess && (
                <p className="text-sm text-emerald-600 font-medium text-center">
                  ✓ New verification code sent!
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
