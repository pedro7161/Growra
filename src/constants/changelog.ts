import { AppLanguage } from "../types";

export interface ChangelogEntry {
  dateLabel: string;
  items: string[];
}

const changelogByLanguage: Record<AppLanguage, ChangelogEntry[]> = {
  en: [
    {
      dateLabel: "Version 1.6.3 · October 1, 2026",
      items: [
        "When you've been away for a couple of days, your companion is shown fast asleep on the dashboard. Any task wakes it up.",
      ],
    },
    {
      dateLabel: "Version 1.6.2 · October 1, 2026",
      items: [
        "Tempo, Glint, Umbra, Zephie and Cindra have their own art for all three stages. No companion borrows another's picture any more.",
        "Every companion is now drawn without a background box, and Nova has new art.",
      ],
    },
    {
      dateLabel: "Version 1.6.1 · September 29, 2026",
      items: [
        "New app icon and splash screen starring Sprout.",
        "The Journey has real art: each region has its own ground, banner and campfire scene.",
        "Tile features and decorations are drawn as little pixel sprites, and placed decorations appear in the camp scene.",
      ],
    },
    {
      dateLabel: "Version 1.6.0 · September 29, 2026",
      items: [
        "Pets are now companions: no more summons, fusion or selling. Each companion exists once.",
        "Pick your first companion. The others join when you use Growra in their style (routines, timers, planning ahead and more).",
        "Companions grow through Bond from using the app and evolve at 30 and 100 Bond. Each one has a small perk.",
        "Your companion's mood shows on the dashboard.",
        "New Journey tab: every day you complete a task adds a tile to your road, with camps every 7 active days and a new region every 28.",
        "Decorate your camps with coins. Timer tasks sometimes make your companion bring back a find.",
        "Expeditions, battles and gear are gone. Existing pets are kept; extra copies, pity, gear and consumables were turned into coins.",
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
      dateLabel: "Versão 1.6.3 · 1 de outubro de 2026",
      items: [
        "Quando estás fora uns dias, o teu companheiro aparece a dormir no painel. Qualquer tarefa o acorda.",
      ],
    },
    {
      dateLabel: "Versão 1.6.2 · 1 de outubro de 2026",
      items: [
        "O Tempo, a Glint, o Umbra, a Zephie e a Cindra têm arte própria nas três fases. Nenhum companheiro usa a imagem de outro.",
        "Todos os companheiros aparecem agora sem caixa de fundo, e a Nova tem arte nova.",
      ],
    },
    {
      dateLabel: "Versão 1.6.1 · 29 de setembro de 2026",
      items: [
        "Novo ícone e ecrã de arranque com o Sprout.",
        "A Jornada tem arte a sério: cada região tem o seu chão, faixa e cena de acampamento.",
        "As marcas dos mosaicos e as decorações passam a ser pequenos sprites, e as decorações colocadas aparecem na cena do acampamento.",
      ],
    },
    {
      dateLabel: "Versão 1.6.0 · 29 de setembro de 2026",
      items: [
        "Os pets são agora companheiros: acabaram as invocações, fusões e vendas. Cada companheiro existe uma só vez.",
        "Escolhe o teu primeiro companheiro. Os outros juntam-se quando usas o Growra ao estilo deles (rotinas, temporizadores, planear com antecedência e mais).",
        "Os companheiros crescem com Laço ao usares a app e evoluem com 30 e 100 de Laço. Cada um tem uma pequena vantagem.",
        "O humor do teu companheiro aparece no painel.",
        "Novo separador Jornada: cada dia em que concluis uma tarefa acrescenta um bloco ao teu caminho, com acampamentos a cada 7 dias ativos e uma nova região a cada 28.",
        "Decora os acampamentos com moedas. As tarefas com temporizador às vezes fazem o teu companheiro trazer um achado.",
        "Expedições, batalhas e equipamento acabaram. Os pets que já tinhas ficam; cópias extra, pity, equipamento e consumíveis foram convertidos em moedas.",
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
