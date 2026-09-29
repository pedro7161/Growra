# Growra: game-layer redesign proposal (companion + map)

Status: proposal v3, 2026-09-29. **Phases 1 and 2 are implemented** on `feat/companions`:
- **Companions (phase 1):** gacha, pity, fusion and selling are gone; a starter is picked in the tutorial; the others join by usage style; Bond drives evolution (30 / 100); perks, mood on the dashboard, the daily coin cap (15).
- **Journey (phase 2):** day records, the road with tile features, camps with look-back cards, the 8 regions and seasons, decorations bought with coins, focus-buddy finds (every 3rd timer task). Expeditions, battles and gear are removed.
- **Saves migrate:** duplicates, pity, gear and consumables become coins, and the road is rebuilt from past completions.

Not built yet: phase 3 (Plan my day / Wrap up, so no bench on tiles) and the phase 4 art pass. Tiles, camps and decorations use emoji until the art exists.

Where the build differs from the tables below: Sprout, Ripple and Glint are the starters, and the two not picked join later (Sprout after 3 active days, Ripple on the first task moved later, Glint on the first timer task). Nova is "the long run" (joins after 30 active days, +10% streak bonus), since Plan my day doesn't exist yet. `src/utils/companions.ts` is the source of truth.

**Premise:** Growra is a **free-form task app**. Each person decides what it's for: daily habits, a day planner, chores, study sessions, a shopping list, or all of them together. That's why custom tasks exist. The game layer must therefore:

1. **Reward using the app, whatever the use.** It must never assume one workflow (not "log your fitness", not "plan every morning").
2. **Keep every tool optional.** Recurrence, due dates, timers, priorities, planning your day: people use what fits them. Whatever they use, there should be a companion and a map that respond to it.
3. **Stay trust-based without obsessing over lying.** Anyone can tick a task they didn't do. That isn't the point, so the design only adds a light cap so the game can't be farmed. It doesn't police honesty.
4. **Follow the spec's core rule:** progress comes from the user's own actions, never from waiting.

---

## 1. What's wrong with the current game layer

| Area | Today | Problem |
|---|---|---|
| **Link to the app** | Tasks → coins → gacha pets → timed expeditions and battles. | The game doesn't react to *how* someone uses Growra. A routine user, a planner and a list-maker all get the same slot machine. |
| **Map** | 8 zones on a pannable board; progress by 30–60 s expedition timers and zone battles. | Progress comes from waiting, not from using the app. It breaks the spec rule *"passive progression must never replace real-world action."* |
| **Pets** | Gacha (100 / 1,000 coins, 10+1, pity), duplicates, fusion, sell shop, gear, consumables, 4 stats + 2 power scores. | Six overlapping systems: a loot game bolted onto a task app. |
| **Pet art** | 12 lines, 1024 px PNGs, 59 MB. | 5 lines are placeholders: Tempo, Umbra and Zephie reuse Astra's base image for all 3 stages; Cindra copies Ember; Glint copies Pebble. Most have baked-in backgrounds. |

---

## 2. The idea: the game adapts to how you use Growra

Growra watches a few **usage signals** that exist for any kind of use:

| Signal | Comes from | Example users |
|---|---|---|
| **Getting things done** | completing any task | everyone |
| **Showing up** | a day with at least 1 completed task | everyone |
| **Routines** | completing recurring (daily/weekly) tasks | habit trackers |
| **Focus** | finishing task timers | students, deep work |
| **Looking ahead** | giving tasks future due dates, using the calendar | planners |
| **Priorities** | finishing High-priority tasks | busy to-do lists |
| **Own tasks** | creating and completing custom tasks | everyone with a unique use |
| **Keeping it tidy** | clearing overdue tasks (done, moved or deleted) | people who reschedule a lot |
| **Planning the day** *(optional tool, §3)* | using "Plan my day" / "Wrap up" | day planners |

Every signal gives the same small reward per action, and each one also feeds a **companion who loves that style** (§4) and a **mark on the map** (§5). Someone who only ever uses one-off custom tasks still gets a full, satisfying game. They just meet different companions and build a different-looking road than someone who lives in the timers.

---

## 3. Optional planning tools (for people who want them)

Growra today has due days, recurrence, priorities, colours, a month calendar and timers. For the people who use it as a planner, two **optional** tools are added. They're off the main path and never required:

- **Plan my day:** drag today's tasks into Morning / Afternoon / Evening (optionally an exact time). Tasks without a slot stay "Anytime", which is the default and perfectly fine.
- **Wrap up:** in the evening, a quick look at what's left today: **Done / Move to tomorrow / Pick a day / Delete**. It's a tidy-up tool, not a judgment; moving things is completely normal.

Using them gives the *Planning the day* and *Keeping it tidy* signals. Not using them costs nothing.

---

## 4. The companion (replaces gacha, fusion, gear and battles)

### 4.1 Getting companions: earned, never rolled
- **Onboarding:** pick a first companion from 3 (Sprout, Ripple, Glint). The tutorial is just *pick a buddy → add a task (predefined or your own) → complete it → your buddy reacts*. It doesn't teach a workflow, because there isn't one.
- **More companions join when you use the app in their style** (table below). They show up on their own: *"Tempo noticed you've been using timers — it wants to join you!"* No duplicates, no pity currency, no selling.

### 4.2 Each companion loves a style of use
All 12 existing concepts are reused. Every usage signal from §2 has at least one companion, so everyone finds theirs.

| Companion | Loves | Perk while active | Joins when… |
|---|---|---|---|
| **Sprout** | getting started | +2 coins on your first task each day | starter |
| **Ripple** | going with the flow | moving/rescheduling a task gives +1 Bond | starter |
| **Glint** | focus | finished timer tasks give +2 coins | starter |
| **Moss** | routines | recurring tasks give +2 coins | 10 recurring tasks completed |
| **Tempo** | timekeeping | +3 when a task is done on its due day | 5 timers finished |
| **Pebble** | showing up | every active day gives +1 extra Bond | 7 active days |
| **Astra** | looking ahead | tasks scheduled 3+ days ahead give +2 when done | first task due a week or more ahead |
| **Ember** | priorities | High-priority tasks give +3 | 10 High-priority tasks done |
| **Zephie** | making it your own | custom tasks give +2 | 5 custom tasks created |
| **Umbra** | tidying up | clearing an overdue task gives +2 | 5 overdue tasks cleared |
| **Nova** | planning the day | using Plan my day gives +5 | first time Plan my day is used |
| **Cindra** | big days | +10 on a day with 5+ tasks done | first 5-task day |

### 4.3 Bond, evolution and mood
- **Bond:** +1 per completed task while the companion is active (max 5 per day), plus +1 for each action matching its style. base → evo1 at Bond 30, evo1 → evo2 at Bond 100. Because Bond is mostly per active day, evolution tracks *how often you use Growra*, not how many tasks you can tick at once.
- **Mood** is derived from today, never stored and never harmful:
  - *Hi!* (nothing yet today)
  - *Happy* (something done)
  - *Glowing* (everything due today done, or 5+ tasks)
  - *Sleepy* (you've been away; it wakes up on your next action)
- **Focus buddy:** while a timer task runs, the companion "works with you" beside the timer. When the timer finishes, it sometimes brings a **find** (a decoration or cosmetic). This is the only "exploring", and it only happens while the user is actually doing something.

### 4.4 Companion card
Name, stage, Bond bar, the style it loves, perk, days together, cosmetics, and **"Take along"** (set active). ATK/DEF/SPD/LCK and the power scores are removed.

---

## 5. The map: a road made of your days (replaces expeditions and battles)

### 5.1 The idea
Every **active day** (at least one task completed) adds a **tile** to a road through the valley, and your companion walks it. The existing 8 zones are the **8 legs of the journey**: Sunlit Coast → Mossway Grove → Amber Dunes → Cloudbreak Ridge → Moonpool Marsh → Glasswind Expanse → Cinder Hollow → Skyheart Summit.

### 5.2 Each tile looks like how you used Growra that day
The road ends up as a picture of your own usage, different for every person:

| That day you… | The tile gets |
|---|---|
| completed anything | a lantern (every tile) |
| did a recurring task | flowers |
| finished a timer | a crystal (up to 3) |
| did a custom task | a painted stone (your own mark) |
| finished a High-priority task | a flag |
| scheduled something for later | a signpost |
| used Plan my day / Wrap up | a bench |
| had a big day (5+ tasks) | a small tree |

Tapping an old tile shows that day: what got done, and when.

### 5.3 Camps and regions
- **Every 7 active days → a camp** on the road with a campfire scene. It includes an optional **look-back card** with no judgment: *"This week: 23 done, busiest day Tuesday, your most repeated task: 'Drink water'."* It's useful for planners and fun for everyone else.
- **Every 4 camps (28 active days) → the next region**, with a new biome, lore, decorations and music. After Skyheart Summit it becomes *season 2*: the same valley in autumn, then winter.
- Pace is set by *active days*, not calendar days. Missing days never breaks the road; it waits, with your companion camped, until you come back.

### 5.4 Decorating
Each camp and region has spots for **decorations** bought with coins or found during focus sessions. This is the long-term coin sink, and it makes the valley personal.

---

## 6. Economy
- **Coins:** 10 per completed task (with the existing streak and companion multipliers), plus the small perk bonuses above.
- **Light anti-farming only:** task coins count for the first 15 completions per day. A single task can't pay out more than once per day. Nothing else polices honesty.
- **Streak** = consecutive **active days** (any completed task), with the spec's current decay rules.
- Coins buy **looks and comfort, never progress** (spec §5.5): decorations, companion cosmetics (the `activeImageVariantId` field already exists), road/tile themes.

Removed: summons (single and 10+1), pity currency and pity shop, sell shop, fusion, gear vault, battle consumables, zone battles, expedition timers.

---

## 7. Screens
Bottom navigation: **Home · Tasks · Journey · Companions** (Settings behind the gear icon).

- **Home:** the companion and its mood, today's tasks (grouped by slot *only if* the user plans in slots; otherwise a plain list), quick add, and entry points to the optional Plan my day / Wrap up.
- **Tasks:** as now (all tasks, filters, search, custom and predefined, month calendar).
- **Journey:** the road (§5): tiles, camps and look-back cards, regions, decorating.
- **Companions:** the collection (met ones in colour, others as silhouettes with a hint like *"Loves routines"*), companion cards, cosmetics.

---

## 8. Art direction (brief for Codex / ComfyUI)

Keep Growra's cute high-detail pixel style with soft glow, but make it consistent and light:
- **Companions:** transparent background, no baked-in scenery; same framing (feet on a baseline at 88% of the height, body filling about 75%); light from the top-left. Master at 1024 px, shipped as 512 px WebP. Each: 3 stages × 3 moods (happy, glowing is an in-app effect, sleepy).
- **Replace the placeholders first:** Tempo, Umbra, Zephie (Astra copies), Cindra (Ember copy), Glint (Pebble copy). Their written concepts in `petConcepts.ts` still apply.
- **Road:** one square tile base per region (8), plus small overlay sprites (lantern, flowers, crystal, painted stone, flag, signpost, bench, tree) that work on every region's tile.
- **Camps:** one campfire scene per region. **Region gates:** one banner illustration each.
- Budget: all game art under 10 MB (it's 59 MB today).

---

## 9. Data model changes (sketch)

```ts
type DaySlot = "morning" | "afternoon" | "evening" | "anytime";

interface Task {
  /* ...existing fields stay... */
  slot?: DaySlot;          // optional; only planners set it
  plannedTime?: number;    // optional minutes after midnight
  moveCount?: number;      // for the look-back card
}

interface DayRecord {       // one per active day; the road is derived from these
  date: number;
  done: number; recurringDone: number; customDone: number; highPriorityDone: number;
  timersFinished: number; scheduledAhead: number; overdueCleared: number;
  usedPlanning: boolean;
}

interface Companion { templateId: string; bond: number; stage: 0 | 1 | 2; joinedAt: number; cosmeticId: string }

interface GameState {
  /* keep: coins, level, totalExperience, streak, tasks, customTaskTemplates, settings, tutorial flags */
  days: DayRecord[];
  companions: Companion[]; activeCompanionId: string;
  styleProgress: Record<string, number>;   // counters for "joins when…"
  decorations: { id: string; spotId: string }[];
  ownedCosmetics: string[];
  // removed: pets, gearItems, battleConsumables, pityCurrency, expeditionProgress
}
```

The road (tiles, camps, region) is **derived** from `days`, so there's no separate map progress to go out of sync.

### Migrating existing saves (no one loses anything)
- Each distinct pet the player owns → that companion joins, keeping its highest evolution stage. The equipped pet becomes the active companion.
- Duplicates, gear, consumables and pity currency → converted to coins at their current sell values, with a one-time note.
- Past completion history → `DayRecord`s, so the road starts with tiles already there.

---

## 10. Build order

| Phase | What | Why first |
|---|---|---|
| **1. Companion on Home** | Usage signals + `DayRecord`, companion with moods, Bond and evolution, style perks, milestone joins, focus buddy. Remove gacha, fusion, sell and gear. Save migration. | The most visible change, mostly reusing existing art. It works for every kind of user. |
| **2. Journey road** | Tiles from active days, tile features, camps plus look-back cards, the 8 regions, decorating. Remove expeditions and battles. | The big visual payoff. Needs tile and camp art. |
| **3. Optional planning tools** | Slots, Plan my day, Wrap up. | Useful for planners, but optional, so it comes after the game layer. |
| **4. Art pass + store** | Placeholder pets redone, 512 px WebP, moods, tiles and camps. Then the Play listing (screenshots: Home with companion, Journey road, Companions). | Needed before any public track. |

---

## 11. Decisions for you
1. **Remove the coin gacha completely?** (Recommended; companions join by usage style instead.)
2. **The optional planning tools** (§3): build them, or leave planning to the existing due dates and calendar?
3. **Journey pace:** a camp every 7 active days and a new region every 28, or faster (every 5 / 20) so new users see more change early?
4. **Daily coin cap:** 15 completions a day, or none at all?

---

## 12. Making some money (without breaking the design)

Rule: **money buys looks, comfort and convenience, never progress.** Companions, Bond, road tiles and the usage signals stay free and earned (spec §5.5: "no systems that bypass effort"). The core app (unlimited tasks, custom tasks, companions, the road) stays free.

Ranked by fit and effort:

| # | Option | What | Price (starting point) | Why |
|---|---|---|---|---|
| 1 | **Growra Plus**, a one-time unlock | Convenience for regular users: **cloud backup/restore** (Google Drive app-data folder, no server needed), extra app themes and alternate app icons, full history on the Journey (free: last 4 weeks of look-back cards), **CSV export**, custom reminder/timer sounds, and later a home-screen widget. | €3.99 lifetime (€1.99 at launch) | Task-app users dislike subscriptions for simple tools; a one-time unlock converts better at this size, and it keeps working offline. |
| 2 | **Cosmetic packs** | Companion outfits, road themes (e.g. "cherry blossom road"), camp decoration sets. Some are coin-buyable, some are packs only. | €0.99–1.99 each | Fits §6 directly; people who love their companion will pay for looks. |
| 3 | **Tip jar** | "Support Growra" at €0.99 / €2.99 / €4.99, each giving a small thank-you cosmetic (e.g. a supporter scarf). | as listed | No design cost; indie users tip more than expected when asked kindly. |
| 4 | **Optional rewarded ads** *(later, maybe)* | "Watch an ad → your companion brings back a find." Max 2 a day, never forced, no banners. | ad revenue | Lowest fit for a calm productivity app. AdMob also needs a public Play listing first (same blocker as SHARDMARCH). |

**Avoid:** subscriptions, selling companions/Bond/progress, forced or banner ads, and real-money random boxes (EU loot-box scrutiny).

**Realistic expectation:** a one-time unlock converts roughly 1–3% of active users. At 1,000 monthly actives that's about 10–30 purchases a month, so tens of euros, not a salary. Downloads come first: listing, screenshots, and getting past closed testing.

### Steps to actually get paid
1. Make it presentable: redesign phases 1–2 plus the art pass (§10), then a full Play listing and a privacy policy page (required once billing or ads are added; it can live on the existing GitHub Pages setup, like the other apps).
2. Get to production: new personal accounts need 12 closed testers for 14 days (the same requirement as Portal Siege).
3. Play Console: set up a **payments profile / merchant account**, then create the in-app products.
4. Code: **RevenueCat** (`react-native-purchases`, free up to $2.5k/month revenue) or `react-native-iap` on Google Play Billing. Needs an **EAS development build** (not Expo Go). Test with license testers on the closed track.
5. Data safety: declare purchase history (and advertising ID, if ads are ever added).
6. Money side: Google takes **15%** (small-developer rate) and handles EU VAT for app sales. The income is self-employment income in Portugal (open activity / *recibos verdes* around the first real payout, as noted in the ai-books research).
