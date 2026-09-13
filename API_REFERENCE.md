# Life RPG: "Keeper of Small Magics" — Backend API Reference (v2.1)

A complete, additive, server-enforced RPG progression, task completion, and reward tier backend for Supabase.

---

## 1. Naming & Display Layer

| DB Column | Display Name | Emoji | Description |
|---|---|---|---|
| `xp` | **Wonder** | ⭐ | Lifetime character experience; drives Character Level. Never decreases. |
| `coins` | **Windfall Petals** | 🌸 | Current spendable currency for the Reward Shop. Decreases on purchase. |
| `lifetime_coins` | **Lifetime Petals** | 🌿 | Total currency ever earned; drives Reward Tier unlocks. Never decreases. |
| `current_streak` | **Ember Trail** | 🔥 | Consecutive active days counter. Grants up to +50% Wonder bonus. |

---

## 2. Server-Side RPC Functions Reference

All functions are `SECURITY DEFINER` and enforce atomic transactions. They can be invoked directly from the Supabase JavaScript client:

```typescript
const { data, error } = await supabase.rpc('function_name', { ...params });
```

---

### `rpg_complete_task`
Completes a task, increments Ember Trail, computes Wonder & Windfall Petals server-side, updates levels, records audit transactions, and prevents duplicate submissions via idempotency.

* **Signature:** `rpg_complete_task(p_task_id: UUID, p_idempotency_key: TEXT)`
* **Inputs:**
  * `p_task_id` (UUID, required): The ID of the task from `rpg_tasks`.
  * `p_idempotency_key` (TEXT, required): Unique client-generated key (e.g. `task-{id}-{date}`) preventing accidental double-charging.
* **Server Logic:**
  1. Validates authenticated caller owns the task and task is active.
  2. Pulls `base_wonder` from `rpg_difficulty_config` (10, 20, 40, 75, 150).
  3. Pulls `frequency_multiplier` from `rpg_frequency_config` (1.0 to 2.5).
  4. Calculates consecutive day streak:
     - Today: retains streak.
     - Yesterday: `streak + 1`.
     - Prior: restarts at 1.
  5. Pulls highest applicable streak bonus multiplier from `rpg_streak_config` (up to 1.50 cap).
  6. Computes:
     * `final_wonder = ROUND(base_wonder * frequency_multiplier * streak_multiplier)`
     * `windfall_petals = ROUND(final_wonder * 0.40)`
  7. Updates `xp`, `level`, `coins`, and `lifetime_coins`.
  8. Inserts immutable rows into `rpg_task_completions`, `rpg_xp_transactions`, and `rpg_coin_transactions`.
* **Output Payload:**
  ```json
  {
    "success": true,
    "idempotent_duplicate": false,
    "awarded_wonder": 44,
    "awarded_petals": 18,
    "multiplier_applied": 1.10,
    "total_wonder": 250,
    "level": 3,
    "windfall_petals": 100,
    "lifetime_petals": 100,
    "ember_trail": 7,
    "longest_trail": 7
  }
  ```
* **Error Cases:**
  * `Authentication required`: Caller has no active Supabase session.
  * `Task not found or inactive`: Task does not belong to caller or was deleted.

---

### `rpg_get_shop_state`
Returns all 10 tiers of the "Keeper of Small Magics" catalog with server-computed lock states.

* **Signature:** `rpg_get_shop_state()`
* **Inputs:** None (uses `auth.uid()`).
* **Computed Lock States (`lock_state`):**
  * `"available"`: Tier is unlocked (`lifetime_coins >= unlock_threshold`) and user has enough current Windfall Petals (`coins >= price`).
  * `"insufficient_coins"`: Tier is unlocked, but current Windfall Petals are too low.
  * `"tier_locked"`: User's Lifetime Petals are below the tier unlock requirement.
* **Output Payload:**
  ```json
  {
    "current_petals": 150,
    "lifetime_petals": 620,
    "tiers": [
      {
        "tier_number": 1,
        "tier_name": "Little Acorn",
        "tier_icon": "🌱",
        "unlock_lifetime_coins": 0,
        "is_tier_unlocked": true,
        "items": [
          {
            "id": "uuid...",
            "name": "Acorn Scout Pin",
            "reward_type": "badge",
            "price": 25,
            "is_owned": true,
            "is_equipped": true,
            "lock_state": "available"
          }
        ]
      },
      {
        "tier_number": 4,
        "tier_name": "Kindled Wayfarer",
        "tier_icon": "🔥",
        "unlock_lifetime_coins": 1000,
        "is_tier_unlocked": false,
        "items": [
          {
            "id": "uuid...",
            "name": "Hearthside Hearth Theme",
            "price": 350,
            "lock_state": "tier_locked"
          }
        ]
      }
    ]
  }
  ```

---

### `rpg_purchase_reward`
Purchases an item from the reward shop. Validates tier threshold against Lifetime Petals, deducts current Windfall Petals, and prevents duplicate purchases of permanent cosmetics.

* **Signature:** `rpg_purchase_reward(p_reward_id: UUID)`
* **Inputs:** `p_reward_id` (UUID, required).
* **Guarantees:**
  * `lifetime_coins` is **never** decremented.
  * Permanent items cannot be purchased twice.
* **Output Payload:**
  ```json
  {
    "success": true,
    "reward_id": "uuid...",
    "reward_name": "Brass Lantern Frame",
    "remaining_petals": 30,
    "lifetime_petals": 620
  }
  ```
* **Error Cases:**
  * `Tier locked: requires X Lifetime Petals, you have Y`
  * `Insufficient Windfall Petals: requires X, you have Y`
  * `You already own this permanent reward`

---

### `rpg_equip_reward`
Equips a cosmetic item (badge, title, frame, or theme) and updates active profile slots.

* **Signature:** `rpg_equip_reward(p_reward_id: UUID)`
* **Inputs:** `p_reward_id` (UUID, required).
* **Enforcement:** Enforces one active cosmetic per slot (e.g. unequips previous badge when a new badge is equipped).
* **Output Payload:**
  ```json
  {
    "success": true,
    "equipped_reward": "Brass Lantern Frame",
    "slot": "frame"
  }
  ```

---

### `rpg_get_profile_summary`
Single fast read for any frontend or dashboard to display the player's complete state.

* **Signature:** `rpg_get_profile_summary()`
* **Output Payload:**
  ```json
  {
    "user_id": "uuid...",
    "wonder": 780,
    "level": 5,
    "next_level_wonder": 1000,
    "windfall_petals": 320,
    "lifetime_petals": 1200,
    "ember_trail": 14,
    "longest_ember_trail": 14,
    "current_tier": {
      "tier_number": 4,
      "name": "Kindled Wayfarer",
      "icon": "🔥"
    },
    "cosmetics": {
      "active_title": "The Patient",
      "active_badge": "Acorn Scout Pin",
      "active_frame": "Brass Lantern Frame",
      "active_theme": "Hearthside Hearth Theme"
    },
    "labels": {
      "xp_label": "Wonder",
      "coins_label": "Windfall Petals",
      "lifetime_coins_label": "Lifetime Petals",
      "streak_label": "Ember Trail"
    }
  }
  ```

---

### Cadence Bonuses
* `rpg_claim_daily_bonus()`: Awards +50 Wonder and +25 Windfall Petals once per day after completing all designated daily tasks.
* `rpg_claim_weekly_bonus()`: Awards +150 Wonder and +80 Windfall Petals (cooldown: 7 days).
* `rpg_claim_monthly_bonus()`: Awards +600 Wonder and +350 Windfall Petals (cooldown: 28 days).
* `rpg_claim_yearly_bonus()`: Awards +5,000 Wonder and +2,500 Windfall Petals (cooldown: 360 days).

---

## 3. Security & Anti-Abuse Verification

1. **Direct client writes blocked:** `rpg_profiles`, `rpg_coin_transactions`, `rpg_xp_transactions`, and `rpg_user_rewards` have **no direct `UPDATE` or `INSERT` policies** for standard authenticated users. All writes must go through the atomic RPC functions.
2. **Lifetime Petals never decrease:** The `rpg_purchase_reward` function only decrements `coins` and leaves `lifetime_coins` unchanged.
3. **Idempotency protection:** Calling `rpg_complete_task` with the same `idempotency_key` returns the existing result without double-awarding XP or Petals.
4. **Non-negative checks:** Database-level `CHECK (xp >= 0)`, `CHECK (coins >= 0)`, and `CHECK (lifetime_coins >= 0)` constraints prevent underflow.
