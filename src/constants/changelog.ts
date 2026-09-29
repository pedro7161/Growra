import { AppLanguage } from "../types";

export interface ChangelogEntry {
  dateLabel: string;
  items: string[];
}

const changelogByLanguage: Record<AppLanguage, ChangelogEntry[]> = {
  en: [
    {
      dateLabel: "September 29, 2026",
      items: [
        "Daily and weekly tasks now reset at the right time around daylight-saving changes.",
        "Streaks now grow correctly on the day after a clock change.",
        "Tapping a task twice no longer pays its reward twice.",
        "A save that can't be loaded is kept as a backup instead of being replaced.",
        "Timer alert sounds play reliably and no longer leak audio players.",
      ],
    },
    {
      dateLabel: "April 8, 2026",
      items: [
        "Expedition map with zones, side nodes and a simple auto-battle system.",
        "Pet evolutions with new artwork for each stage.",
        "Gear and battle consumables dropped from expeditions.",
      ],
    },
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
      dateLabel: "29 de setembro de 2026",
      items: [
        "As tarefas diárias e semanais voltam à hora certa nas mudanças de hora.",
        "A sequência cresce corretamente no dia seguinte a uma mudança de hora.",
        "Tocar duas vezes numa tarefa já não paga a recompensa a dobrar.",
        "Um save que não carrega é guardado como cópia em vez de ser substituído.",
        "Os sons de alerta do temporizador tocam de forma fiável.",
      ],
    },
    {
      dateLabel: "8 de abril de 2026",
      items: [
        "Mapa de expedições com zonas, nós secundários e um sistema simples de batalha automática.",
        "Evoluções de pets com arte nova para cada fase.",
        "Equipamento e consumíveis de batalha obtidos nas expedições.",
      ],
    },
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
