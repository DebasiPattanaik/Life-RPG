'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, Compass } from 'lucide-react';
import 'pannellum/build/pannellum.css';

// High-speed local cached asset with 0ms buffering, fallback to remote
const PANORAMA_URL = '/panoramas/cottage.png';

interface PanoramaViewerProps {
  className?: string;
}

export default function PanoramaViewer({
  className = '',
}: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerInstance = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    const initPannellum = async () => {
      try {
        if (typeof window === 'undefined') return;

        // Dynamically load pannellum client-side
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await import('pannellum/build/pannellum.js' as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pannellum = (window as any).pannellum;

        if (!pannellum || !isMounted || !containerRef.current) return;

        if (viewerInstance.current) {
          try {
            viewerInstance.current.destroy();
          } catch {
            // Teardown
          }
        }

        // Pure, fast, butter-smooth 360 WebGL Panorama (No Hotspot Overhead)
        viewerInstance.current = pannellum.viewer(containerRef.current, {
          type: 'equirectangular',
          panorama: PANORAMA_URL,
          autoLoad: true,
          autoRotate: -0.4, // Gentle breathing ambient drift when idle
          autoRotateInactivityDelay: 2500, // Resumes drift after 2.5s
          friction: 0.15, // Silky smooth inertia glide
          compass: false,
          showZoomCtrl: false,
          showFullscreenCtrl: false,
          mouseZoom: true,
          touchPan: true,
          pitch: 0,
          yaw: 0,
          hfov: 95,
          minHfov: 45,
          maxHfov: 115,
          hotSpots: [], // Zero object interactiveness overhead for maximum speed
        });

        viewerInstance.current.on('load', () => {
          if (isMounted) setIsLoading(false);
        });

        viewerInstance.current.on('error', () => {
          // Fallback to remote if local has any issue
          if (viewerInstance.current) {
            viewerInstance.current.loadScene(
              'https://i.postimg.cc/CKtDTLV0/panorama-f5380397-11a3-46d2-acee-938c24c5da94.png'
            );
          }
        });
      } catch (err) {
        console.error('Failed to initialize Pannellum viewer:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    initPannellum();

    return () => {
      isMounted = false;
      if (viewerInstance.current) {
        try {
          viewerInstance.current.destroy();
        } catch {
          // Teardown
        }
      }
    };
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    setTimeout(() => {
      if (viewerInstance.current) {
        viewerInstance.current.resize();
      }
    }, 200);
  };

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border-2 border-amber-900/60 bg-[#17110C] shadow-2xl transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'w-full h-full min-h-[460px] sm:min-h-[560px]'
      } ${className}`}
    >
      {/* Native Pannellum WebGL Container */}
      <div
        ref={containerRef}
        className="w-full h-full min-h-[460px] sm:min-h-[560px]"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#17110C]/90 backdrop-blur-md">
          <div className="h-10 w-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-serif font-bold text-amber-200">
            Rendering 360° Ghibli Cottage...
          </p>
        </div>
      )}

      {/* Top Floating Bar: Status & Fullscreen Button */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        <div className="bg-[#17110C]/80 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-amber-500/30 text-amber-100 shadow-md flex items-center gap-2 pointer-events-auto">
          <Compass className="h-4 w-4 text-amber-400 animate-spin-slow" />
          <span className="font-serif text-xs font-bold tracking-wide">
            360° Cottage Walkthrough
          </span>
          <span className="hidden sm:inline-block text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold">
            Drag to Look Around
          </span>
        </div>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="pointer-events-auto bg-[#17110C]/80 hover:bg-[#241710] text-amber-200 p-2 rounded-xl border border-amber-500/30 shadow-md transition-colors cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen 360°'}
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen 360°'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}


