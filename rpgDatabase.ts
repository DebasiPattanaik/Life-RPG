import {
  supabase,
  isSupabaseConfigured,
  getDemoProfile,
  saveDemoProfile,
  getDemoQuests,
  saveDemoQuests,
} from './supabaseClient';
import { UserProfile, Quest, InventoryItem } from './rpgTypes';
import { ALL_COTTAGE_QUESTS } from './cottageQuests';

// ============================================================================
// Supabase RPG data access
// IMPORTANT: production data lives in rpg_* tables/RPCs from the backend
// migration. The old public.profiles / public.quests tables are intentionally
// not used anymore.
// ============================================================================

const TODAY = () => new Date().toISOString().slice(0, 10);

function difficultyForQuest(difficulty: 'easy' | 'medium' | 'hard') {
  if (difficulty === 'hard') return 'heroic';
  if (difficulty === 'medium') return 'growing';
  return 'gentle';
}

function categoryToRpgCategory(category?: string) {
  switch ((category || '').toLowerCase()) {
    case 'intellect': return 'intellect';
    case 'vitality': return 'vitality';
    case 'serenity': return 'serenity';
    case 'craft': return 'craft';
    default: return 'general';
  }
}

function mapTaskToQuest(task: any, completedToday = false): Quest {
  const difficulty = task.difficulty === 'heroic' || task.difficulty === 'challenging' ? 'hard'
    : task.difficulty === 'growing' ? 'medium' : 'easy';

  const baseXp = task.difficulty === 'heroic' ? 75
    : task.difficulty === 'challenging' ? 40
    : task.difficulty === 'growing' ? 20 : 10;

  return {
    id: task.id,
    user_id: task.user_id,
    title: task.title,
    description: task.description || '',
    attribute: categoryToRpgCategory(task.category) as Quest['attribute'],
    xp_reward: baseXp,
    token_reward: Math.max(1, Math.round(baseXp * 0.4)),
    is_completed: completedToday,
    priority: difficulty === 'hard' ? 'high' : difficulty === 'medium' ? 'medium' : 'low',
    is_daily: task.is_designated_daily ?? task.recurrence_type === 'daily',
    created_at: task.created_at,
  };
}

/** Fetches the complete Auth-linked RPG profile. */
export async function fetchUserProfile(userId: string): Promise<{ profile: UserProfile | null; error: Error | null }> {
  if (!isSupabaseConfigured) return { profile: getDemoProfile(), error: null };

  try {
    const { data: summary, error } = await supabase.rpc('rpg_get_profile_summary');
    if (error) throw error;

    const attrs = summary?.attributes || {};
    const profile: UserProfile = {
      id: userId,
      username: summary?.username || 'Cottage Wanderer',
      avatar: summary?.avatar || 'female_traveler',
      pet_type: summary?.pet_type || 'fuzzy_cat',
      pet_name: summary?.pet_name || 'Mochi',
      active_theme: summary?.cosmetics?.active_theme || 'cottage_day',
      level: Number(summary?.level ?? 1),
      xp: Number(summary?.wonder ?? 0),
      energy: 100,
      gold: Number(summary?.windfall_petals ?? 0),
      jar_tokens: Number(summary?.jar_tokens ?? 0),
      streak_count: Number(summary?.ember_trail ?? 0),
      longest_streak: Number(summary?.longest_ember_trail ?? 0),
      last_active_date: summary?.last_active_date || undefined,
      active_quest_ids: Array.isArray(summary?.active_quest_ids) ? summary.active_quest_ids : [],
      attributes: {
        Intellect: Number(attrs.Intellect ?? 25),
        Vitality: Number(attrs.Vitality ?? 15),
        Serenity: Number(attrs.Serenity ?? 5),
        Craft: Number(attrs.Craft ?? 0),
      },
      onboarding_completed: Boolean(summary?.onboarding_completed),
    };

    return { profile, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch RPG profile';
    console.error('[rpgDatabase] Profile fetch error:', message);
    return { profile: null, error: new Error(message) };
  }
}

/** Persists all editable player profile/preferences fields against auth.uid(). */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured) {
    const current = getDemoProfile();
    saveDemoProfile({ ...current, ...updates });
    return { error: null };
  }

  try {
    const { error } = await supabase.rpc('rpg_update_player_profile', {
      p_username: updates.username ?? null,
      p_avatar: updates.avatar ?? null,
      p_pet_type: updates.pet_type ?? null,
      p_pet_name: updates.pet_name ?? null,
      p_active_theme: updates.active_theme ?? null,
      p_active_quest_ids: updates.active_quest_ids ?? null,
      p_onboarding_completed: updates.onboarding_completed ?? null,
    });
    return { error: error ? new Error(error.message) : null };
  } catch (err: unknown) {
    return { error: new Error(err instanceof Error ? err.message : 'Failed to update profile') };
  }
}

/** Ensure all 20 cottage quests exist for this Auth account, then return them. */
export async function syncCottageTasks(userId: string): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured) return { error: null };
  try {
    const payload = ALL_COTTAGE_QUESTS.map((q) => ({
      title: q.title,
      flavor_text: q.flavor_text,
      difficulty: q.difficulty,
      is_daily: q.is_daily,
      category: q.category,
    }));
    const { error } = await supabase.rpc('rpg_sync_cottage_tasks', { p_tasks: payload });
    return { error: error ? new Error(error.message) : null };
  } catch (err: unknown) {
    return { error: new Error(err instanceof Error ? err.message : 'Failed to sync cottage tasks') };
  }
}

/** Fetches the user's rpg_tasks plus today's completion state. */
export async function fetchUserQuests(userId: string): Promise<{ quests: Quest[]; error: Error | null }> {
  if (!isSupabaseConfigured) return { quests: getDemoQuests(userId), error: null };

  try {
    const sync = await syncCottageTasks(userId);
    if (sync.error) throw sync.error;

    const { data: tasks, error: taskError } = await supabase
      .from('rpg_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .order('created_at', { ascending: true });
    if (taskError) throw taskError;

    const taskIds = (tasks || []).map((task) => task.id);
    let completedIds = new Set<string>();

    if (taskIds.length) {
      const start = `${TODAY()}T00:00:00.000Z`;
      const { data: completions, error: completionError } = await supabase
        .from('rpg_task_completions')
        .select('task_id')
        .eq('user_id', userId)
        .in('task_id', taskIds)
        .gte('completed_at', start);
      if (completionError) throw completionError;
      completedIds = new Set((completions || []).map((row) => row.task_id));
    }

    return {
      quests: (tasks || []).map((task) => mapTaskToQuest(task, completedIds.has(task.id))),
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch RPG tasks';
    console.error('[rpgDatabase] Quest fetch error:', message);
    return { quests: [], error: new Error(message) };
  }
}

/** Creates a task in the rpg_tasks table. */
export async function createUserQuest(
  userId: string,
  quest: Omit<Quest, 'id' | 'user_id' | 'created_at'>
): Promise<{ quest: Quest | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    const quests = getDemoQuests(userId);
    const newQuest: Quest = { ...quest, id: `quest-${Date.now()}`, user_id: userId, created_at: new Date().toISOString() };
    saveDemoQuests([...quests, newQuest]);
    return { quest: newQuest, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('rpg_tasks')
      .insert({
        user_id: userId,
        title: quest.title,
        description: quest.description || '',
        difficulty: quest.priority === 'high' ? 'heroic' : quest.priority === 'medium' ? 'growing' : 'gentle',
        recurrence_type: quest.is_daily ? 'daily' : 'one_time',
        category: quest.attribute || 'general',
        is_designated_daily: quest.is_daily,
        active: true,
      })
      .select('*')
      .single();
    if (error) throw error;
    return { quest: mapTaskToQuest(data, false), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create RPG task';
    return { quest: null, error: new Error(message) };
  }
}

export interface QuestRewardFallback {
  xp: number;
  gold: number;
  title: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  is_daily?: boolean;
}

export interface CompleteQuestResult {
  success: boolean;
  finalXp: number;
  finalGold: number;
  newLevel: number;
  newTotalXp?: number;
  newGold?: number;
  attributes?: { Intellect: number; Vitality: number; Serenity: number; Craft: number };
  jarTokens?: number;
  emberTrail?: number;
  leveledUp: boolean;
  error: Error | null;
}

/** Completes a task through the atomic Supabase RPC. No client-side economy updates are persisted. */
export async function completeUserQuest(
  userId: string,
  questId: string,
  _currentStreak: number,
  fallback?: QuestRewardFallback
): Promise<CompleteQuestResult> {
  if (!isSupabaseConfigured) {
    const quests = getDemoQuests(userId);
    const target = quests.find((q) => q.id === questId || q.title === fallback?.title);
    if (target?.is_completed) return { success: false, finalXp: 0, finalGold: 0, newLevel: 1, leveledUp: false, error: null };

    const baseXp = target?.xp_reward || fallback?.xp || 25;
    const gold = target?.token_reward || fallback?.gold || 5;
    const profile = getDemoProfile();
    const newTotalXp = profile.xp + baseXp;
    const newGold = profile.gold + gold;
    const newLevel = newTotalXp >= 100 ? 2 : 1;
    saveDemoProfile({ ...profile, xp: newTotalXp, gold: newGold, level: newLevel });
    saveDemoQuests(quests.map((q) => q.id === target?.id ? { ...q, is_completed: true } : q));
    return { success: true, finalXp: baseXp, finalGold: gold, newLevel, newTotalXp, newGold, leveledUp: newLevel > profile.level, error: null };
  }

  try {
    // Cottage quests use stable UI IDs such as int_01. The server requires UUIDs,
    // so resolve/create the corresponding rpg_tasks row by title first.
    let taskId: string | null = null;
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(questId)) {
      taskId = questId;
    } else if (fallback?.title) {
      const { data: existing, error: findError } = await supabase
        .from('rpg_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('title', fallback.title)
        .maybeSingle();
      if (findError) throw findError;

      if (existing) {
        taskId = existing.id;
      } else {
        const { data: created, error: createError } = await supabase
          .from('rpg_tasks')
          .insert({
            user_id: userId,
            title: fallback.title,
            description: fallback.title,
            difficulty: difficultyForQuest(fallback.difficulty || 'easy'),
            recurrence_type: fallback.is_daily === false ? 'one_time' : 'daily',
            category: categoryToRpgCategory(fallback.category),
            is_designated_daily: fallback.is_daily !== false,
            active: true,
          })
          .select('*')
          .single();
        if (createError) throw createError;
        taskId = created.id;
      }
    }

    if (!taskId) throw new Error('No Supabase RPG task could be resolved for this quest.');

    const idempotencyKey = `task-${taskId}-${TODAY()}`;
    const { data, error } = await supabase.rpc('rpg_complete_task', {
      p_task_id: taskId,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw error;

    return {
      success: Boolean(data?.success),
      finalXp: Number(data?.awarded_wonder ?? 0),
      finalGold: Number(data?.awarded_petals ?? 0),
      newLevel: Number(data?.level ?? 1),
      newTotalXp: Number(data?.total_wonder ?? 0),
      newGold: Number(data?.windfall_petals ?? 0),
      attributes: data?.attributes || undefined,
      jarTokens: Number(data?.jar_tokens ?? 0),
      emberTrail: Number(data?.ember_trail ?? 0),
      leveledUp: false,
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Quest completion failed';
    console.error('[rpgDatabase] Quest completion error:', message);
    return { success: false, finalXp: 0, finalGold: 0, newLevel: 1, leveledUp: false, error: new Error(message) };
  }
}

/** Fetches owned rewards from the rpg_user_rewards/rpg_rewards tables. */
export async function fetchUserInventory(userId: string): Promise<{ items: InventoryItem[]; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return {
      items: [
        { id: 'inv-1', user_id: userId, item_id: 'cottage_day', item_type: 'theme', item_name: 'Countryside Cottage', is_equipped: true },
        { id: 'inv-2', user_id: userId, item_id: 'cat_cafe', item_type: 'theme', item_name: 'Cat Café Afternoon', is_equipped: false },
        { id: 'inv-3', user_id: userId, item_id: 'autumn_bookshop', item_type: 'theme', item_name: 'Autumn Bookshop', is_equipped: false },
      ],
      error: null,
    };
  }

  try {
    const { data: owned, error: ownedError } = await supabase
      .from('rpg_user_rewards')
      .select('id,user_id,reward_id,quantity,equipped,purchased_at')
      .eq('user_id', userId)
      .order('purchased_at', { ascending: true });
    if (ownedError) throw ownedError;

    const rewardIds = (owned || []).map((row) => row.reward_id);
    if (!rewardIds.length) return { items: [], error: null };

    const { data: rewards, error: rewardError } = await supabase
      .from('rpg_rewards')
      .select('id,name,reward_type')
      .in('id', rewardIds);
    if (rewardError) throw rewardError;

    const rewardMap = new Map((rewards || []).map((r) => [r.id, r]));
    const items: InventoryItem[] = (owned || []).map((row) => {
      const reward = rewardMap.get(row.reward_id);
      return {
        id: row.id,
        user_id: row.user_id,
        item_id: row.reward_id,
        item_type: reward?.reward_type === 'theme' ? 'theme' : 'decor',
        item_name: reward?.name || 'Reward',
        is_equipped: Boolean(row.equipped),
        purchased_at: row.purchased_at,
      };
    });

    return { items, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch inventory';
    return { items: [], error: new Error(message) };
  }
}

/** Equips a reward through the server-side RPC. */
export async function equipInventoryTheme(
  _userId: string,
  itemId: string
): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured) {
    const current = getDemoProfile();
    saveDemoProfile({ ...current, active_theme: itemId as UserProfile['active_theme'] });
    return { error: null };
  }

  try {
    const { error } = await supabase.rpc('rpg_equip_reward', { p_reward_id: itemId });
    return { error: error ? new Error(error.message) : null };
  } catch (err: unknown) {
    return { error: new Error(err instanceof Error ? err.message : 'Failed to equip reward') };
  }
}
