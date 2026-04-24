import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, Loader2, Brain, CheckCircle2, Mail, RefreshCw, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'student';
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function validate(f: FormData): FormErrors {
  const e: FormErrors = {};
  if (!f.name.trim()) e.name = 'Full name is required';
  else if (f.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
  if (!f.email.trim()) e.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email address';
  if (!f.password) e.password = 'Password is required';
  else if (f.password.length < 8) e.password = 'Password must be at least 8 characters';
  else if (!/[A-Z]/.test(f.password)) e.password = 'Include at least one uppercase letter';
  else if (!/[0-9]/.test(f.password)) e.password = 'Include at least one number';
  if (!f.confirmPassword) e.confirmPassword = 'Please confirm your password';
  else if (f.password !== f.confirmPassword) e.confirmPassword = 'Passwords do not match';
  return e;
}

const PASSWORD_RULES = [
  { label: '8+ characters',    test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Number',           test: (p: string) => /[0-9]/.test(p) },
];

export default function Register() {
  const { register, resendVerification } = useAuth();
  const navigate      = useNavigate();

  const [form, setForm] = useState<FormData>({
    name: '', email: '', password: '', confirmPassword: '', role: 'student',
  });
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors,      setErrors]      = useState<FormErrors>({});
  const [apiError,    setApiError]    = useState('');
  const [loading,     setLoading]     = useState(false);
  const [registered,  setRegistered]  = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');

  const INSTRUCTOR_URL = import.meta.env.VITE_INSTRUCTOR_URL ?? 'http://localhost:5174';

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [key]: e.target.value }));
    setErrors(p => ({ ...p, [key]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setApiError('');
    setLoading(true);
    try {
      await register({
        name:                  form.name.trim(),
        email:                 form.email.trim(),
        password:              form.password,
        password_confirmation: form.confirmPassword,
        role:                  form.role,
      });
      setRegisteredEmail(form.email.trim());
      setRegistered(true);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      if (data?.errors && typeof data.errors === 'object') {
        const firstMsg = Object.values(data.errors as Record<string, string[]>)[0]?.[0];
        setApiError(firstMsg ?? 'Registration failed. Please try again.');
      } else {
        setApiError((data?.message as string) ?? 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    setResending(true);
    setResendSuccess(false);
    setResendError('');
    try {
      await resendVerification(registeredEmail);
      setResendSuccess(true);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setResendError(data?.message || 'Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const fieldCls = (hasErr: boolean) =>
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
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-11 h-11 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            Start your<br />learning journey
          </h1>
          <p className="text-indigo-200 text-base mb-12 max-w-xs">
            Join thousands of students mastering new skills with AI-powered personalized learning.
          </p>

          <div className="space-y-4">
            {[
              'Access 100+ interactive courses',
              'AI-powered study recommendations',
              'Track progress with detailed analytics',
              'Connect with peers and instructors',
            ].map(t => (
              <div key={t} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <p className="text-indigo-100 text-sm">{t}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="h-px bg-white/10 mb-4" />
          <p className="text-indigo-400 text-xs">&copy; 2026 apes-udom · GPT-o4 Analytics Pipeline</p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md py-6">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
          </div>

          {registered ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h2>
              <p className="text-gray-500 mb-6">
                We've sent a verification link to <strong>{registeredEmail}</strong>.
                Please check your inbox and click the link to activate your account.
              </p>
              {resendError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                  {resendError}
                </div>
              )}

              {resendSuccess ? (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-sm text-emerald-700 font-medium">
                    ✓ Verification email resent! Check your inbox.
                  </p>
                </div>
              ) : (
                <div className="mb-6">
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="text-sm text-indigo-600 font-semibold hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                  >
                    {resending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                    ) : (
                      <><RefreshCw className="w-4 h-4" /> Resend verification email</>
                    )}
                  </button>
                </div>
              )}

              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
              >
                Go to Login <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h2>
              <p className="text-sm text-gray-500 mb-7">Join the apes udom learning community</p>

              {apiError && (
                <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0">⚠</span>
                  <span>{apiError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Full name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={set('name')}
                placeholder="John Doe"
                className={fieldCls(!!errors.name)}
              />
              {errors.name && <p className="mt-1.5 text-xs text-red-600">⚠ {errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={set('email')}
                placeholder="student@university.edu"
                className={fieldCls(!!errors.email)}
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-600">⚠ {errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  className={fieldCls(!!errors.password)}
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
              <div className="flex gap-2 mt-2">
                {PASSWORD_RULES.map(r => {
                  const ok = form.password.length > 0 && r.test(form.password);
                  return (
                    <span key={r.label} className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                      {ok ? '✓' : '○'} {r.label}
                    </span>
                  );
                })}
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-600">⚠ {errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  placeholder="••••••••"
                  className={fieldCls(!!errors.confirmPassword)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600">⚠ {errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms */}
            <p className="text-xs text-gray-400 leading-relaxed">
              By creating an account, you agree to our{' '}
              <span className="text-indigo-600 cursor-pointer hover:underline">Terms of Service</span>{' '}
              and{' '}
              <span className="text-indigo-600 cursor-pointer hover:underline">Privacy Policy</span>.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-indigo-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                : 'Create Account'
              }
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center text-sm text-gray-500">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
