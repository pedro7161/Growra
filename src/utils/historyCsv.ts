import { DayRecord, Task } from "../types";

export function csvField(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map(csvField).join(",")).join("\r\n") + "\r\n";
}

const pad = (value: number) => String(value).padStart(2, "0");

function localDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function localTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function buildTasksCsv(tasks: Task[]): string {
  return toCsv([
    ["name", "category", "frequency", "priority", "due_date", "status"],
    ...tasks.map((task) => [task.name, task.category, task.frequency, task.priority, localDate(task.dueDate), task.status]),
  ]);
}

/** One row per logged completion (the save keeps up to 30 a day). */
export function buildCompletionsCsv(days: DayRecord[]): string {
  const completions = days
    .flatMap((day) => day.completions)
    .sort((left, right) => left.at - right.at);
  return toCsv([["date", "time", "task"], ...completions.map((item) => [localDate(item.at), localTime(item.at), item.name])]);
}
