-- ==============================================================================
-- REKINDLE: LIFE RPG - SUPABASE DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- Run this entire script in your Supabase Project's SQL Editor
-- ==============================================================================

-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. PROFILES TABLE (Linked directly to auth.users via UUID)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL DEFAULT 'Cottage Wanderer',
    avatar TEXT NOT NULL DEFAULT 'female_traveler', -- 'male_traveler' | 'female_traveler'
    pet_type TEXT NOT NULL DEFAULT 'fuzzy_cat',     -- 'fuzzy_cat' | 'shibu_dog' | 'garden_rabbit'
    pet_name TEXT NOT NULL DEFAULT 'Mochi',
    active_theme TEXT NOT NULL DEFAULT 'cottage_day', -- 'cottage_day' | 'cat_cafe' | 'autumn_bookshop'
    level INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    energy INTEGER NOT NULL DEFAULT 100,
    gold INTEGER NOT NULL DEFAULT 50,               -- Also used as Golden Star Tokens
    jar_tokens INTEGER NOT NULL DEFAULT 3,          -- Tokens currently waiting inside the glass jar
    streak_count INTEGER NOT NULL DEFAULT 1,
    last_active_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- ==============================================================================
-- 3. QUESTS / TASKS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    attribute TEXT NOT NULL DEFAULT 'mind', -- 'mind' (Intellect), 'body' (Vitality), 'soul' (Serenity), 'craft' (Order)
    xp_reward INTEGER NOT NULL DEFAULT 25,
    token_reward INTEGER NOT NULL DEFAULT 5,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
    is_daily BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on quests
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

-- Quests Policies
DROP POLICY IF EXISTS "Users can view their own quests" ON public.quests;
CREATE POLICY "Users can view their own quests"
    ON public.quests FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own quests" ON public.quests;
CREATE POLICY "Users can insert their own quests"
    ON public.quests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own quests" ON public.quests;
CREATE POLICY "Users can update their own quests"
    ON public.quests FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own quests" ON public.quests;
CREATE POLICY "Users can delete their own quests"
    ON public.quests FOR DELETE
    USING (auth.uid() = user_id);

-- ==============================================================================
-- 4. INVENTORY & UNLOCKED THEMES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    item_type TEXT NOT NULL DEFAULT 'theme', -- 'theme', 'decor', 'pet_accessory'
    item_name TEXT NOT NULL,
    is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_item UNIQUE (user_id, item_id)
);

-- Enable RLS on inventory
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own inventory" ON public.inventory;
CREATE POLICY "Users can view their own inventory"
    ON public.inventory FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own inventory items" ON public.inventory;
CREATE POLICY "Users can insert their own inventory items"
    ON public.inventory FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own inventory" ON public.inventory;
CREATE POLICY "Users can update their own inventory"
    ON public.inventory FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own inventory items" ON public.inventory;
CREATE POLICY "Users can delete their own inventory items"
    ON public.inventory FOR DELETE
    USING (auth.uid() = user_id);

-- ==============================================================================
-- 5. AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
-- Automatically creates a default profile in public.profiles when an auth.users record is created
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar, pet_type, pet_name, active_theme, level, xp, energy, gold, jar_tokens, streak_count)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar', 'female_traveler'),
        COALESCE(NEW.raw_user_meta_data->>'pet_type', 'fuzzy_cat'),
        COALESCE(NEW.raw_user_meta_data->>'pet_name', 'Mochi'),
        COALESCE(NEW.raw_user_meta_data->>'active_theme', 'cottage_day'),
        1,
        0,
        100,
        50,
        3,
        1
    );

    -- Insert default starter quests for the new wanderer
    INSERT INTO public.quests (user_id, title, description, attribute, xp_reward, token_reward, is_daily)
    VALUES
        (NEW.id, 'Brew a warm herbal tea', 'Savor a quiet, screen-free moment', 'soul', 20, 5, TRUE),
        (NEW.id, '25m Deep Focus Sprint', 'Focus on a creative or learning project', 'mind', 35, 10, TRUE),
        (NEW.id, 'Sunlit Stroll or Stretch', 'Refresh your physical vitality', 'body', 30, 8, TRUE);

    -- Insert default starter themes into inventory
    INSERT INTO public.inventory (user_id, item_id, item_type, item_name, is_equipped)
    VALUES
        (NEW.id, 'cottage_day', 'theme', 'Countryside Cottage', TRUE),
        (NEW.id, 'cat_cafe', 'theme', 'Cat Café Afternoon', FALSE),
        (NEW.id, 'autumn_bookshop', 'theme', 'Autumn Bookshop', FALSE);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 6. NON-LINEAR LEVEL CALCULATION HELPER FUNCTION
-- Formula: XP Required for level L = floor(100 * (L ^ 1.5))
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.calculate_required_xp(target_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
    IF target_level <= 1 THEN
        RETURN 100;
    ELSE
        RETURN FLOOR(100 * POWER(target_level::DOUBLE PRECISION, 1.5));
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==============================================================================
-- 7. ATOMIC REWARD AWARDING STORED PROCEDURE
-- Grants XP and Gold to user, automatically calculating level up
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.award_user_rewards(
    target_user_id UUID,
    add_xp INTEGER,
    add_gold INTEGER
)
RETURNS JSONB AS $$
DECLARE
    cur_xp INTEGER;
    cur_gold INTEGER;
    cur_lvl INTEGER;
    new_xp INTEGER;
    new_gold INTEGER;
    new_lvl INTEGER;
    req_xp INTEGER;
BEGIN
    SELECT xp, gold, level INTO cur_xp, cur_gold, cur_lvl
    FROM public.profiles
    WHERE id = target_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
    END IF;

    new_xp := COALESCE(cur_xp, 0) + add_xp;
    new_gold := COALESCE(cur_gold, 0) + add_gold;
    new_lvl := COALESCE(cur_lvl, 1);

    -- Check for level advances using non-linear curve
    LOOP
        req_xp := FLOOR(100 * POWER(new_lvl::DOUBLE PRECISION, 1.5));
        IF new_xp >= req_xp THEN
            new_lvl := new_lvl + 1;
        ELSE
            EXIT;
        END IF;
    END LOOP;

    UPDATE public.profiles
    SET xp = new_xp,
        gold = new_gold,
        level = new_lvl,
        last_active_date = CURRENT_DATE,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = target_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'new_xp', new_xp,
        'new_gold', new_gold,
        'new_level', new_lvl,
        'leveled_up', (new_lvl > cur_lvl)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
