import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Eye, EyeOff, Loader2, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import { SEOHead } from '../../components/SEOHead';

function validate(email: string, password: string) {
  const e: Record<string, string> = {};
  if (!email.trim()) e.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    e.email = 'Enter a valid email address';
}
  if (!password) e.password = 'Password is required';
  else if (password.length < 6) e.password = 'Password must be at least 6 characters';
  return e;
}


export default function Login() {
  const { login, logout } = useAuth();
  const navigate   = useNavigate();
  const [searchParams] = useSearchParams();

  const [email,    setEmail]    = useState(searchParams.get('email') ?? '');
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

  const INSTRUCTOR_URL = import.meta.env.VITE_INSTRUCTOR_URL ?? 'https://apesguide.codagenz.com';
  // Guard against a build accidentally served on the instructor domain
  // (redirecting to itself would loop forever).
  const onInstructorOrigin = (() => {
    try { return window.location.origin === new URL(INSTRUCTOR_URL).origin; }
    catch { return false; }
  })();

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
        // Wrong portal: this account belongs on the instructor portal. Revoke the
        // student-side token and hand the user over with their email pre-filled.
        await logout();
        setWrongRole(true);
        if (!onInstructorOrigin) {
          setTimeout(() => {
            window.location.href = `${INSTRUCTOR_URL}/login?email=${encodeURIComponent(email)}&from=student`;
          }, 1500);
        }
      } else {
        navigate('/dashboard');
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

  const fieldCls = (hasErr: boolean) =>
    `w-full px-4 py-3 rounded-md border text-step-2 text-ink outline-none transition-all placeholder:text-ink-2/60 ${
      hasErr
        ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100'
        : 'border-line bg-paper focus:border-clay focus:ring-1 focus:ring-clay'
    }`;

  return (
    <>
      <SEOHead
        title="Student Login"
        description="Sign in to your APES account to access your AI-personalised courses, assignments, live sessions, and smart learning dashboard."
        canonical="/login"
        noIndex
      />
      <p className="eyebrow mb-4">Welcome back</p>
      <h1 className="font-display ed-display text-step-7 text-ink mb-9">
        Sign in to<br />APES
      </h1>

            {/* Wrong-role banner */}
            {wrongRole && (
              <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm">
                <p className="font-semibold text-amber-800 mb-1">Instructor account detected</p>
                <p className="text-amber-700">
                  This portal is for students — taking you to the{' '}
                  <a href={`${INSTRUCTOR_URL}/login?email=${encodeURIComponent(email)}&from=student`} className="text-clay font-semibold hover:underline">
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
                      Check your inbox for the 6-digit verification code.
                    </p>
                    <div className="flex items-center gap-3 mb-3">
                      <Link
                        to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                        className="text-sm text-clay font-semibold hover:text-clay-deep inline-flex items-center gap-1"
                      >
                        <ArrowRight className="w-3 h-3" /> Enter verification code
                      </Link>
                    </div>
                    {resendSuccess ? (
                      <p className="text-sm text-emerald-700 font-medium">
                        ✓ Verification code sent! Check your inbox.
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resending}
                        className="text-sm text-clay font-semibold hover:text-clay-deep disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                      >
                        {resending ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> Sending…</>
                        ) : (
                          <><ArrowRight className="w-3 h-3" /> Resend verification code</>
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
                <label className="block text-step-1 font-medium text-ink-2 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                  placeholder="Enter your email"
                  className={fieldCls(!!errors.email)}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <span>⚠</span> {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-step-1 font-medium text-ink-2 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                    placeholder="Enter your password"
                    className={fieldCls(!!errors.password)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-2 hover:text-ink transition-colors"
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
                <label className="flex items-center gap-2 text-step-1 text-ink-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-line accent-clay"
                  />
                  Remember me
                </label>
                <Link
                  to="/forgot-password"
                  className="text-step-1 text-ink hover:text-clay font-medium transition-colors"
                >
                  Forgot Password
                </Link>
              </div>

              {/* Sign in */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-ink hover:bg-clay-deep text-paper font-semibold text-step-2 transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                  : 'Sign in'
                }
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-line" />
                </div>
                <span className="relative bg-paper px-3 text-step-1 text-ink-2">Or</span>
              </div>

            </form>

            {/* Create account */}
            <p className="mt-8 text-center text-step-1 text-ink-2">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-semibold text-clay hover:text-clay-deep transition-colors">
                Create account
              </Link>
            </p>
    </>
  );
}
