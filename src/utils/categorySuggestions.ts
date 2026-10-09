/**
 * Categories the player already uses, most used first, with case-only duplicates merged
 * ("work" and "Work" count as one, shown the way it was written most often).
 */
export function categorySuggestions(categories: readonly string[], limit = 8): string[] {
  const groups = new Map<string, Map<string, number>>();
  for (const raw of categories) {
    const name = raw.trim();
    if (!name) continue;
    const key = name.toLocaleLowerCase();
    const spellings = groups.get(key) ?? new Map<string, number>();
    spellings.set(name, (spellings.get(name) ?? 0) + 1);
    groups.set(key, spellings);
  }
  return [...groups.values()]
    .map((spellings) => {
      const [spelling] = [...spellings.entries()].sort((a, b) => b[1] - a[1])[0];
      const uses = [...spellings.values()].reduce((sum, count) => sum + count, 0);
      return { spelling, uses };
    })
    .sort((a, b) => b.uses - a.uses || a.spelling.localeCompare(b.spelling))
    .slice(0, limit)
    .map((entry) => entry.spelling);
}

/** The typed category, written the way an existing category with the same letters is written. */
export function matchExistingCategory(typed: string, existing: readonly string[]): string {
  const name = typed.trim();
  const key = name.toLocaleLowerCase();
  return existing.find((category) => category.toLocaleLowerCase() === key) ?? name;
}
