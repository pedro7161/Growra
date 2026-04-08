import React, { useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AddTaskModal from "../components/AddTaskModal";
import TaskTimerControls from "../components/TaskTimerControls";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { getPetImage } from "../constants/petImages";
import { getPredefinedTask } from "../constants/predefinedTasks";
import {
    CustomTaskTemplate,
    GameState,
    Task,
    TaskFrequency,
    TaskStatus,
    TaskType,
} from "../types";
import { createCustomTaskTemplate } from "../utils/customTaskTemplates";
import { getLevelProgress, PLAYER_LEVEL_BASE_COST } from "../utils/gameplay";
import { createCustomTask, createPredefinedTask } from "../utils/taskFactory";
import { getTodayTasks } from "../utils/taskSchedule";

interface DashboardScreenProps {
  gameState: GameState;
  tutorialLocked: boolean;
  onAddTask: (task: Task, customTemplate?: CustomTaskTemplate) => void;
  onCompleteTask: (taskId: string) => void;
  onOpenSettings: () => void;
  onStartTimer: (taskId: string) => void;
  onPauseTimer: (taskId: string) => void;
  onResetTimer: (taskId: string) => void;
  onTimerReady: (taskId: string) => void;
}

export default function DashboardScreen({
  gameState,
  tutorialLocked,
  onAddTask,
  onCompleteTask,
  onOpenSettings,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onTimerReady,
}: DashboardScreenProps) {
  const copy = getAppCopy(gameState.settings.language);
  const theme = getAppTheme(gameState.settings.theme);
  const now = Date.now();
  const [modalVisible, setModalVisible] = useState(false);
  const [showPlayerLevelDetail, setShowPlayerLevelDetail] = useState(false);
  const equippedPet = gameState.pets.find(
    (p) => p.id === gameState.equippedPetId,
  );
  const pendingTasks = getTodayTasks(gameState.tasks, now);
  const completedTasks = gameState.tasks.filter(
    (task) => task.status === TaskStatus.COMPLETED,
  );
  const systemTasksToday = pendingTasks.filter(
    (task) => task.predefinedTaskId,
  ).length;
  const activeMultiplier = equippedPet
    ? (1 + gameState.streak.bonus) * (1 + equippedPet.taskMultiplier)
    : 1 + gameState.streak.bonus;

  const currentLevel = gameState.level;
  const levelStartExp =
    PLAYER_LEVEL_BASE_COST * currentLevel * (currentLevel - 1);
  const nextLevelStartExp =
    PLAYER_LEVEL_BASE_COST * (currentLevel + 1) * currentLevel;
  const currentInLevel = gameState.totalExperience - levelStartExp;
  const totalForLevel = nextLevelStartExp - levelStartExp;

  const playerLevelProgress = getLevelProgress(
    gameState.totalExperience,
    PLAYER_LEVEL_BASE_COST,
  );

  const handleAddTask = (values: {
    name: string;
    description: string;
    predefinedTaskId: string;
    customTemplateId: string;
    category: string;
    type: TaskType;
    frequency: TaskFrequency;
    priority: any;
    dueDate: number;
    timerEnabled: boolean;
    timerDurationMinutes: number;
    saveAsTemplate: boolean;
  }) => {
    const newTask =
      values.type === TaskType.PREDEFINED
        ? createPredefinedTask(
            getPredefinedTask(values.predefinedTaskId),
            values.frequency,
            values.dueDate,
            values.timerEnabled,
            values.timerDurationMinutes,
            values.priority,
          )
        : createCustomTask(
            values.name,
            values.description,
            values.category,
            values.frequency,
            values.customTemplateId,
            values.dueDate,
            values.timerEnabled,
            values.timerDurationMinutes,
            values.priority,
          );
    const customTemplate =
      values.type === TaskType.CUSTOM && values.saveAsTemplate
        ? createCustomTaskTemplate(
            values.name,
            values.description,
            values.category,
            values.customTemplateId,
          )
        : undefined;
    onAddTask(newTask, customTemplate);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.heroCard, { backgroundColor: theme.hero }]}>
          <View style={styles.heroContent}>
            <View style={styles.heroTextBlock}>
              <Text style={[styles.heroTitle, { color: theme.heroMuted }]}>
                {copy.dashboardToday}
              </Text>
              <Text style={[styles.heroValue, { color: theme.heroText }]}>
                {pendingTasks.length} {copy.dashboardPendingTasks}
              </Text>
              <Text style={[styles.heroMeta, { color: theme.heroMuted }]}>
                x{activeMultiplier.toFixed(2)} {copy.dashboardRewardMultiplier}
              </Text>
            </View>
            {equippedPet && (
              <Image
                source={getPetImage(
                  equippedPet.templateId,
                  equippedPet.evolutionStage,
                  equippedPet.activeImageVariantId,
                )}
                style={styles.heroPetImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <TouchableOpacity
                style={[
                  styles.settingsButton,
                  { backgroundColor: theme.accentSoft },
                  tutorialLocked && styles.tutorialDisabled,
                ]}
                onPress={onOpenSettings}
                disabled={tutorialLocked}
              >
                <Text
                  style={[styles.settingsButtonText, { color: theme.accent }]}
                >
                  ⚙
                </Text>
              </TouchableOpacity>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {copy.dashboardTodayList}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.inlineAddButton,
                { backgroundColor: theme.accent },
                tutorialLocked && styles.tutorialDisabled,
              ]}
              onPress={() => setModalVisible(true)}
              disabled={tutorialLocked}
            >
              <Text
                style={[
                  styles.inlineAddButtonText,
                  { color: theme.accentText },
                ]}
              >
                {copy.tasksAdd}
              </Text>
            </TouchableOpacity>
          </View>

          {pendingTasks.length === 0 ? (
            <View
              style={[styles.emptyTaskCard, { backgroundColor: theme.surface }]}
            >
              <Text style={[styles.emptyText, { color: theme.mutedText }]}>
                {copy.dashboardNoTasksYet}
              </Text>
            </View>
          ) : (
            pendingTasks.map((task) => (
              <View key={task.id} style={styles.todayTaskWrapper}>
                <View
                  style={[
                    styles.todayTaskItem,
                    {
                      backgroundColor: theme.surface,
                      borderLeftColor: theme.accent,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[styles.checkbox, { borderColor: theme.border }]}
                    onPress={() => onCompleteTask(task.id)}
                    disabled={tutorialLocked}
                  />
                  <View style={styles.todayTaskContent}>
                    <Text style={[styles.taskName, { color: theme.text }]}>
                      {task.name}
                    </Text>
                    <Text
                      style={[styles.taskStatus, { color: theme.mutedText }]}
                    >
                      {task.predefinedTaskId
                        ? getPredefinedTask(task.predefinedTaskId).category
                        : task.category}
                    </Text>
                    <TaskTimerControls
                      task={task}
                      settings={gameState.settings}
                      disabled={tutorialLocked}
                      onStart={onStartTimer}
                      onPause={onPauseTimer}
                      onReset={onResetTimer}
                      onReady={onTimerReady}
                    />
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {copy.dashboardProgress}
          </Text>
          <View style={styles.summaryGrid}>
            <View
              style={[styles.summaryCard, { backgroundColor: theme.surface }]}
            >
              <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>
                {copy.dashboardCoins}
              </Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {gameState.coins}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.summaryCard,
                { backgroundColor: theme.surface },
                tutorialLocked && styles.tutorialDisabled,
              ]}
              onPress={() => setShowPlayerLevelDetail((prev) => !prev)}
              activeOpacity={0.8}
              disabled={tutorialLocked}
            >
              <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>
                {copy.dashboardPlayerLevel}
              </Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {gameState.level}
              </Text>
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: theme.surfaceMuted },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.round(playerLevelProgress * 100)}%`,
                      backgroundColor: theme.accent,
                    },
                  ]}
                />
              </View>
              {showPlayerLevelDetail && (
                <Text
                  style={[styles.levelDetailText, { color: theme.mutedText }]}
                >
                  {currentInLevel}/{totalForLevel}
                </Text>
              )}
            </TouchableOpacity>
            <View
              style={[styles.summaryCard, { backgroundColor: theme.surface }]}
            >
              <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>
                {copy.dashboardTotalXp}
              </Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {gameState.totalExperience}
              </Text>
            </View>
            <View
              style={[styles.summaryCard, { backgroundColor: theme.surface }]}
            >
              <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>
                {copy.dashboardPityCurrency}
              </Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {gameState.pityCurrency}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {copy.dashboardTasks}
          </Text>
          <View style={[styles.statsCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.statRow, { color: theme.text }]}>
              {copy.dashboardToday}: {pendingTasks.length}
            </Text>
            <Text style={[styles.statRow, { color: theme.text }]}>
              {copy.dashboardSystemTasks}: {systemTasksToday}
            </Text>
            <Text style={[styles.statRow, { color: theme.text }]}>
              {copy.dashboardCompleted}: {completedTasks.length}
            </Text>
            <Text style={[styles.statRow, { color: theme.text }]}>
              {copy.dashboardAllTimeCompleted}: {gameState.totalTasksCompleted}
            </Text>
          </View>
        </View>
      </ScrollView>

      <AddTaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        settings={gameState.settings}
        customTaskTemplates={gameState.customTaskTemplates}
        tutorialEnabled={tutorialLocked}
        tutorialTarget={null}
        onTutorialStateChange={() => {}}
        onSubmit={handleAddTask}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tutorialDisabled: {
    opacity: 0.34,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  heroCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  heroTextBlock: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  heroValue: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  heroMeta: {
    fontSize: 14,
  },
  heroPetImage: {
    width: 96,
    aspectRatio: 1,
  },
  settingsButton: {
    borderRadius: 999,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsButtonText: {
    fontSize: 20,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  inlineAddButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  inlineAddButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCard: {
    width: "47%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 6,
    textTransform: "uppercase",
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  progressTrack: {
    width: "100%",
    height: 4,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  levelDetailText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: "center",
  },
  statsCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  statRow: {
    fontSize: 14,
    marginBottom: 8,
  },
  emptyTaskCard: {
    borderRadius: 12,
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  todayTaskItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  todayTaskWrapper: {
    marginBottom: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    marginRight: 12,
  },
  todayTaskContent: {
    flex: 1,
  },
  taskName: {
    fontSize: 15,
    fontWeight: "600",
  },
  taskStatus: {
    fontSize: 12,
    marginTop: 4,
  },
});
