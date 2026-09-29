# Growra – Project Specification (MVP)

---

## 1. Vision

Growra is a **gamified task management mobile app** where users improve their real-life habits through a game-like system involving pets, progression, and rewards.

The core idea:

* completing real-life tasks → gives rewards
* rewards → progress pets and unlock content
* consistency → increases efficiency through streak bonuses

The app is based on **self-accountability**, not external validation.

---

## 2. Platform and Scope

**Primary platform:** Android
**Release goal:** Google Play Store

**Current priority:**

* build a clean MVP foundation
* mobile-first UX
* simple and maintainable architecture
* avoid overengineering

**Out of scope (MVP):**

* backend
* user accounts
* cloud sync
* complex persistence

---

## 3. Tech Direction

**Stack:** React Native with Expo (TypeScript)

### Reasoning:

* fast iteration on real device (QR code)
* mobile-first development
* reduced setup complexity
* suitable for MVP

### Guidelines:

* clean architecture
* no unnecessary libraries
* strict TypeScript
* avoid runtime defensive checks

---

## 4. Data Storage Direction

MVP will use **local storage only**.

Possible approaches:

* AsyncStorage
* local file export/import (future)

No backend required.

---

## 5. Core Systems Overview

## 5.1 Task System

### Task Types:

* Predefined tasks (system-defined)
* Custom tasks (user-created)

### Scheduling (MVP):

* one-time
* daily
* weekly

### Task Completion:

* manual (user confirms completion)
* trust-based system

### Task Priorities:

* LOW
* MEDIUM
* HIGH
* affects sorting and visual display in task lists

### Task Features:

* task descriptions
* calendar colors (per-task customization)
* task details modal (edit, delete, view completion info)
* quick add from dashboard
* one-tap completion from Today list

### Task Organization:

* task calendar screen with month navigation
* visual day indicators (scheduled count, completed count)
* task filtering (all, active, completed)
* search functionality
* priority-aware sorting

### Optional (Phase 2):

* timer-based tasks

  * notification
  * vibration
  * extend option

---

## 5.2 Reward System

### Base Reward:

* all tasks give **10 coins** per task
* base player XP: 8 per task
* base pet XP: 6 per task

### Streak System:

* completing tasks consistently increases bonus
* bonus grows **+5% per day** (from day 1)
* bonus is capped at **+100%**

### Failure System:

* miss 1 day → lose 1 streak level
* miss 3 consecutive days → full reset

---

## 5.3 Companions

Details and reasoning: [`GAME_REDESIGN.md`](GAME_REDESIGN.md) §4. Rules live in `src/utils/companions.ts`.

### Core Concept:

* there is no summoning, fusion or selling; each companion exists once
* the player picks a first companion (Sprout, Ripple or Glint) in the tutorial
* the others join when the player uses Growra in their style (routines, timers, planning ahead, priorities, custom tasks, tidying overdue tasks, showing up, big days)
* one companion is active ("Take along"); it gives a small perk that matches its style
* companions support cosmetic variants (`activeImageVariantId`)

### Bond and Evolution:

* +1 Bond per completed task while active (max 5 a day), +1 more when the task matches its style
* evolves at 30 Bond (evo 1) and 100 Bond (evo 2)
* mood is derived from today (hi / happy / glowing / sleepy) and never hurts

---

## 5.4 Journey

Details: [`GAME_REDESIGN.md`](GAME_REDESIGN.md) §5. Rules live in `src/utils/journey.ts`.

* every active day (at least one completed task) adds a tile to a road; missed days never break it
* tiles show how that day was used (flowers for routines, crystals for timers, a flag for High priority, and so on)
* a camp every 7 active days with a "this week" look-back card; a new region every 28 (8 regions, then season 2)
* finished timer tasks: every 3rd one, the active companion brings back a find (a decoration)
* progress comes only from the user's own activity, never from waiting

---

## 5.5 Economy System

### Currency:

* coins (main), 10 per completed task with streak and companion bonuses; coins stop after 15 completions a day

### Spending:

* decorations for camps on the Journey
* later: cosmetics

### Explicitly NOT allowed:

* systems that bypass effort
* streak protection mechanics
* buying companions, Bond or progress

---

## 6.1 Navigation & Screens

### Available Screens:

* **Dashboard** - main view with equipped pet and today's tasks
* **Tasks** - full task management with filters and search
* **Task Calendar** - month-based calendar view with task indicators
* **Journey** - the road of active days, camps, look-back cards and decorations
* **Companions** - the collection, who joins how, Bond and the active companion
* **Settings** - language, theme, stats, import/export, backup codes

### Bottom Navigation:

* persistent navigation between major screens
* quick access to all core features

---

## 7. Localization & Themes

### Supported Languages:

* English (en)
* Portuguese (pt)
* extensible framework for future languages

### Theme System:

Available themes:

* **Mint** - cool, calm aesthetic
* **Sunset** - warm, evening aesthetic
* **Ocean** - deep blue, water-inspired aesthetic

Each theme includes:

* primary and secondary colors
* background colors
* text colors
* accent colors
* UI element styling

Theme customization is saved to player settings.

---

## 8. Tutorial & Onboarding

### Tutorial System:

* multi-step tutorial overlay for new players
* covers core mechanics (tasks, pets, rewards, progression)
* can be skipped at any time
* `tutorialCompleted` flag prevents re-triggering

---

## 9. Settings & Import/Export

### Settings Menu:

* language selection (en, pt)
* theme selection (mint, sunset, ocean)
* player statistics view
* import from backup code
* export to backup code

### Backup System:

* save game state as exportable codes
* restore game from backup codes
* supports migration between devices

---

## 10. Architecture Principles

* separate concerns (tasks, pets, rewards)
* keep logic modular
* no unnecessary abstraction early
* avoid defensive programming
* assume valid typed data

---

## 11. Coding Rules

* use TypeScript strictly
* avoid `any`
* no runtime type checks (no typeof / Array.isArray unless necessary)
* trust defined interfaces
* keep functions simple and readable

---

## 12. Development Approach

### Step 1:

* define types (Task, Pet, GameState)

### Step 2:

* implement Task system

### Step 3:

* implement basic UI (dashboard)

### Step 4:

* add Pet system

### Step 5:

* expand into Adventure + Gacha

---

## 13. Key Design Principle

> The app must never allow passive progression to replace real-world action.

Users must always:

* complete tasks
* stay consistent
* engage actively

---

## 14. Summary

Growra is:

* a habit-building app
* with game mechanics
* focused on consistency and progression
* simple at first, expandable later

---

## End of Specification
