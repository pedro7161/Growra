import React, { useState } from "react";
import { getLocaleFromSettings } from "../utils/settings";
import { formatCount } from "../utils/formatCount";
import type { ReturnRecap } from "../utils/returnRecap";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AddTaskModal from "../components/AddTaskModal";
import TaskTimerControls from "../components/TaskTimerControls";
import CompanionArtwork from "../components/CompanionArtwork";
import DashboardGroupSection from "../components/DashboardGroupSection";
import DashboardSectionHeader from "../components/DashboardSectionHeader";
import ShiftCheerCard from "../components/ShiftCheerCard";
import WorkOccurrenceRow from "../components/WorkOccurrenceRow";
import { getAppCopy } from "../constants/appCopy";
import { companionLine } from "../utils/companionText";
import { getAppTheme } from "../constants/appTheme";
import { getPetImage, getSleepyPetImage } from "../constants/petImages";
import { getPredefinedTask } from "../constants/predefinedTasks";
import {
    CustomTaskTemplate,
    GameState,
    HolderId,
    Task,
    TaskStatus,
} from "../types";
import {
    getActiveCompanion,
    getActiveStyle,
    getCompanionMood,
    getPerkStreakBonus,
} from "../utils/companions";
import { getEffectiveStreak, getLevelProgress, PLAYER_LEVEL_BASE_COST } from "../utils/gameplay";
import { getRoadPosition } from "../utils/journey";
import { taskCategoryLabel } from "../utils/taskLabels";
import { buildTaskFromFormValues, TaskFormValues } from "../utils/taskFactory";
import { getTodayTasks } from "../utils/taskSchedule";
import { getTodayWorkOccurrences, groupNextItem, nextFirst, nextTaskFirst } from "../utils/workDashboard";

interface DashboardScreenProps {
  gameState: GameState;
  tutorialLocked: boolean;
  onAddTask: (task: Task, customTemplate?: CustomTaskTemplate) => void;
  onCompleteTask: (taskId: string) => void;
  onOpenSettings: () => void;
  onUiTap: () => void;
  onStartTimer: (taskId: string, holder?: HolderId) => void;
  onPauseTimer: (taskId: string, holder?: HolderId) => void;
  onResetTimer: (taskId: string, holder?: HolderId) => void;
  onTimerReady: (taskId: string, holder?: HolderId) => void;
  /** Shown once after 2+ days away (#53); null otherwise. */
  returnRecap: ReturnRecap | null;
  onDismissReturnRecap: () => void;
  /** The one-time backup card (#54). */
  backupNudgeVisible: boolean;
  onShareBackup: () => void;
  onDismissBackupNudge: () => void;
  /** Work section: confirm a shift, open the Work screen, and remember which sections are collapsed. */
  onCompleteWorkOccurrence: (itemId: string, dateKey: string) => void;
  onOpenWork: () => void;
  onToggleSection: (section: HolderId) => void;
  /** Group rows: tick the group's next item (reward-free) and open the group's own screen. */
  onCompleteGroupTask: (groupId: string, taskId: string) => void;
  onCompleteGroupOccurrence: (groupId: string, itemId: string, dateKey: string) => void;
  onOpenGroup: (groupId: string) => void;
  /** Clock for the Work section; it moves the running shift along. */
  workNow: number;
}

export default function DashboardScreen({
  gameState,
  tutorialLocked,
  onAddTask,
  onCompleteTask,
  onOpenSettings,
  onUiTap,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onTimerReady,
  returnRecap,
  onDismissReturnRecap,
  backupNudgeVisible,
  onShareBackup,
  onDismissBackupNudge,
  onCompleteWorkOccurrence,
  onOpenWork,
  onToggleSection,
  onCompleteGroupTask,
  onCompleteGroupOccurrence,
  onOpenGroup,
  workNow,
}: DashboardScreenProps) {
  const copy = getAppCopy(gameState.settings.language);
  const locale = getLocaleFromSettings(gameState.settings);
  const theme = getAppTheme(gameState.settings.theme);
  const now = Date.now();
  const [modalVisible, setModalVisible] = useState(false);
  const [showPlayerLevelDetail, setShowPlayerLevelDetail] = useState(false);
  const equippedPet = gameState.pets.find(
    (p) => p.id === gameState.equippedPetId,
  );
  const pendingTasks = getTodayTasks(gameState.tasks, now);
  const hasWork = gameState.workItems.length > 0;
  const workOccurrences = hasWork ? nextFirst(getTodayWorkOccurrences(gameState.workItems, workNow), workNow) : [];
  const runningShift = workOccurrences.find((o) => !o.completed && o.start <= workNow && o.end > workNow) ?? null;
  const shiftCompanion = getActiveCompanion(gameState);
  // With a Work section the Personal list leads with its next task; without one the list stays as it was.
  const personalTasks = hasWork ? nextTaskFirst(pendingTasks) : pendingTasks;
  const collapsed = gameState.settings.dashboardCollapsed;
  // Group rows never count in the header total; that stays Personal and Work.
  const groupRows = gameState.groups.flatMap((group) => {
    // workNow only moves while the ticker runs for schedule groups; list groups follow the real clock like Personal.
    const next = groupNextItem(group, group.kind === "schedule" ? workNow : now);
    return next ? [{ group, next }] : [];
  });
  const pendingCount = pendingTasks.length + workOccurrences.filter((o) => !o.completed).length;
  const completedTasks = gameState.tasks.filter(
    (task) => task.status === TaskStatus.COMPLETED,
  );
  const systemTasksToday = pendingTasks.filter(
    (task) => task.predefinedTaskId,
  ).length;
  const streakBonus =
    getEffectiveStreak(gameState.streak, Date.now()).bonus + getPerkStreakBonus(getActiveStyle(gameState));
  const activeMultiplier = equippedPet
    ? (1 + streakBonus) * (1 + equippedPet.taskMultiplier)
    : 1 + streakBonus;
  const mood = getCompanionMood(gameState, now);
  const moodLine = equippedPet ? companionLine(copy, mood, equippedPet.name, now) : "";

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

  const handleAddTask = (values: TaskFormValues) => {
    const { task, customTemplate } = buildTaskFromFormValues(values);
    onAddTask(task, customTemplate);
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
                {pendingCount} {copy.dashboardPendingTasks}
              </Text>
              <Text style={[styles.heroMeta, { color: theme.heroMuted }]}>
                x{activeMultiplier.toFixed(2)} {copy.dashboardRewardMultiplier}
              </Text>
              {moodLine !== "" && (
                <Text style={[styles.heroMood, { color: theme.heroText }]}>
                  {moodLine}
                </Text>
              )}
            </View>
            {equippedPet && (
              <CompanionArtwork
                source={(mood === "sleepy" ? getSleepyPetImage : getPetImage)(
                  equippedPet.templateId,
                  equippedPet.evolutionStage,
                  equippedPet.activeImageVariantId,
                )}
                templateId={equippedPet.templateId}
                style={styles.heroPetImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>

        {returnRecap && (
          <View style={[styles.noticeCard, { backgroundColor: theme.surface, borderColor: theme.accentSoft }]}>
            <Text style={[styles.noticeTitle, { color: theme.text }]}>
              {equippedPet ? copy.welcomeBackNamed.replace("{name}", equippedPet.name) : copy.welcomeBack}
            </Text>
            <Text style={[styles.noticeBody, { color: theme.mutedText }]}>
              {(returnRecap.focus > 0 ? copy.returnRecapFocus : copy.returnRecapLine)
                .replace("{days}", formatCount(returnRecap.days, locale))
                .replace("{done}", formatCount(returnRecap.done, locale))
                .replace("{focus}", formatCount(returnRecap.focus, locale))}
            </Text>
            <View style={styles.noticeActions}>
              <TouchableOpacity onPress={onDismissReturnRecap} hitSlop={8} accessibilityRole="button">
                <Text style={[styles.noticeLink, { color: theme.accent }]}>{copy.welcomeBackDismiss}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {backupNudgeVisible && (
          <View style={[styles.noticeCard, { backgroundColor: theme.surface, borderColor: theme.accentSoft }]}>
            <Text style={[styles.noticeTitle, { color: theme.text }]}>{copy.backupNudgeTitle}</Text>
            <Text style={[styles.noticeBody, { color: theme.mutedText }]}>{copy.backupNudgeBody}</Text>
            <View style={styles.noticeActions}>
              <TouchableOpacity onPress={onDismissBackupNudge} hitSlop={8} accessibilityRole="button">
                <Text style={[styles.noticeLink, { color: theme.mutedText }]}>{copy.backupNudgeDismiss}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.noticeButton, { backgroundColor: theme.accent }]}
                onPress={onShareBackup}
                accessibilityRole="button"
              >
                <Text style={[styles.noticeButtonText, { color: theme.accentText }]}>{copy.backupNudgeShare}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
              onPress={() => {
                setModalVisible(true);
                onUiTap();
              }}
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

          {hasWork && (
            <DashboardSectionHeader
              title={copy.tasksChoosePersonal}
              collapsed={collapsed.personal === true}
              settings={gameState.settings}
              onToggle={() => onToggleSection("personal")}
            />
          )}
          {hasWork && collapsed.personal === true ? null : (
            <>
              {pendingTasks.length === 0 ? (
                <View
                  style={[styles.emptyTaskCard, { backgroundColor: theme.surface }]}
                >
                  <Text style={[styles.emptyText, { color: theme.mutedText }]}>
                    {copy.dashboardNoTasksYet}
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.sectionList}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                >
                {personalTasks.map((task) => (
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
                        hitSlop={10}
                        accessibilityRole="checkbox"
                        accessibilityLabel={task.name}
                        accessibilityState={{ checked: false, disabled: tutorialLocked }}
                      />
                      <View style={styles.todayTaskContent}>
                        <Text style={[styles.taskName, { color: theme.text }]}>
                          {task.name}
                        </Text>
                        <Text
                          style={[styles.taskStatus, { color: theme.mutedText }]}
                        >
                          {taskCategoryLabel(
                            gameState.settings.language,
                            task.predefinedTaskId ? getPredefinedTask(task.predefinedTaskId).category : task.category,
                          )}
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
                ))}
                </ScrollView>
              )}
            </>
          )}

          {hasWork && (
            <View style={styles.workSection}>
              <DashboardSectionHeader
                title={copy.tasksChooseWork}
                collapsed={collapsed.work === true}
                settings={gameState.settings}
                onToggle={() => onToggleSection("work")}
              />
              {collapsed.work === true ? null : (
                <View style={styles.workList}>
                  {runningShift && shiftCompanion ? (
                    <ShiftCheerCard
                      occurrence={runningShift}
                      companion={shiftCompanion}
                      settings={gameState.settings}
                      now={workNow}
                    />
                  ) : null}
                  {workOccurrences.length === 0 ? (
                    <View style={[styles.emptyTaskCard, { backgroundColor: theme.surface }]}>
                      <Text style={[styles.emptyText, { color: theme.mutedText }]}>{copy.workNoShiftsDay}</Text>
                    </View>
                  ) : (
                    <ScrollView
                      style={styles.sectionList}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator
                    >
                    {workOccurrences.map((occurrence) => (
                      <WorkOccurrenceRow
                        key={`${occurrence.itemId}-${occurrence.dateKey}`}
                        occurrence={occurrence}
                        settings={gameState.settings}
                        now={workNow}
                        onOpen={onOpenWork}
                        onComplete={() => onCompleteWorkOccurrence(occurrence.itemId, occurrence.dateKey)}
                      />
                    ))}
                    </ScrollView>
                  )}
                </View>
              )}
            </View>
          )}

          {groupRows.map(({ group, next }) => (
            <DashboardGroupSection
              key={group.id}
              group={group}
              next={next}
              collapsed={collapsed[group.id] === true}
              settings={gameState.settings}
              now={workNow}
              disabled={tutorialLocked}
              onToggle={() => onToggleSection(group.id)}
              onOpen={() => onOpenGroup(group.id)}
              onCompleteTask={(taskId) => onCompleteGroupTask(group.id, taskId)}
              onCompleteOccurrence={(itemId, dateKey) => onCompleteGroupOccurrence(group.id, itemId, dateKey)}
              onStartTimer={(taskId) => onStartTimer(taskId, group.id)}
              onPauseTimer={(taskId) => onPauseTimer(taskId, group.id)}
              onResetTimer={(taskId) => onResetTimer(taskId, group.id)}
              onTimerReady={(taskId) => onTimerReady(taskId, group.id)}
            />
          ))}
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
                {formatCount(gameState.coins, locale)}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.summaryCard,
                { backgroundColor: theme.surface },
                tutorialLocked && styles.tutorialDisabled,
              ]}
              onPress={() => {
                setShowPlayerLevelDetail((prev) => !prev);
                onUiTap();
              }}
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
                {formatCount(gameState.totalExperience, locale)}
              </Text>
            </View>
            <View
              style={[styles.summaryCard, { backgroundColor: theme.surface }]}
            >
              <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>
                {copy.dashboardActiveDays}
              </Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {getRoadPosition(gameState.days).tiles}
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
              {copy.dashboardAllTimeCompleted}: {formatCount(gameState.totalTasksCompleted, locale)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <AddTaskModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          onUiTap();
        }}
        settings={gameState.settings}
        customTaskTemplates={gameState.customTaskTemplates}
        existingTasks={gameState.tasks}
        tutorialEnabled={tutorialLocked}
        tutorialTarget={null}
        onTutorialStateChange={() => {}}
        onSubmit={handleAddTask}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // About five rows show; longer lists scroll inside the section. Shorter lists keep their natural height.
  sectionList: { maxHeight: 360 },
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
  workSection: {
    marginTop: 12,
  },
  workList: {
    gap: 8,
  },
  noticeCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 20, gap: 8 },
  noticeTitle: { fontSize: 16, fontWeight: "700" },
  noticeBody: { fontSize: 14, lineHeight: 20 },
  noticeActions: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap", gap: 16, marginTop: 4 },
  noticeLink: { fontSize: 14, fontWeight: "700" },
  noticeButton: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  noticeButtonText: { fontSize: 14, fontWeight: "700" },
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
  heroMood: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
  },
  heroPetImage: {
    width: 96,
    height: 96,
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
