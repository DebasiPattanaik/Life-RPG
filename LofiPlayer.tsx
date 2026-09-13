'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Volume1,
  VolumeX,
  Radio,
  ListMusic,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

export interface LofiSong {
  id: string;
  number: number;
  name: string;
  artist_name: string;
  duration: string;
  mood: string;
  audio: string;
}

// Exactly 6 Curated Cottage Lo-Fi Songs with full metadata
export const SIX_COTTAGE_LOFI_SONGS: LofiSong[] = [
  {
    id: 'lofi-track-1',
    number: 1,
    name: 'Autumn Rain & Warm Chai',
    artist_name: 'Komorebi Chill',
    duration: '2:45',
    mood: '🍵 Warm Hearth',
    audio: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
  },
  {
    id: 'lofi-track-2',
    number: 2,
    name: 'Cedar Bookshelf Whispers',
    artist_name: 'Mellow Study Collective',
    duration: '3:12',
    mood: '📚 Cozy Study',
    audio: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=spirit-blossom-15285.mp3',
  },
  {
    id: 'lofi-track-3',
    number: 3,
    name: 'Sleeping Shiba by the Stove',
    artist_name: 'Ghibli Slumber Beats',
    duration: '2:35',
    mood: '🐕 Slumbering Calm',
    audio: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=lofi-chill-medium-version-159456.mp3',
  },
  {
    id: 'lofi-track-4',
    number: 4,
    name: 'Solitary Lantern & Maple Drift',
    artist_name: 'Autumn Wanderer',
    duration: '3:04',
    mood: '🍂 Golden Twilight',
    audio: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_db6591201e.mp3?filename=lofi-acoustic-guitar-ambient-111533.mp3',
  },
  {
    id: 'lofi-track-5',
    number: 5,
    name: 'Midnight Cocoa & Starlight',
    artist_name: 'Ember Rest',
    duration: '2:55',
    mood: '✨ Starlit Night',
    audio: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_82b9b73461.mp3?filename=relaxing-chill-lofi-10508.mp3',
  },
  {
    id: 'lofi-track-6',
    number: 6,
    name: 'Wisteria Breeze & Gentle Keys',
    artist_name: 'Pastoral Reverie',
    duration: '3:20',
    mood: '🌸 Veranda Drift',
    audio: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_9549cd9783.mp3?filename=lofi-piano-melody-125026.mp3',
  },
];

export default function LofiPlayer() {
  const [songs, setSongs] = useState<LofiSong[]>(SIX_COTTAGE_LOFI_SONGS);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(true); // Open by default for immediate visibility
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [progressPercent, setProgressPercent] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthAudioCtxRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Optional Jamendo API sync for live tags
  useEffect(() => {
    const fetchJamendoLofi = async () => {
      const clientId =
        process.env.NEXT_PUBLIC_JAMENDO_CLIENT_ID ||
        process.env.JAMENDO_CLIENT_ID ||
        '56d30c95';

      try {
        const res = await fetch(
          `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&tags=lofi&limit=6&audioformat=mp32&order=popularity_total`
        );
        const data = await res.json();

        if (data && data.results && data.results.length >= 6) {
          const jamendoSongs: LofiSong[] = data.results.slice(0, 6).map((t: { id: string; name: string; artist_name: string; audio: string; duration?: number }, idx: number) => ({
            id: `jamendo-${t.id}`,
            number: idx + 1,
            name: t.name || SIX_COTTAGE_LOFI_SONGS[idx].name,
            artist_name: t.artist_name || SIX_COTTAGE_LOFI_SONGS[idx].artist_name,
            duration: t.duration ? `${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, '0')}` : SIX_COTTAGE_LOFI_SONGS[idx].duration,
            mood: SIX_COTTAGE_LOFI_SONGS[idx].mood,
            audio: t.audio || SIX_COTTAGE_LOFI_SONGS[idx].audio,
          }));

          setSongs(jamendoSongs);
        }
      } catch {
        // Retain the 6 curated fallback tracks
      }
    };

    fetchJamendoLofi();
  }, []);

  const currentSong = songs[currentSongIndex] || SIX_COTTAGE_LOFI_SONGS[0];
  const isPlayingRef = useRef(isPlaying);

  // Keep isPlayingRef updated to prevent stale closures
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Stop synthetic audio if playing
  const stopSynth = useCallback(() => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    if (synthAudioCtxRef.current && synthAudioCtxRef.current.state === 'running') {
      try {
        synthAudioCtxRef.current.suspend();
      } catch {
        // Safe ignore
      }
    }
  }, []);

  // Ambient Web Audio synth fallback (soothing Lo-Fi piano chords) if audio stream blocked
  const playSynthFallback = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!synthAudioCtxRef.current) {
        synthAudioCtxRef.current = new AudioCtx();
      }
      const ctx = synthAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      stopSynth();

      // Lo-Fi chord progression frequencies: Cmaj7 -> Am7 -> Dm7 -> G7
      const chords = [
        [261.63, 329.63, 392.0, 493.88], // Cmaj7
        [220.0, 261.63, 329.63, 392.0],  // Am7
        [146.83, 220.0, 261.63, 349.23], // Dm7
        [196.0, 246.94, 293.66, 349.23], // G7
      ];
      let chordIdx = 0;

      const playChord = () => {
        if (!isPlayingRef.current) return;
        const now = ctx.currentTime;
        const notes = chords[chordIdx % chords.length];
        chordIdx++;

        notes.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);

          // Warm lo-fi low-pass filter
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, now);

          const curVol = isMuted ? 0 : volume * 0.15;
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(curVol, now + 0.3);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 2.5);
        });
      };

      playChord();
      synthIntervalRef.current = setInterval(playChord, 2600);
    } catch {
      // AudioContext unavailable
    }
  }, [isMuted, stopSynth, volume]);

  // Sync volume with HTML5 audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Robust Play / Pause Toggle
  const togglePlay = useCallback(() => {
    setHasUserInteracted(true);
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying || !audio.paused) {
      // Pause immediately and halt any sound
      stopSynth();
      audio.pause();
      setIsPlaying(false);
    } else {
      stopSynth();
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            if (err.name === 'AbortError') {
              setIsPlaying(false);
              return;
            }
            console.warn('Direct stream blocked, activating ambient lo-fi synth:', err);
            setIsPlaying(true);
            playSynthFallback();
          });
      }
    }
  }, [isPlaying, playSynthFallback, stopSynth]);

  // Handle Next Song (Cycles through 6 songs)
  const handleNext = useCallback(() => {
    setHasUserInteracted(true);
    setCurrentSongIndex((prev) => (prev + 1) % songs.length);
    setIsPlaying(true);
  }, [songs.length]);

  // Handle Previous Song
  const handlePrev = useCallback(() => {
    setHasUserInteracted(true);
    setCurrentSongIndex((prev) => (prev - 1 + songs.length) % songs.length);
    setIsPlaying(true);
  }, [songs.length]);

  // Allow direct selection of ANY of the 6 songs
  const handleSelectSong = (index: number) => {
    setHasUserInteracted(true);
    if (currentSongIndex === index) {
      // Toggle play/pause if clicking currently selected song
      togglePlay();
      return;
    }
    setCurrentSongIndex(index);
    setIsPlaying(true);
  };

  // Play newly selected song cleanly without double-call race conditions
  useEffect(() => {
    if (!hasUserInteracted || !audioRef.current) return;
    const audio = audioRef.current;
    stopSynth();

    audio.src = currentSong.audio;
    audio.currentTime = 0;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            if (err.name === 'AbortError') {
              setIsPlaying(false);
              return;
            }
            setIsPlaying(true);
            playSynthFallback();
          });
      }
    }
  }, [currentSongIndex, currentSong.audio, hasUserInteracted]);

  // Track progress and duration updates
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration || 1;
    const mins = Math.floor(current / 60);
    const secs = Math.floor(current % 60);
    setCurrentTime(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    setProgressPercent((current / duration) * 100);
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-2 rounded-2xl bg-[#1F150E]/95 backdrop-blur-md border border-amber-500/40 shadow-2xl overflow-hidden text-[#F5EBE1] transition-all">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={currentSong.audio}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
        onPlay={() => setIsPlaying(true)}
        onPause={() => {
          setIsPlaying(false);
          stopSynth();
        }}
        onError={() => {
          if (isPlayingRef.current) {
            playSynthFallback();
          }
        }}
      />

      {/* Main Visible Player Bar */}
      <div className="p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 border-b border-amber-900/40">
        {/* Left: Rotating Vinyl Disc + Active Song Metadata */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Animated Spinning Vinyl Record */}
          <div className="relative shrink-0 flex items-center justify-center cursor-pointer" onClick={togglePlay}>
            <div
              className={`h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-black border-2 border-stone-800 shadow-xl flex items-center justify-center transition-all ${
                isPlaying ? 'animate-spin' : ''
              }`}
              style={{
                animationDuration: '3.5s',
                animationTimingFunction: 'linear',
                animationPlayState: isPlaying ? 'running' : 'paused',
                background: 'radial-gradient(circle, #252525 0%, #111 45%, #050505 75%, #1f1f1f 100%)',
                boxShadow: isPlaying ? '0 0 18px rgba(245, 158, 11, 0.45)' : 'none',
              }}
              title={isPlaying ? 'Click to Pause' : 'Click to Play'}
            >
              {/* Concentric Vinyl Grooves */}
              <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-full border border-stone-700/60 flex items-center justify-center">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-stone-800/80 flex items-center justify-center">
                  {/* Center Sticker Label */}
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-amber-600 border border-amber-300 flex items-center justify-center shadow-inner">
                    <div className="h-1.5 w-1.5 rounded-full bg-black" />
                  </div>
                </div>
              </div>
            </div>

            {/* Needle Tone Arm Indicator */}
            <div
              className={`absolute -top-1 -right-1 w-3.5 h-6 border-r-2 border-t-2 border-amber-400 rounded-tr origin-bottom-right transition-transform duration-500 pointer-events-none ${
                isPlaying ? 'rotate-12' : '-rotate-15 opacity-60'
              }`}
            />
          </div>

          {/* Active Song Information */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                <Radio className={`h-3 w-3 ${isPlaying ? 'animate-pulse text-amber-400' : 'text-amber-500/70'}`} />
                Song {currentSong.number} of 6
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-900/60 text-amber-200/70 border border-amber-900/40 font-medium">
                {currentSong.mood}
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-bold text-amber-100 truncate mt-1">
              {currentSong.name}
            </h4>
            <p className="text-xs text-amber-200/70 truncate flex items-center gap-1.5">
              <span>{currentSong.artist_name}</span>
              <span>•</span>
              <span className="text-amber-300/80 font-mono text-[11px]">
                {currentTime} / {currentSong.duration}
              </span>
            </p>
          </div>
        </div>

        {/* Center / Right: Playback Buttons & Volume Controls */}
        <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4 w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap">
          {/* Controls: Prev, Play/Pause, Next */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="p-2 rounded-xl bg-[#2C1D14] hover:bg-[#3D281C] text-amber-200 border border-amber-800/60 transition-all hover:scale-105 active:scale-95 shadow-sm"
              title="Previous Song (1-6)"
              aria-label="Previous Song"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-amber-500 hover:bg-amber-400 text-amber-950 flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 font-bold cursor-pointer border border-amber-300"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-amber-950" />
              ) : (
                <Play className="h-5 w-5 fill-amber-950 ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="p-2 rounded-xl bg-[#2C1D14] hover:bg-[#3D281C] text-amber-200 border border-amber-800/60 transition-all hover:scale-105 active:scale-95 shadow-sm"
              title="Next Song (1-6)"
              aria-label="Next Song"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          {/* Volume Slider & Mute Toggle */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#2C1D14] border border-amber-800/60">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 rounded-lg text-amber-200/80 hover:text-amber-100 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4 text-rose-400" />
              ) : volume < 0.5 ? (
                <Volume1 className="h-4 w-4 text-amber-300" />
              ) : (
                <Volume2 className="h-4 w-4 text-amber-300" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-16 sm:w-20 h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-amber-500"
              title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              aria-label="Lo-Fi Music Volume"
            />
          </div>

          {/* Toggle 6 Songs Playlist Button */}
          <button
            type="button"
            onClick={() => setIsPlaylistOpen(!isPlaylistOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
              isPlaylistOpen
                ? 'bg-amber-500 text-amber-950 border-amber-300'
                : 'bg-[#2C1D14] text-amber-200 border-amber-800/60 hover:bg-[#3D281C]'
            }`}
            title="Toggle 6 Songs List"
          >
            <ListMusic className="h-4 w-4" />
            <span className="hidden sm:inline">6 Songs</span>
            {isPlaylistOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar under main player */}
      <div className="w-full bg-black/40 h-1">
        <div
          className="bg-gradient-to-r from-amber-600 to-amber-400 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Visible Responsive 6 Songs Selector Grid */}
      {isPlaylistOpen && (
        <div className="p-3 sm:p-4 bg-[#180F0A]/80 border-t border-amber-900/40">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-serif font-bold text-amber-200 uppercase tracking-wider">
                Select Any of the 6 Cottage Lo-Fi Songs:
              </span>
            </div>
            <span className="text-[11px] text-amber-300/70 font-medium">
              Click any song to play
            </span>
          </div>

          {/* 6 Songs Grid: Responsive (1 col mobile, 2 cols tablet, 3 cols desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {songs.map((song, idx) => {
              const isSelected = idx === currentSongIndex;

              return (
                <div
                  key={song.id}
                  onClick={() => handleSelectSong(idx)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 group ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400/90 shadow-md ring-1 ring-amber-400/60'
                      : 'bg-[#241710]/80 border-amber-900/40 hover:bg-[#322016] hover:border-amber-700/60'
                  }`}
                  title={`Play "${song.name}" by ${song.artist_name}`}
                >
                  {/* Track Number / Playing Icon */}
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-amber-500 text-amber-950 font-black'
                        : 'bg-[#180E08] text-amber-300/80 border border-amber-900/50 group-hover:border-amber-500/50'
                    }`}
                  >
                    {isSelected && isPlaying ? (
                      <span className="flex items-end gap-0.5 h-3.5">
                        <span className="w-0.5 h-3 bg-amber-950 animate-pulse" />
                        <span className="w-0.5 h-2 bg-amber-950 animate-pulse delay-75" />
                        <span className="w-0.5 h-3.5 bg-amber-950 animate-pulse delay-150" />
                      </span>
                    ) : (
                      `#${song.number}`
                    )}
                  </div>

                  {/* Song Title & Artist */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-bold truncate ${
                        isSelected ? 'text-amber-200' : 'text-stone-200 group-hover:text-amber-100'
                      }`}
                    >
                      {song.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-amber-200/60 truncate">
                        {song.artist_name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 text-amber-300/80 font-mono">
                        {song.duration}
                      </span>
                    </div>
                  </div>

                  {/* Mood Tag or Play Prompt */}
                  <div className="shrink-0 text-right">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                        isSelected
                          ? 'bg-amber-400/30 text-amber-200 border-amber-400/50'
                          : 'bg-black/30 text-amber-200/60 border-amber-900/30 group-hover:text-amber-200'
                      }`}
                    >
                      {isSelected ? (isPlaying ? 'Playing' : 'Paused') : song.mood}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

