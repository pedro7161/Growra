import * as Notifications from "expo-notifications";
import { AppState, Platform } from "react-native";
import { Task } from "../types";
import {
  DAILY_REMINDER_ID,
  planTimerNotifications,
  ScheduledTimerNotification,
} from "../utils/notificationPlan";

const TIMER_CHANNEL = "timers";
const REMINDER_CHANNEL = "reminders";
const supported = Platform.OS === "android" || Platform.OS === "ios";

export interface TimerNotificationText {
  title: string;
  /** "{task}" is replaced with the task name. */
  body: string;
  channelName: string;
}

export interface ReminderText {
  title: string;
  body: string;
  channelName: string;
}

let configured = false;

/** Channels and the foreground rule; safe to call more than once. */
async function configure(timerChannel: string, reminderChannel: string): Promise<void> {
  if (configured || !supported) return;
  configured = true;
  // While Growra is open the timer already plays its own alert, so its notification stays quiet.
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const isTimer = notification.request.content.data?.kind === "timer";
      const show = !(isTimer && AppState.currentState === "active");
      return { shouldShowBanner: show, shouldShowList: show, shouldPlaySound: show, shouldSetBadge: false };
    },
  });
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(TIMER_CHANNEL, {
      name: timerChannel,
      importance: Notifications.AndroidImportance.HIGH,
    });
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: reminderChannel,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/** Asks for permission when it hasn't been answered yet. True when notifications may be shown. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!supported) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

async function hasPermission(): Promise<boolean> {
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/**
 * Makes the scheduled timer notifications match the running timers: one per running timer, at
 * the moment it ends (#38). Runs after every save; does nothing without permission.
 */
export async function syncTimerNotifications(tasks: readonly Task[], text: TimerNotificationText, reminderChannel: string) {
  if (!supported) return;
  try {
    await configure(text.channelName, reminderChannel);
    const scheduled: ScheduledTimerNotification[] = (await Notifications.getAllScheduledNotificationsAsync())
      .filter((request) => request.content.data?.kind === "timer")
      .map((request) => ({ id: request.identifier, fireAt: Number(request.content.data?.fireAt ?? 0) }));
    const plan = planTimerNotifications(tasks, scheduled, Date.now());
    await Promise.all(plan.cancel.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
    if (plan.schedule.length === 0 || !(await hasPermission())) return;
    for (const item of plan.schedule) {
      await Notifications.scheduleNotificationAsync({
        identifier: item.id,
        content: {
          title: text.title,
          body: text.body.replace("{task}", item.taskName),
          data: { kind: "timer", taskId: item.taskId, fireAt: item.fireAt },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: item.fireAt, channelId: TIMER_CHANNEL },
      });
    }
  } catch (error) {
    console.error("Timer notifications failed:", error);
  }
}

/** Schedules (or clears) the one optional daily reminder (#39). */
export async function syncDailyReminder(
  reminder: { enabled: boolean; hour: number; minute: number },
  text: ReminderText,
  timerChannel: string,
): Promise<void> {
  if (!supported) return;
  try {
    await configure(timerChannel, text.channelName);
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
    if (!reminder.enabled || !(await hasPermission())) return;
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_REMINDER_ID,
      content: { title: text.title, body: text.body, data: { kind: "reminder" } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminder.hour,
        minute: reminder.minute,
        channelId: REMINDER_CHANNEL,
      },
    });
  } catch (error) {
    console.error("Daily reminder failed:", error);
  }
}
