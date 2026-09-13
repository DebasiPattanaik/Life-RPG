'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isDemoUser, isVerified, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // 1. Not logged in at all -> redirect to login
      if (!user && !isDemoUser) {
        router.push('/auth');
        return;
      }

      // 2. Logged in via Supabase, but email is not verified -> redirect to verify-email
      if (user && !isVerified && !isDemoUser) {
        router.push('/auth/verify-email');
      }
    }
  }, [user, isDemoUser, isVerified, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF7F2] text-[#54371E]">
        <div className="animate-spin h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full mb-4" />
        <p className="font-serif text-lg tracking-wide animate-pulse">Entering Rekindle Cottage...</p>
      </div>
    );
  }

  // Not authenticated or unverified -> render loading while router redirects
  if (!user && !isDemoUser) {
    return null;
  }

  if (user && !isVerified && !isDemoUser) {
    return null;
  }

  return <>{children}</>;
}
