import { AppLanguage } from "../types";
import type { CompanionMood, CompanionStyle } from "../utils/companions";
import type { TileFeature } from "../utils/journey";
import type { Holiday, Season } from "../utils/seasons";
import type { RoomCodeError } from "../utils/roomCode";

interface CompanionStyleCopy {
  loves: string;
  perk: string;
  /** How it joins; {target} is the goal from utils/companions.ts. */
  joins: string;
}

interface AppCopy {
  navDashboard: string;
  navTasks: string;
  navJourney: string;
  navCompanions: string;
  dashboardToday: string;
  dashboardPendingTasks: string;
  dashboardRewardMultiplier: string;
  dashboardProgress: string;
  dashboardCoins: string;
  dashboardPlayerLevel: string;
  dashboardTotalXp: string;
  dashboardEquippedPet: string;
  dashboardNoPetEquipped: string;
  dashboardRarity: string;
  dashboardExperience: string;
  dashboardTaskBonus: string;
  dashboardStreak: string;
  dashboardCurrentStreak: string;
  dashboardTasks: string;
  dashboardSystemTasks: string;
  dashboardCompleted: string;
  dashboardAllTimeCompleted: string;
  dashboardTodayList: string;
  dashboardNoTasksYet: string;
  dashboardSettings: string;
  tasksTitle: string;
  tasksBackToChooser: string;
  tasksChooserTitle: string;
  tasksChoosePersonal: string;
  tasksChooseWork: string;
  tasksChoosePersonalCount: string;
  tasksChooseWorkShift: string;
  tasksChooseWorkNone: string;
  tasksChooseWorkSetup: string;
  workTitle: string;
  tasksChooseWorkNoMore: string;
  workEmptyTitle: string;
  workEmptyBody: string;
  workEmptyAdd: string;
  workAdd: string;
  workCalendar: string;
  workViewDay: string;
  workViewWeek: string;
  workToday: string;
  workPrevious: string;
  workNext: string;
  workNoShiftsDay: string;
  workDone: string;
  workMarkDone: string;
  workNow: string;
  workFormNewTitle: string;
  workFormEditTitle: string;
  workFormSave: string;
  workFormName: string;
  workFormNamePlaceholder: string;
  workFormNameMissing: string;
  workFormDescriptionPlaceholder: string;
  workFormStartTime: string;
  workFormEndTime: string;
  workFormTimeInvalid: string;
  workFormOvernight: string;
  workFormStartsOn: string;
  workFormRepeat: string;
  workRepeatNone: string;
  workRepeatDaily: string;
  workRepeatEveryDays: string;
  workRepeatWeekly: string;
  workRepeatEveryWeeks: string;
  workRepeatMonthly: string;
  workFormEvery: string;
  workFormDays: string;
  workFormWeeks: string;
  workFormOnDays: string;
  workFormEndsRule: string;
  workEndsNever: string;
  workEndsCount: string;
  workEndsUntil: string;
  workFormTimes: string;
  workFormNumberInvalid: string;
  workFormUntilInvalid: string;
  workScopeEditTitle: string;
  workScopeEditBody: string;
  workScopeDeleteTitle: string;
  workScopeDeleteBody: string;
  workScopeOne: string;
  workScopeFollowing: string;
  workScopeRuleHint: string;
  tasksActiveToday: string;
  tasksAdd: string;
  tasksFilterAll: string;
  tasksFilterActive: string;
  tasksFilterUpcoming: string;
  tasksFilterCompleted: string;
  tasksCalendar: string;
  tasksCalendarBack: string;
  tasksCalendarNoActivity: string;
  tasksCalendarScheduled: string;
  tasksCalendarCompletedLegend: string;
  tasksCalendarMixed: string;
  tasksQuickAddPlaceholder: string;
  tasksQuickAddSubmit: string;
  tasksQuickAddAccessibilityLabel: string;
  tasksDetails: string;
  tasksSave: string;
  tasksDelete: string;
  tasksPriority: string;
  tasksPriorityLow: string;
  tasksDuration: string;
  tasksDurationNone: string;
  tasksDurationMinutesUnit: string;
  tasksDurationHoursUnit: string;
  tasksPriorityMedium: string;
  tasksPriorityHigh: string;
  tasksCalendarColor: string;
  tasksOpenDetails: string;
  tasksCategory: string;
  /** Shown in place of a category when a task was saved without one (category is optional). */
  taskCategoryNone: string;
  tasksSearchPlaceholder: string;
  tasksToolsShow: string;
  tasksToolsHide: string;
  tasksSelectedDay: string;
  tasksNoTasksOnDay: string;
  tasksStartsOn: string;
  tasksEmptyTitle: string;
  tasksEmptySubtitle: string;
  addTaskTitle: string;
  addTaskCancel: string;
  addTaskConfirm: string;
  addTaskType: string;
  addTaskCustom: string;
  addTaskPredefined: string;
  addTaskName: string;
  addTaskDescription: string;
  addTaskChooseSystemTask: string;
  addTaskFrequency: string;
  addTaskTimer: string;
  addTaskDate: string;
  addTaskDaysAhead: string;
  addTaskOnce: string;
  addTaskDaily: string;
  addTaskWeekly: string;
  addTaskCategory: string;
  addTaskCategoryPlaceholder: string;
  addTaskSavedCategories: string;
  addTaskSaveTemplate: string;
  addTaskSaveTemplateHelp: string;
  addTaskSavedCustomTasks: string;
  addTaskNamePlaceholder: string;
  addTaskDescriptionPlaceholder: string;
  /** Why Add did nothing: the task has no name yet (the only thing still required). */
  addTaskNameMissing: string;
  petsTitle: string;
  petsCoinsPity: string;
  petsDetailTitle: string;
  petsDetailClose: string;
  petsSummonRevealClose: string;
  petsSummonRevealPrevious: string;
  petsSummonRevealNext: string;
  petsEvolution: string;
  petsTaskBonus: string;
  petsMaxEvolution: string;
  petsEvolutionBase: string;
  petsEvolutionEvolved: string;
  petsEvolutionAscended: string;
  petsActive: string;
  settingsTitle: string;
  settingsLanguage: string;
  settingsTheme: string;
  settingsAppearance: string;
  settingsAppearanceSystem: string;
  settingsAppearanceLight: string;
  settingsAppearanceDark: string;
  settingsStats: string;
  settingsClose: string;
  settingsTotalTasks: string;
  settingsUncompletedTasks: string;
  settingsTodayActiveTasks: string;
  settingsTotalPets: string;
  settingsEvolvedPets: string;
  settingsEquippedPet: string;
  settingsLanguageEnglish: string;
  settingsLanguagePortuguese: string;
  settingsTimerAlert: string;
  settingsTimerAlertVibration: string;
  settingsTimerAlertSound: string;
  settingsTimerAlertChooseSound: string;
  settingsTimerAlertClearSound: string;
  settingsTimerAlertNoSound: string;
  settingsBackup: string;
  settingsBackupHelp: string;
  settingsBackupPlaceholder: string;
  settingsExport: string;
  settingsImport: string;
  settingsViewChangelog: string;
  settingsHideChangelog: string;
  settingsBackupExported: string;
  settingsBackupImported: string;
  settingsBackupInvalid: string;
  crashTitle: string;
  crashBody: string;
  crashRestart: string;
  crashShareBackup: string;
  saveCorruptTitle: string;
  saveCorruptBody: string;
  saveCorruptShare: string;
  saveFailedTitle: string;
  saveFailedBody: string;
  saveNewerTitle: string;
  saveNewerBody: string;
  saveNewerUpdate: string;
  settingsBackupNewer: string;
  importConfirmTitle: string;
  importConfirmBody: string;
  importConfirmReplace: string;
  settingsChangelog: string;
  settingsUpdatedOn: string;
  tutorialSkip: string;
  tutorialStepLabel: string;
  tutorialOpenJourney: string;
  tutorialWelcomeTitle: string;
  tutorialWelcomeBody: string;
  tutorialWelcomePoint1: string;
  tutorialWelcomePoint2: string;
  tutorialWelcomePoint3: string;
  tutorialTipCalendar: string;
  tutorialTipJourney: string;
  tutorialTipCompanions: string;
  tutorialTipSettings: string;
  tutorialTourTitle: string;
  tutorialTourBody: string;
  tutorialFinishBody: string;
  tutorialFinishGift: string;
  tutorialStart: string;
  tutorialLetsGo: string;
  tutorialSkipAll: string;
  settingsReplayTutorial: string;
  tutorialNext: string;
  tutorialFinish: string;
  tutorialGuideTitle: string;
  tutorialGuideSubtitle: string;
  tutorialCreateTaskTitle: string;
  tutorialCreateTaskHint: string;
  tutorialChoosePredefinedTaskHint: string;
  tutorialChooseWaterTaskHint: string;
  tutorialConfirmTaskAddHint: string;
  tutorialCompleteTaskTitle: string;
  tutorialCompleteTaskHint: string;
  tutorialOpenTasks: string;
  tutorialOpenRealm: string;
  tutorialRewardTitle: string;
  tutorialStep1Title: string;
  tutorialStep1Body: string;
  tutorialStep2Title: string;
  tutorialStep2Body: string;
  companionsMigratedTitle: string;
  companionsMigratedBody: string;
  companionChooseTitle: string;
  companionChooseSubtitle: string;
  companionChoose: string;
  companionBond: string;
  companionNextEvolution: string;
  companionLoves: string;
  companionPerk: string;
  companionTakeAlong: string;
  companionNotMet: string;
  companionDaysTogether: string;
  companionJoinedTitle: string;
  companionEvolvedTitle: string;
  companionRevealSubtitle: string;
  companionMood: Record<CompanionMood, string>;
  /** The mood lines during Halloween and Christmas. */
  companionSeasonMood: Record<Season, Record<CompanionMood, string>>;
  /** Greetings on the day itself (shown instead of the mood line, unless the companion is asleep). */
  companionHolidayGreeting: Record<Holiday, string>;
  /** Companion encouragement while a work shift runs, by stage; each line holds the {name} placeholder. */
  shiftLinesStart: string[];
  shiftLinesMiddle: string[];
  shiftLinesLastHour: string[];
  companionStyles: Record<CompanionStyle, CompanionStyleCopy>;
  /** Companion descriptions by companion id; a missing entry falls back to the English original in utils/gameplay.ts. */
  companionBios: Partial<Record<string, string>>;
  dashboardActiveDays: string;
  welcomeBackNamed: string;
  welcomeBack: string;
  returnRecapLine: string;
  returnRecapFocus: string;
  welcomeBackDismiss: string;
  backupNudgeTitle: string;
  backupNudgeBody: string;
  backupNudgeShare: string;
  backupNudgeDismiss: string;
  whatsNewTitle: string;
  whatsNewNew: string;
  whatsNewFixed: string;
  whatsNewClose: string;
  whatsNewHide: string;
  tutorialChooseCompanionHint: string;
  companionFoundTitle: string;
  companionFoundSubtitle: string;
  journeyTitle: string;
  journeySeason: string;
  journeyProgress: string;
  journeyEmpty: string;
  journeyNextTile: string;
  journeyTodayDone: string;
  journeyCamp: string;
  journeyRegion: string;
  journeyDecorations: string;
  journeyShop: string;
  journeyBag: string;
  journeyBagEmpty: string;
  journeyBuy: string;
  journeyFoundOnly: string;
  journeyEmptySpot: string;
  journeyPlaceHere: string;
  journeyPutBack: string;
  journeyChooseForSpot: string;
  journeyLookBack: string;
  journeyLookBackDone: string;
  journeyLookBackBusiest: string;
  journeyLookBackTop: string;
  journeyDayDone: string;
  journeyDayMore: string;
  journeyClose: string;
  journeyMigratedTitle: string;
  journeyMigratedBody: string;
  tileFeatures: Record<TileFeature, string>;
  regionHints: string[];
  decorationNames: Record<string, string>;
  roomShareMessage: string;
  roomShareMessagePlus: string;
  roomShareFooter: string;
  roomShareFooterToggle: string;
  roomShareError: string;
  roomButton: string;
  roomDefaultName: string;
  plusRoomName: string;
  plusRoomsTitle: string;
  plusRoomsUnlock: string;
  roomDone: string;
  roomShare: string;
  roomRename: string;
  roomTabDecorations: string;
  roomTabCompanions: string;
  roomTabStyle: string;
  roomTabShop: string;
  roomFull: string;
  roomBagEmpty: string;
  roomFlip: string;
  roomForward: string;
  roomBack: string;
  roomRemove: string;
  roomUndo: string;
  roomMore: string;
  roomShareCode: string;
  roomCodeShareMessage: string;
  roomCopy: string;
  roomCopyHint: string;
  roomCopyConfirmTitle: string;
  roomCopyConfirmBody: string;
  roomCopyReplace: string;
  roomCopyCancel: string;
  roomCodeErrors: Record<RoomCodeError, string>;
  roomCopyDoneTitle: string;
  roomCopyAllThere: string;
  roomCopyNeed: string;
  roomCopyUnmet: string;
  roomCopyStyle: string;
  roomGhostPlace: string;
  roomGhostInRoom: string;
  roomGhostNotOwned: string;
  roomShopStyles: string;
  roomShopFurniture: string;
  roomShopPlusSets: string;
  roomShopOwned: string;
  roomShopBuy: string;
  roomShopNeedsPlus: string;
  roomShopReturns: string;
  roomSetNames: Record<string, string>;
  roomStyleNames: Record<string, string>;
  settingsAdConsent: string;
  settingsPrivacy: string;
  settingsRateApp: string;
  settingsOptionalAudio: string;
  settingsAmbientMusic: string;
  settingsAppSounds: string;
  tasksConfirmDelete: string;
  settingsConfirmExit: string;
  notifyTimerTitle: string;
  notifyTimerBody: string;
  notifyTimerChannel: string;
  reminderTitle: string;
  reminderBody: string;
  reminderChannel: string;
  settingsReminder: string;
  settingsReminderHelp: string;
  settingsReminderDenied: string;
  settingsReminderEarlier: string;
  settingsReminderLater: string;
  settingsOn: string;
  settingsOff: string;
  exitTitle: string;
  exitMessage: string;
  exitLeave: string;
  exitStay: string;
  exploreButton: string;
  exploreAdHint: string;
  explorePlusHint: string;
  exploreDone: string;
  exploreFound: string;
  exploreNoAd: string;
  journeyLookBackLocked: string;
  plusTitle: string;
  updateAvailableTag: string;
  updateAvailableTitle: string;
  updateAvailableBody: string;
  updateDownloading: string;
  updateHideBanner: string;
  updateReadyTag: string;
  updateReadyTitle: string;
  updateReadyBody: string;
  updateRequiredTag: string;
  updateRequiredTitle: string;
  updateRequiredBody: string;
  updateButton: string;
  updateNowButton: string;
  updateRestartButton: string;
  updateLaterButton: string;
  plusPitch: string;
  plusPerkThemes: string;
  plusPerkHistory: string;
  plusPerkExport: string;
  plusPerkNoAds: string;
  plusBuy: string;
  plusUnavailable: string;
  plusRestore: string;
  plusThanks: string;
  plusPending: string;
  plusError: string;
  plusRestored: string;
  plusNotFound: string;
  plusOwned: string;
  plusBadge: string;
  settingsPlus: string;
  settingsExportCsv: string;
  csvExportChoose: string;
  csvExportTasks: string;
  csvExportCompletions: string;
  csvExportWork: string;
  calendarShowBoth: string;
  calendarWorkMarker: string;
  workCalendarTitle: string;
  csvExportError: string;
  timerLabel: string;
  taskStatusPending: string;
  taskStatusCompleted: string;
  timerStart: string;
  timerPause: string;
  timerResume: string;
  timerReset: string;
  timerStateRunning: string;
  timerStatePaused: string;
  timerStateReady: string;
  timerStateIdle: string;
}

const copyByLanguage: Record<AppLanguage, AppCopy> = {
  en: {
    navDashboard: "Dashboard",
    navTasks: "Tasks",
    navJourney: "Journey",
    // Short on purpose: the bottom bar has no room for "Companions" on 360 px phones.
    navCompanions: "Pets",
    dashboardToday: "Today",
    dashboardPendingTasks: "pending tasks",
    dashboardRewardMultiplier: "reward multiplier",
    dashboardProgress: "Progress",
    dashboardCoins: "Coins",
    dashboardPlayerLevel: "Player Level",
    dashboardTotalXp: "Total XP",
    dashboardEquippedPet: "Equipped Pet",
    dashboardNoPetEquipped: "No pet equipped",
    dashboardRarity: "Rarity",
    dashboardExperience: "Experience",
    dashboardTaskBonus: "Task bonus",
    dashboardStreak: "Streak",
    dashboardCurrentStreak: "Current Streak",
    dashboardTasks: "Tasks",
    dashboardSystemTasks: "System tasks",
    dashboardCompleted: "Completed",
    dashboardAllTimeCompleted: "All-time completed",
    dashboardTodayList: "Today List",
    dashboardNoTasksYet: "No tasks yet",
    dashboardSettings: "Settings",
    tasksTitle: "Tasks",
    tasksBackToChooser: "‹ Tasks",
    tasksChooserTitle: "Tasks",
    tasksChoosePersonal: "Personal",
    tasksChooseWork: "Work",
    tasksChoosePersonalCount: "active today",
    tasksChooseWorkShift: "Shift",
    tasksChooseWorkNone: "No shifts today",
    tasksChooseWorkSetup: "Set up your work schedule",
    workTitle: "Work",
    tasksChooseWorkNoMore: "No more shifts today",
    workEmptyTitle: "Your work schedule",
    workEmptyBody: "Add your shifts and meetings, one-off or repeating. Tick a shift off once you've worked it, and your companion cheers you on while it runs.",
    workEmptyAdd: "Add your first shift",
    workAdd: "+ Add",
    workCalendar: "Calendar",
    workViewDay: "Day",
    workViewWeek: "Week",
    workToday: "Today",
    workPrevious: "Previous",
    workNext: "Next",
    workNoShiftsDay: "No shifts this day",
    workDone: "Done",
    workMarkDone: "Mark as worked",
    workNow: "Now",
    workFormNewTitle: "New shift",
    workFormEditTitle: "Edit shift",
    workFormSave: "Save",
    workFormName: "Name",
    workFormNamePlaceholder: "e.g. Morning shift, Ward 3",
    workFormNameMissing: "Give the shift a name.",
    workFormDescriptionPlaceholder: "Notes (optional)",
    workFormStartTime: "Starts at",
    workFormEndTime: "Ends at",
    workFormTimeInvalid: "Write the time as HH:MM, e.g. 07:00.",
    workFormOvernight: "Ends the next day",
    workFormStartsOn: "First day: {date}",
    workFormRepeat: "Repeat",
    workRepeatNone: "Doesn't repeat",
    workRepeatDaily: "Every day",
    workRepeatEveryDays: "Every X days",
    workRepeatWeekly: "Weekly",
    workRepeatEveryWeeks: "Every X weeks",
    workRepeatMonthly: "Monthly",
    workFormEvery: "Every",
    workFormDays: "days",
    workFormWeeks: "weeks",
    workFormOnDays: "On these days",
    workFormEndsRule: "Stops repeating",
    workEndsNever: "Never",
    workEndsCount: "After N times",
    workEndsUntil: "On a date",
    workFormTimes: "times",
    workFormNumberInvalid: "Use a whole number, 1 or more.",
    workFormUntilInvalid: "The end date is before the first day.",
    workScopeEditTitle: "This shift repeats",
    workScopeEditBody: "Change only this one, or this and all the following ones?",
    workScopeDeleteTitle: "Delete a repeating shift",
    workScopeDeleteBody: "Delete only this one, or this and all the following ones?",
    workScopeOne: "Only this one",
    workScopeFollowing: "This and all following",
    workScopeRuleHint: "Colour and repeat changes apply to this and all following.",
    tasksActiveToday: "active today",
    tasksAdd: "+ Add",
    tasksFilterAll: "All",
    tasksFilterActive: "Active",
    tasksFilterUpcoming: "Upcoming",
    tasksFilterCompleted: "Completed",
    tasksCalendar: "Calendar",
    tasksCalendarBack: "Back",
    tasksCalendarNoActivity: "No task activity in this month.",
    tasksCalendarScheduled: "Scheduled",
    tasksCalendarCompletedLegend: "Completed",
    tasksCalendarMixed: "Scheduled + done",
    tasksQuickAddPlaceholder: "Add a task for today",
    tasksQuickAddSubmit: "Add",
    tasksQuickAddAccessibilityLabel: "Add task for today",
    tasksDetails: "Task Details",
    tasksSave: "Save",
    tasksDelete: "Delete",
    tasksPriority: "Priority",
    tasksPriorityLow: "Low",
    tasksDuration: "How long?",
    tasksDurationNone: "None",
    tasksDurationMinutesUnit: "min",
    tasksDurationHoursUnit: "h",
    tasksPriorityMedium: "Medium",
    tasksPriorityHigh: "High",
    tasksCalendarColor: "Calendar Color",
    tasksOpenDetails: "Open Details",
    tasksCategory: "Category",
    taskCategoryNone: "Uncategorised",
    tasksSearchPlaceholder: "Search tasks",
    tasksToolsShow: "Show search and quick add",
    tasksToolsHide: "Hide search and quick add",
    tasksSelectedDay: "Selected Day",
    tasksNoTasksOnDay: "No tasks on this day.",
    tasksStartsOn: "Starts",
    tasksEmptyTitle: "No tasks to display",
    tasksEmptySubtitle: "Create your first task to get started",
    addTaskTitle: "Add Task",
    addTaskCancel: "Cancel",
    addTaskConfirm: "Add",
    addTaskType: "Task Type",
    addTaskCustom: "Custom",
    addTaskPredefined: "Predefined",
    addTaskName: "Task Name",
    addTaskDescription: "Description",
    addTaskChooseSystemTask: "Choose a system task",
    addTaskFrequency: "Frequency",
    addTaskTimer: "Timer",
    addTaskDate: "Start Date",
    addTaskDaysAhead: "Days ahead",
    addTaskOnce: "Once",
    addTaskDaily: "Daily",
    addTaskWeekly: "Weekly",
    addTaskCategory: "Category",
    addTaskCategoryPlaceholder: "Enter category",
    addTaskSavedCategories: "Saved categories",
    addTaskSaveTemplate: "Save for later",
    addTaskSaveTemplateHelp: "Stores this custom task and category as a reusable template you can pick again later.",
    addTaskSavedCustomTasks: "Saved custom tasks",
    addTaskNamePlaceholder: "Enter task name",
    addTaskDescriptionPlaceholder: "Enter task description (optional)",
    addTaskNameMissing: "Give the task a name first. Everything else is optional.",
    petsTitle: "Companions",
    petsCoinsPity: "coins",
    petsDetailTitle: "Companion",
    petsDetailClose: "Close",
    petsSummonRevealClose: "Close",
    petsSummonRevealPrevious: "Previous",
    petsSummonRevealNext: "Next",
    petsEvolution: "Evolution",
    petsTaskBonus: "Task bonus",
    petsMaxEvolution: "Max evolution reached",
    petsEvolutionBase: "Base",
    petsEvolutionEvolved: "Evolved",
    petsEvolutionAscended: "Ascended",
    petsActive: "Active",
    settingsTitle: "Settings",
    settingsLanguage: "Language",
    settingsTheme: "Color Theme",
    settingsAppearance: "Appearance",
    settingsAppearanceSystem: "Follow phone",
    settingsAppearanceLight: "Light",
    settingsAppearanceDark: "Dark",
    settingsStats: "All Stats",
    settingsClose: "Close",
    settingsTotalTasks: "Total tasks completed",
    settingsUncompletedTasks: "Uncompleted tasks",
    settingsTodayActiveTasks: "Today active tasks",
    settingsTotalPets: "Companions met",
    settingsEvolvedPets: "Evolved companions",
    settingsEquippedPet: "Active companion",
    settingsLanguageEnglish: "English",
    settingsLanguagePortuguese: "Portuguese",
    settingsTimerAlert: "Timer Alert",
    settingsTimerAlertVibration: "Vibration",
    settingsTimerAlertSound: "Song File",
    settingsTimerAlertChooseSound: "Choose Song",
    settingsTimerAlertClearSound: "Clear Song",
    settingsTimerAlertNoSound: "No song selected",
    settingsBackup: "Backup Code",
    settingsBackupHelp: "Export a backup code and import it later on this device or another one.",
    settingsBackupPlaceholder: "Your backup code will appear here. You can also paste one to import.",
    settingsExport: "Export",
    settingsImport: "Import",
    settingsViewChangelog: "View changelog",
    settingsHideChangelog: "Hide changelog",
    settingsBackupExported: "Backup code generated.",
    settingsBackupImported: "Backup imported successfully.",
    settingsBackupInvalid: "The backup code is invalid.",
    crashTitle: "Something went wrong",
    crashBody: "Growra hit an error. Your tasks and progress are still saved on this phone. Restart to try again, or share your backup code to keep a copy.",
    crashRestart: "Restart",
    crashShareBackup: "Share my backup code",
    saveCorruptTitle: "Save could not be loaded",
    saveCorruptBody: "Your previous progress couldn't be read, so a new game was started. The old save is still kept on this phone: share it and send it to growra@outlook.pt to get it back.",
    saveCorruptShare: "Share old save",
    saveFailedTitle: "Progress not saved",
    saveFailedBody: "Growra couldn't save your latest change. Your phone may be out of storage; free some space so your progress is kept.",
    saveNewerTitle: "Update Growra",
    saveNewerBody: "Your progress was saved by a newer version of Growra. Update the app from Google Play to keep playing; nothing has been changed.",
    saveNewerUpdate: "Open Google Play",
    settingsBackupNewer: "This backup code comes from a newer version of Growra. Update the app, then import it again.",
    importConfirmTitle: "Replace your progress?",
    importConfirmBody: "Importing replaces everything in this app ({tasks} tasks, {companions} companions, {coins} coins) with the backup. Growra Plus stays as it is.",
    importConfirmReplace: "Replace",
    settingsChangelog: "Changelog",
    settingsUpdatedOn: "Updated on",
    tutorialSkip: "Skip",
    tutorialStepLabel: "Step {n} of {total}",
    tutorialOpenJourney: "Last step: open Journey. Every day you complete a task adds a tile to your road.",
    tutorialWelcomeTitle: "Welcome to Growra",
    tutorialWelcomeBody: "A to-do list you shape your way, with a companion that grows as you get things done. A quick tour earns you {coins} coins.",
    tutorialWelcomePoint1: "✅ Tasks your way: habits, chores, study, lists or your day plan",
    tutorialWelcomePoint2: "🐾 A companion that grows with every task you finish",
    tutorialWelcomePoint3: "🗺️ A Journey road made of the days you show up",
    tutorialTipCalendar: "📅 Calendar and ⏱ focus timer live in Tasks",
    tutorialTipJourney: "🗺️ Your Journey grows one tile per active day, with a camp every 7",
    tutorialTipCompanions: "🐾 More companions join as you use Growra your way",
    tutorialTipSettings: "🎨 Themes and dark mode are in Settings",
    tutorialTourTitle: "Growra at a glance",
    tutorialTourBody: "A quick reminder of where everything is.",
    tutorialFinishBody: "Your companion is ready and your Journey has begun.",
    tutorialFinishGift: "+{coins} 🪙 welcome gift",
    tutorialStart: "Show me around",
    tutorialLetsGo: "Let's go",
    tutorialSkipAll: "Skip the tour",
    settingsReplayTutorial: "Show the tour again",
    tutorialNext: "Next",
    tutorialFinish: "Finish",
    tutorialGuideTitle: "Tutorial",
    tutorialGuideSubtitle: "Do the steps in the app to unlock the next one.",
    tutorialCreateTaskTitle: "Create your first task",
    tutorialCreateTaskHint: "Tap + Add to create your first task.",
    tutorialChoosePredefinedTaskHint: "Pick the Predefined option.",
    tutorialChooseWaterTaskHint: "Select the Drink Water task.",
    tutorialConfirmTaskAddHint: "Any task works: pick a Predefined one like Drink Water, or write your own. Then tap Add.",
    tutorialCompleteTaskTitle: "Complete that task",
    tutorialCompleteTaskHint: "Tap the box next to your task to complete it. Your first one pays +{coins} coins!",
    tutorialOpenTasks: "Tap Tasks below to start your list.",
    tutorialOpenRealm: "Nice! Now open Pets to meet your companion.",
    tutorialRewardTitle: "You're ready!",
    tutorialStep1Title: "Welcome to Growra!",
    tutorialStep1Body: "Your dashboard shows today's tasks, your streak bonus, and your equipped pet. Complete tasks to earn coins and XP.",
    tutorialStep2Title: "Tasks",
    tutorialStep2Body: "Add daily, weekly, or one-time tasks. Complete them to earn rewards. System tasks give extra bonuses!",
    companionsMigratedTitle: "Pets are now companions",
    companionsMigratedBody: "Summons are gone. Every companion now exists once and grows through Bond as you use Growra. Your extra copies and pity were turned into {coins} coins.",
    companionChooseTitle: "Choose your first companion",
    companionChooseSubtitle: "The others join on their own when you use Growra in their style.",
    companionChoose: "Choose",
    companionBond: "Bond",
    companionNextEvolution: "Evolves at {bond} Bond",
    companionLoves: "Loves",
    companionPerk: "Perk",
    companionTakeAlong: "Take along",
    companionNotMet: "Not met yet",
    companionDaysTogether: "Days together",
    companionJoinedTitle: "{name} joined you!",
    companionEvolvedTitle: "{name} evolved!",
    companionRevealSubtitle: "It noticed how you use Growra.",
    companionMood: {
      hello: "{name} says hi. Ready when you are.",
      happy: "{name} is happy with today.",
      glowing: "{name} is glowing. What a day!",
      sleepy: "{name} dozed off while you were away. Any task wakes it up.",
    },
    companionSeasonMood: {
      halloween: {
        hello: "{name} has the witch hat on. Ready when you are.",
        happy: "{name} is collecting a treat for every task today.",
        glowing: "{name} is glowing like a jack-o'-lantern. What a day!",
        sleepy: "{name} dozed off dreaming of pumpkins. Any task wakes it up.",
      },
      christmas: {
        hello: "{name} is all wrapped up and ready when you are.",
        happy: "{name} is feeling festive about today.",
        glowing: "{name} is glowing like a Christmas tree. What a day!",
        sleepy: "{name} is napping by the fire. Any task wakes it up.",
      },
    },
    companionHolidayGreeting: {
      halloween: "{name} says: Happy Halloween! 🎃",
      christmasEve: "{name} says: Merry Christmas Eve! 🎄",
      christmas: "{name} says: Merry Christmas! 🎁",
      newYear: "{name} says: Happy New Year! ✨",
    },
    companionBios: {},
    shiftLinesStart: [
      "{name} is by your side. Have a good start!",
      "Shift on! {name} is cheering you on.",
      "{name} says: one step at a time, you've got this.",
    ],
    shiftLinesMiddle: [
      "Halfway there, {name} is cheering!",
      "{name} is proud of how steady you are.",
      "Keep going, {name} is right here with you.",
      "A little water and a stretch? {name} says you earned it.",
    ],
    shiftLinesLastHour: [
      "Last hour, you've got this.",
      "{name} can see the finish line. Almost there!",
      "Final stretch! {name} is cheering for you.",
    ],
    companionStyles: {
      "getting-started": { loves: "getting started", perk: "+2 coins on your first task each day", joins: "Joins after {target} active days" },
      flow: { loves: "going with the flow", perk: "+1 Bond when you move a task to later", joins: "Joins when you move a task to a later day" },
      focus: { loves: "focus", perk: "+2 coins for tasks with a timer", joins: "Joins when you finish a task with a timer" },
      routines: { loves: "routines", perk: "+2 coins for daily and weekly tasks", joins: "Joins after {target} daily or weekly tasks" },
      timekeeping: { loves: "timekeeping", perk: "+3 coins when a task is done on its due day", joins: "Joins after {target} timer tasks" },
      "showing-up": { loves: "showing up", perk: "+1 extra Bond on each active day", joins: "Joins after {target} active days" },
      "looking-ahead": { loves: "looking ahead", perk: "+2 coins for tasks planned 3+ days ahead", joins: "Joins when you plan a task a week or more ahead" },
      priorities: { loves: "priorities", perk: "+3 coins for High-priority tasks", joins: "Joins after {target} High-priority tasks" },
      "own-tasks": { loves: "making it your own", perk: "+2 coins for custom tasks", joins: "Joins after you create {target} custom tasks" },
      tidying: { loves: "tidying up", perk: "+2 coins for finishing an overdue task", joins: "Joins after you clear {target} overdue tasks (done, moved or deleted)" },
      "long-run": { loves: "the long run", perk: "+10% streak bonus", joins: "Joins after {target} active days" },
      "big-days": { loves: "big days", perk: "+10 coins on your 5th task of a day", joins: "Joins on your first day with 5 tasks done" },
      founder: { loves: "the early days", perk: "+1 coin for every task", joins: "Joined everyone who used Growra in 2026" },
      halloween: { loves: "spooky season", perk: "+3 coins per task during Halloween, +1 the rest of the year", joins: "Joins after {target} tasks done during Halloween" },
      christmas: { loves: "the holidays", perk: "+3 coins per task during Christmas, +1 the rest of the year", joins: "Joins after {target} tasks done during Christmas" },
    },
    dashboardActiveDays: "Active days",
    welcomeBackNamed: "{name} is happy to see you again.",
    welcomeBack: "Good to see you again.",
    returnRecapLine: "Your last {days} active days: {done} tasks done.",
    returnRecapFocus: "Your last {days} active days: {done} tasks done, {focus} focus sessions.",
    welcomeBackDismiss: "OK",
    backupNudgeTitle: "Keep a copy of your progress",
    backupNudgeBody: "Your tasks and progress live only on this phone. Share a backup code to somewhere safe, like a note or an email to yourself, so you can bring everything back on a new phone.",
    backupNudgeShare: "Share backup code",
    backupNudgeDismiss: "No thanks",
    whatsNewTitle: "What's new in {version}",
    whatsNewNew: "New",
    whatsNewFixed: "Fixed",
    whatsNewClose: "Got it",
    whatsNewHide: "Don't show again until the next update",
    tutorialChooseCompanionHint: "Choose your first companion. The others join as you use Growra.",
    companionFoundTitle: "{name} found something!",
    companionFoundSubtitle: "A {item} from your focus session. It's in your bag on the Journey.",
    journeyTitle: "Journey",
    journeySeason: "Season {season}",
    journeyProgress: "Active day {tiles} • camp in {camp} • new region in {region}",
    journeyEmpty: "Complete any task to lay the first tile of your road.",
    journeyNextTile: "Today's tile appears when you complete a task.",
    journeyTodayDone: "Today's tile is down. Every active day adds one.",
    journeyCamp: "Camp {number}",
    journeyRegion: "Region {number}: {name}",
    journeyDecorations: "Decorations",
    journeyShop: "Shop",
    journeyBag: "Your bag",
    journeyBagEmpty: "Nothing in your bag yet. Buy something here, or finish timer tasks: your companion brings back finds.",
    journeyBuy: "Buy • {price}",
    journeyFoundOnly: "Found during focus sessions",
    journeyEmptySpot: "Empty spot",
    journeyPlaceHere: "Place here",
    journeyPutBack: "Put back in bag",
    journeyChooseForSpot: "Choose something for this spot",
    journeyLookBack: "This week",
    journeyLookBackDone: "{done} tasks done",
    journeyLookBackBusiest: "Busiest day: {day}",
    journeyLookBackTop: "Most repeated: {name} ({count}×)",
    journeyDayDone: "{done} done",
    journeyDayMore: "…and {count} more",
    journeyClose: "Close",
    journeyMigratedTitle: "Expeditions became the Journey",
    journeyMigratedBody: "Expeditions, battles and gear are gone. Your road is built from the days you completed tasks. Gear and consumables were turned into {coins} coins.",
    tileFeatures: {
      lantern: "Active day",
      flowers: "Daily or weekly task done",
      crystal: "Timer finished",
      stone: "Custom task done",
      flag: "High-priority task done",
      signpost: "Planned something for later",
      tree: "Big day (5+ tasks)",
    },
    regionHints: [
      "Warm shores where the first trail markers were planted.",
      "A soft green wood where roots hum under the path.",
      "Golden sand that keeps every footprint for a day.",
      "A high trail above the clouds, windy and bright.",
      "Still water that glows when someone walks by.",
      "Glittering plains where the wind rings like chimes.",
      "Warm stone and ember light, cosy after a long day.",
      "The top of the valley. You can see the whole road from here.",
    ],
    updateAvailableTag: "New version",
    updateAvailableTitle: "Update available",
    updateAvailableBody: "A new version of Growra is out. It downloads in the background while you use the app.",
    updateDownloading: "Downloading update…",
    updateHideBanner: "Hide the download bar",
    updateReadyTag: "Downloaded",
    updateReadyTitle: "Restart to finish",
    updateReadyBody: "Growra will close and reopen in a few seconds. Your tasks and pets are kept.",
    updateRequiredTag: "Update required",
    updateRequiredTitle: "This version is out of date",
    updateRequiredBody: "An important fix is out. Update Growra to keep using it; your tasks and pets are kept.",
    updateButton: "Update",
    updateNowButton: "Update now",
    updateRestartButton: "Restart",
    updateLaterButton: "Later",
    plusTitle: "Growra Plus",
    plusPitch: "A one-time unlock. No subscription.",
    plusPerkThemes: "3 extra themes",
    plusPerkHistory: "Every past week on your Journey",
    plusPerkExport: "Export your history (CSV)",
    plusPerkNoAds: "No ads: exploring gives finds straight away",
    plusBuy: "Unlock for {price}",
    plusUnavailable: "Store unavailable, try again later",
    plusRestore: "Restore purchase",
    plusThanks: "Thanks! Plus is unlocked.",
    plusPending: "Payment pending. Plus unlocks once Google Play confirms it.",
    plusError: "Something went wrong. Please try again.",
    plusRestored: "Plus restored.",
    plusNotFound: "No purchase found on this Google account.",
    plusOwned: "Plus is active. Thank you for supporting Growra!",
    plusBadge: "Plus",
    settingsPlus: "Growra Plus",
    settingsExportCsv: "Export your history (CSV)",
    csvExportChoose: "Which file do you want to share?",
    csvExportTasks: "Tasks",
    csvExportCompletions: "Completions",
    csvExportWork: "Work",
    calendarShowBoth: "Show both",
    calendarWorkMarker: "Work",
    workCalendarTitle: "Work calendar",
    csvExportError: "The file couldn't be created or shared. Please try again.",
    exploreButton: "Send {name} exploring",
    exploreAdHint: "Watch a short ad · {left} left today",
    explorePlusHint: "{left} left today",
    exploreDone: "Back tomorrow",
    exploreFound: "{name} brought back a {find}!",
    exploreNoAd: "No ad available right now. Try again later.",
    journeyLookBackLocked: "See this week with Plus",
    settingsPrivacy: "Privacy policy",
    settingsRateApp: "Rate Growra on Google Play",
    settingsOptionalAudio: "Optional audio",
    settingsAmbientMusic: "Ambient music",
    settingsAppSounds: "App sounds",
    tasksConfirmDelete: "Confirm delete",
    settingsConfirmExit: "Ask before leaving the app",
    notifyTimerTitle: "Time's up",
    notifyTimerBody: "The timer for “{task}” has finished.",
    notifyTimerChannel: "Task timers",
    reminderTitle: "Growra",
    reminderBody: "Your tasks are waiting whenever you're ready.",
    reminderChannel: "Daily reminder",
    settingsReminder: "Daily reminder",
    settingsReminderHelp: "One gentle reminder a day, at the time you pick. Off unless you turn it on.",
    settingsReminderDenied: "Notifications are turned off for Growra. Turn them on in your phone's settings to get the reminder.",
    settingsReminderEarlier: "Earlier",
    settingsReminderLater: "Later",
    settingsOn: "On",
    settingsOff: "Off",
    exitTitle: "Leave Growra?",
    exitMessage: "Your tasks and progress are saved.",
    exitLeave: "Leave",
    exitStay: "Stay",
    settingsAdConsent: "Ad privacy choices",
    roomButton: "Room",
    roomDefaultName: "{name}'s room",
    plusRoomName: "Plus room {number}",
    plusRoomsTitle: "Plus rooms",
    plusRoomsUnlock: "Unlock with Growra Plus",
    roomDone: "Done",
    roomShare: "Share",
    roomRename: "Rename room",
    roomTabDecorations: "Decorations",
    roomTabCompanions: "Companions",
    roomTabStyle: "Style",
    roomTabShop: "Shop",
    roomFull: "Room full (30 items)",
    roomBagEmpty: "Nothing in your bag. Buy furniture in the shop or find decorations.",
    roomFlip: "Flip",
    roomForward: "Forward",
    roomBack: "Back",
    roomRemove: "Remove",
    roomUndo: "Undo",
    roomMore: "More",
    roomShareCode: "Share room code",
    roomCodeShareMessage: "My room in Growra. Paste this code in Growra (room ⋯ → Copy a room): {code}",
    roomCopy: "Copy a room",
    roomCopyHint: "Paste a room code from a friend.",
    roomCopyConfirmTitle: "Replace this room's layout?",
    roomCopyConfirmBody: "The items in this room go back to your bag.",
    roomCopyReplace: "Replace",
    roomCopyCancel: "Cancel",
    roomCodeErrors: {
      format: "That isn't a room code.",
      checksum: "This room code is incomplete or was changed. Ask for it again.",
      newer: "This room code comes from a newer Growra. Update the app to use it.",
    },
    roomCopyDoneTitle: "Room copied",
    roomCopyAllThere: "Everything is in place.",
    roomCopyNeed: "You need: {items}.",
    roomCopyUnmet: "Not met yet: {names}.",
    roomCopyStyle: "This room uses the {style} style; get it in the shop.",
    roomGhostPlace: "Place",
    roomGhostInRoom: "In another room",
    roomGhostNotOwned: "Not owned",
    roomShopStyles: "Room styles",
    roomShopFurniture: "Furniture",
    roomShopPlusSets: "Plus sets",
    roomShopOwned: "Owned",
    roomShopBuy: "{price} 🪙",
    roomShopNeedsPlus: "Plus",
    roomShopReturns: "Returns in {month}",
    roomSetNames: {
      japanese: "Japanese",
      halloween: "Halloween",
      christmas: "Christmas",
      valentines: "Valentine's",
      easter: "Easter",
    },
    roomShareMessage: "My {name}'s room in Growra",
    roomShareMessagePlus: "My room in Growra",
    roomShareFooter: "Made with Growra",
    roomShareFooterToggle: "Show \"Made with Growra\"",
    roomShareError: "Couldn't share the picture. Please try again.",
    decorationNames: {
      "flower-pot": "flower pot",
      "mushroom-ring": "mushroom ring",
      "paper-lantern": "paper lantern",
      pennant: "pennant",
      "wind-chime": "wind chime",
      snowman: "snowman",
      "crystal-cluster": "crystal ball",
      tent: "tent",
      "star-lamp": "star lamp",
      shell: "shell",
      feather: "feather",
      clover: "four-leaf clover",
      acorn: "acorn",
      "comet-shard": "comet shard",
      moonstone: "moonstone",
      "rainbow-ribbon": "rainbow ribbon",
      "firefly-jar": "firefly jar",
      "bed": "bed",
      "rug": "rug",
      "bookshelf": "bookshelf",
      "window": "window",
      "floor-lamp": "floor lamp",
      "potted-plant": "potted plant",
      "round-table": "round table",
      "armchair": "armchair",
      "cushion": "cushion",
      "painting": "painting",
      "wall-clock": "wall clock",
      "toy-chest": "toy chest",
      "desk": "desk",
      "beanbag": "beanbag",
      "fairy-lights": "fairy lights",
      "plant-shelf": "plant shelf",
      "low-table": "low table",
      "futon": "futon",
      "paper-lamp": "paper lamp",
      "bonsai": "bonsai",
      "folding-screen": "folding screen",
      "zabuton": "zabuton cushion",
      "pumpkins": "pumpkins",
      "ghost-lamp": "ghost lamp",
      "cauldron": "cauldron",
      "spider-web": "spider web",
      "candles": "candles",
      "xmas-tree": "Christmas tree",
      "presents": "presents",
      "stockings": "stockings",
      "wreath": "wreath",
      "snow-globe": "snow globe",
      "heart-balloons": "heart balloons",
      "rose-vase": "rose vase",
      "love-letter-box": "love-letter box",
      "cake-stand": "cake stand",
      "egg-basket": "egg basket",
      "bunny-plush": "bunny plush",
      "flower-crate": "flower crate",
      "egg-garland": "egg garland",
    },
    roomStyleNames: {
      "wooden-bedroom": "Wooden bedroom",
      "greenhouse": "Greenhouse",
      "starry-attic": "Starry attic",
      "beach-hut": "Beach hut",
      "library": "Library",
      "mushroom-cottage": "Mushroom cottage",
      "japanese-room": "Japanese room",
      "spooky-attic": "Spooky attic",
      "snowy-cabin": "Snowy cabin",
      "pastel-cafe": "Pastel café",
      "spring-garden": "Spring garden",
    },
    timerLabel: "Timer",
    taskStatusPending: "Pending",
    taskStatusCompleted: "Completed",
    timerStart: "Start",
    timerPause: "Pause",
    timerResume: "Resume",
    timerReset: "Reset",
    timerStateRunning: "Running",
    timerStatePaused: "Paused",
    timerStateReady: "Ready",
    timerStateIdle: "Idle",
  },
  pt: {
    navDashboard: "Painel",
    navTasks: "Tarefas",
    navJourney: "Jornada",
    navCompanions: "Amigos",
    dashboardToday: "Hoje",
    dashboardPendingTasks: "tarefas pendentes",
    dashboardRewardMultiplier: "multiplicador de recompensa",
    dashboardProgress: "Progresso",
    dashboardCoins: "Moedas",
    dashboardPlayerLevel: "Nível do jogador",
    dashboardTotalXp: "XP total",
    dashboardEquippedPet: "Pet equipado",
    dashboardNoPetEquipped: "Nenhum pet equipado",
    dashboardRarity: "Raridade",
    dashboardExperience: "Experiência",
    dashboardTaskBonus: "Bónus de tarefa",
    dashboardStreak: "Sequência",
    dashboardCurrentStreak: "Sequência atual",
    dashboardTasks: "Tarefas",
    dashboardSystemTasks: "Tarefas do sistema",
    dashboardCompleted: "Concluídas",
    dashboardAllTimeCompleted: "Concluídas no total",
    dashboardTodayList: "Lista de hoje",
    dashboardNoTasksYet: "Ainda sem tarefas",
    dashboardSettings: "Definições",
    tasksTitle: "Tarefas",
    tasksBackToChooser: "‹ Tarefas",
    tasksChooserTitle: "Tarefas",
    tasksChoosePersonal: "Pessoal",
    tasksChooseWork: "Trabalho",
    tasksChoosePersonalCount: "ativas hoje",
    tasksChooseWorkShift: "Turno",
    tasksChooseWorkNone: "Sem turnos hoje",
    tasksChooseWorkSetup: "Define o teu horário de trabalho",
    workTitle: "Trabalho",
    tasksChooseWorkNoMore: "Sem mais turnos hoje",
    workEmptyTitle: "O teu horário de trabalho",
    workEmptyBody: "Adiciona os teus turnos e reuniões, únicos ou repetidos. Marca um turno quando o fizeres, e o teu companheiro dá-te força enquanto decorre.",
    workEmptyAdd: "Adicionar o primeiro turno",
    workAdd: "+ Adicionar",
    workCalendar: "Calendário",
    workViewDay: "Dia",
    workViewWeek: "Semana",
    workToday: "Hoje",
    workPrevious: "Anterior",
    workNext: "Seguinte",
    workNoShiftsDay: "Sem turnos neste dia",
    workDone: "Feito",
    workMarkDone: "Marcar como feito",
    workNow: "Agora",
    workFormNewTitle: "Novo turno",
    workFormEditTitle: "Editar turno",
    workFormSave: "Guardar",
    workFormName: "Nome",
    workFormNamePlaceholder: "ex.: Turno da manhã, Piso 3",
    workFormNameMissing: "Dá um nome ao turno.",
    workFormDescriptionPlaceholder: "Notas (opcional)",
    workFormStartTime: "Começa às",
    workFormEndTime: "Acaba às",
    workFormTimeInvalid: "Escreve a hora como HH:MM, ex.: 07:00.",
    workFormOvernight: "Acaba no dia seguinte",
    workFormStartsOn: "Primeiro dia: {date}",
    workFormRepeat: "Repetir",
    workRepeatNone: "Não repete",
    workRepeatDaily: "Todos os dias",
    workRepeatEveryDays: "De X em X dias",
    workRepeatWeekly: "Todas as semanas",
    workRepeatEveryWeeks: "De X em X semanas",
    workRepeatMonthly: "Todos os meses",
    workFormEvery: "A cada",
    workFormDays: "dias",
    workFormWeeks: "semanas",
    workFormOnDays: "Nestes dias",
    workFormEndsRule: "Deixa de repetir",
    workEndsNever: "Nunca",
    workEndsCount: "Após N vezes",
    workEndsUntil: "Numa data",
    workFormTimes: "vezes",
    workFormNumberInvalid: "Usa um número inteiro, 1 ou mais.",
    workFormUntilInvalid: "A data final é antes do primeiro dia.",
    workScopeEditTitle: "Este turno repete-se",
    workScopeEditBody: "Alterar só este, ou este e todos os seguintes?",
    workScopeDeleteTitle: "Eliminar um turno que se repete",
    workScopeDeleteBody: "Eliminar só este, ou este e todos os seguintes?",
    workScopeOne: "Só este",
    workScopeFollowing: "Este e todos os seguintes",
    workScopeRuleHint: "Mudanças de cor e de repetição aplicam-se a este e a todos os seguintes.",
    tasksActiveToday: "ativas hoje",
    tasksAdd: "+ Adicionar",
    tasksFilterAll: "Todas",
    tasksFilterActive: "Ativas",
    tasksFilterUpcoming: "Próximas",
    tasksFilterCompleted: "Concluídas",
    tasksCalendar: "Calendário",
    tasksCalendarBack: "Voltar",
    tasksCalendarNoActivity: "Sem atividade de tarefas neste mês.",
    tasksCalendarScheduled: "Planeadas",
    tasksCalendarCompletedLegend: "Concluídas",
    tasksCalendarMixed: "Planeadas + feitas",
    tasksQuickAddPlaceholder: "Nova tarefa para hoje",
    tasksQuickAddSubmit: "Adicionar",
    tasksQuickAddAccessibilityLabel: "Adicionar tarefa para hoje",
    tasksDetails: "Detalhes da tarefa",
    tasksSave: "Guardar",
    tasksDelete: "Eliminar",
    tasksPriority: "Prioridade",
    tasksPriorityLow: "Baixa",
    tasksDuration: "Quanto tempo?",
    tasksDurationNone: "Sem",
    tasksDurationMinutesUnit: "min",
    tasksDurationHoursUnit: "h",
    tasksPriorityMedium: "Média",
    tasksPriorityHigh: "Alta",
    tasksCalendarColor: "Cor no calendário",
    tasksOpenDetails: "Abrir detalhes",
    tasksCategory: "Categoria",
    taskCategoryNone: "Sem categoria",
    tasksSearchPlaceholder: "Pesquisar tarefas",
    tasksToolsShow: "Mostrar pesquisa e adicionar rápido",
    tasksToolsHide: "Esconder pesquisa e adicionar rápido",
    tasksSelectedDay: "Dia selecionado",
    tasksNoTasksOnDay: "Sem tarefas neste dia.",
    tasksStartsOn: "Começa",
    tasksEmptyTitle: "Sem tarefas para mostrar",
    tasksEmptySubtitle: "Cria a tua primeira tarefa para começar",
    addTaskTitle: "Adicionar tarefa",
    addTaskCancel: "Cancelar",
    addTaskConfirm: "Adicionar",
    addTaskType: "Tipo de tarefa",
    addTaskCustom: "Personalizada",
    addTaskPredefined: "Predefinida",
    addTaskName: "Nome da tarefa",
    addTaskDescription: "Descrição",
    addTaskChooseSystemTask: "Escolhe uma tarefa do sistema",
    addTaskFrequency: "Frequência",
    addTaskTimer: "Temporizador",
    addTaskDate: "Data inicial",
    addTaskDaysAhead: "Dias à frente",
    addTaskOnce: "Uma vez",
    addTaskDaily: "Diária",
    addTaskWeekly: "Semanal",
    addTaskCategory: "Categoria",
    addTaskCategoryPlaceholder: "Escreve a categoria",
    addTaskSavedCategories: "Categorias guardadas",
    addTaskSaveTemplate: "Guardar para depois",
    addTaskSaveTemplateHelp: "Guarda esta tarefa personalizada e categoria como modelo reutilizável para escolher novamente mais tarde.",
    addTaskSavedCustomTasks: "Tarefas personalizadas guardadas",
    addTaskNamePlaceholder: "Escreve o nome da tarefa",
    addTaskDescriptionPlaceholder: "Escreve a descrição da tarefa (opcional)",
    addTaskNameMissing: "Dá primeiro um nome à tarefa. O resto é opcional.",
    petsTitle: "Companheiros",
    petsCoinsPity: "moedas",
    petsDetailTitle: "Companheiro",
    petsDetailClose: "Fechar",
    petsSummonRevealClose: "Fechar",
    petsSummonRevealPrevious: "Anterior",
    petsSummonRevealNext: "Seguinte",
    petsEvolution: "Evolução",
    petsTaskBonus: "Bónus de tarefa",
    petsMaxEvolution: "Evolução máxima atingida",
    petsEvolutionBase: "Base",
    petsEvolutionEvolved: "Evoluído",
    petsEvolutionAscended: "Ascendido",
    petsActive: "Ativo",
    settingsTitle: "Definições",
    settingsLanguage: "Idioma",
    settingsTheme: "Tema de cor",
    settingsAppearance: "Aparência",
    settingsAppearanceSystem: "Seguir o telemóvel",
    settingsAppearanceLight: "Claro",
    settingsAppearanceDark: "Escuro",
    settingsStats: "Todas as estatísticas",
    settingsClose: "Fechar",
    settingsTotalTasks: "Total de tarefas concluídas",
    settingsUncompletedTasks: "Tarefas por concluir",
    settingsTodayActiveTasks: "Tarefas ativas hoje",
    settingsTotalPets: "Companheiros conhecidos",
    settingsEvolvedPets: "Companheiros evoluídos",
    settingsEquippedPet: "Companheiro ativo",
    settingsLanguageEnglish: "Inglês",
    settingsLanguagePortuguese: "Português",
    settingsTimerAlert: "Alerta do temporizador",
    settingsTimerAlertVibration: "Vibração",
    settingsTimerAlertSound: "Ficheiro de música",
    settingsTimerAlertChooseSound: "Escolher música",
    settingsTimerAlertClearSound: "Remover música",
    settingsTimerAlertNoSound: "Nenhuma música selecionada",
    settingsBackup: "Código de backup",
    settingsBackupHelp: "Exporta um código de backup e importa-o depois neste dispositivo ou noutro.",
    settingsBackupPlaceholder: "O teu código de backup aparece aqui. Também podes colar um para importar.",
    settingsExport: "Exportar",
    settingsImport: "Importar",
    settingsViewChangelog: "Ver registo",
    settingsHideChangelog: "Ocultar registo",
    settingsBackupExported: "Código de backup gerado.",
    settingsBackupImported: "Backup importado com sucesso.",
    settingsBackupInvalid: "O código de backup é inválido.",
    crashTitle: "Algo correu mal",
    crashBody: "O Growra teve um erro. As tuas tarefas e o teu progresso continuam guardados neste telemóvel. Reinicia para tentar outra vez, ou partilha o teu código de backup para guardares uma cópia.",
    crashRestart: "Reiniciar",
    crashShareBackup: "Partilhar o código de backup",
    saveCorruptTitle: "Não foi possível carregar o progresso",
    saveCorruptBody: "Não foi possível ler o teu progresso anterior, por isso começou um jogo novo. O progresso antigo continua guardado neste telemóvel: partilha-o e envia-o para growra@outlook.pt para o recuperares.",
    saveCorruptShare: "Partilhar progresso antigo",
    saveFailedTitle: "Progresso não guardado",
    saveFailedBody: "O Growra não conseguiu guardar a tua última alteração. O telemóvel pode estar sem espaço; liberta algum espaço para o teu progresso ficar guardado.",
    saveNewerTitle: "Atualiza o Growra",
    saveNewerBody: "O teu progresso foi guardado por uma versão mais recente do Growra. Atualiza a app no Google Play para continuares; nada foi alterado.",
    saveNewerUpdate: "Abrir o Google Play",
    settingsBackupNewer: "Este código de backup vem de uma versão mais recente do Growra. Atualiza a app e importa-o outra vez.",
    importConfirmTitle: "Substituir o teu progresso?",
    importConfirmBody: "Importar substitui tudo nesta app ({tasks} tarefas, {companions} companheiros, {coins} moedas) pelo backup. O Growra Plus fica como está.",
    importConfirmReplace: "Substituir",
    settingsChangelog: "Registo de alterações",
    settingsUpdatedOn: "Atualizado em",
    tutorialSkip: "Saltar",
    tutorialStepLabel: "Passo {n} de {total}",
    tutorialOpenJourney: "Último passo: abre a Jornada. Cada dia em que concluis uma tarefa acrescenta um mosaico ao teu caminho.",
    tutorialWelcomeTitle: "Bem-vindo ao Growra",
    tutorialWelcomeBody: "Uma lista de tarefas à tua maneira, com um companheiro que cresce à medida que fazes as coisas. Uma visita rápida dá-te {coins} moedas.",
    tutorialWelcomePoint1: "✅ Tarefas à tua maneira: hábitos, casa, estudo, listas ou o plano do dia",
    tutorialWelcomePoint2: "🐾 Um companheiro que cresce com cada tarefa que concluis",
    tutorialWelcomePoint3: "🗺️ Um caminho de Jornada feito dos dias em que apareces",
    tutorialTipCalendar: "📅 O calendário e o ⏱ temporizador de foco estão em Tarefas",
    tutorialTipJourney: "🗺️ A tua Jornada cresce um mosaico por dia ativo, com um acampamento a cada 7",
    tutorialTipCompanions: "🐾 Mais companheiros juntam-se a ti quando usas o Growra à tua maneira",
    tutorialTipSettings: "🎨 Os temas e o modo escuro estão nas Definições",
    tutorialTourTitle: "O Growra num relance",
    tutorialTourBody: "Um lembrete rápido de onde está tudo.",
    tutorialFinishBody: "O teu companheiro está pronto e a tua Jornada começou.",
    tutorialFinishGift: "+{coins} 🪙 de boas-vindas",
    tutorialStart: "Mostra-me",
    tutorialLetsGo: "Vamos lá",
    tutorialSkipAll: "Saltar a visita",
    settingsReplayTutorial: "Ver a visita outra vez",
    tutorialNext: "Próximo",
    tutorialFinish: "Terminar",
    tutorialGuideTitle: "Tutorial",
    tutorialGuideSubtitle: "Faz as etapas no jogo para desbloquear a seguinte.",
    tutorialCreateTaskTitle: "Cria a tua primeira tarefa",
    tutorialCreateTaskHint: "Carrega em + Adicionar para criar a tua primeira tarefa.",
    tutorialChoosePredefinedTaskHint: "Escolhe a opção Predefinida.",
    tutorialChooseWaterTaskHint: "Seleciona a tarefa Beber água.",
    tutorialConfirmTaskAddHint: "Qualquer tarefa serve: escolhe uma Predefinida, como Beber água, ou escreve a tua. Depois carrega em Adicionar.",
    tutorialCompleteTaskTitle: "Conclui essa tarefa",
    tutorialCompleteTaskHint: "Toca na caixa ao lado da tarefa para a concluir. A primeira dá +{coins} moedas!",
    tutorialOpenTasks: "Toca em Tarefas, em baixo, para começar a tua lista.",
    tutorialOpenRealm: "Boa! Agora abre Amigos para conhecer o teu companheiro.",
    tutorialRewardTitle: "Estás pronto!",
    tutorialStep1Title: "Bem-vindo ao Growra!",
    tutorialStep1Body: "O teu painel mostra as tarefas de hoje, o bónus de sequência e o teu pet equipado. Completa tarefas para ganhar moedas e XP.",
    tutorialStep2Title: "Tarefas",
    tutorialStep2Body: "Adiciona tarefas diárias, semanais ou únicas. Completa-as para ganhar recompensas. As tarefas do sistema dão bónus extra!",
    companionsMigratedTitle: "Os pets agora são companheiros",
    companionsMigratedBody: "As invocações acabaram. Cada companheiro existe uma só vez e cresce com Laço à medida que usas o Growra. As tuas cópias extra e o pity foram convertidos em {coins} moedas.",
    companionChooseTitle: "Escolhe o teu primeiro companheiro",
    companionChooseSubtitle: "Os outros juntam-se sozinhos quando usas o Growra ao estilo deles.",
    companionChoose: "Escolher",
    companionBond: "Laço",
    companionNextEvolution: "Evolui com {bond} de Laço",
    companionLoves: "Adora",
    companionPerk: "Vantagem",
    companionTakeAlong: "Levar contigo",
    companionNotMet: "Ainda não conhecido",
    companionDaysTogether: "Dias juntos",
    companionJoinedTitle: "{name} juntou-se a ti!",
    companionEvolvedTitle: "{name} evoluiu!",
    companionRevealSubtitle: "Reparou na forma como usas o Growra.",
    companionMood: {
      hello: "{name} diz olá. Pronto quando tu estiveres.",
      happy: "{name} está contente com o dia de hoje.",
      glowing: "{name} está a brilhar. Que dia!",
      sleepy: "{name} adormeceu enquanto estavas fora. Qualquer tarefa o acorda.",
    },
    companionSeasonMood: {
      halloween: {
        hello: "{name} já tem o chapéu de bruxa posto. Quando tu quiseres.",
        happy: "{name} está a juntar um doce por cada tarefa de hoje.",
        glowing: "{name} brilha como uma abóbora iluminada. Que dia!",
        sleepy: "{name} adormeceu a sonhar com abóboras. Qualquer tarefa o acorda.",
      },
      christmas: {
        hello: "{name} está bem agasalhado e à tua espera.",
        happy: "{name} está com espírito natalício hoje.",
        glowing: "{name} brilha como uma árvore de Natal. Que dia!",
        sleepy: "{name} está a dormir junto à lareira. Qualquer tarefa o acorda.",
      },
    },
    companionHolidayGreeting: {
      halloween: "{name} diz: Feliz Halloween! 🎃",
      christmasEve: "{name} diz: Feliz véspera de Natal! 🎄",
      christmas: "{name} diz: Feliz Natal! 🎁",
      newYear: "{name} diz: Feliz Ano Novo! ✨",
    },
    companionBios: {
      sprout: "Um amigo do bosque dos cogumelos que brilha mais onde quer que descanse.",
      pebble: "Uma pequena criatura de pedra, robusta, que junta flores e musgo.",
      moss: "Um montinho calmo do bosque que leva um pequeno prado às costas.",
      zephie: "Uma nuvem de brisa que brinca com pétalas e folhas como se fizessem parte da sua aura.",
      ember: "Um espírito de chama alegre que arde mais forte no seu núcleo.",
      ripple: "Uma criatura de água brincalhona que deixa anéis brilhantes onde quer que mergulhe.",
      tempo: "Uma nuvem de trovão que junta luz da chuva e zumbe antes de cada pequeno relâmpago.",
      glint: "Uma criatura de prisma cujos pequenos chifres de cristal espalham luz quente pela relva.",
      astra: "Uma nuvem de estrelas que brilha como um céu inteiro em miniatura.",
      umbra: "Um espírito de sombra aveludado que brilha suavemente no nevoeiro ao luar, em vez de se esconder nele.",
      nova: "Um companheiro com coração de estrela, cuja aura junta fogo e luz das estrelas.",
      cindra: "Uma fera fofa de lava, com um coração de magma brilhante e o hábito de levantar faíscas.",
      lumen: "Um pequeno espírito-semente com uma lanterna, para quem iluminou o caminho cedo.",
      gloam: "Um fantasma-abóbora com um manto roxo, que brilha mais nas noites mais escuras de outono.",
      holly: "Uma pequena corça de inverno com hastes de azevinho e um cachecol vermelho, que toca um sininho dourado.",
    },
    shiftLinesStart: [
      "{name} está ao teu lado. Bom começo!",
      "Turno a começar! {name} está a torcer por ti.",
      "{name} diz: um passo de cada vez, tu consegues.",
    ],
    shiftLinesMiddle: [
      "Já vais a meio, {name} está a torcer por ti!",
      "{name} tem orgulho na tua calma.",
      "Continua, {name} está aqui contigo.",
      "Um copo de água e um alongamento? {name} diz que mereces.",
    ],
    shiftLinesLastHour: [
      "Última hora, tu consegues.",
      "{name} já vê a meta. Quase lá!",
      "Reta final! {name} está a torcer por ti.",
    ],
    companionStyles: {
      "getting-started": { loves: "começar", perk: "+2 moedas na primeira tarefa de cada dia", joins: "Junta-se após {target} dias ativos" },
      flow: { loves: "ir com a corrente", perk: "+1 de Laço quando adias uma tarefa", joins: "Junta-se quando adias uma tarefa para outro dia" },
      focus: { loves: "foco", perk: "+2 moedas em tarefas com temporizador", joins: "Junta-se quando terminas uma tarefa com temporizador" },
      routines: { loves: "rotinas", perk: "+2 moedas em tarefas diárias e semanais", joins: "Junta-se após {target} tarefas diárias ou semanais" },
      timekeeping: { loves: "pontualidade", perk: "+3 moedas quando uma tarefa é feita no próprio dia", joins: "Junta-se após {target} tarefas com temporizador" },
      "showing-up": { loves: "aparecer", perk: "+1 de Laço extra em cada dia ativo", joins: "Junta-se após {target} dias ativos" },
      "looking-ahead": { loves: "planear com antecedência", perk: "+2 moedas em tarefas planeadas com 3+ dias", joins: "Junta-se quando planeias uma tarefa com uma semana ou mais" },
      priorities: { loves: "prioridades", perk: "+3 moedas em tarefas de prioridade Alta", joins: "Junta-se após {target} tarefas de prioridade Alta" },
      "own-tasks": { loves: "fazer à sua maneira", perk: "+2 moedas em tarefas personalizadas", joins: "Junta-se depois de criares {target} tarefas personalizadas" },
      tidying: { loves: "arrumar", perk: "+2 moedas ao concluir uma tarefa atrasada", joins: "Junta-se depois de resolveres {target} tarefas atrasadas (feitas, adiadas ou apagadas)" },
      "long-run": { loves: "o longo prazo", perk: "+10% de bónus de sequência", joins: "Junta-se após {target} dias ativos" },
      "big-days": { loves: "dias em grande", perk: "+10 moedas na 5.ª tarefa do dia", joins: "Junta-se no primeiro dia com 5 tarefas feitas" },
      founder: { loves: "os primeiros dias", perk: "+1 moeda em cada tarefa", joins: "Juntou-se a todos os que usaram o Growra em 2026" },
      halloween: { loves: "a época assustadora", perk: "+3 moedas por tarefa no Halloween, +1 no resto do ano", joins: "Junta-se após {target} tarefas feitas durante o Halloween" },
      christmas: { loves: "as festas", perk: "+3 moedas por tarefa no Natal, +1 no resto do ano", joins: "Junta-se após {target} tarefas feitas durante o Natal" },
    },
    dashboardActiveDays: "Dias ativos",
    welcomeBackNamed: "{name} está contente por te ver outra vez.",
    welcomeBack: "É bom ver-te outra vez.",
    returnRecapLine: "Os teus últimos {days} dias ativos: {done} tarefas feitas.",
    returnRecapFocus: "Os teus últimos {days} dias ativos: {done} tarefas feitas, {focus} sessões de foco.",
    welcomeBackDismiss: "OK",
    backupNudgeTitle: "Guarda uma cópia do teu progresso",
    backupNudgeBody: "As tuas tarefas e o teu progresso só existem neste telemóvel. Partilha um código de backup para um sítio seguro, como uma nota ou um email para ti, para recuperares tudo num telemóvel novo.",
    backupNudgeShare: "Partilhar código de backup",
    backupNudgeDismiss: "Dispensar",
    whatsNewTitle: "Novidades da versão {version}",
    whatsNewNew: "Novo",
    whatsNewFixed: "Corrigido",
    whatsNewClose: "Percebi",
    whatsNewHide: "Não mostrar outra vez até à próxima atualização",
    tutorialChooseCompanionHint: "Escolhe o teu primeiro companheiro. Os outros juntam-se a ti quando usas o Growra.",
    companionFoundTitle: "{name} encontrou uma coisa!",
    companionFoundSubtitle: "Um(a) {item} da tua sessão de foco. Está na tua mochila na Jornada.",
    journeyTitle: "Jornada",
    journeySeason: "Temporada {season}",
    journeyProgress: "Dia ativo {tiles} • acampamento em {camp} • nova região em {region}",
    journeyEmpty: "Conclui qualquer tarefa para pôr o primeiro bloco do teu caminho.",
    journeyNextTile: "O bloco de hoje aparece quando concluíres uma tarefa.",
    journeyTodayDone: "O bloco de hoje já está. Cada dia ativo acrescenta um.",
    journeyCamp: "Acampamento {number}",
    journeyRegion: "Região {number}: {name}",
    journeyDecorations: "Decorações",
    journeyShop: "Loja",
    journeyBag: "A tua mochila",
    journeyBagEmpty: "A mochila está vazia. Compra algo aqui ou termina tarefas com temporizador: o teu companheiro traz achados.",
    journeyBuy: "Comprar • {price}",
    journeyFoundOnly: "Encontrado em sessões de foco",
    journeyEmptySpot: "Lugar vazio",
    journeyPlaceHere: "Pôr aqui",
    journeyPutBack: "Guardar na mochila",
    journeyChooseForSpot: "Escolhe algo para este lugar",
    journeyLookBack: "Esta semana",
    journeyLookBackDone: "{done} tarefas feitas",
    journeyLookBackBusiest: "Dia mais cheio: {day}",
    journeyLookBackTop: "Mais repetida: {name} ({count}×)",
    journeyDayDone: "{done} feitas",
    journeyDayMore: "…e mais {count}",
    journeyClose: "Fechar",
    journeyMigratedTitle: "As expedições deram lugar à Jornada",
    journeyMigratedBody: "Expedições, batalhas e equipamento acabaram. O teu caminho é feito dos dias em que concluíste tarefas. Equipamento e consumíveis foram convertidos em {coins} moedas.",
    tileFeatures: {
      lantern: "Dia ativo",
      flowers: "Tarefa diária ou semanal feita",
      crystal: "Temporizador terminado",
      stone: "Tarefa personalizada feita",
      flag: "Tarefa de prioridade Alta feita",
      signpost: "Planeaste algo para mais tarde",
      tree: "Dia em grande (5+ tarefas)",
    },
    regionHints: [
      "Praias quentes onde foram postos os primeiros marcos do trilho.",
      "Um bosque verde e suave onde as raízes cantarolam sob o caminho.",
      "Areia dourada que guarda cada pegada durante um dia.",
      "Um trilho alto acima das nuvens, ventoso e luminoso.",
      "Água parada que brilha quando alguém passa.",
      "Planícies cintilantes onde o vento toca como sinos.",
      "Pedra morna e luz de brasas, acolhedora depois de um dia longo.",
      "O topo do vale. Daqui vê-se o caminho todo.",
    ],
    updateAvailableTag: "Nova versão",
    updateAvailableTitle: "Há uma atualização",
    updateAvailableBody: "Saiu uma nova versão do Growra. É transferida em segundo plano enquanto usas a app.",
    updateDownloading: "A transferir atualização…",
    updateHideBanner: "Ocultar a barra de transferência",
    updateReadyTag: "Transferida",
    updateReadyTitle: "Reinicia para terminar",
    updateReadyBody: "O Growra fecha e volta a abrir em poucos segundos. As tuas tarefas e companheiros ficam guardados.",
    updateRequiredTag: "Atualização obrigatória",
    updateRequiredTitle: "Esta versão está desatualizada",
    updateRequiredBody: "Saiu uma correção importante. Atualiza o Growra para continuar a usá-lo; as tuas tarefas e companheiros ficam guardados.",
    updateButton: "Atualizar",
    updateNowButton: "Atualizar agora",
    updateRestartButton: "Reiniciar",
    updateLaterButton: "Mais tarde",
    plusTitle: "Growra Plus",
    plusPitch: "Desbloqueio único. Sem subscrição.",
    plusPerkThemes: "3 temas extra",
    plusPerkHistory: "Todas as semanas passadas na tua Jornada",
    plusPerkExport: "Exportar o teu histórico (CSV)",
    plusPerkNoAds: "Sem anúncios: explorar dá achados logo",
    plusBuy: "Desbloquear por {price}",
    plusUnavailable: "Loja indisponível, tenta mais tarde",
    plusRestore: "Restaurar compra",
    plusThanks: "Obrigado! O Plus está desbloqueado.",
    plusPending: "Pagamento pendente. O Plus desbloqueia quando o Google Play confirmar.",
    plusError: "Algo correu mal. Tenta outra vez.",
    plusRestored: "Plus restaurado.",
    plusNotFound: "Nenhuma compra encontrada nesta conta Google.",
    plusOwned: "O Plus está ativo. Obrigado por apoiares o Growra!",
    plusBadge: "Plus",
    settingsPlus: "Growra Plus",
    settingsExportCsv: "Exportar o teu histórico (CSV)",
    csvExportChoose: "Que ficheiro queres partilhar?",
    csvExportTasks: "Tarefas",
    csvExportCompletions: "Conclusões",
    csvExportWork: "Trabalho",
    calendarShowBoth: "Mostrar ambos",
    calendarWorkMarker: "Trabalho",
    workCalendarTitle: "Calendário de trabalho",
    csvExportError: "Não foi possível criar ou partilhar o ficheiro. Tenta outra vez.",
    exploreButton: "Enviar {name} a explorar",
    exploreAdHint: "Vê um anúncio curto · faltam {left} hoje",
    explorePlusHint: "faltam {left} hoje",
    exploreDone: "Volta amanhã",
    exploreFound: "{name} trouxe um(a) {find}!",
    exploreNoAd: "Nenhum anúncio disponível agora. Tenta mais tarde.",
    journeyLookBackLocked: "Vê esta semana com o Plus",
    settingsPrivacy: "Política de privacidade",
    settingsRateApp: "Avaliar o Growra no Google Play",
    settingsOptionalAudio: "Áudio opcional",
    settingsAmbientMusic: "Ambiente",
    settingsAppSounds: "Sons da aplicação",
    tasksConfirmDelete: "Confirmar eliminação",
    settingsConfirmExit: "Perguntar antes de sair da app",
    notifyTimerTitle: "Tempo esgotado",
    notifyTimerBody: "O temporizador de “{task}” terminou.",
    notifyTimerChannel: "Temporizadores das tarefas",
    reminderTitle: "Growra",
    reminderBody: "As tuas tarefas estão à tua espera quando quiseres.",
    reminderChannel: "Lembrete diário",
    settingsReminder: "Lembrete diário",
    settingsReminderHelp: "Um lembrete suave por dia, à hora que escolheres. Desligado a não ser que o ligues.",
    settingsReminderDenied: "As notificações do Growra estão desligadas. Liga-as nas definições do telemóvel para receberes o lembrete.",
    settingsReminderEarlier: "Mais cedo",
    settingsReminderLater: "Mais tarde",
    settingsOn: "Ligado",
    settingsOff: "Desligado",
    exitTitle: "Sair do Growra?",
    exitMessage: "As tuas tarefas e o teu progresso ficam guardados.",
    exitLeave: "Sair",
    exitStay: "Ficar",
    settingsAdConsent: "Escolhas de privacidade dos anúncios",
    roomButton: "Quarto",
    roomDefaultName: "Quarto de {name}",
    plusRoomName: "Quarto Plus {number}",
    plusRoomsTitle: "Quartos Plus",
    plusRoomsUnlock: "Desbloquear com o Growra Plus",
    roomDone: "Concluído",
    roomShare: "Partilhar",
    roomRename: "Mudar nome do quarto",
    roomTabDecorations: "Decorações",
    roomTabCompanions: "Companheiros",
    roomTabStyle: "Estilo",
    roomTabShop: "Loja",
    roomFull: "Quarto cheio (30 itens)",
    roomBagEmpty: "Nada no teu saco. Compra mobília na loja ou encontra decorações.",
    roomFlip: "Virar",
    roomForward: "Para a frente",
    roomBack: "Para trás",
    roomRemove: "Tirar",
    roomUndo: "Desfazer",
    roomMore: "Mais",
    roomShareCode: "Partilhar código do quarto",
    roomCodeShareMessage: "O meu quarto no Growra. Cola este código no Growra (quarto ⋯ → Copiar um quarto): {code}",
    roomCopy: "Copiar um quarto",
    roomCopyHint: "Cola o código de quarto de um amigo.",
    roomCopyConfirmTitle: "Substituir a disposição deste quarto?",
    roomCopyConfirmBody: "Os itens deste quarto voltam para o teu saco.",
    roomCopyReplace: "Substituir",
    roomCopyCancel: "Cancelar",
    roomCodeErrors: {
      format: "Isto não é um código de quarto.",
      checksum: "Este código de quarto está incompleto ou foi alterado. Pede-o outra vez.",
      newer: "Este código de quarto vem de um Growra mais recente. Atualiza a app para o usar.",
    },
    roomCopyDoneTitle: "Quarto copiado",
    roomCopyAllThere: "Está tudo no lugar.",
    roomCopyNeed: "Precisas de: {items}.",
    roomCopyUnmet: "Ainda não conheces: {names}.",
    roomCopyStyle: "Este quarto usa o estilo {style}; encontra-o na loja.",
    roomGhostPlace: "Colocar",
    roomGhostInRoom: "Noutro quarto",
    roomGhostNotOwned: "Não tens",
    roomShopStyles: "Estilos de quarto",
    roomShopFurniture: "Mobília",
    roomShopPlusSets: "Conjuntos Plus",
    roomShopOwned: "Teu",
    roomShopBuy: "{price} 🪙",
    roomShopNeedsPlus: "Plus",
    roomShopReturns: "Volta em {month}",
    roomSetNames: {
      japanese: "Japonês",
      halloween: "Halloween",
      christmas: "Natal",
      valentines: "Dia dos Namorados",
      easter: "Páscoa",
    },
    roomShareMessage: "O quarto do meu {name} no Growra",
    roomShareMessagePlus: "O meu quarto no Growra",
    roomShareFooter: "Feito com o Growra",
    roomShareFooterToggle: "Mostrar \"Feito com o Growra\"",
    roomShareError: "Não foi possível partilhar a imagem. Tenta outra vez.",
    decorationNames: {
      "flower-pot": "vaso de flores",
      "mushroom-ring": "círculo de cogumelos",
      "paper-lantern": "lanterna de papel",
      pennant: "bandeirola",
      "wind-chime": "espanta-espíritos",
      snowman: "boneco de neve",
      "crystal-cluster": "bola de cristal",
      tent: "tenda",
      "star-lamp": "candeeiro estrela",
      shell: "concha",
      feather: "pena",
      clover: "trevo de quatro folhas",
      acorn: "bolota",
      "comet-shard": "fragmento de cometa",
      moonstone: "pedra da lua",
      "rainbow-ribbon": "fita arco-íris",
      "firefly-jar": "frasco de pirilampos",
      "bed": "cama",
      "rug": "tapete",
      "bookshelf": "estante",
      "window": "janela",
      "floor-lamp": "candeeiro de pé",
      "potted-plant": "vaso com planta",
      "round-table": "mesa redonda",
      "armchair": "poltrona",
      "cushion": "almofada",
      "painting": "quadro",
      "wall-clock": "relógio de parede",
      "toy-chest": "baú de brinquedos",
      "desk": "secretária",
      "beanbag": "puff",
      "fairy-lights": "luzinhas",
      "plant-shelf": "prateleira de plantas",
      "low-table": "mesa baixa",
      "futon": "futon",
      "paper-lamp": "candeeiro de papel",
      "bonsai": "bonsai",
      "folding-screen": "biombo",
      "zabuton": "almofada zabuton",
      "pumpkins": "abóboras",
      "ghost-lamp": "candeeiro fantasma",
      "cauldron": "caldeirão",
      "spider-web": "teia de aranha",
      "candles": "velas",
      "xmas-tree": "árvore de Natal",
      "presents": "presentes",
      "stockings": "meias de Natal",
      "wreath": "coroa de Natal",
      "snow-globe": "globo de neve",
      "heart-balloons": "balões de coração",
      "rose-vase": "jarra de rosas",
      "love-letter-box": "caixa de cartas de amor",
      "cake-stand": "suporte de bolo",
      "egg-basket": "cesto de ovos",
      "bunny-plush": "coelhinho de peluche",
      "flower-crate": "caixa de flores",
      "egg-garland": "grinalda de ovos",
    },
    roomStyleNames: {
      "wooden-bedroom": "Quarto de madeira",
      "greenhouse": "Estufa",
      "starry-attic": "Sótão estrelado",
      "beach-hut": "Cabana de praia",
      "library": "Biblioteca",
      "mushroom-cottage": "Casinha cogumelo",
      "japanese-room": "Quarto japonês",
      "spooky-attic": "Sótão assustador",
      "snowy-cabin": "Cabana nevada",
      "pastel-cafe": "Café pastel",
      "spring-garden": "Jardim de primavera",
    },
    timerLabel: "Temporizador",
    taskStatusPending: "Pendente",
    taskStatusCompleted: "Concluída",
    timerStart: "Começar",
    timerPause: "Pausa",
    timerResume: "Retomar",
    timerReset: "Repor",
    timerStateRunning: "Em execução",
    timerStatePaused: "Pausado",
    timerStateReady: "Pronto",
    timerStateIdle: "Inativo",
  },
};

export function getAppCopy(language: AppLanguage): AppCopy {
  return copyByLanguage[language];
}
