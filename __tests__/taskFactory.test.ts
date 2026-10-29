import { TaskFrequency, TaskPriority, TaskType } from '../src/types';
import { buildTaskFromFormValues, createQuickAddTaskFormValues } from '../src/utils/taskFactory';

describe('buildTaskFromFormValues durationMinutes', () => {
  const base = createQuickAddTaskFormValues('Write report');

  it('keeps durationMinutes', () => {
    const { task } = buildTaskFromFormValues({ ...base, durationMinutes: 45 });
    expect(task.durationMinutes).toBe(45);
  });

  it('leaves durationMinutes undefined when null', () => {
    const { task } = buildTaskFromFormValues({ ...base, durationMinutes: null });
    expect(task.durationMinutes).toBeUndefined();
  });

  it('keeps durationMinutes on predefined tasks', () => {
    const { task } = buildTaskFromFormValues({
      ...base,
      type: TaskType.PREDEFINED,
      predefinedTaskId: 'drink-water',
      frequency: TaskFrequency.ONCE,
      priority: TaskPriority.LOW,
      durationMinutes: 30,
    });
    expect(task.durationMinutes).toBe(30);
  });
});
