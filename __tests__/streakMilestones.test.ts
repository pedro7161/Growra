import { reachedStreakMilestone } from "../src/utils/streakMilestones";

describe("reachedStreakMilestone", () => {
  it("fires when the streak steps onto a milestone day", () => {
    expect(reachedStreakMilestone(6, 7)).toBe(true);
    expect(reachedStreakMilestone(13, 14)).toBe(true);
    expect(reachedStreakMilestone(19, 20)).toBe(true);
  });

  it("stays quiet on ordinary days and repeat completions", () => {
    expect(reachedStreakMilestone(5, 6)).toBe(false);
    expect(reachedStreakMilestone(7, 7)).toBe(false);
    expect(reachedStreakMilestone(20, 20)).toBe(false);
  });
});
