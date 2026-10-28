import { GameState, Group, Task, TaskFrequency, TaskPriority, TaskStatus, WorkItem } from "../src/types";
import {
  GROUP_CODE_VERSION,
  GroupShare,
  buildGroupShare,
  decodeGroupCode,
  encodeGroupCode,
  extractGroupCode,
  findImportedGroup,
  importGroupCode,
  shareSummary,
} from "../src/utils/groupCode";
import { DEFAULT_TASK_CALENDAR_COLOR } from "../src/constants/taskConfig";
import { MAX_GROUPS, createGroup } from "../src/utils/groups";
import { createInitialGameState } from "../src/utils/initialState";
import { encodeShareCode } from "../src/utils/shareCode";
import { createCustomTask } from "../src/utils/taskFactory";
import { getStartOfDay } from "../src/utils/taskSchedule";
import { createWorkItem, getOccurrencesBetween } from "../src/utils/workSchedule";

const MINUTES_IN_DAY = 1440;
const NOW = new Date(2026, 9, 28, 15, 30).getTime();

function idMaker(prefix = "n"): () => string {
  let next = 0;
  return () => `${prefix}${(next += 1)}`;
}

function withGroup(state: GameState, group: Partial<Group> & Pick<Group, "id" | "kind">): GameState {
  const created = createGroup(state, { name: group.name ?? "Group", color: group.color ?? "#ff8800", kind: group.kind }, group.id, 1);
  if ("error" in created) throw new Error(created.error);
  return {
    ...created,
    groups: created.groups.map((candidate) => (candidate.id === group.id ? { ...candidate, ...group } : candidate)),
  };
}

function shift(id: string, fields: Partial<WorkItem> = {}): WorkItem {
  return {
    ...createWorkItem(
      {
        name: "Shift",
        description: "",
        calendarColor: "#1f7a73",
        startMinutes: 540,
        endMinutes: 1020,
        startDateKey: "2026-10-26",
        repeat: { kind: "none" },
        end: { kind: "never" },
      },
      id,
      5,
    ),
    ...fields,
  };
}

function decodeOk(code: string): GroupShare {
  const decoded = decodeGroupCode(code, NOW);
  if (!("share" in decoded)) throw new Error(`expected a share, got ${decoded.error}`);
  return decoded.share;
}

function asState(result: GameState | { error: "cap" }): GameState {
  if ("error" in result) throw new Error(result.error);
  return result;
}

describe("group codes", () => {
  it("round-trips a schedule group with repeats and exceptions; no completions, no linkId", () => {
    const items: WorkItem[] = [
      shift("w1", {
        name: "Night shift ☾ Piso 3",
        description: "Ala B, café às 2h",
        calendarColor: "#0088ff",
        startMinutes: 1320,
        endMinutes: 360,
        repeat: { kind: "weeks", interval: 1, weekdays: [1, 3, 5] },
        end: { kind: "count", count: 12 },
        exceptions: {
          "2026-10-28": { kind: "skip" },
          "2026-10-30": { kind: "change", name: "Short", startMinutes: 1380 },
        },
        completedDateKeys: ["2026-10-26"],
        linkId: "link-1",
      }),
      shift("w2", { repeat: { kind: "months", interval: 2 }, end: { kind: "until", dateKey: "2027-06-01" } }),
      shift("w3", { repeat: { kind: "days", interval: 3 } }),
    ];
    const state = withGroup(createInitialGameState(), { id: "g1", name: "Team", color: "#00aa88", kind: "schedule", workItems: items });

    const built = buildGroupShare(state, "g1", NOW);
    expect(built).toMatchObject({ sourceId: "g1", name: "Team", color: "#00aa88", kind: "schedule", tasks: [] });
    expect(built.workItems).toHaveLength(3);
    for (const item of built.workItems) {
      expect(item.id).toBe("");
      expect(item.completedDateKeys).toEqual([]);
      expect("linkId" in item).toBe(false);
    }

    const code = encodeGroupCode(built);
    expect(code).toMatch(new RegExp(`^GROWRA-GROUP-${GROUP_CODE_VERSION}-[A-Za-z0-9_-]+-[0-9a-f]{8}$`));
    expect(code).not.toContain("link-1");
    const decoded = decodeOk(`  ${code}\n`);
    expect(decoded).toEqual(built);
    expect(decoded.workItems[0]).toMatchObject({
      name: "Night shift ☾ Piso 3",
      description: "Ala B, café às 2h",
      calendarColor: "#0088ff",
      startMinutes: 1320,
      endMinutes: 360,
      startDateKey: "2026-10-26",
      repeat: { kind: "weeks", interval: 1, weekdays: [1, 3, 5] },
      end: { kind: "count", count: 12 },
      exceptions: items[0].exceptions,
    });
    expect(shareSummary(decoded)).toEqual({ count: 3, kind: "schedule" });

    const imported = asState(importGroupCode(createInitialGameState(), decoded, NOW, idMaker(), "new"));
    const group = imported.groups[0];
    expect(group).toMatchObject({ name: "Team", color: "#00aa88", kind: "schedule", sourceId: "g1", createdAt: NOW });
    expect(group.workItems.map((item) => item.id)).toEqual(["n2", "n3", "n4"]);
    expect(group.workItems.every((item) => item.completedDateKeys.length === 0 && item.linkId === undefined)).toBe(true);
    expect(group.workItems[0].startDateKey).toBe("2026-10-26");
    expect(group.workItems[0].createdAt).toBe(NOW);
  });

  it("round-trips a list group with priority, length and frequency", () => {
    const daily: Task = {
      ...createCustomTask("Stretch", "Ten minutes", "health", TaskFrequency.DAILY, "", 0, true, 10, TaskPriority.HIGH, 30),
      status: TaskStatus.COMPLETED,
      completedAt: 123,
      dueDate: 999_999,
      linkId: "link-2",
    };
    const weekly = createCustomTask("Groceries", "", "", TaskFrequency.WEEKLY, "", 0, false, 0, TaskPriority.LOW);
    const once = { ...createCustomTask("Call Ana", "", "social", TaskFrequency.ONCE, "", 0), calendarColor: "#cc33aa" };
    const doneOnce = { ...createCustomTask("Done already", "", "", TaskFrequency.ONCE, "", 0), status: TaskStatus.COMPLETED };
    const state = withGroup(createInitialGameState(), {
      id: "g1", name: "Home", kind: "list", sourceId: "friend:g9", tasks: [daily, weekly, once, doneOnce],
    });

    const built = buildGroupShare(state, "g1", NOW);
    expect(built.sourceId).toBe("friend:g9");
    // A one-time task that is already done is not part of the list any more.
    expect(built.tasks.map((task) => task.name)).toEqual(["Stretch", "Groceries", "Call Ana"]);
    const code = encodeGroupCode(built);
    expect(code).not.toContain("link-2");
    const decoded = decodeOk(code);
    expect(decoded).toEqual(built);
    expect(decoded.tasks[0]).toMatchObject({
      name: "Stretch", description: "Ten minutes", category: "health", frequency: TaskFrequency.DAILY,
      priority: TaskPriority.HIGH, durationMinutes: 30, status: TaskStatus.PENDING,
      timer: { enabled: true, duration: 600_000, state: "idle", remainingMs: 600_000 },
    });
    expect(decoded.tasks[0].completedAt).toBeUndefined();
    expect(decoded.tasks[1]).toMatchObject({ frequency: TaskFrequency.WEEKLY, priority: TaskPriority.LOW });
    expect(decoded.tasks[1].durationMinutes).toBeUndefined();
    expect(decoded.tasks[2].calendarColor).toBe("#cc33aa");
    expect(shareSummary(decoded)).toEqual({ count: 3, kind: "list" });

    const imported = asState(importGroupCode(createInitialGameState(), decoded, NOW, idMaker(), "new"));
    const tasks = imported.groups[0].tasks;
    expect(tasks.map((task) => task.id)).toEqual(["n2", "n3", "n4"]);
    for (const task of tasks) {
      expect(task).toMatchObject({ status: TaskStatus.PENDING, dueDate: getStartOfDay(NOW), createdAt: NOW });
      expect(task.completedAt).toBeUndefined();
      expect(task.linkId).toBeUndefined();
    }
  });

  it("truncated, edited-checksum, wrong-prefix and newer-version codes are errors", () => {
    const state = withGroup(createInitialGameState(), { id: "g1", kind: "schedule", workItems: [shift("w1")] });
    const code = encodeGroupCode(buildGroupShare(state, "g1", NOW));
    const [, body, sum] = code.match(/^GROWRA-GROUP-1-(.+)-([0-9a-f]{8})$/) ?? [];

    expect(decodeGroupCode(code.slice(0, -3), NOW)).toEqual({ error: "format" });
    expect(decodeGroupCode(`GROWRA-GROUP-1-${body.slice(0, -4)}-${sum}`, NOW)).toEqual({ error: "checksum" });
    const flipped = sum[0] === "0" ? `1${sum.slice(1)}` : `0${sum.slice(1)}`;
    expect(decodeGroupCode(`GROWRA-GROUP-1-${body}-${flipped}`, NOW)).toEqual({ error: "checksum" });
    expect(decodeGroupCode(code.replace("GROWRA-GROUP-", "GROWRA-ROOM-"), NOW)).toEqual({ error: "format" });
    expect(decodeGroupCode(code.replace("GROWRA-GROUP-1-", "GROWRA-GROUP-2-"), NOW)).toEqual({ error: "newer" });
    expect(decodeGroupCode("", NOW)).toEqual({ error: "format" });

    // A correct envelope with content that is not a group is a format error, never a throw.
    for (const payload of ["not json", "null", "[]", '{"v":1}', '["g1","Team","#ffffff","x",[]]', '["g1","","#ffffff","s",[]]', '["g1","Team","#ffffff","s",{}]']) {
      expect(decodeGroupCode(encodeShareCode("GROWRA-GROUP-", 1, payload), NOW)).toEqual({ error: "format" });
    }
    // Inside a valid group, an invalid item is dropped and the rest kept.
    const mixed = decodeOk(
      encodeShareCode("GROWRA-GROUP-", 1, JSON.stringify(["g1", "Team", "#ffffff", "s", [{ n: "Ok", s: 60, e: 120, a: "2026-10-28" }, { n: "Bad", s: 60 }, 7, null]])),
    );
    expect(mixed.workItems.map((item) => item.name)).toEqual(["Ok"]);

    // A code table only answers its own keys: "constructor" or "toString" never become a frequency or priority.
    const crafted = decodeOk(
      encodeShareCode("GROWRA-GROUP-", 1, JSON.stringify(["g1", "Team", "#ffffff", "l", [{ n: "A", f: "constructor" }, { n: "B", p: "toString" }, { n: "C", f: "__proto__" }, { n: "Ok", f: "d" }]])),
    );
    expect(crafted.tasks.map((task) => [task.name, task.frequency])).toEqual([["Ok", TaskFrequency.DAILY]]);

    // A group colour that is not 6-digit hex rejects the code; a bad item colour falls back to the default.
    for (const color of ["#fff", "red", "url(x)", 5]) {
      expect(decodeGroupCode(encodeShareCode("GROWRA-GROUP-", 1, JSON.stringify(["g1", "Team", color, "l", []])), NOW)).toEqual({ error: "format" });
    }
    const limits = decodeOk(
      encodeShareCode("GROWRA-GROUP-", 1, JSON.stringify(["g1", "Team", "#ffffff", "l", [
        { n: "x".repeat(200), d: "y".repeat(900), k: "javascript:alert(1)" },
        { n: "   " },
        { n: "Too long", m: 1441 },
        { n: "Timer too long", t: [1, MINUTES_IN_DAY * 60_000 + 1] },
        { n: "Full day", m: 1440, t: [1, MINUTES_IN_DAY * 60_000] },
      ]])),
    );
    expect(limits.tasks.map((task) => task.name.length)).toEqual([80, 8]);
    expect(limits.tasks[0].description).toHaveLength(500);
    expect(limits.tasks[0].calendarColor).toBe(DEFAULT_TASK_CALENDAR_COLOR);
    expect(limits.tasks[1]).toMatchObject({ durationMinutes: 1440, timer: { enabled: true, duration: MINUTES_IN_DAY * 60_000 } });

    // Only the first 500 items and 400 exceptions per item are read.
    const many = Array.from({ length: 501 }, (_, index) => ({ n: `T${index}` }));
    expect(decodeOk(encodeShareCode("GROWRA-GROUP-", 1, JSON.stringify(["g1", "Team", "#ffffff", "l", many]))).tasks).toHaveLength(500);
    const exceptions = Object.fromEntries(
      // Real calendar days (2027-01-01 on), so only the count limit applies.
      Array.from({ length: 401 }, (_, index) => [`${2027 + Math.floor(index / 336)}-${String(Math.floor((index % 336) / 28) + 1).padStart(2, "0")}-${String((index % 28) + 1).padStart(2, "0")}`, 0]),
    );
    const longItem = decodeOk(
      encodeShareCode("GROWRA-GROUP-", 1, JSON.stringify(["g1", "Team", "#ffffff", "s", [{ n: "Ok", s: 60, e: 120, a: "2026-10-28", r: ["d", 1], x: exceptions }]])),
    );
    expect(Object.keys(longItem.workItems[0].exceptions)).toHaveLength(400);
  });

  it("import at 10 groups returns cap error and leaves state equal", () => {
    let state = createInitialGameState();
    for (let index = 0; index < MAX_GROUPS; index += 1) state = withGroup(state, { id: `g${index}`, kind: "list" });
    const before = JSON.parse(JSON.stringify(state));
    const shared = decodeOk(encodeGroupCode(buildGroupShare(state, "g0", NOW)));
    expect(importGroupCode(state, shared, NOW, idMaker(), "new")).toEqual({ error: "cap" });
    expect(state).toEqual(before);
  });

  it("importing a code from the same source offers update (findImportedGroup) and 'update' replaces items only", () => {
    const sender = withGroup(createInitialGameState(), {
      id: "g1", name: "Team", color: "#00aa88", kind: "schedule", workItems: [shift("w1", { name: "Monday" })],
    });
    const first = decodeOk(encodeGroupCode(buildGroupShare(sender, "g1", NOW)));
    expect(findImportedGroup(createInitialGameState(), first.sourceId)).toBeUndefined();

    let receiver = asState(importGroupCode(createInitialGameState(), first, NOW, idMaker("a"), "new"));
    const local = receiver.groups[0];
    // The receiver renames it, collapses it on the dashboard and shows it in the calendar.
    receiver = {
      ...receiver,
      groups: [{ ...local, name: "Ana's shifts", color: "#112233" }],
      settings: { ...receiver.settings, dashboardCollapsed: { ...receiver.settings.dashboardCollapsed, [local.id]: true }, calendarShow: [local.id] },
    };
    expect(findImportedGroup(receiver, "g1")?.id).toBe(local.id);

    const newer = decodeOk(
      encodeGroupCode(buildGroupShare({ ...sender, groups: [{ ...sender.groups[0], workItems: [shift("w1", { name: "Tuesday" }), shift("w2", { name: "Friday" })] }] }, "g1", NOW)),
    );
    const updated = asState(importGroupCode(receiver, newer, NOW + 1, idMaker("b"), "update"));
    expect(updated.groups).toHaveLength(1);
    expect(updated.groups[0]).toMatchObject({ id: local.id, name: "Ana's shifts", color: "#112233", sourceId: "g1", createdAt: local.createdAt });
    expect(updated.groups[0].workItems.map((item) => [item.id, item.name])).toEqual([["b1", "Tuesday"], ["b2", "Friday"]]);
    expect(updated.settings).toEqual(receiver.settings);

    const copy = asState(importGroupCode(receiver, newer, NOW + 1, idMaker("c"), "new"));
    expect(copy.groups).toHaveLength(2);
    expect(copy.groups[1]).toMatchObject({ name: "Team", sourceId: "g1" });
  });

  it("sharing Work produces a schedule share named after Work; importing it never touches state.workItems", () => {
    const sender = { ...createInitialGameState(), playerId: "player-7", workItems: [shift("w1"), shift("w2", { linkId: "x" })] };
    const built = buildGroupShare(sender, "work", NOW, "Trabalho");
    expect(built).toMatchObject({ sourceId: "player-7:work", name: "Trabalho", kind: "schedule", tasks: [] });
    expect(built.workItems).toHaveLength(2);
    expect(buildGroupShare(sender, "personal", NOW, "Pessoal")).toMatchObject({ sourceId: "player-7:personal", name: "Pessoal", kind: "list" });

    const receiver = { ...createInitialGameState(), playerId: "player-9", coins: 40, workItems: [shift("mine")] };
    const imported = asState(importGroupCode(receiver, decodeOk(encodeGroupCode(built)), NOW, idMaker(), "new"));
    expect(imported.workItems).toBe(receiver.workItems);
    expect(imported.tasks).toBe(receiver.tasks);
    expect(imported.coins).toBe(40);
    expect(imported.groups[0]).toMatchObject({ name: "Trabalho", kind: "schedule", sourceId: "player-7:work" });
    expect(imported.groups[0].workItems).toHaveLength(2);
  });

  it("an imported Personal or Work is named '<name> (shared)'; a group share keeps its name", () => {
    const sender = { ...createInitialGameState(), playerId: "player-7", workItems: [shift("w1")] };
    const work = decodeOk(encodeGroupCode(buildGroupShare(sender, "work", NOW, "Work")));
    const imported = asState(importGroupCode(createInitialGameState(), work, NOW, idMaker(), "new", "(shared)"));
    expect(imported.groups[0].name).toBe("Work (shared)");
    // Passed on again, it is not suffixed twice.
    const passedOn = decodeOk(encodeGroupCode(buildGroupShare(imported, imported.groups[0].id, NOW)));
    const again = asState(importGroupCode(createInitialGameState(), passedOn, NOW, idMaker(), "new", "(shared)"));
    expect(again.groups[0].name).toBe("Work (shared)");
    // The suffix always fits the name limit.
    const long = { ...work, name: "W".repeat(24) };
    const clipped = asState(importGroupCode(createInitialGameState(), long, NOW, idMaker(), "new", "(partilhado)"));
    expect(clipped.groups[0].name).toBe(`${"W".repeat(11)} (partilhado)`);
    const team = withGroup(createInitialGameState(), { id: "g1", name: "Team", kind: "schedule", workItems: [shift("w1")] });
    const group = decodeOk(encodeGroupCode(buildGroupShare(team, "g1", NOW)));
    expect(asState(importGroupCode(createInitialGameState(), group, NOW, idMaker(), "new", "(shared)")).groups[0].name).toBe("Team");
  });
});

describe("extractGroupCode", () => {
  const code = encodeGroupCode({ sourceId: "g1", name: "Team", color: "#00aa88", kind: "list", tasks: [], workItems: [] });

  it("pulls the code out of a whole message", () => {
    expect(extractGroupCode(`My Team group in Growra. Paste this code: ${code}`)).toBe(code);
    expect(extractGroupCode(`  ${code}\n`)).toBe(code);
  });

  it("joins a code a messenger wrapped over several lines", () => {
    const wrapped = `Paste this code: ${code.slice(0, 20)}\n${code.slice(20, 31)} \r\n ${code.slice(31)}`;
    expect(extractGroupCode(wrapped)).toBe(code);
    expect(decodeGroupCode(extractGroupCode(wrapped), NOW)).toEqual({ share: expect.objectContaining({ name: "Team" }) });
    // Words after the code are left out.
    expect(extractGroupCode(`${code.slice(0, 25)}\n${code.slice(25)}\nThanks!`)).toBe(code);
  });

  it("gives back text without a code unchanged", () => {
    expect(extractGroupCode("hello")).toBe("hello");
  });
});

describe("group code limits", () => {
  const scheduleCode = (items: unknown[], sourceId = "g1") =>
    encodeShareCode("GROWRA-GROUP-", 1, JSON.stringify([sourceId, "Team", "#00aa88", "s", items]));
  const packed = (fields: Record<string, unknown> = {}) => ({ n: "Shift", s: 540, e: 1020, a: "2026-10-26", r: ["d", 1], ...fields });

  it("drops schedule items dated far outside today - 2 years .. today + 5 years, so imports stay fast", () => {
    const code = scheduleCode(Array.from({ length: 500 }, () => packed({ a: "1950-01-01" })));
    const share = decodeOk(code);
    expect(share.workItems).toEqual([]);

    // Even a hand-built share with such items brings none in, and reading today stays quick.
    const hostile: GroupShare = { ...share, workItems: Array.from({ length: 500 }, (_, i) => shift(`w${i}`, { startDateKey: "1950-01-01", repeat: { kind: "days", interval: 1 } })) };
    const imported = asState(importGroupCode(createInitialGameState(), hostile, NOW, idMaker(), "new"));
    expect(imported.groups[0].workItems).toEqual([]);
    const started = Date.now();
    getOccurrencesBetween(imported.groups.flatMap((group) => group.workItems), "2026-10-28", "2026-10-29");
    expect(Date.now() - started).toBeLessThan(50);
  });

  it("keeps dates inside the window and drops unreal dates or an 'until' outside it", () => {
    const share = decodeOk(
      scheduleCode([
        packed({ n: "Oldest", a: "2024-10-28" }),
        packed({ n: "Too old", a: "2024-10-27" }),
        packed({ n: "Latest", a: "2031-10-28" }),
        packed({ n: "Too late", a: "2031-10-29" }),
        packed({ n: "Not a day", a: "2026-02-30" }),
        packed({ n: "Month 13", a: "2026-13-01" }),
        packed({ n: "Until ok", z: ["u", "2027-01-01"] }),
        packed({ n: "Until far", z: ["u", "2099-01-01"] }),
        packed({ n: "Until unreal", z: ["u", "2027-02-31"] }),
        packed({ n: "Bad exception day", x: { "2026-11-31": 0 } }),
      ]),
    );
    expect(share.workItems.map((item) => item.name)).toEqual(["Oldest", "Latest", "Until ok"]);
  });

  it("reads at most 200 schedule items", () => {
    const share = decodeOk(scheduleCode(Array.from({ length: 300 }, (_, i) => packed({ n: `S${i}` }))));
    expect(share.workItems).toHaveLength(200);
    expect(share.workItems[199].name).toBe("S199");
  });

  it("the share builder leaves out what a decode would drop, so what is sent is what arrives", () => {
    const items = [
      shift("w1", { name: "Now" }),
      shift("w2", { name: "Ancient", startDateKey: "1990-05-05", repeat: { kind: "days", interval: 1 } }),
      shift("w3", { name: "Far end", end: { kind: "until", dateKey: "2090-01-01" } }),
      ...Array.from({ length: 250 }, (_, i) => shift(`x${i}`, { name: `X${i}` })),
    ];
    const state = withGroup(createInitialGameState(), { id: "g1", kind: "schedule", workItems: items });
    const built = buildGroupShare(state, "g1", NOW);
    expect(built.workItems).toHaveLength(200);
    expect(built.workItems.map((item) => item.name)).not.toEqual(expect.arrayContaining(["Ancient", "Far end"]));
    expect(decodeOk(encodeGroupCode(built))).toEqual(built);
    expect(buildGroupShare({ ...state, workItems: items }, "work", NOW, "Work").workItems).toHaveLength(200);
  });

  it("cuts a task's tag to 40 characters and the source id to 128", () => {
    const code = encodeShareCode(
      "GROWRA-GROUP-", 1, JSON.stringify(["s".repeat(300), "Home", "#00aa88", "l", [{ n: "Tidy", c: "t".repeat(90) }]]),
    );
    const share = decodeOk(code);
    expect(share.sourceId).toBe("s".repeat(128));
    expect(share.tasks[0].category).toBe("t".repeat(40));

    const task = { ...createCustomTask("Tidy", "", "t".repeat(90), TaskFrequency.ONCE, "", 0) };
    const state = withGroup(createInitialGameState(), { id: "g1", kind: "list", sourceId: "s".repeat(300), tasks: [task] });
    const built = buildGroupShare(state, "g1", NOW);
    expect(built.sourceId).toBe("s".repeat(128));
    expect(built.tasks[0].category).toBe("t".repeat(40));
    expect(decodeOk(encodeGroupCode(built))).toEqual(built);
  });
});
