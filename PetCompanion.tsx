'use client';

import React, { useState } from 'react';
import { PetType } from '@/lib/rpgTypes';
import { sounds } from '@/lib/soundEffects';

interface PetCompanionProps {
  petType: PetType;
  petName: string;
  isDeliveringToken?: boolean;
  onPetClick?: () => void;
  className?: string;
}

export default function PetCompanion({
  petType,
  petName,
  isDeliveringToken = false,
  onPetClick,
  className = '',
}: PetCompanionProps) {
  const [isPetted, setIsPetted] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleInteraction = (e: React.MouseEvent) => {
    sounds.playPetJoy();
    setIsPetted(true);
    setTimeout(() => setIsPetted(false), 1200);

    const rect = e.currentTarget.getBoundingClientRect();
    const newHeart = {
      id: Date.now(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setHearts((prev) => [...prev.slice(-3), newHeart]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1000);

    if (onPetClick) {
      onPetClick();
    }
  };

  return (
    <div
      onClick={handleInteraction}
      role="button"
      tabIndex={0}
      aria-label={`Your companion ${petName}, click to pet`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleInteraction(e as unknown as React.MouseEvent);
        }
      }}
      className={`group relative cursor-pointer select-none transition-transform duration-300 active:scale-95 ${className}`}
    >
      {/* Floating Hearts upon petting */}
      {hearts.map((h) => (
        <span
          key={h.id}
          style={{ left: h.x, top: h.y }}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-6 animate-bounce text-sm font-bold text-rose-400"
        >
          ❤️
        </span>
      ))}

      {/* Observation Indicator Badge */}
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-100/90 px-2 py-0.5 text-[11px] font-medium text-amber-900 shadow-sm opacity-0 transition-opacity group-hover:opacity-100">
        {isPetted ? `${petName} purrs softly! ✨` : isDeliveringToken ? 'Dropping a token! 🌟' : `${petName} is watching your focus`}
      </div>

      {/* Pet Illustrations */}
      <div className={`relative ${isPetted ? 'scale-110' : isDeliveringToken ? 'translate-x-3' : 'animate-pet-breathe'}`}>
        {petType === 'fuzzy_cat' && (
          <div className="relative h-24 w-28 drop-shadow-md">
            {/* Calico Cat Body */}
            <svg viewBox="0 0 100 80" className="h-full w-full">
              {/* Shadow */}
              <ellipse cx="50" cy="72" rx="36" ry="7" fill="rgba(60, 45, 30, 0.15)" />
              {/* Tail */}
              <path
                d="M 22 60 C 10 55 10 38 18 35 C 22 34 26 40 22 48 Z"
                fill="#D98A5B"
                className="animate-breeze origin-bottom"
              />
              {/* Main Body */}
              <ellipse cx="52" cy="54" rx="30" ry="20" fill="#FDFBF7" />
              {/* Calico Patches */}
              <path d="M 40 38 C 50 36 60 42 62 50 C 52 52 42 46 40 38 Z" fill="#D98A5B" />
              <path d="M 65 45 C 72 45 78 52 75 60 C 68 62 62 56 65 45 Z" fill="#423E3B" />
              {/* Head */}
              <circle cx="68" cy="36" r="16" fill="#FDFBF7" />
              {/* Ears */}
              <polygon points="60,26 64,12 70,24" fill="#D98A5B" />
              <polygon points="62,24 64,15 68,23" fill="#F4B8A5" />
              <polygon points="72,24 78,13 82,27" fill="#423E3B" />
              <polygon points="74,23 78,16 80,25" fill="#F4B8A5" />
              {/* Cheeks & Sleeping/Attentive Eyes */}
              <ellipse cx="64" cy="40" rx="2" ry="1.2" fill="#F4B8A5" opacity="0.6" />
              <ellipse cx="76" cy="40" rx="2" ry="1.2" fill="#F4B8A5" opacity="0.6" />
              {/* Eyes */}
              {isPetted ? (
                // Happy squint
                <>
                  <path d="M 62 34 Q 65 31 68 34" stroke="#38302A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M 72 34 Q 75 31 78 34" stroke="#38302A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </>
              ) : (
                // Attentive observing eyes
                <>
                  <ellipse cx="65" cy="34" rx="2.5" ry="3" fill="#2E4034" />
                  <circle cx="66" cy="33" r="0.8" fill="#FFF" />
                  <ellipse cx="75" cy="34" rx="2.5" ry="3" fill="#2E4034" />
                  <circle cx="76" cy="33" r="0.8" fill="#FFF" />
                </>
              )}
              {/* Nose & Whiskers */}
              <polygon points="69,38 71,38 70,39.5" fill="#E8927C" />
              <line x1="58" y1="38" x2="50" y2="37" stroke="#9E8D7C" strokeWidth="0.8" />
              <line x1="58" y1="40" x2="49" y2="42" stroke="#9E8D7C" strokeWidth="0.8" />
              <line x1="82" y1="38" x2="90" y2="37" stroke="#9E8D7C" strokeWidth="0.8" />
              <line x1="82" y1="40" x2="91" y2="42" stroke="#9E8D7C" strokeWidth="0.8" />
            </svg>
          </div>
        )}

        {petType === 'shibu_dog' && (
          <div className="relative h-24 w-28 drop-shadow-md">
            {/* Shiba Inu */}
            <svg viewBox="0 0 100 80" className="h-full w-full">
              <ellipse cx="50" cy="72" rx="35" ry="6" fill="rgba(60, 45, 30, 0.15)" />
              {/* Curled Tail */}
              <path
                d="M 24 54 C 15 48 16 32 26 30 C 32 30 35 38 28 44 Z"
                fill="#D48648"
                className="animate-breeze origin-bottom"
              />
              {/* Body */}
              <ellipse cx="50" cy="52" rx="28" ry="19" fill="#D48648" />
              <ellipse cx="56" cy="56" rx="16" ry="12" fill="#FFF8F0" />
              {/* Head */}
              <circle cx="68" cy="35" r="17" fill="#D48648" />
              {/* White muzzle & cheek marks */}
              <ellipse cx="68" cy="41" rx="11" ry="8" fill="#FFF8F0" />
              {/* Triangular Ears */}
              <polygon points="58,26 63,12 69,24" fill="#A85E2C" />
              <polygon points="60,24 63,15 67,23" fill="#FFF8F0" />
              <polygon points="71,24 77,12 82,26" fill="#A85E2C" />
              <polygon points="73,23 77,15 80,24" fill="#FFF8F0" />
              {/* Eyebrow dots (iconic Shiba) */}
              <circle cx="63" cy="28" r="1.8" fill="#FFF8F0" />
              <circle cx="73" cy="28" r="1.8" fill="#FFF8F0" />
              {/* Eyes */}
              <circle cx="64" cy="33" r="2.2" fill="#2E241E" />
              <circle cx="64.8" cy="32.2" r="0.7" fill="#FFF" />
              <circle cx="72" cy="33" r="2.2" fill="#2E241E" />
              <circle cx="72.8" cy="32.2" r="0.7" fill="#FFF" />
              {/* Black Snout */}
              <ellipse cx="68" cy="38" rx="2.5" ry="1.8" fill="#2E241E" />
            </svg>
          </div>
        )}

        {petType === 'garden_rabbit' && (
          <div className="relative h-24 w-24 drop-shadow-md">
            {/* Garden Rabbit */}
            <svg viewBox="0 0 90 80" className="h-full w-full">
              <ellipse cx="45" cy="72" rx="30" ry="6" fill="rgba(60, 45, 30, 0.15)" />
              {/* Fluffy tail */}
              <circle cx="20" cy="54" r="7" fill="#FDFBF7" />
              {/* Body */}
              <ellipse cx="46" cy="54" rx="26" ry="18" fill="#E8DED1" />
              {/* Head */}
              <circle cx="62" cy="40" r="15" fill="#E8DED1" />
              {/* Long Ears */}
              <ellipse cx="58" cy="18" rx="4.5" ry="15" fill="#E8DED1" transform="rotate(-12 58 18)" />
              <ellipse cx="58" cy="18" rx="2.5" ry="11" fill="#F7C4BC" transform="rotate(-12 58 18)" />
              <ellipse cx="68" cy="19" rx="4.5" ry="15" fill="#E8DED1" transform="rotate(8 68 19)" />
              <ellipse cx="68" cy="19" rx="2.5" ry="11" fill="#F7C4BC" transform="rotate(8 68 19)" />
              {/* Eye */}
              <ellipse cx="67" cy="38" rx="2.5" ry="3" fill="#8C3F4D" />
              <circle cx="67.7" cy="37.2" r="0.8" fill="#FFF" />
              {/* Pink Nose & Whiskers */}
              <circle cx="73" cy="42" r="1.5" fill="#F7AFA6" />
              <line x1="72" y1="44" x2="80" y2="44" stroke="#B0A092" strokeWidth="0.8" />
              <line x1="72" y1="46" x2="79" y2="48" stroke="#B0A092" strokeWidth="0.8" />
            </svg>
          </div>
        )}
      </div>

      {/* Pet Name Plate */}
      <div className="mt-1 text-center font-serif text-xs font-semibold tracking-wide text-amber-950/80">
        {petName}
      </div>
    </div>
  );
}
