import { AppLanguage } from "../types";
import type { CompanionMood, CompanionStyle } from "../utils/companions";
import type { TileFeature } from "../utils/journey";

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
  tasksDetails: string;
  tasksSave: string;
  tasksDelete: string;
  tasksPriority: string;
  tasksPriorityLow: string;
  tasksPriorityMedium: string;
  tasksPriorityHigh: string;
  tasksCalendarColor: string;
  tasksOpenDetails: string;
  tasksCategory: string;
  tasksSearchPlaceholder: string;
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
  settingsChangelog: string;
  settingsUpdatedOn: string;
  tutorialSkip: string;
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
  companionStyles: Record<CompanionStyle, CompanionStyleCopy>;
  dashboardActiveDays: string;
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
  exploreButton: string;
  exploreAdHint: string;
  explorePlusHint: string;
  exploreDone: string;
  exploreFound: string;
  exploreNoAd: string;
  journeyLookBackLocked: string;
  plusTitle: string;
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
    navCompanions: "Companions",
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
    tasksDetails: "Task Details",
    tasksSave: "Save",
    tasksDelete: "Delete",
    tasksPriority: "Priority",
    tasksPriorityLow: "Low",
    tasksPriorityMedium: "Medium",
    tasksPriorityHigh: "High",
    tasksCalendarColor: "Calendar Color",
    tasksOpenDetails: "Open Details",
    tasksCategory: "Category",
    tasksSearchPlaceholder: "Search tasks",
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
    settingsChangelog: "Changelog",
    settingsUpdatedOn: "Updated on",
    tutorialSkip: "Skip",
    tutorialNext: "Next",
    tutorialFinish: "Finish",
    tutorialGuideTitle: "Tutorial",
    tutorialGuideSubtitle: "Do the steps in the app to unlock the next one.",
    tutorialCreateTaskTitle: "Create your first task",
    tutorialCreateTaskHint: "Open Tasks and add any task.",
    tutorialChoosePredefinedTaskHint: "Pick the Predefined option.",
    tutorialChooseWaterTaskHint: "Select the Drink Water task.",
    tutorialConfirmTaskAddHint: "Tap Add to create your first task.",
    tutorialCompleteTaskTitle: "Complete that task",
    tutorialCompleteTaskHint: "Mark the task as done to earn your first coins.",
    tutorialOpenTasks: "Open Tasks",
    tutorialOpenRealm: "Open Companions",
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
    },
    dashboardActiveDays: "Active days",
    tutorialChooseCompanionHint: "Pick your first companion.",
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
    exploreButton: "Send {name} exploring",
    exploreAdHint: "Watch a short ad · {left} left today",
    explorePlusHint: "{left} left today",
    exploreDone: "Back tomorrow",
    exploreFound: "{name} brought back a {find}!",
    exploreNoAd: "No ad available right now. Try again later.",
    journeyLookBackLocked: "See this week with Plus",
    settingsPrivacy: "Privacy policy",
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
    navCompanions: "Companheiros",
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
    tasksDetails: "Detalhes da tarefa",
    tasksSave: "Guardar",
    tasksDelete: "Eliminar",
    tasksPriority: "Prioridade",
    tasksPriorityLow: "Baixa",
    tasksPriorityMedium: "Média",
    tasksPriorityHigh: "Alta",
    tasksCalendarColor: "Cor no calendário",
    tasksOpenDetails: "Abrir detalhes",
    tasksCategory: "Categoria",
    tasksSearchPlaceholder: "Pesquisar tarefas",
    tasksSelectedDay: "Dia selecionado",
    tasksNoTasksOnDay: "Sem tarefas neste dia.",
    tasksStartsOn: "Comeca",
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
    addTaskSaveTemplateHelp: "Guarda esta tarefa personalizada e categoria como modelo reutilizavel para escolher novamente mais tarde.",
    addTaskSavedCustomTasks: "Tarefas personalizadas guardadas",
    addTaskNamePlaceholder: "Escreve o nome da tarefa",
    addTaskDescriptionPlaceholder: "Escreve a descrição da tarefa (opcional)",
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
    settingsChangelog: "Registo de alterações",
    settingsUpdatedOn: "Atualizado em",
    tutorialSkip: "Pular",
    tutorialNext: "Próximo",
    tutorialFinish: "Terminar",
    tutorialGuideTitle: "Tutorial",
    tutorialGuideSubtitle: "Faz as etapas no jogo para desbloquear a seguinte.",
    tutorialCreateTaskTitle: "Cria a tua primeira tarefa",
    tutorialCreateTaskHint: "Abre Tarefas e adiciona qualquer tarefa.",
    tutorialChoosePredefinedTaskHint: "Escolhe a opção Predefinida.",
    tutorialChooseWaterTaskHint: "Seleciona a tarefa Beber água.",
    tutorialConfirmTaskAddHint: "Carrega em Adicionar para criar a tua primeira tarefa.",
    tutorialCompleteTaskTitle: "Conclui essa tarefa",
    tutorialCompleteTaskHint: "Marca a tarefa como feita para ganhares as primeiras moedas.",
    tutorialOpenTasks: "Abrir tarefas",
    tutorialOpenRealm: "Abrir Companheiros",
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
    },
    dashboardActiveDays: "Dias ativos",
    tutorialChooseCompanionHint: "Escolhe o teu primeiro companheiro.",
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
    exploreButton: "Enviar {name} a explorar",
    exploreAdHint: "Vê um anúncio curto · faltam {left} hoje",
    explorePlusHint: "faltam {left} hoje",
    exploreDone: "Volta amanhã",
    exploreFound: "{name} trouxe um(a) {find}!",
    exploreNoAd: "Nenhum anúncio disponível agora. Tenta mais tarde.",
    journeyLookBackLocked: "Vê esta semana com o Plus",
    settingsPrivacy: "Política de privacidade",
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
