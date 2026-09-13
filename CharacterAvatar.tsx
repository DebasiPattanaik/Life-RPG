'use client';

import React from 'react';
import { CharacterStyle } from '@/lib/rpgTypes';

interface CharacterAvatarProps {
  style: CharacterStyle;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function CharacterAvatar({
  style,
  className = '',
  size = 'md',
}: CharacterAvatarProps) {
  const sizeMap = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
    xl: 'h-36 w-36',
  };

  return (
    <div className={`relative flex items-center justify-center select-none ${sizeMap[size]} ${className}`}>
      {style === 'female_traveler' ? (
        // Sophie / Ghibli Countryside Girl Traveler (braid/bob, ribbon, linen tunic)
        <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow">
          <circle cx="50" cy="50" r="46" fill="#F4EDE4" stroke="#D5C5B2" strokeWidth="2" />
          {/* Hair back */}
          <ellipse cx="50" cy="46" rx="26" ry="24" fill="#6B4423" />
          <circle cx="28" cy="62" r="10" fill="#6B4423" />
          <circle cx="72" cy="62" r="10" fill="#6B4423" />
          {/* Linen Capelet */}
          <path d="M 28 88 Q 50 68 72 88 L 74 94 L 26 94 Z" fill="#7D9675" />
          <circle cx="50" cy="74" r="3" fill="#E8A74A" />
          {/* Face */}
          <ellipse cx="50" cy="48" rx="18" ry="17" fill="#FFE8D6" />
          {/* Eyes */}
          <ellipse cx="43" cy="48" rx="2.5" ry="3.5" fill="#3D2B1F" />
          <circle cx="44" cy="47" r="1" fill="#FFF" />
          <ellipse cx="57" cy="48" rx="2.5" ry="3.5" fill="#3D2B1F" />
          <circle cx="58" cy="47" r="1" fill="#FFF" />
          {/* Gentle Smile & Cheeks */}
          <ellipse cx="38" cy="52" rx="2.5" ry="1.5" fill="#FCA5A5" opacity="0.6" />
          <ellipse cx="62" cy="52" rx="2.5" ry="1.5" fill="#FCA5A5" opacity="0.6" />
          <path d="M 47 54 Q 50 57 53 54" stroke="#8A4B38" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          {/* Hair bangs */}
          <path d="M 32 40 Q 50 28 68 40 Q 64 30 50 30 Q 36 30 32 40 Z" fill="#6B4423" />
          {/* Straw Hat with red ribbon */}
          <ellipse cx="50" cy="28" rx="34" ry="7" fill="#E4C183" stroke="#BA9554" strokeWidth="1" />
          <ellipse cx="50" cy="24" rx="20" ry="10" fill="#E4C183" stroke="#BA9554" strokeWidth="1" />
          <path d="M 30 27 Q 50 22 70 27" stroke="#C4483C" strokeWidth="3" fill="none" />
        </svg>
      ) : (
        // Howl / Ashitaka Countryside Boy Traveler (traveling coat, headband, short warm brown hair)
        <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow">
          <circle cx="50" cy="50" r="46" fill="#F4EDE4" stroke="#D5C5B2" strokeWidth="2" />
          {/* Hair back */}
          <circle cx="50" cy="44" r="25" fill="#3A281E" />
          {/* Coat collar */}
          <path d="M 28 88 Q 50 68 72 88 L 74 94 L 26 94 Z" fill="#4B6E7D" />
          <path d="M 50 72 L 50 94" stroke="#E8A74A" strokeWidth="2" />
          {/* Face */}
          <ellipse cx="50" cy="48" rx="18" ry="17" fill="#FFE8D6" />
          {/* Eyes */}
          <ellipse cx="43" cy="48" rx="2.5" ry="3.2" fill="#293628" />
          <circle cx="44" cy="47" r="0.9" fill="#FFF" />
          <ellipse cx="57" cy="48" rx="2.5" ry="3.2" fill="#293628" />
          <circle cx="58" cy="47" r="0.9" fill="#FFF" />
          {/* Cheeks & Confident Gentle Smile */}
          <ellipse cx="38" cy="52" rx="2.5" ry="1.5" fill="#FCA5A5" opacity="0.5" />
          <ellipse cx="62" cy="52" rx="2.5" ry="1.5" fill="#FCA5A5" opacity="0.5" />
          <path d="M 46 54 Q 50 56.5 54 54" stroke="#8A4B38" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          {/* Boyish bangs */}
          <path d="M 32 38 L 40 44 L 46 36 L 54 44 L 60 36 L 68 40 Q 50 26 32 38 Z" fill="#3A281E" />
          {/* Forest green traveler headband */}
          <path d="M 29 36 Q 50 28 71 36" stroke="#5E7D59" strokeWidth="3" fill="none" />
        </svg>
      )}
    </div>
  );
}
