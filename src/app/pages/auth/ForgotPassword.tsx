import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Loader2, Mail, ArrowLeft, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { authApi } from '../../services/api';
import { SEOHead } from '../../components/SEOHead';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');

  // Email step
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // OTP step
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    if (!email.trim()) {
      setEmailError('Please enter your email address');
      return;
    }
    setEmailLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setStep('otp');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setEmailError(msg ?? 'Failed to send reset code. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (!otp.trim() || otp.length !== 6) {
      setOtpError('Please enter the 6-digit code');
      return;
    }
    if (!newPassword) {
      setOtpError('Please enter a new password');
      return;
    }
    if (newPassword.length < 8) {
      setOtpError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setOtpError('Passwords do not match');
      return;
    }

    setOtpLoading(true);
    try {
      await authApi.resetPassword({
        email,
        otp: otp.trim(),
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setStep('success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setOtpError(msg ?? 'Failed to reset password. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setEmailError('');
    setEmailLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setOtpError('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setOtpError(msg ?? 'Failed to resend code. Please try again.');
    } finally {
      setEmailLoading(false);
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
        title="Forgot Password"
        description="Reset your APES LMS account password to regain access to your courses and academic resources."
        canonical="/forgot-password"
        noIndex
      />
      <Link
          to="/login"
          className="inline-flex items-center gap-1 text-step-1 text-ink-2 hover:text-clay mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>

        {step === 'email' && (
          <>
            <p className="eyebrow mb-4">Reset access</p>
            <h1 className="font-display ed-display text-step-6 text-ink mb-2">Forgot password?</h1>
            <p className="text-step-2 text-ink-2 mb-7">
              Enter your email to receive a reset code
            </p>

            <form onSubmit={handleSendOtp} className="space-y-5" noValidate>
              {emailError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                  {emailError}
                </div>
              )}

              <div>
                <label className="block text-step-1 font-medium text-ink-2 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                    placeholder="Enter your email"
                    className={`${fieldCls(false)} pl-10`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={emailLoading}
                className="w-full py-3.5 rounded-full bg-ink hover:bg-clay-deep text-paper font-semibold text-step-2 transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {emailLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                ) : (
                  'Send Reset Code'
                )}
              </button>
            </form>
          </>
        )}

        {step === 'otp' && (
          <>
            <p className="eyebrow mb-4">Reset access</p>
            <h1 className="font-display ed-display text-step-6 text-ink mb-2">Enter reset code</h1>
            <p className="text-step-2 text-ink-2 mb-7">
              Enter the 6-digit code sent to <strong>{email}</strong> and your new password
            </p>

            <form onSubmit={handleResetPassword} className="space-y-5" noValidate>
              {otpError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                  {otpError}
                </div>
              )}

              {/* OTP Input */}
              <div>
                <label className="block text-step-1 font-medium text-ink-2 mb-1.5">
                  Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                  placeholder="123456"
                  className={`${fieldCls(false)} text-center tracking-widest font-mono text-lg`}
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-step-1 font-medium text-ink-2 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setOtpError(''); }}
                    placeholder="••••••••"
                    className={`${fieldCls(false)} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-2 hover:text-ink transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-step-1 font-medium text-ink-2 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setOtpError(''); }}
                    placeholder="••••••••"
                    className={`${fieldCls(false)} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-2 hover:text-ink transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full py-3.5 rounded-full bg-ink hover:bg-clay-deep text-paper font-semibold text-step-2 transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {otpLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Resetting…</>
                ) : (
                  'Reset Password'
                )}
              </button>

              <p className="text-center text-step-1 text-ink-2">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={emailLoading}
                  className="text-clay font-semibold hover:text-clay-deep disabled:opacity-50"
                >
                  {emailLoading ? 'Sending…' : 'Resend'}
                </button>
              </p>
            </form>
          </>
        )}

        {step === 'success' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="font-display ed-display text-step-5 text-ink mb-2">Password reset successful!</h1>
            <p className="text-step-2 text-ink-2 mb-6">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 rounded-full bg-ink hover:bg-clay-deep text-paper font-semibold text-step-2 transition-colors duration-300"
            >
              Go to Login
            </button>
          </div>
        )}

        {step !== 'success' && (
          <p className="mt-6 text-center text-step-1 text-ink-2">
            Remember your password?{' '}
            <Link to="/login" className="text-clay font-semibold hover:text-clay-deep transition-colors">
              Sign in
            </Link>
          </p>
        )}
    </>
  );
}
