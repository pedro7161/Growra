import { GameState, Group, TaskFrequency, TaskStatus, WorkItem } from "../src/types";
import {
  MAX_GROUPS,
  completeGroupOccurrence,
  completeGroupTask,
  createGroup,
  deleteGroup,
  getHolderTasks,
  getHolderWorkItems,
  groupItemCount,
  isBuiltIn,
  setHolderTasks,
  setHolderWorkItems,
  updateGroup,
} from "../src/utils/groups";
import { createInitialGameState } from "../src/utils/initialState";
import { createCustomTask } from "../src/utils/taskFactory";
import { syncRecurringTasks } from "../src/utils/taskSchedule";
import { createWorkItem } from "../src/utils/workSchedule";
import { createCompanion } from "../src/utils/gameplay";

// jest.config.js runs in Europe/Lisbon.
const local = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min).getTime();
const NOW = local(2026, 11, 20, 10, 15);

const shift = (overrides: Partial<Parameters<typeof createWorkItem>[0]> = {}, id = "w1"): WorkItem =>
  createWorkItem(
    {
      name: "Shift",
      description: "",
      calendarColor: "#3366ff",
      startMinutes: 9 * 60,
      endMinutes: 17 * 60,
      startDateKey: "2026-11-20",
      repeat: { kind: "none" },
      end: { kind: "never" },
      ...overrides,
    },
    id,
    local(2026, 11, 1),
  );

function create(state: GameState, name: string, id: string, kind: Group["kind"] = "list"): GameState {
  const result = createGroup(state, { name, color: "#ff8800", kind }, id, NOW);
  if ("error" in result) throw new Error(result.error);
  return result;
}

describe("groups", () => {
  it("create/update/delete group, cap 10, name 1-24 trimmed", () => {
    const base = createInitialGameState();
    let state = create(base, "  Family  ", "g1");
    expect(state.groups).toEqual([
      { id: "g1", name: "Family", color: "#ff8800", kind: "list", createdAt: NOW, tasks: [], workItems: [] },
    ]);

    expect(createGroup(state, { name: "   ", color: "#000", kind: "list" }, "gx", NOW)).toEqual({ error: "name" });
    expect(createGroup(state, { name: "x".repeat(25), color: "#000", kind: "list" }, "gx", NOW)).toEqual({ error: "name" });
    expect("error" in createGroup(state, { name: ` ${"x".repeat(24)} `, color: "#000", kind: "list" }, "gx", NOW)).toBe(false);

    state = updateGroup(state, "g1", { name: " Home ", color: "#112233" });
    expect(state.groups[0]).toMatchObject({ name: "Home", color: "#112233", kind: "list" });
    // A blank or too long new name is ignored; the colour still changes.
    state = updateGroup(state, "g1", { name: "  ", color: "#445566" });
    expect(state.groups[0]).toMatchObject({ name: "Home", color: "#445566" });
    expect(updateGroup(state, "missing", { name: "Other" })).toBe(state);

    for (let index = 2; index <= MAX_GROUPS; index += 1) state = create(state, `G${index}`, `g${index}`);
    expect(MAX_GROUPS).toBe(10);
    expect(state.groups).toHaveLength(10);
    expect(createGroup(state, { name: "Eleven", color: "#000", kind: "schedule" }, "g11", NOW)).toEqual({ error: "cap" });

    state = deleteGroup(state, "g1");
    expect(state.groups).toHaveLength(9);
    expect(state.groups.some((group) => group.id === "g1")).toBe(false);
    expect(state.tasks).toBe(base.tasks);
    expect(state.workItems).toBe(base.workItems);
  });

  it("deleteGroup clears tasksSection, dashboardCollapsed and calendarShow references", () => {
    let state = create(create(createInitialGameState(), "A", "g1"), "B", "g2", "schedule");
    state = {
      ...state,
      settings: {
        ...state.settings,
        tasksSection: "g1",
        dashboardCollapsed: { personal: true, work: false, g1: true, g2: true },
        calendarShow: ["personal", "g1", "g2"],
      },
    };
    const deleted = deleteGroup(state, "g1");
    expect(deleted.settings.tasksSection).toBe("choose");
    expect(deleted.settings.dashboardCollapsed).toEqual({ personal: true, work: false, g2: true });
    expect(deleted.settings.calendarShow).toEqual(["personal", "g2"]);

    // Another remembered section is kept.
    const keepsWork = deleteGroup({ ...state, settings: { ...state.settings, tasksSection: "work" } }, "g1");
    expect(keepsWork.settings.tasksSection).toBe("work");
  });

  it("holder accessors read and write built-ins and groups", () => {
    const task = createCustomTask("Water", "", "health", TaskFrequency.ONCE, "", 0);
    let state = create(create(createInitialGameState(), "List", "g1"), "Shifts", "g2", "schedule");
    expect(isBuiltIn("personal")).toBe(true);
    expect(isBuiltIn("work")).toBe(true);
    expect(isBuiltIn("g1")).toBe(false);

    state = setHolderTasks(state, "personal", [task]);
    expect(state.tasks).toEqual([task]);
    state = setHolderTasks(state, "g1", [task]);
    expect(getHolderTasks(state, "g1")).toEqual([task]);
    expect(getHolderTasks(state, "personal")).toEqual([task]);

    const item = shift();
    state = setHolderWorkItems(state, "work", [item]);
    expect(state.workItems).toEqual([item]);
    state = setHolderWorkItems(state, "g2", [item]);
    expect(getHolderWorkItems(state, "g2")).toEqual([item]);
    expect(getHolderTasks(state, "missing")).toEqual([]);
    expect(getHolderWorkItems(state, "missing")).toEqual([]);
  });

  it("completeGroupTask and completeGroupOccurrence change no reward fields", () => {
    const task = createCustomTask("Dishes", "", "home", TaskFrequency.DAILY, "", local(2026, 11, 20));
    let state = create(create(createInitialGameState(), "List", "g1"), "Shifts", "g2", "schedule");
    state = {
      ...state,
      coins: 40,
      totalExperience: 120,
      level: 3,
      totalTasksCompleted: 9,
      pets: [createCompanion("sprout")],
      streak: { level: 2, bonus: 0.1, lastCompletedDate: local(2026, 11, 19), consecutiveMisses: 0 },
    };
    state = setHolderTasks(state, "g1", [task]);
    state = setHolderWorkItems(state, "g2", [shift()]);

    const rewardFields = (s: GameState) => ({
      coins: s.coins,
      totalExperience: s.totalExperience,
      level: s.level,
      streak: s.streak,
      usage: s.usage,
      days: s.days,
      pets: s.pets,
      companionEvents: s.companionEvents,
      decorations: s.decorations,
      totalTasksCompleted: s.totalTasksCompleted,
    });
    const before = JSON.parse(JSON.stringify(rewardFields(state)));

    const afterTask = completeGroupTask(state, "g1", task.id, NOW);
    const done = getHolderTasks(afterTask, "g1")[0];
    expect(done.status).toBe(TaskStatus.COMPLETED);
    expect(done.dueDate).toBe(local(2026, 11, 21));
    expect(rewardFields(afterTask)).toEqual(before);
    expect({ ...afterTask, groups: state.groups }).toEqual(state);
    // A second tick does nothing.
    expect(completeGroupTask(afterTask, "g1", task.id, NOW)).toBe(afterTask);

    const afterShift = completeGroupOccurrence(afterTask, "g2", "w1", "2026-11-20", NOW);
    expect(getHolderWorkItems(afterShift, "g2")[0].completedDateKeys).toEqual(["2026-11-20"]);
    expect(rewardFields(afterShift)).toEqual(before);
    expect({ ...afterShift, groups: afterTask.groups }).toEqual(afterTask);
    // Before the shift starts it can't be ticked, and ticking again does nothing.
    expect(completeGroupOccurrence(afterTask, "g2", "w1", "2026-11-20", local(2026, 11, 20, 8))).toBe(afterTask);
    expect(completeGroupOccurrence(afterShift, "g2", "w1", "2026-11-20", NOW)).toBe(afterShift);
  });

  it("a daily group task ticked today is pending again tomorrow after syncRecurringTasks", () => {
    const task = createCustomTask("Dishes", "", "home", TaskFrequency.DAILY, "", local(2026, 11, 20));
    let state = setHolderTasks(create(createInitialGameState(), "List", "g1"), "g1", [task]);
    state = completeGroupTask(state, "g1", task.id, NOW);

    expect(syncRecurringTasks(state, local(2026, 11, 20, 23))).toBe(state);
    const tomorrow = syncRecurringTasks(state, local(2026, 11, 21, 8));
    expect(getHolderTasks(tomorrow, "g1")[0].status).toBe(TaskStatus.PENDING);
  });

  it("groupItemCount counts a repeating item once", () => {
    let list = create(createInitialGameState(), "List", "g1");
    list = setHolderTasks(list, "g1", [
      createCustomTask("A", "", "home", TaskFrequency.DAILY),
      createCustomTask("B", "", "home", TaskFrequency.ONCE),
    ]);
    expect(groupItemCount(list.groups[0])).toBe(2);

    let schedule = create(createInitialGameState(), "Shifts", "g2", "schedule");
    schedule = setHolderWorkItems(schedule, "g2", [shift({ repeat: { kind: "days", interval: 1 } }), shift({}, "w2")]);
    expect(groupItemCount(schedule.groups[0])).toBe(2);
  });
});
