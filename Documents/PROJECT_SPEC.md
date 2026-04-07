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

## 5.3 Pet System

### Core Concept:

* user collects pets
* user equips 1 pet for tasks
* pets gain experience from tasks (multiplied by pet's XP multiplier)
* pets can evolve through multiple stages
* pets can be fused to increase strength
* pets support cosmetic variants

### Pet Rarity:

* Common
* Rare
* Epic
* Legendary

### Task Interaction:

* each pet has a **task multiplier** (coin reward bonus)
* each pet has an **XP multiplier** (experience gain per task)

Example (Task Multiplier):

* Common → +5%
* Rare → +10%
* Epic → +15%

Example (XP Multiplier — per pet):

* Sprout (Common) → 0.9× (slower leveling)
* Pebble (Common) → 1.1× (faster leveling)
* Ember (Rare) → 1.3×
* Nova (Epic) → 1.65×

### Evolution System:

* pets have multiple evolution stages: base, evolution 1, evolution 2
* evolution progresses through gameplay
* each stage has unique visuals and stat progression

### Fusion System:

* pets can be fused with duplicates to increase fusion level
* maximum fusion level: 4
* fusion improves pet stats and effectiveness
* selling a max-fused pet (4 fusions) yields pity coins instead of coins

### Cosmetic Variants:

* pets support variant skins
* variants can be unlocked or cosmetically applied
* variants use the `activeImageVariantId` system

### Pet Stats:

* attack
* defense
* speed
* luck
* combat power (derived from stats)
* exploration power (derived from stats)

### Pet Passives:

* passive abilities that provide bonuses (e.g., increased loot, exploration speed)
* passives are trait-based per pet template

### Leveling:

* pets level from 1 to 99
* milestone levels: 12, 16, 24, 41, 81, 99
* experience is required to level up

---

## 5.4 Adventure System (Secondary)

### Purpose:

* give value to inactive pets

### Rules:

* pets sent on adventures
* NO coin generation
* does NOT replace task system

### Rewards:

* materials
* cosmetics
* evolution resources

### Stats System:

* attack
* defense
* speed
* luck

### Passives:

* e.g. increased loot
* increased exploration speed

---

## 5.5 Economy System

### Currency:

* coins (main)

### Spending:

1. pets (gacha)
2. upgrades (light)
3. cosmetics

### Explicitly NOT allowed:

* systems that bypass effort
* streak protection mechanics

---

## 5.6 Gacha System

### Single Summon:

* **cost:** 100 coins
* gives 1 random pet
* gives 1 pity coin

### Multi-Summon (10+1):

* **cost:** 1,000 coins
* gives 11 pets (10 random + 1 bonus)
* gives 10 pity coins

### Pity Shop:

* accumulate pity coins from summoning
* redeem pity coins to buy specific pets:
  * Common: 15 pity coins
  * Rare: 30 pity coins
  * Epic: 60 pity coins

### Selling Max-Duped Pets:

* normal selling (unfused or not at max): gives coins
* selling a pet at max fusion (4 fusions): gives **pity coins instead**:
  * Common: 1 pity coin
  * Rare: 2 pity coins
  * Epic: 3 pity coins

### Goal:

* randomness + guaranteed progression + manage excess duplicates

---

## 6. Main Screen (Dashboard)

### Layout:

Top:

* equipped pet
* streak + bonus
* player level and coins

Middle:

* quick actions (add task)

Main:

* task list (default: Today)
* shows pending and completed tasks

Bottom:

* bottom navigation (screens: Dashboard, Tasks, Calendar, Pets, Settings)

### Goal:

* fast interaction
* minimal friction
* daily usage focus

---

## 6.1 Navigation & Screens

### Available Screens:

* **Dashboard** - main view with equipped pet and today's tasks
* **Tasks** - full task management with filters and search
* **Task Calendar** - month-based calendar view with task indicators
* **Pets** - pet collection, equip, summon, fusion, and sell screens
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
