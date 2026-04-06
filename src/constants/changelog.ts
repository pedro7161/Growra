import { AppLanguage } from "../types";

export interface ChangelogEntry {
  dateLabel: string;
  items: string[];
}

const changelogByLanguage: Record<AppLanguage, ChangelogEntry[]> = {
  en: [
    {
      dateLabel: "April 6, 2026",
      items: [
        "Custom and predefined tasks with category-based system task groups.",
        "Task frequencies for once, daily, and weekly scheduling.",
        "Task dashboard quick add and one-tap completion from the Today list.",
        "Task details with edit, delete, priority, and calendar color controls.",
        "Task calendar screen with month navigation, colored day squares, and selected-day task details.",
        "Task list filters for all, active, and completed tasks, plus search and priority-aware sorting.",
        "Local save persistence with save migration support.",
        "Player level, coins, total XP, streak bonus, and reward progression.",
        "Settings for language, theme, stats, import, and export backup codes.",
        "Pet collection, equip, summon, pity shop, fusion, and sell flows.",
      ],
    },
  ],
  pt: [
    {
      dateLabel: "6 de abril de 2026",
      items: [
        "Tarefas personalizadas e predefinidas com grupos por categoria.",
        "Frequências de tarefa para uma vez, diária e semanal.",
        "Adição rápida no painel e conclusão com um toque na lista de hoje.",
        "Detalhes da tarefa com editar, eliminar, prioridade e cor no calendário.",
        "Ecrã de calendário com navegação mensal, quadrados coloridos por dia e detalhes do dia selecionado.",
        "Filtros de tarefas para todas, ativas e concluídas, com pesquisa e ordenação por prioridade.",
        "Persistência local com suporte a migração de saves.",
        "Nível do jogador, moedas, XP total, bónus de sequência e progressão de recompensas.",
        "Definições de idioma, tema, estatísticas, importação e exportação de backup.",
        "Coleção de pets, equipar, summon, loja pity, fusão e venda.",
      ],
    },
  ],
};

export function getChangelog(language: AppLanguage): ChangelogEntry[] {
  return changelogByLanguage[language];
}
