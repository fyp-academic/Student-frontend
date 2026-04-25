import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router';
import { Loader2, Eye, EyeOff, Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import { authApi } from '../../services/api';

interface FormData {
  password: string;
  confirmPassword: string;
}

function validate(f: FormData) {
  const e: Partial<FormData> = {};
  if (!f.password) e.password = 'Password is required';
  else if (f.password.length < 8) e.password = 'Password must be at least 8 characters';
  if (!f.confirmPassword) e.confirmPassword = 'Please confirm your password';
  else if (f.password !== f.confirmPassword) e.confirmPassword = 'Passwords do not match';
  return e;
}

const PASSWORD_RULES = [
  { label: '8+ characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Number', test: (p: string) => /[0-9]/.test(p) },
];

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [form, setForm] = useState<FormData>({ password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword({
        token,
        email,
        password: form.password,
        password_confirmation: form.confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      if (data?.errors && typeof data.errors === 'object') {
        const firstMsg = Object.values(data.errors as Record<string, string[]>)[0]?.[0];
        setError(firstMsg ?? 'Failed to reset password. Please try again.');
      } else {
        setError((data?.message as string) ?? 'Failed to reset password. The link may be expired.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h1>
          <p className="text-gray-500 mb-6">The password reset link is invalid or has expired.</p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Request New Link
          </Link>
        </div>
      </div>
    );
  }

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
            Create new<br />password
          </h1>
          <p className="text-indigo-200 text-base mb-12 max-w-xs">
            Choose a strong password to keep your account secure.
          </p>
        </div>

        <div className="relative z-10">
          <div className="h-px bg-white/10 mb-4" />
          <p className="text-indigo-400 text-xs">© 2026 EduAI LMS · GPT-o4 Analytics Pipeline</p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-start sm:items-center justify-center p-6 sm:p-10 bg-gray-50">
        <div className="w-full max-w-md">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Reset password</h2>
          <p className="text-sm text-gray-500 mb-7">Create a new password for <strong>{email}</strong></p>

          {success ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">Password reset successful!</p>
                  <p className="text-sm text-emerald-600 mt-1">
                    Your password has been updated. Redirecting you to login...
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => {
                      setForm(p => ({ ...p, password: e.target.value }));
                      setErrors(prev => ({ ...prev, password: '' }));
                    }}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border text-sm outline-none transition-all border-gray-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={e => {
                      setForm(p => ({ ...p, confirmPassword: e.target.value }));
                      setErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border text-sm outline-none transition-all border-gray-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-600">⚠ {errors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-indigo-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Resetting…</>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
