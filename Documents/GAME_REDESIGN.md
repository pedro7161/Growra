# Growra: game-layer redesign proposal (companion + map)

Status: proposal v2, 2026-09-29. Nothing here is implemented yet.

**Premise:** Growra helps people **plan their day and follow the plan**. The game should reward *good planning habits*: deciding the day in advance, spreading the load, doing things around when you planned them, and closing the day honestly, including moving what didn't happen. It should not reward *what* the tasks are, or raw volume.

Completion is trust-based (spec §5.1), so people can lie. That's fine. The design makes lying pointless rather than trying to detect it: the biggest rewards come from **planning and closing the day**, which you can't really fake, not from ticking boxes.

---

## 1. What's wrong with the current game layer

| Area | Today | Problem for a day planner |
|---|---|---|
| **Link to the app's purpose** | Tasks → coins → gacha pets → timed expeditions and battles. | None of it touches *planning*. You could get the same rewards by adding and ticking random tasks all day. |
| **Map** | 8 zones on a pannable board; progress by 30–60 s expedition timers and zone battles. | Progress comes from waiting, not from how you run your day. It also breaks the spec rule *"passive progression must never replace real-world action."* |
| **Pets** | Gacha (100 / 1,000 coins, 10+1, pity), duplicates, fusion, sell shop, gear, consumables, 4 stats + 2 power scores. | Six overlapping systems: a loot game bolted onto a planner. |
| **Pet art** | 12 lines, 1024 px PNGs, 59 MB. | 5 lines are placeholders: Tempo, Umbra and Zephie reuse Astra's base image for all 3 stages; Cindra copies Ember; Glint copies Pebble. Most have baked-in backgrounds. |
| **Planning features** | Due *day*, frequency, priority, colour, calendar month view, task timers. | No time of day, no "plan the day" moment, no end-of-day step. Unfinished tasks simply stay overdue. |

---

## 2. The day loop: Plan → Do → Wrap up

This is the backbone. The game hangs off these three moments.

### 2.1 Plan (the morning, or the evening before)
A **Plan my day** screen (and "Plan tomorrow" after 18:00):
- Every task due that day, plus anything carried over from yesterday, starts in **Unplanned**.
- The user drops tasks into **Morning / Afternoon / Evening** (optionally an exact time), or moves them to another day.
- The companion gives light guidance, never blocking:
  - *"That's 9 tasks in the afternoon — want to move some to the evening?"* (overload warning: more than X tasks, or more timer minutes than the slot has)
  - *"3 things carried over from yesterday."*
  - Recurring tasks go to their usual slot automatically.
- Tapping **"Start the day"** locks in the plan (it can still be edited). That's the **Plan reward**.

### 2.2 Do (during the day)
- **Today** shows the day as a short **path of stops**, with the planned tasks grouped by slot and the companion standing on the current slot.
- Completing a task lights up its stop. Completing it **in its planned slot** counts as *on time* (small bonus); later still counts, just without the bonus.
- A **timer task** is a *focus session*: the companion sits beside you on the path until the timer ends (see §4.3).

### 2.3 Wrap up (the evening)
A short **Close the day** review (a nudge in the evening; it can also be done the next morning):
- For each unfinished planned task: **Done** / **Move to tomorrow** / **Pick a day** / **Drop**.
- The day is *closed* once every planned task has a decision. That gives the **Close reward**, which is **the same whether things were done or moved.** Being honest costs nothing.
- A one-line summary follows: planned 6, done 4, moved 2, and a mood for the day.

### 2.4 Why lying isn't worth it
- The Plan and Close rewards are the largest ones, and they depend on *deciding*, not on ticking.
- Tasks count fully only if they were **planned before they were done**, meaning placed in a slot earlier than completion (or created at least 10 minutes before). Logging something you already did still goes on the day, but gives a small reward. That supports using Growra as a planner, and makes "add + tick" farming pointless.
- A daily cap: only the first 12 planned tasks per day give task coins.
- The streak (spec §5.2) counts **closed days**, not "days with any completion". A day where you planned, did half, and honestly moved the rest keeps your streak.

---

## 3. Rewards per day (starting numbers)

| Action | Coins | Companion |
|---|---|---|
| Plan the day before the first slot starts | 15 | +1 Bond |
| Plan tomorrow the evening before | +5 | |
| Planned task done | 10 (× streak/pet multipliers, as now) | |
| …done in its planned slot | +2 | |
| Unplanned task done (logged) | 3 | |
| Close the day | 15 | +1 Bond, and the day becomes a tile on the map (§5) |
| Balanced day (tasks in 2+ slots, no overloaded slot) | +5 | |

A typical honest day (plan, 4 of 6 done, close) earns about 80 coins. A "tick 30 fake tasks" day earns less than a real one.

---

## 4. The companion: a planning buddy (replaces gacha, fusion, gear and battles)

### 4.1 One active companion, more joining over time
- **Onboarding:** pick a first companion from 3 (Sprout, Ripple, Glint). The tutorial becomes: *pick a buddy → add 2 tasks → plan them into slots → start the day → finish one → close the day*. It teaches the loop, not the shop.
- **More companions join through planning milestones**, never by rolling. No duplicates, no pity currency, no selling.

### 4.2 Each companion has a planning style (its perk)
This makes the choice of active companion meaningful, and reuses all 12 existing concepts:

| Companion | Style | Perk while active | Joins when… |
|---|---|---|---|
| **Sprout** | Early bird | +5 coins if the day is planned before 10:00 | starter |
| **Ripple** | Go with the flow | moving a task in Wrap up gives +1 Bond | starter |
| **Glint** | Focus | timer tasks give +2 coins | starter |
| **Umbra** | Night owl | planning tomorrow gives +5 more | first time you plan tomorrow the evening before |
| **Tempo** | Timekeeper | the on-time bonus doubles | 20 tasks done in their planned slot |
| **Pebble** | Steady | closed days give +1 extra Bond | 7 closed days |
| **Zephie** | Light load | +5 on balanced days | 5 balanced days |
| **Astra** | Long view | tasks planned 3+ days ahead give +2 when done | first task scheduled a week ahead in the calendar |
| **Moss** | Routines | recurring tasks give +2 | 3 recurring tasks created |
| **Ember** | Big first | +3 when a High-priority task is the first done | 10 High-priority tasks done |
| **Nova** | Reviewer | the weekly review doubles its reward | first weekly review (§5.3) |
| **Cindra** | Sprint | 3+ focus timers in one day give +10 | 3 timers finished in one day |

### 4.3 Bond, evolution and mood
- **Bond** grows from planning and closing days while the companion is active (see the table in §3). base → evo1 at Bond 20 (about 2–3 weeks of normal use), evo1 → evo2 at Bond 60.
- **Mood** is derived from *today's plan*, never stored and never harmful:
  - *"Let's plan!"* (no plan yet)
  - *On our way* (planned, in progress)
  - *Cozy* (day closed; lantern lit)
  - *Sleepy* (yesterday wasn't closed; it wakes up on the next action)
- **Focus sessions:** while a timer task runs, the companion "works with you" (a small animation beside the timer). When the timer finishes, it sometimes brings back a **find** (a decoration or cosmetic). Cancelling means no find. This is the only "exploring", and it only happens while the user is actually focusing.

### 4.4 Companion card
Name, stage, Bond bar, perk, days together, cosmetics, and **"Plan with me"** (set active). ATK/DEF/SPD/LCK and the power scores are removed.

---

## 5. The map: your days become a journey (replaces expeditions and battles)

### 5.1 The idea
The map is a **road through the valley made of your closed days**. Each day you close adds one **tile** to the road, and the companion walks it. The existing 8 zones become the **8 legs of the journey** that the road passes through: Sunlit Coast → Mossway Grove → Amber Dunes → Cloudbreak Ridge → Moonpool Marsh → Glasswind Expanse → Cinder Hollow → Skyheart Summit.

### 5.2 Tiles show what kind of day it was
A day's tile gets features from that day, so scrolling back shows how your planning has been going:

| That day you… | The tile shows |
|---|---|
| closed the day | a lit lantern (every tile has one) |
| planned it in advance | a signpost |
| had a balanced day | flowers |
| finished 1+ focus timers | a crystal per timer (max 3) |
| did all planned tasks | a small tree |
| moved tasks honestly | stepping stones (never shown as failure) |

Tapping an old tile shows that day's summary (planned / done / moved).

### 5.3 Legs, camps and the weekly review
- **Every 7 closed days = a camp** on the road, with a campfire scene where the companion sits. Reaching a camp prompts a **Weekly review**: last week's tiles, which slots overflowed, and which tasks keep getting moved (*"'Do laundry' was moved 4 times — plan it on the weekend?"*). Doing the review gives Nova's join milestone and a camp decoration.
- **Every 4 camps (28 closed days) = next leg of the journey.** The road enters a new region with a new biome, lore, decorations and music. After Skyheart Summit it becomes *season 2*: the same valley in another season (autumn, winter), with new tile art.
- Pace is set by *closed days*, not calendar days. Missing days never breaks or removes the road; it just waits there, with the companion camped, until you come back.

### 5.4 Decorating
Each camp and region has a few spots where the user places **decorations** bought with coins or found on focus sessions. This is the long-term coin sink, and it makes the road personal.

---

## 6. Economy
Coins come from §3. They buy **looks and comfort, never progress** (spec §5.5):
- decorations for camps and the road
- companion cosmetics (the `activeImageVariantId` field already exists)
- tile themes, e.g. a "cherry blossom road" skin

Removed: summons (single and 10+1), pity currency and pity shop, sell shop, fusion, gear vault, battle consumables, zone battles, expedition timers.

---

## 7. Screens
Bottom navigation: **Today · Plan · Journey · Companions** (Settings behind the gear icon).

- **Today:** the companion and its mood, the day's path of stops grouped by slot, the current slot highlighted, and a **Close the day** button in the evening.
- **Plan:** today or tomorrow in slots (drag and drop), the unplanned tray, carry-overs, overload hints, and a link to the existing month **Calendar** (for scheduling further ahead). The current Tasks list moves in here as an "All tasks" tab.
- **Journey:** the road map (§5): tiles, camps, regions, the weekly review, decorating.
- **Companions:** the collection (met ones in colour, others as silhouettes with their "joins when…" hint), companion cards, cosmetics.

---

## 8. Art direction (brief for Codex / ComfyUI)

Keep Growra's cute high-detail pixel style with soft glow, but make it consistent and light:
- **Companions:** transparent background, no baked-in scenery; same framing (feet on a baseline at 88% of the height, body filling about 75%); light from the top-left. Master at 1024 px, shipped as 512 px WebP. Each: 3 stages × 4 moods (planning, on our way, cozy, sleepy).
- **Replace the placeholders first:** Tempo, Umbra, Zephie (Astra copies), Cindra (Ember copy) and Glint (Pebble copy). Their written concepts in `petConcepts.ts` still apply.
- **Road tiles:** one square tile base per region (8), plus small overlay sprites for lantern, signpost, flowers, crystal, tree and stepping stones. The same overlays work on every region's tile.
- **Camps:** one campfire scene per region. **Region gates:** one banner illustration each.
- Budget: all game art under 10 MB (it's 59 MB today).

---

## 9. Data model changes (sketch)

```ts
type DaySlot = "morning" | "afternoon" | "evening" | "anytime";

interface Task {
  /* ...existing: dueDate stays the planned day... */
  slot: DaySlot;              // where it sits in the day
  plannedTime?: number;       // optional minutes after midnight
  plannedAt?: number;         // when it was put into a slot (for "planned before done")
  moveCount: number;          // times moved in Wrap up (feeds the weekly review)
}

interface DayRecord {
  date: number;               // start of day
  plannedAt?: number;         // "Start the day" pressed
  closedAt?: number;          // Wrap up finished
  planned: number; done: number; onTime: number; moved: number; dropped: number;
  focusSessions: number; balanced: boolean;
}

interface Companion { templateId: string; bond: number; stage: 0 | 1 | 2; joinedAt: number; cosmeticId: string }

interface GameState {
  /* keep: coins, level, totalExperience, streak (now counts closed days), tasks, settings, tutorial flags */
  days: DayRecord[];          // the journey is derived from closed days
  companions: Companion[]; activeCompanionId: string;
  decorations: { id: string; spotId: string }[];
  ownedCosmetics: string[];
  // removed: pets, gearItems, battleConsumables, pityCurrency, expeditionProgress
}
```

The journey (tiles, camps, current region) is **derived** from `days`, so there's no separate map progress to go out of sync.

### Migrating existing saves (no one loses anything)
- Each distinct pet the player owns → that companion joins, keeping its highest evolution stage. The equipped pet becomes the active companion.
- Duplicates, gear, consumables and pity currency → converted to coins at their current sell values, with a one-time note.
- Existing tasks get `slot: "anytime"` and `moveCount: 0`.
- Past completion history → pre-closed `DayRecord`s, so the road starts with a few tiles already there.

---

## 10. Build order

| Phase | What | Why first |
|---|---|---|
| **1. The day loop** | Slots on tasks, Plan screen (today/tomorrow), Close the day, DayRecord, the new reward table, streak = closed days. | It's the app's actual purpose, and useful even with zero game art. |
| **2. Companion** | Active companion on Today with moods, Bond and evolution from planning and closing, perks, focus-session finds, milestone joins. Remove gacha, fusion, sell and gear. Save migration. | Makes the loop feel alive. Mostly reuses existing art. |
| **3. Journey map** | Road of tiles, tile features, camps plus the weekly review, legs through the 8 regions, decorating. Remove expeditions and battles. | The big visual payoff. Needs tile and camp art. |
| **4. Art pass + store** | Placeholder pets redone, 512 px WebP, moods, tiles and camps. Then the Play listing (screenshots: Plan screen, Today path, Journey road). | Needed before any public track. |

---

## 11. Decisions for you
1. **Slots:** Morning / Afternoon / Evening plus optional exact times (recommended), or exact times only?
2. **Planned-before-done rule:** reduced reward for unplanned tasks, as proposed, or no difference?
3. **Remove the coin gacha completely?** (Recommended; companions join through planning milestones instead.)
4. **Journey pace:** a camp every 7 closed days and a new region every 28, or faster (every 5 / 20) so new players see more change early?
