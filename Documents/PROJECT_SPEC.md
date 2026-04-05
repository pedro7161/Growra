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

### Optional (Phase 2):

* timer-based tasks

  * notification
  * vibration
  * extend option

---

## 5.2 Reward System

### Base Reward:

* all tasks give equal base reward

### Streak System:

* completing tasks consistently increases bonus
* bonus grows over time
* bonus is capped (e.g. +50%)

### Failure System:

* miss 1 day → lose 1 streak level
* miss 3 consecutive days → full reset

---

## 5.3 Pet System

### Core Concept:

* user collects pets
* user equips 1 pet for tasks
* pets gain experience from tasks
* pets can evolve

### Task Interaction:

* each pet has a **task multiplier**
* multiplier applies to rewards

Example:

* Common → +5%
* Rare → +10%
* Epic → +15%

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

### Summon:

* uses coins
* gives random pet
* gives pity currency

### Pity System:

* every summon gives currency
* currency used to buy specific pets

### Goal:

* randomness + guaranteed progression

---

## 6. Main Screen (Dashboard)

### Layout:

Top:

* equipped pet
* streak + bonus

Middle:

* quick actions (add task)

Main:

* task list (default: Today)

Bottom:

* navigation (future)

### Goal:

* fast interaction
* minimal friction
* daily usage focus

---

## 7. Architecture Principles

* separate concerns (tasks, pets, rewards)
* keep logic modular
* no unnecessary abstraction early
* avoid defensive programming
* assume valid typed data

---

## 8. Coding Rules

* use TypeScript strictly
* avoid `any`
* no runtime type checks (no typeof / Array.isArray unless necessary)
* trust defined interfaces
* keep functions simple and readable

---

## 9. Development Approach

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

## 10. Key Design Principle

> The app must never allow passive progression to replace real-world action.

Users must always:

* complete tasks
* stay consistent
* engage actively

---

## 11. Summary

Growra is:

* a habit-building app
* with game mechanics
* focused on consistency and progression
* simple at first, expandable later

---

## End of Specification
