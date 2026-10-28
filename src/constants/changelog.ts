import { AppLanguage } from "../types";

export interface ChangelogEntry {
  /** The app version this entry belongs to (entries from 1.9.0 on); the What's New popup looks it up. */
  version?: string;
  dateLabel: string;
  /** What is new. */
  items: string[];
  /** What was fixed, listed apart in the What's New popup and the changelog. */
  fixes?: string[];
}

const changelogByLanguage: Record<AppLanguage, ChangelogEntry[]> = {
  en: [
    {
      version: "1.10.0",
      dateLabel: "Version 1.10.0 · November 2026",
      items: [
        "New Work schedule: add shifts with start and end times and repeats, see them in day and week views, and your companion cheers you on during a shift.",
        "Every task can now have a length, and longer tasks pay more.",
        "No more daily coin limit: the more you do, the more you earn.",
        "New shop prices to match the new rewards.",
        "Groups: create your own Schedule or List groups beside Personal and Work. Groups never pay coins or experience, so they are free to use however you like.",
        "Groups show on the dashboard and as coloured chips on the calendar, and you can pick which ones the calendar shows.",
        "Add an item to several groups at once with \"Also add to…\" and edit or delete the linked copies together.",
        "Share any group, Personal or Work as a code, and import a friend's code as new or as an update of the same list.",
      ],
    },
    {
      version: "1.9.1",
      dateLabel: "Version 1.9.1 · October 26, 2026",
      items: [
        "Halloween is here until November 9: every companion wears a witch hat, and the app icon dresses up too. Santa hats follow in December.",
        "Your companion has seasonal lines and greets you on Halloween, Christmas and New Year's Day.",
        "Room codes: share a room as a code from the room's ⋯ menu, or copy a friend's. Items you don't have yet show as faded ghosts until you place one.",
        "After each update, a short note like this one shows what's new.",
      ],
      fixes: [
        "Companion pictures fit their frames in every screen.",
      ],
    },
    {
      version: "1.9.0",
      dateLabel: "Version 1.9.0 · October 24, 2026",
      items: [
        "New: Lumen, a founder companion, joins everyone who uses Growra in 2026. While it's your active companion, every task gives +1 coin.",
        "Timer alerts now reach you when Growra is in the background, and you can turn on an optional daily reminder in Settings.",
        "Back after a few days? Growra welcomes you with a short recap of your last active days.",
        "Backups: the backup code opens the share sheet, and importing a backup asks before replacing your data.",
        "Safer saves: Growra keeps a copy before an import and never loads a save from a newer version.",
        "Accessibility: clearer labels, bigger touch areas and better text wrapping.",
      ],
      fixes: [
        "The dashboard shows your real streak after missed days.",
        "Fixes for task names, task search, companion rooms and CSV export.",
      ],
    },
    {
      dateLabel: "Version 1.8.6 · October 19, 2026",
      items: [
        "Tasks: search and quick add have even spacing, and a button at the end of the filters hides or shows them.",
        "Rooms show the whole background picture instead of a zoomed-in corner.",
      ],
    },
    {
      dateLabel: "Version 1.8.5 · October 19, 2026",
      items: [
        "New: quick add. Type a task at the top of Tasks and press Add: it lands on today, no extra steps.",
        "Category is now optional. Tasks without one show as Uncategorised, and Add always tells you if something is missing.",
        "Growra Plus is restored reliably when the app starts, and when Google Play says you already own it.",
        "Explore: a fast double tap no longer starts two ads.",
        "More of the app is in Portuguese: categories, regions, theme names and calendar labels.",
        "The update download bar sits at the top and can be hidden.",
      ],
    },
    {
      dateLabel: "Version 1.8.4 · October 15, 2026",
      items: [
        "New: dark mode. Choose Light, Dark or Follow phone in Settings > Appearance; every color theme has a dark version.",
        "A new welcome tour: four quick steps with a +100 coin reward for your first task and a +100 welcome gift at the end. You can see it again from Settings.",
        "Pressing Back on the dashboard now asks before leaving (you can turn this off in Settings).",
        "Rate Growra on Google Play from Settings.",
        "Task cards give the task name the full width, and labels like frequency and status are translated.",
        "Big numbers are easier to read (1,234 instead of 1234).",
        "Add Task suggests the categories you already use.",
      ],
    },
    {
      dateLabel: "Version 1.8.3 · October 13, 2026",
      items: [
        "Growra now tells you when a new version is ready on Google Play, and can download it in the background while you use the app.",
      ],
    },
    {
      dateLabel: "Version 1.8.2 · October 11, 2026",
      items: [
        "The Companions tab is now called Pets, so its name fits on small phones.",
      ],
    },
    {
      dateLabel: "Version 1.8.1 · October 8, 2026",
      items: [
        "The bottom bar has icons, and every tab label is the same size.",
        "Your active companion's button is easier to read.",
        "A little celebration sound when your streak reaches 7, 14 and 20 days.",
      ],
    },
    {
      dateLabel: "Version 1.8.0 · October 7, 2026",
      items: [
        "Companion rooms: decorate your companion's room and share a picture of it.",
        "Soft background music and new sound effects for purchases, decorations, themes and exploring.",
      ],
    },
    {
      dateLabel: "Version 1.7.0 · October 1, 2026",
      items: [
        "Growra Plus: a one-time unlock with 3 extra themes, every past week on your Journey, CSV export, and no ads.",
        "Send your companion exploring for a decoration, twice a day.",
        "New explore-only decorations: comet shard, moonstone, rainbow ribbon and firefly jar.",
      ],
    },
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
      version: "1.10.0",
      dateLabel: "Versão 1.10.0 · novembro de 2026",
      items: [
        "Novo horário de trabalho: adiciona turnos com hora de início e fim e repetições, vê-os nas vistas de dia e semana, e o teu companheiro anima-te durante o turno.",
        "Cada tarefa pode agora ter uma duração, e as tarefas mais longas pagam mais.",
        "Acabou o limite diário de moedas: quanto mais fazes, mais ganhas.",
        "Novos preços na loja para acompanhar as novas recompensas.",
        "Grupos: cria os teus próprios grupos de Horário ou Lista ao lado de Pessoal e Trabalho. Os grupos nunca dão moedas nem experiência, por isso usa-os como quiseres.",
        "Os grupos aparecem no painel e como etiquetas coloridas no calendário, e podes escolher quais o calendário mostra.",
        "Adiciona um item a vários grupos de uma vez com \"Adicionar também a…\" e edita ou apaga as cópias ligadas em conjunto.",
        "Partilha qualquer grupo, Pessoal ou Trabalho como um código, e importa o código de um amigo como novo ou como atualização da mesma lista.",
      ],
    },
    {
      version: "1.9.1",
      dateLabel: "Versão 1.9.1 · 26 de outubro de 2026",
      items: [
        "O Halloween chegou e fica até 9 de novembro: todos os companheiros usam chapéu de bruxa, e o ícone da app também se mascara. Os gorros de Pai Natal chegam em dezembro.",
        "O teu companheiro tem frases da época e cumprimenta-te no Halloween, no Natal e no Dia de Ano Novo.",
        "Códigos de quarto: partilha um quarto como código no menu ⋯ do quarto, ou copia o de um amigo. Os itens que ainda não tens aparecem como fantasmas até colocares um.",
        "Depois de cada atualização, uma nota curta como esta mostra as novidades.",
      ],
      fixes: [
        "As imagens dos companheiros cabem nas molduras em todos os ecrãs.",
      ],
    },
    {
      version: "1.9.0",
      dateLabel: "Versão 1.9.0 · 24 de outubro de 2026",
      items: [
        "Novo: o Lumen, um companheiro fundador, junta-se a todos os que usam o Growra em 2026. Enquanto for o teu companheiro ativo, cada tarefa dá +1 moeda.",
        "Os alertas do temporizador chegam-te com o Growra em segundo plano, e podes ligar um lembrete diário opcional nas Definições.",
        "Voltaste ao fim de uns dias? O Growra recebe-te com um pequeno resumo dos teus últimos dias ativos.",
        "Cópias de segurança: o código abre a partilha, e importar uma cópia pergunta antes de substituir os teus dados.",
        "Gravações mais seguras: o Growra guarda uma cópia antes de importar e nunca carrega uma gravação de uma versão mais recente.",
        "Acessibilidade: etiquetas mais claras, áreas de toque maiores e texto que se ajusta melhor.",
      ],
      fixes: [
        "O painel mostra a tua sequência real depois de dias falhados.",
        "Correções nos nomes de tarefas, na pesquisa, nos quartos dos companheiros e na exportação CSV.",
      ],
    },
    {
      dateLabel: "Versão 1.8.6 · 19 de outubro de 2026",
      items: [
        "Tarefas: a pesquisa e o adicionar rápido têm espaçamento certo, e um botão no fim dos filtros esconde-os ou mostra-os.",
        "Os quartos mostram a imagem de fundo inteira em vez de um canto ampliado.",
      ],
    },
    {
      dateLabel: "Versão 1.8.5 · 19 de outubro de 2026",
      items: [
        "Novo: adicionar rápido. Escreve uma tarefa no topo das Tarefas e carrega em Adicionar: fica para hoje, sem passos extra.",
        "A categoria passa a ser opcional. As tarefas sem categoria aparecem como Sem categoria, e Adicionar diz-te sempre se falta alguma coisa.",
        "O Growra Plus é reposto de forma fiável quando a app arranca e quando o Google Play diz que já o tens.",
        "Explorar: um toque duplo rápido já não abre dois anúncios.",
        "Mais partes da app em português: categorias, regiões, nomes dos temas e o calendário, com acentos corrigidos.",
        "A barra de transferência da atualização fica no topo e pode ser escondida.",
      ],
    },
    {
      dateLabel: "Versão 1.8.4 · 15 de outubro de 2026",
      items: [
        "Novo: modo escuro. Escolhe Claro, Escuro ou Seguir o telemóvel em Definições > Aparência; todos os temas têm uma versão escura.",
        "Uma nova visita de boas-vindas: quatro passos rápidos, com +100 moedas pela primeira tarefa e +100 de boas-vindas no fim. Podes vê-la outra vez nas Definições.",
        "Carregar em Voltar no painel pergunta antes de sair (podes desligar isto nas Definições).",
        "Avalia o Growra no Google Play a partir das Definições.",
        "Os cartões de tarefa dão a largura toda ao nome, e etiquetas como frequência e estado estão traduzidas.",
        "Os números grandes são mais fáceis de ler (1 234 em vez de 1234).",
        "Adicionar tarefa sugere as categorias que já usas, e as tarefas prontas e as descrições dos companheiros estão em português.",
      ],
    },
    {
      dateLabel: "Versão 1.8.3 · 13 de outubro de 2026",
      items: [
        "O Growra avisa agora quando há uma nova versão no Google Play e pode transferi-la em segundo plano enquanto usas a app.",
      ],
    },
    {
      dateLabel: "Versão 1.8.2 · 11 de outubro de 2026",
      items: [
        "O separador Companheiros chama-se agora Amigos, para o nome caber em telemóveis pequenos.",
      ],
    },
    {
      dateLabel: "Versão 1.8.1 · 8 de outubro de 2026",
      items: [
        "A barra inferior tem ícones, e todos os separadores têm o mesmo tamanho de texto.",
        "O botão do companheiro ativo ficou mais fácil de ler.",
        "Um pequeno som de celebração quando a tua sequência chega aos 7, 14 e 20 dias.",
      ],
    },
    {
      dateLabel: "Versão 1.8.0 · 7 de outubro de 2026",
      items: [
        "Quartos dos companheiros: decora o quarto do teu companheiro e partilha uma imagem.",
        "Música ambiente suave e novos efeitos sonoros para compras, decorações, temas e explorações.",
      ],
    },
    {
      dateLabel: "Versão 1.7.0 · 1 de outubro de 2026",
      items: [
        "Growra Plus: desbloqueio único com 3 temas extra, todas as semanas passadas na Jornada, exportação CSV e sem anúncios.",
        "Envia o teu companheiro a explorar por uma decoração, duas vezes por dia.",
        "Novas decorações só de exploração: fragmento de cometa, pedra da lua, fita arco-íris e frasco de pirilampos.",
      ],
    },
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

/** The notes for one app version, if it has any. */
export function getReleaseNotes(language: AppLanguage, version: string): ChangelogEntry | undefined {
  return changelogByLanguage[language].find((entry) => entry.version === version);
}
