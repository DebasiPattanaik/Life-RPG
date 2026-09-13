import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, Quest } from './rpgTypes';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-anon-key')
);

// Fallback dummy client for SSR or when credentials are not yet entered
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient('https://mock-rekindle-project.supabase.co', 'mock-anon-key', {
      auth: {
        persistSession: false,
      },
    });

// ==============================================================================
// LOCAL STORAGE DEMO REPOSITORY (Allows seamless testing when Supabase keys are pending)
// ==============================================================================
const DEMO_STORAGE_KEY_PROFILE = 'rekindle_demo_profile';
const DEMO_STORAGE_KEY_QUESTS = 'rekindle_demo_quests';

export const getDemoProfile = (): UserProfile => {
  if (typeof window === 'undefined') {
    return {
      id: 'demo-user-123',
      username: 'Sophie of the Meadow',
      avatar: 'female_traveler',
      pet_type: 'fuzzy_cat',
      pet_name: 'Mochi',
      active_theme: 'cottage_day',
      level: 1,
      xp: 45,
      energy: 100,
      gold: 50,
      jar_tokens: 3,
      streak_count: 1,
      longest_streak: 1,
      last_active_date: new Date().toISOString().split('T')[0],
      active_quest_ids: ['int_01', 'vit_01', 'ser_01', 'cra_01', 'int_02'],
      attributes: { Intellect: 25, Vitality: 15, Serenity: 5, Craft: 0 },
    };
  }

  const stored = localStorage.getItem(DEMO_STORAGE_KEY_PROFILE);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fallback
    }
  }

  const defaultProfile: UserProfile = {
    id: 'demo-user-123',
    username: 'Sophie of the Meadow',
    avatar: 'female_traveler',
    pet_type: 'fuzzy_cat',
    pet_name: 'Mochi',
    active_theme: 'cottage_day',
    level: 1,
    xp: 45,
    energy: 100,
    gold: 50,
    jar_tokens: 3,
    streak_count: 1,
    longest_streak: 1,
    last_active_date: new Date().toISOString().split('T')[0],
    active_quest_ids: ['int_01', 'vit_01', 'ser_01', 'cra_01', 'int_02'],
    attributes: { Intellect: 25, Vitality: 15, Serenity: 5, Craft: 0 },
  };
  localStorage.setItem(DEMO_STORAGE_KEY_PROFILE, JSON.stringify(defaultProfile));
  return defaultProfile;
};

export const saveDemoProfile = (profile: UserProfile) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEMO_STORAGE_KEY_PROFILE, JSON.stringify(profile));
  }
};

export const getDemoQuests = (userId: string): Quest[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(DEMO_STORAGE_KEY_QUESTS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fallback
    }
  }
  const starterQuests: Quest[] = [
    {
      id: 'quest-1',
      user_id: userId,
      title: 'Brew a warm herbal tea',
      description: 'Savor 5 quiet minutes without checking notifications',
      attribute: 'soul',
      xp_reward: 25,
      token_reward: 5,
      is_completed: false,
      priority: 'low',
      is_daily: true,
    },
    {
      id: 'quest-2',
      user_id: userId,
      title: '25-minute deep focus writing / coding sprint',
      description: 'Progress on your current craft project',
      attribute: 'mind',
      xp_reward: 40,
      token_reward: 10,
      is_completed: false,
      priority: 'high',
      is_daily: true,
    },
    {
      id: 'quest-3',
      user_id: userId,
      title: 'Sunlight stroll or gentle stretch',
      description: 'Step outside or stretch beside the window',
      attribute: 'body',
      xp_reward: 30,
      token_reward: 8,
      is_completed: false,
      priority: 'medium',
      is_daily: true,
    },
  ];
  localStorage.setItem(DEMO_STORAGE_KEY_QUESTS, JSON.stringify(starterQuests));
  return starterQuests;
};

export const saveDemoQuests = (quests: Quest[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEMO_STORAGE_KEY_QUESTS, JSON.stringify(quests));
  }
};
