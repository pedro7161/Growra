import { TaskFrequency } from '../src/types';
import { planTimerNotifications, timerNotificationId } from '../src/utils/notificationPlan';
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
