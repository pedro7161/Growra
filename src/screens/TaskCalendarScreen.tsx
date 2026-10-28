import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings, Task, TaskPriority, TaskStatus, WorkItem, WorkOccurrence } from "../types";
import { getOccurrencesBetween, toDateKey } from "../utils/workSchedule";
import { getStartOfDay } from "../utils/taskSchedule";
import { getPredefinedTask } from "../constants/predefinedTasks";
import { getLocaleFromSettings } from "../utils/settings";
import { taskCategoryLabel, taskFrequencyLabel, taskStatusLabel } from "../utils/taskLabels";

interface TaskCalendarScreenProps {
  settings: AppSettings;
  tasks: Task[];
  workItems: WorkItem[];
  mode: "personal" | "work";
  onToggleShowBoth: (showBoth: boolean) => void;
  onBack: () => void;
}

interface DayCellData {
  key: string;
  dayNumber: number;
  dayStart: number;
  scheduledCount: number;
  completedCount: number;
  calendarColor: string;
  inMonth: boolean;
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthLabel(date: Date, locale: string): string {
  const label = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
  // Capitalize only the first letter: CSS-style capitalize gave "Outubro De 2026".
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getWeekdayLabels(locale: string): string[] {
  const mondayReference = new Date(2024, 0, 1);

  return Array.from({ length: 7 }, (_, index) =>
    // Three letters fit the 7 columns in every language ("segunda" wrapped as "SEGUN / DA").
    new Intl.DateTimeFormat(locale, { weekday: "short" })
      .format(new Date(mondayReference.getFullYear(), mondayReference.getMonth(), mondayReference.getDate() + index))
      .replace(".", "")
      .slice(0, 3)
  );
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

interface DayActivity {
  scheduledCount: number;
  completedCount: number;
  calendarColor: string;
}

const EMPTY_COLOR = "#d9e3e0";

function getDayActivity(tasks: Task[], dayStart: number): DayActivity {
  const scheduledTasks = tasks.filter((task) => getStartOfDay(task.dueDate) === dayStart);
  const completedTasks = tasks.filter(
    (task) => task.completedAt && getStartOfDay(task.completedAt) === dayStart
  );
  const primaryTask = scheduledTasks[0] ? scheduledTasks[0] : completedTasks[0];

  return {
    scheduledCount: scheduledTasks.length,
    completedCount: completedTasks.length,
    calendarColor: primaryTask ? primaryTask.calendarColor : EMPTY_COLOR,
  };
}

function getWorkDayActivity(occurrences: WorkOccurrence[]): DayActivity {
  const done = occurrences.filter((occurrence) => occurrence.completed);
  const pending = occurrences.filter((occurrence) => !occurrence.completed);
  const primary = pending[0] ?? done[0];
  return {
    scheduledCount: pending.length,
    completedCount: done.length,
    calendarColor: primary ? primary.calendarColor : EMPTY_COLOR,
  };
}

/** Merges the day's activity of the mode's own items with the other kind's; the own colour wins. */
function mergeActivity(own: DayActivity, other: DayActivity): DayActivity {
  return {
    scheduledCount: own.scheduledCount + other.scheduledCount,
    completedCount: own.completedCount + other.completedCount,
    calendarColor: own.scheduledCount + own.completedCount > 0 ? own.calendarColor : other.calendarColor,
  };
}

function timeLabel(timestamp: number): string {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function buildMonthGrid(
  tasks: Task[],
  workByDay: Map<string, WorkOccurrence[]>,
  mode: "personal" | "work",
  showPersonal: boolean,
  showWork: boolean,
  monthStart: Date
): DayCellData[] {
  const firstDayOfMonth = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const mondayOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const cells: DayCellData[] = [];

  for (let index = 0; index < mondayOffset; index += 1) {
    cells.push({
      key: `empty-start-${index}`,
      dayNumber: 0,
      dayStart: 0,
      scheduledCount: 0,
      completedCount: 0,
      calendarColor: "#d9e3e0",
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const currentDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
    const dayStart = getStartOfDay(currentDate.getTime());
    const personal = showPersonal ? getDayActivity(tasks, dayStart) : getDayActivity([], dayStart);
    const work = showWork ? getWorkDayActivity(workByDay.get(toDateKey(dayStart)) ?? []) : getWorkDayActivity([]);
    const activity = mode === "work" ? mergeActivity(work, personal) : mergeActivity(personal, work);

    cells.push({
      key: `${monthStart.getFullYear()}-${monthStart.getMonth()}-${day}`,
      dayNumber: day,
      dayStart,
      scheduledCount: activity.scheduledCount,
      completedCount: activity.completedCount,
      calendarColor: activity.calendarColor,
      inMonth: true,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      key: `empty-end-${cells.length}`,
      dayNumber: 0,
      dayStart: 0,
      scheduledCount: 0,
      completedCount: 0,
      calendarColor: "#d9e3e0",
      inMonth: false,
    });
  }

  return cells;
}

export default function TaskCalendarScreen({
  settings,
  tasks,
  workItems,
  mode,
  onToggleShowBoth,
  onBack,
}: TaskCalendarScreenProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const locale = getLocaleFromSettings(settings);
  const [activeMonth, setActiveMonth] = useState(() => getMonthStart(new Date()));
  const [selectedDayStart, setSelectedDayStart] = useState(() => getStartOfDay(Date.now()));

  const weekdayLabels = useMemo(() => getWeekdayLabels(locale), [locale]);
  // "Show both" means the other built-in is in the calendar too.
  const showBoth = settings.calendarShow.includes(mode === "personal" ? "work" : "personal");
  const showPersonal = mode === "personal" || showBoth;
  const showWork = mode === "work" || showBoth;
  const workByDay = useMemo(() => {
    const byDay = new Map<string, WorkOccurrence[]>();
    if (!showWork) return byDay;
    const nextMonth = addMonths(activeMonth, 1);
    for (const occurrence of getOccurrencesBetween(workItems, toDateKey(activeMonth.getTime()), toDateKey(nextMonth.getTime()))) {
      byDay.set(occurrence.dateKey, [...(byDay.get(occurrence.dateKey) ?? []), occurrence]);
    }
    return byDay;
  }, [workItems, activeMonth, showWork]);
  const monthCells = useMemo(
    () => buildMonthGrid(tasks, workByDay, mode, showPersonal, showWork, activeMonth),
    [tasks, workByDay, mode, showPersonal, showWork, activeMonth]
  );
  const selectedDayWork = workByDay.get(toDateKey(selectedDayStart)) ?? [];
  const selectedDayTasks = useMemo(
    () =>
      (showPersonal ? [...tasks] : [])
        .filter(
          (task) =>
            getStartOfDay(task.dueDate) === selectedDayStart ||
            (task.completedAt ? getStartOfDay(task.completedAt) === selectedDayStart : false)
        )
        .sort((leftTask, rightTask) => {
          const priorityOrder = {
            [TaskPriority.HIGH]: 0,
            [TaskPriority.MEDIUM]: 1,
            [TaskPriority.LOW]: 2,
          };

          if (leftTask.status !== rightTask.status) {
            return leftTask.status === TaskStatus.PENDING ? -1 : 1;
          }

          if (priorityOrder[leftTask.priority] !== priorityOrder[rightTask.priority]) {
            return priorityOrder[leftTask.priority] - priorityOrder[rightTask.priority];
          }

          return leftTask.createdAt - rightTask.createdAt;
        }),
    [tasks, selectedDayStart, showPersonal]
  );
  const hasActivity = monthCells.some(
    (cell) => cell.inMonth && (cell.scheduledCount > 0 || cell.completedCount > 0)
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onBack}>
            <Text style={[styles.backButton, { color: theme.accent }]}>{copy.tasksCalendarBack}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>{mode === "work" ? copy.workCalendarTitle : copy.tasksCalendar}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.monthCard, { backgroundColor: theme.surface }]}>
          {workItems.length > 0 ? (
            <View style={styles.showBothRow}>
              <Text style={[styles.showBothLabel, { color: theme.text }]}>{copy.calendarShowBoth}</Text>
              <Switch
                value={showBoth}
                onValueChange={onToggleShowBoth}
                accessibilityLabel={copy.calendarShowBoth}
                thumbColor={showBoth ? theme.accent : theme.border}
                trackColor={{ false: theme.surfaceMuted, true: theme.accentSoft }}
              />
            </View>
          ) : null}
          <View style={styles.monthHeader}>
            <TouchableOpacity
              style={[styles.monthButton, { backgroundColor: theme.surfaceMuted }]}
              onPress={() => setActiveMonth((currentMonth) => addMonths(currentMonth, -1))}
            >
              <Text style={[styles.monthButtonText, { color: theme.text }]}>{"<"}</Text>
            </TouchableOpacity>
            <Text style={[styles.monthTitle, { color: theme.text }]}>
              {getMonthLabel(activeMonth, locale)}
            </Text>
            <TouchableOpacity
              style={[styles.monthButton, { backgroundColor: theme.surfaceMuted }]}
              onPress={() => setActiveMonth((currentMonth) => addMonths(currentMonth, 1))}
            >
              <Text style={[styles.monthButtonText, { color: theme.text }]}>{">"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {weekdayLabels.map((weekday) => (
              <Text key={weekday} style={[styles.weekdayLabel, { color: theme.mutedText }]}>
                {weekday}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {monthCells.map((cell) => {
              const hasScheduledTasks = cell.scheduledCount > 0;
              const hasCompletedTasks = cell.completedCount > 0;
              const totalCount = cell.scheduledCount + cell.completedCount;
              const softColor = `${cell.calendarColor}22`;
              const completedColor = `${cell.calendarColor}88`;
              const cellBackgroundColor =
                !cell.inMonth
                  ? theme.background
                  : hasScheduledTasks && hasCompletedTasks
                    ? cell.calendarColor
                    : hasCompletedTasks
                      ? completedColor
                      : hasScheduledTasks
                        ? softColor
                        : theme.surface;
              const cellBorderColor =
                !cell.inMonth
                  ? theme.background
                  : hasScheduledTasks && !hasCompletedTasks
                    ? cell.calendarColor
                    : theme.border;
              const cellTextColor =
                !cell.inMonth
                  ? theme.background
                  : hasScheduledTasks && hasCompletedTasks
                    ? "#ffffff"
                    : hasCompletedTasks
                      ? "#ffffff"
                      : hasScheduledTasks
                        ? cell.calendarColor
                        : theme.text;
              const countTextColor =
                !cell.inMonth
                  ? theme.background
                  : hasScheduledTasks && hasCompletedTasks
                    ? "#ffffff"
                    : hasCompletedTasks
                      ? "#ffffff"
                      : hasScheduledTasks
                        ? theme.mutedText
                        : theme.mutedText;

              return (
                <TouchableOpacity
                  key={cell.key}
                  disabled={!cell.inMonth}
                  onPress={() => setSelectedDayStart(cell.dayStart)}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: cellBackgroundColor,
                      borderColor: cellBorderColor,
                    },
                    cell.dayStart === selectedDayStart && cell.inMonth
                      ? { borderWidth: 2, borderColor: theme.text }
                      : null,
                  ]}
                >
                  {cell.inMonth ? (
                    <>
                      <Text style={[styles.dayNumber, { color: cellTextColor }]}>{cell.dayNumber}</Text>
                      <Text style={[styles.dayCount, { color: countTextColor }]}>
                        {totalCount > 0 ? totalCount : ""}
                      </Text>
                    </>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.legend}>
            <LegendItem color={theme.accentSoft} borderColor={theme.accent} label={copy.tasksCalendarScheduled} />
            <LegendItem color={theme.success} borderColor={theme.success} label={copy.tasksCalendarCompletedLegend} />
            <LegendItem color={theme.hero} borderColor={theme.hero} label={copy.tasksCalendarMixed} />
          </View>

          {!hasActivity ? (
            <Text style={[styles.noActivityText, { color: theme.mutedText }]}>
              {copy.tasksCalendarNoActivity}
            </Text>
          ) : null}
        </View>

        <View style={[styles.dayDetailsCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.dayDetailsTitle, { color: theme.text }]}>
            {copy.tasksSelectedDay}:{" "}
            {new Intl.DateTimeFormat(locale, {
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date(selectedDayStart))}
          </Text>

          {selectedDayTasks.length === 0 && selectedDayWork.length === 0 ? (
            <Text style={[styles.noActivityText, { color: theme.mutedText }]}>
              {copy.tasksNoTasksOnDay}
            </Text>
          ) : null}

          {selectedDayWork.map((occurrence) => (
            <View
              key={`${occurrence.itemId}-${occurrence.dateKey}`}
              style={[styles.dayTaskItem, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
            >
              <View style={styles.dayTaskTopRow}>
                <View style={styles.dayTaskTitleRow}>
                  <View style={[styles.dayTaskColorDot, { backgroundColor: occurrence.calendarColor }]} />
                  <Text style={[styles.dayTaskName, { color: theme.text }]}>{occurrence.name}</Text>
                </View>
                <Text style={[styles.dayTaskStatus, { color: occurrence.completed ? theme.success : theme.accent }]}>
                  {occurrence.completed ? copy.workDone : timeLabel(occurrence.start)}
                </Text>
              </View>
              <View style={styles.workMetaRow}>
                <Text style={[styles.dayTaskMeta, { color: theme.mutedText }]}>
                  {timeLabel(occurrence.start)} - {timeLabel(occurrence.end)}
                </Text>
                {showBoth ? (
                  <Text style={[styles.workMarker, { color: occurrence.calendarColor, borderColor: occurrence.calendarColor }]}>
                    {copy.calendarWorkMarker}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}

          {selectedDayTasks.length > 0 ? (
            selectedDayTasks.map((task) => {
              const predefinedTask = task.predefinedTaskId ? getPredefinedTask(task.predefinedTaskId) : null;

              return (
                <View
                  key={`${task.id}-${selectedDayStart}`}
                  style={[styles.dayTaskItem, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
                >
                  <View style={styles.dayTaskTopRow}>
                    <View style={styles.dayTaskTitleRow}>
                      <View style={[styles.dayTaskColorDot, { backgroundColor: task.calendarColor }]} />
                      <Text style={[styles.dayTaskName, { color: theme.text }]}>{task.name}</Text>
                    </View>
                    <Text
                      style={[
                        styles.dayTaskStatus,
                        { color: task.status === TaskStatus.COMPLETED ? theme.success : theme.accent },
                      ]}
                    >
                      {taskStatusLabel(copy, task.status)}
                    </Text>
                  </View>
                  <Text style={[styles.dayTaskMeta, { color: theme.mutedText }]}>
                    {taskCategoryLabel(settings.language, predefinedTask ? predefinedTask.category : task.category)} • {taskFrequencyLabel(copy, task.frequency)}
                  </Text>
                </View>
              );
            })
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LegendItem({
  color,
  borderColor,
  label,
}: {
  color: string;
  borderColor: string;
  label: string;
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color, borderColor }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    fontSize: 14,
    fontWeight: "600",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 40,
  },
  monthCard: {
    margin: 16,
    padding: 16,
    borderRadius: 18,
    elevation: 2,
  },
  showBothRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  showBothLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  workMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  workMarker: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  monthButtonText: {
    fontSize: 18,
    fontWeight: "700",
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  weekdayLabel: {
    width: "13.2%",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  dayCell: {
    width: "13.2%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: "700",
  },
  dayCount: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
  dayDetailsCard: {
    marginHorizontal: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 18,
    elevation: 2,
  },
  dayDetailsTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  dayTaskItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  dayTaskTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  dayTaskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  dayTaskColorDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 8,
  },
  dayTaskName: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  dayTaskStatus: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  dayTaskMeta: {
    fontSize: 12,
  },
  legend: {
    marginTop: 18,
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendSwatch: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 10,
  },
  legendLabel: {
    fontSize: 13,
    color: "#667270",
  },
  noActivityText: {
    marginTop: 16,
    fontSize: 13,
    fontStyle: "italic",
  },
});
