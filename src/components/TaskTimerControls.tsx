import React, { useEffect, useMemo, useState } from "react";
import { AppSettings, Task } from "../types";
import { getAppTheme } from "../constants/appTheme";
import { getAppCopy } from "../constants/appCopy";
import { computeTimerRemaining } from "../utils/taskTimer";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface TaskTimerControlsProps {
  task: Task;
  settings: AppSettings;
  disabled: boolean;
  onStart: (taskId: string) => void;
  onPause: (taskId: string) => void;
  onReset: (taskId: string) => void;
  onReady: (taskId: string) => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const normalizedMinutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${hours}:${normalizedMinutes}:${seconds}`;
}

export default function TaskTimerControls({
  task,
  settings,
  disabled,
  onStart,
  onPause,
  onReset,
  onReady,
}: TaskTimerControlsProps) {
  const theme = getAppTheme(settings.theme);
  const copy = getAppCopy(settings.language);
  const [now, setNow] = useState(Date.now());

  const remaining = useMemo(() => computeTimerRemaining(task.timer, now), [task.timer, now]);

  useEffect(() => {
    if (!task.timer.enabled || task.timer.state !== "running") {
      return;
    }

    if (remaining <= 0) {
      onReady(task.id);
      return;
    }

    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [task.timer.enabled, task.timer.state, remaining, onReady, task.id]);

  if (!task.timer.enabled) {
    return null;
  }

  const statusLabel =
    task.timer.state === "running"
      ? copy.timerStateRunning
      : task.timer.state === "paused"
        ? copy.timerStatePaused
        : task.timer.state === "ready"
          ? copy.timerStateReady
          : copy.timerStateIdle;

  let primaryLabel: string;
  let primaryHandler: () => void;

  if (task.timer.state === "running") {
    primaryLabel = copy.timerPause;
    primaryHandler = () => onPause(task.id);
  } else if (task.timer.state === "paused") {
    primaryLabel = copy.timerResume;
    primaryHandler = () => onStart(task.id);
  } else if (task.timer.state === "ready") {
    primaryLabel = copy.timerReset;
    primaryHandler = () => onReset(task.id);
  } else {
    primaryLabel = copy.timerStart;
    primaryHandler = () => onStart(task.id);
  }

  return (
    <View style={[styles.container, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
      <View style={styles.metaRow}>
        <Text style={[styles.label, { color: theme.mutedText }]}>Timer</Text>
        <Text style={[styles.status, { color: theme.text }]}>{statusLabel}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={[styles.remaining, { color: theme.text }]}>{formatDuration(remaining)}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: theme.accent },
              disabled && styles.disabledButton,
            ]}
            onPress={primaryHandler}
            disabled={disabled}
          >
            <Text style={[styles.primaryLabel, { color: theme.accentText }]}>{primaryLabel}</Text>
          </TouchableOpacity>
          {task.timer.state !== "running" && task.timer.state !== "ready" && (
            <TouchableOpacity onPress={() => onReset(task.id)} disabled={disabled}>
              <Text style={[styles.resetLabel, { color: theme.mutedText }]}>{copy.timerReset}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
    gap: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
  status: {
    fontSize: 12,
    fontWeight: "600",
  },
  remaining: {
    fontSize: 16,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.4,
  },
  primaryLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  resetLabel: {
    textDecorationLine: "underline",
    fontSize: 12,
  },
});
