-- ==============================================================================
-- DOWN MIGRATION: LIFE RPG BACKEND v2.1
-- Safely drops only the rpg_ prefixed objects created in 20260912_rpg_backend_v2_1.sql
-- ==============================================================================

-- Drop RPC functions
DROP FUNCTION IF EXISTS public.rpg_get_profile_summary();
DROP FUNCTION IF EXISTS public.rpg_get_shop_state();
DROP FUNCTION IF EXISTS public.rpg_equip_reward(UUID);
DROP FUNCTION IF EXISTS public.rpg_purchase_reward(UUID);
DROP FUNCTION IF EXISTS public.rpg_claim_yearly_bonus();
DROP FUNCTION IF EXISTS public.rpg_claim_monthly_bonus();
DROP FUNCTION IF EXISTS public.rpg_claim_weekly_bonus();
DROP FUNCTION IF EXISTS public.rpg_claim_daily_bonus();
DROP FUNCTION IF EXISTS public.rpg_complete_task(UUID, TEXT);
DROP FUNCTION IF EXISTS public.rpg_calculate_level(INTEGER);
DROP FUNCTION IF EXISTS public.rpg_ensure_profile(UUID);

-- Drop User Tables
DROP TABLE IF EXISTS public.rpg_xp_transactions CASCADE;
DROP TABLE IF EXISTS public.rpg_coin_transactions CASCADE;
DROP TABLE IF EXISTS public.rpg_user_achievements CASCADE;
DROP TABLE IF EXISTS public.rpg_user_rewards CASCADE;
DROP TABLE IF EXISTS public.rpg_task_completions CASCADE;
DROP TABLE IF EXISTS public.rpg_tasks CASCADE;
DROP TABLE IF EXISTS public.rpg_profiles CASCADE;

-- Drop Config Tables
DROP TABLE IF EXISTS public.rpg_achievements CASCADE;
DROP TABLE IF EXISTS public.rpg_rewards CASCADE;
DROP TABLE IF EXISTS public.rpg_reward_tiers CASCADE;
DROP TABLE IF EXISTS public.rpg_level_config CASCADE;
DROP TABLE IF EXISTS public.rpg_streak_config CASCADE;
DROP TABLE IF EXISTS public.rpg_frequency_config CASCADE;
DROP TABLE IF EXISTS public.rpg_difficulty_config CASCADE;
