-- ==============================================================================
-- LIFE RPG: "KEEPER OF SMALL MAGICS" BACKEND SPECIFICATION v2.1
-- Additive, Non-Destructive Supabase PostgreSQL Migration
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. CONFIGURATION & SEED BALANCING TABLES
-- ==============================================================================

-- Difficulty Configuration (Section 3)
CREATE TABLE IF NOT EXISTS public.rpg_difficulty_config (
    difficulty_key TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    base_wonder INTEGER NOT NULL CHECK (base_wonder >= 0),
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Frequency Multipliers (Section 4)
CREATE TABLE IF NOT EXISTS public.rpg_frequency_config (
    frequency_key TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    multiplier NUMERIC(4, 2) NOT NULL CHECK (multiplier >= 1.0),
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Ember Trail (Streak) Bonus Config (Section 5)
CREATE TABLE IF NOT EXISTS public.rpg_streak_config (
    id SERIAL PRIMARY KEY,
    min_days INTEGER NOT NULL UNIQUE CHECK (min_days > 0),
    bonus_multiplier NUMERIC(4, 2) NOT NULL CHECK (bonus_multiplier >= 1.0),
    is_legendary_milestone BOOLEAN NOT NULL DEFAULT FALSE,
    milestone_flat_wonder INTEGER NOT NULL DEFAULT 0,
    milestone_flat_petals INTEGER NOT NULL DEFAULT 0,
    description TEXT
);

-- Level Progression Curve (Section 8)
CREATE TABLE IF NOT EXISTS public.rpg_level_config (
    level INTEGER PRIMARY KEY CHECK (level >= 1),
    cumulative_wonder INTEGER NOT NULL CHECK (cumulative_wonder >= 0),
    title TEXT
);

-- Reward Tiers (Section 7)
CREATE TABLE IF NOT EXISTS public.rpg_reward_tiers (
    tier_number INTEGER PRIMARY KEY CHECK (tier_number >= 1),
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    unlock_lifetime_coins INTEGER NOT NULL CHECK (unlock_lifetime_coins >= 0),
    description TEXT
);

-- Reward Items Catalog
CREATE TABLE IF NOT EXISTS public.rpg_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier_number INTEGER NOT NULL REFERENCES public.rpg_reward_tiers(tier_number) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('badge', 'title', 'frame', 'theme', 'effect', 'consumable')),
    price INTEGER NOT NULL CHECK (price >= 0),
    is_consumable BOOLEAN NOT NULL DEFAULT FALSE,
    quantity_default INTEGER NOT NULL DEFAULT 1,
    rarity TEXT NOT NULL DEFAULT 'Common' CHECK (rarity IN ('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Achievements Catalog
CREATE TABLE IF NOT EXISTS public.rpg_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    requirement_type TEXT NOT NULL, -- 'completed_tasks', 'streak_days', 'wonder_earned', 'petals_spent'
    requirement_value INTEGER NOT NULL CHECK (requirement_value > 0),
    reward_xp INTEGER NOT NULL DEFAULT 0 CHECK (reward_xp >= 0),
    reward_coins INTEGER NOT NULL DEFAULT 0 CHECK (reward_coins >= 0),
    icon TEXT NOT NULL DEFAULT '🏆',
    rarity TEXT NOT NULL DEFAULT 'Common',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- 3. USER-SCOPED DATA TABLES
-- ==============================================================================

-- RPG Profiles (Section 10) - 1:1 with auth.users(id)
CREATE TABLE IF NOT EXISTS public.rpg_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),                          -- Wonder
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),                    -- Windfall Petals
    lifetime_coins INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_coins >= 0),  -- Lifetime Petals (never decreases)
    current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),  -- Ember Trail
    longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
    last_active_date DATE,
    last_daily_bonus_date DATE,
    last_weekly_bonus_date DATE,
    last_monthly_bonus_date DATE,
    last_yearly_bonus_date DATE,
    active_title TEXT,
    active_badge TEXT,
    active_frame TEXT,
    active_theme TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RPG Tasks
CREATE TABLE IF NOT EXISTS public.rpg_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT NOT NULL REFERENCES public.rpg_difficulty_config(difficulty_key),
    recurrence_type TEXT NOT NULL REFERENCES public.rpg_frequency_config(frequency_key),
    recurrence_config JSONB DEFAULT '{}'::jsonb,
    category TEXT NOT NULL DEFAULT 'general',
    is_designated_daily BOOLEAN NOT NULL DEFAULT FALSE,
    is_designated_weekly BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Task Completions (Idempotency Enforced)
CREATE TABLE IF NOT EXISTS public.rpg_task_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.rpg_tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    awarded_xp INTEGER NOT NULL CHECK (awarded_xp >= 0),
    awarded_coins INTEGER NOT NULL CHECK (awarded_coins >= 0),
    streak_bonus NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
    idempotency_key TEXT NOT NULL,
    CONSTRAINT unique_task_idempotency UNIQUE (idempotency_key)
);

-- User Inventory / Owned Rewards
CREATE TABLE IF NOT EXISTS public.rpg_user_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES public.rpg_rewards(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    equipped BOOLEAN NOT NULL DEFAULT FALSE,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_permanent_reward UNIQUE (user_id, reward_id)
);

-- User Achievements Progress
CREATE TABLE IF NOT EXISTS public.rpg_user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.rpg_achievements(id) ON DELETE CASCADE,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
    unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

-- Financial & XP Audit Ledgers
CREATE TABLE IF NOT EXISTS public.rpg_coin_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- positive for gains, negative for purchases
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('task_completion', 'daily_bonus', 'weekly_bonus', 'monthly_bonus', 'yearly_bonus', 'achievement', 'reward_purchase')),
    source_type TEXT,
    source_id UUID,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.rpg_xp_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount >= 0),
    source_type TEXT NOT NULL,
    source_id UUID,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- 4. SEED DATA POPULATION
-- ==============================================================================

-- Difficulties
INSERT INTO public.rpg_difficulty_config (difficulty_key, name, icon, base_wonder, sort_order)
VALUES
    ('gentle', 'Gentle', '🍃', 10, 1),
    ('growing', 'Growing', '🌱', 20, 2),
    ('challenging', 'Challenging', '🌸', 40, 3),
    ('heroic', 'Heroic', '🔥', 75, 4),
    ('legendary', 'Legendary', '🌙', 150, 5)
ON CONFLICT (difficulty_key) DO UPDATE
SET name = EXCLUDED.name, icon = EXCLUDED.icon, base_wonder = EXCLUDED.base_wonder;

-- Frequencies
INSERT INTO public.rpg_frequency_config (frequency_key, name, multiplier, sort_order)
VALUES
    ('one_time', 'One-time', 1.00, 1),
    ('daily', 'Daily', 1.10, 2),
    ('three_weekly', '3× Weekly', 1.20, 3),
    ('weekly', 'Weekly', 1.30, 4),
    ('monthly', 'Monthly', 1.60, 5),
    ('yearly', 'Yearly', 2.50, 6)
ON CONFLICT (frequency_key) DO UPDATE
SET name = EXCLUDED.name, multiplier = EXCLUDED.multiplier;

-- Ember Trail Streak Tiers
INSERT INTO public.rpg_streak_config (min_days, bonus_multiplier, is_legendary_milestone, milestone_flat_wonder, milestone_flat_petals, description)
VALUES
    (3, 1.05, FALSE, 0, 0, '3 Days: +5% Wonder Bonus'),
    (7, 1.10, FALSE, 0, 0, '7 Days: +10% Wonder Bonus'),
    (14, 1.15, FALSE, 0, 0, '14 Days: +15% Wonder Bonus'),
    (30, 1.25, FALSE, 0, 0, '30 Days: +25% Wonder Bonus'),
    (60, 1.35, FALSE, 0, 0, '60 Days: +35% Wonder Bonus'),
    (100, 1.50, FALSE, 0, 0, '100 Days: +50% Wonder Bonus (Capped)'),
    (365, 1.50, TRUE, 2500, 1000, '365 Days: Legendary Year Milestone Reward')
ON CONFLICT (min_days) DO UPDATE
SET bonus_multiplier = EXCLUDED.bonus_multiplier, is_legendary_milestone = EXCLUDED.is_legendary_milestone;

-- Levels Curve (1 to 20 Starter Curve, Extendable)
INSERT INTO public.rpg_level_config (level, cumulative_wonder, title)
VALUES
    (1, 0, 'Little Acorn'),
    (2, 100, 'Sprout Tender'),
    (3, 250, 'Pathfinder'),
    (4, 450, 'Lantern Carrier'),
    (5, 700, 'Hearth Keeper'),
    (6, 1000, 'Quiet Alchemist'),
    (7, 1400, 'Woodland Weaver'),
    (8, 1900, 'Moonlit Watcher'),
    (9, 2500, 'Starlit Pilgrim'),
    (10, 3200, 'Keeper of Small Magics'),
    (11, 4000, 'Breeze Whisperer'),
    (12, 5000, 'Ancient Oak Guardian'),
    (13, 6200, 'Celestial Caretaker'),
    (14, 7600, 'Sanctuary Master'),
    (15, 9200, 'Warden of the Dawn')
ON CONFLICT (level) DO UPDATE
SET cumulative_wonder = EXCLUDED.cumulative_wonder, title = EXCLUDED.title;

-- 10 Reward Tiers ("Keeper of Small Magics")
INSERT INTO public.rpg_reward_tiers (tier_number, name, icon, unlock_lifetime_coins, description)
VALUES
    (1, 'Little Acorn', '🌱', 0, 'Where every magical journey begins. Seeds of daily wonder.'),
    (2, 'Lantern-Bearer', '🍃', 250, 'Carrying a gentle flame through twilight forests.'),
    (3, 'Petal Charmer', '🌸', 500, 'Flowers bloom in the footsteps of steady habits.'),
    (4, 'Kindled Wayfarer', '🔥', 1000, 'A hearth built in the heart of deep focus.'),
    (5, 'Moonlit Drifter', '🌙', 2000, 'Night skies and quiet reveries guide your craft.'),
    (6, 'Wildwood Keeper', '🌿', 4000, 'The deep green sanctuary listens to your call.'),
    (7, 'Starlit Roamer', '⭐', 7500, 'Constellations form from your completed constellations.'),
    (8, 'Skybound Wanderer', '💎', 12500, 'Floating above the clouds with unshakeable consistency.'),
    (9, 'Dreamlight Keeper', '🌌', 20000, 'Woven into the very fabric of gentle legends.'),
    (10, 'Warden of the Heavens', '👑', 35000, 'Supreme guardian of timeless sanctuary magic.')
ON CONFLICT (tier_number) DO UPDATE
SET name = EXCLUDED.name, icon = EXCLUDED.icon, unlock_lifetime_coins = EXCLUDED.unlock_lifetime_coins;

-- Sample Rewards Catalogue
INSERT INTO public.rpg_rewards (tier_number, name, description, reward_type, price, is_consumable, rarity)
VALUES
    (1, 'Acorn Scout Pin', 'A small wooden badge carved from fallen cedar.', 'badge', 25, FALSE, 'Common'),
    (1, 'Morning Dew Theme', 'Soft morning sunlight across timber floorboards.', 'theme', 60, FALSE, 'Common'),
    (2, 'Brass Lantern Frame', 'Warm amber glow bordering your traveler profile.', 'frame', 120, FALSE, 'Uncommon'),
    (2, 'Title: The Patient', 'Title displayed beneath your name.', 'title', 80, FALSE, 'Uncommon'),
    (3, 'Dancing Petals Effect', 'Falling cherry blossom petals drift behind your tasks.', 'effect', 200, FALSE, 'Rare'),
    (4, 'Hearthside Hearth Theme', 'Warm stone fireplace with crackling amber embers.', 'theme', 350, FALSE, 'Rare'),
    (5, 'Silver Moon Badge', 'An engraved silver emblem that glimmers softly.', 'badge', 450, FALSE, 'Epic'),
    (6, 'Ancient Cedar Frame', 'Lush mossy bark and creeping ivy frame.', 'frame', 700, FALSE, 'Epic'),
    (7, 'Shooting Star Aura', 'Constellation trails hover around your companion.', 'effect', 1200, FALSE, 'Legendary'),
    (10, 'Celestial Crown', 'The crest of the Warden of the Heavens.', 'title', 5000, FALSE, 'Mythic')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 5. SERVER-SIDE RPC FUNCTIONS (Section 11)
-- ==============================================================================

-- Helper: Ensure an rpg_profiles row exists for a given user
CREATE OR REPLACE FUNCTION public.rpg_ensure_profile(p_user_id UUID)
RETURNS public.rpg_profiles AS $$
DECLARE
    v_profile public.rpg_profiles;
BEGIN
    IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
        RAISE EXCEPTION 'Unauthorized profile access';
    END IF;

    SELECT * INTO v_profile FROM public.rpg_profiles WHERE user_id = p_user_id;
    IF NOT FOUND THEN
        INSERT INTO public.rpg_profiles (user_id, xp, level, coins, lifetime_coins, current_streak, longest_streak)
        VALUES (p_user_id, 0, 1, 0, 0, 0, 0)
        RETURNING * INTO v_profile;
    END IF;
    RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper: Calculate Level from Cumulative Wonder (from rpg_level_config)
CREATE OR REPLACE FUNCTION public.rpg_calculate_level(p_xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_level INTEGER := 1;
BEGIN
    SELECT level INTO v_level
    FROM public.rpg_level_config
    WHERE cumulative_wonder <= p_xp
    ORDER BY level DESC
    LIMIT 1;

    RETURN COALESCE(v_level, 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- ------------------------------------------------------------------------------
-- RPC 1: rpg_complete_task(task_id, idempotency_key)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpg_complete_task(
    p_task_id UUID,
    p_idempotency_key TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_task public.rpg_tasks;
    v_profile public.rpg_profiles;
    v_base_wonder INTEGER;
    v_freq_mult NUMERIC(4, 2);
    v_streak_mult NUMERIC(4, 2) := 1.0;
    v_final_wonder INTEGER;
    v_windfall_petals INTEGER;
    v_today DATE := CURRENT_DATE;
    v_yesterday DATE := CURRENT_DATE - 1;
    v_new_streak INTEGER;
    v_longest_streak INTEGER;
    v_new_level INTEGER;
    v_existing_completion public.rpg_task_completions;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- 1. Idempotency Check
    SELECT * INTO v_existing_completion
    FROM public.rpg_task_completions
    WHERE idempotency_key = p_idempotency_key
      AND user_id = v_user_id;

    IF FOUND THEN
        -- Return already completed state gracefully
        SELECT * INTO v_profile FROM public.rpg_profiles WHERE user_id = v_user_id;
        RETURN jsonb_build_object(
            'success', TRUE,
            'idempotent_duplicate', TRUE,
            'awarded_wonder', v_existing_completion.awarded_xp,
            'awarded_petals', v_existing_completion.awarded_coins,
            'total_wonder', v_profile.xp,
            'level', v_profile.level,
            'windfall_petals', v_profile.coins,
            'lifetime_petals', v_profile.lifetime_coins,
            'ember_trail', v_profile.current_streak
        );
    END IF;

    -- 2. Validate Task Ownership & Existence
    SELECT * INTO v_task
    FROM public.rpg_tasks
    WHERE id = p_task_id AND user_id = v_user_id AND active = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Task not found or inactive';
    END IF;

    -- 3. Fetch Configuration Parameters
    SELECT base_wonder INTO v_base_wonder
    FROM public.rpg_difficulty_config
    WHERE difficulty_key = v_task.difficulty;

    IF v_base_wonder IS NULL THEN
        v_base_wonder := 10;
    END IF;

    SELECT multiplier INTO v_freq_mult
    FROM public.rpg_frequency_config
    WHERE frequency_key = v_task.recurrence_type;

    IF v_freq_mult IS NULL THEN
        v_freq_mult := 1.0;
    END IF;

    -- 4. Get & Update Ember Trail (Streak)
    v_profile := public.rpg_ensure_profile(v_user_id);

    IF v_profile.last_active_date = v_today THEN
        -- Already logged today: maintain current streak
        v_new_streak := GREATEST(v_profile.current_streak, 1);
    ELSIF v_profile.last_active_date = v_yesterday THEN
        -- Continued consecutive day
        v_new_streak := v_profile.current_streak + 1;
    ELSE
        -- Streak broken or brand new
        v_new_streak := 1;
    END IF;

    v_longest_streak := GREATEST(v_new_streak, v_profile.longest_streak);

    -- 5. Highest Applicable Streak Multiplier
    SELECT bonus_multiplier INTO v_streak_mult
    FROM public.rpg_streak_config
    WHERE min_days <= v_new_streak
    ORDER BY min_days DESC
    LIMIT 1;

    IF v_streak_mult IS NULL THEN
        v_streak_mult := 1.0;
    END IF;

    -- 6. Server-Side Calculations (Section 6)
    -- final_wonder = ROUND( base_wonder * frequency_multiplier * ember_multiplier )
    -- windfall_petals = ROUND( final_wonder * 0.40 )
    v_final_wonder := ROUND(v_base_wonder::NUMERIC * v_freq_mult * v_streak_mult);
    v_windfall_petals := ROUND(v_final_wonder::NUMERIC * 0.40);

    -- 7. Update Profile
    v_new_level := public.rpg_calculate_level(v_profile.xp + v_final_wonder);

    UPDATE public.rpg_profiles
    SET
        xp = xp + v_final_wonder,
        level = v_new_level,
        coins = coins + v_windfall_petals,
        lifetime_coins = lifetime_coins + v_windfall_petals,
        current_streak = v_new_streak,
        longest_streak = v_longest_streak,
        last_active_date = v_today,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE user_id = v_user_id
    RETURNING * INTO v_profile;

    -- 8. Record Task Completion (with unique idempotency key)
    INSERT INTO public.rpg_task_completions (
        task_id, user_id, awarded_xp, awarded_coins, streak_bonus, idempotency_key
    ) VALUES (
        v_task.id, v_user_id, v_final_wonder, v_windfall_petals, v_streak_mult, p_idempotency_key
    );

    -- 9. Audit Transactions
    INSERT INTO public.rpg_xp_transactions (user_id, amount, source_type, source_id, description)
    VALUES (v_user_id, v_final_wonder, 'task_completion', v_task.id, 'Wonder earned from: ' || v_task.title);

    INSERT INTO public.rpg_coin_transactions (user_id, amount, transaction_type, source_type, source_id, description)
    VALUES (v_user_id, v_windfall_petals, 'task_completion', 'task', v_task.id, 'Windfall Petals earned from: ' || v_task.title);

    RETURN jsonb_build_object(
        'success', TRUE,
        'idempotent_duplicate', FALSE,
        'awarded_wonder', v_final_wonder,
        'awarded_petals', v_windfall_petals,
        'multiplier_applied', v_streak_mult,
        'total_wonder', v_profile.xp,
        'level', v_profile.level,
        'windfall_petals', v_profile.coins,
        'lifetime_petals', v_profile.lifetime_coins,
        'ember_trail', v_profile.current_streak,
        'longest_trail', v_profile.longest_streak
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- RPC 2: rpg_claim_daily_bonus()
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpg_claim_daily_bonus()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_profile public.rpg_profiles;
    v_uncompleted_daily_count INTEGER;
    v_today DATE := CURRENT_DATE;
    v_bonus_wonder INTEGER := 50;
    v_bonus_petals INTEGER := 25;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    v_profile := public.rpg_ensure_profile(v_user_id);

    IF v_profile.last_daily_bonus_date = v_today THEN
        RAISE EXCEPTION 'Daily Spirit Gift already claimed today';
    END IF;

    -- Check if all designated daily quests are complete today
    SELECT COUNT(*) INTO v_uncompleted_daily_count
    FROM public.rpg_tasks t
    WHERE t.user_id = v_user_id
      AND t.active = TRUE
      AND t.is_designated_daily = TRUE
      AND NOT EXISTS (
          SELECT 1 FROM public.rpg_task_completions c
          WHERE c.task_id = t.id AND c.completed_at::DATE = v_today
      );

    IF v_uncompleted_daily_count > 0 THEN
        RAISE EXCEPTION 'Incomplete daily quests remaining: %', v_uncompleted_daily_count;
    END IF;

    -- Grant bonus
    UPDATE public.rpg_profiles
    SET
        xp = xp + v_bonus_wonder,
        level = public.rpg_calculate_level(xp + v_bonus_wonder),
        coins = coins + v_bonus_petals,
        lifetime_coins = lifetime_coins + v_bonus_petals,
        last_daily_bonus_date = v_today,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE user_id = v_user_id
    RETURNING * INTO v_profile;

    INSERT INTO public.rpg_xp_transactions (user_id, amount, source_type, description)
    VALUES (v_user_id, v_bonus_wonder, 'daily_bonus', 'Daily Spirit Gift Wonder');

    INSERT INTO public.rpg_coin_transactions (user_id, amount, transaction_type, description)
    VALUES (v_user_id, v_bonus_petals, 'daily_bonus', 'Daily Spirit Gift Petals');

    RETURN jsonb_build_object(
        'success', TRUE,
        'claimed', 'Daily Spirit Gift',
        'awarded_wonder', v_bonus_wonder,
        'awarded_petals', v_bonus_petals,
        'total_wonder', v_profile.xp,
        'windfall_petals', v_profile.coins
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- RPC 3: Cadence Bonuses: Weekly, Monthly, Yearly
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpg_claim_weekly_bonus()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_profile public.rpg_profiles;
    v_today DATE := CURRENT_DATE;
    v_bonus_wonder INTEGER := 150;
    v_bonus_petals INTEGER := 80;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    v_profile := public.rpg_ensure_profile(v_user_id);

    IF v_profile.last_weekly_bonus_date IS NOT NULL AND v_profile.last_weekly_bonus_date >= (v_today - 6) THEN
        RAISE EXCEPTION 'Moonlit Week bonus already claimed this week';
    END IF;

    UPDATE public.rpg_profiles
    SET
        xp = xp + v_bonus_wonder,
        level = public.rpg_calculate_level(xp + v_bonus_wonder),
        coins = coins + v_bonus_petals,
        lifetime_coins = lifetime_coins + v_bonus_petals,
        last_weekly_bonus_date = v_today
    WHERE user_id = v_user_id
    RETURNING * INTO v_profile;

    RETURN jsonb_build_object('success', TRUE, 'awarded_wonder', v_bonus_wonder, 'awarded_petals', v_bonus_petals);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.rpg_claim_monthly_bonus()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_profile public.rpg_profiles;
    v_today DATE := CURRENT_DATE;
    v_bonus_wonder INTEGER := 600;
    v_bonus_petals INTEGER := 350;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    v_profile := public.rpg_ensure_profile(v_user_id);

    IF v_profile.last_monthly_bonus_date IS NOT NULL AND v_profile.last_monthly_bonus_date >= (v_today - 27) THEN
        RAISE EXCEPTION 'Blossom of the Month bonus already claimed this month';
    END IF;

    UPDATE public.rpg_profiles
    SET
        xp = xp + v_bonus_wonder,
        level = public.rpg_calculate_level(xp + v_bonus_wonder),
        coins = coins + v_bonus_petals,
        lifetime_coins = lifetime_coins + v_bonus_petals,
        last_monthly_bonus_date = v_today
    WHERE user_id = v_user_id
    RETURNING * INTO v_profile;

    RETURN jsonb_build_object('success', TRUE, 'awarded_wonder', v_bonus_wonder, 'awarded_petals', v_bonus_petals);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.rpg_claim_yearly_bonus()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_profile public.rpg_profiles;
    v_today DATE := CURRENT_DATE;
    v_bonus_wonder INTEGER := 5000;
    v_bonus_petals INTEGER := 2500;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    v_profile := public.rpg_ensure_profile(v_user_id);

    IF v_profile.last_yearly_bonus_date IS NOT NULL AND v_profile.last_yearly_bonus_date >= (v_today - 360) THEN
        RAISE EXCEPTION 'Year of Growth bonus already claimed this year';
    END IF;

    UPDATE public.rpg_profiles
    SET
        xp = xp + v_bonus_wonder,
        level = public.rpg_calculate_level(xp + v_bonus_wonder),
        coins = coins + v_bonus_petals,
        lifetime_coins = lifetime_coins + v_bonus_petals,
        last_yearly_bonus_date = v_today
    WHERE user_id = v_user_id
    RETURNING * INTO v_profile;

    RETURN jsonb_build_object('success', TRUE, 'awarded_wonder', v_bonus_wonder, 'awarded_petals', v_bonus_petals);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- RPC 4: rpg_purchase_reward(reward_id)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpg_purchase_reward(p_reward_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_reward public.rpg_rewards;
    v_tier public.rpg_reward_tiers;
    v_profile public.rpg_profiles;
    v_existing_user_reward public.rpg_user_rewards;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- 1. Get Reward & Tier
    SELECT * INTO v_reward FROM public.rpg_rewards WHERE id = p_reward_id AND active = TRUE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reward not found or inactive';
    END IF;

    SELECT * INTO v_tier FROM public.rpg_reward_tiers WHERE tier_number = v_reward.tier_number;

    -- 2. Get User Profile
    v_profile := public.rpg_ensure_profile(v_user_id);

    -- 3. Check Tier Unlock via Lifetime Petals (never decreases)
    IF v_profile.lifetime_coins < v_tier.unlock_lifetime_coins THEN
        RAISE EXCEPTION 'Tier locked: requires % Lifetime Petals, you have %', v_tier.unlock_lifetime_coins, v_profile.lifetime_coins;
    END IF;

    -- 4. Check Windfall Petals Balance
    IF v_profile.coins < v_reward.price THEN
        RAISE EXCEPTION 'Insufficient Windfall Petals: requires %, you have %', v_reward.price, v_profile.coins;
    END IF;

    -- 5. Duplicate Check for Non-Consumable (Permanent) Items
    SELECT * INTO v_existing_user_reward
    FROM public.rpg_user_rewards
    WHERE user_id = v_user_id AND reward_id = p_reward_id;

    IF FOUND AND NOT v_reward.is_consumable THEN
        RAISE EXCEPTION 'You already own this permanent reward';
    END IF;

    -- 6. Deduct Windfall Petals (Note: lifetime_coins is untouched!)
    UPDATE public.rpg_profiles
    SET coins = coins - v_reward.price,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE user_id = v_user_id
    RETURNING * INTO v_profile;

    -- 7. Grant Reward
    IF FOUND AND v_reward.is_consumable THEN
        UPDATE public.rpg_user_rewards
        SET quantity = quantity + 1
        WHERE user_id = v_user_id AND reward_id = p_reward_id;
    ELSE
        INSERT INTO public.rpg_user_rewards (user_id, reward_id, quantity, equipped)
        VALUES (v_user_id, p_reward_id, 1, FALSE);
    END IF;

    -- 8. Audit Ledger
    INSERT INTO public.rpg_coin_transactions (user_id, amount, transaction_type, source_type, source_id, description)
    VALUES (v_user_id, -v_reward.price, 'reward_purchase', 'reward', p_reward_id, 'Purchased: ' || v_reward.name);

    RETURN jsonb_build_object(
        'success', TRUE,
        'reward_id', p_reward_id,
        'reward_name', v_reward.name,
        'remaining_petals', v_profile.coins,
        'lifetime_petals', v_profile.lifetime_coins
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- RPC 5: rpg_equip_reward(reward_id)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpg_equip_reward(p_reward_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_user_reward public.rpg_user_rewards;
    v_reward public.rpg_rewards;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Verify user owns the reward
    SELECT * INTO v_user_reward
    FROM public.rpg_user_rewards
    WHERE user_id = v_user_id AND reward_id = p_reward_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reward not owned by user';
    END IF;

    SELECT * INTO v_reward FROM public.rpg_rewards WHERE id = p_reward_id;

    -- Unequip other items in same reward_type slot
    UPDATE public.rpg_user_rewards ur
    SET equipped = FALSE
    FROM public.rpg_rewards r
    WHERE ur.reward_id = r.id
      AND ur.user_id = v_user_id
      AND r.reward_type = v_reward.reward_type;

    -- Equip the chosen item
    UPDATE public.rpg_user_rewards
    SET equipped = TRUE
    WHERE user_id = v_user_id AND reward_id = p_reward_id;

    -- Reflect in active profile slot
    IF v_reward.reward_type = 'title' THEN
        UPDATE public.rpg_profiles SET active_title = v_reward.name WHERE user_id = v_user_id;
    ELSIF v_reward.reward_type = 'badge' THEN
        UPDATE public.rpg_profiles SET active_badge = v_reward.name WHERE user_id = v_user_id;
    ELSIF v_reward.reward_type = 'frame' THEN
        UPDATE public.rpg_profiles SET active_frame = v_reward.name WHERE user_id = v_user_id;
    ELSIF v_reward.reward_type = 'theme' THEN
        UPDATE public.rpg_profiles SET active_theme = v_reward.name WHERE user_id = v_user_id;
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'equipped_reward', v_reward.name,
        'slot', v_reward.reward_type
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- RPC 6: rpg_get_shop_state() - Returns 3 Lock States Computed Server-Side
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpg_get_shop_state()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_profile public.rpg_profiles;
    v_result JSONB;
BEGIN
    IF v_user_id IS NOT NULL THEN
        v_profile := public.rpg_ensure_profile(v_user_id);
    ELSE
        -- Default view for unauthenticated catalog lookup
        v_profile.coins := 0;
        v_profile.lifetime_coins := 0;
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'tier_number', t.tier_number,
            'tier_name', t.name,
            'tier_icon', t.icon,
            'unlock_lifetime_coins', t.unlock_lifetime_coins,
            'is_tier_unlocked', (v_profile.lifetime_coins >= t.unlock_lifetime_coins),
            'items', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', r.id,
                        'name', r.name,
                        'description', r.description,
                        'reward_type', r.reward_type,
                        'price', r.price,
                        'rarity', r.rarity,
                        'is_consumable', r.is_consumable,
                        'is_owned', (
                            SELECT EXISTS (
                                SELECT 1 FROM public.rpg_user_rewards ur
                                WHERE ur.user_id = v_user_id AND ur.reward_id = r.id
                            )
                        ),
                        'is_equipped', (
                            SELECT COALESCE(
                                (SELECT ur.equipped FROM public.rpg_user_rewards ur
                                 WHERE ur.user_id = v_user_id AND ur.reward_id = r.id),
                                FALSE
                            )
                        ),
                        'lock_state', (
                            CASE
                                WHEN v_profile.lifetime_coins < t.unlock_lifetime_coins THEN 'tier_locked'
                                WHEN v_profile.coins < r.price THEN 'insufficient_coins'
                                ELSE 'available'
                            END
                        )
                    )
                )
                FROM public.rpg_rewards r
                WHERE r.tier_number = t.tier_number AND r.active = TRUE
            )
        )
        ORDER BY t.tier_number ASC
    ) INTO v_result
    FROM public.rpg_reward_tiers t;

    RETURN jsonb_build_object(
        'current_petals', v_profile.coins,
        'lifetime_petals', v_profile.lifetime_coins,
        'tiers', COALESCE(v_result, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- RPC 7: rpg_get_profile_summary() - Single Read for Frontend
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpg_get_profile_summary()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_profile public.rpg_profiles;
    v_next_level_xp INTEGER;
    v_current_tier public.rpg_reward_tiers;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    v_profile := public.rpg_ensure_profile(v_user_id);

    -- Find next level threshold
    SELECT cumulative_wonder INTO v_next_level_xp
    FROM public.rpg_level_config
    WHERE level = v_profile.level + 1;

    -- Current Reward Tier
    SELECT * INTO v_current_tier
    FROM public.rpg_reward_tiers
    WHERE unlock_lifetime_coins <= v_profile.lifetime_coins
    ORDER BY tier_number DESC
    LIMIT 1;

    RETURN jsonb_build_object(
        'user_id', v_user_id,
        'wonder', v_profile.xp,
        'level', v_profile.level,
        'next_level_wonder', v_next_level_xp,
        'windfall_petals', v_profile.coins,
        'lifetime_petals', v_profile.lifetime_coins,
        'ember_trail', v_profile.current_streak,
        'longest_ember_trail', v_profile.longest_streak,
        'current_tier', jsonb_build_object(
            'tier_number', v_current_tier.tier_number,
            'name', v_current_tier.name,
            'icon', v_current_tier.icon
        ),
        'cosmetics', jsonb_build_object(
            'active_title', v_profile.active_title,
            'active_badge', v_profile.active_badge,
            'active_frame', v_profile.active_frame,
            'active_theme', v_profile.active_theme
        ),
        'labels', jsonb_build_object(
            'xp_label', 'Wonder',
            'coins_label', 'Windfall Petals',
            'lifetime_coins_label', 'Lifetime Petals',
            'streak_label', 'Ember Trail'
        )
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES (Section 12)
-- ==============================================================================

ALTER TABLE public.rpg_difficulty_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpg_frequency_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpg_streak_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpg_level_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpg_reward_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpg_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpg_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpg_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpg_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpg_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpg_user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpg_user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpg_coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpg_xp_transactions ENABLE ROW LEVEL SECURITY;

-- Config tables: Public Read-Only, Service Role Writes
CREATE POLICY "Public read rpg_difficulty_config" ON public.rpg_difficulty_config FOR SELECT USING (true);
CREATE POLICY "Public read rpg_frequency_config" ON public.rpg_frequency_config FOR SELECT USING (true);
CREATE POLICY "Public read rpg_streak_config" ON public.rpg_streak_config FOR SELECT USING (true);
CREATE POLICY "Public read rpg_level_config" ON public.rpg_level_config FOR SELECT USING (true);
CREATE POLICY "Public read rpg_reward_tiers" ON public.rpg_reward_tiers FOR SELECT USING (true);
CREATE POLICY "Public read rpg_rewards" ON public.rpg_rewards FOR SELECT USING (true);
CREATE POLICY "Public read rpg_achievements" ON public.rpg_achievements FOR SELECT USING (true);

-- User Tasks: Full CRUD for own tasks
CREATE POLICY "Users can view own tasks" ON public.rpg_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.rpg_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.rpg_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.rpg_tasks FOR DELETE USING (auth.uid() = user_id);

-- User Task Completions: Read-Only for user (writes solely via rpg_complete_task RPC)
CREATE POLICY "Users can view own task completions" ON public.rpg_task_completions FOR SELECT USING (auth.uid() = user_id);

-- User Profiles: Read-Only for user (NO direct update policy on economy fields! Writes via RPC only)
CREATE POLICY "Users can view own rpg_profile" ON public.rpg_profiles FOR SELECT USING (auth.uid() = user_id);

-- User Rewards: Read-Only for user (all updates via purchase/equip RPC)
CREATE POLICY "Users can view own user_rewards" ON public.rpg_user_rewards FOR SELECT USING (auth.uid() = user_id);

-- User Achievements: Read-Only for user
CREATE POLICY "Users can view own achievements" ON public.rpg_user_achievements FOR SELECT USING (auth.uid() = user_id);

-- Financial & XP Transactions: Read-Only audit trail
CREATE POLICY "Users can view own coin_transactions" ON public.rpg_coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own xp_transactions" ON public.rpg_xp_transactions FOR SELECT USING (auth.uid() = user_id);
