// Data types and non-linear leveling logic for Rekindle Life RPG

export type CharacterStyle = 'female_traveler' | 'male_traveler';
export type PetType = 'fuzzy_cat' | 'shibu_dog' | 'garden_rabbit';
export type ThemeId = 'cottage_day' | 'cat_cafe' | 'autumn_bookshop';
export type AttributeType = 'mind' | 'body' | 'soul' | 'craft';

export interface UserProfile {
  id: string;
  username: string;
  avatar: CharacterStyle;
  pet_type: PetType;
  pet_name: string;
  active_theme: ThemeId;
  level: number;
  xp: number;
  energy: number;
  gold: number;        // Also used as Golden Star Tokens
  jar_tokens: number;  // Number of tokens sitting in the glass jar
  streak_count: number;
  longest_streak: number;
  last_active_date?: string;
  active_quest_ids: string[];
  attributes: { Intellect: number; Vitality: number; Serenity: number; Craft: number };
  onboarding_completed?: boolean;
  created_at?: string;
}

export interface Quest {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  attribute: AttributeType;
  xp_reward: number;
  token_reward: number;
  is_completed: boolean;
  completed_at?: string;
  priority: 'low' | 'medium' | 'high';
  is_daily: boolean;
  created_at?: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  item_type: 'theme' | 'decor' | 'pet_accessory';
  item_name: string;
  is_equipped: boolean;
  purchased_at?: string;
}

export interface ThemeConfig {
  id: ThemeId;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  colorScheme: {
    bg: string;
    card: string;
    border: string;
    accent: string;
    text: string;
  };
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  cottage_day: {
    id: 'cottage_day',
    title: 'Countryside Cottage',
    subtitle: 'Base Sanctuary',
    description: 'A sun-dappled living room looking out over rolling hills, wildflowers, and soft drifting clouds.',
    image: '/themes/cottage_meadow.svg',
    colorScheme: {
      bg: '#FAF7F2',
      card: '#FFFFFF',
      border: '#E8DFD3',
      accent: '#829C7C',
      text: '#38302A',
    },
  },
  cat_cafe: {
    id: 'cat_cafe',
    title: 'Cat Café Afternoon',
    subtitle: 'Warm Brick & Sunlight',
    description: 'Rustic exposed brick, sunbeams pouring across wooden tables, hanging pothos, and cozy sleeping cats.',
    image: '/themes/cat-cafe.jpg',
    colorScheme: {
      bg: '#FDF7F0',
      card: '#FFFFFF',
      border: '#E4CFB8',
      accent: '#C46D4B',
      text: '#3D281D',
    },
  },
  autumn_bookshop: {
    id: 'autumn_bookshop',
    title: 'Autumn Bookshop',
    subtitle: 'Amber Lanterns & Pages',
    description: 'Floor-to-ceiling mahogany bookshelves, glowing paper lantern orbs, and golden maple leaves outside the picture window.',
    image: '/themes/autumn-bookshop.jpg',
    colorScheme: {
      bg: '#1A1412',
      card: '#29201C',
      border: '#45352E',
      accent: '#D97736',
      text: '#F5EBE1',
    },
  },
};

// Non-linear RPG Leveling Formula: XP_required(L) = floor(100 * L^1.5)
export function getRequiredXp(level: number): number {
  if (level <= 1) return 100;
  return Math.floor(100 * Math.pow(level, 1.5));
}

// Helper to calculate progress percentage towards next level
export function getXpProgress(currentXp: number, level: number): { percent: number; needed: number } {
  const req = getRequiredXp(level);
  const percent = Math.min(100, Math.round((currentXp / req) * 100));
  return { percent, needed: req };
}
