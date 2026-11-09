import { TaskFrequency } from '../src/types';
import {
  DAILY_REMINDER_ID,
  LEGACY_CHANNEL_IDS,
  planTimerNotifications,
  REMINDER_CHANNEL_ID,
  taskIdFromNotificationData,
  TIMER_CHANNEL_ID,
  timerNotificationId,
} from '../src/utils/notificationPlan';
import { createCustomTask } from '../src/utils/taskFactory';
import { createTaskTimer } from '../src/utils/taskTimer';

const now = 1_000_000;
const withTimer = (id: string, timer: Partial<ReturnType<typeof createTaskTimer>>) => ({
  ...createCustomTask(`Task ${id}`, '', '', TaskFrequency.ONCE),
  id,
  timer: { ...createTaskTimer(60_000, true), ...timer },
});

describe('planTimerNotifications (#38)', () => {
  it('schedules a running timer for the moment it ends', () => {
    const task = withTimer('a', { state: 'running', startedAt: now - 10_000, remainingMs: 60_000 });
    expect(planTimerNotifications([task], [], now)).toEqual({
      cancel: [],
      schedule: [{ id: timerNotificationId('a'), taskId: 'a', taskName: 'Task a', fireAt: now + 50_000 }],
    });
  });

  it('keeps one already scheduled for the same time', () => {
    const task = withTimer('a', { state: 'running', startedAt: now, remainingMs: 60_000 });
    const plan = planTimerNotifications([task], [{ id: timerNotificationId('a'), fireAt: now + 60_000 + 200 }], now);
    expect(plan).toEqual({ cancel: [], schedule: [] });
  });

  it('cancels paused, reset, finished and deleted timers', () => {
    const paused = withTimer('p', { state: 'paused', remainingMs: 30_000 });
    const idle = withTimer('i', { state: 'idle' });
    const ready = withTimer('r', { state: 'ready', remainingMs: 0 });
    const scheduled = ['p', 'i', 'r', 'gone'].map((id) => ({ id: timerNotificationId(id), fireAt: now + 5_000 }));
    const plan = planTimerNotifications([paused, idle, ready], scheduled, now);
    expect(plan.cancel.sort()).toEqual(scheduled.map((item) => item.id).sort());
    expect(plan.schedule).toEqual([]);
  });

  it('reschedules a timer that was paused and started again', () => {
    const task = withTimer('a', { state: 'running', startedAt: now, remainingMs: 20_000 });
    const plan = planTimerNotifications([task], [{ id: timerNotificationId('a'), fireAt: now + 90_000 }], now);
    expect(plan.cancel).toEqual([timerNotificationId('a')]);
    expect(plan.schedule.map((item) => item.fireAt)).toEqual([now + 20_000]);
  });
});

describe('channel ids and tap data (#38)', () => {
  it('versions the channel ids and retires the unversioned ones', () => {
    expect(TIMER_CHANNEL_ID).toMatch(/-v\d+$/);
    expect(REMINDER_CHANNEL_ID).toMatch(/-v\d+$/);
    expect(LEGACY_CHANNEL_IDS).toEqual(['timers', 'reminders']);
    expect(LEGACY_CHANNEL_IDS).not.toContain(TIMER_CHANNEL_ID);
    expect(LEGACY_CHANNEL_IDS).not.toContain(REMINDER_CHANNEL_ID);
  });

  it('reads the task id only from timer notification data', () => {
    expect(taskIdFromNotificationData({ kind: 'timer', taskId: 'abc', fireAt: 1 })).toBe('abc');
    expect(taskIdFromNotificationData({ kind: 'reminder' })).toBeNull();
    expect(taskIdFromNotificationData({ kind: 'timer' })).toBeNull();
    expect(taskIdFromNotificationData({ kind: 'timer', taskId: '' })).toBeNull();
    expect(taskIdFromNotificationData(null)).toBeNull();
    expect(taskIdFromNotificationData('timer')).toBeNull();
  });

  it('derives a stable id per task, so a different task never collides', () => {
    expect(timerNotificationId('a')).toBe(timerNotificationId('a'));
    expect(timerNotificationId('a')).not.toBe(timerNotificationId('b'));
    expect(timerNotificationId('a')).not.toBe(DAILY_REMINDER_ID);
  });

  it('reschedules after a duration edit, and ignores an already-passed end', () => {
    const edited = withTimer('a', { state: 'running', startedAt: now, remainingMs: 120_000 });
    const plan = planTimerNotifications([edited], [{ id: timerNotificationId('a'), fireAt: now + 60_000 }], now);
    expect(plan.cancel).toEqual([timerNotificationId('a')]);
    expect(plan.schedule.map((item) => item.fireAt)).toEqual([now + 120_000]);
    const overdue = withTimer('b', { state: 'running', startedAt: now - 90_000, remainingMs: 60_000 });
    expect(planTimerNotifications([overdue], [], now)).toEqual({ cancel: [], schedule: [] });
  });

  it('reconciles a fresh start: stale cancelled, missing scheduled, matching kept', () => {
    const keep = withTimer('k', { state: 'running', startedAt: now, remainingMs: 10_000 });
    const add = withTimer('n', { state: 'running', startedAt: now, remainingMs: 20_000 });
    const plan = planTimerNotifications(
      [keep, add],
      [{ id: timerNotificationId('k'), fireAt: now + 10_000 }, { id: timerNotificationId('old'), fireAt: now + 5_000 }],
      now,
    );
    expect(plan.cancel).toEqual([timerNotificationId('old')]);
    expect(plan.schedule.map((item) => item.id)).toEqual([timerNotificationId('n')]);
  });
});
