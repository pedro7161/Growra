import { AppLanguage } from "../types";

interface AppCopy {
  navDashboard: string;
  navTasks: string;
  navPets: string;
  dashboardToday: string;
  dashboardPendingTasks: string;
  dashboardRewardMultiplier: string;
  dashboardProgress: string;
  dashboardCoins: string;
  dashboardPlayerLevel: string;
  dashboardTotalXp: string;
  dashboardPityCurrency: string;
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
  addTaskOnce: string;
  addTaskDaily: string;
  addTaskWeekly: string;
  addTaskNamePlaceholder: string;
  addTaskDescriptionPlaceholder: string;
  petsTitle: string;
  petsCoinsPity: string;
  petsSummonTab: string;
  petsPityShopTab: string;
  petsMyPetsTab: string;
  petsSellShopTab: string;
  petsGachaTitle: string;
  petsGachaOdds: string;
  petsGachaCost: string;
  petsSummonButton: string;
  petsPityShopTitle: string;
  petsPityShopSubtitle: string;
  petsClaim: string;
  petsCost: string;
  petsSellShopTitle: string;
  petsSellShopSubtitle: string;
  petsNoExtraCopies: string;
  petsSell: string;
  petsSellsFor: string;
  petsFusion: string;
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
  petsAvailableCopies: string;
  petsFuseCopy: string;
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
  settingsCommonPets: string;
  settingsRarePets: string;
  settingsEpicPets: string;
  settingsFusedPets: string;
  settingsEquippedPet: string;
  settingsLanguageEnglish: string;
  settingsLanguagePortuguese: string;
  settingsBackup: string;
  settingsBackupHelp: string;
  settingsBackupPlaceholder: string;
  settingsExport: string;
  settingsImport: string;
  settingsBackupExported: string;
  settingsBackupImported: string;
  settingsBackupInvalid: string;
  settingsChangelog: string;
  settingsUpdatedOn: string;
}

const copyByLanguage: Record<AppLanguage, AppCopy> = {
  en: {
    navDashboard: "Dashboard",
    navTasks: "Tasks",
    navPets: "Pets",
    dashboardToday: "Today",
    dashboardPendingTasks: "pending tasks",
    dashboardRewardMultiplier: "reward multiplier",
    dashboardProgress: "Progress",
    dashboardCoins: "Coins",
    dashboardPlayerLevel: "Player Level",
    dashboardTotalXp: "Total XP",
    dashboardPityCurrency: "Pity Currency",
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
    addTaskOnce: "Once",
    addTaskDaily: "Daily",
    addTaskWeekly: "Weekly",
    addTaskNamePlaceholder: "Enter task name",
    addTaskDescriptionPlaceholder: "Enter task description (optional)",
    petsTitle: "Pets",
    petsCoinsPity: "coins",
    petsSummonTab: "Summon",
    petsPityShopTab: "Pity Shop",
    petsMyPetsTab: "My Pets",
    petsSellShopTab: "Sell Shop",
    petsGachaTitle: "Gacha",
    petsGachaOdds: "Summon odds: 70% common • 25% rare • 5% epic",
    petsGachaCost: "Each summon costs {cost} coins and gives 1 pity.",
    petsSummonButton: "Summon Pet ({cost} coins)",
    petsPityShopTitle: "Pity Shop",
    petsPityShopSubtitle: "Spend pity to claim a specific pet.",
    petsClaim: "Claim",
    petsCost: "Cost",
    petsSellShopTitle: "Sell Shop",
    petsSellShopSubtitle: "Sell extra copies for coins when you do not want to fuse them.",
    petsNoExtraCopies: "No extra copies available for sale.",
    petsSell: "Sell",
    petsSellsFor: "sells for",
    petsFusion: "Fusion",
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
    petsAvailableCopies: "Available copies",
    petsFuseCopy: "Fuse Copy",
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
    settingsTotalPets: "Total pets",
    settingsCommonPets: "Common pets",
    settingsRarePets: "Rare pets",
    settingsEpicPets: "Epic pets",
    settingsFusedPets: "Pets with fusion",
    settingsEquippedPet: "Equipped pet",
    settingsLanguageEnglish: "English",
    settingsLanguagePortuguese: "Portuguese",
    settingsBackup: "Backup Code",
    settingsBackupHelp: "Export a backup code and import it later on this device or another one.",
    settingsBackupPlaceholder: "Your backup code will appear here. You can also paste one to import.",
    settingsExport: "Export",
    settingsImport: "Import",
    settingsBackupExported: "Backup code generated.",
    settingsBackupImported: "Backup imported successfully.",
    settingsBackupInvalid: "The backup code is invalid.",
    settingsChangelog: "Changelog",
    settingsUpdatedOn: "Updated on",
  },
  pt: {
    navDashboard: "Painel",
    navTasks: "Tarefas",
    navPets: "Pets",
    dashboardToday: "Hoje",
    dashboardPendingTasks: "tarefas pendentes",
    dashboardRewardMultiplier: "multiplicador de recompensa",
    dashboardProgress: "Progresso",
    dashboardCoins: "Moedas",
    dashboardPlayerLevel: "Nível do jogador",
    dashboardTotalXp: "XP total",
    dashboardPityCurrency: "Moeda de pity",
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
    addTaskOnce: "Uma vez",
    addTaskDaily: "Diária",
    addTaskWeekly: "Semanal",
    addTaskNamePlaceholder: "Escreve o nome da tarefa",
    addTaskDescriptionPlaceholder: "Escreve a descrição da tarefa (opcional)",
    petsTitle: "Pets",
    petsCoinsPity: "moedas",
    petsSummonTab: "Summon",
    petsPityShopTab: "Loja Pity",
    petsMyPetsTab: "Os Meus Pets",
    petsSellShopTab: "Loja de Venda",
    petsGachaTitle: "Gacha",
    petsGachaOdds: "Probabilidades: 70% comum • 25% raro • 5% épico",
    petsGachaCost: "Cada summon custa {cost} moedas e dá 1 pity.",
    petsSummonButton: "Invocar pet ({cost} moedas)",
    petsPityShopTitle: "Loja Pity",
    petsPityShopSubtitle: "Gasta pity para escolher um pet específico.",
    petsClaim: "Resgatar",
    petsCost: "Custo",
    petsSellShopTitle: "Loja de Venda",
    petsSellShopSubtitle: "Vende cópias extra por moedas quando não quiseres fundi-las.",
    petsNoExtraCopies: "Não há cópias extra para vender.",
    petsSell: "Vender",
    petsSellsFor: "vende por",
    petsFusion: "Fusão",
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
    petsAvailableCopies: "Cópias disponíveis",
    petsFuseCopy: "Fundir cópia",
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
    settingsTotalPets: "Total de pets",
    settingsCommonPets: "Pets comuns",
    settingsRarePets: "Pets raros",
    settingsEpicPets: "Pets épicos",
    settingsFusedPets: "Pets com fusão",
    settingsEquippedPet: "Pet equipado",
    settingsLanguageEnglish: "Inglês",
    settingsLanguagePortuguese: "Português",
    settingsBackup: "Código de backup",
    settingsBackupHelp: "Exporta um código de backup e importa-o depois neste dispositivo ou noutro.",
    settingsBackupPlaceholder: "O teu código de backup aparece aqui. Também podes colar um para importar.",
    settingsExport: "Exportar",
    settingsImport: "Importar",
    settingsBackupExported: "Código de backup gerado.",
    settingsBackupImported: "Backup importado com sucesso.",
    settingsBackupInvalid: "O código de backup é inválido.",
    settingsChangelog: "Registo de alterações",
    settingsUpdatedOn: "Atualizado em",
  },
};

export function getAppCopy(language: AppLanguage): AppCopy {
  return copyByLanguage[language];
}
