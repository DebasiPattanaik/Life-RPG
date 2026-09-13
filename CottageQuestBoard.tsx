'use client';

import React, { useState } from 'react';
import { Check, BookOpen, X } from 'lucide-react';
import {
  CottageQuestItem,
  ALL_COTTAGE_QUESTS,
} from '@/lib/cottageQuests';
import { sounds } from '@/lib/soundEffects';

interface CottageQuestBoardProps {
  onCompleteQuest: (quest: CottageQuestItem) => void;
  completedQuestIds: string[];
  streak: number;
  activeQuestIds: string[];
  onActiveQuestIdsChange: (ids: string[]) => Promise<void> | void;
}

export default function CottageQuestBoard({
  onCompleteQuest,
  completedQuestIds,
  streak,
  activeQuestIds,
  onActiveQuestIdsChange,
}: CottageQuestBoardProps) {
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [journalFilter, setJournalFilter] = useState<string>('All');

  // Currently active 5 quests
  const activeQuests = ALL_COTTAGE_QUESTS.filter((q) => activeQuestIds.includes(q.id));

  const handleToggleComplete = (quest: CottageQuestItem) => {
    if (completedQuestIds.includes(quest.id)) return; // Already completed
    sounds.playTaskPop();
    onCompleteQuest(quest);
  };

  const handleToggleActiveSelection = (questId: string) => {
    sounds.playTaskPop();
    if (activeQuestIds.includes(questId)) {
      if (activeQuestIds.length <= 1) return; // Keep at least 1
      void onActiveQuestIdsChange(activeQuestIds.filter((id) => id !== questId));
    } else {
      if (activeQuestIds.length >= 5) {
        alert('Your Daily Board holds 5 active quests. Deselect a quest to swap this one in!');
        return;
      }
      void onActiveQuestIdsChange([...activeQuestIds, questId]);
    }
  };

  const streakMultiplier = 1 + Math.min(streak, 30) * 0.02;

  return (
    <div className="w-full bg-[#1E140D]/90 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden text-[#F5EBE1]">
      {/* Board Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-amber-800/40">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-amber-100">
              Daily Cottage Quest Board
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
              {activeQuests.filter((q) => completedQuestIds.includes(q.id)).length} / {activeQuests.length} Done
            </span>
          </div>
          <p className="text-[11px] text-amber-300/70 mt-0.5">
            5 Active Slots • Streak Bonus: <strong className="text-amber-300">{streakMultiplier.toFixed(2)}x XP</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsJournalOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-700/50 text-amber-200 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <BookOpen className="h-3.5 w-3.5 text-amber-400" />
          <span>Quest Journal (Swap Quests)</span>
        </button>
      </div>

      {/* 5 Active Quests List (Light Toned-Down Parchment Cards) */}
      <div className="space-y-2.5 pt-3">
        {activeQuests.map((quest) => {
          const isDone = completedQuestIds.includes(quest.id);
          const finalXp = Math.round(quest.xp_reward * streakMultiplier);

          return (
            <div
              key={quest.id}
              className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                isDone
                  ? 'bg-[#EAE1D3]/80 border-amber-200/50 opacity-60 text-[#6B5A4B]'
                  : 'bg-[#F7F2EA] border-amber-200/90 hover:bg-white text-[#2C1D13] shadow-sm hover:border-amber-300'
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Self-Ticking Checkbox */}
                <button
                  type="button"
                  onClick={() => handleToggleComplete(quest)}
                  disabled={isDone}
                  className={`mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    isDone
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-amber-400 bg-white hover:border-amber-600 hover:bg-amber-50 cursor-pointer text-amber-900'
                  }`}
                  aria-label={`Mark ${quest.title} as completed`}
                >
                  {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        isDone ? 'line-through text-stone-500' : 'text-[#2C1D13]'
                      }`}
                    >
                      {quest.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-200 font-semibold">
                      {quest.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B5A4B] mt-0.5 leading-snug">
                    {quest.flavor_text}
                  </p>
                </div>
              </div>

              {/* Rewards */}
              <div className="flex flex-col items-end shrink-0 text-right">
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300/80 text-[11px] font-bold whitespace-nowrap shadow-xs">
                  +{finalXp} XP ★
                </span>
                <span className="text-[10px] text-amber-800 font-semibold mt-0.5">
                  +{quest.coin_reward} 🌸
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quest Journal Swap Modal (Autumn Dark) */}
      {isJournalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl max-h-[85vh] bg-[#22160E] border-2 border-amber-600/70 rounded-3xl p-6 shadow-2xl flex flex-col animate-token-drop text-[#F5EBE1]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-900/50">
              <div>
                <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                  <span>Quest Journal Pool (20 Quests)</span>
                  <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                    {activeQuestIds.length} / 5 Active
                  </span>
                </h3>
                <p className="text-xs text-amber-200/70 mt-0.5">
                  Click any quest to swap it onto your Daily Board.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsJournalOpen(false)}
                className="p-1.5 rounded-xl text-amber-300 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2 py-3 border-b border-amber-900/50">
              {['All', 'Intellect', 'Vitality', 'Serenity', 'Craft'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setJournalFilter(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    journalFilter === cat
                      ? 'bg-amber-500 text-amber-950 shadow-sm'
                      : 'bg-[#180E09] text-amber-200/70 hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Quests Scroll List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1">
              {ALL_COTTAGE_QUESTS.filter((q) =>
                journalFilter === 'All' ? true : q.category === journalFilter
              ).map((q) => {
                const isSelected = activeQuestIds.includes(q.id);
                return (
                  <div
                    key={q.id}
                    onClick={() => handleToggleActiveSelection(q.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-100 border-amber-400 shadow-sm ring-1 ring-amber-400/60'
                        : 'bg-[#FBF8F2] border-amber-200/80 hover:bg-[#F5EFE6]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-[#2C1D13]">{q.title}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-200/60 text-amber-900 border border-amber-300 font-medium">
                          {q.room}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6A5749] mt-0.5">{q.flavor_text}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold text-amber-800 bg-amber-200/70 px-2 py-1 rounded-xl border border-amber-300/60">
                        +{q.xp_reward} XP
                      </span>
                      <div
                        className={`h-5 w-5 rounded-md border flex items-center justify-center text-xs font-bold ${
                          isSelected
                            ? 'bg-amber-500 border-amber-400 text-amber-950'
                            : 'border-amber-300 bg-white'
                        }`}
                      >
                        {isSelected && '✓'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-amber-900/50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsJournalOpen(false)}
                className="px-5 py-2 rounded-2xl bg-amber-500 text-amber-950 font-serif font-black text-xs hover:bg-amber-400 shadow-md"
              >
                Board Saved ({activeQuestIds.length} / 5)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
