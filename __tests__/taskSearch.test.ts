import { TaskFrequency } from '../src/types';
import { taskMatchesSearch } from '../src/utils/taskSearch';
import { taskCategoryLabel } from '../src/utils/taskLabels';
import { createCustomTask } from '../src/utils/taskFactory';

describe('taskMatchesSearch (#58)', () => {
  const uncategorised = createCustomTask('Water plants', '', '', TaskFrequency.ONCE);

  it('finds a task with no category by its shown label, in both languages', () => {
    expect(taskMatchesSearch(uncategorised, 'uncategorised', 'en')).toBe(true);
    expect(taskMatchesSearch(uncategorised, 'sem categoria', 'pt')).toBe(true);
    // Kept from aa237e5: the mapping itself.
    expect(taskCategoryLabel('en', '').toLowerCase()).toContain('uncategorised');
    expect(taskCategoryLabel('pt', '').toLowerCase()).toContain('sem categoria');
  });

  it('matches name and category, ignores case and blank queries', () => {
    const task = createCustomTask('Call the dentist', '', 'Health', TaskFrequency.ONCE);
    expect(taskMatchesSearch(task, '  DENTIST ', 'en')).toBe(true);
    expect(taskMatchesSearch(task, 'health', 'en')).toBe(true);
    expect(taskMatchesSearch(task, '', 'en')).toBe(true);
    expect(taskMatchesSearch(task, 'groceries', 'en')).toBe(false);
  });
});
