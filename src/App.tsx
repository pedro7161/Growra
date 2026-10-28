import React, { useEffect, useRef, useState } from "react";
import { Alert, AppState, BackHandler, Share, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import BottomNavigation from "./components/BottomNavigation";
import SettingsModal from "./components/SettingsModal";
import GrowraPlusModal from "./components/GrowraPlusModal";
import WhatsNewModal from "./components/WhatsNewModal";
import { APP_VERSION } from "./constants/appVersion";
import { ChangelogEntry } from "./constants/changelog";
import { whatsNewToShow } from "./utils/whatsNew";
import UpdatePrompt from "./components/UpdatePrompt";
import { useAppUpdate } from "./hooks/useAppUpdate";
import RoomEditorScreen from "./screens/RoomEditorScreen";
import { createPlusOwnershipGate, keepPlusOnImport, usePlusController } from "./hooks/usePlusController";
import { createPlusService } from "./services/plusService";
import { expoIapClient } from "./services/expoIapClient";
import { createAdsService } from "./services/adsService";
import { googleAdsClient } from "./services/googleAdsClient";
import { REWARDED_AD_UNIT_ID } from "./constants/adConfig";
import { getExploreLeft, grantExploreFind } from "./utils/explore";
import { getActiveCompanion } from "./utils/companions";
import { syncRooms } from "./utils/rooms";
import { buildRoomShareMessage, shareRoomPicture } from "./utils/roomShare";
import { resolveTheme, withResolvedTheme } from "./utils/plus";
import { buildCompletionsCsv, buildTasksCsv } from "./utils/historyCsv";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import CompanionRevealModal from "./components/CompanionRevealModal";
import { reachedStreakMilestone } from "./utils/streakMilestones";
import TutorialOverlay from "./components/TutorialOverlay";
import TutorialCards, { TutorialCardMode } from "./components/TutorialCards";
import {
  applyFirstTaskReward,
  finishTutorial,
  getTutorialStep,
  shouldFinishTutorial,
  skipTutorial,
} from "./utils/tutorial";
import { getAppCopy } from "./constants/appCopy";
import { getAppTheme, resolveDarkAppearance, setDarkAppearance } from "./constants/appTheme";
import DashboardScreen from "./screens/DashboardScreen";
import CompanionsScreen from "./screens/CompanionsScreen";
import JourneyScreen from "./screens/JourneyScreen";
import TaskCalendarScreen from "./screens/TaskCalendarScreen";
import TasksScreen from "./screens/TasksScreen";
import WorkScreen from "./screens/WorkScreen";
import TasksChooser from "./components/TasksChooser";
import { buildWorkPreview } from "./utils/workPreview";
import { gameStateService } from "./services/gameStateService";
import { maybeAskForReview, openStoreListing, reachedCamp } from "./services/reviewService";
import { ensureNotificationPermission, syncDailyReminder, syncTimerNotifications } from "./services/notificationService";
import { getReturnRecap, ReturnRecap, shouldShowBackupNudge } from "./utils/returnRecap";
import {
  AppLanguage,
  AppAppearance,
  AppThemeId,
  CustomTaskTemplate,
  GameState,
  Task,
  TaskType,
  TimerAlertMode,
  Room,
  WorkEditScope,
  WorkItem,
} from "./types";
import { upsertCustomTaskTemplate } from "./utils/customTaskTemplates";
import {
  adoptStarter,
  applyTaskCreated,
  applyTaskDeleted,
  applyTaskUpdated,
  completeTask,
  completeWorkOccurrence,
  equipPet,
  upsertWorkItems,
} from "./utils/gameplay";
import { deleteOccurrence, editOccurrence, getOccurrencesBetween } from "./utils/workSchedule";
import { addDaysToKey, occurrenceChange, WorkItemFields } from "./utils/workForm";
import { generateId } from "./utils/idUtils";
import {
  buyDecoration,
  getRoadPosition,
  placeDecoration,
  removeDecoration,
} from "./utils/journey";
import { ambienceFor } from "./utils/ambience";
import { playGrowraCue, setGrowraAmbience } from "./utils/growraAudio";
import { createInitialGameState, createSaveData } from "./utils/initialState";

import { getTodayTasks, syncRecurringTasks } from "./utils/taskSchedule";
import {
  finishTaskTimer,
  pauseTaskTimer,
  resetTaskTimer,
  startTaskTimer,
} from "./utils/taskTimer";
import {
  pickTimerAlertSound,
  playTimerAlert,
  removeStoredTimerAlertSound,
} from "./utils/timerAlert";

const plusService = createPlusService(expoIapClient);
const adsService = createAdsService(googleAdsClient, REWARDED_AD_UNIT_ID);

type Screen = "dashboard" | "tasks" | "task-calendar" | "journey" | "companions";

interface TaskTutorialUiState {
  modalVisible: boolean;
  taskType: TaskType;
  selectedPredefinedTaskId: string;
}

type CompanionAudioCue = "companion-greeting" | "companion-evolved" | "focus-find";

function companionAudioCueFor(events: GameState["companionEvents"]): CompanionAudioCue | null {
  if (events.some((event) => event.kind === "evolved")) return "companion-evolved";
  if (events.some((event) => event.kind === "found")) return "focus-find";
  if (events.some((event) => event.kind === "joined")) return "companion-greeting";
  return null;
}

function newCompanionAudioCue(before: GameState, after: GameState): CompanionAudioCue | null {
  return companionAudioCueFor(after.companionEvents.slice(before.companionEvents.length));
}

/** Keeps scheduled notifications in line with the state: running timers (#38), the daily reminder (#39). */
function syncNotifications(state: GameState, reminderToo = false) {
  const copy = getAppCopy(state.settings.language);
  void syncTimerNotifications(
    state.tasks,
    { title: copy.notifyTimerTitle, body: copy.notifyTimerBody, channelName: copy.notifyTimerChannel },
    copy.reminderChannel,
  );
  if (reminderToo) {
    void syncDailyReminder(
      state.settings.dailyReminder,
      { title: copy.reminderTitle, body: copy.reminderBody, channelName: copy.reminderChannel },
      copy.notifyTimerChannel,
    );
  }
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>("dashboard");
  const [gameState, setGameState] = useState<GameState | null>(null);
  // Dark mode: resolved here, before any screen renders, so every getAppTheme() call agrees.
  const systemScheme = useColorScheme();
  const darkMode = resolveDarkAppearance(gameState?.settings.appearance ?? "system", systemScheme);
  setDarkAppearance(darkMode);
  // Latest state for event handlers. Reading `gameState` from the render closure lets two
  // quick taps both act on the same old state (e.g. completing one task twice).
  const gameStateRef = useRef<GameState | null>(null);
  const lastSaveWarningRef = useRef(0);
  const [returnRecap, setReturnRecap] = useState<ReturnRecap | null>(null);
  const [backupNudgeVisible, setBackupNudgeVisible] = useState(false);
  const [whatsNew, setWhatsNew] = useState<ChangelogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  /** Set when the save was written by a newer Growra: nothing is loaded or overwritten (#50). */
  const [newerSaveLanguage, setNewerSaveLanguage] = useState<string | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [tutorialCard, setTutorialCard] = useState<TutorialCardMode | null>(null);
  const [taskTutorialUiState, setTaskTutorialUiState] = useState<TaskTutorialUiState>({
    modalVisible: false,
    taskType: TaskType.CUSTOM,
    selectedPredefinedTaskId: "",
  });
  const tutorialStep = gameState
    ? getTutorialStep(gameState, activeScreen, taskTutorialUiState.modalVisible)
    : "done";
  const [plusVisible, setPlusVisible] = useState(false);
  const [exploreBusy, setExploreBusy] = useState(false);
  const exploreBusyRef = useRef(false);
  const [roomEditorId, setRoomEditorId] = useState<string | null>(null);
  const [appActive, setAppActive] = useState(true);
  const [adConsentAvailable, setAdConsentAvailable] = useState(false);
  // The Work screen's clock: it moves the running shift and its encouragement along while the screen is open.
  const [workNow, setWorkNow] = useState(() => Date.now());
  const workScreenOpen = activeScreen === "tasks" && gameState?.settings.tasksSection === "work";
  useEffect(() => {
    if (!workScreenOpen || !appActive) return;
    setWorkNow(Date.now());
    const interval = setInterval(() => setWorkNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, [workScreenOpen, appActive]);

  // Android Back: close the room editor, then return to the dashboard, then (optionally) ask
  // before leaving. Open modals handle Back themselves (onRequestClose) and never reach this.
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (roomEditorId) {
        setRoomEditorId(null);
        return true;
      }
      if (activeScreen !== "dashboard") {
        setActiveScreen("dashboard");
        return true;
      }
      const current = gameStateRef.current;
      if (!current?.settings.confirmExit) return false;
      const copy = getAppCopy(current.settings.language);
      Alert.alert(copy.exitTitle, copy.exitMessage, [
        { text: copy.exitStay, style: "cancel" },
        { text: copy.exitLeave, style: "destructive", onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    });
    return () => subscription.remove();
  }, [activeScreen, roomEditorId]);

  const playUiTap = () => {
    void playGrowraCue("ui-tap", gameStateRef.current?.settings.sfxEnabled ?? false);
  };
  const handleNavigate = (screen: Screen) => {
    if (screen === activeScreen) return;
    setActiveScreen(screen);
    playUiTap();
  };

  useEffect(() => {
    if (settingsVisible) void adsService.canChangeConsent().then(setAdConsentAvailable);
  }, [settingsVisible]);

  const openPlus = () => {
    setPlusVisible(true);
    playUiTap();
    void plus.refreshPrice();
  };
  const appUpdate = useAppUpdate();
  // Play's answer can beat loadGame(); the gate holds it so the load applies it instead of dropping it.
  const plusOwnershipGate = useRef(createPlusOwnershipGate(() => gameStateRef.current));
  const plus = usePlusController(plusService, (owned) => {
    const next = plusOwnershipGate.current.answer(owned, Date.now());
    if (next) void persistGameState(next);
  });

  useEffect(() => {
    loadGame();
  }, []);

  // The ambience follows the screen (home / journey / room editor) and pauses while the app is inactive.
  useEffect(() => {
    const musicEnabled = appActive && (gameState?.settings.musicEnabled ?? false);
    void setGrowraAmbience(ambienceFor(activeScreen, roomEditorId !== null, musicEnabled));
  }, [appActive, activeScreen, roomEditorId, gameState?.settings.musicEnabled]);

  useEffect(() => () => void setGrowraAmbience(null), []);

  useEffect(() => {
    if (!gameState) {
      return;
    }

    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        setAppActive(nextAppState === "active");
        if (nextAppState !== "active") {
          return;
        }

        const currentGameState = gameStateRef.current ?? gameState;
        // Back after 2+ days with the app still in memory: same welcome as a fresh start (#53).
        const recap = currentGameState.tutorialCompleted
          ? getReturnRecap(currentGameState, currentGameState.lastPlayedAt, Date.now())
          : null;
        if (recap) setReturnRecap(recap);
        const seen = recap ? { ...currentGameState, lastPlayedAt: Date.now() } : currentGameState;
        const syncedGameState = syncRecurringTasks(seen);

        if (syncedGameState !== currentGameState) {
          await persistGameState(syncedGameState);
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [gameState]);

  const loadGame = async () => {
    const loadResult = await gameStateService.loadGame();
    if (loadResult.status === "newer") {
      setNewerSaveLanguage((await gameStateService.readStoredLanguage()) ?? "en");
      setLoading(false);
      return;
    }

    let resolvedGameState: GameState;

    if (loadResult.status === "loaded") {
      const syncedGameState = syncRooms(
        applyFirstTaskReward(syncRecurringTasks(loadResult.saveData.gameState)),
      );
      await gameStateService.saveGame(createSaveData(syncedGameState));
      resolvedGameState = syncedGameState;
    } else {
      const newGameState = createInitialGameState();
      if (loadResult.status === "corrupt") {
        const copy = getAppCopy(newGameState.settings.language);
        const { backupKey } = loadResult;
        Alert.alert(copy.saveCorruptTitle, copy.saveCorruptBody, [
          {
            text: copy.saveCorruptShare,
            onPress: () =>
              void gameStateService.readCorruptSave(backupKey).then((data) => {
                if (data) void Share.share({ message: data }).catch(() => undefined);
              }),
          },
          { text: "OK" },
        ]);
      }
      await gameStateService.saveGame(createSaveData(newGameState));
      resolvedGameState = newGameState;
    }

    if (resolvedGameState.notices.length > 0) {
      const copy = getAppCopy(resolvedGameState.settings.language);
      resolvedGameState.notices.forEach((notice) => {
        const [title, body] =
          notice.kind === "companions-migrated"
            ? [copy.companionsMigratedTitle, copy.companionsMigratedBody]
            : [copy.journeyMigratedTitle, copy.journeyMigratedBody];
        Alert.alert(title, body.replace("{coins}", String(notice.coins)));
      });
      resolvedGameState = { ...resolvedGameState, notices: [] };
      await gameStateService.saveGame(createSaveData(resolvedGameState));
    }

    // An ownership answer that arrived while the save was loading is applied here, not lost.
    const adoptedGameState = plusOwnershipGate.current.adopt(resolvedGameState, Date.now());
    if (adoptedGameState !== resolvedGameState) {
      resolvedGameState = adoptedGameState;
      await gameStateService.saveGame(createSaveData(resolvedGameState));
    }

    if (loadResult.status === "loaded" && resolvedGameState.tutorialCompleted) {
      // Welcome back after 2+ days away (#53), measured from the last time the player was here;
      // opening the app counts as being here, so the card doesn't repeat on the next launch.
      const recap = getReturnRecap(resolvedGameState, loadResult.saveData.gameState.lastPlayedAt, Date.now());
      if (recap) {
        setReturnRecap(recap);
        resolvedGameState = { ...resolvedGameState, lastPlayedAt: Date.now() };
        await gameStateService.saveGame(createSaveData(resolvedGameState));
      }
    }
    // The backup card shows once (#54): it's marked as shown the moment it appears.
    if (shouldShowBackupNudge(resolvedGameState)) {
      setBackupNudgeVisible(true);
      resolvedGameState = { ...resolvedGameState, backupNudgeShown: true };
      await gameStateService.saveGame(createSaveData(resolvedGameState));
    }

    // What's new in this version (#64), on every launch until the player hides it for this version.
    setWhatsNew(
      whatsNewToShow(
        resolvedGameState.whatsNewHiddenFor,
        APP_VERSION,
        resolvedGameState.tutorialCompleted,
        resolvedGameState.settings.language,
      ),
    );

    gameStateRef.current = resolvedGameState;
    setGameState(resolvedGameState);
    syncNotifications(resolvedGameState, true);
    if (!resolvedGameState.tutorialCompleted) {
      // Brand-new players get the welcome card first; anyone mid-tutorial goes straight back to it.
      if (resolvedGameState.tasks.length === 0) setTutorialCard("welcome");
      else setTutorialVisible(true);
    }

    setLoading(false);
  };

  /** Applies and saves the next state; resolves false (after telling the player) when the write failed. */
  const persistGameState = async (nextGameState: GameState): Promise<boolean> => {
    const syncedGameState = syncRooms(applyFirstTaskReward(syncRecurringTasks(nextGameState)));
    gameStateRef.current = syncedGameState;
    setGameState(syncedGameState);
    const saved = await gameStateService.saveGame(createSaveData(syncedGameState));
    syncNotifications(syncedGameState);
    // One warning per minute: a full phone fails every write, and an alert per tap would be worse.
    if (!saved && Date.now() - lastSaveWarningRef.current > 60_000) {
      lastSaveWarningRef.current = Date.now();
      const copy = getAppCopy(syncedGameState.settings.language);
      Alert.alert(copy.saveFailedTitle, copy.saveFailedBody);
    }
    return saved;
  };

  const handleAddTask = async (
    task: Task,
    customTemplate?: CustomTaskTemplate,
  ) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    const updated = applyTaskCreated(
      {
        ...gameState,
        tasks: [...gameState.tasks, task],
        customTaskTemplates: customTemplate
          ? upsertCustomTaskTemplate(
              gameState.customTaskTemplates,
              customTemplate,
            )
          : gameState.customTaskTemplates,
        lastPlayedAt: Date.now(),
      },
      task,
    );
    const companionCue = newCompanionAudioCue(gameState, updated);
    await persistGameState(updated);
    void playGrowraCue(companionCue ?? "task-added", gameState.settings.sfxEnabled);
  };

  const handleCompleteTask = async (taskId: string) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    const updated = completeTask(gameState, taskId);
    if (updated === gameState) return;
    await persistCompletion(gameState, updated);
  };

  /** Saves a completed task or shift and plays the moment's cue (the biggest milestone it reached wins). */
  const persistCompletion = async (gameState: GameState, updated: GameState) => {
    const companionCue = newCompanionAudioCue(gameState, updated);
    const tilesBefore = getRoadPosition(gameState.days).tiles;
    const tilesAfter = getRoadPosition(updated.days).tiles;
    const tileAdvanced = tilesAfter > tilesBefore;
    const playerLeveledUp = updated.level > gameState.level;
    await persistGameState(updated);
    const cue = companionCue ?? (
      tileAdvanced && tilesAfter % 28 === 0
        ? "region-unlock"
        : playerLeveledUp
          ? "player-level-up"
          : reachedStreakMilestone(gameState.streak.level, updated.streak.level)
            ? "streak-milestone"
          : tileAdvanced && tilesAfter % 7 === 0
            ? "camp-milestone"
            : tileAdvanced
              ? "journey-tile"
              : "task-complete"
    );
    void playGrowraCue(cue, gameState.settings.sfxEnabled);
    // A camp is a natural, happy moment: offer Play's review popup there (once per install),
    // after the camp cue has had a moment to play.
    if (reachedCamp(tilesBefore, tilesAfter)) setTimeout(() => void maybeAskForReview(), 1500);
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    const previousTask = gameState.tasks.find((task) => task.id === updatedTask.id);
    const updatedState = {
      ...gameState,
      tasks: gameState.tasks.map((task) =>
        task.id === updatedTask.id ? updatedTask : task,
      ),
      lastPlayedAt: Date.now(),
    };
    const nextState = previousTask
      ? applyTaskUpdated(updatedState, previousTask, updatedTask)
      : updatedState;
    const companionCue = newCompanionAudioCue(gameState, nextState);
    await persistGameState(nextState);
    if (previousTask) {
      void playGrowraCue(companionCue ?? "task-saved", gameState.settings.sfxEnabled);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    const deletedTask = gameState.tasks.find((task) => task.id === taskId);
    const remainingState = {
      ...gameState,
      tasks: gameState.tasks.filter((task) => task.id !== taskId),
      lastPlayedAt: Date.now(),
    };
    const nextState = deletedTask
      ? applyTaskDeleted(remainingState, deletedTask)
      : remainingState;
    const companionCue = newCompanionAudioCue(gameState, nextState);
    await persistGameState(nextState);
    if (deletedTask) {
      void playGrowraCue(companionCue ?? "task-removed", gameState.settings.sfxEnabled);
    }
  };

  const applyTimerUpdate = async (
    taskId: string,
    updater: (task: Task) => Task,
  ) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await persistGameState({
      ...gameState,
      tasks: gameState.tasks.map((task) =>
        task.id === taskId ? updater(task) : task,
      ),
      lastPlayedAt: Date.now(),
    });
  };

  const handleStartTimer = async (taskId: string) => {
    // The first timer start is the moment to ask; a refusal only means no background alert.
    await ensureNotificationPermission();
    await applyTimerUpdate(taskId, startTaskTimer);
    void playGrowraCue("timer-start", gameStateRef.current?.settings.sfxEnabled ?? false);
  };

  const handlePauseTimer = async (taskId: string) => {
    await applyTimerUpdate(taskId, pauseTaskTimer);
    void playGrowraCue("timer-pause", gameStateRef.current?.settings.sfxEnabled ?? false);
  };

  const handleResetTimer = async (taskId: string) => {
    await applyTimerUpdate(taskId, resetTaskTimer);
    void playGrowraCue("timer-reset", gameStateRef.current?.settings.sfxEnabled ?? false);
  };

  const handleTimerReady = async (taskId: string) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await applyTimerUpdate(taskId, finishTaskTimer);
    await playTimerAlert(gameState.settings.timerAlert);
  };

  const handleEquipPet = async (petId: string) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await persistGameState(equipPet(gameState, petId));
    void playGrowraCue("companion-switched", gameState.settings.sfxEnabled);
  };

  const handleChooseStarter = async (templateId: string) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await persistGameState(adoptStarter(gameState, templateId));
    void playGrowraCue("companion-greeting", gameState.settings.sfxEnabled);
  };

  const handleCloseCompanionReveal = async () => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await persistGameState({ ...gameState, companionEvents: [] });
    playUiTap();
  };

  const handleBuyDecoration = async (typeId: string) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    const updated = buyDecoration(gameState, typeId);
    await persistGameState(updated);
    if (updated !== gameState) void playGrowraCue("bought-with-coins", gameState.settings.sfxEnabled);
  };

  const handlePlaceDecoration = async (
    decorationId: string,
    camp: number,
    spot: number,
  ) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    const updated = placeDecoration(gameState, decorationId, camp, spot);
    await persistGameState(updated);
    if (updated !== gameState) void playGrowraCue("decoration-placed", gameState.settings.sfxEnabled);
  };

  const handleRemoveDecoration = async (decorationId: string) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    const updated = removeDecoration(gameState, decorationId);
    await persistGameState(updated);
    if (updated !== gameState) void playGrowraCue("ui-tap", gameState.settings.sfxEnabled);
  };

  const handleLanguageChange = async (language: AppLanguage) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await persistGameState({
      ...gameState,
      settings: {
        ...gameState.settings,
        language,
      },
    });
    // The reminder's text is written in the language at scheduling time.
    if (gameStateRef.current) syncNotifications(gameStateRef.current, true);
    void playGrowraCue("ui-tap", gameState.settings.sfxEnabled);
  };

  const handleSkipTutorial = async () => {
    const current = gameStateRef.current;
    setTutorialVisible(false);
    setTutorialCard(null);
    if (current) await persistGameState(skipTutorial(current));
  };

  // The tutorial ends when the player opens the Journey after choosing a companion: pay the
  // welcome gift and show the finish card.
  useEffect(() => {
    const current = gameStateRef.current;
    if (!current || !tutorialVisible || !shouldFinishTutorial(current, activeScreen)) return;
    setTutorialVisible(false);
    setTutorialCard("finish");
    void persistGameState(finishTutorial(current));
    void playGrowraCue("camp-milestone", current.settings.sfxEnabled);
  }, [activeScreen, gameState, tutorialVisible]);

  const handleDailyReminderChange = async (dailyReminder: GameState["settings"]["dailyReminder"]) => {
    const current = gameStateRef.current;
    if (!current) return;
    // Permission is asked only when the player turns the reminder on (owner decision, #39).
    if (dailyReminder.enabled && !current.settings.dailyReminder.enabled && !(await ensureNotificationPermission())) {
      const copy = getAppCopy(current.settings.language);
      Alert.alert(copy.settingsReminder, copy.settingsReminderDenied);
      return;
    }
    const latest = gameStateRef.current ?? current;
    const next = { ...latest, settings: { ...latest.settings, dailyReminder } };
    await persistGameState(next);
    syncNotifications(next, true);
  };

  const handleConfirmExitChange = async (confirmExit: boolean) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;
    await persistGameState({ ...gameState, settings: { ...gameState.settings, confirmExit } });
  };

  const handleTasksSectionChange = async (tasksSection: "choose" | "personal" | "work") => {
    const gameState = gameStateRef.current;
    if (!gameState) return;
    await persistGameState({ ...gameState, settings: { ...gameState.settings, tasksSection } });
  };

  const persistWorkItems = async (items: WorkItem[]) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;
    await persistGameState(upsertWorkItems(gameState, items));
  };

  const handleSaveWorkItem = async (item: WorkItem) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;
    const exists = gameState.workItems.some((candidate) => candidate.id === item.id);
    await persistWorkItems(
      exists ? gameState.workItems.map((candidate) => (candidate.id === item.id ? item : candidate)) : [...gameState.workItems, item],
    );
    void playGrowraCue(exists ? "task-saved" : "task-added", gameState.settings.sfxEnabled);
  };

  const handleEditWorkOccurrence = async (itemId: string, dateKey: string, fields: WorkItemFields, scope: WorkEditScope) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;
    const original = gameState.workItems.find((item) => item.id === itemId);
    if (!original) return;
    const occurrence = getOccurrencesBetween([original], dateKey, addDaysToKey(dateKey, 1))[0];
    // "Only this one" writes just what changed on that date; "following" carries all values into the new series.
    const change =
      scope === "one" && occurrence
        ? occurrenceChange(occurrence, fields)
        : { name: fields.name, description: fields.description, startMinutes: fields.startMinutes, endMinutes: fields.endMinutes };
    if (Object.keys(change).length === 0 && scope === "one") return;
    let continuedId: string | null = null;
    const edited = editOccurrence(gameState.workItems, itemId, dateKey, change, scope, () => (continuedId = generateId()));
    // "This and all following" may also change the colour and the repeat rule; an unchanged end rule keeps the
    // remaining count editOccurrence worked out.
    const endChanged = JSON.stringify(fields.end) !== JSON.stringify(original.end);
    const items = edited.map((item) =>
      item.id === continuedId
        ? { ...item, calendarColor: fields.calendarColor, repeat: fields.repeat, end: endChanged ? fields.end : item.end }
        : item,
    );
    await persistWorkItems(items);
    void playGrowraCue("task-saved", gameState.settings.sfxEnabled);
  };

  const handleDeleteWorkOccurrence = async (itemId: string, dateKey: string, scope: WorkEditScope) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;
    await persistWorkItems(deleteOccurrence(gameState.workItems, itemId, dateKey, scope));
    void playGrowraCue("task-removed", gameState.settings.sfxEnabled);
  };

  const handleCompleteWorkOccurrence = async (itemId: string, dateKey: string) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;
    const updated = completeWorkOccurrence(gameState, itemId, dateKey);
    if (updated === gameState) return;
    setWorkNow(Date.now());
    await persistCompletion(gameState, updated);
  };

  const handleWorkViewChange = async (workView: GameState["settings"]["workView"]) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;
    await persistGameState({ ...gameState, settings: { ...gameState.settings, workView } });
    playUiTap();
  };

  const handleTaskToolsOpenChange = async (taskToolsOpen: boolean) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;
    await persistGameState({ ...gameState, settings: { ...gameState.settings, taskToolsOpen } });
  };

  const handleAppearanceChange = async (appearance: AppAppearance) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;
    await persistGameState({ ...gameState, settings: { ...gameState.settings, appearance } });
  };

  const handleThemeChange = async (theme: AppThemeId) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await persistGameState({
      ...gameState,
      settings: {
        ...gameState.settings,
        theme,
      },
    });
    void playGrowraCue("theme-changed", gameState.settings.sfxEnabled);
  };

  const handleAudioPreferenceChange = async (
    key: "musicEnabled" | "sfxEnabled",
    enabled: boolean,
  ) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;
    await persistGameState({
      ...gameState,
      settings: { ...gameState.settings, [key]: enabled },
    });
    const tapEnabled = key === "sfxEnabled"
      ? enabled || gameState.settings.sfxEnabled
      : gameState.settings.sfxEnabled;
    void playGrowraCue("ui-tap", tapEnabled);
  };

  const handleTimerAlertModeChange = async (mode: TimerAlertMode) => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await persistGameState({
      ...gameState,
      settings: {
        ...gameState.settings,
        timerAlert: {
          ...gameState.settings.timerAlert,
          mode,
        },
      },
    });
    void playGrowraCue("ui-tap", gameState.settings.sfxEnabled);
  };

  const handlePickTimerAlertSound = async () => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    const pickedSound = await pickTimerAlertSound(
      gameState.settings.timerAlert.soundUri,
    );

    if (!pickedSound) {
      return;
    }

    await persistGameState({
      ...gameState,
      settings: {
        ...gameState.settings,
        timerAlert: {
          mode: "sound",
          soundName: pickedSound.soundName,
          soundUri: pickedSound.soundUri,
        },
      },
    });
    void playGrowraCue("ui-tap", gameState.settings.sfxEnabled);
  };

  const handleClearTimerAlertSound = async () => {
    const gameState = gameStateRef.current;
    if (!gameState) return;

    await removeStoredTimerAlertSound(gameState.settings.timerAlert.soundUri);

    await persistGameState({
      ...gameState,
      settings: {
        ...gameState.settings,
        timerAlert: {
          ...gameState.settings.timerAlert,
          mode: "vibration",
          soundName: "",
          soundUri: "",
        },
      },
    });
    void playGrowraCue("ui-tap", gameState.settings.sfxEnabled);
  };

  const handleExplore = async () => {
    const before = gameStateRef.current;
    // The ref, not exploreBusy, is the guard: state updates are async within a frame, so two taps
    // in the same batch both passed it. A Plus owner sees no ad, so without this they got two finds.
    if (!before || exploreBusyRef.current || getExploreLeft(before.explore, Date.now()) === 0) return;
    const copy = getAppCopy(before.settings.language);
    exploreBusyRef.current = true;
    setExploreBusy(true); // state only drives the button's busy look
    try {
      if (!before.plus.owned) {
        const result = await adsService.watchForReward();
        if (result !== "earned") {
          if (result === "unavailable") Alert.alert("🧭", copy.exploreNoAd);
          return;
        }
      }
      const current = gameStateRef.current ?? before;
      const { state, find } = grantExploreFind(current, Date.now(), Math.random());
      if (!find) return;
      await persistGameState(state);
      // "Sent off" first, then the find reveal once it has played (no overlap).
      void playGrowraCue("explore-sent", current.settings.sfxEnabled);
      setTimeout(() => void playGrowraCue("focus-find", current.settings.sfxEnabled), 900);
      const companion = getActiveCompanion(state);
      Alert.alert(
        "🧭",
        copy.exploreFound
          .replace("{name}", companion?.name ?? "Growra")
          .replace("{find}", copy.decorationNames[find.id] ?? find.id),
      );
    } finally {
      exploreBusyRef.current = false;
      setExploreBusy(false);
    }
  };

  const handleShareRoom = async (view: View, room: Room) => {
    const current = gameStateRef.current;
    if (!current) return;
    const copy = getAppCopy(current.settings.language);
    const owner = current.pets.find((pet) => pet.id === room.ownerPetId);
    try {
      await shareRoomPicture(view, buildRoomShareMessage(copy, owner?.name ?? null));
      void playGrowraCue("room-picture-shared", current.settings.sfxEnabled);
    } catch {
      Alert.alert("🏠", copy.roomShareError);
    }
  };

  const handleBuyPlus = async () => {
    const copy = getAppCopy(gameStateRef.current?.settings.language ?? "en");
    const result = await plus.buy();
    if (result === "purchased") {
      void playGrowraCue("plus-unlocked", gameStateRef.current?.settings.sfxEnabled ?? false);
      Alert.alert(copy.plusTitle, copy.plusThanks);
    }
    if (result === "pending") Alert.alert(copy.plusTitle, copy.plusPending);
    if (result === "error") Alert.alert(copy.plusTitle, copy.plusError);
    if (result === "unavailable") Alert.alert(copy.plusTitle, copy.plusUnavailable);
  };

  const handleRestorePlus = async () => {
    const copy = getAppCopy(gameStateRef.current?.settings.language ?? "en");
    const result = await plus.restore();
    if (result === "owned") void playGrowraCue("plus-unlocked", gameStateRef.current?.settings.sfxEnabled ?? false);
    Alert.alert(
      copy.plusTitle,
      result === "owned" ? copy.plusRestored : result === "not-owned" ? copy.plusNotFound : copy.plusUnavailable,
    );
  };

  const handleExportCsv = async () => {
    const current = gameStateRef.current;
    if (!current?.plus.owned) return;
    const copy = getAppCopy(current.settings.language);
    // One share sheet per tap: the player picks which file, instead of a second sheet
    // opening as soon as the first closes.
    const share = async (name: string, contents: string) => {
      try {
        const file = new File(Paths.cache, name);
        file.write(contents);
        await Sharing.shareAsync(file.uri, { mimeType: "text/csv", dialogTitle: name });
      } catch (error) {
        console.error("CSV export failed:", error);
        Alert.alert(copy.settingsExportCsv, copy.csvExportError);
      }
    };
    Alert.alert(copy.settingsExportCsv, copy.csvExportChoose, [
      { text: copy.csvExportTasks, onPress: () => void share("growra-tasks.csv", buildTasksCsv(current.tasks)) },
      {
        text: copy.csvExportCompletions,
        onPress: () => void share("growra-completions.csv", buildCompletionsCsv(current.days)),
      },
      { text: copy.addTaskCancel, style: "cancel" },
    ]);
  };

  const handleExportData = async (): Promise<string> => {
    if (!gameState) {
      return "";
    }

    return gameStateService.exportSaveCode(createSaveData(gameState));
  };

  const handleImportData = async (backupCode: string) => {
    const importedSaveData = gameStateService.importSaveCode(backupCode);
    const current = gameStateRef.current;
    // The save being replaced stays on the phone, like a corrupt one, so an import can be undone.
    await gameStateService.snapshotBeforeOverwrite();
    // Plus ownership belongs to this device's Play account, never to a backup code.
    const saved = await persistGameState(
      current ? keepPlusOnImport(importedSaveData.gameState, current) : importedSaveData.gameState,
    );
    playUiTap();
    void plus.restore();
    return saved;
  };

  if (newerSaveLanguage !== null) {
    const copy = getAppCopy(newerSaveLanguage === "pt" ? "pt" : "en");
    const theme = getAppTheme("mint");
    return (
      <View style={[styles.container, styles.newerSave, { backgroundColor: theme.background }]}>
        <Text style={[styles.newerSaveTitle, { color: theme.text }]}>{copy.saveNewerTitle}</Text>
        <Text style={[styles.newerSaveBody, { color: theme.mutedText }]}>{copy.saveNewerBody}</Text>
        <TouchableOpacity
          style={[styles.newerSaveButton, { backgroundColor: theme.accent }]}
          onPress={() => void openStoreListing()}
          accessibilityRole="button"
        >
          <Text style={[styles.newerSaveButtonText, { color: theme.accentText }]}>{copy.saveNewerUpdate}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading || !gameState) {
    return <View className="flex-1" style={styles.container} />;
  }

  const isPlus = gameState.plus.owned;
  const appTheme = getAppTheme(resolveTheme(gameState.settings.theme, isPlus));
  const viewState = withResolvedTheme(gameState);

  const renderScreen = () => {
    switch (activeScreen) {
      case "dashboard":
        return (
          <DashboardScreen
            gameState={viewState}
            tutorialLocked={tutorialStep !== "done"}
            onAddTask={handleAddTask}
            onCompleteTask={handleCompleteTask}
            onOpenSettings={() => {
              setSettingsVisible(true);
              playUiTap();
            }}
            onUiTap={playUiTap}
            onStartTimer={handleStartTimer}
            onPauseTimer={handlePauseTimer}
            onResetTimer={handleResetTimer}
            onTimerReady={handleTimerReady}
            returnRecap={returnRecap}
            onDismissReturnRecap={() => {
              setReturnRecap(null);
              playUiTap();
            }}
            backupNudgeVisible={backupNudgeVisible}
            onShareBackup={() => {
              setBackupNudgeVisible(false);
              playUiTap();
              void handleExportData().then((code) => {
                if (code) void Share.share({ message: code }).catch(() => undefined);
              });
            }}
            onDismissBackupNudge={() => {
              setBackupNudgeVisible(false);
              playUiTap();
            }}
          />
        );
      case "tasks": {
        // The tutorial always works in Personal, whatever section is remembered.
        const section = tutorialStep !== "done" ? "personal" : viewState.settings.tasksSection;
        if (section === "choose") {
          const now = Date.now();
          return (
            <TasksChooser
              settings={viewState.settings}
              personalCount={getTodayTasks(gameState.tasks, now).length}
              workPreview={buildWorkPreview(gameState.workItems, now, viewState.settings)}
              onChoose={(choice) => {
                playUiTap();
                void handleTasksSectionChange(choice);
              }}
            />
          );
        }
        if (section === "work") {
          return (
            <WorkScreen
              gameState={viewState}
              settings={viewState.settings}
              now={workNow}
              onBackToChooser={() => void handleTasksSectionChange("choose")}
              onSaveItem={(item) => void handleSaveWorkItem(item)}
              onEditOccurrence={(itemId, dateKey, fields, scope) => void handleEditWorkOccurrence(itemId, dateKey, fields, scope)}
              onDeleteOccurrence={(itemId, dateKey, scope) => void handleDeleteWorkOccurrence(itemId, dateKey, scope)}
              onCompleteOccurrence={(itemId, dateKey) => void handleCompleteWorkOccurrence(itemId, dateKey)}
              onSetView={(view) => void handleWorkViewChange(view)}
            />
          );
        }
        return (
          <TasksScreen
            onBackToChooser={
              tutorialStep === "done" ? () => void handleTasksSectionChange("choose") : undefined
            }
            settings={viewState.settings}
            tasks={gameState.tasks}
            customTaskTemplates={gameState.customTaskTemplates}
            tutorialTarget={
              !tutorialVisible
                ? null
                : tutorialStep === "tap-add-task"
                  ? "add-button"
                  : tutorialStep === "confirm-task-add"
                    ? "modal-submit"
                    : tutorialStep === "complete-task"
                      ? "task-complete"
                      : null
            }
            onTutorialStateChange={setTaskTutorialUiState}
            onAddTask={handleAddTask}
            onCompleteTask={handleCompleteTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onOpenCalendar={() => handleNavigate("task-calendar")}
            onTaskToolsOpenChange={(open) => void handleTaskToolsOpenChange(open)}
            onUiTap={playUiTap}
            onStartTimer={handleStartTimer}
            onPauseTimer={handlePauseTimer}
            onResetTimer={handleResetTimer}
            onTimerReady={handleTimerReady}
          />
        );
      }
      case "task-calendar":
        return (
          <TaskCalendarScreen
            settings={viewState.settings}
            tasks={gameState.tasks}
            onBack={() => handleNavigate("tasks")}
          />
        );
      case "journey":
        return (
          <JourneyScreen
            gameState={viewState}
            settings={viewState.settings}
            onBuyDecoration={handleBuyDecoration}
            onPlaceDecoration={handlePlaceDecoration}
            onRemoveDecoration={handleRemoveDecoration}
            isPlus={isPlus}
            exploreBusy={exploreBusy}
            onExplore={handleExplore}
            onOpenPlus={openPlus}
            onUiTap={playUiTap}
          />
        );
      case "companions":
        return (
          <CompanionsScreen
            gameState={viewState}
            settings={viewState.settings}
            tutorialMode={tutorialStep === "choose-companion" ? "choose" : null}
            onChooseStarter={handleChooseStarter}
            onEquipPet={handleEquipPet}
            onUiTap={playUiTap}
            isPlus={isPlus}
            exploreBusy={exploreBusy}
            onExplore={handleExplore}
            onOpenRoom={(roomId) => {
              setRoomEditorId(roomId);
              playUiTap();
            }}
            onOpenPlus={openPlus}
          />
        );
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar style={darkMode ? "light" : "dark"} />
      <View
        className="flex-1"
        style={[styles.container, { backgroundColor: appTheme.background }]}
      >
        {renderScreen()}
        <BottomNavigation
          activeScreen={
            activeScreen === "task-calendar" ? "tasks" : activeScreen
          }
          onNavigate={handleNavigate}
          settings={viewState.settings}
          tutorialTarget={
            !tutorialVisible
              ? null
              : tutorialStep === "open-tasks" ||
                  tutorialStep === "tap-add-task" ||
                  tutorialStep === "confirm-task-add" ||
                  tutorialStep === "complete-task"
                ? "tasks"
                : tutorialStep === "open-realm" || tutorialStep === "choose-companion"
                  ? "companions"
                  : tutorialStep === "open-journey"
                    ? "journey"
                    : null
          }
        />
        <SettingsModal
          visible={settingsVisible}
          gameState={viewState}
          onClose={() => {
            setSettingsVisible(false);
            playUiTap();
          }}
          onLanguageChange={handleLanguageChange}
          onThemeChange={handleThemeChange}
          onAppearanceChange={handleAppearanceChange}
          onConfirmExitChange={handleConfirmExitChange}
          onDailyReminderChange={(reminder) => void handleDailyReminderChange(reminder)}
          onReplayTutorial={() => {
            setSettingsVisible(false);
            setTutorialCard("tour");
          }}
          onAudioPreferenceChange={handleAudioPreferenceChange}
          onTimerAlertModeChange={handleTimerAlertModeChange}
          onPickTimerAlertSound={handlePickTimerAlertSound}
          onClearTimerAlertSound={handleClearTimerAlertSound}
          onExportData={handleExportData}
          onImportData={handleImportData}
          isPlus={isPlus}
          onOpenPlus={openPlus}
          onExportCsv={handleExportCsv}
          adConsentAvailable={adConsentAvailable}
          onAdConsent={() => void adsService.changeConsent()}
        />
        {roomEditorId && (
          <RoomEditorScreen
            state={viewState}
            roomId={roomEditorId}
            onChange={(update) => {
              const current = gameStateRef.current;
              if (current) void persistGameState(update(current));
            }}
            onClose={() => {
              setRoomEditorId(null);
              playUiTap();
            }}
            onOpenPlus={openPlus}
            onShare={handleShareRoom}
            onCoinPurchase={() => void playGrowraCue("bought-with-coins", gameStateRef.current?.settings.sfxEnabled ?? false)}
            onUiTap={playUiTap}
          />
        )}
        <UpdatePrompt
          settings={viewState.settings}
          state={appUpdate.state}
          progress={appUpdate.progress}
          controller={appUpdate.controller}
        />
        <WhatsNewModal
          notes={whatsNew}
          version={APP_VERSION}
          settings={viewState.settings}
          onClose={(hideUntilNextUpdate) => {
            setWhatsNew(null);
            playUiTap();
            const current = gameStateRef.current;
            if (hideUntilNextUpdate && current) void persistGameState({ ...current, whatsNewHiddenFor: APP_VERSION });
          }}
        />
        <GrowraPlusModal
          visible={plusVisible}
          settings={viewState.settings}
          isPlus={isPlus}
          price={plus.price}
          busy={plus.busy}
          onBuy={handleBuyPlus}
          onRestore={handleRestorePlus}
          onClose={() => {
            setPlusVisible(false);
            playUiTap();
          }}
        />
        <TutorialOverlay
          visible={tutorialVisible && tutorialStep !== "done" && tutorialCard === null}
          step={tutorialStep}
          settings={viewState.settings}
          onSkip={handleSkipTutorial}
        />
        <TutorialCards
          mode={tutorialCard}
          settings={viewState.settings}
          onStart={() => {
            setTutorialCard(null);
            setTutorialVisible(true);
            playUiTap();
          }}
          onSkip={handleSkipTutorial}
          onClose={() => {
            setTutorialCard(null);
            playUiTap();
          }}
        />
        <CompanionRevealModal
          visible={gameState.companionEvents.length > 0}
          settings={viewState.settings}
          events={gameState.companionEvents}
          pets={gameState.pets}
          onClose={handleCloseCompanionReveal}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  newerSave: { justifyContent: "center", padding: 24, gap: 12 },
  newerSaveTitle: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  newerSaveBody: { fontSize: 15, lineHeight: 21, textAlign: "center", marginBottom: 8 },
  newerSaveButton: { minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  newerSaveButtonText: { fontSize: 16, fontWeight: "700" },
});
