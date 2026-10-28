# Groups on the Tasks page (custom categories): design

Date: 2026-10-28 · Status: awaiting review · Builds on: Work schedule (`2026-10-28-work-schedule-design.md`, PR #66, #67)

## Why

People coordinate other people's time: a child's school and activities, a team's rota, a partner's shifts. Today Growra
has two fixed areas, Personal (a to-do list) and Work (a schedule). The owner wants players to add **their own
categories** next to these, so someone else's schedule or list can live beside theirs on the same phone.

It stays **personal and on-device**: the player enters everything themselves. No sharing, no accounts, no server.

Success looks like:
- a parent adds "Leo" as a Schedule in a few taps and puts swim class every Tuesday 17:00 in it;
- the dashboard shows Leo's next activity today as a single line, without crowding the player's own lists;
- the calendar can show Personal, Work and Leo together, or any mix of them;
- players who never add a category see the app exactly as today.

## Goals

1. Players can **create, rename, recolour and delete** their own categories. **Personal and Work are built in**: they
   can be renamed/recoloured only if cheap (builder's call), but never deleted.
2. When creating a category the player picks its **type**, fixed afterwards:
   - **Schedule** — behaves like Work: items with times, repeats, exceptions, day/week view.
   - **List** — behaves like Personal: tasks with priority, length, frequency, calendar.
3. Items in custom categories **earn nothing**: no coins, XP, Bond, streak, Journey, companion joins or praise bubble.
   They can still be ticked off as done.
4. **Dashboard:** each custom category with something today gets a small collapsible section showing **only its next
   item**. Tapping the section opens that category.
5. **Calendar:** a **category picker** (tick which categories to show together) replaces the "Show both" toggle.

## Non-goals

- Sharing a category with the other person, importing a rota, syncing with other apps.
- Reminders/notifications for custom categories.
- Companion encouragement during someone else's schedule items.
- Changing how Personal and Work themselves behave or pay.

## Anti-goals

- Ticking someone else's item gives the player rewards (exploit and confusing).
- The Tasks choice screen or dashboard feels crowded for players with no custom categories.
- Deleting a category silently deletes data without a confirmation.
- Any existing task, work item, setting or reward state changes during migration.

## 1. Tasks choice screen

- Shows Personal, Work, then each custom category as a card (name, colour, a one-line preview of today like the
  existing ones), then an **"+ Add category"** card.
- Creating: name (required, trimmed, max ~24 characters), colour (from the existing calendar colour palette), type
  (Schedule / List, with a one-line explanation of each). Duplicate names are allowed but discouraged (builder's call).
- A long-press or "⋯" on a custom card offers rename, change colour, delete. Delete asks for confirmation and states how
  many items will be removed.
- Growra remembers the last opened category (generalising today's `tasksSection`).
- During the first-run tutorial, Tasks still opens Personal directly.

## 2. Inside a custom category

- **Schedule** categories reuse the Work screen (day/week views, the shift form, scope prompt), titled with the
  category's name and colour. No companion encouragement card and no rewards; ticking just marks the item done.
- **List** categories reuse the Personal Tasks screen (add, edit, priorities, lengths, frequencies), titled with the
  category name. Ticking marks done with no rewards and no praise bubble.
- Each has the back control to the choice screen, like Personal and Work.

## 3. Dashboard

- Personal and Work sections are unchanged.
- Below them, one compact section per custom category **that has something today**: header (name, colour, collapse
  toggle) and a single row with its next item (the next not-done schedule item today, or the first pending list task
  by the same priority-then-name rule). Ticking from that row marks it done (no rewards).
- Tapping the header area opens the category. Collapsed state is remembered per category.
- Custom items do **not** count toward the header's "N pending tasks" (that count is the player's own day).

## 4. Calendar

- The "Show both" switch becomes a **"Show" picker**: chips or checkboxes for every category (Personal, Work, customs),
  shown only when more than one category has items. The category the calendar was opened from is always included.
  The choice is remembered.
- Items are coloured by their own item/task colour with a small marker in the category's colour, so mixed days stay
  readable.

## 5. Data and migration

- New `GameState.categories: Category[]` with `{ id, name, color, kind: "list" | "schedule", builtIn?: "personal" | "work", createdAt }`.
  Personal and Work exist as built-ins (ids `"personal"`, `"work"`).
- Work items and tasks gain an owner: `categoryId` on `WorkItem` and `Task` (missing = their built-in, so existing data
  needs no rewrite beyond defaults). Naming note: tasks already have a `category` *tag* field ("health", "study");
  the new concept must not collide with it in code or in the UI (see open question).
- Settings generalise: `tasksSection` → last opened category id; `dashboardCollapsed` → per category id;
  `calendarShowBoth` → list of category ids to show together. Old values map over (personal/work collapsed flags;
  showBoth true → [personal, work]).
- `SAVE_VERSION` 21 → 22, purely additive; older builds refuse v22 as today.
- Rewards: completion paths check the owner category; only built-in Personal/Work items pay and trigger praise, streak,
  Journey and companion logic. Custom completions only flip their done state.
- CSV export (Plus): include custom categories, with a category column (builder decides file layout).

## 6. Constraints

- Expo / React Native; all text in `appCopy.ts` (en + pt-PT); 360 px layout; existing themes.
- Branch from `develop`; develop stays releasable; no release decisions here.
- No network, accounts or servers.

## 7. Left to the builder

- Card and form visuals; where rename/delete live (long-press vs ⋯ menu).
- Whether built-ins can be renamed/recoloured.
- A sensible cap on the number of custom categories (e.g. 10) if layout needs it.
- Reusing vs generalising Work/Tasks screens (prefer generalising with a `categoryId` prop over copies).

## 8. Decisions after the builder check (author's calls, 2026-10-28)

- **Custom items are invisible to the game.** They live inside their own category, not in `gameState.tasks` /
  `gameState.workItems`: `Category` carries `tasks?: Task[]` (List) or `workItems?: WorkItem[]` (Schedule). So usage
  counters, big-day/first-of-day facts, companion joins and moods, streak, Journey, reminders, tutorial and stats never
  see them, with no filters needed. Only their own screen, their dashboard row, the calendar and the CSV export read
  them. Built-in Personal/Work keep today's arrays untouched (this replaces the `categoryId` idea in section 5).
- **Free for everyone**, like Work. A cap of 10 custom categories, for layout only.
- **Deleting** asks for confirmation and counts **items**: a repeating schedule item counts as one.
- **Ticking custom schedule items** follows the same rule as Work (`canCompleteOccurrence`: from the item's start until
  the end of the next day), with no rewards, so the behaviour stays consistent.
- **Dashboard:** the time-based ticker also runs while a custom Schedule section is visible. A category whose items
  today are all done shows **no section** (same as having nothing today).
- **Settings:** if the remembered category was deleted, Tasks falls back to the choice screen. `calendarShowBoth`
  true maps to [personal, work]. The category the calendar was opened from is always shown, for every kind.
- **Calendar entries:** mixed kinds keep their current rendering. Tapping an entry opens it in its own category.
- **Built-in Personal and Work** keep fixed names and colours.

## 9. Sharing a category by code (owner request, 2026-10-28)

No server, the same idea as room codes (`src/utils/roomCode.ts`, `roomShare.ts`): copy-only, never a live sync.

- **Share:** the custom category's ⋯ menu offers "Share". Growra encodes the category's name, colour, type and items
  (tasks or work items with repeats and exceptions) into a compact text code, compressed the way room codes are, and
  opens the system share sheet. Completion state, rewards data and anything from Personal/Work are never included.
- **Import:** "+ Add category" offers "From a code". Pasting a valid code creates a new custom category with fresh ids,
  and nothing is ticked.
- **Updating:** the code carries the source category's stable id. If the player already has a category imported from
  that same source, pasting a newer code asks "Update <name>?". Yes replaces its items and keeps the local category's
  collapsed and calendar settings; No creates a new copy.
- **Built-ins are shareable too (owner, 2026-10-28):** Personal and Work have the same "Share" option. Only the items
  themselves go into the code (name, description, times, repeats, exceptions, priority, length). No completions,
  streak, coins or other game data. Because Personal can hold private things, the share step first shows what will be
  shared (e.g. "12 tasks from Personal") before opening the share sheet.
- **Importing never touches the receiver's own Personal or Work:** a shared Personal or Work arrives as a **new custom
  category** of the matching type, named after the source (e.g. "Ana's Work", editable), and earns no rewards, like any
  custom category. "Update <name>?" works for it the same way.
- **Robustness:** invalid, truncated or newer-version codes show a friendly error and never change data. The code has a
  version prefix so a future format can still be read or politely refused.
- **Limits:** importing respects the 10-category cap. Very large codes are allowed (they're pasted, not typed). A QR
  option can follow later, as with room codes phase 2 (issue #41).

## 10. Name (owner, 2026-10-28)

The feature is called **Groups** in the UI (pt-PT **Grupos**): "+ Add group", "Share group", "Add group from code".
The existing task tag ("health", "study") keeps its current name. In code use `Group` / `GameState.groups` /
`groupId`; never reuse the word `category`, which already means the task tag. Everywhere this document says
"category" for the new concept, read "group".
