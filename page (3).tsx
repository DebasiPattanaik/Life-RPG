'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, LogOut } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ShibuCompanion from '@/components/companion/ShibuCompanion';
import { useAuth } from '@/context/AuthContext';
import { sounds } from '@/lib/soundEffects';

export default function EnterCottageGatewayPage() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const [isOpeningDoor, setIsOpeningDoor] = useState(false);

  const handleEnterCottage = () => {
    sounds.playLevelUp();
    setIsOpeningDoor(true);
    setTimeout(() => {
      router.push('/cottage');
    }, 900);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen relative flex flex-col justify-between text-[#382E25] overflow-hidden selection:bg-amber-300">
        {/* High-Resolution Autumn Cottage Exterior Backdrop */}
        <div className="fixed inset-0 z-0">
          <Image
            src="/themes/cottage_exterior.jpg"
            alt="Autumn Cottage Doorstep"
            fill
            priority
            className="object-cover object-center transform scale-100"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/30 backdrop-blur-[0.5px]" />
        </div>

        {/* Top Header */}
        <header className="relative z-20 px-4 sm:px-8 py-4 flex items-center justify-between backdrop-blur-md bg-black/25 border-b border-white/20">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-100/90 border border-amber-300 flex items-center justify-center text-amber-900 font-serif font-bold text-lg shadow-sm">
              🌿
            </div>
            <span className="font-serif text-xl font-bold text-white drop-shadow-md">
              Rekindle
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs font-semibold px-3 py-1 rounded-full bg-amber-400/30 text-amber-100 border border-amber-300/40">
              Welcome, {profile?.username || 'Traveler'}
            </span>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl bg-white/15 hover:bg-rose-500/30 text-white hover:text-rose-200 border border-white/25 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Center Gateway Card: The Doorstep */}
        <div className="relative z-20 max-w-lg mx-auto px-4 text-center my-auto py-10">
          <div className="bg-[#FFFDF9]/90 backdrop-blur-md border-2 border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-2xl animate-token-drop">
            <div className="h-14 w-14 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner animate-float-gentle">
              🏡
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              At The Doorstep
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B291A] mt-1">
              Your Sanctuary Awaits
            </h1>
            <p className="text-xs sm:text-sm text-[#6F5E4E] mt-2 leading-relaxed">
              The hearth fire is kindled, the autumn leaves are dancing outside, and Shibu is waiting to show you around the cottage.
            </p>

            {/* The Big Prominent ENTER COTTAGE Button */}
            <button
              onClick={handleEnterCottage}
              disabled={isOpeningDoor}
              className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-amber-950 font-serif font-extrabold text-lg sm:text-xl transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.99] flex items-center justify-center gap-3 border-2 border-amber-300 disabled:opacity-75"
            >
              {isOpeningDoor ? (
                <span className="animate-spin h-6 w-6 border-3 border-amber-950 border-t-transparent rounded-full" />
              ) : (
                <>
                  <Sparkles className="h-5 w-5 text-amber-950 animate-pulse" />
                  <span>ENTER COTTAGE</span>
                  <ArrowRight className="h-5 w-5 text-amber-950" />
                </>
              )}
            </button>

            <p className="text-[11px] text-[#8C7A6B] mt-3">
              Step inside for the 360° Panorama Walkthrough & Quest Board
            </p>
          </div>
        </div>

        {/* Shibu Companion waiting at the bottom */}
        <div className="relative z-20 h-28 w-full max-w-4xl mx-auto">
          <ShibuCompanion />
        </div>

        {/* Footer */}
        <footer className="relative z-20 py-3 px-4 text-center text-xs text-amber-200/80 backdrop-blur-md bg-black/30 border-t border-white/15">
          <p>© Rekindle — Step into your 360° Autumn Cottage Sanctuary.</p>
        </footer>
      </main>
    </ProtectedRoute>
  );
}
