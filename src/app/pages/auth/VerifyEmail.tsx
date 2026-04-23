import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { Brain, CheckCircle, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';
import { authApi } from '../../services/api';

export default function VerifyEmail() {
  const { id, hash } = useParams<{ id: string; hash: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!id || !hash) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    authApi.verifyEmail(id, hash)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
        setTimeout(() => navigate('/login'), 3000);
      })
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setStatus('error');
        setMessage(msg ?? 'Failed to verify email. The link may be expired or invalid.');
      });
  }, [id, hash, navigate]);

  const icon = {
    loading: <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />,
    success: <CheckCircle className="w-12 h-12 text-emerald-600" />,
    error: <XCircle className="w-12 h-12 text-red-600" />,
  }[status];

  const bgColor = {
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

          {status === 'error' && (
            <div className="space-y-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
              >
                Go to Login <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-sm text-gray-400">
                Need a new verification email?{' '}
                <Link to="/login" className="text-indigo-600 hover:underline">Sign in</Link> to resend.
              </p>
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
