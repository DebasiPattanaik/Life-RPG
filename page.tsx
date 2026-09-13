'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, Heart, Compass } from 'lucide-react';
import CharacterAvatar from '@/components/character/CharacterAvatar';
import PetCompanion from '@/components/cottage/PetCompanion';
import { CharacterStyle, PetType, ThemeId, THEMES } from '@/lib/rpgTypes';
import { useAuth } from '@/context/AuthContext';
import { sounds } from '@/lib/soundEffects';

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, updateProfile, loginAsGuest, user } = useAuth();

  const [avatar, setAvatar] = useState<CharacterStyle>(profile?.avatar || 'female_traveler');
  const [username, setUsername] = useState<string>(profile?.username || 'Cottage Wanderer');
  const [petType, setPetType] = useState<PetType>(profile?.pet_type || 'fuzzy_cat');
  const [petName, setPetName] = useState<string>(profile?.pet_name || 'Mochi');
  const [activeTheme, setActiveTheme] = useState<ThemeId>(profile?.active_theme || 'cottage_day');
  const [isSaving, setIsSaving] = useState(false);

  const handleFinish = async () => {
    sounds.playLevelUp();
    setIsSaving(true);

    // If user is not logged in yet, activate guest demo mode so they can play seamlessly
    if (!user) {
      loginAsGuest();
    }

    await updateProfile({
      avatar,
      username: username.trim() || 'Cottage Wanderer',
      pet_type: petType,
      pet_name: petName.trim() || 'Mochi',
      active_theme: activeTheme,
      onboarding_completed: true,
    });

    setIsSaving(false);
    router.push('/cottage');
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 max-w-4xl mx-auto flex flex-col justify-between">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold tracking-wide border border-amber-200">
          <Sparkles className="h-3.5 w-3.5 text-amber-700" />
          Step 1: Awakening Your Sanctuary
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#3E2C1D] mt-2">
          Choose Your Traveler & Companion
        </h1>
        <p className="text-sm text-[#6E5D4E] mt-1">
          Customize your character, your faithful pet watcher, and your starter room aesthetic.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Selectors (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Character Gender / Style */}
          <div className="bg-[#FFFDF9] border border-[#E5D7C5] rounded-3xl p-5 sm:p-6 shadow-md">
            <h2 className="font-serif text-lg font-bold text-[#4A3525] mb-3 flex items-center gap-2">
              <span>1. Character Traveler Style</span>
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => {
                  setAvatar('female_traveler');
                  sounds.playTaskPop();
                }}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                  avatar === 'female_traveler'
                    ? 'border-amber-600 bg-amber-50/70 shadow-xs'
                    : 'border-[#E2D4C3] bg-white hover:bg-[#FAF7F2]'
                }`}
              >
                <CharacterAvatar style="female_traveler" size="md" />
                <div>
                  <span className="block text-xs font-bold text-[#3B291A]">Female Traveler</span>
                  <span className="text-[11px] text-[#7A695A]">Straw hat & linen cape</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAvatar('male_traveler');
                  sounds.playTaskPop();
                }}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                  avatar === 'male_traveler'
                    ? 'border-amber-600 bg-amber-50/70 shadow-xs'
                    : 'border-[#E2D4C3] bg-white hover:bg-[#FAF7F2]'
                }`}
              >
                <CharacterAvatar style="male_traveler" size="md" />
                <div>
                  <span className="block text-xs font-bold text-[#3B291A]">Male Traveler</span>
                  <span className="text-[11px] text-[#7A695A]">Forest headband & tunic</span>
                </div>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#543F2E] uppercase tracking-wider mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Sophie, Rowan, or your name..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CAB7] bg-[#FAF8F5] text-sm text-[#382E25] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>

          {/* 2. Companion Pet Selection */}
          <div className="bg-[#FFFDF9] border border-[#E5D7C5] rounded-3xl p-5 sm:p-6 shadow-md">
            <h2 className="font-serif text-lg font-bold text-[#4A3525] mb-1 flex items-center gap-2">
              <span>2. Your Observant Pet Companion</span>
              <Heart className="h-4 w-4 text-rose-500" />
            </h2>
            <p className="text-xs text-[#7A6958] mb-4">
              Your pet watches you focus and drops tokens into your glass jar while you work and sleep.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {/* Fuzzy Cat */}
              <button
                type="button"
                onClick={() => {
                  setPetType('fuzzy_cat');
                  sounds.playPetJoy();
                }}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center ${
                  petType === 'fuzzy_cat'
                    ? 'border-amber-600 bg-amber-50/70 shadow-xs ring-1 ring-amber-600'
                    : 'border-[#E2D4C3] bg-white hover:bg-[#FAF7F2]'
                }`}
              >
                <PetCompanion petType="fuzzy_cat" petName="" />
                <span className="font-serif text-xs font-bold text-[#3E2B1E] mt-1">Fuzzy Cat</span>
                <span className="text-[10px] text-[#7A6A5C] mt-0.5">Calm, sleepy, purrs</span>
              </button>

              {/* Shiba Dog */}
              <button
                type="button"
                onClick={() => {
                  setPetType('shibu_dog');
                  sounds.playPetJoy();
                }}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center ${
                  petType === 'shibu_dog'
                    ? 'border-amber-600 bg-amber-50/70 shadow-xs ring-1 ring-amber-600'
                    : 'border-[#E2D4C3] bg-white hover:bg-[#FAF7F2]'
                }`}
              >
                <PetCompanion petType="shibu_dog" petName="" />
                <span className="font-serif text-xs font-bold text-[#3E2B1E] mt-1">Shibu / Shiba</span>
                <span className="text-[10px] text-[#7A6A5C] mt-0.5">Loyal & alert watcher</span>
              </button>

              {/* Garden Rabbit */}
              <button
                type="button"
                onClick={() => {
                  setPetType('garden_rabbit');
                  sounds.playPetJoy();
                }}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center ${
                  petType === 'garden_rabbit'
                    ? 'border-amber-600 bg-amber-50/70 shadow-xs ring-1 ring-amber-600'
                    : 'border-[#E2D4C3] bg-white hover:bg-[#FAF7F2]'
                }`}
              >
                <PetCompanion petType="garden_rabbit" petName="" />
                <span className="font-serif text-xs font-bold text-[#3E2B1E] mt-1">Garden Rabbit</span>
                <span className="text-[10px] text-[#7A6A5C] mt-0.5">Gentle & hops by herbs</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#543F2E] uppercase tracking-wider mb-1">
                Companion&apos;s Name
              </label>
              <input
                type="text"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="Mochi, Kiko, Clover..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CAB7] bg-[#FAF8F5] text-sm text-[#382E25] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>

          {/* 3. Starter Room Aesthetic */}
          <div className="bg-[#FFFDF9] border border-[#E5D7C5] rounded-3xl p-5 sm:p-6 shadow-md">
            <h2 className="font-serif text-lg font-bold text-[#4A3525] mb-1 flex items-center gap-2">
              <span>3. Starter Room Aesthetic</span>
              <Compass className="h-4 w-4 text-emerald-600" />
            </h2>
            <p className="text-xs text-[#7A6958] mb-4">
              Select your initial sanctuary atmosphere (you can switch anytime with earned XP/Tokens).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(THEMES) as ThemeId[]).map((tid) => {
                const t = THEMES[tid];
                const isSelected = activeTheme === tid;
                return (
                  <button
                    key={tid}
                    type="button"
                    onClick={() => {
                      setActiveTheme(tid);
                      sounds.playTaskPop();
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/80 shadow-sm ring-1 ring-amber-600'
                        : 'border-[#E5DACB] bg-white hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <div className="relative h-20 w-full rounded-xl overflow-hidden mb-2 bg-[#EADCCB]">
                      <Image
                        src={t.image}
                        alt={t.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <span className="block font-serif text-xs font-bold text-[#3B291A]">
                      {t.title}
                    </span>
                    <span className="text-[10px] text-[#7C6B5C] line-clamp-1">
                      {t.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Sanctuary Preview Frame (5 cols) */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-[#FFFDF9] border-2 border-[#E4D7C5] rounded-3xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="font-serif text-sm font-bold text-[#4A3525]">Sanctuary Live Preview</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                {THEMES[activeTheme].title}
              </span>
            </div>

            {/* Room Frame */}
            <div className="relative h-64 w-full rounded-2xl overflow-hidden border border-[#D8C7AF] shadow-inner bg-[#F5ECE0]">
              <Image
                src={THEMES[activeTheme].image}
                alt={THEMES[activeTheme].title}
                fill
                className="object-cover opacity-90"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

              {/* Character & Pet standing together */}
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                {/* Traveler */}
                <div className="flex items-center gap-2.5 bg-white/80 backdrop-blur-xs p-2 rounded-2xl border border-white shadow-sm">
                  <CharacterAvatar style={avatar} size="sm" />
                  <div>
                    <span className="block text-xs font-bold text-[#3B281B] leading-tight">
                      {username || 'Traveler'}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Lv. 1 Wanderer</span>
                  </div>
                </div>

                {/* Pet Companion */}
                <div className="bg-white/80 backdrop-blur-xs p-2 rounded-2xl border border-white shadow-sm flex items-center">
                  <PetCompanion petType={petType} petName={petName || 'Mochi'} />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 p-3 rounded-2xl bg-[#FAF6EE] border border-[#E9DEC9] text-xs text-[#6C5B4C] space-y-1">
              <p>
                🌸 <strong>Observant Pet:</strong> {petName || 'Your Pet'} is ready to watch you finish tasks.
              </p>
              <p>
                🏺 <strong>Token Jar:</strong> Holds 3 starter tokens waiting for you inside the cottage.
              </p>
            </div>

            {/* Enter Sanctuary Button */}
            <button
              onClick={handleFinish}
              disabled={isSaving}
              className="w-full mt-4 py-3.5 rounded-2xl bg-[#54371E] text-amber-50 font-semibold text-sm hover:bg-[#3D2613] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSaving ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <span>Enter Rekindle Cottage</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
