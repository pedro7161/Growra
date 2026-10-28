import { DEFAULT_TASK_CALENDAR_COLOR } from "../constants/taskConfig";
import {
  GameState,
  Group,
  GroupKind,
  HolderId,
  Task,
  TaskFrequency,
  TaskPriority,
  TaskStatus,
  TaskType,
  WorkEnd,
  WorkException,
  WorkItem,
  WorkRepeat,
} from "../types";
import { MAX_GROUPS, MAX_GROUP_NAME_LENGTH, createGroup } from "./groups";
import { ShareCodeError, decodeShareCode, encodeShareCode } from "./shareCode";
import { getStartOfDay } from "./taskSchedule";
import { createTaskTimer } from "./taskTimer";

/**
 * Sharing a group, Personal or Work by code (spec section 9): copy-only, no server. The code holds the items' own
 * fields only. Ids, linkId, completions, timer progress, due dates and anything from game state never go in.
 *
 * Payload (JSON, then the shared envelope of shareCode.ts):
 *   [sourceId, name, color, "l" | "s", items]
 *   task: { n: name, d?: description, c?: category tag, f?: "d" | "w" (once if absent), p?: "l" | "h" (medium if
 *           absent), k?: calendarColor (default if absent), m?: durationMinutes, t?: [timer on 1|0, timer ms] }
 *   work item: { n: name, d?: description, k?: calendarColor, s: startMinutes, e: endMinutes, a: startDateKey,
 *           r?: ["d", n] | ["w", n, weekdays] | ["m", n] (none if absent), z?: ["c", count] | ["u", dateKey]
 *           (never if absent), x?: { dateKey: 0 (skip) | { n?, d?, s?, e? } (change) } }
 * Decoding never throws. A broken header (source, name, 6-digit hex colour, kind, item list) makes the whole code a
 * "format" error; inside a good header, an item with any invalid field (blank name, minutes or lengths out of range,
 * unknown code...) is dropped and the other items are kept. A bad item colour becomes the default colour. Names are
 * cut to 80 characters, descriptions to 500; only the first 500 items and 400 exceptions per item are read. The
 * share builder applies the same limits, so what is sent is what arrives.
 */
export const GROUP_CODE_VERSION = 1;
const PREFIX = "GROWRA-GROUP-";

/** Limits that keep imported data within what the UI can show; longer texts are cut, extra entries dropped. */
const MAX_ITEMS = 500;
const MAX_EXCEPTIONS = 400;
const MAX_ITEM_NAME_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 500;
const MINUTES_IN_DAY = 1440;
const MAX_TIMER_MS = MINUTES_IN_DAY * 60_000;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const isHexColor = (value: unknown): value is string => typeof value === "string" && HEX_COLOR.test(value);
/** An item colour that is not a 6-digit hex colour becomes the default one. */
const itemColor = (value: unknown) => (isHexColor(value) ? value : DEFAULT_TASK_CALENDAR_COLOR);
const clipName = (name: string) => name.slice(0, MAX_ITEM_NAME_LENGTH);
const clipDescription = (description: string) => description.slice(0, MAX_DESCRIPTION_LENGTH);

export interface GroupShare {
  sourceId: string;
  name: string;
  color: string;
  kind: GroupKind;
  tasks: Task[];
  workItems: WorkItem[];
}

export type GroupCodeError = ShareCodeError;

type ShareTaskFields = Pick<Task, "name" | "description" | "category" | "frequency" | "priority" | "calendarColor"> & {
  durationMinutes?: number;
  timerEnabled: boolean;
  timerDuration: number;
};

/** A task as it travels in a share: its own fields only, with no id, progress or link. */
function shareTask(fields: ShareTaskFields): Task {
  return {
    id: "",
    name: fields.name,
    description: fields.description,
    predefinedTaskId: "",
    customTemplateId: "",
    category: fields.category,
    type: TaskType.CUSTOM,
    frequency: fields.frequency,
    priority: fields.priority,
    calendarColor: fields.calendarColor,
    status: TaskStatus.PENDING,
    dueDate: 0,
    createdAt: 0,
    timer: createTaskTimer(fields.timerDuration, fields.timerEnabled),
    ...(fields.durationMinutes ? { durationMinutes: fields.durationMinutes } : {}),
  };
}

type ShareWorkFields = Omit<WorkItem, "id" | "completedDateKeys" | "createdAt" | "linkId">;

function shareWorkItem(fields: ShareWorkFields): WorkItem {
  return { id: "", ...fields, completedDateKeys: [], createdAt: 0 };
}

/** Only the defined fields of a change (texts within the limits), so a decoded change equals the shared one. */
function cleanException(exception: WorkException): WorkException {
  if (exception.kind === "skip") return { kind: "skip" };
  const change: WorkException = { kind: "change" };
  if (exception.name !== undefined) change.name = clipName(exception.name);
  if (exception.description !== undefined) change.description = clipDescription(exception.description);
  if (exception.startMinutes !== undefined) change.startMinutes = exception.startMinutes;
  if (exception.endMinutes !== undefined) change.endMinutes = exception.endMinutes;
  return change;
}

function cleanRepeat(repeat: WorkRepeat): WorkRepeat {
  return repeat.kind === "weeks" ? { ...repeat, weekdays: [...repeat.weekdays] } : { ...repeat };
}

/** The task's own fields within the code's limits, so what is shared is exactly what a decode gives back. */
function taskForShare(task: Task): Task {
  return shareTask({
    name: clipName(task.name),
    description: clipDescription(task.description),
    category: task.category,
    frequency: task.frequency,
    priority: task.priority,
    calendarColor: itemColor(task.calendarColor),
    durationMinutes: task.durationMinutes ? Math.min(task.durationMinutes, MINUTES_IN_DAY) : undefined,
    timerEnabled: task.timer.enabled,
    timerDuration: Math.min(task.timer.duration, MAX_TIMER_MS),
  });
}

function workItemForShare(item: WorkItem): WorkItem {
  return shareWorkItem({
    name: clipName(item.name),
    description: clipDescription(item.description),
    calendarColor: itemColor(item.calendarColor),
    startMinutes: item.startMinutes,
    endMinutes: item.endMinutes,
    startDateKey: item.startDateKey,
    repeat: cleanRepeat(item.repeat),
    end: { ...item.end },
    exceptions: Object.fromEntries(
      Object.entries(item.exceptions)
        .slice(0, MAX_EXCEPTIONS)
        .map(([key, value]) => [key, cleanException(value)]),
    ),
  });
}

/** A one-time task that is already done is history, not part of the list, so it is not shared. */
const isFinishedOnce = (task: Task) => task.frequency === TaskFrequency.ONCE && task.status === TaskStatus.COMPLETED;

/**
 * What sharing `holder` sends. Personal and Work take `builtInName` (the localised name the caller shows) and a
 * source id that is stable per player; a group sends its own name and colour, and keeps the source id it was
 * imported with so codes passed on still update the same copies. An unknown holder gives an empty list.
 */
export function buildGroupShare(state: GameState, holder: HolderId, builtInName?: string): GroupShare {
  const tasks = (list: Task[]) => list.filter((task) => !isFinishedOnce(task)).slice(0, MAX_ITEMS).map(taskForShare);
  const workItems = (list: WorkItem[]) => list.slice(0, MAX_ITEMS).map(workItemForShare);
  if (holder === "personal" || holder === "work") {
    const isWork = holder === "work";
    return {
      sourceId: `${state.playerId}:${holder}`,
      name: builtInName ?? holder,
      color: DEFAULT_TASK_CALENDAR_COLOR,
      kind: isWork ? "schedule" : "list",
      tasks: isWork ? [] : tasks(state.tasks),
      workItems: isWork ? workItems(state.workItems) : [],
    };
  }
  const group = state.groups.find((candidate) => candidate.id === holder);
  if (!group) return { sourceId: holder, name: builtInName ?? holder, color: DEFAULT_TASK_CALENDAR_COLOR, kind: "list", tasks: [], workItems: [] };
  return {
    sourceId: group.sourceId ?? group.id,
    name: group.name,
    color: isHexColor(group.color) ? group.color : DEFAULT_TASK_CALENDAR_COLOR,
    kind: group.kind,
    tasks: group.kind === "list" ? tasks(group.tasks) : [],
    workItems: group.kind === "schedule" ? workItems(group.workItems) : [],
  };
}

const FREQUENCY_CODES: Record<string, TaskFrequency> = { d: TaskFrequency.DAILY, w: TaskFrequency.WEEKLY };
const PRIORITY_CODES: Record<string, TaskPriority> = { l: TaskPriority.LOW, h: TaskPriority.HIGH };
const codeOf = <T>(codes: Record<string, T>, value: T) => Object.keys(codes).find((key) => codes[key] === value);

type Packed = Record<string, unknown>;

/** Sets `key` only when the value is not the default, keeping codes short. */
function put(target: Packed, key: string, value: unknown, fallback?: unknown) {
  if (value !== undefined && value !== fallback) target[key] = value;
}

function packTask(task: Task): Packed {
  const packed: Packed = { n: task.name };
  put(packed, "d", task.description, "");
  put(packed, "c", task.category, "");
  put(packed, "f", codeOf(FREQUENCY_CODES, task.frequency));
  put(packed, "p", codeOf(PRIORITY_CODES, task.priority));
  put(packed, "k", task.calendarColor, DEFAULT_TASK_CALENDAR_COLOR);
  if (task.durationMinutes) packed.m = task.durationMinutes;
  if (task.timer.enabled || task.timer.duration > 0) packed.t = [task.timer.enabled ? 1 : 0, task.timer.duration];
  return packed;
}

function packRepeat(repeat: WorkRepeat): unknown[] | undefined {
  if (repeat.kind === "days") return ["d", repeat.interval];
  if (repeat.kind === "weeks") return ["w", repeat.interval, repeat.weekdays];
  if (repeat.kind === "months") return ["m", repeat.interval];
  return undefined;
}

function packEnd(end: WorkEnd): unknown[] | undefined {
  if (end.kind === "count") return ["c", end.count];
  if (end.kind === "until") return ["u", end.dateKey];
  return undefined;
}

function packException(exception: WorkException): unknown {
  if (exception.kind === "skip") return 0;
  const packed: Packed = {};
  put(packed, "n", exception.name);
  put(packed, "d", exception.description);
  put(packed, "s", exception.startMinutes);
  put(packed, "e", exception.endMinutes);
  return packed;
}

function packWorkItem(item: WorkItem): Packed {
  const packed: Packed = { n: item.name };
  put(packed, "d", item.description, "");
  put(packed, "k", item.calendarColor, DEFAULT_TASK_CALENDAR_COLOR);
  packed.s = item.startMinutes;
  packed.e = item.endMinutes;
  packed.a = item.startDateKey;
  put(packed, "r", packRepeat(item.repeat));
  put(packed, "z", packEnd(item.end));
  const exceptions = Object.entries(item.exceptions);
  if (exceptions.length > 0) packed.x = Object.fromEntries(exceptions.map(([key, value]) => [key, packException(value)]));
  return packed;
}

export function encodeGroupCode(share: GroupShare): string {
  const items = share.kind === "list" ? share.tasks.map(packTask) : share.workItems.map(packWorkItem);
  const payload = JSON.stringify([share.sourceId, share.name, share.color, share.kind === "list" ? "l" : "s", items]);
  return encodeShareCode(PREFIX, GROUP_CODE_VERSION, payload);
}

/** Thrown inside the decoder for an invalid field; caught per item, never escapes. */
class InvalidField extends Error {}

const isRecord = (value: unknown): value is Packed => typeof value === "object" && value !== null && !Array.isArray(value);
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
function text(value: unknown, fallback?: string): string {
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value !== "string") throw new InvalidField();
  return value;
}

function integer(value: unknown, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) throw new InvalidField();
  return value;
}

/** Any finite number in `min..max` (lengths and timer durations need not be whole). */
function amount(value: unknown, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) throw new InvalidField();
  return value;
}

/** An item name: a non-blank string, cut to the length limit. */
function itemName(value: unknown): string {
  const name = text(value);
  if (name.trim() === "") throw new InvalidField();
  return clipName(name);
}

const minutes = (value: unknown) => integer(value, 0, MINUTES_IN_DAY);
const positive = (value: unknown) => integer(value, 1, Number.MAX_SAFE_INTEGER);

function dateKey(value: unknown): string {
  const key = text(value);
  if (!DATE_KEY.test(key)) throw new InvalidField();
  return key;
}

function coded<T>(codes: Record<string, T>, value: unknown, fallback: T): T {
  if (value === undefined) return fallback;
  // Own keys only: "constructor" or "toString" must not reach Object.prototype.
  if (typeof value !== "string" || !Object.prototype.hasOwnProperty.call(codes, value)) throw new InvalidField();
  return codes[value];
}

function unpackTask(raw: unknown): Task {
  if (!isRecord(raw)) throw new InvalidField();
  let timerEnabled = false;
  let timerDuration = 0;
  if (raw.t !== undefined) {
    if (!Array.isArray(raw.t) || (raw.t[0] !== 0 && raw.t[0] !== 1)) throw new InvalidField();
    timerEnabled = raw.t[0] === 1;
    timerDuration = amount(raw.t[1], 0, MAX_TIMER_MS);
  }
  return shareTask({
    name: itemName(raw.n),
    description: clipDescription(text(raw.d, "")),
    category: text(raw.c, ""),
    frequency: coded(FREQUENCY_CODES, raw.f, TaskFrequency.ONCE),
    priority: coded(PRIORITY_CODES, raw.p, TaskPriority.MEDIUM),
    calendarColor: itemColor(raw.k),
    durationMinutes: raw.m === undefined ? undefined : amount(raw.m, Number.MIN_VALUE, MINUTES_IN_DAY),
    timerEnabled,
    timerDuration,
  });
}

function unpackRepeat(raw: unknown): WorkRepeat {
  if (raw === undefined) return { kind: "none" };
  if (!Array.isArray(raw)) throw new InvalidField();
  const interval = positive(raw[1]);
  if (raw[0] === "d") return { kind: "days", interval };
  if (raw[0] === "m") return { kind: "months", interval };
  if (raw[0] === "w" && Array.isArray(raw[2])) {
    return { kind: "weeks", interval, weekdays: raw[2].map((day) => integer(day, 0, 6)) };
  }
  throw new InvalidField();
}

function unpackEnd(raw: unknown): WorkEnd {
  if (raw === undefined) return { kind: "never" };
  if (!Array.isArray(raw)) throw new InvalidField();
  if (raw[0] === "c") return { kind: "count", count: positive(raw[1]) };
  if (raw[0] === "u") return { kind: "until", dateKey: dateKey(raw[1]) };
  throw new InvalidField();
}

function unpackException(raw: unknown): WorkException {
  if (raw === 0) return { kind: "skip" };
  if (!isRecord(raw)) throw new InvalidField();
  const change: WorkException = { kind: "change" };
  if (raw.n !== undefined) change.name = clipName(text(raw.n));
  if (raw.d !== undefined) change.description = clipDescription(text(raw.d));
  if (raw.s !== undefined) change.startMinutes = minutes(raw.s);
  if (raw.e !== undefined) change.endMinutes = minutes(raw.e);
  return change;
}

function unpackWorkItem(raw: unknown): WorkItem {
  if (!isRecord(raw)) throw new InvalidField();
  if (raw.x !== undefined && !isRecord(raw.x)) throw new InvalidField();
  const exceptions = Object.entries(raw.x ?? {})
    .slice(0, MAX_EXCEPTIONS)
    .map(([key, value]) => [dateKey(key), unpackException(value)]);
  return shareWorkItem({
    name: itemName(raw.n),
    description: clipDescription(text(raw.d, "")),
    calendarColor: itemColor(raw.k),
    startMinutes: minutes(raw.s),
    endMinutes: minutes(raw.e),
    startDateKey: dateKey(raw.a),
    repeat: unpackRepeat(raw.r),
    end: unpackEnd(raw.z),
    exceptions: Object.fromEntries(exceptions),
  });
}

/** The valid items among the first MAX_ITEMS; an item with any invalid field is left out. */
function unpackAll<T>(rawItems: unknown[], unpack: (raw: unknown) => T): T[] {
  const items: T[] = [];
  for (const raw of rawItems.slice(0, MAX_ITEMS)) {
    try {
      items.push(unpack(raw));
    } catch (error) {
      if (!(error instanceof InvalidField)) throw error;
    }
  }
  return items;
}

function parseJson(payload: string): unknown {
  try {
    return JSON.parse(payload);
  } catch {
    return undefined;
  }
}

/** Reads a pasted code (spaces and line breaks around it are fine). Never throws; nothing is changed on an error. */
export function decodeGroupCode(code: string): { share: GroupShare } | { error: GroupCodeError } {
  const decoded = decodeShareCode(code, PREFIX, GROUP_CODE_VERSION);
  if ("error" in decoded) return decoded;
  const parsed = parseJson(decoded.payload);
  if (!Array.isArray(parsed)) return { error: "format" };
  const [sourceId, rawName, color, kindCode, rawItems] = parsed as unknown[];
  const name = typeof rawName === "string" ? rawName.trim().slice(0, MAX_GROUP_NAME_LENGTH) : "";
  if (typeof sourceId !== "string" || sourceId === "" || name === "" || !isHexColor(color)) {
    return { error: "format" };
  }
  if ((kindCode !== "l" && kindCode !== "s") || !Array.isArray(rawItems)) return { error: "format" };
  const kind: GroupKind = kindCode === "l" ? "list" : "schedule";
  return {
    share: {
      sourceId,
      name,
      color,
      kind,
      tasks: kind === "list" ? unpackAll(rawItems, unpackTask) : [],
      workItems: kind === "schedule" ? unpackAll(rawItems, unpackWorkItem) : [],
    },
  };
}

/** What the share step shows before sending (e.g. "12 tasks from Personal"). */
export function shareSummary(share: GroupShare): { count: number; kind: GroupKind } {
  return { count: share.kind === "list" ? share.tasks.length : share.workItems.length, kind: share.kind };
}

/** The group already imported from this source, if any (so the import can offer "Update <name>?"). */
export function findImportedGroup(state: GameState, sourceId: string): Group | undefined {
  return state.groups.find((group) => group.sourceId === sourceId);
}

/** The shared items as fresh local items: new ids, nothing ticked, tasks due from today. */
function freshItems(share: GroupShare, now: number, newId: () => string): Pick<Group, "tasks" | "workItems"> {
  const today = getStartOfDay(now);
  return {
    tasks: share.tasks.map((task) => ({
      ...taskForShare(task),
      id: newId(),
      dueDate: today,
      createdAt: now,
    })),
    workItems: share.workItems.map((item) => ({ ...workItemForShare(item), id: newId(), createdAt: now })),
  };
}

/**
 * Adds a shared code as a group; the player's own Personal and Work are never touched. "new" makes a new group
 * (the cap applies). "update" replaces the items of the group imported from the same source and keeps its name,
 * colour and settings; with no such group of the same kind it makes a new one instead.
 */
export function importGroupCode(
  state: GameState,
  share: GroupShare,
  now: number,
  newId: () => string,
  mode: "new" | "update",
): GameState | { error: "cap" } {
  const existing = mode === "update" ? findImportedGroup(state, share.sourceId) : undefined;
  if (existing && existing.kind === share.kind) {
    const items = freshItems(share, now, newId);
    const replaced: Group =
      existing.kind === "list" ? { ...existing, tasks: items.tasks } : { ...existing, workItems: items.workItems };
    return { ...state, groups: state.groups.map((group) => (group === existing ? replaced : group)) };
  }
  if (state.groups.length >= MAX_GROUPS) return { error: "cap" };
  const id = newId();
  const name = share.name.trim().slice(0, MAX_GROUP_NAME_LENGTH);
  const created = createGroup(state, { name, color: share.color, kind: share.kind }, id, now);
  // Only a hand-made share with a blank name gets here (decoded shares always have a name): nothing changes.
  if ("error" in created) return created.error === "cap" ? { error: "cap" } : state;
  const items = freshItems(share, now, newId);
  return {
    ...created,
    groups: created.groups.map((group) =>
      group.id === id
        ? { ...group, sourceId: share.sourceId, ...(share.kind === "list" ? { tasks: items.tasks } : { workItems: items.workItems }) }
        : group,
    ),
  };
}
