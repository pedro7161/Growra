import { getAppCopy } from '../src/constants/appCopy';
import { TaskFrequency, TaskPriority, TaskStatus, TaskType } from '../src/types';
import {
  buildTaskFromFormValues,
  createQuickAddTaskFormValues,
} from '../src/utils/taskFactory';
import { getStartOfDay } from '../src/utils/taskSchedule';

describe('quick-add task defaults', () => {
  const now = new Date(2026, 9, 19, 15, 30).getTime();

  it('matches the custom Add form defaults and schedules the task for today', () => {
    expect(createQuickAddTaskFormValues('Pay rent', now)).toEqual({
      name: 'Pay rent',
      description: '',
      predefinedTaskId: '',
      customTemplateId: '',
      category: '',
      type: TaskType.CUSTOM,
      frequency: TaskFrequency.ONCE,
      priority: TaskPriority.MEDIUM,
      dueDate: getStartOfDay(now),
      timerEnabled: false,
      timerDurationMinutes: 5,
      durationMinutes: null,
      saveAsTemplate: false,
    });
  });

  it('builds an uncategorised pending task with the requested name', () => {
    const { task, customTemplate } = buildTaskFromFormValues(
      createQuickAddTaskFormValues('Pay rent', now),
    );

    expect(task).toMatchObject({
      name: 'Pay rent',
      description: '',
      predefinedTaskId: '',
      customTemplateId: '',
      category: '',
      type: TaskType.CUSTOM,
      frequency: TaskFrequency.ONCE,
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      dueDate: getStartOfDay(now),
    });
    expect(task.timer.enabled).toBe(false);
    expect(task.timer.duration).toBe(5 * 60 * 1000);
    expect(customTemplate).toBeUndefined();
  });
});

describe('quick-add copy', () => {
  it('has separate, localized placeholder, submit, and accessibility labels', () => {
    expect(getAppCopy('en')).toMatchObject({
      tasksQuickAddPlaceholder: 'Add a task for today',
      tasksQuickAddSubmit: 'Add',
      tasksQuickAddAccessibilityLabel: 'Add task for today',
    });
    expect(getAppCopy('pt')).toMatchObject({
      tasksQuickAddPlaceholder: 'Nova tarefa para hoje',
      tasksQuickAddSubmit: 'Adicionar',
      tasksQuickAddAccessibilityLabel: 'Adicionar tarefa para hoje',
    });
  });
});
