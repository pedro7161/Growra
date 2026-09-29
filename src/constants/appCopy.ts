import { AppLanguage } from "../types";
import type { CompanionMood, CompanionStyle } from "../utils/companions";

interface CompanionStyleCopy {
  loves: string;
  perk: string;
  /** How it joins; {target} is the goal from utils/companions.ts. */
  joins: string;
}

interface AppCopy {
  navDashboard: string;
  navTasks: string;
  navRealm: string;
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
  petsExplorationTab: string;
  petsMyPetsTab: string;
  petsExplorationTitle: string;
  petsExplorationSubtitle: string;
  petsExplorationMapTitle: string;
  petsExplorationMapHint: string;
  petsExplorationRosterTitle: string;
  petsExplorationEmpty: string;
  petsExplorationSend: string;
  petsExplorationSent: string;
  petsExplorationActive: string;
  petsExplorationNextZone: string;
  petsExplorationTimeRemaining: string;
  petsExplorationUnlocked: string;
  petsExplorationUnknown: string;
  petsExplorationFog: string;
  petsBattleTitle: string;
  petsBattleSubtitle: string;
  petsBattleWildPet: string;
  petsBattleWildPower: string;
  petsBattleFight: string;
  petsBattleSelectPet: string;
  petsBattleNoPets: string;
  petsBattleLocked: string;
  petsGearTitle: string;
  petsGearSubtitle: string;
  petsGearLabel: string;
  petsGearEquip: string;
  petsGearEquipped: string;
  petsGearBonus: string;
  petsGearNoItems: string;
  petsDetailTitle: string;
  petsDetailClose: string;
  petsDetailOverview: string;
  petsDetailElement: string;
  petsDetailDescription: string;
  petsDetailSource: string;
  petsDetailStatsTitle: string;
  petsDetailCurrentGear: string;
  petsDetailAvailableGear: string;
  petsDetailActions: string;
  petsSummonRevealClose: string;
  petsSummonRevealPrevious: string;
  petsSummonRevealNext: string;
  petsEvolution: string;
  petsTaskBonus: string;
  petsCombatPower: string;
  petsExplorationPower: string;
  petsExperience: string;
  petsLevel: string;
  petsNextEvolution: string;
  petsMaxEvolution: string;
  petsEvolutionBase: string;
  petsEvolutionEvolved: string;
  petsEvolutionAscended: string;
  petsActive: string;
  petsEquip: string;
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
    navRealm: "Realm",
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
    petsExplorationTab: "Explore",
    petsMyPetsTab: "Companions",
    petsExplorationTitle: "Realm Map",
    petsExplorationSubtitle: "Send pets into the wild to uncover the world one route at a time.",
    petsExplorationMapTitle: "Uncharted regions",
    petsExplorationMapHint: "Each expedition exposes more of the map. Stronger explorers reveal faster.",
    petsExplorationRosterTitle: "Send a pet",
    petsExplorationEmpty: "You need at least one pet to begin exploring.",
    petsExplorationSend: "Send on expedition",
    petsExplorationSent: "Expeditions sent",
    petsExplorationActive: "Expedition in progress",
    petsExplorationNextZone: "Next zone",
    petsExplorationTimeRemaining: "Time remaining",
    petsExplorationUnlocked: "Unlocked",
    petsExplorationUnknown: "Unknown",
    petsExplorationFog: "Fog covers this route.",
    petsBattleTitle: "Zone Battles",
    petsBattleSubtitle: "Choose a revealed zone and fight its wild pet to earn XP and loot.",
    petsBattleWildPet: "Wild pet",
    petsBattleWildPower: "Wild power",
    petsBattleFight: "Fight wild pet",
    petsBattleSelectPet: "Select fighter",
    petsBattleNoPets: "You need a pet to start fighting wild encounters.",
    petsBattleLocked: "Reveal a zone first to unlock wild battles.",
    petsGearTitle: "Gear Vault",
    petsGearSubtitle: "Loot from battles can be equipped to boost your pets' base stats.",
    petsGearLabel: "Gear",
    petsGearEquip: "Equip",
    petsGearEquipped: "Equipped",
    petsGearBonus: "Bonus",
    petsGearNoItems: "No gear yet. Win a fight to start collecting gear.",
    petsDetailTitle: "Companion",
    petsDetailClose: "Close",
    petsDetailOverview: "Overview",
    petsDetailElement: "Element",
    petsDetailDescription: "Description",
    petsDetailSource: "Source zone",
    petsDetailStatsTitle: "Stats",
    petsDetailCurrentGear: "Current gear",
    petsDetailAvailableGear: "Available gear",
    petsDetailActions: "Actions",
    petsSummonRevealClose: "Close",
    petsSummonRevealPrevious: "Previous",
    petsSummonRevealNext: "Next",
    petsEvolution: "Evolution",
    petsTaskBonus: "Task bonus",
    petsCombatPower: "Combat power",
    petsExplorationPower: "Exploration power",
    petsExperience: "XP",
    petsLevel: "Level",
    petsNextEvolution: "Next evolution",
    petsMaxEvolution: "Max evolution reached",
    petsEvolutionBase: "Base",
    petsEvolutionEvolved: "Evolved",
    petsEvolutionAscended: "Ascended",
    petsActive: "Active",
    petsEquip: "Equip",
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
    tutorialOpenRealm: "Open Realm",
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
    navRealm: "Reino",
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
    petsExplorationTab: "Explorar",
    petsMyPetsTab: "Companheiros",
    petsExplorationTitle: "Mapa do Reino",
    petsExplorationSubtitle: "Envia pets para o terreno e revela o mundo caminho a caminho.",
    petsExplorationMapTitle: "Regiões por chartar",
    petsExplorationMapHint: "Cada expedição expõe mais do mapa. Exploradores fortes revelam mais depressa.",
    petsExplorationRosterTitle: "Enviar um pet",
    petsExplorationEmpty: "Precisas de pelo menos um pet para começar a explorar.",
    petsExplorationSend: "Enviar em expedição",
    petsExplorationSent: "Expedições enviadas",
    petsExplorationActive: "Expedição em progresso",
    petsExplorationNextZone: "Próxima zona",
    petsExplorationTimeRemaining: "Tempo restante",
    petsExplorationUnlocked: "Desbloqueado",
    petsExplorationUnknown: "Desconhecido",
    petsExplorationFog: "A neblina cobre esta rota.",
    petsBattleTitle: "Batalhas da zona",
    petsBattleSubtitle: "Escolhe uma zona revelada e luta contra o pet selvagem para ganhar XP e loot.",
    petsBattleWildPet: "Pet selvagem",
    petsBattleWildPower: "Poder selvagem",
    petsBattleFight: "Lutar contra pet selvagem",
    petsBattleSelectPet: "Selecionar lutador",
    petsBattleNoPets: "Precisas de um pet para começar a lutar contra encontros selvagens.",
    petsBattleLocked: "Revela uma zona primeiro para desbloquear batalhas selvagens.",
    petsGearTitle: "Arsenal",
    petsGearSubtitle: "O loot das batalhas pode ser equipado para aumentar as estatísticas base dos pets.",
    petsGearLabel: "Gear",
    petsGearEquip: "Equipar",
    petsGearEquipped: "Equipado",
    petsGearBonus: "Bónus",
    petsGearNoItems: "Ainda sem gear. Vence uma batalha para começar a colecionar gear.",
    petsDetailTitle: "Companheiro",
    petsDetailClose: "Fechar",
    petsDetailOverview: "Visão geral",
    petsDetailElement: "Elemento",
    petsDetailDescription: "Descrição",
    petsDetailSource: "Zona de origem",
    petsDetailStatsTitle: "Atributos",
    petsDetailCurrentGear: "Equipamento atual",
    petsDetailAvailableGear: "Equipamentos disponíveis",
    petsDetailActions: "Ações",
    petsSummonRevealClose: "Fechar",
    petsSummonRevealPrevious: "Anterior",
    petsSummonRevealNext: "Seguinte",
    petsEvolution: "Evolução",
    petsTaskBonus: "Bónus de tarefa",
    petsCombatPower: "Poder de combate",
    petsExplorationPower: "Poder de exploração",
    petsExperience: "XP",
    petsLevel: "Nível",
    petsNextEvolution: "Próxima evolução",
    petsMaxEvolution: "Evolução máxima atingida",
    petsEvolutionBase: "Base",
    petsEvolutionEvolved: "Evoluído",
    petsEvolutionAscended: "Ascendido",
    petsActive: "Ativo",
    petsEquip: "Equipar",
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
    tutorialOpenRealm: "Abrir reino",
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
