'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Flame,
  Volume2,
  VolumeX,
  ListTodo,
  LogOut,
  X
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PanoramaViewer from '@/components/cottage/PanoramaViewer';
import LofiPlayer from '@/components/music/LofiPlayer';
import CottageQuestBoard from '@/components/quest/CottageQuestBoard';
import { CottageQuestItem, COTTAGE_QUEST_CATEGORIES, DEFAULT_ACTIVE_QUEST_IDS } from '@/lib/cottageQuests';
import {
  getLevelFromXp,
  calculateStreakMultiplier,
  mapCategoryToAttribute,
  CharacterState
} from '@/lib/rpgEngine';
import { useAuth } from '@/context/AuthContext';
import { sounds } from '@/lib/soundEffects';
import { completeUserQuest } from '@/lib/rpgDatabase';

export default function PanoramaCottageDashboardPage() {
  const { signOut, profile, user, quests, refreshQuests, refreshProfile, updateProfile } = useAuth();

  const [character, setCharacter] = useState<CharacterState>({
    id: profile?.id || 'traveler-1',
    username: profile?.username || 'Cottage Wanderer',
    total_xp: profile?.xp ?? 0,
    currency: profile?.gold ?? 50, // Windfall Petals
    current_streak: profile?.streak_count ?? 1, // Ember Trail
    longest_streak: profile?.longest_streak ?? profile?.streak_count ?? 0,
    last_active_date: profile?.last_active_date || new Date().toISOString().split('T')[0],
    attributes: profile?.attributes || { Intellect: 25, Vitality: 15, Serenity: 5, Craft: 0 },
  });

  const [completedQuestIds, setCompletedQuestIds] = useState<string[]>([]);
  const [isTasklistOpen, setIsTasklistOpen] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [levelUpModal, setLevelUpModal] = useState<{ newLevel: number } | null>(null);
  const [toastNotification, setToastNotification] = useState<string | null>(null);
  const [activeRoomFocus, setActiveRoomFocus] = useState<string>('all');

  // Synchronize character state when Supabase profile loads or updates
  useEffect(() => {
    if (profile) {
      setCharacter((prev) => ({
        ...prev,
        id: profile.id,
        username: profile.username || prev.username,
        total_xp: profile.xp !== undefined && profile.xp !== null ? profile.xp : prev.total_xp,
        currency: profile.gold !== undefined && profile.gold !== null ? profile.gold : prev.currency,
        current_streak: profile.streak_count ?? prev.current_streak,
        last_active_date: profile.last_active_date || prev.last_active_date,
        longest_streak: profile.longest_streak ?? prev.longest_streak,
        attributes: profile.attributes || prev.attributes,
      }));
    }
  }, [profile]);

  // Synchronize completed quests from Supabase public.quests
  useEffect(() => {
    if (quests && quests.length > 0) {
      const completedDbQuests = quests.filter((q) => q.is_completed);
      const completedIds = completedDbQuests.map((q) => q.id);
      const completedTitles = new Set(completedDbQuests.map((q) => q.title.toLowerCase().trim()));

      // Map cottage task codes ('int_01', etc.) by matching title
      const matchedCottageIds: string[] = [];
      COTTAGE_QUEST_CATEGORIES.forEach((cat) => {
        cat.tasks.forEach((t) => {
          if (completedTitles.has(t.title.toLowerCase().trim())) {
            matchedCottageIds.push(t.id);
          }
        });
      });

      setCompletedQuestIds(Array.from(new Set([...completedIds, ...matchedCottageIds])));
    }
  }, [quests]);

  const levelInfo = getLevelFromXp(character.total_xp);

  const showToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => setToastNotification(null), 3200);
  };

  const handleToggleMute = () => {
    sounds.isMuted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleActiveQuestIdsChange = async (ids: string[]) => {
    const normalized = Array.from(new Set(ids)).slice(0, 5);
    if (!user) return;
    await updateProfile({ active_quest_ids: normalized });
  };

  const activeQuestIds = profile?.active_quest_ids?.length
    ? profile.active_quest_ids
    : DEFAULT_ACTIVE_QUEST_IDS;

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  // Complete a Task from the Board with Database Persistence & Idempotency
  const handleCompleteQuest = async (quest: CottageQuestItem) => {
    if (completedQuestIds.includes(quest.id)) return; // Already completed

    const targetUserId = user?.id || profile?.id || 'demo-user-123';
    const prevLevel = levelInfo.level;

    try {
      // Supabase is the source of truth: reward, streak, level and currency are
      // calculated atomically by rpg_complete_task().
      const res = await completeUserQuest(targetUserId, quest.id, character.current_streak, {
        xp: quest.xp_reward,
        gold: quest.coin_reward,
        title: quest.title,
        category: quest.category,
        difficulty: quest.difficulty,
        is_daily: quest.is_daily,
      });

      if (!res.success) {
        showToast(res.error?.message || 'This quest could not be completed.');
        return;
      }

      const attributeName = mapCategoryToAttribute(quest.category);
      setCompletedQuestIds((prev) => Array.from(new Set([...prev, quest.id])));
      setCharacter((prev) => ({
        ...prev,
        total_xp: res.newTotalXp ?? prev.total_xp,
        currency: res.newGold ?? prev.currency,
        current_streak: res.emberTrail ?? prev.current_streak,
        attributes: res.attributes || {
          ...prev.attributes,
          [attributeName]: prev.attributes[attributeName] + res.finalXp,
        },
      }));

      const serverLevel = res.newLevel;
      if (serverLevel > prevLevel) {
        sounds.playLevelUp();
        setLevelUpModal({ newLevel: serverLevel });
      }

      showToast(`+${res.finalXp} Wonder ★ & +${res.finalGold} Petals 🌸! Small Magic Kindled!`);

      await refreshProfile();
      await refreshQuests();
    } catch (err) {
      console.warn('[CottagePage] Quest completion persistence warning:', err);
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen relative flex flex-col justify-between bg-[#17110C] text-[#F5EBE1] overflow-hidden selection:bg-amber-300 selection:text-amber-950">
        {/* Floating Toast Notification */}
        {toastNotification && (
          <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-[#2E1F16]/95 backdrop-blur-md text-amber-200 px-5 py-2.5 rounded-2xl shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 border border-amber-500/50 animate-token-drop">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>{toastNotification}</span>
          </div>
        )}

        {/* Level Up Celebration Modal */}
        {levelUpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-3xl bg-[#241710] border-2 border-amber-400 p-6 text-center shadow-2xl animate-token-drop">
              <div className="h-16 w-16 rounded-full bg-amber-900/60 border border-amber-400 text-amber-300 flex items-center justify-center mx-auto mb-3 text-3xl shadow-inner animate-float-gentle">
                🌟
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Small Magic Kindled!
              </span>
              <h3 className="font-serif text-2xl font-bold text-white mt-1">
                Level {levelUpModal.newLevel} Keeper
              </h3>
              <p className="text-xs text-amber-200/80 mt-2 leading-relaxed">
                Your daily habits kindle warm wonder throughout the cottage. Shibu rejoices at your side!
              </p>
              <button
                onClick={() => setLevelUpModal(null)}
                className="w-full mt-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-serif font-black text-xs shadow-lg transition-all"
              >
                Continue Exploration
              </button>
            </div>
          </div>
        )}

        {/* Top HUD Bar (Autumn Dark & Amber) */}
        <header className="sticky top-0 z-40 backdrop-blur-md bg-[#17110C]/90 border-b border-amber-900/40 px-4 sm:px-8 py-3 flex items-center justify-between">
          {/* Brand & Level Progress */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-900/80 border border-amber-400/50 flex items-center justify-center text-amber-200 text-lg shadow-sm">
              🍂
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-base sm:text-lg font-bold text-white">
                  {character.username}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[11px] font-bold">
                  Lv. {levelInfo.level}
                </span>
              </div>
              {/* Level progress */}
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-24 sm:w-32 h-2 rounded-full bg-black/50 overflow-hidden border border-amber-900/40">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 rounded-full"
                    style={{ width: `${levelInfo.progressPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-amber-200/70 font-semibold">
                  {levelInfo.currentLevelXp} / {levelInfo.xpToNextLevel} Wonder ★
                </span>
              </div>
            </div>
          </div>

          {/* Controls: Currency, Streak, Quest Drawer Toggle, Audio, Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Windfall Petals */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#241710] border border-amber-800/60 text-amber-200 text-xs font-bold shadow-sm">
              <span>🌸</span>
              <span>{character.currency} Petals</span>
            </div>

            {/* Ember Trail Streak */}
            <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs font-bold shadow-sm">
              <Flame className="h-3.5 w-3.5 text-rose-400" />
              <span>{character.current_streak} Day Trail</span>
            </div>

            {/* Step 5: Quest List Pop-Up Trigger */}
            <button
              onClick={() => setIsTasklistOpen(!isTasklistOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-md ${
                isTasklistOpen
                  ? 'bg-amber-500 text-amber-950 border-amber-300'
                  : 'bg-[#241710] text-amber-200 border-amber-700/60 hover:bg-[#322016]'
              }`}
              title="Toggle Quest Board"
            >
              <ListTodo className="h-4 w-4" />
              <span className="hidden sm:inline">Daily Quests</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={handleToggleMute}
              className="p-2 rounded-xl border border-amber-800/60 bg-[#241710] hover:bg-[#322016] text-amber-200 transition-colors"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            {/* Logout */}
            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl border border-amber-900/40 bg-[#241710] hover:bg-rose-950/80 text-amber-200/80 hover:text-rose-200 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Step 4: Full 360° Panorama Generator World with Room Element Controls */}
        <div className="relative flex-1 w-full max-w-7xl mx-auto p-3 sm:p-6 flex flex-col justify-between">
          {/* Interactive Room Focus Elements Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 z-20">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-amber-300 mr-1 hidden sm:inline">
                Cottage Elements:
              </span>
              {[
                { id: 'kitchen', label: '🍳 Blue Kitchen', desc: 'Vintage stove & pastoral window' },
                { id: 'library', label: '📚 Ivy Library', desc: 'Tilting bookshelves & daybed' },
                { id: 'hearth', label: '🍵 Stone Hearth', desc: 'Crackling fire & iron kettle' },
                { id: 'veranda', label: '🌸 Wisteria Veranda', desc: 'Blooming garden path' },
              ].map((elem) => (
                <button
                  key={elem.id}
                  onClick={() => {
                    setActiveRoomFocus(elem.id);
                    sounds.playTaskPop();
                    showToast(`Focused: ${elem.label} (${elem.desc})`);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border ${
                    activeRoomFocus === elem.id
                      ? 'bg-amber-500 text-amber-950 border-amber-300 shadow-md font-bold'
                      : 'bg-[#241710]/90 text-amber-200/80 border-amber-800/50 hover:bg-[#322016]'
                  }`}
                >
                  {elem.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-amber-300/80 font-medium">
              Click & drag to explore 360°
            </div>
          </div>

          {/* Lo-Fi Music Player with Spinning Vinyl Disc (Jamendo API) */}
          <div className="mb-3 z-20">
            <LofiPlayer />
          </div>

          {/* 360 Panorama Embed Container */}
          <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-[#78350F]/70 bg-black min-h-[460px] sm:min-h-[560px] flex-1">
            <PanoramaViewer className="w-full h-full min-h-[460px] sm:min-h-[560px]" />
          </div>

          {/* Step 5: Pop-Up Questlist Modal / Drawer (Autumn Parchment Style) */}
          {isTasklistOpen && (
            <div className="fixed inset-x-3 bottom-3 sm:bottom-6 sm:right-6 sm:left-auto sm:w-[480px] z-50 animate-token-drop">
              <div className="bg-[#241710]/98 backdrop-blur-md border-2 border-amber-500/70 rounded-3xl p-5 shadow-2xl relative text-[#F5EBE1]">
                {/* Header with Close */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-800/50">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📜</span>
                    <h3 className="font-serif text-lg font-bold text-amber-100">
                      Daily Quests (5 Active)
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsTasklistOpen(false)}
                    className="p-1.5 rounded-xl text-amber-300 hover:bg-white/10"
                    title="Minimize Quest Board"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* The 5-Active Quest Board (Self-ticking) */}
                <CottageQuestBoard
                  onCompleteQuest={handleCompleteQuest}
                  completedQuestIds={completedQuestIds}
                  streak={character.current_streak}
                  activeQuestIds={activeQuestIds}
                  onActiveQuestIdsChange={handleActiveQuestIdsChange}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="relative z-20 py-3 px-4 text-center text-[11px] text-amber-200/60 bg-black/40 border-t border-amber-900/40">
          <p>© Rekindle — Autumn Ghibli Cottage 360° Walkthrough.</p>
        </footer>
      </main>
    </ProtectedRoute>
  );
}
