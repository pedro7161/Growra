import { GameState, Pet, Task, TaskFrequency, TaskPriority, TaskStatus, TaskType, UsageStats } from "../types";
import { getCalendarDayDifference, getStartOfDay } from "./taskSchedule";

/**
 * Companions (Documents/GAME_REDESIGN.md §4): every pet exists once, joins when the user uses
 * Growra in its style, and grows through Bond. Nothing here is bought or rolled.
 */

export type CompanionStyle =
  | "getting-started"
  | "flow"
  | "focus"
  | "routines"
  | "timekeeping"
  | "showing-up"
  | "looking-ahead"
  | "priorities"
  | "own-tasks"
  | "tidying"
  | "long-run"
  | "big-days";

export interface CompanionDefinition {
  templateId: string;
  style: CompanionStyle;
  starter: boolean;
  /** Returns true once the player's usage qualifies this companion to join. */
  joinsWhen: (usage: UsageStats) => boolean;
  /** Target shown on locked cards, e.g. "10 recurring tasks". */
  joinProgress: (usage: UsageStats) => { current: number; target: number };
}

const count = (current: number, target: number) => ({ current: Math.min(current, target), target });

export const COMPANIONS: CompanionDefinition[] = [
  { templateId: "sprout", style: "getting-started", starter: true, joinsWhen: (u) => u.activeDays >= 3, joinProgress: (u) => count(u.activeDays, 3) },
  { templateId: "ripple", style: "flow", starter: true, joinsWhen: (u) => u.rescheduled >= 1, joinProgress: (u) => count(u.rescheduled, 1) },
  { templateId: "glint", style: "focus", starter: true, joinsWhen: (u) => u.timersFinished >= 1, joinProgress: (u) => count(u.timersFinished, 1) },
  { templateId: "moss", style: "routines", starter: false, joinsWhen: (u) => u.recurringDone >= 10, joinProgress: (u) => count(u.recurringDone, 10) },
  { templateId: "tempo", style: "timekeeping", starter: false, joinsWhen: (u) => u.timersFinished >= 5, joinProgress: (u) => count(u.timersFinished, 5) },
  { templateId: "pebble", style: "showing-up", starter: false, joinsWhen: (u) => u.activeDays >= 7, joinProgress: (u) => count(u.activeDays, 7) },
  { templateId: "astra", style: "looking-ahead", starter: false, joinsWhen: (u) => u.scheduledWeekAhead >= 1, joinProgress: (u) => count(u.scheduledWeekAhead, 1) },
  { templateId: "ember", style: "priorities", starter: false, joinsWhen: (u) => u.highPriorityDone >= 10, joinProgress: (u) => count(u.highPriorityDone, 10) },
  { templateId: "zephie", style: "own-tasks", starter: false, joinsWhen: (u) => u.customCreated >= 5, joinProgress: (u) => count(u.customCreated, 5) },
  { templateId: "umbra", style: "tidying", starter: false, joinsWhen: (u) => u.overdueCleared >= 5, joinProgress: (u) => count(u.overdueCleared, 5) },
  { templateId: "nova", style: "long-run", starter: false, joinsWhen: (u) => u.activeDays >= 30, joinProgress: (u) => count(u.activeDays, 30) },
  { templateId: "cindra", style: "big-days", starter: false, joinsWhen: (u) => u.bigDays >= 1, joinProgress: (u) => count(u.bigDays, 1) },
];

export const STARTER_TEMPLATE_IDS = COMPANIONS.filter((c) => c.starter).map((c) => c.templateId);

export const DAILY_COIN_TASK_CAP = 15;
export const DAILY_BASE_BOND_CAP = 5;
const BIG_DAY_TASKS = 5;
const SCHEDULED_AHEAD_DAYS = 3;
const WEEK_AHEAD_DAYS = 7;

/** Bond needed for each growth step; step 2 = first evolution, step 4 = second (§4.3). */
export const BOND_GROWTH_THRESHOLDS = [0, 15, 30, 60, 100];

export function getCompanionDefinition(templateId: string): CompanionDefinition | undefined {
  return COMPANIONS.find((companion) => companion.templateId === templateId);
}

/** Growth step 0-4; it drives stats the way fusion levels used to. */
export function getGrowthLevel(bond: number): number {
  let level = 0;
  BOND_GROWTH_THRESHOLDS.forEach((threshold, index) => {
    if (bond >= threshold) level = index;
  });
  return level;
}

export function getEvolutionStageForBond(bond: number): number {
  const growth = getGrowthLevel(bond);
  return growth >= 4 ? 2 : growth >= 2 ? 1 : 0;
}

/** Bond at which the next evolution happens, or null at the final stage. */
export function getNextEvolutionBond(bond: number): number | null {
  if (bond < BOND_GROWTH_THRESHOLDS[2]) return BOND_GROWTH_THRESHOLDS[2];
  if (bond < BOND_GROWTH_THRESHOLDS[4]) return BOND_GROWTH_THRESHOLDS[4];
  return null;
}

/** 0-1 progress from the current evolution stage towards the next one (1 at the final stage). */
export function getBondProgress(bond: number): number {
  const next = getNextEvolutionBond(bond);
  if (next === null) return 1;
  const start = next === BOND_GROWTH_THRESHOLDS[4] ? BOND_GROWTH_THRESHOLDS[2] : 0;
  return (bond - start) / (next - start);
}

export function createEmptyUsage(): UsageStats {
  return {
    activeDays: 0,
    lastActiveDay: 0,
    todayDay: 0,
    todayDone: 0,
    todayCoinTasks: 0,
    todayBaseBond: 0,
    recurringDone: 0,
    timersFinished: 0,
    customCreated: 0,
    highPriorityDone: 0,
    overdueCleared: 0,
    rescheduled: 0,
    scheduledWeekAhead: 0,
    bigDays: 0,
  };
}

/** Rolls the per-day counters over when the calendar day changes. */
export function withToday(usage: UsageStats, now: number): UsageStats {
  const today = getStartOfDay(now);
  if (usage.todayDay === today) return usage;
  return { ...usage, todayDay: today, todayDone: 0, todayCoinTasks: 0, todayBaseBond: 0 };
}

export interface CompletionFacts {
  recurring: boolean;
  custom: boolean;
  highPriority: boolean;
  timer: boolean;
  overdue: boolean;
  onDueDay: boolean;
  scheduledAhead: boolean;
  firstOfDay: boolean;
  bigDayReached: boolean;
}

export function getCompletionFacts(task: Task, usageToday: UsageStats, now: number): CompletionFacts {
  const today = getStartOfDay(now);
  const dueDay = getStartOfDay(task.dueDate);
  return {
    recurring: task.frequency !== TaskFrequency.ONCE,
    custom: task.type === TaskType.CUSTOM,
    highPriority: task.priority === TaskPriority.HIGH,
    timer: task.timer.enabled,
    overdue: dueDay < today,
    onDueDay: dueDay === today,
    scheduledAhead: getCalendarDayDifference(task.createdAt, task.dueDate) >= SCHEDULED_AHEAD_DAYS,
    firstOfDay: usageToday.todayDone === 0,
    bigDayReached: usageToday.todayDone + 1 === BIG_DAY_TASKS,
  };
}

/** Does this completion match the active companion's style? (Adds +1 Bond, §4.3.) */
function matchesStyle(style: CompanionStyle, facts: CompletionFacts): boolean {
  switch (style) {
    case "getting-started":
    case "showing-up":
      return facts.firstOfDay;
    case "focus":
      return facts.timer;
    case "timekeeping":
      return facts.onDueDay;
    case "routines":
      return facts.recurring;
    case "looking-ahead":
      return facts.scheduledAhead;
    case "priorities":
      return facts.highPriority;
    case "own-tasks":
      return facts.custom;
    case "tidying":
      return facts.overdue;
    case "big-days":
      return facts.bigDayReached;
    case "flow":
    case "long-run":
      return false;
  }
}

/** Flat coin perk of the active companion for one completion (§4.2). */
export function getPerkCoins(style: CompanionStyle | undefined, facts: CompletionFacts): number {
  switch (style) {
    case "getting-started":
      return facts.firstOfDay ? 2 : 0;
    case "focus":
      return facts.timer ? 2 : 0;
    case "routines":
      return facts.recurring ? 2 : 0;
    case "timekeeping":
      return facts.onDueDay ? 3 : 0;
    case "looking-ahead":
      return facts.scheduledAhead ? 2 : 0;
    case "priorities":
      return facts.highPriority ? 3 : 0;
    case "own-tasks":
      return facts.custom ? 2 : 0;
    case "tidying":
      return facts.overdue ? 2 : 0;
    case "big-days":
      return facts.bigDayReached ? 10 : 0;
    default:
      return 0;
  }
}

/** Nova ("long run") raises the streak bonus while active. */
export function getPerkStreakBonus(style: CompanionStyle | undefined): number {
  return style === "long-run" ? 0.1 : 0;
}

export function getBondGain(style: CompanionStyle | undefined, facts: CompletionFacts, usageToday: UsageStats): {
  bond: number;
  countsTowardBaseCap: boolean;
} {
  const base = usageToday.todayBaseBond < DAILY_BASE_BOND_CAP ? 1 : 0;
  const styleBonus = style && matchesStyle(style, facts) ? 1 : 0;
  // Pebble ("showing up") gets an extra point on the first task of an active day.
  const showingUpBonus = style === "showing-up" && facts.firstOfDay ? 1 : 0;
  return { bond: base + styleBonus + showingUpBonus, countsTowardBaseCap: base === 1 };
}

/** Records a completion in the usage counters (call with the pre-completion task). */
export function recordCompletion(usage: UsageStats, facts: CompletionFacts, now: number): UsageStats {
  const today = getStartOfDay(now);
  const newActiveDay = usage.lastActiveDay !== today;
  return {
    ...usage,
    activeDays: usage.activeDays + (newActiveDay ? 1 : 0),
    lastActiveDay: today,
    todayDone: usage.todayDone + 1,
    recurringDone: usage.recurringDone + (facts.recurring ? 1 : 0),
    timersFinished: usage.timersFinished + (facts.timer ? 1 : 0),
    highPriorityDone: usage.highPriorityDone + (facts.highPriority ? 1 : 0),
    overdueCleared: usage.overdueCleared + (facts.overdue ? 1 : 0),
    bigDays: usage.bigDays + (facts.bigDayReached ? 1 : 0),
  };
}

export function recordTaskCreated(usage: UsageStats, task: Task, now: number): UsageStats {
  const weekAhead = getCalendarDayDifference(now, task.dueDate) >= WEEK_AHEAD_DAYS;
  return {
    ...usage,
    customCreated: usage.customCreated + (task.type === TaskType.CUSTOM ? 1 : 0),
    scheduledWeekAhead: usage.scheduledWeekAhead + (weekAhead ? 1 : 0),
  };
}

/** A task edit counts as rescheduling when its due day moves later. */
export function isReschedule(before: Task, after: Task): boolean {
  return getStartOfDay(after.dueDate) > getStartOfDay(before.dueDate);
}

export function recordReschedule(usage: UsageStats, before: Task, after: Task, now: number): UsageStats {
  const weekAhead = getCalendarDayDifference(now, after.dueDate) >= WEEK_AHEAD_DAYS;
  return {
    ...usage,
    rescheduled: usage.rescheduled + 1,
    overdueCleared: usage.overdueCleared + (getStartOfDay(before.dueDate) < getStartOfDay(now) ? 1 : 0),
    scheduledWeekAhead: usage.scheduledWeekAhead + (weekAhead ? 1 : 0),
  };
}

export function recordOverdueDeleted(usage: UsageStats, task: Task, now: number): UsageStats {
  return getStartOfDay(task.dueDate) < getStartOfDay(now)
    ? { ...usage, overdueCleared: usage.overdueCleared + 1 }
    : usage;
}

export type CompanionMood = "hello" | "happy" | "glowing" | "sleepy";

/** Derived from today, never stored and never harmful (§4.3). */
export function getCompanionMood(state: GameState, now: number): CompanionMood {
  const usage = withToday(state.usage, now);
  const today = getStartOfDay(now);
  const dueTodayPending = state.tasks.filter(
    (task) => task.status === TaskStatus.PENDING && getStartOfDay(task.dueDate) <= today,
  ).length;

  if (usage.todayDone >= BIG_DAY_TASKS || (usage.todayDone > 0 && dueTodayPending === 0)) return "glowing";
  if (usage.todayDone > 0) return "happy";
  if (usage.lastActiveDay > 0 && getCalendarDayDifference(usage.lastActiveDay, now) >= 2) return "sleepy";
  return "hello";
}

export function getActiveCompanion(state: GameState): Pet | undefined {
  return state.pets.find((pet) => pet.id === state.equippedPetId);
}

export function getActiveStyle(state: GameState): CompanionStyle | undefined {
  const active = getActiveCompanion(state);
  return active ? getCompanionDefinition(active.templateId)?.style : undefined;
}
