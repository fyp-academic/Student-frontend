import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, Loader2, Brain, BookOpen, Target, Zap, Award, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';

function validate(email: string, password: string) {
  const e: Record<string, string> = {};
  if (!email.trim()) e.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address';
  if (!password) e.password = 'Password is required';
  else if (password.length < 6) e.password = 'Password must be at least 6 characters';
  return e;
}

const FEATURES = [
  { icon: BookOpen, label: 'Access courses & interactive lessons' },
  { icon: Target,    label: 'Track progress with AI insights' },
  { icon: Zap,       label: 'Practice with AI-powered quizzes' },
  { icon: Award,     label: 'Earn certificates & achievements' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [wrongRole, setWrongRole] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const INSTRUCTOR_URL = import.meta.env.VITE_INSTRUCTOR_URL ?? 'http://localhost:5174';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(email, password);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setApiError('');
    setWrongRole(false);
    setNeedsVerification(false);
    setResendSuccess(false);
    setLoading(true);
    try {
      await login(email, password);
      const stored = localStorage.getItem('auth_user');
      const user   = stored ? JSON.parse(stored) : null;
      const role   = String(user?.role ?? '');
      if (role === 'instructor' || role === 'admin') {
        setWrongRole(true);
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; requires_verification?: boolean; email?: string } } })?.response?.data;
      if (data?.requires_verification) {
        setNeedsVerification(true);
        setUnverifiedEmail(data?.email ?? email);
      } else {
        setApiError(data?.message ?? 'Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    setResendSuccess(false);
    try {
      await authApi.resendVerification(unverifiedEmail);
      setResendSuccess(true);
    } catch {
      setApiError('Failed to resend verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const field = (hasErr: boolean) =>
    `w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${
      hasErr
        ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100'
        : 'border-gray-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
    }`;

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -left-16 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-indigo-300/10 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-11 h-11 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            Learn smarter.<br />Achieve more.
          </h1>
          <p className="text-indigo-200 text-base mb-12 max-w-xs">
            Your personalized learning journey starts here. AI-powered courses tailored to your goals.
          </p>

          <div className="space-y-5">
            {FEATURES.map(f => (
              <div key={f.label} className="flex items-center gap-4">
                <div className="w-9 h-9 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4 text-indigo-100" />
                </div>
                <p className="text-indigo-100 text-sm">{f.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="h-px bg-white/10 mb-4" />
          <p className="text-indigo-400 text-xs">
            © 2026 EduAI LMS · GPT-o4 Analytics Pipeline
          </p>
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

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-7">Sign in to continue your learning</p>

          {/* Wrong-role banner */}
          {wrongRole && (
            <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm">
              <p className="font-semibold text-amber-800 mb-1">Instructor account detected</p>
              <p className="text-amber-700">
                This portal is for students. Please use the{' '}
                <a href={INSTRUCTOR_URL} className="text-indigo-600 font-semibold hover:underline">
                  instructor portal →
                </a>
              </p>
            </div>
          )}

          {/* API error */}
          {apiError && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
              <span className="mt-0.5 flex-shrink-0">⚠</span>
              <span>{apiError}</span>
            </div>
          )}

          {/* Email verification required */}
          {needsVerification && (
            <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-800 mb-1">Email not verified</p>
                  <p className="text-sm text-amber-700 mb-3">
                    Please verify <strong>{unverifiedEmail}</strong> before logging in.
                    Check your inbox for the verification link.
                  </p>
                  {resendSuccess ? (
                    <p className="text-sm text-emerald-700 font-medium">
                      ✓ Verification email sent! Check your inbox.
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resending}
                      className="text-sm text-indigo-600 font-semibold hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                    >
                      {resending ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Sending…</>
                      ) : (
                        <><ArrowRight className="w-3 h-3" /> Resend verification email</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                placeholder="student@university.edu"
                className={field(!!errors.email)}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <span>⚠</span> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                  placeholder="••••••••"
                  className={field(!!errors.password)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <span>⚠</span> {errors.password}
                </p>
              )}
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 accent-indigo-600"
                />
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-indigo-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                : 'Sign In'
              }
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center text-sm text-gray-500">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
