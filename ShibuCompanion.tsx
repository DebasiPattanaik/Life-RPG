'use client';

import React, { useState, useEffect } from 'react';
import { sounds } from '@/lib/soundEffects';

interface ShibuCompanionProps {
  onInteract?: () => void;
  isCelebrating?: boolean;
  className?: string;
}

export default function ShibuCompanion({
  onInteract,
  isCelebrating = false,
  className = '',
}: ShibuCompanionProps) {
  const [posX, setPosX] = useState(20); // percentage across width
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWaggling, setIsWaggling] = useState(true);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);

  // Random gentle wandering across the screen
  useEffect(() => {
    const wanderInterval = setInterval(() => {
      // 30% chance to trot to a new spot
      if (Math.random() < 0.4) {
        const targetX = Math.floor(Math.random() * 70) + 10;
        setFacingLeft(targetX < posX);
        setPosX(targetX);
        setIsWaggling(true);
      }
    }, 6000);

    return () => clearInterval(wanderInterval);
  }, [posX]);

  // Handle celebration reaction
  useEffect(() => {
    if (isCelebrating) {
      setSpeechBubble('Woof! Good job! 🌟');
      sounds.playPetJoy();
      const timer = setTimeout(() => setSpeechBubble(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [isCelebrating]);

  const handleClick = (e: React.MouseEvent) => {
    sounds.playPetJoy();
    const greetings = ['*Happy waggle!*', 'Woof! 🐾', '*Nuzzles your hand*', 'You did it! ✨'];
    setSpeechBubble(greetings[Math.floor(Math.random() * greetings.length)]);
    setTimeout(() => setSpeechBubble(null), 2500);

    const rect = e.currentTarget.getBoundingClientRect();
    const newHeart = {
      id: Date.now(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setHearts((prev) => [...prev.slice(-4), newHeart]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1200);

    if (onInteract) onInteract();
  };

  return (
    <div
      style={{ left: `${posX}%` }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Your faithful Shibu companion. Click to pet!"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent);
        }
      }}
      className={`absolute bottom-3 z-30 transition-all duration-1000 ease-in-out cursor-pointer select-none ${className}`}
    >
      {/* Speech Bubble */}
      {speechBubble && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/95 text-[#4A321E] px-3 py-1 rounded-full text-xs font-bold shadow-md border border-amber-300 animate-token-drop">
          {speechBubble}
        </div>
      )}

      {/* Floating Hearts */}
      {hearts.map((h) => (
        <span
          key={h.id}
          style={{ left: h.x, top: h.y }}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-8 animate-bounce text-base font-bold text-rose-500"
        >
          ❤️
        </span>
      ))}

      {/* Shiba Illustration with Waggle Animation */}
      <div
        className={`relative w-28 h-24 drop-shadow-xl transition-transform duration-300 ${
          facingLeft ? 'scale-x-[-1]' : ''
        } ${isCelebrating ? 'scale-110' : ''}`}
      >
        <svg viewBox="0 0 100 80" className="h-full w-full">
          {/* Shadow */}
          <ellipse cx="50" cy="74" rx="36" ry="6" fill="rgba(50, 35, 20, 0.2)" />

          {/* Waggling Curled Tail */}
          <g className={isWaggling ? 'animate-breeze origin-bottom' : ''}>
            <path
              d="M 22 56 C 12 50 14 32 26 30 C 33 30 36 38 29 45 Z"
              fill="#D48648"
              stroke="#A85E2C"
              strokeWidth="1.2"
            />
            <ellipse cx="26" cy="38" rx="5" ry="3" fill="#FFF8F0" />
          </g>

          {/* Body */}
          <ellipse cx="50" cy="53" rx="28" ry="19" fill="#D48648" />
          <ellipse cx="56" cy="57" rx="16" ry="12" fill="#FFF8F0" />

          {/* Front & Back Paws */}
          <ellipse cx="40" cy="68" rx="6" ry="4" fill="#FFF8F0" stroke="#C4783B" strokeWidth="0.8" />
          <ellipse cx="64" cy="68" rx="6" ry="4" fill="#FFF8F0" stroke="#C4783B" strokeWidth="0.8" />

          {/* Head */}
          <circle cx="68" cy="36" r="17" fill="#D48648" />
          <ellipse cx="68" cy="42" rx="11" ry="8" fill="#FFF8F0" />

          {/* Triangular Perked Ears */}
          <polygon points="57,27 63,12 69,25" fill="#A85E2C" />
          <polygon points="59,25 63,15 67,24" fill="#FFF8F0" />
          <polygon points="71,25 77,12 83,27" fill="#A85E2C" />
          <polygon points="73,24 77,15 81,25" fill="#FFF8F0" />

          {/* Shiba Eyebrow Dots */}
          <circle cx="63" cy="28" r="1.8" fill="#FFF8F0" />
          <circle cx="73" cy="28" r="1.8" fill="#FFF8F0" />

          {/* Happy Eyes */}
          {isCelebrating ? (
            <>
              <path d="M 61 34 Q 64 30 67 34" stroke="#2E241E" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              <path d="M 70 34 Q 73 30 76 34" stroke="#2E241E" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="64" cy="34" r="2.2" fill="#2E241E" />
              <circle cx="64.8" cy="33.2" r="0.8" fill="#FFF" />
              <circle cx="72" cy="34" r="2.2" fill="#2E241E" />
              <circle cx="72.8" cy="33.2" r="0.8" fill="#FFF" />
            </>
          )}

          {/* Snout & Smiling Mouth */}
          <ellipse cx="68" cy="39" rx="2.5" ry="1.8" fill="#2E241E" />
          <path d="M 65 43 Q 68 46 71 43" stroke="#2E241E" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M 68 41 L 68 43" stroke="#2E241E" strokeWidth="1" />

          {/* Red Collar with Golden Bell */}
          <path d="M 57 48 Q 68 53 79 48" stroke="#C4483C" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="68" cy="52" r="2.5" fill="#E8B033" stroke="#A87A18" strokeWidth="0.6" />
        </svg>
      </div>

      {/* Name Tag */}
      <div className="text-center font-serif text-[11px] font-bold text-amber-950/80 -mt-1 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200/60 shadow-2xs">
        Shibu 🐾
      </div>
    </div>
  );
}
