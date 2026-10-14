import { REGIONS, regionName } from '../src/utils/journey';
import { taskCategoryLabel } from '../src/utils/taskLabels';
import { predefinedTasks } from '../src/constants/predefinedTasks';

describe('Portuguese labels', () => {
  it('translates the built-in task categories and leaves custom ones as typed', () => {
    for (const category of new Set(predefinedTasks.map((task) => task.category))) {
      expect(taskCategoryLabel('pt', category)).toBeTruthy();
    }
    expect(taskCategoryLabel('pt', 'health')).toBe('saúde');
    expect(taskCategoryLabel('pt', 'Health')).toBe('saúde');
    expect(taskCategoryLabel('pt', 'my stuff')).toBe('my stuff');
    expect(taskCategoryLabel('en', 'health')).toBe('health');
  });

  it('has a Portuguese name for every Journey region', () => {
    for (const region of REGIONS) {
      expect(regionName(region, 'pt')).not.toBe(region.name);
      expect(regionName(region, 'en')).toBe(region.name);
    }
  });
});
