import { Group, Task, TaskPriority, TaskStatus, WorkItem } from "../src/types";
import { getTodayWorkOccurrences, groupNextItem, nextFirst, nextTaskFirst } from "../src/utils/workDashboard";
import { createWorkItem } from "../src/utils/workSchedule";

const local = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min).getTime();

const shift = (id: string, startMinutes: number, endMinutes: number, startDateKey: string) =>
  createWorkItem(
    {
      name: id,
      description: "",
      calendarColor: "#3366ff",
      startMinutes,
      endMinutes,
      startDateKey,
      repeat: { kind: "none" },
      end: { kind: "never" },
    },
    id,
    local(2026, 11, 1),
  );

describe("getTodayWorkOccurrences", () => {
  it("lists today's shifts and ignores other days", () => {
    const items = [shift("a", 9 * 60, 17 * 60, "2026-11-03"), shift("b", 9 * 60, 17 * 60, "2026-11-04"), shift("c", 9 * 60, 17 * 60, "2026-11-02")];
    expect(getTodayWorkOccurrences(items, local(2026, 11, 3, 8)).map((o) => o.itemId)).toEqual(["a"]);
  });

  it("keeps yesterday's night shift that runs past midnight until it is confirmed", () => {
    const night = shift("night", 22 * 60, 6 * 60, "2026-11-02");
    expect(getTodayWorkOccurrences([night], local(2026, 11, 3, 2)).map((o) => o.itemId)).toEqual(["night"]);
    const done = { ...night, completedDateKeys: ["2026-11-02"] };
    expect(getTodayWorkOccurrences([done], local(2026, 11, 3, 8))).toEqual([]);
  });

  it("drops yesterday's day shift", () => {
    expect(getTodayWorkOccurrences([shift("old", 9 * 60, 17 * 60, "2026-11-02")], local(2026, 11, 3, 8))).toEqual([]);
  });
});

describe("nextFirst", () => {
  it("moves the running shift ahead of an earlier finished one", () => {
    const items = [shift("early", 6 * 60, 8 * 60, "2026-11-03"), shift("now", 9 * 60, 17 * 60, "2026-11-03")];
    const list = getTodayWorkOccurrences(items, local(2026, 11, 3, 10));
    expect(nextFirst(list, local(2026, 11, 3, 10)).map((o) => o.itemId)).toEqual(["now", "early"]);
  });
});

describe("nextTaskFirst", () => {
  const t = (name: string, priority: TaskPriority) => ({ name, priority }) as Task;
  const names = (tasks: Task[]) => tasks.map((x) => x.name);

  it("puts the highest priority first whatever the input order", () => {
    const high = t("b", TaskPriority.HIGH);
    const low = t("a", TaskPriority.LOW);
    const med = t("c", TaskPriority.MEDIUM);
    expect(names(nextTaskFirst([high, low, med]))).toEqual(["b", "a", "c"]);
    expect(names(nextTaskFirst([low, high, med]))).toEqual(["b", "a", "c"]);
    expect(names(nextTaskFirst([low, med, high]))).toEqual(["b", "a", "c"]);
    expect(names(nextTaskFirst([low, med]))).toEqual(["c", "a"]);
  });

  it("breaks ties by name", () => {
    expect(names(nextTaskFirst([t("z", TaskPriority.MEDIUM), t("m", TaskPriority.MEDIUM), t("x", TaskPriority.MEDIUM)]))[0]).toBe("m");
  });

  it("handles one task and none", () => {
    const one = [t("a", TaskPriority.LOW)];
    expect(nextTaskFirst(one)).toBe(one);
    expect(nextTaskFirst([])).toEqual([]);
  });
});

describe("groupNextItem", () => {
  const now = local(2026, 11, 3, 10);
  const task = (name: string, priority: TaskPriority, extra: Partial<Task> = {}) =>
    ({ id: name, name, priority, status: TaskStatus.PENDING, dueDate: now - 1000, ...extra }) as Task;
  const group = (kind: Group["kind"], tasks: Task[], workItems: WorkItem[]): Group => ({
    id: "g1", name: "G", color: "#112233", kind, createdAt: 0, tasks, workItems,
  });

  it("list group: null when all done or not yet available, else the highest-priority pending task", () => {
    expect(groupNextItem(group("list", [], []), now)).toBeNull();
    const done = task("a", TaskPriority.HIGH, { status: TaskStatus.COMPLETED });
    const later = task("b", TaskPriority.HIGH, { dueDate: now + 86_400_000 });
    expect(groupNextItem(group("list", [done, later], []), now)).toBeNull();
    const result = groupNextItem(group("list", [task("low", TaskPriority.LOW), task("hi", TaskPriority.HIGH), done], []), now);
    expect(result).toEqual({ kind: "task", task: expect.objectContaining({ name: "hi" }) });
  });

  it("schedule group: null when all done today; the next not-done occurrence, incl. a night shift from yesterday", () => {
    const morning = shift("morning", 6 * 60, 8 * 60, "2026-11-03");
    const evening = shift("evening", 18 * 60, 20 * 60, "2026-11-03");
    const first = groupNextItem(group("schedule", [], [morning, evening]), now);
    expect(first).toEqual({ kind: "occurrence", occurrence: expect.objectContaining({ itemId: "evening" }) });
    const allDone = [morning, evening].map((item) => ({ ...item, completedDateKeys: ["2026-11-03"] }));
    expect(groupNextItem(group("schedule", [], allDone), now)).toBeNull();
    const night = shift("night", 22 * 60, 6 * 60, "2026-11-02");
    const early = local(2026, 11, 3, 2);
    expect(groupNextItem(group("schedule", [], [night]), early)).toEqual({
      kind: "occurrence",
      occurrence: expect.objectContaining({ itemId: "night" }),
    });
    expect(groupNextItem(group("schedule", [], []), now)).toBeNull();
  });
});
