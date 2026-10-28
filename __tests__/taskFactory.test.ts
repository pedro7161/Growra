import { TaskFrequency, TaskPriority, TaskType } from '../src/types';
import { buildTaskFromFormValues, createQuickAddTaskFormValues } from '../src/utils/taskFactory';
import { formatTaskDuration } from '../src/constants/taskConfig';

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

describe('formatTaskDuration', () => {
  const units = { minutes: 'min', hours: 'h' };
  it('formats minutes and hours', () => {
    expect(formatTaskDuration(45, units)).toBe('45 min');
    expect(formatTaskDuration(60, units)).toBe('1 h');
    expect(formatTaskDuration(480, units)).toBe('8 h');
    expect(formatTaskDuration(90, units)).toBe('1 h 30 min');
  });
});
