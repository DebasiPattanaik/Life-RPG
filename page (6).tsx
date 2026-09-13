'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AutumnAuthPage() {
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle, resetPassword, resendVerificationEmail, loginAsGuest, isConfigured } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot password modal state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetSending, setIsResetSending] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Verification resend state
  const [isResending, setIsResending] = useState(false);
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);

  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return false;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateInputs()) return;

    if (!isConfigured) {
      setErrorMessage(
        'Supabase is not configured yet. You can use "Explore as Guest" below to step inside the 360 world immediately!'
      );
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrorMessage('Invalid email or password. Please verify your credentials.');
          } else if (error.message.includes('Email not confirmed')) {
            setShowVerificationBanner(true);
            setErrorMessage('Please verify your email address before stepping inside.');
          } else {
            setErrorMessage(error.message);
          }
        } else {
          router.push('/cottage');
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          setErrorMessage(error.message);
        } else {
          setShowVerificationBanner(true);
          setSuccessMessage(
            'A magical verification link was sent to your email. Confirm it to enter the cottage.'
          );
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    if (!isConfigured) {
      setErrorMessage('Supabase is not configured yet. Use "Explore as Guest" to test immediately.');
      return;
    }
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus(null);
    if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setResetStatus({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setIsResetSending(true);
    const { error } = await resetPassword(resetEmail);
    setIsResetSending(false);

    if (error) {
      setResetStatus({ type: 'error', text: error.message });
    } else {
      setResetStatus({
        type: 'success',
        text: `Reset instructions sent to ${resetEmail}. Check your inbox!`,
      });
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setErrorMessage('Please enter your email above to resend verification.');
      return;
    }
    setIsResending(true);
    const { error } = await resendVerificationEmail(email);
    setIsResending(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage(`Verification email resent to ${email}.`);
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    router.push('/cottage');
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center px-4 py-12 text-[#F5EBE1] overflow-hidden">
      {/* High-Resolution Autumn Cottage Backdrop */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/themes/cottage_exterior.jpg"
          alt="Autumn Cottage"
          fill
          priority
          className="object-cover object-center transform scale-100"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/75 backdrop-blur-xs" />
      </div>

      {/* Brand Header */}
      <div className="relative z-10 mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <span className="h-11 w-11 rounded-2xl bg-amber-900/80 border border-amber-400/60 flex items-center justify-center text-xl shadow-lg">
            🍂
          </span>
          <span className="font-serif text-3xl font-bold text-white tracking-tight drop-shadow-md">
            Rekindle
          </span>
        </Link>
        <p className="mt-1 text-xs sm:text-sm text-amber-200/80">Step across the threshold into your sanctuary</p>
      </div>

      {/* Autumn Cedar Wood Auth Card (NO white background!) */}
      <div className="relative z-10 w-full max-w-md bg-[#241710]/95 border-2 border-[#D97706]/60 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Decorative Amber Lantern Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 rounded-t-3xl" />

        {/* Mode Tabs */}
        <div className="flex rounded-2xl bg-[#170E0A] p-1 mb-6 border border-amber-900/40">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-amber-500 text-amber-950 shadow-sm'
                : 'text-amber-200/70 hover:text-amber-100'
            }`}
          >
            Welcome Back
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-amber-500 text-amber-950 shadow-sm'
                : 'text-amber-200/70 hover:text-amber-100'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1">
              <p>{errorMessage}</p>
              {showVerificationBanner && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="mt-1 text-xs font-semibold text-amber-300 underline hover:no-underline"
                >
                  {isResending ? 'Resending email...' : 'Resend verification email'}
                </button>
              )}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
            <p className="flex-1">{successMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-amber-200/90 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400/60" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="traveler@rekindle.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-800/60 bg-[#170E0A] text-sm text-[#F5EBE1] placeholder-amber-400/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-amber-200/90 uppercase tracking-wider">
                Password
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setIsForgotOpen(true);
                  }}
                  className="text-xs text-amber-300 hover:text-amber-200 underline font-medium"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400/60" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-amber-800/60 bg-[#170E0A] text-sm text-[#F5EBE1] placeholder-amber-400/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-400/60 hover:text-amber-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-serif font-black text-sm transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <span className="animate-spin h-4 w-4 border-2 border-amber-950 border-t-transparent rounded-full" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Enter The Cottage' : 'Create Wanderer Profile'}</span>
                <ArrowRight className="h-4 w-4 text-amber-950" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-amber-900/40" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#241710] px-3 text-amber-300/60 font-medium">Or continue with</span>
          </div>
        </div>

        {/* Social Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-2.5 rounded-2xl border border-amber-800/60 bg-[#170E0A] hover:bg-[#20140E] text-amber-100 font-medium text-xs transition-all flex items-center justify-center gap-2.5 shadow-sm"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* 1-Click Instant Guest Demo */}
        <div className="mt-4 pt-3 border-t border-amber-900/40 text-center">
          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Explore as Guest (Instant 1-Click Access)</span>
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-3xl bg-[#241710] border-2 border-amber-500/50 p-6 shadow-2xl animate-token-drop text-[#F5EBE1]">
            <h3 className="font-serif text-xl font-bold text-white mb-1">Reset Password</h3>
            <p className="text-xs text-amber-200/75 mb-4">
              Enter your email and we will send you password reset instructions.
            </p>

            {resetStatus && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-start gap-2 ${
                  resetStatus.type === 'success'
                    ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-200'
                    : 'bg-rose-950/80 border border-rose-500 text-rose-200'
                }`}
              >
                {resetStatus.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                <span>{resetStatus.text}</span>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-amber-200 uppercase tracking-wider mb-1">
                  Registered Email
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="your-email@rekindle.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-800/60 bg-[#170E0A] text-sm text-[#F5EBE1] focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetSending}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-amber-950 text-xs font-bold hover:bg-amber-400 disabled:opacity-60"
                >
                  {isResetSending ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
