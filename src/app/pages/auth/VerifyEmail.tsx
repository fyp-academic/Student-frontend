import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router';
import { Brain, CheckCircle, XCircle, Loader2, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { authApi } from '../../services/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'info'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const id = searchParams.get('id');
    const hash = searchParams.get('hash');
    const signature = searchParams.get('signature');
    const expires = searchParams.get('expires');
    const statusParam = searchParams.get('status');
    const messageParam = searchParams.get('message');
    const emailParam = searchParams.get('email');

    if (emailParam) {
      setUserEmail(emailParam);
    }

    // Handle backend redirect with error/info message
    if (statusParam === 'error') {
      setStatus('error');
      setMessage(messageParam || 'Verification failed. The link may be expired or invalid.');
      return;
    }

    if (statusParam === 'info') {
      setStatus('info');
      setMessage(messageParam || 'Email already verified.');
      return;
    }

    // Validate required parameters
    if (!id || !hash || !signature || !expires) {
      setStatus('error');
      setMessage('Invalid verification link. Missing required parameters.');
      return;
    }

    // Confirm verification via POST (secure, no GET for sensitive actions)
    authApi.verifyEmailConfirm({ id, hash, signature, expires })
      .then((response) => {
        setStatus('success');
        setMessage(response.data?.message || 'Your email has been verified successfully!');
        setTimeout(() => navigate('/login'), 3000);
      })
      .catch((err: unknown) => {
        const data = (err as { response?: { data?: { message?: string } } })?.response?.data;
        const msg = data?.message || 'Failed to verify email. The link may be expired or invalid.';
        setStatus('error');
        setMessage(msg);
      });
  }, [searchParams, navigate]);

  const handleResend = async () => {
    if (!userEmail) {
      setMessage('Please enter your email to resend verification.');
      return;
    }
    setResending(true);
    setResendSuccess(false);
    try {
      await authApi.resendVerification(userEmail);
      setResendSuccess(true);
      setMessage('Verification email resent! Check your inbox.');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setMessage(data?.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const icon = {
    loading: <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />,
    success: <CheckCircle className="w-12 h-12 text-emerald-600" />,
    error: <XCircle className="w-12 h-12 text-red-600" />,
    info: <CheckCircle className="w-12 h-12 text-blue-600" />,
  }[status];

  const bgColor = {
    loading: 'bg-indigo-50',
    success: 'bg-emerald-50',
    error: 'bg-red-50',
    info: 'bg-blue-50',
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
          <div className="flex items-center gap-3 mb-14">
            <div className="w-11 h-11 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold leading-none">EduAI LMS</p>
              <p className="text-indigo-300 text-xs mt-0.5">Student Learning Portal</p>
            </div>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            Email<br />verification
          </h1>
          <p className="text-indigo-200 text-base mb-12 max-w-xs">
            Verify your email address to access all features of your learning portal.
          </p>
        </div>

        <div className="relative z-10">
          <div className="h-px bg-white/10 mb-4" />
          <p className="text-indigo-400 text-xs">© 2026 EduAI LMS · GPT-o4 Analytics Pipeline</p>
        </div>
      </div>

      {/* ── Right content panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-gray-50">
        <div className="w-full max-w-md text-center">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-base font-bold text-gray-900 leading-none">EduAI LMS</p>
              <p className="text-xs text-gray-500">Student Learning Portal</p>
            </div>
          </div>

          <div className={`w-20 h-20 ${bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
            {icon}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'loading' && 'Verifying...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
            {status === 'info' && 'Already Verified'}
          </h2>

          <p className="text-gray-500 mb-8">{message}</p>

          {status === 'success' && (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
            >
              Continue to Login <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {status === 'info' && (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
            >
              Continue to Login <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              {/* Email input for resend */}
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    onClick={handleResend}
                    disabled={resending || !userEmail}
                    className="px-4 py-2 rounded-xl bg-indigo-100 text-indigo-700 font-medium text-sm hover:bg-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    {resending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                    ) : (
                      <><RefreshCw className="w-4 h-4" /> Resend</>
                    )}
                  </button>
                </div>
              </div>

              {resendSuccess && (
                <p className="text-sm text-emerald-600 font-medium">
                  ✓ Verification email sent! Check your inbox.
                </p>
              )}

              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
              >
                Go to Login <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {status === 'loading' && (
            <p className="text-sm text-gray-400">Please wait while we verify your email...</p>
          )}
        </div>
      </div>
    </div>
  );
}
