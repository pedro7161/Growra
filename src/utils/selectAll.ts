/** "Select all" shows once there are this many tickable options (owner, 2026-10-28). */
export const SELECT_ALL_MIN = 3;

export function showSelectAll(optionCount: number): boolean {
  return optionCount >= SELECT_ALL_MIN;
}

export function allSelected(all: readonly string[], selected: readonly string[]): boolean {
  return all.length > 0 && all.every((id) => selected.includes(id));
}

/** Ticks every option, or unticks them all when every one is already ticked. Keeps the options' order. */
export function toggleAll(all: readonly string[], selected: readonly string[]): string[] {
  return allSelected(all, selected) ? [] : [...all];
}
