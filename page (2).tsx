'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ArrowRight, Wind, Volume2, VolumeX } from 'lucide-react';
import { sounds } from '@/lib/soundEffects';

export default function WhimsicalCottageLandingPage() {
  const [isWindPlaying, setIsWindPlaying] = useState(false);

  const handleToggleSound = () => {
    const active = sounds.toggleWind();
    setIsWindPlaying(active);
  };

  return (
    <main className="min-h-screen relative flex flex-col justify-between text-[#F5EBE1] overflow-hidden select-none">
      {/* High-Resolution Autumn Ghibli Cottage Exterior (Not Pixelated) */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/themes/cottage_exterior.jpg"
          alt="Whimsical Studio Ghibli Countryside Cottage"
          fill
          priority
          className="object-cover object-center transform scale-100 transition-transform duration-10000"
          unoptimized
        />
        {/* Soft Golden Sunlight & Autumn Breeze Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/35 backdrop-blur-[0.3px]" />
      </div>

      {/* Top Header: Brand & Wind Audio Toggle */}
      <header className="relative z-20 px-4 sm:px-8 py-4 flex items-center justify-between backdrop-blur-md bg-black/25 border-b border-white/15">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-900/80 border border-amber-400/60 flex items-center justify-center text-amber-200 font-serif font-bold text-xl shadow-lg">
            🍂
          </div>
          <div>
            <span className="font-serif text-2xl font-bold tracking-tight text-white drop-shadow-md">
              Rekindle
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/40">
              Ghibli Cottage
            </span>
          </div>
        </div>

        {/* Ambient Wind Sound Button */}
        <button
          onClick={handleToggleSound}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all shadow-md backdrop-blur-md ${
            isWindPlaying
              ? 'bg-amber-500 text-amber-950 border-amber-300 animate-pulse'
              : 'bg-black/40 text-amber-200 border-amber-400/40 hover:bg-black/60'
          }`}
          title="Toggle ambient cottage wind & breeze"
        >
          <Wind className={`h-3.5 w-3.5 ${isWindPlaying ? 'animate-spin-slow' : ''}`} />
          <span>{isWindPlaying ? 'Wind Rustling 🍃' : 'Play Breeze'}</span>
          {isWindPlaying ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        </button>
      </header>

      {/* Centerpiece: Clean Whimsical Presentation with ENTER COTTAGE Button */}
      <div className="relative z-20 max-w-xl mx-auto px-4 text-center my-auto py-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/80 border border-amber-400/50 text-amber-200 text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-md shadow-xl animate-float-gentle">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          The Autumn Sanctuary
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl font-bold text-white leading-tight tracking-tight drop-shadow-xl">
          Rekindle <br />
          <span className="text-amber-300 italic underline decoration-amber-400 decoration-wavy">
            The Cottage
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base text-amber-100/90 leading-relaxed drop-shadow-md">
          A tranquil countryside refuge. Listen to the wind rustling through the wildflowers, kindling your daily habits into small magics.
        </p>

        {/* Step 2: ENTER COTTAGE Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/auth"
            className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-amber-950 font-serif font-black text-lg sm:text-xl transition-all shadow-2xl hover:scale-105 active:scale-95 flex items-center justify-center gap-3 border-2 border-amber-300 animate-lantern-glow group"
          >
            <span>ENTER COTTAGE</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 text-amber-950" />
          </Link>
        </div>

        <p className="text-[11px] text-amber-200/75 mt-4 tracking-wide">
          Step through the doorstep into the 360° Autumn Walkthrough
        </p>
      </div>

      {/* Footer */}
      <footer className="relative z-20 py-4 px-4 text-center text-xs text-amber-200/70 backdrop-blur-md bg-black/40 border-t border-white/10">
        <p>© Rekindle — Countryside Studio Ghibli Cottage Walkthrough.</p>
      </footer>
    </main>
  );
}
