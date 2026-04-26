import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, Loader2, CheckCircle2, Mail, RefreshCw, ArrowRight, GraduationCap, Building2, Globe } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { authApi, collegesApi, degreeProgrammesApi } from '../../services/api';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'student';
  registrationNumber: string;
  collegeId: string;
  degreeProgrammeId: string;
  gender: string;
  phoneNumber: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  registrationNumber?: string;
  collegeId?: string;
  degreeProgrammeId?: string;
  gender?: string;
  phoneNumber?: string;
}

interface ParsedReg {
  nationality_code: string;
  nationality: string;
  flag: string;
  region?: string;
  registration_year: number;
  education_level: string;
  year_of_study: number;
}

function validate(f: FormData, parsed: ParsedReg | null): FormErrors {
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

  if (!f.registrationNumber.trim()) {
    e.registrationNumber = 'Registration number is required';
  } else if (!/^[TKBRUZ]\d{2}-\d{2}-\d{5}$/.test(f.registrationNumber.trim())) {
    e.registrationNumber = 'Invalid format. Expected: XYY-LL-NNNNN (e.g., T23-03-09759, Z24-03-01234)';
  }

  if (!f.collegeId) e.collegeId = 'Please select a college';
  if (!f.degreeProgrammeId) e.degreeProgrammeId = 'Please select a degree programme';

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
    registrationNumber: '', collegeId: '', degreeProgrammeId: '', gender: '', phoneNumber: '',
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

  // Registration parsing state
  const [parsed, setParsed] = useState<ParsedReg | null>(null);
  const [parsing, setParsing] = useState(false);

  // Colleges & degree programmes
  const [colleges, setColleges] = useState<Array<{id: string; name: string; code: string}>>([]);
  const [programmes, setProgrammes] = useState<Array<{id: string; name: string; code: string; college_id: string}>>([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [collegesError, setCollegesError] = useState('');
  const [programmesError, setProgrammesError] = useState('');

  const INSTRUCTOR_URL = import.meta.env.VITE_INSTRUCTOR_URL ?? 'https://apesguide.codagenz.com';

  // Fetch colleges on mount
  useEffect(() => {
    setLoadingColleges(true);
    setCollegesError('');
    collegesApi.list()
      .then(res => {
        const data = res.data.data ?? res.data ?? [];
        setColleges(data);
      })
      .catch((err) => {
        console.error('Failed to load colleges:', err);
        const msg = err.response?.data?.message || err.message || 'Failed to load colleges. Please check your API connection.';
        setCollegesError(msg);
      })
      .finally(() => setLoadingColleges(false));
  }, []);

  // Fetch degree programmes when college changes
  useEffect(() => {
    if (!form.collegeId) {
      setProgrammes([]);
      setProgrammesError('');
      return;
    }
    setProgrammesError('');
    degreeProgrammesApi.list(form.collegeId)
      .then(res => {
        const data = res.data.data ?? res.data ?? [];
        setProgrammes(data);
      })
      .catch((err) => {
        console.error('Failed to load degree programmes:', err);
        const msg = err.response?.data?.message || err.message || 'Failed to load degree programmes.';
        setProgrammesError(msg);
      });
  }, [form.collegeId]);

  // Parse registration number in real-time
  useEffect(() => {
    const reg = form.registrationNumber.trim();
    if (!reg || !/^[TKBRU]\d{2}-\d{2}-\d{5}$/.test(reg)) {
      setParsed(null);
      return;
    }
    const timer = setTimeout(() => {
      setParsing(true);
      authApi.parseRegistration(reg)
        .then(res => {
          setParsed(res.data.data ?? null);
          setErrors(p => ({ ...p, registrationNumber: '' }));
        })
        .catch(() => {
          setParsed(null);
          setErrors(p => ({ ...p, registrationNumber: 'Invalid registration number format' }));
        })
        .finally(() => setParsing(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [form.registrationNumber]);

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [key]: e.target.value }));
    setErrors(p => ({ ...p, [key]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form, parsed);
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
        registration_number:   form.registrationNumber.trim(),
        degree_programme_id:   form.degreeProgrammeId,
        college_id:            form.collegeId,
        gender:                form.gender,
        phone_number:          form.phoneNumber,
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
    <div className="min-h-screen flex items-start justify-center p-6 sm:p-10 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md py-6">

          {registered ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h2>
              <p className="text-gray-500 mb-6">
                We've sent a 6-digit verification code to <strong>{registeredEmail}</strong>.
                Please check your inbox and enter the code below to activate your account.
              </p>
              <Link
                to={`/verify-email?email=${encodeURIComponent(registeredEmail)}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors mb-6"
              >
                Enter Verification Code <ArrowRight className="w-4 h-4" />
              </Link>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-1 text-center">Create your account</h2>
              <p className="text-sm text-gray-500 mb-7 text-center">Join the apes udom learning community</p>

              {apiError && (
                <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0">⚠</span>
                  <span>{apiError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Full name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            {/* Registration Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Registration Number <span className="text-gray-400 font-normal">(e.g., T23-03-09759)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.registrationNumber}
                  onChange={set('registrationNumber')}
                  placeholder="T23-03-09759"
                  className={fieldCls(!!errors.registrationNumber)}
                />
                {parsing && (
                  <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
              {errors.registrationNumber && <p className="mt-1.5 text-xs text-red-600">⚠ {errors.registrationNumber}</p>}

              {/* Parsed info display */}
              {parsed && (
                <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm text-gray-700">
                      <span className="text-xl mr-1">{parsed.flag}</span>
                      {parsed.nationality}
                      {parsed.region && <span className="text-xs text-gray-500 ml-1">({parsed.region})</span>}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="bg-white rounded-lg px-3 py-2 border border-indigo-100">
                      <span className="block text-[10px] text-gray-400 uppercase tracking-wide">Education Level</span>
                      <span className="font-medium text-indigo-700">{parsed.education_level}</span>
                    </div>
                    <div className="bg-white rounded-lg px-3 py-2 border border-indigo-100">
                      <span className="block text-[10px] text-gray-400 uppercase tracking-wide">Year of Study</span>
                      <span className="font-medium text-indigo-700">Year {parsed.year_of_study}</span>
                    </div>
                    <div className="bg-white rounded-lg px-3 py-2 border border-indigo-100">
                      <span className="block text-[10px] text-gray-400 uppercase tracking-wide">Registered</span>
                      <span className="font-medium text-indigo-700">{parsed.registration_year}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* College */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Building2 className="inline w-4 h-4 mr-1 -mt-0.5 text-gray-500" />
                College
              </label>
              <select
                value={form.collegeId}
                onChange={set('collegeId')}
                disabled={loadingColleges}
                className={fieldCls(!!errors.collegeId) + ' appearance-none bg-white'}
              >
                <option value="">{loadingColleges ? 'Loading colleges…' : 'Select a college'}</option>
                {colleges.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
              {errors.collegeId && <p className="mt-1.5 text-xs text-red-600">⚠ {errors.collegeId}</p>}
              {collegesError && (
                <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-1.5">
                  <span className="mt-0.5 flex-shrink-0">⚠</span>
                  <span>{collegesError}</span>
                </div>
              )}
            </div>

            {/* Degree Programme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <GraduationCap className="inline w-4 h-4 mr-1 -mt-0.5 text-gray-500" />
                Degree Programme
              </label>
              <select
                value={form.degreeProgrammeId}
                onChange={set('degreeProgrammeId')}
                disabled={!form.collegeId || programmes.length === 0}
                className={fieldCls(!!errors.degreeProgrammeId) + ' appearance-none bg-white'}
              >
                <option value="">
                  {!form.collegeId ? 'Select a college first' : programmes.length === 0 ? 'No programmes available' : 'Select a degree programme'}
                </option>
                {programmes.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
              {errors.degreeProgrammeId && <p className="mt-1.5 text-xs text-red-600">⚠ {errors.degreeProgrammeId}</p>}
              {programmesError && (
                <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-1.5">
                  <span className="mt-0.5 flex-shrink-0">⚠</span>
                  <span>{programmesError}</span>
                </div>
              )}
            </div>

            {/* Gender & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                <select
                  value={form.gender}
                  onChange={set('gender')}
                  className={fieldCls(!!errors.gender) + ' appearance-none bg-white'}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="mt-1.5 text-xs text-red-600">⚠ {errors.gender}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={set('phoneNumber')}
                  placeholder="e.g. +255 712 345 678"
                  className={fieldCls(!!errors.phoneNumber)}
                />
                {errors.phoneNumber && <p className="mt-1.5 text-xs text-red-600">⚠ {errors.phoneNumber}</p>}
              </div>
            </div>

            {/* Password & Confirm password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="flex flex-wrap gap-2 mt-2">
                  {PASSWORD_RULES.map(r => {
                    const ok = form.password.length > 0 && r.test(form.password);
                    return (
                      <span key={r.label} className={`text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
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
  );
}
