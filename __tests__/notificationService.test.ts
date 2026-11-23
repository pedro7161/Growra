import { TaskFrequency } from '../src/types';
import { createCustomTask } from '../src/utils/taskFactory';
import { createTaskTimer } from '../src/utils/taskTimer';

jest.mock('react-native', () => ({
  Platform: { OS: 'android', select: (o: any) => o.android ?? o.default },
  AppState: { currentState: 'active' },
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  deleteNotificationChannelAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily' },
}));

import * as Notifications from 'expo-notifications';
import {
  ensureNotificationPermission,
  syncDailyReminder,
  syncTimerNotifications,
} from '../src/services/notificationService';

const mockN = Notifications as unknown as Record<string, jest.Mock>;
const text = { title: 't', body: 'Done {task}', channelName: 'Timers' };
const runningTask = (id: string, remainingMs: number) => ({
  ...createCustomTask(`Task ${id}`, '', '', TaskFrequency.ONCE),
  id,
  timer: { ...createTaskTimer(60_000, true), state: 'running' as const, startedAt: Date.now(), remainingMs },
});

beforeEach(() => {
  for (const key of [
    'getPermissionsAsync',
    'requestPermissionsAsync',
    'getAllScheduledNotificationsAsync',
    'cancelScheduledNotificationAsync',
    'scheduleNotificationAsync',
    'setNotificationChannelAsync',
    'deleteNotificationChannelAsync',
  ]) {
    mockN[key].mockReset();
  }
  mockN.getAllScheduledNotificationsAsync.mockResolvedValue([]);
});

describe('ensureNotificationPermission state machine (#38)', () => {
  it('returns true without prompting when already granted', async () => {
    mockN.getPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true });
    expect(await ensureNotificationPermission()).toBe(true);
    expect(mockN.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('asks once when undetermined and reports the answer', async () => {
    mockN.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
    mockN.requestPermissionsAsync.mockResolvedValue({ granted: true });
    expect(await ensureNotificationPermission()).toBe(true);
    expect(mockN.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('never re-prompts once the system will not ask again (second denial)', async () => {
    mockN.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false });
    expect(await ensureNotificationPermission()).toBe(false);
    expect(await ensureNotificationPermission()).toBe(false);
    expect(mockN.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('treats a denial and a native error as false', async () => {
    mockN.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
    mockN.requestPermissionsAsync.mockResolvedValue({ granted: false });
    expect(await ensureNotificationPermission()).toBe(false);
    mockN.getPermissionsAsync.mockRejectedValue(new Error('native'));
    expect(await ensureNotificationPermission()).toBe(false);
  });
});

describe('syncTimerNotifications (#38)', () => {
  it('schedules by task id on the versioned channel with a DATE trigger and tap data', async () => {
    mockN.getPermissionsAsync.mockResolvedValue({ granted: true });
    await syncTimerNotifications([runningTask('a', 30_000)], text, 'Reminders');
    expect(mockN.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    const call = mockN.scheduleNotificationAsync.mock.calls[0][0];
    expect(call.identifier).toBe('timer-a');
    expect(call.content.body).toBe('Done Task a');
    expect(call.content.data).toMatchObject({ kind: 'timer', taskId: 'a' });
    expect(call.trigger).toMatchObject({ type: 'date', channelId: 'timers-v1' });
  });

  it('creates versioned channels and deletes the legacy ones', async () => {
    mockN.getPermissionsAsync.mockResolvedValue({ granted: true });
    // configure() runs once per module load, so load a fresh copy of the service.
    let fresh: typeof import('../src/services/notificationService') | undefined;
    jest.isolateModules(() => {
      fresh = require('../src/services/notificationService');
    });
    await fresh!.syncTimerNotifications([], text, 'Reminders');
    expect(mockN.deleteNotificationChannelAsync.mock.calls.map((c) => c[0]).sort()).toEqual(['reminders', 'timers']);
    expect(mockN.setNotificationChannelAsync.mock.calls.map((c) => c[0]).sort()).toEqual(['reminders-v1', 'timers-v1']);
  });

  it('cancels stale timer notifications without permission and schedules nothing', async () => {
    mockN.getPermissionsAsync.mockResolvedValue({ granted: false });
    mockN.getAllScheduledNotificationsAsync.mockResolvedValue([
      { identifier: 'timer-gone', content: { data: { kind: 'timer', fireAt: Date.now() + 5000 } } },
      { identifier: 'daily-reminder', content: { data: { kind: 'reminder' } } },
    ]);
    await syncTimerNotifications([runningTask('a', 30_000)], text, 'Reminders');
    expect(mockN.cancelScheduledNotificationAsync).toHaveBeenCalledWith('timer-gone');
    expect(mockN.cancelScheduledNotificationAsync).not.toHaveBeenCalledWith('daily-reminder');
    expect(mockN.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

describe('syncDailyReminder (#39)', () => {
  it('does not schedule without permission, and always clears the old one first', async () => {
    mockN.getPermissionsAsync.mockResolvedValue({ granted: false });
    await syncDailyReminder({ enabled: true, hour: 9, minute: 0 }, { title: 'a', body: 'b', channelName: 'R' }, 'T');
    expect(mockN.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(mockN.cancelScheduledNotificationAsync).toHaveBeenCalledWith('daily-reminder');
  });
});
