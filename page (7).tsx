'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, isVerified, resendVerificationEmail, signOut } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleResend = async () => {
    if (!user?.email) {
      setResendStatus({ type: 'error', message: 'No registered email found.' });
      return;
    }
    setIsResending(true);
    setResendStatus(null);
    const { error } = await resendVerificationEmail(user.email);
    setIsResending(false);

    if (error) {
      setResendStatus({ type: 'error', message: error.message });
    } else {
      setResendStatus({
        type: 'success',
        message: `A fresh verification link was sent to ${user.email}. Check your inbox!`,
      });
    }
  };

  const handleRefreshCheck = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  if (isVerified) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4">
        <div className="w-full max-w-md bg-[#FFFDF9] border border-[#E4D7C5] rounded-3xl p-8 text-center shadow-xl">
          <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#3B281B] mb-2">Email Verified!</h2>
          <p className="text-sm text-[#6B5A4B] mb-6">Your account is ready. Step into your sanctuary.</p>
          <Link
            href="/cottage"
            className="inline-block w-full py-3 rounded-2xl bg-[#54371E] text-amber-50 font-semibold text-sm hover:bg-[#3D2613] shadow-md"
          >
            Enter Rekindle Cottage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-[#FFFDF9] border border-[#E4D7C5] rounded-3xl p-6 sm:p-8 shadow-xl text-center">
        <div className="h-14 w-14 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto mb-4 text-amber-800 shadow-xs">
          <Mail className="h-7 w-7" />
        </div>

        <h2 className="font-serif text-2xl font-bold text-[#3B281B] mb-2">Check Your Inbox</h2>
        <p className="text-sm text-[#6C5B4C] leading-relaxed mb-4">
          We have sent a verification link to <br />
          <strong className="text-[#3B281B] font-semibold">{user?.email || 'your registered email'}</strong>.
        </p>
        <p className="text-xs text-[#8C7A6B] mb-6">
          To protect your Life RPG journey, please click the link in your email to activate your sanctuary.
        </p>

        {resendStatus && (
          <div
            className={`mb-5 p-3 rounded-2xl text-xs flex items-start gap-2 text-left ${
              resendStatus.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {resendStatus.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            <p className="flex-1">{resendStatus.message}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleRefreshCheck}
            className="w-full py-3 rounded-2xl bg-[#54371E] text-amber-50 font-semibold text-sm hover:bg-[#3D2613] transition-all shadow-md flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>I&apos;ve Verified — Continue</span>
          </button>

          <button
            onClick={handleResend}
            disabled={isResending}
            className="w-full py-2.5 rounded-2xl border border-[#D5C7B5] bg-white hover:bg-[#F8F4EE] text-[#543F2E] font-medium text-xs transition-colors"
          >
            {isResending ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-[#EFE5D6] flex items-center justify-between text-xs text-[#7A6A5C]">
          <button onClick={handleSignOut} className="flex items-center gap-1 hover:text-[#3B281B]">
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out / Switch account</span>
          </button>
          <Link href="/" className="hover:underline">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
