import { GameState, Group, GroupKind, HolderId, Task, TaskStatus, WorkItem } from "../types";
import { getNextAvailableDate } from "./taskSchedule";
import { finishTaskTimer } from "./taskTimer";
import { addDaysToKey } from "./workForm";
import { canCompleteOccurrence, getOccurrencesBetween } from "./workSchedule";

/** How many groups a player can have (a layout limit, free for everyone). */
export const MAX_GROUPS = 10;
export const MAX_GROUP_NAME_LENGTH = 24;

/** The trimmed name, or null when it is empty or too long. */
function validName(name: string): string | null {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= MAX_GROUP_NAME_LENGTH ? trimmed : null;
}

/**
 * Fills "{key}" placeholders in one pass. The replacer is a function, so a name holding "$&" or "$'" (or "{code}")
 * shows as typed instead of being read as a replacement pattern.
 */
export function fillText(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : placeholder,
  );
}

/** What the "Add a group" sheet offers: a new group needs room under the cap; a code can always update a group. */
export function groupAddOptions(groupCount: number): { newGroup: boolean; fromCode: boolean } {
  return { newGroup: groupCount < MAX_GROUPS, fromCode: true };
}

export function isBuiltIn(holder: HolderId): boolean {
  return holder === "personal" || holder === "work";
}

export function createGroup(
  state: GameState,
  fields: { name: string; color: string; kind: GroupKind },
  id: string,
  now: number,
): GameState | { error: "cap" | "name" } {
  if (state.groups.length >= MAX_GROUPS) return { error: "cap" };
  const name = validName(fields.name);
  if (name === null) return { error: "name" };
  const group: Group = { id, name, color: fields.color, kind: fields.kind, createdAt: now, tasks: [], workItems: [] };
  return { ...state, groups: [...state.groups, group] };
}

/** Renames or recolours a group; a blank or too long name is ignored. */
export function updateGroup(state: GameState, id: string, fields: { name?: string; color?: string }): GameState {
  if (!state.groups.some((group) => group.id === id)) return state;
  const name = fields.name === undefined ? null : validName(fields.name);
  return {
    ...state,
    groups: state.groups.map((group) =>
      group.id === id
        ? { ...group, ...(name !== null ? { name } : {}), ...(fields.color !== undefined ? { color: fields.color } : {}) }
        : group,
    ),
  };
}

/** Removes a group with its items, and forgets it in the remembered Tasks section, dashboard and calendar settings. */
export function deleteGroup(state: GameState, id: string): GameState {
  if (!state.groups.some((group) => group.id === id)) return state;
  const { [id]: _removed, ...dashboardCollapsed } = state.settings.dashboardCollapsed;
  return {
    ...state,
    groups: state.groups.filter((group) => group.id !== id),
    settings: {
      ...state.settings,
      tasksSection: state.settings.tasksSection === id ? "choose" : state.settings.tasksSection,
      dashboardCollapsed,
      calendarShow: state.settings.calendarShow.filter((holder) => holder !== id),
    },
  };
}

/** Items in a group; a repeating item counts once. */
export function groupItemCount(group: Group): number {
  return group.kind === "list" ? group.tasks.length : group.workItems.length;
}

function findGroup(state: GameState, holder: HolderId): Group | undefined {
  return state.groups.find((group) => group.id === holder);
}

export function getHolderTasks(state: GameState, holder: HolderId): Task[] {
  if (holder === "personal") return state.tasks;
  return findGroup(state, holder)?.tasks ?? [];
}

export function getHolderWorkItems(state: GameState, holder: HolderId): WorkItem[] {
  if (holder === "work") return state.workItems;
  return findGroup(state, holder)?.workItems ?? [];
}

function updateHolderGroup(state: GameState, holder: HolderId, change: (group: Group) => Group): GameState {
  if (!findGroup(state, holder)) return state;
  return { ...state, groups: state.groups.map((group) => (group.id === holder ? change(group) : group)) };
}

export function setHolderTasks(state: GameState, holder: HolderId, tasks: Task[]): GameState {
  if (holder === "personal") return { ...state, tasks };
  return updateHolderGroup(state, holder, (group) => ({ ...group, tasks }));
}

export function setHolderWorkItems(state: GameState, holder: HolderId, items: WorkItem[]): GameState {
  if (holder === "work") return { ...state, workItems: items };
  return updateHolderGroup(state, holder, (group) => ({ ...group, workItems: items }));
}

/** Ticks off a group task. Unlike completeTask it pays nothing: only the task itself changes. */
export function completeGroupTask(state: GameState, groupId: string, taskId: string, now: number): GameState {
  const task = findGroup(state, groupId)?.tasks.find((candidate) => candidate.id === taskId);
  if (!task || task.status !== TaskStatus.PENDING || task.dueDate > now) return state;
  if (task.timer.enabled && task.timer.state !== "ready") return state;
  const completed = finishTaskTimer({
    ...task,
    status: TaskStatus.COMPLETED,
    dueDate: getNextAvailableDate(task, now),
    completedAt: now,
  });
  return updateHolderGroup(state, groupId, (group) => ({
    ...group,
    tasks: group.tasks.map((candidate) => (candidate.id === taskId ? completed : candidate)),
  }));
}

/** Ticks off one occurrence of a group schedule item, with the same window as Work and no rewards. */
export function completeGroupOccurrence(
  state: GameState,
  groupId: string,
  itemId: string,
  dateKey: string,
  now: number,
): GameState {
  const item = findGroup(state, groupId)?.workItems.find((candidate) => candidate.id === itemId);
  if (!item) return state;
  const occurrence = getOccurrencesBetween([item], dateKey, addDaysToKey(dateKey, 1)).find(
    (candidate) => candidate.dateKey === dateKey,
  );
  if (!occurrence || !canCompleteOccurrence(occurrence, now)) return state;
  return updateHolderGroup(state, groupId, (group) => ({
    ...group,
    workItems: group.workItems.map((candidate) =>
      candidate.id === itemId ? { ...candidate, completedDateKeys: [...candidate.completedDateKeys, dateKey] } : candidate,
    ),
  }));
}
