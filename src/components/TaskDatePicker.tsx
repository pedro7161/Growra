import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAppTheme } from "../constants/appTheme";
import { AppSettings } from "../types";
import { getStartOfDay } from "../utils/taskSchedule";

interface DayCellData {
  key: string;
  dayNumber: number;
  dayStart: number;
  inMonth: boolean;
}

interface TaskDatePickerProps {
  settings: AppSettings;
  value: number;
  onChange: (date: number) => void;
  disabled?: boolean;
}

function getLocale(language: AppSettings["language"]): string {
  return language === "pt" ? "pt-PT" : "en-US";
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

function buildMonthGrid(monthStart: Date): DayCellData[] {
  const firstDayOfMonth = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const mondayOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const cells: DayCellData[] = [];

  for (let index = 0; index < mondayOffset; index += 1) {
    cells.push({
      key: `empty-start-${index}`,
      dayNumber: 0,
      dayStart: 0,
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const currentDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);

    cells.push({
      key: `${monthStart.getFullYear()}-${monthStart.getMonth()}-${day}`,
      dayNumber: day,
      dayStart: getStartOfDay(currentDate.getTime()),
      inMonth: true,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      key: `empty-end-${cells.length}`,
      dayNumber: 0,
      dayStart: 0,
      inMonth: false,
    });
  }

  return cells;
}

function formatTaskDate(timestamp: number, language: AppSettings["language"]): string {
  return new Intl.DateTimeFormat(getLocale(language), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(timestamp));
}

export default function TaskDatePicker({
  settings,
  value,
  onChange,
  disabled = false,
}: TaskDatePickerProps) {
  const theme = getAppTheme(settings.theme);
  const locale = getLocale(settings.language);
  const todayStart = getStartOfDay(Date.now());
  const [isOpen, setIsOpen] = useState(false);
  const [activeMonth, setActiveMonth] = useState(() => getMonthStart(new Date(value)));
  const weekdayLabels = useMemo(() => getWeekdayLabels(locale), [locale]);
  const monthCells = useMemo(() => buildMonthGrid(activeMonth), [activeMonth]);

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.trigger,
          {
            backgroundColor: theme.surfaceMuted,
            borderColor: theme.border,
          },
          disabled && styles.disabled,
        ]}
        onPress={() => {
          setActiveMonth(getMonthStart(new Date(value)));
          setIsOpen(!isOpen);
        }}
        disabled={disabled}
      >
        <Text style={[styles.triggerText, { color: theme.text }]}>
          {formatTaskDate(value, settings.language)}
        </Text>
        <Text style={[styles.triggerIcon, { color: theme.accent }]}>{isOpen ? "−" : "+"}</Text>
      </TouchableOpacity>

      {isOpen && !disabled ? (
        <View style={[styles.calendarCard, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
          <View style={styles.monthHeader}>
            <TouchableOpacity
              style={[styles.monthButton, { backgroundColor: theme.surface }]}
              onPress={() => setActiveMonth((currentMonth) => addMonths(currentMonth, -1))}
            >
              <Text style={[styles.monthButtonText, { color: theme.text }]}>{"<"}</Text>
            </TouchableOpacity>
            <Text style={[styles.monthTitle, { color: theme.text }]}>{getMonthLabel(activeMonth, locale)}</Text>
            <TouchableOpacity
              style={[styles.monthButton, { backgroundColor: theme.surface }]}
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
              const isSelected = cell.inMonth && cell.dayStart === getStartOfDay(value);
              const isPastDate = cell.inMonth && cell.dayStart < todayStart;

              return (
                <TouchableOpacity
                  key={cell.key}
                  disabled={!cell.inMonth || isPastDate}
                  onPress={() => {
                    onChange(cell.dayStart);
                    setIsOpen(false);
                  }}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: isSelected ? theme.accent : theme.surface,
                      borderColor: isSelected ? theme.accent : theme.border,
                      opacity: !cell.inMonth || isPastDate ? 0.35 : 1,
                    },
                  ]}
                >
                  {cell.inMonth ? (
                    <Text style={[styles.dayNumber, { color: isSelected ? theme.accentText : theme.text }]}>
                      {cell.dayNumber}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.42,
  },
  trigger: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  triggerText: {
    fontSize: 14,
    fontWeight: "600",
  },
  triggerIcon: {
    fontSize: 18,
    fontWeight: "700",
  },
  calendarCard: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  monthButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  dayCell: {
    width: "13.2%",
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: "600",
  },
});
