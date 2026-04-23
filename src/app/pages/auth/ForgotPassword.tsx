import React, { useState } from 'react';
import { Link } from 'react-router';
import { Loader2, Brain, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authApi } from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            Reset your<br />password
          </h1>
          <p className="text-indigo-200 text-base mb-12 max-w-xs">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="relative z-10">
          <div className="h-px bg-white/10 mb-4" />
          <p className="text-indigo-400 text-xs">© 2026 EduAI LMS · GPT-o4 Analytics Pipeline</p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900 leading-none">EduAI LMS</p>
              <p className="text-xs text-gray-500">Student Learning Portal</p>
            </div>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Forgot password?</h2>
          <p className="text-sm text-gray-500 mb-7">
            {sent ? 'Check your email for reset instructions' : 'Enter your email to receive a reset link'}
          </p>

          {sent ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">Reset link sent!</p>
                  <p className="text-sm text-emerald-600 mt-1">
                    If an account exists with <strong>{email}</strong>, you will receive a password reset email shortly.
                  </p>
                  <p className="text-sm text-emerald-600 mt-3">
                    Didn't receive it?{' '}
                    <button
                      onClick={() => setSent(false)}
                      className="font-medium underline hover:text-emerald-800"
                    >
                      Try again
                    </button>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="student@university.edu"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all border-gray-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-indigo-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            Remember your password?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
