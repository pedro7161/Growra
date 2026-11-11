import AsyncStorage from '@react-native-async-storage/async-storage';
import { gameStateService } from '../src/services/gameStateService';
import { TaskFrequency, TaskPriority, TaskStatus } from '../src/types';
import {
  normalizeCustomTaskTemplates,
  removeCustomTaskTemplate,
  saveTaskAsTemplate,
} from '../src/utils/customTaskTemplates';
import { createInitialGameState, createSaveData } from '../src/utils/initialState';
import { buildTaskFromFormValues, createCustomTask, createTaskFromTemplate, createQuickAddTaskFormValues } from '../src/utils/taskFactory';

const DAY = 24 * 60 * 60 * 1000;

function sampleTask() {
  return createCustomTask('Water plants', 'All of them', 'home', TaskFrequency.WEEKLY, '', 1000, true, 10, TaskPriority.HIGH, 20);
}

describe('task templates (#77)', () => {
  it('creates a template from a task without taking progress or dates', () => {
    const task = { ...sampleTask(), status: TaskStatus.COMPLETED, completedAt: 5 };
    const { templates, template } = saveTaskAsTemplate([], task);

    expect(templates).toEqual([template]);
    expect(template).toMatchObject({
      name: 'Water plants',
      description: 'All of them',
      category: 'home',
      frequency: TaskFrequency.WEEKLY,
      priority: TaskPriority.HIGH,
      durationMinutes: 20,
      timerMinutes: 10,
    });
    expect(template).not.toHaveProperty('status');
    expect(template).not.toHaveProperty('dueDate');
    expect(template.id).not.toBe(task.id);
  });

  it('applying a template makes an independent, fresh task with the right fields', () => {
    const { template } = saveTaskAsTemplate([], sampleTask());
    const first = createTaskFromTemplate(template, 2 * DAY);
    const second = createTaskFromTemplate(template, 3 * DAY);

    expect(first).toMatchObject({
      name: 'Water plants',
      category: 'home',
      frequency: TaskFrequency.WEEKLY,
      priority: TaskPriority.HIGH,
      durationMinutes: 20,
      status: TaskStatus.PENDING,
      dueDate: 2 * DAY,
      customTemplateId: template.id,
    });
    expect(first.timer).toMatchObject({ enabled: true, duration: 10 * 60000 });
    expect(first.completedAt).toBeUndefined();
    expect(first.id).not.toBe(second.id);
    expect(second.dueDate).toBe(3 * DAY);
  });

  it('applying never changes the template or an existing task', () => {
    const existing = { ...sampleTask(), status: TaskStatus.COMPLETED, completedAt: 9 };
    const { template } = saveTaskAsTemplate([], existing);
    const frozenTemplate = JSON.stringify(template);
    const frozenTask = JSON.stringify(existing);

    createTaskFromTemplate(template, DAY);

    expect(JSON.stringify(template)).toBe(frozenTemplate);
    expect(JSON.stringify(existing)).toBe(frozenTask);
  });

  it('an old template without the new fields applies with form defaults', () => {
    const task = createTaskFromTemplate({ id: 't', name: 'Old', description: '', category: '', createdAt: 0 }, DAY);

    expect(task.frequency).toBe(TaskFrequency.ONCE);
    expect(task.priority).toBe(TaskPriority.MEDIUM);
    expect(task.timer.enabled).toBe(false);
    expect(task.durationMinutes).toBeUndefined();
  });

  it('saving the same task twice updates one template instead of duplicating', () => {
    const task = sampleTask();
    const once = saveTaskAsTemplate([], task);
    const twice = saveTaskAsTemplate(once.templates, { ...task, name: ' water PLANTS ', priority: TaskPriority.LOW });

    expect(twice.templates).toHaveLength(1);
    expect(twice.template.id).toBe(once.template.id);
    expect(twice.template.createdAt).toBe(once.template.createdAt);
    expect(twice.templates[0].priority).toBe(TaskPriority.LOW);
  });

  it('deleting a template leaves tasks made from it alone', () => {
    const { templates, template } = saveTaskAsTemplate([], sampleTask());
    const made = createTaskFromTemplate(template, DAY);
    const before = JSON.stringify(made);

    expect(removeCustomTaskTemplate(templates, template.id)).toEqual([]);
    expect(JSON.stringify(made)).toBe(before);
    expect(removeCustomTaskTemplate(templates, 'missing')).toEqual(templates);
  });

  it('the add-task form keeps frequency and priority when it saves a template', () => {
    const { customTemplate } = buildTaskFromFormValues({
      ...createQuickAddTaskFormValues("Run"),
      name: 'Run',
      saveAsTemplate: true,
      frequency: TaskFrequency.DAILY,
      priority: TaskPriority.LOW,
    });

    expect(customTemplate).toMatchObject({ frequency: TaskFrequency.DAILY, priority: TaskPriority.LOW });
  });

  it('normalizer drops malformed and repeated entries and fills gaps', () => {
    const result = normalizeCustomTaskTemplates([
      { id: 'a', name: 'A' },
      { id: 'a', name: 'A again' },
      { name: 'no id' },
      null,
      { id: 'b', name: 'B', description: 'd', category: 'c', createdAt: 3 },
    ]);

    expect(result.map((item) => item.id)).toEqual(['a', 'b']);
    expect(result[0]).toMatchObject({ description: '', category: '', createdAt: 0 });
    expect(normalizeCustomTaskTemplates(undefined)).toEqual([]);
  });
});

describe('task templates in saves and backups', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('an old save without templates loads with an empty list', async () => {
    const save = createSaveData(createInitialGameState());
    const { customTaskTemplates: _removed, ...oldState } = save.gameState;
    await AsyncStorage.setItem('growra_save_data', JSON.stringify({ ...save, gameState: oldState }));

    const result = await gameStateService.loadGame();
    expect(result.status).toBe('loaded');
    if (result.status !== 'loaded') return;
    expect(result.saveData.gameState.customTaskTemplates).toEqual([]);
  });

  it('templates survive a backup code round trip and a stored save', async () => {
    const { templates } = saveTaskAsTemplate([], sampleTask());
    const save = createSaveData({ ...createInitialGameState(), customTaskTemplates: templates });

    const restored = gameStateService.importSaveCode(gameStateService.exportSaveCode(save));
    expect(restored.gameState.customTaskTemplates).toEqual(templates);

    await gameStateService.saveGame(save);
    const loaded = await gameStateService.loadGame();
    if (loaded.status !== 'loaded') throw new Error('not loaded');
    expect(loaded.saveData.gameState.customTaskTemplates).toEqual(templates);
  });

  it('importing a backup with a repeated template id keeps one entry', () => {
    const { templates } = saveTaskAsTemplate([], sampleTask());
    const save = createSaveData({ ...createInitialGameState(), customTaskTemplates: [...templates, ...templates] });

    const restored = gameStateService.importSaveCode(gameStateService.exportSaveCode(save));
    expect(restored.gameState.customTaskTemplates).toHaveLength(1);
  });
});
