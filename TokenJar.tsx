'use client';

import React, { useState } from 'react';
import { sounds } from '@/lib/soundEffects';

interface TokenJarProps {
  tokensInJar: number;
  onCollect: () => void;
  isReceivingToken?: boolean;
}

export default function TokenJar({
  tokensInJar,
  onCollect,
  isReceivingToken = false,
}: TokenJarProps) {
  const [isCollecting, setIsCollecting] = useState(false);

  const handleJarClick = () => {
    if (tokensInJar <= 0) {
      sounds.playJarClink();
      return;
    }
    sounds.playLevelUp();
    setIsCollecting(true);
    setTimeout(() => {
      onCollect();
      setIsCollecting(false);
    }, 600);
  };

  return (
    <div
      onClick={handleJarClick}
      role="button"
      tabIndex={0}
      aria-label={`Antique Token Jar holding ${tokensInJar} golden tokens. Click to collect.`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleJarClick();
        }
      }}
      className="group relative flex flex-col items-center cursor-pointer select-none transition-transform hover:scale-105 active:scale-95"
    >
      {/* Floating Prompt Badge */}
      <div className="absolute -top-8 whitespace-nowrap rounded-full bg-amber-900/90 px-2.5 py-0.5 text-[11px] font-medium text-amber-100 shadow-md transition-all duration-200 group-hover:scale-105">
        {tokensInJar > 0 ? (
          <span className="flex items-center gap-1 font-semibold">
            ✨ {tokensInJar} {tokensInJar === 1 ? 'Token' : 'Tokens'} Ready!
          </span>
        ) : (
          <span className="text-amber-200/80">Empty Jar • Awaiting rituals</span>
        )}
      </div>

      {/* Glass Jar SVG */}
      <div className={`relative h-24 w-20 drop-shadow-lg ${tokensInJar > 0 ? 'animate-jar-shine' : ''}`}>
        <svg viewBox="0 0 80 100" className="h-full w-full">
          {/* Cork Stopper */}
          <polygon points="26,16 54,16 50,6 30,6" fill="#A87A51" stroke="#7A5333" strokeWidth="1.2" />
          <line x1="32" y1="11" x2="48" y2="11" stroke="#7A5333" strokeWidth="0.8" opacity="0.6" />

          {/* Jar Rim */}
          <rect x="23" y="16" width="34" height="6" rx="3" fill="#D7E9EB" stroke="#8CA8AB" strokeWidth="1.2" opacity="0.85" />

          {/* Jar Glass Body */}
          <path
            d="M 24 22 C 24 26 14 30 14 42 L 14 86 C 14 94 20 96 40 96 C 60 96 66 94 66 86 L 66 42 C 66 30 56 26 56 22 Z"
            fill="rgba(235, 247, 248, 0.45)"
            stroke="#95B6B9"
            strokeWidth="1.5"
          />

          {/* Glass Highlight Reflections */}
          <path
            d="M 18 42 L 18 84 C 18 88 20 90 26 91"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.75"
          />
          <path
            d="M 60 40 L 60 60"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* Golden Star Tokens stacked inside */}
          {tokensInJar > 0 && (
            <g className={isCollecting ? 'opacity-20 transition-opacity' : ''}>
              {/* Token 1 */}
              <circle cx="34" cy="85" r="7" fill="#F5C042" stroke="#C48E1D" strokeWidth="1" />
              <circle cx="34" cy="85" r="4.5" fill="#FFD768" />
              <text x="34" y="87.5" fontSize="7" textAnchor="middle" fill="#8C5C00" fontWeight="bold">★</text>

              {/* Token 2 */}
              {tokensInJar >= 2 && (
                <>
                  <circle cx="46" cy="84" r="7" fill="#E8B033" stroke="#C48E1D" strokeWidth="1" />
                  <circle cx="46" cy="84" r="4.5" fill="#FFD768" />
                  <text x="46" y="86.5" fontSize="7" textAnchor="middle" fill="#8C5C00" fontWeight="bold">★</text>
                </>
              )}

              {/* Token 3 */}
              {tokensInJar >= 3 && (
                <>
                  <circle cx="39" cy="74" r="7" fill="#FAD161" stroke="#C48E1D" strokeWidth="1" />
                  <circle cx="39" cy="74" r="4.5" fill="#FFF099" />
                  <text x="39" y="76.5" fontSize="7" textAnchor="middle" fill="#8C5C00" fontWeight="bold">★</text>
                </>
              )}

              {/* Token 4+ Overflow Indicator */}
              {tokensInJar >= 4 && (
                <>
                  <circle cx="28" cy="72" r="6" fill="#F5C042" stroke="#C48E1D" strokeWidth="1" />
                  <circle cx="50" cy="71" r="6" fill="#E8B033" stroke="#C48E1D" strokeWidth="1" />
                  {tokensInJar > 5 && (
                    <text x="40" y="60" fontSize="9" textAnchor="middle" fill="#784400" fontWeight="bold">
                      +{tokensInJar - 5}
                    </text>
                  )}
                </>
              )}
            </g>
          )}

          {/* Animated Dropping Token */}
          {isReceivingToken && (
            <g className="animate-token-drop">
              <circle cx="40" cy="35" r="8" fill="#FFE066" stroke="#E6A23C" strokeWidth="1.2" />
              <text x="40" y="38" fontSize="8" textAnchor="middle" fill="#8C5C00" fontWeight="bold">★</text>
            </g>
          )}
        </svg>
      </div>

      {/* Wooden Mantel Shelf Base */}
      <div className="mt-0.5 h-2 w-24 rounded-full bg-[#7D5432] shadow-md border-t border-[#A87A51]" />
      <div className="text-[11px] font-medium text-amber-950/70 tracking-wide mt-1">
        Glass Token Jar
      </div>
    </div>
  );
}
