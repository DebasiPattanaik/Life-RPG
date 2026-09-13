-- LIFE RPG: Auth-linked player persistence hardening
-- Run AFTER 20260912_rpg_backend_v2_1.sql

ALTER TABLE public.rpg_profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS avatar TEXT NOT NULL DEFAULT 'female_traveler',
  ADD COLUMN IF NOT EXISTS pet_type TEXT NOT NULL DEFAULT 'fuzzy_cat',
  ADD COLUMN IF NOT EXISTS pet_name TEXT NOT NULL DEFAULT 'Mochi',
  ADD COLUMN IF NOT EXISTS active_quest_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{"Intellect":25,"Vitality":15,"Serenity":5,"Craft":0}'::jsonb,
  ADD COLUMN IF NOT EXISTS jar_tokens INTEGER NOT NULL DEFAULT 0 CHECK (jar_tokens >= 0),
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Keep all user-facing identity/cosmetic/player-state data on the Auth-linked profile row.
CREATE OR REPLACE FUNCTION public.rpg_ensure_profile(p_user_id UUID)
RETURNS public.rpg_profiles AS $$
DECLARE
  v_profile public.rpg_profiles;
  v_email TEXT;
  v_metadata JSONB;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized profile access';
  END IF;

  SELECT email, raw_user_meta_data INTO v_email, v_metadata FROM auth.users WHERE id = p_user_id;
  SELECT * INTO v_profile FROM public.rpg_profiles WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.rpg_profiles (
      user_id, username, avatar, pet_type, pet_name, active_theme,
      active_quest_ids, attributes, jar_tokens,
      xp, level, coins, lifetime_coins, current_streak, longest_streak
    ) VALUES (
      p_user_id,
      COALESCE(NULLIF(v_metadata->>'username', ''), NULLIF(split_part(COALESCE(v_email, ''), '@', 1), ''), 'Cottage Wanderer'),
      COALESCE(NULLIF(v_metadata->>'avatar', ''), 'female_traveler'),
      COALESCE(NULLIF(v_metadata->>'pet_type', ''), 'fuzzy_cat'),
      COALESCE(NULLIF(v_metadata->>'pet_name', ''), 'Mochi'),
      COALESCE(NULLIF(v_metadata->>'active_theme', ''), 'cottage_day'),
      '[]'::jsonb,
      '{"Intellect":25,"Vitality":15,"Serenity":5,"Craft":0}'::jsonb,
      0, 0, 1, 0, 0, 0, 0
    )
    RETURNING * INTO v_profile;
  ELSE
    UPDATE public.rpg_profiles
    SET
      username = COALESCE(NULLIF(username, ''), COALESCE(NULLIF(split_part(COALESCE(v_email, ''), '@', 1), ''), 'Cottage Wanderer')),
      avatar = COALESCE(NULLIF(avatar, ''), 'female_traveler'),
      pet_type = COALESCE(NULLIF(pet_type, ''), 'fuzzy_cat'),
      pet_name = COALESCE(NULLIF(pet_name, ''), 'Mochi'),
      active_theme = COALESCE(NULLIF(active_theme, ''), 'cottage_day'),
      active_quest_ids = COALESCE(active_quest_ids, '[]'::jsonb),
      attributes = COALESCE(attributes, '{"Intellect":25,"Vitality":15,"Serenity":5,"Craft":0}'::jsonb),
      jar_tokens = COALESCE(jar_tokens, 0),
      updated_at = TIMEZONE('utc', NOW())
    WHERE user_id = p_user_id
    RETURNING * INTO v_profile;
  END IF;

  RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Single authenticated write for non-economy player preferences/state.
CREATE OR REPLACE FUNCTION public.rpg_update_player_profile(
  p_username TEXT DEFAULT NULL,
  p_avatar TEXT DEFAULT NULL,
  p_pet_type TEXT DEFAULT NULL,
  p_pet_name TEXT DEFAULT NULL,
  p_active_theme TEXT DEFAULT NULL,
  p_active_quest_ids JSONB DEFAULT NULL,
  p_onboarding_completed BOOLEAN DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_profile public.rpg_profiles;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  v_profile := public.rpg_ensure_profile(v_user_id);

  UPDATE public.rpg_profiles
  SET
    username = CASE WHEN p_username IS NULL THEN username ELSE COALESCE(NULLIF(trim(p_username), ''), username) END,
    avatar = CASE WHEN p_avatar IS NULL THEN avatar ELSE p_avatar END,
    pet_type = CASE WHEN p_pet_type IS NULL THEN pet_type ELSE p_pet_type END,
    pet_name = CASE WHEN p_pet_name IS NULL THEN pet_name ELSE COALESCE(NULLIF(trim(p_pet_name), ''), pet_name) END,
    active_theme = CASE WHEN p_active_theme IS NULL THEN active_theme ELSE p_active_theme END,
    active_quest_ids = CASE
      WHEN p_active_quest_ids IS NULL THEN active_quest_ids
      WHEN jsonb_typeof(p_active_quest_ids) = 'array' THEN p_active_quest_ids
      ELSE active_quest_ids
    END,
    onboarding_completed = COALESCE(p_onboarding_completed, onboarding_completed),
    updated_at = TIMEZONE('utc', NOW())
  WHERE user_id = v_user_id
  RETURNING * INTO v_profile;

  RETURN jsonb_build_object(
    'success', TRUE,
    'user_id', v_user_id,
    'username', v_profile.username,
    'avatar', v_profile.avatar,
    'pet_type', v_profile.pet_type,
    'pet_name', v_profile.pet_name,
    'active_theme', v_profile.active_theme,
    'active_quest_ids', v_profile.active_quest_ids,
    'onboarding_completed', v_profile.onboarding_completed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create/sync the canonical cottage quest rows for this Auth user.
-- The client supplies only descriptive data; reward amounts are always server-derived.
CREATE OR REPLACE FUNCTION public.rpg_sync_cottage_tasks(p_tasks JSONB)
RETURNS INTEGER AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_task JSONB;
  v_count INTEGER := 0;
  v_existing UUID;
  v_difficulty TEXT;
  v_recurrence TEXT;
  v_category TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF jsonb_typeof(p_tasks) <> 'array' THEN RAISE EXCEPTION 'p_tasks must be a JSON array'; END IF;

  FOR v_task IN SELECT * FROM jsonb_array_elements(p_tasks) LOOP
    IF NULLIF(trim(v_task->>'title'), '') IS NULL THEN CONTINUE; END IF;

    v_difficulty := CASE lower(COALESCE(v_task->>'difficulty','easy'))
      WHEN 'hard' THEN 'heroic'
      WHEN 'medium' THEN 'growing'
      ELSE 'gentle'
    END;
    v_recurrence := CASE WHEN COALESCE((v_task->>'is_daily')::boolean, TRUE) THEN 'daily' ELSE 'one_time' END;
    v_category := lower(COALESCE(v_task->>'category','general'));

    SELECT id INTO v_existing
    FROM public.rpg_tasks
    WHERE user_id = v_user_id AND title = trim(v_task->>'title')
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_existing IS NULL THEN
      INSERT INTO public.rpg_tasks (
        user_id, title, description, difficulty, recurrence_type, category,
        is_designated_daily, active
      ) VALUES (
        v_user_id,
        trim(v_task->>'title'),
        COALESCE(v_task->>'flavor_text', ''),
        v_difficulty,
        v_recurrence,
        v_category,
        v_recurrence = 'daily',
        TRUE
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Include ALL persistent player fields in the authenticated profile summary.
CREATE OR REPLACE FUNCTION public.rpg_get_profile_summary()
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_profile public.rpg_profiles;
  v_next_level_xp INTEGER;
  v_current_tier public.rpg_reward_tiers;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  v_profile := public.rpg_ensure_profile(v_user_id);

  SELECT cumulative_wonder INTO v_next_level_xp
  FROM public.rpg_level_config
  WHERE level = v_profile.level + 1;

  SELECT * INTO v_current_tier
  FROM public.rpg_reward_tiers
  WHERE unlock_lifetime_coins <= v_profile.lifetime_coins
  ORDER BY tier_number DESC LIMIT 1;

  RETURN jsonb_build_object(
    'user_id', v_user_id,
    'username', v_profile.username,
    'avatar', v_profile.avatar,
    'pet_type', v_profile.pet_type,
    'pet_name', v_profile.pet_name,
    'onboarding_completed', v_profile.onboarding_completed,
    'active_quest_ids', v_profile.active_quest_ids,
    'attributes', v_profile.attributes,
    'jar_tokens', v_profile.jar_tokens,
    'wonder', v_profile.xp,
    'level', v_profile.level,
    'next_level_wonder', v_next_level_xp,
    'windfall_petals', v_profile.coins,
    'lifetime_petals', v_profile.lifetime_coins,
    'ember_trail', v_profile.current_streak,
    'longest_ember_trail', v_profile.longest_streak,
    'last_active_date', v_profile.last_active_date,
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
    )
  );
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public;

-- Replace task completion so attribute progression is persistent too.
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
    v_attribute TEXT;
    v_attributes JSONB;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

    SELECT * INTO v_existing_completion FROM public.rpg_task_completions
    WHERE idempotency_key = p_idempotency_key AND user_id = v_user_id;
    IF FOUND THEN
        SELECT * INTO v_profile FROM public.rpg_profiles WHERE user_id = v_user_id;
        RETURN jsonb_build_object(
          'success', TRUE, 'idempotent_duplicate', TRUE,
          'awarded_wonder', v_existing_completion.awarded_xp,
          'awarded_petals', v_existing_completion.awarded_coins,
          'total_wonder', v_profile.xp, 'level', v_profile.level,
          'windfall_petals', v_profile.coins, 'lifetime_petals', v_profile.lifetime_coins,
          'ember_trail', v_profile.current_streak, 'attributes', v_profile.attributes,
          'jar_tokens', v_profile.jar_tokens
        );
    END IF;

    SELECT * INTO v_task FROM public.rpg_tasks
    WHERE id = p_task_id AND user_id = v_user_id AND active = TRUE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Task not found or inactive'; END IF;

    SELECT base_wonder INTO v_base_wonder FROM public.rpg_difficulty_config WHERE difficulty_key = v_task.difficulty;
    v_base_wonder := COALESCE(v_base_wonder, 10);
    SELECT multiplier INTO v_freq_mult FROM public.rpg_frequency_config WHERE frequency_key = v_task.recurrence_type;
    v_freq_mult := COALESCE(v_freq_mult, 1.0);

    v_profile := public.rpg_ensure_profile(v_user_id);
    IF v_profile.last_active_date = v_today THEN
      v_new_streak := GREATEST(v_profile.current_streak, 1);
    ELSIF v_profile.last_active_date = v_yesterday THEN
      v_new_streak := v_profile.current_streak + 1;
    ELSE
      v_new_streak := 1;
    END IF;
    v_longest_streak := GREATEST(v_new_streak, v_profile.longest_streak);

    SELECT bonus_multiplier INTO v_streak_mult FROM public.rpg_streak_config
    WHERE min_days <= v_new_streak ORDER BY min_days DESC LIMIT 1;
    v_streak_mult := COALESCE(v_streak_mult, 1.0);

    v_final_wonder := ROUND(v_base_wonder::NUMERIC * v_freq_mult * v_streak_mult);
    v_windfall_petals := ROUND(v_final_wonder::NUMERIC * 0.40);
    v_new_level := public.rpg_calculate_level(v_profile.xp + v_final_wonder);

    v_attribute := CASE lower(COALESCE(v_task.category,'general'))
      WHEN 'intellect' THEN 'Intellect'
      WHEN 'vitality' THEN 'Vitality'
      WHEN 'serenity' THEN 'Serenity'
      ELSE 'Craft'
    END;
    v_attributes := jsonb_set(
      COALESCE(v_profile.attributes, '{}'::jsonb),
      ARRAY[v_attribute],
      to_jsonb(COALESCE((v_profile.attributes->>v_attribute)::integer, 0) + v_final_wonder),
      TRUE
    );

    UPDATE public.rpg_profiles SET
      xp = xp + v_final_wonder,
      level = v_new_level,
      coins = coins + v_windfall_petals,
      lifetime_coins = lifetime_coins + v_windfall_petals,
      current_streak = v_new_streak,
      longest_streak = v_longest_streak,
      last_active_date = v_today,
      attributes = v_attributes,
      updated_at = TIMEZONE('utc', NOW())
    WHERE user_id = v_user_id
    RETURNING * INTO v_profile;

    INSERT INTO public.rpg_task_completions (
      task_id, user_id, awarded_xp, awarded_coins, streak_bonus, idempotency_key
    ) VALUES (v_task.id, v_user_id, v_final_wonder, v_windfall_petals, v_streak_mult, p_idempotency_key);

    INSERT INTO public.rpg_xp_transactions (user_id, amount, source_type, source_id, description)
    VALUES (v_user_id, v_final_wonder, 'task_completion', v_task.id, 'Wonder earned from: ' || v_task.title);
    INSERT INTO public.rpg_coin_transactions (user_id, amount, transaction_type, source_type, source_id, description)
    VALUES (v_user_id, v_windfall_petals, 'task_completion', 'task', v_task.id, 'Windfall Petals earned from: ' || v_task.title);

    RETURN jsonb_build_object(
      'success', TRUE, 'idempotent_duplicate', FALSE,
      'awarded_wonder', v_final_wonder, 'awarded_petals', v_windfall_petals,
      'multiplier_applied', v_streak_mult, 'total_wonder', v_profile.xp,
      'level', v_profile.level, 'windfall_petals', v_profile.coins,
      'lifetime_petals', v_profile.lifetime_coins, 'ember_trail', v_profile.current_streak,
      'longest_trail', v_profile.longest_streak, 'attributes', v_profile.attributes,
      'jar_tokens', v_profile.jar_tokens
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- One-time backfill for users who were already onboarded with Auth metadata.
UPDATE public.rpg_profiles p
SET
  username = COALESCE(NULLIF(p.username, ''), NULLIF(u.raw_user_meta_data->>'username', ''), p.username),
  avatar = COALESCE(NULLIF(u.raw_user_meta_data->>'avatar', ''), p.avatar),
  pet_type = COALESCE(NULLIF(u.raw_user_meta_data->>'pet_type', ''), p.pet_type),
  pet_name = COALESCE(NULLIF(u.raw_user_meta_data->>'pet_name', ''), p.pet_name),
  active_theme = COALESCE(NULLIF(u.raw_user_meta_data->>'active_theme', ''), p.active_theme),
  onboarding_completed = CASE
    WHEN u.raw_user_meta_data ? 'username' OR u.raw_user_meta_data ? 'pet_type' THEN TRUE
    ELSE p.onboarding_completed
  END,
  updated_at = TIMEZONE('utc', NOW())
FROM auth.users u
WHERE p.user_id = u.id;

-- Keep the existing reward equip flow, but normalize theme rewards to the UI's ThemeId values.
CREATE OR REPLACE FUNCTION public.rpg_equip_reward(p_reward_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_user_reward public.rpg_user_rewards;
    v_reward public.rpg_rewards;
    v_theme_id TEXT;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

    SELECT * INTO v_user_reward
    FROM public.rpg_user_rewards
    WHERE user_id = v_user_id AND reward_id = p_reward_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Reward not owned by user'; END IF;

    SELECT * INTO v_reward FROM public.rpg_rewards WHERE id = p_reward_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Reward not found'; END IF;

    UPDATE public.rpg_user_rewards ur
    SET equipped = FALSE
    FROM public.rpg_rewards r
    WHERE ur.reward_id = r.id AND ur.user_id = v_user_id AND r.reward_type = v_reward.reward_type;

    UPDATE public.rpg_user_rewards
    SET equipped = TRUE
    WHERE user_id = v_user_id AND reward_id = p_reward_id;

    IF v_reward.reward_type = 'title' THEN
      UPDATE public.rpg_profiles SET active_title = v_reward.name, updated_at = TIMEZONE('utc', NOW()) WHERE user_id = v_user_id;
    ELSIF v_reward.reward_type = 'badge' THEN
      UPDATE public.rpg_profiles SET active_badge = v_reward.name, updated_at = TIMEZONE('utc', NOW()) WHERE user_id = v_user_id;
    ELSIF v_reward.reward_type = 'frame' THEN
      UPDATE public.rpg_profiles SET active_frame = v_reward.name, updated_at = TIMEZONE('utc', NOW()) WHERE user_id = v_user_id;
    ELSIF v_reward.reward_type = 'theme' THEN
      v_theme_id := CASE v_reward.name
        WHEN 'Morning Dew Theme' THEN 'cottage_day'
        WHEN 'Hearthside Hearth Theme' THEN 'autumn_bookshop'
        ELSE NULL
      END;
      IF v_theme_id IS NOT NULL THEN
        UPDATE public.rpg_profiles
        SET active_theme = v_theme_id, updated_at = TIMEZONE('utc', NOW())
        WHERE user_id = v_user_id;
      END IF;
    END IF;

    RETURN jsonb_build_object('success', TRUE, 'equipped_reward', v_reward.name, 'slot', v_reward.reward_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
