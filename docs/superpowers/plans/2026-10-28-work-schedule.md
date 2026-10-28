# Work Schedule, Task Times and Reward Economy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional personal Work schedule (day/week views, repeat rules with per-day exceptions, completable shifts with companion encouragement) to Growra, give every task an optional length that scales its reward, remove the daily coin cap, and rebalance shop prices.

**Architecture:** Work items are a new `workItems` array in `GameState`, each a repeat rule plus per-date exceptions and per-date completions; occurrences are generated on demand by pure functions in `src/utils/workSchedule.ts`. Rewards move into one shared pure pipeline in `gameplay.ts` used by both `completeTask` and the new `completeWorkOccurrence`. UI adds a Tasks chooser, a Work screen and work-item modal, splits the dashboard Today list, and gives the calendar Personal/Work/Both modes.

**Tech Stack:** Expo 54 / React Native 0.81, TypeScript, NativeWind, Jest (ts-jest, jsdom, TZ=Europe/Lisbon).

**Spec:** `docs/superpowers/specs/2026-10-28-work-schedule-design.md` (sections 8 "Decisions after the builder check" override earlier text).

## Global Constraints

- All user-visible text lives in `src/constants/appCopy.ts`, in both `en` and `pt`; `__tests__/translations.test.ts` must keep passing.
- No network calls, accounts or servers are added.
- Layout must work at 360 px wide; follow existing themes via `getAppTheme`.
- `SAVE_VERSION` goes from 20 to 21 (`src/utils/initialState.ts`); older builds refuse v21 saves (existing `NewerSaveError` path).
- Existing tasks, streaks, coins, companions, rooms and decorations are unchanged by the migration.
- Coins are never capped per day; Bond keeps `DAILY_BASE_BOND_CAP`.
- Branch: `feature/work-schedule` from `develop`. Commit after each task. Run `npx tsc --noEmit`, `npx jest` and `npm run lint` before each commit.

## Review Focus

- **Night shift across midnight** (22:00–06:00): one occurrence on its start day, end on the next day; completable until the end of the day after the start day; appears on the start day in day view.
- **Daylight-saving days** (Lisbon 2026-03-29, 2026-10-25): an "every day 09:00" item still starts at 09:00 local on and after the change; occurrence dates never skip or double.
- **"After N times" with exceptions**: a skipped occurrence still counts toward N (calendar apps behave this way); "this and following" on a count-ended item gives the new item exactly the remaining count.
- **Editing "only this one" then "this and following"** on the same item: the earlier single-day exception survives on the old item and is not copied to the new one.
- **Tutorial for new players**: while `tutorialStep !== "done"`, the Tasks tab opens Personal directly and the existing tutorial targets still resolve.

---

### Task 1: Length-scaled rewards and no daily coin cap

**Files:**
- Modify: `src/utils/gameplay.ts` (constants block ~L36-48; `completeTask` ~L622-712)
- Modify: `src/types/index.ts` (`Task`)
- Test: `__tests__/gameplay.test.ts`

**Interfaces:**
- Produces: `Task.durationMinutes?: number`; `getTaskMinutes(task: Task): number | null` (durationMinutes, else timer duration in minutes when `timer.enabled`, else null); `getRewardScale(minutes: number | null): number`; `BASE_TASK_COIN_REWARD = 15`; `applyCompletionRewards(gameState: GameState, input: CompletionInput, completedAt: number): { state: GameState; coins: number; bondGain: number }` where `interface CompletionInput { name: string; minutes: number | null; facts: CompletionFacts; record: { recurring: boolean; custom: boolean; highPriority: boolean; timer: boolean } }`.

- [ ] **Step 1: Write failing tests**

```ts
it("scales reward with task length, capped at 12 hours", () => {
  expect(getRewardScale(null)).toBe(1);
  expect(getRewardScale(60)).toBeCloseTo(1 + 2 / 3);
  expect(getRewardScale(12 * 60)).toBeCloseTo(9);
  expect(getRewardScale(20 * 60)).toBeCloseTo(9);
});
it("pays coins for every task with no daily cap", () => {
  // 20 short tasks on one day, no streak/companion: each pays 15
  // build state with 20 pending ONCE tasks due today, complete all, expect coins === 20 * 15
});
it("pays more for a task with a length", () => {
  // one task durationMinutes 120 → coins === Math.round(15 * (1 + 2/3 * 2)) === 35
});
it("uses the timer length when no duration is set", () => {
  // timer enabled, duration 30 min, state ready → coins === Math.round(15 * (1 + 2/3 * 0.5)) === 20
});
```

- [ ] **Step 2: Run** `npx jest __tests__/gameplay.test.ts` — expect the new tests to FAIL (getRewardScale undefined; coins 0 after 15 tasks).

- [ ] **Step 3: Implement.** `getRewardScale(m) = 1 + (2/3) * Math.min((m ?? 0) / 60, 12)`. Coins = `Math.round(BASE_TASK_COIN_REWARD * scale * rewardMultiplier) + perkCoins`; XP = `Math.round(BASE_TASK_PLAYER_EXPERIENCE_REWARD * scale * rewardMultiplier)`. Delete `DAILY_COIN_TASK_CAP` and the `paysCoins` gate (keep incrementing `todayCoinTasks` for save compatibility). Extract everything in `completeTask` after the task lookup/guards into `applyCompletionRewards` (streak, usage, days via a `recordDayCompletion` call that takes `{ name }`, Bond, focus find, joins); `completeTask` builds `CompletionInput` from the task and then marks the task completed as today. Change `recordDayCompletion(days, task: { name: string }, facts, now)` signature accordingly in `src/utils/journey.ts`.

- [ ] **Step 4: Run** `npx jest` — all PASS (update existing gameplay assertions that hard-code 10 coins or the 15-task cap to the new values; note each change in the commit body).

- [ ] **Step 5: Commit** `feat(economy): length-scaled rewards, no daily coin cap`

### Task 2: Shop prices follow the new earnings

**Files:**
- Modify: `src/utils/journey.ts` (`DECORATION_TYPES` prices), `src/utils/roomCatalog.ts` (`ROOM_STYLES` prices)
- Test: `__tests__/roomCatalog.test.ts`, `__tests__/journey.test.ts`

**Interfaces:**
- Produces: `PRICE_SCALE = 1.5` exported from `src/utils/roomCatalog.ts`, and `scalePrice(old: number): number` = `Math.ceil(old * PRICE_SCALE / 10) * 10` (0 stays 0). Prices are rewritten in source as literal values, not computed at runtime.

Reasoning to put in the PR: a Personal-only player's short task goes from 10 to 15 coins (×1.5) and the cap only bit power users, so ×1.5 keeps their pace (spec §8).

- [ ] **Step 1: Write failing test** `it("every priced item costs scalePrice(old)")` listing a few pinned values: `tent` 150→230, `star-lamp` 200→300, `bed` 120→180, `greenhouse` 150→230, `japanese-room` 250→380, free items stay 0.
- [ ] **Step 2: Run** `npx jest __tests__/roomCatalog.test.ts __tests__/journey.test.ts` — FAIL.
- [ ] **Step 3: Rewrite every non-zero price** in both catalogs to `scalePrice(old)`.
- [ ] **Step 4: Run** `npx jest` — PASS (fix any shop tests that assume old prices).
- [ ] **Step 5: Commit** `feat(economy): shop prices x1.5 to match new rewards`

### Task 3: Work item model, occurrences and edits

**Files:**
- Create: `src/utils/workSchedule.ts`
- Modify: `src/types/index.ts` (new types, `GameState.workItems`)
- Test: `__tests__/workSchedule.test.ts`

**Interfaces:**
- Produces (types):
  ```ts
  type WorkRepeat =
    | { kind: "none" }
    | { kind: "days"; interval: number }                    // every day = interval 1, every X days
    | { kind: "weeks"; interval: number; weekdays: number[] } // 0=Sun..6=Sat
    | { kind: "months"; interval: number };                 // same day of month; skip months without it
  type WorkEnd = { kind: "never" } | { kind: "count"; count: number } | { kind: "until"; dateKey: string };
  type WorkException = { kind: "skip" } | { kind: "change"; name?: string; description?: string; startMinutes?: number; endMinutes?: number };
  interface WorkItem {
    id: string; name: string; description: string; calendarColor: string;
    startMinutes: number; endMinutes: number;   // minutes from midnight; end <= start means next day
    startDateKey: string;                       // "YYYY-MM-DD", local
    repeat: WorkRepeat; end: WorkEnd;
    exceptions: Record<string, WorkException>;  // by dateKey
    completedDateKeys: string[];
    createdAt: number;
  }
  interface WorkOccurrence { itemId: string; dateKey: string; start: number; end: number; name: string; description: string; calendarColor: string; completed: boolean }
  type WorkEditScope = "one" | "following";
  ```
- Produces (functions in `workSchedule.ts`): `toDateKey(ts: number): string`; `dateKeyToStart(key: string): number`; `getOccurrencesBetween(items: WorkItem[], fromKey: string, toKeyExclusive: string): WorkOccurrence[]` (sorted by start); `getNextOccurrence(items: WorkItem[], now: number): WorkOccurrence | null` (first not completed whose end > now); `getRunningOccurrence(items, now): WorkOccurrence | null`; `canCompleteOccurrence(o: WorkOccurrence, now: number): boolean` (now ≥ start and now < start of the day after the start day + 1 day, and not completed); `editOccurrence(items: WorkItem[], itemId: string, dateKey: string, change: Omit<Extract<WorkException,{kind:"change"}>,"kind">, scope: WorkEditScope, newId: () => string): WorkItem[]`; `deleteOccurrence(items, itemId, dateKey, scope): WorkItem[]`; `createWorkItem(fields: Omit<WorkItem, "id"|"exceptions"|"completedDateKeys"|"createdAt">, id: string, now: number): WorkItem`.

Approach: build occurrence dates by stepping local calendar dates (`new Date(y, m, d + n)`), never by adding milliseconds, so DST is safe; times come from `new Date(y, m, d, 0, startMinutes)`. "following" ends the old item with `{ kind: "until", dateKey: dayBefore }` (or deletes it when dateKey is its first date) and creates a new item from `dateKey` with the change applied, the same repeat, and for `count` ends the remaining count (count minus occurrences before dateKey, skips included); exceptions/completions on or after dateKey move to the new item.

- [ ] **Step 1: Write failing tests** (all with fixed dates in Europe/Lisbon):
  - `"every 4 days from 2026-11-02 occurs on 02, 06, 10"`
  - `"weekly Mon+Thu every 2 weeks"` → 2026-11-02, 11-05, 11-16, 11-19
  - `"monthly on the 31st skips months without a 31st"`
  - `"count 3 stops after three, skips included"` (skip the 2nd → only dates 1 and 3 returned)
  - `"night shift 22:00-06:00 ends the next morning"` (end − start === 8 h, dateKey is the start day)
  - `"keeps 09:00 local across the 2026-10-25 DST change"` (occurrences 10-24, 10-25, 10-26 all at 09:00 local)
  - `"only this one changes a single date"` and `"this and following splits the series"` (old ends day before; new starts at dateKey; earlier exception stays on old item)
  - `"this and following on a count item keeps the remaining count"` (count 5, split at 3rd → new count 3)
  - `"can complete from start until the end of the next day"` (night shift completable at 07:00 next day, not at 00:00 two days later, not before start)
- [ ] **Step 2: Run** `npx jest __tests__/workSchedule.test.ts` — FAIL (module missing).
- [ ] **Step 3: Implement** the types and functions above.
- [ ] **Step 4: Run** `npx jest __tests__/workSchedule.test.ts` — PASS.
- [ ] **Step 5: Commit** `feat(work): work items, repeat rules, exceptions and occurrences`

### Task 4: Save v21, settings, and completing a work occurrence

**Files:**
- Modify: `src/utils/initialState.ts` (`SAVE_VERSION = 21`, `workItems: []`), `src/types/index.ts` (`AppSettings`), `src/utils/settings.ts` (`defaultSettings`), `src/services/gameStateService.ts` (`migrateSaveData`), `src/utils/gameplay.ts`
- Test: `__tests__/gameStateService.test.ts`, `__tests__/gameplay.test.ts`

**Interfaces:**
- Consumes: Task 1 `applyCompletionRewards`, Task 3 types and `canCompleteOccurrence`, `getOccurrencesBetween`.
- Produces: `AppSettings` gains `tasksSection: "choose" | "personal" | "work"` (default `"choose"`), `workView: "day" | "week"` (default `"day"`), `dashboardCollapsed: { personal: boolean; work: boolean }` (default both false), `calendarShowBoth: boolean` (default false). `GameState.workItems: WorkItem[]`. `completeWorkOccurrence(state: GameState, itemId: string, dateKey: string, now?: number): GameState`; `upsertWorkItems(state: GameState, items: WorkItem[]): GameState`.

`completeWorkOccurrence` builds `CompletionInput` with `minutes` = occurrence length, facts from `getCompletionFacts`-equivalent values: `recurring: repeat.kind !== "none"`, `custom: true`, `highPriority: false`, `timer: false`, `overdue: false`, `onDueDay: true`, `scheduledAhead: false`, plus the usual `firstOfDay`, `bigDayReached`, `season`; then adds `dateKey` to `completedDateKeys`. Returns the state unchanged if `!canCompleteOccurrence`.

- [ ] **Step 1: Write failing tests**
  - migration: `"v20 save gains workItems [] and default work settings, keeps tasks/coins/pets"`; `"v21 save loads unchanged"`.
  - `"completing an 8 h shift pays Math.round(15 * (1 + 2/3*8)) coins and counts for the streak"` (= 95 with no multipliers).
  - `"a shift can't be completed before it starts or twice"`.
- [ ] **Step 2: Run** `npx jest __tests__/gameStateService.test.ts __tests__/gameplay.test.ts` — FAIL.
- [ ] **Step 3: Implement** as above (migration defaults with `??`, matching the existing style).
- [ ] **Step 4: Run** `npx jest` — PASS.
- [ ] **Step 5: Commit** `feat(work): save v21, work settings, completing a shift`

### Task 5: Shift encouragement lines

**Files:**
- Modify: `src/constants/appCopy.ts` (both languages), `src/utils/companionText.ts`
- Test: `__tests__/companionText.test.ts`

**Interfaces:**
- Produces: `type ShiftStage = "start" | "middle" | "last-hour"`; `getShiftStage(o: WorkOccurrence, now: number): ShiftStage` (first hour → start; final hour → last-hour; else middle); `shiftEncouragement(copy: AppCopy, stage: ShiftStage, petName: string, now: number): string` picking deterministically from 3+ lines per stage per language (use the same rotation approach as `companionLine`). Copy keys: `shiftLinesStart`, `shiftLinesMiddle`, `shiftLinesLastHour` (string arrays with `{name}`).

- [ ] **Step 1: Failing tests:** stage boundaries for an 8 h shift (start+30 min → start, +4 h → middle, +7 h 30 → last-hour); line contains the pet name; pt lines are non-empty and differ from en.
- [ ] **Step 2: Run** `npx jest __tests__/companionText.test.ts __tests__/translations.test.ts` — FAIL.
- [ ] **Step 3: Implement** functions and copy (en examples: "Halfway there, {name} is cheering!", "Last hour — you've got this.").
- [ ] **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** `feat(work): companion encouragement during a shift`

### Task 6: Optional length on personal tasks (form)

**Files:**
- Modify: `src/components/AddTaskModal.tsx`, `src/components/TaskDetailsModal.tsx`, `src/utils/taskFactory.ts` (`TaskFormValues.durationMinutes: number | null`, passed through `createTask`), `src/constants/appCopy.ts`
- Test: `__tests__/taskDraft.test.ts` or a new `__tests__/taskFactory.test.ts`

**Interfaces:**
- Consumes: Task 1 `Task.durationMinutes`.
- Produces: a "How long?" chip row in the task form: None, 15, 30, 45 min, 1 h, 2 h, 4 h, 8 h; `buildTaskFromFormValues` copies the value; TaskDetails shows "≈ 45 min" when set and lets it be edited.

- [ ] **Step 1: Failing test** `"buildTaskFromFormValues keeps durationMinutes"` (45 → task.durationMinutes 45; null → undefined).
- [ ] **Step 2: Run** — FAIL. **Step 3:** implement. **Step 4:** `npx jest` PASS, `npx tsc --noEmit` clean.
- [ ] **Step 5: Commit** `feat(tasks): optional length on every task`

### Task 7: Tasks chooser and navigation

**Files:**
- Create: `src/components/TasksChooser.tsx`
- Modify: `src/App.tsx` (`Screen` union gains `"work"` and `"work-calendar"`; `case "tasks"` renders chooser/personal/work per `settings.tasksSection`), `src/screens/TasksScreen.tsx` (header back control "‹ Tasks" calling `onBackToChooser`), `src/constants/appCopy.ts`

**Interfaces:**
- Consumes: Task 4 settings, `getOccurrencesBetween`, `getTodayTasks`.
- Produces: `TasksChooser({ settings, personalCount, workPreview, onChoose(section: "personal" | "work") })` — two large cards; work preview text "Shift 14:00–22:00", "No shifts today", or "Set up your work schedule". Choosing persists `tasksSection`. While `tutorialStep !== "done"`, `case "tasks"` always renders Personal.

- [ ] **Step 1:** Implement; **Step 2:** `npx tsc --noEmit` clean, `npx jest` PASS (translations).
- [ ] **Step 3: Web check:** `npx expo export --platform web`, serve, and with Playwright (Pixel-size viewport) load a demo save: Tasks shows the chooser; choosing Personal then reloading opens Personal; a fresh save mid-tutorial opens Personal. Save screenshots to `/mnt/HDD2/Project-Previews/growra/14-work-schedule/`.
- [ ] **Step 4: Commit** `feat(tasks): Personal / Work chooser, remembered`

### Task 8: Work screen and work-item form

**Files:**
- Create: `src/screens/WorkScreen.tsx`, `src/components/WorkItemModal.tsx`, `src/components/WorkScopePrompt.tsx`
- Modify: `src/App.tsx` (handlers `handleSaveWorkItem`, `handleEditWorkOccurrence`, `handleDeleteWorkOccurrence`, `handleCompleteWorkOccurrence`, wired to Task 3/4 functions and persisted like other handlers), `src/constants/appCopy.ts`

**Interfaces:**
- Consumes: Task 3 functions, Task 4 `completeWorkOccurrence`, `upsertWorkItems`, Task 5 `shiftEncouragement`.
- Produces: `WorkScreen({ gameState, settings, now, onBackToChooser, onOpenCalendar, onSaveItem, onEditOccurrence, onDeleteOccurrence, onCompleteOccurrence, onSetView })`. Day view: occurrences of the selected day in time order (completed ones ticked), ‹ › and "Today"; Week view: Mon–Sun columns (or stacked rows on narrow screens) with ‹ › by week. Running shift shows the companion card with `shiftEncouragement`. `WorkItemModal` fields: name, description, colour, start, end, repeat (none / every day / every X days / weekly + weekday chips / every X weeks / monthly), ends (never / after N / on date). Edit or delete of a repeating occurrence first shows `WorkScopePrompt` ("Only this one" / "This and all following").

- [ ] **Step 1:** Implement screen, modal, prompt and App wiring.
- [ ] **Step 2:** `npx tsc --noEmit`, `npx jest`, `npm run lint` clean.
- [ ] **Step 3: Web check (Playwright):** create "Morning shift 07:00–15:00 every 4 days"; day view shows it; week view shows 2 occurrences; delete "only this one" → that day empty, next one still there; complete a running shift → coins increase by 95-ish and encouragement card disappears. Screenshots to the preview folder.
- [ ] **Step 4: Commit** `feat(work): Work screen with day/week views and shift editor`

### Task 9: Dashboard Personal / Work sections

**Files:**
- Modify: `src/screens/DashboardScreen.tsx`, `src/App.tsx` (pass work props and `onToggleSection`), `src/constants/appCopy.ts`

**Interfaces:**
- Consumes: Task 3 `getOccurrencesBetween`, `getNextOccurrence`, `getRunningOccurrence`; Task 4 `dashboardCollapsed`, `completeWorkOccurrence`; Task 5 lines.
- Produces: two titled sections; tapping a title toggles and persists `dashboardCollapsed`; each section lists its own items with its next item first (personal: first pending today task by priority then name; work: running occurrence, else next today). Work section renders only when `workItems.length > 0`. Header "N pending tasks" counts pending personal tasks plus today's incomplete work occurrences.

- [ ] **Step 1:** Implement. **Step 2:** tsc/jest/lint clean. **Step 3:** Web check: no work items → dashboard identical to before (compare screenshot); with items → both sections, collapse persists after reload. **Step 4: Commit** `feat(dashboard): Personal and Work sections`

### Task 10: Calendar modes and CSV export

**Files:**
- Modify: `src/screens/TaskCalendarScreen.tsx` (prop `mode: "personal" | "work"`, toggle "Show both" bound to `calendarShowBoth`), `src/App.tsx` (`work-calendar` screen), `src/utils/historyCsv.ts`, `src/constants/appCopy.ts`
- Test: `__tests__/historyCsv.test.ts`

**Interfaces:**
- Consumes: Task 3 `getOccurrencesBetween`; Task 4 `calendarShowBoth`.
- Produces: personal mode shows tasks only; work mode shows occurrences only; with "Show both" either mode shows both, work in its item colour with a small "work" marker. `buildWorkCsv(items: WorkItem[], fromKey: string, toKey: string): string` with columns `date,start,end,name,completed`, appended to the existing Plus export.

- [ ] **Step 1: Failing test** `"buildWorkCsv lists occurrences with completion"`. **Step 2:** run FAIL. **Step 3:** implement. **Step 4:** `npx jest` PASS, web check of the toggle. **Step 5: Commit** `feat(calendar): work calendar, show both, work in CSV export`

### Task 11: Release notes and final verification

**Files:**
- Modify: `src/constants/changelog.ts` (new unreleased entry, en + pt: Work schedule, task lengths, bigger rewards, no daily coin limit, new shop prices)

- [ ] **Step 1:** Add the changelog entry (do not bump the app version; release is a separate decision).
- [ ] **Step 2:** `npx tsc --noEmit && npx jest && npm run lint` — all clean.
- [ ] **Step 3:** Full web walkthrough with an existing demo save (`/mnt/HDD2/Project-Previews/growra/approved/11-store-screenshots/growra-demo-en.json`, which is v20): it loads, migrates, nothing lost; screenshots of chooser, Work day/week, dashboard sections, calendar both.
- [ ] **Step 4: Commit** `docs(changelog): work schedule update notes`, push the branch and open a PR into `develop`.
