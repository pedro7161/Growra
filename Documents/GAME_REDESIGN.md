# Growra: game-layer redesign proposal (pets + map)

Status: proposal, 2026-09-29. Nothing here is implemented yet.
Scope: the game side of the app (companion pets, the world map, and the economy that connects them to tasks). The task system itself stays as it is.

---

## 1. Why change it

What's in the app today (checked in the build, the code and Play Console):

| Area | Today | Problem |
|---|---|---|
| **Link to habits** | Tasks only produce coins, XP and pet XP. Which *kind* of task you do doesn't matter to the game. | The game could sit on top of any to-do app. Nothing in the world reflects *your* life. |
| **Map** | 8 zones on a pannable board. Progress comes from expeditions on 30–60 s timers, plus zone battles. | Progress comes from waiting and spamming timers, not from real tasks. That breaks the spec's key rule: *"passive progression must never replace real-world action."* |
| **Pets** | Gacha (100 / 1,000 coins, 10+1, pity currency), duplicates, fusion, sell shop, gear vault, battle consumables, ATK/DEF/SPD/LCK, combat power, exploration power. | Six overlapping systems and a stat sheet. Pets read as loot, not companions. The coin gacha feels like a slot machine inside a self-care app. |
| **Pet art** | 12 pet lines, 1024 px PNGs, 59 MB total. | 5 lines are placeholders: Tempo, Umbra and Zephie reuse Astra's base image for all 3 stages; Cindra is a copy of Ember; Glint (meant to be crystal) is a copy of Pebble (rock). Most images have baked-in backgrounds with different framings. |
| **Play** | Internal testing only (versionCode 3, "Tuturial + Pets overhaul"); the listing has a title and nothing else. | The game layer is the store pitch, so it needs to be clear and look finished before the listing is written. |

**The redesign in one line:** *Your habits grow a world.* Each life area is a region of the valley. Each region has a companion who lives there. Real tasks in that area restore the region and evolve its companion. Nothing progresses unless you do something real.

---

## 2. Core loop

```
Do a real task (e.g. "Drink water", Health)
   → coins + XP (as now)
   → Growth for the Health region (Sunlit Coast)
   → Bond for its companion (Ripple)
   → your active companion reacts on the Today screen
Region growth passes a threshold → a landmark is restored on the map (visible change)
Companion bond passes a threshold → it evolves (base → evo1 → evo2)
Coins → decorations and cosmetics (never progress)
```

Three things now carry meaning:
1. **Category = place.** Every task belongs to one of 8 life areas, and each area is a region.
2. **Companions mirror you.** Your fitness companion evolves because you exercised, not because you fused duplicates.
3. **The map is a progress picture of your life.** The whole valley shows at a glance which areas you've been looking after.

---

## 3. Life areas → regions → companions

The 8 task categories already in `predefinedTasks.ts` map one-to-one onto the 8 existing zones, and every existing pet concept fits one of them. Existing names and art are reused wherever possible.

| Life area (task category) | Region (existing zone) | Home companion(s) | Why it fits |
|---|---|---|---|
| **Health** (water, sleep, meds) | Sunlit Coast | **Ripple** (water) | water, calm shore |
| **Fitness** (walk, gym, mobility) | Cinder Hollow | **Ember** (fire), **Cindra** (lava) | heat, energy |
| **Focus** (deep work, inbox) | Glasswind Expanse | **Glint** (crystal) | clarity, sharp light |
| **Study** (read, study) | Skyheart Summit | **Astra** (cosmic) | stars, knowledge |
| **Home** (tidy, laundry) | Mossway Grove | **Sprout**, **Moss**, **Pebble** (forest/earth) | cosy grove village |
| **Finance** (budget, savings) | Amber Dunes | **Nova** (solar) | gold, caravans, trade |
| **Mindset** (journal, weekly review) | Moonpool Marsh | **Umbra** (shadow/moon) | reflection, quiet water |
| **Social** (family, friends) | Cloudbreak Ridge | **Zephie** (wind), **Tempo** (storm) | connection, weather that travels |

Custom tasks must pick a life area when created. A small chip row with the 8 area icons replaces the free-text "custom" category, and old custom tasks get a one-time "which area is this?" prompt.

---

## 4. Companions (replaces gacha, fusion, gear and battles)

### 4.1 Getting companions: earned, never rolled
- **Start:** during onboarding the player picks a first companion from three starters (Sprout / Ripple / Ember), which also sets their first region. The tutorial becomes: *pick companion → add a task in its area → complete it → watch the region wake up.*
- **More companions join the first time you restore a region's second landmark.** The companion walks out of the region and says hi. That's 12 companions across 8 regions, with some regions offering a second companion at landmark 4.
- **No duplicates, no pity currency, no summon costs, no selling.** Every companion is unique and permanent.

### 4.2 Growing a companion: Bond
- **Bond** grows from tasks done in the companion's home area (full value), plus a small share from any other task while it's your **active** companion (25%). This makes it worth rotating your active companion toward areas you're neglecting.
- **Evolution:** base → evo1 at Bond 30 (about 2–3 weeks of one daily habit), evo1 → evo2 at Bond 120. These are milestones for real consistency, not grinding.
- Streak bonus and priority keep affecting coins and XP as today. Bond is deliberately flat per task, so evolution tracks *how often* you show up rather than *how hard* you pushed on one day.

### 4.3 Mood: gentle, never punishing
The active companion shows how *today* is going, computed from today's tasks. It's never stored as damage:

| Today | Mood | Look |
|---|---|---|
| Nothing done yet | *Waiting* | idle, looking at you |
| Some done | *Happy* | bouncing |
| All of today done | *Glowing* | sparkle, and the region lights up at dusk |
| Missed yesterday | *Sleepy* (never sad, never sick) | yawning, and recovers with the first task today |

No death, no guilt text. Returning after a break should feel welcoming. The spec's streak-loss rules still apply to the coin/XP bonus, but the companion itself is never harmed.

### 4.4 What the stat sheet becomes
ATK/DEF/SPD/LCK, combat power and exploration power are removed from the UI. A companion card shows: name, stage, Bond bar to the next stage, home region, days together, and one **perk** (see §6).

---

## 5. The valley map (replaces expeditions and zone battles)

### 5.1 What it looks like
One illustrated valley. Mobile-first, it scrolls vertically, with the 8 regions stacked like a hand-drawn board-game map (a single portrait canvas, no free panning). Each region is a small island vignette with its companion(s) visible when present.

Regions start **misty and faded**. Tapping a misty region shows: *"Sunlit Coast is asleep. Add a Health task to wake it."* Tapping the button opens Add Task with the Health area preselected.

### 5.2 Restoring a region
Each region has **5 landmarks**, each unlocked by the number of tasks completed in that area:

| Landmark | Tasks in area | Example: Sunlit Coast (Health) |
|---|---|---|
| 1 | 3 | Mist lifts, the beach appears |
| 2 | 10 | Lighthouse relit → **Ripple joins** (if not your starter) |
| 3 | 25 | Tide pools with little creatures |
| 4 | 50 | Pier and boats |
| 5 | 100 | Coral garden and festival lanterns (region "in bloom") |

Each landmark visibly changes the region art, and a short lore card pops up. It also unlocks a decoration for that region. These are lifetime counts, so a weekly habit still completes a region over a year, and a daily one in about three months.

### 5.3 Journeys: the only "exploring", and only during real focus
Task timers already exist. When you **start a timer task**, your active companion sets off on a journey in that task's region, shown as a tiny walking icon on the map. When the timer **finishes** (the task becomes ready), it comes back with a **find**: a decoration piece, a cosmetic, or a lore page. Cancelling or resetting the timer calls it back with nothing. Progress happens only while you're doing something real.

### 5.4 Today on the map
- Time of day follows the real clock (morning / day / dusk / night tint).
- When everything due today is done, the valley gets a *golden hour* glow that evening.
- A small **"This week"** ribbon shows which regions grew in the last 7 days. The "Weekly Review" task links straight to it.

---

## 6. Economy (coins without a casino)

Coins stay the reward for tasks (base 10, same streak/pet multipliers). They buy **looks and comfort, never progress** (spec §5.5: "no systems that bypass effort"):

- **Decorations:** placeables for each region's camp (benches, lanterns, flower beds; 50–400 coins). Unlocked by landmarks, bought with coins.
- **Cosmetics:** hats, scarves and colour variants per companion. The `activeImageVariantId` field already exists for this.
- **Perks** (one per companion, fixed, never bought), e.g. Ripple: "+5 coins on Health tasks", Glint: "focus timers also give +1 Bond to Focus". Small bonuses that make the choice of active companion matter.

Removed: single and 10+1 summons, pity currency and pity shop, sell shop, fusion, gear vault, battle consumables, zone battles, expedition timers.

---

## 7. Screens

Bottom navigation becomes **Today · Tasks · Valley · Companions** (Settings stays behind the gear icon).

- **Today:** the active companion large at the top with its mood and a speech line ("Two more to go — we're almost glowing!"). Below it, today's list as now, where each task shows its area icon. Completing a task plays a small growth burst that flies toward the area icon.
- **Tasks:** as now, plus the area chip on create/edit (required).
- **Valley:** the map (§5). Tapping a region shows its landmarks, its companions, its decorations shop and the tasks linked to it.
- **Companions:** a collection grid (joined in colour, not-yet-met as silhouettes with a hint like "Restore Amber Dunes' 2nd landmark"). Tapping one opens its card: Bond, stage, perk, cosmetics, "Walk with me" (set active).

---

## 8. Art direction (brief for Codex / ComfyUI)

Keep the current style (high-detail cute pixel art, soft glow), but make it **consistent and light**:

- **Companions:** transparent background, **no scenery baked in**; same framing (feet on a baseline at 88% of the height, body filling about 75%); light from the top-left. Master at 1024 px, shipped as **512 px WebP** (≈40 KB each instead of ≈1.5 MB). Target: under 10 MB for all game art, down from 59 MB.
- **Per companion:** 3 stages × 3 moods (idle, happy, sleepy) = 9 images; the "glowing" mood is an in-app effect, not new art.
- **Replace the placeholders first:** Tempo, Umbra and Zephie (all currently Astra copies), Cindra (Ember copy) and Glint (Pebble copy). Their written concepts in `petConcepts.ts` are good; the art was never generated.
- **Regions:** one portrait island vignette per region, drawn as **6 states** (misty + landmarks 1–5), or a base plus 5 overlay layers. Same palette family as the companions, with each region's colour matching its companion's element.
- Decorations and cosmetics: small transparent sprites on the same baseline rules.

---

## 9. Data model changes (sketch)

```ts
type LifeArea = "health" | "fitness" | "focus" | "study" | "home" | "finance" | "mindset" | "social";

interface Task { /* ...existing... */ area: LifeArea }              // replaces free-form category

interface Companion {
  templateId: string; homeArea: LifeArea; joinedAt: number;
  bond: number; stage: 0 | 1 | 2; cosmeticId: string;
}

interface RegionState { area: LifeArea; tasksCompleted: number; decorations: string[] }

interface Journey { taskId: string; area: LifeArea; companionId: string; startedAt: number }

interface GameState {
  /* keep: coins, level, totalExperience, streak, tasks, settings, tutorial flags */
  companions: Companion[]; activeCompanionId: string;
  regions: Record<LifeArea, RegionState>;
  activeJourney: Journey | null;
  ownedCosmetics: string[];
  // removed: pets, gearItems, battleConsumables, pityCurrency, expeditionProgress
}
```

Mood is **derived** from today's tasks and never stored, so it can't go stale or "die".

### Migrating existing saves (no one loses anything)
- Every distinct pet template the player owns → that companion joins, keeping its **highest** evolution stage (Bond set to that stage's threshold).
- Equipped pet → active companion.
- Duplicates, gear, consumables and pity currency → converted to coins at their current sell values, with a one-time "thank you" note.
- Completed tasks with a known category → counted into their region, so an existing player opens a partly restored valley on day one.
- Tasks in the old "custom" category → a one-time prompt asks which area they belong to.

---

## 10. Build order

| Phase | What | Why first |
|---|---|---|
| **1. Areas + Today companion** | `area` on tasks (with a picker), regions counted, companion with mood on Today, Bond + evolution from home-area tasks. | Proves the core idea (my habits change my companion) with little new art. |
| **2. Valley map** | Portrait map, misty/restored states, landmarks + lore, journeys tied to task timers. Remove expeditions and battles. | The biggest visible payoff. Needs region art. |
| **3. Collection + economy** | Companions screen, earned joins, perks, decorations and cosmetics shop. Remove gacha, fusion, sell and gear. Save migration. | Removes the old systems once the new ones fully replace them. |
| **4. Art pass + store** | Replace the 5 placeholder lines; 512 px WebP; moods; region art. Then write the Play listing (screenshots of the valley + companion). | Needed before any public track. |

Each phase ships on its own and stays true to "real action only".

---

## 11. Decisions for you

1. **Remove the coin gacha completely?** (Recommended.) The alternative is to keep a small cosmetic-only "capsule" for hats and colours, with no companions in it.
2. **Starter choice:** pick 1 of 3 at onboarding (recommended), or always start with Sprout?
3. **Landmark pacing:** 3 / 10 / 25 / 50 / 100 tasks per region. Faster early rewards (1 / 5 / …) feel better in week one but empty the map sooner.
4. **Art style:** keep Growra's cute pixel-glow style (recommended for a habit app), or move it toward the shared art base used by the other games?
