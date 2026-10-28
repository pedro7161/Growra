// The work-item form's draft (what the user is typing) and its conversion to and from WorkItem fields,
// plus the small date-key helpers the Work screen's day and week views need. Pure functions only.
import { DEFAULT_TASK_CALENDAR_COLOR } from "../constants/taskConfig";
import { WorkEnd, WorkItem, WorkOccurrence, WorkRepeat } from "../types";
import { dateKeyToStart, toDateKey } from "./workSchedule";

export type WorkItemFields = Omit<WorkItem, "id" | "exceptions" | "completedDateKeys" | "createdAt">;

export type RepeatChoice = "none" | "daily" | "xdays" | "weekly" | "xweeks" | "monthly";
export type EndChoice = "never" | "count" | "until";

export interface WorkDraft {
  name: string;
  description: string;
  calendarColor: string;
  startText: string;
  endText: string;
  repeatChoice: RepeatChoice;
  intervalText: string;
  weekdays: number[]; // 0=Sun..6=Sat
  endChoice: EndChoice;
  countText: string;
  untilDateKey: string;
  startDateKey: string;
}

export type WorkDraftError = "workFormNameMissing" | "workFormTimeInvalid" | "workFormNumberInvalid" | "workFormUntilInvalid";

const pad = (n: number) => String(n).padStart(2, "0");

const minutesOf = (ts: number) => new Date(ts).getHours() * 60 + new Date(ts).getMinutes();

/** Monday-first weekday order (Portugal). */
export const WEEKDAYS_MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0];

export function addDaysToKey(key: string, days: number): string {
  const date = new Date(dateKeyToStart(key));
  return toDateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days).getTime());
}

/** The Monday on or before the given date. */
export function weekStartKey(key: string): string {
  const weekday = new Date(dateKeyToStart(key)).getDay();
  return addDaysToKey(key, -((weekday + 6) % 7));
}

export const formatMinutes = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

/** Minutes from midnight for "7", "07:30", "0730" or "7.30"; null when it isn't a real time of day. */
export function parseClock(text: string): number | null {
  const match = text.trim().match(/^(\d{1,2})(?:[:.h]?(\d{2}))?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

const parseCount = (text: string): number | null => {
  const value = Number(text.trim());
  return Number.isInteger(value) && value >= 1 ? value : null;
};

export function newWorkDraft(startDateKey: string): WorkDraft {
  return {
    name: "",
    description: "",
    calendarColor: DEFAULT_TASK_CALENDAR_COLOR,
    startText: "09:00",
    endText: "17:00",
    repeatChoice: "none",
    intervalText: "2",
    weekdays: [new Date(dateKeyToStart(startDateKey)).getDay()],
    endChoice: "never",
    countText: "10",
    untilDateKey: addDaysToKey(startDateKey, 30),
    startDateKey,
  };
}

function repeatChoiceOf(repeat: WorkRepeat): RepeatChoice {
  if (repeat.kind === "days") return repeat.interval > 1 ? "xdays" : "daily";
  if (repeat.kind === "weeks") return repeat.interval > 1 ? "xweeks" : "weekly";
  if (repeat.kind === "months") return "monthly";
  return "none";
}

/** A draft of an existing item; the occurrence (when given) supplies that date's own name, notes and times. */
export function draftFromItem(item: WorkItem, occurrence?: WorkOccurrence): WorkDraft {
  const base = newWorkDraft(item.startDateKey);
  const startMinutes = occurrence ? minutesOf(occurrence.start) : item.startMinutes;
  const endMinutes = occurrence ? minutesOf(occurrence.end) : item.endMinutes;
  const repeat = item.repeat;
  return {
    ...base,
    name: occurrence?.name ?? item.name,
    description: occurrence?.description ?? item.description,
    calendarColor: item.calendarColor,
    startText: formatMinutes(startMinutes),
    endText: formatMinutes(endMinutes),
    repeatChoice: repeatChoiceOf(repeat),
    intervalText: repeat.kind === "none" || repeat.interval <= 1 ? base.intervalText : String(repeat.interval),
    weekdays: repeat.kind === "weeks" && repeat.weekdays.length > 0 ? repeat.weekdays : base.weekdays,
    endChoice: item.end.kind,
    countText: item.end.kind === "count" ? String(item.end.count) : base.countText,
    untilDateKey: item.end.kind === "until" ? item.end.dateKey : base.untilDateKey,
  };
}

/** The draft as WorkItem fields, or the copy key of the first problem in it. */
export function draftToFields(draft: WorkDraft): { fields: WorkItemFields } | { error: WorkDraftError } {
  const name = draft.name.trim();
  if (!name) return { error: "workFormNameMissing" };
  const startMinutes = parseClock(draft.startText);
  const endMinutes = parseClock(draft.endText);
  if (startMinutes === null || endMinutes === null) return { error: "workFormTimeInvalid" };

  const interval = draft.repeatChoice === "xdays" || draft.repeatChoice === "xweeks" ? parseCount(draft.intervalText) : 1;
  if (interval === null) return { error: "workFormNumberInvalid" };
  const chosenDays = draft.weekdays.length > 0 ? draft.weekdays : [new Date(dateKeyToStart(draft.startDateKey)).getDay()];
  const weekdays = [...new Set(chosenDays)].sort((a, b) => a - b);
  const repeat: WorkRepeat =
    draft.repeatChoice === "none"
      ? { kind: "none" }
      : draft.repeatChoice === "daily" || draft.repeatChoice === "xdays"
        ? { kind: "days", interval }
        : draft.repeatChoice === "monthly"
          ? { kind: "months", interval: 1 }
          : { kind: "weeks", interval, weekdays };

  let end: WorkEnd = { kind: "never" };
  if (repeat.kind !== "none" && draft.endChoice === "count") {
    const count = parseCount(draft.countText);
    if (count === null) return { error: "workFormNumberInvalid" };
    end = { kind: "count", count };
  } else if (repeat.kind !== "none" && draft.endChoice === "until") {
    if (draft.untilDateKey < draft.startDateKey) return { error: "workFormUntilInvalid" };
    end = { kind: "until", dateKey: draft.untilDateKey };
  }

  return {
    fields: {
      name,
      description: draft.description.trim(),
      calendarColor: draft.calendarColor,
      startMinutes,
      endMinutes,
      startDateKey: draft.startDateKey,
      repeat,
      end,
    },
  };
}

/**
 * The "Only this one" change: just the fields that differ from what the date shows now, so a time change
 * doesn't also pin that date's name and notes (a later "following" rename must still reach it).
 */
export function occurrenceChange(occurrence: WorkOccurrence, fields: WorkItemFields) {
  const change: { name?: string; description?: string; startMinutes?: number; endMinutes?: number } = {};
  if (fields.name !== occurrence.name) change.name = fields.name;
  if (fields.description !== occurrence.description) change.description = fields.description;
  if (fields.startMinutes !== minutesOf(occurrence.start)) change.startMinutes = fields.startMinutes;
  if (fields.endMinutes !== minutesOf(occurrence.end)) change.endMinutes = fields.endMinutes;
  return change;
}

/** True when the fields change something only a whole series can hold (colour, repeat rule or end rule). */
export function changesSeriesRule(item: WorkItem, fields: WorkItemFields): boolean {
  const sameRule = (repeat: WorkRepeat) =>
    repeat.kind === "weeks" ? { ...repeat, weekdays: [...new Set(repeat.weekdays)].sort((a, b) => a - b) } : repeat;
  return (
    item.calendarColor !== fields.calendarColor ||
    JSON.stringify(sameRule(item.repeat)) !== JSON.stringify(sameRule(fields.repeat)) ||
    JSON.stringify(item.end) !== JSON.stringify(fields.end)
  );
}
