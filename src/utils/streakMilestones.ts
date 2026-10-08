/** Streak days that get their own celebration cue; 20 is the streak cap. */
export const STREAK_MILESTONES = [7, 14, 20] as const;

/** True only on the completion that takes the streak up to a milestone day. */
export function reachedStreakMilestone(previousLevel: number, nextLevel: number): boolean {
  return nextLevel > previousLevel && (STREAK_MILESTONES as readonly number[]).includes(nextLevel);
}
