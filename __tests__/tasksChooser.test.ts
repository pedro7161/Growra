import { WorkItem } from "../src/types";
import { defaultSettings } from "../src/utils/settings";
import { buildWorkPreview } from "../src/utils/workPreview";
import { createWorkItem } from "../src/utils/workSchedule";

// jest.config.js runs in Europe/Lisbon.
const local = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min).getTime();

const shift = (id: string, startHour: number, endHour: number, startDateKey = "2026-11-02"): WorkItem =>
  createWorkItem(
    {
      name: id,
      description: "",
      calendarColor: "#3366ff",
      startMinutes: startHour * 60,
      endMinutes: endHour * 60,
      startDateKey,
      repeat: { kind: "none" },
      end: { kind: "never" },
    },
    id,
    local(2026, 11, 1),
  );

const preview = (items: WorkItem[], now: number) => buildWorkPreview(items, now, defaultSettings);

describe("buildWorkPreview", () => {
  const morning = shift("morning", 7, 11);
  const evening = shift("evening", 18, 22);

  it("asks to set up the schedule when there are no work items", () => {
    expect(preview([], local(2026, 11, 2, 9))).toBe("Set up your work schedule");
  });

  it("shows the running shift", () => {
    expect(preview([morning, evening], local(2026, 11, 2, 9))).toBe("Shift 07:00–11:00");
  });

  it("shows the next of today's shifts once the earlier one has ended", () => {
    expect(preview([morning, evening], local(2026, 11, 2, 12))).toBe("Shift 18:00–22:00");
  });

  it("says there are no more shifts once all of today's have ended", () => {
    expect(preview([morning, evening], local(2026, 11, 2, 23))).toBe("No more shifts today");
  });

  it("says there are no shifts today when none fall on today", () => {
    expect(preview([morning, evening], local(2026, 11, 3, 9))).toBe("No shifts today");
  });

  it("keeps showing last night's shift while it is still running", () => {
    const night = shift("night", 22, 6, "2026-11-01");
    expect(preview([night], local(2026, 11, 2, 3))).toBe("Shift 22:00–06:00");
  });

  it("writes the summary in Portuguese", () => {
    expect(buildWorkPreview([morning], local(2026, 11, 2, 12), { ...defaultSettings, language: "pt" })).toBe(
      "Sem mais turnos hoje",
    );
  });
});
