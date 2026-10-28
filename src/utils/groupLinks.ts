import { GameState, Group, GroupKind, HolderId, Task, WorkEditScope, WorkItem } from "../types";
import { getHolderTasks, getHolderWorkItems, setHolderTasks, setHolderWorkItems } from "./groups";
import { createTaskTimer, updateTaskTimerDuration } from "./taskTimer";
import { addDaysToKey } from "./workForm";
import { deleteOccurrence, editOccurrence, getOccurrencesBetween } from "./workSchedule";

/**
 * Linked copies: one item added to several holders at once (spec section 11). Every copy is a plain duplicate that
 * shares a hidden `linkId`; edits and deletes can then be applied to chosen copies. This module only moves data:
 * which copy pays is decided elsewhere (only the built-in Personal/Work copy ever does).
 */

type WorkChange = Parameters<typeof editOccurrence>[3];

/** The groups of the given kind that can take a copy (the "Also add to…" row), without the holder it is made in. */
export function linkTargets(state: GameState, kind: GroupKind, exclude: HolderId): Group[] {
  return state.groups.filter((group) => group.kind === kind && group.id !== exclude);
}

function holdsTasks(state: GameState, holder: HolderId): boolean {
  return holder === "personal" || state.groups.some((group) => group.id === holder && group.kind === "list");
}

function holdsWorkItems(state: GameState, holder: HolderId): boolean {
  return holder === "work" || state.groups.some((group) => group.id === holder && group.kind === "schedule");
}

/** The chosen target groups that exist, match the kind and are not the holder itself, each once. */
function validTargets(state: GameState, kind: GroupKind, holder: HolderId, targetGroupIds: string[]): string[] {
  const allowed = new Set(linkTargets(state, kind, holder).map((group) => group.id));
  return [...new Set(targetGroupIds)].filter((id) => allowed.has(id));
}

/**
 * Adds the task to `holder` and a copy to each chosen List group, all sharing one fresh linkId. Copies get new ids
 * and no completion. With no valid target the task is added on its own, unlinked.
 */
export function addTaskWithCopies(
  state: GameState,
  holder: HolderId,
  task: Task,
  targetGroupIds: string[],
  newId: () => string,
): GameState {
  if (!holdsTasks(state, holder)) return state;
  const targets = validTargets(state, "list", holder, targetGroupIds);
  const original: Task = targets.length > 0 ? { ...task, linkId: newId() } : task;
  let next = setHolderTasks(state, holder, [...getHolderTasks(state, holder), original]);
  const { completedAt: _completedAt, ...uncompleted } = original;
  for (const target of targets) {
    const copy: Task = { ...uncompleted, id: newId() };
    next = setHolderTasks(next, target, [...getHolderTasks(next, target), copy]);
  }
  return next;
}

/** Same as addTaskWithCopies for a Work/schedule item; copies start with no ticked-off dates. */
export function addWorkItemWithCopies(
  state: GameState,
  holder: HolderId,
  item: WorkItem,
  targetGroupIds: string[],
  newId: () => string,
): GameState {
  if (!holdsWorkItems(state, holder)) return state;
  const targets = validTargets(state, "schedule", holder, targetGroupIds);
  const original: WorkItem = targets.length > 0 ? { ...item, linkId: newId() } : item;
  let next = setHolderWorkItems(state, holder, [...getHolderWorkItems(state, holder), original]);
  for (const target of targets) {
    const copy: WorkItem = { ...original, id: newId(), completedDateKeys: [] };
    next = setHolderWorkItems(next, target, [...getHolderWorkItems(next, target), copy]);
  }
  return next;
}

function allHolders(state: GameState): HolderId[] {
  return ["personal", "work", ...state.groups.map((group) => group.id)];
}

/** Every item carrying this linkId, in Personal, Work, then group order. */
export function linkedHolders(state: GameState, linkId: string): { holder: HolderId; id: string }[] {
  return allHolders(state).flatMap((holder) =>
    [...getHolderTasks(state, holder), ...getHolderWorkItems(state, holder)]
      .filter((item) => item.linkId === linkId)
      .map((item) => ({ holder, id: item.id })),
  );
}

/** Runs `change` on the tasks of each chosen holder; keeps the same state when no task changed. */
function updateTasks(state: GameState, holders: HolderId[], change: (tasks: Task[]) => Task[]): GameState {
  let next = state;
  for (const holder of new Set(holders)) {
    const tasks = getHolderTasks(next, holder);
    const updated = change(tasks);
    const changed = updated.length !== tasks.length || updated.some((task, index) => task !== tasks[index]);
    if (changed) next = setHolderTasks(next, holder, updated);
  }
  return next;
}

function updateWorkItems(state: GameState, holders: HolderId[], change: (items: WorkItem[]) => WorkItem[]): GameState {
  let next = state;
  for (const holder of new Set(holders)) {
    const items = getHolderWorkItems(next, holder);
    const updated = change(items);
    const changed = updated.length !== items.length || updated.some((item, index) => item !== items[index]);
    if (changed) next = setHolderWorkItems(next, holder, updated);
  }
  return next;
}

/**
 * The fields a linked task edit copies to the other copies, when present in the change. Everything else (id,
 * linkId, createdAt) always stays each copy's own. status, dueDate and completedAt are each copy's own progress:
 * they only travel when the caller puts them in the change on purpose. The timer is handled by `linkedTimer`.
 */
const LINKED_TASK_FIELDS = [
  "name",
  "description",
  "category",
  "type",
  "predefinedTaskId",
  "customTemplateId",
  "frequency",
  "priority",
  "calendarColor",
  "durationMinutes",
  "status",
  "dueDate",
  "completedAt",
] as const satisfies readonly (keyof Task)[];

/** Fields that may be cleared by giving them as undefined; the others need a value. */
const CLEARABLE_TASK_FIELDS = new Set<keyof Task>(["durationMinutes", "completedAt"]);

/** The copy's timer with only the timer settings (on/off, duration) taken over; a running copy keeps running. */
function linkedTimer(task: Task, settings: Task["timer"]): Task["timer"] {
  if (settings.enabled !== task.timer.enabled) return createTaskTimer(settings.duration, settings.enabled);
  if (settings.duration === task.timer.duration) return task.timer;
  if (!settings.enabled) return createTaskTimer(settings.duration, false);
  return updateTaskTimerDuration(task, settings.duration).timer;
}

/** Copies one field from the change onto the task; false when there is nothing to copy. */
function copyField<K extends keyof Task>(task: Task, change: Partial<Task>, field: K): boolean {
  if (!(field in change)) return false;
  const value = change[field];
  if (value === undefined && !CLEARABLE_TASK_FIELDS.has(field)) return false;
  if (task[field] === value) return false;
  task[field] = value as Task[K];
  return true;
}

function applyTaskChange(task: Task, change: Partial<Task>): Task {
  const next: Task = { ...task };
  let changed = false;
  for (const field of LINKED_TASK_FIELDS) changed = copyField(next, change, field) || changed;
  if (change.timer) {
    const timer = linkedTimer(task, change.timer);
    if (timer !== task.timer) {
      next.timer = timer;
      changed = true;
    }
  }
  return changed ? next : task;
}

/** Applies a task edit to the linked copy in each chosen holder (see LINKED_TASK_FIELDS for what travels). */
export function applyLinkedTaskEdit(
  state: GameState,
  linkId: string,
  holders: HolderId[],
  change: Partial<Task>,
): GameState {
  return updateTasks(state, holders, (tasks) =>
    tasks.map((task) => (task.linkId === linkId ? applyTaskChange(task, change) : task)),
  );
}

/** Removes the linked copy from each chosen holder; the other copies stay. */
export function applyLinkedTaskDelete(state: GameState, linkId: string, holders: HolderId[]): GameState {
  return updateTasks(state, holders, (tasks) => tasks.filter((task) => task.linkId !== linkId));
}

/** True when the item's own rule produces `dateKey` (skipped dates included). */
function hasSeriesDate(item: WorkItem, dateKey: string): boolean {
  return getOccurrencesBetween([{ ...item, exceptions: {} }], dateKey, addDaysToKey(dateKey, 1)).length > 0;
}

/**
 * The linked items of a holder that the edit of `dateKey` should reach: those whose own series has that date.
 * A one-day change leaves a copy alone when that copy skips the date itself.
 */
function reaches(item: WorkItem, linkId: string, dateKey: string, skipKeepsCopy: boolean): boolean {
  if (item.linkId !== linkId || !hasSeriesDate(item, dateKey)) return false;
  return !(skipKeepsCopy && item.exceptions[dateKey]?.kind === "skip");
}

/**
 * Runs editOccurrence on each chosen holder's own linked item, so its own exceptions are respected. A "following"
 * split ends the old items (they keep the old linkId, so later edits of past dates still reach them) and gives
 * every continued item one shared new linkId.
 */
export function applyLinkedOccurrenceEdit(
  state: GameState,
  linkId: string,
  holders: HolderId[],
  dateKey: string,
  change: WorkChange,
  scope: WorkEditScope,
  newId: () => string,
): GameState {
  let continuedLinkId: string | undefined;
  const sharedLinkId = () => (continuedLinkId ??= newId());
  return updateWorkItems(state, holders, (items) => {
    const targets = items.filter((item) => reaches(item, linkId, dateKey, scope === "one"));
    if (targets.length === 0) return items;
    const before = new Set(items.map((item) => item.id));
    let next = items;
    for (const target of targets) next = editOccurrence(next, target.id, dateKey, change, scope, newId);
    return next.map((item) => (before.has(item.id) ? item : { ...item, linkId: sharedLinkId() }));
  });
}

/**
 * The linked items a delete of `dateKey` should reach. A one-off copy is the same single event even when it was
 * moved to another date, so it is matched by linkId alone; a "following" delete also takes a copy whose series only
 * starts on or after that date. Otherwise as for edits (a "one" delete leaves a copy that skips the date alone).
 */
function reachesDelete(item: WorkItem, linkId: string, dateKey: string, scope: WorkEditScope): boolean {
  if (item.linkId !== linkId) return false;
  if (item.repeat.kind === "none") return true;
  if (scope === "following" && item.startDateKey >= dateKey) return true;
  return reaches(item, linkId, dateKey, scope === "one");
}

/** Runs deleteOccurrence on each chosen holder's own linked item ("one": skip that date; "following": end there). */
export function applyLinkedOccurrenceDelete(
  state: GameState,
  linkId: string,
  holders: HolderId[],
  dateKey: string,
  scope: WorkEditScope,
): GameState {
  return updateWorkItems(state, holders, (items) => {
    const targets = items.filter((item) => reachesDelete(item, linkId, dateKey, scope));
    let next = items;
    for (const target of targets) next = deleteOccurrence(next, target.id, dateKey, scope);
    return next;
  });
}

/** Makes one copy independent: it loses its linkId; the other copies stay linked to each other. */
export function unlink(state: GameState, holder: HolderId, id: string): GameState {
  const strip = <T extends { id: string; linkId?: string }>(item: T): T => {
    if (item.id !== id || item.linkId === undefined) return item;
    const { linkId: _linkId, ...rest } = item;
    return rest as T;
  };
  return updateWorkItems(updateTasks(state, [holder], (tasks) => tasks.map(strip)), [holder], (items) =>
    items.map(strip),
  );
}
