import React, { useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings, Task, TaskPriority, TaskStatus } from "../types";
import { getStartOfDay } from "../utils/taskSchedule";
import { getPredefinedTask } from "../constants/predefinedTasks";

interface TaskCalendarScreenProps {
  settings: AppSettings;
  tasks: Task[];
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
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getWeekdayLabels(locale: string): string[] {
  const mondayReference = new Date(2024, 0, 1);

  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
      new Date(mondayReference.getFullYear(), mondayReference.getMonth(), mondayReference.getDate() + index)
    )
  );
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getDayActivity(tasks: Task[], dayStart: number) {
  const scheduledTasks = tasks.filter((task) => getStartOfDay(task.dueDate) === dayStart);
  const completedTasks = tasks.filter(
    (task) => task.completedAt && getStartOfDay(task.completedAt) === dayStart
  );
  const primaryTask = scheduledTasks[0] ? scheduledTasks[0] : completedTasks[0];

  return {
    scheduledCount: scheduledTasks.length,
    completedCount: completedTasks.length,
    calendarColor: primaryTask ? primaryTask.calendarColor : "#d9e3e0",
  };
}

function buildMonthGrid(tasks: Task[], monthStart: Date): DayCellData[] {
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
    const activity = getDayActivity(tasks, dayStart);

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
  onBack,
}: TaskCalendarScreenProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const locale = settings.language === "pt" ? "pt-PT" : "en-US";
  const [activeMonth, setActiveMonth] = useState(() => getMonthStart(new Date()));
  const [selectedDayStart, setSelectedDayStart] = useState(() => getStartOfDay(Date.now()));

  const weekdayLabels = useMemo(() => getWeekdayLabels(locale), [locale]);
  const monthCells = useMemo(() => buildMonthGrid(tasks, activeMonth), [tasks, activeMonth]);
  const selectedDayTasks = useMemo(
    () =>
      [...tasks]
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
    [tasks, selectedDayStart]
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
          <Text style={[styles.title, { color: theme.text }]}>{copy.tasksCalendar}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.monthCard, { backgroundColor: theme.surface }]}>
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

          {selectedDayTasks.length === 0 ? (
            <Text style={[styles.noActivityText, { color: theme.mutedText }]}>
              {copy.tasksNoTasksOnDay}
            </Text>
          ) : (
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
                      {task.status}
                    </Text>
                  </View>
                  <Text style={[styles.dayTaskMeta, { color: theme.mutedText }]}>
                    {predefinedTask ? predefinedTask.category : task.type} • {task.frequency}
                  </Text>
                </View>
              );
            })
          )}
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
    textTransform: "capitalize",
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
