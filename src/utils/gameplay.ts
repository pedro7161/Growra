import {
    BattleConsumableItem,
    CompanionEvent,
    BattleConsumableKind,
    ExpeditionProgress,
    ExpeditionNodeType,
    GearItem,
    GameState,
    Pet,
    PetImages,
    PetRarity,
    PetStats,
    Streak,
    Task,
    TaskStatus,
} from "../types";
import { getCalendarDayDifference, getNextAvailableDate, getStartOfDay } from "./taskSchedule";
import { finishTaskTimer } from "./taskTimer";
import { generateId } from "./idUtils";
import {
  COMPANIONS,
  DAILY_COIN_TASK_CAP,
  STARTER_TEMPLATE_IDS,
  getActiveCompanion,
  getActiveStyle,
  getBondGain,
  getCompletionFacts,
  getGrowthLevel,
  getPerkCoins,
  getPerkStreakBonus,
  isReschedule,
  recordCompletion,
  recordOverdueDeleted,
  recordReschedule,
  recordTaskCreated,
  withToday,
} from "./companions";

const STREAK_BONUS_PER_DAY = 0.05;
const STREAK_BONUS_CAP = 1.0;
export const PLAYER_LEVEL_BASE_COST = 50;
export const PET_LEVEL_BASE_COST = 25;
const FUSION_TASK_MULTIPLIER_STEP = 0.02;
const EVOLUTION_STAGE_ONE_FUSIONS = 2;
const EVOLUTION_STAGE_TWO_FUSIONS = 4;

export const BASE_TASK_COIN_REWARD = 10;
export const BASE_TASK_PLAYER_EXPERIENCE_REWARD = 8;
export const EXPEDITION_MAP_REGIONS = 8;
export const EXPEDITION_POINTS_PER_REGION = 5;
const EXPEDITION_BASE_DURATION_MS = 30_000;
const EXPEDITION_DURATION_STEP_MS = 15_000;
const EXPEDITION_POWER_REDUCTION_MS = 250;
const EXPEDITION_MIN_DURATION_MS = 15_000;
const EXPEDITION_FIGHT_BASE_XP = 14;
const EXPEDITION_FIGHT_XP_STEP = 6;
export const COMMON_SELL_VALUE = 25;
export const RARE_SELL_VALUE = 60;
export const EPIC_SELL_VALUE = 120;
export const LEGENDARY_SELL_VALUE = 240;
export const LEVEL_THRESHOLDS = [12, 16, 24, 41, 81, 99];


const EXPEDITION_WILD_PET_NAMES = [
  "Driftclaw",
  "Rootglow",
  "Duneburst",
  "Cloudjaw",
  "Mirewhisper",
  "Glassstride",
  "Ashthorn",
  "Skyfang",
];

const EXPEDITION_GEAR_NAMES = [
  "Coastline Talisman",
  "Grovecap Charm",
  "Duneweave Guard",
  "Cloudbreak Emblem",
  "Moonpool Sigil",
  "Glasswind Crest",
  "Cinder Hollow Relic",
  "Skyheart Crown",
];

const GEAR_RARITY_BY_ZONE: PetRarity[] = [
  PetRarity.COMMON,
  PetRarity.COMMON,
  PetRarity.RARE,
  PetRarity.RARE,
  PetRarity.EPIC,
  PetRarity.EPIC,
  PetRarity.LEGENDARY,
  PetRarity.LEGENDARY,
];

const BATTLE_CONSUMABLE_KIND_NAMES: Record<BattleConsumableKind, string> = {
  heal: "Restorative Draught",
  attack: "Rage Tonic",
  shield: "Bulwark Charm",
  speed: "Gale Tonic",
  burst: "Burst Flask",
  revive: "Second Wind Sigil",
};

const BATTLE_CONSUMABLE_KIND_DESCRIPTIONS: Record<
  BattleConsumableKind,
  string
> = {
  heal: "Restores endurance and softens the next hit.",
  attack: "Raises attack output for the next battle.",
  shield: "Adds a barrier that absorbs pressure in battle.",
  speed: "Sharpens initiative and lets your pet strike faster.",
  burst: "Delivers a sudden damage spike at the start of battle.",
  revive: "Prevents a defeat from ending the fight too soon.",
};

interface ExpeditionSideNodeBlueprint {
  id: string;
  zoneIndex: number;
  name: string;
  type: ExpeditionNodeType;
  requiredElement: string;
  rewardKind: "reveal" | "xp" | "gear" | "consumable";
  rewardLabel: string;
  rewardPower: number;
  description: string;
  mapX: number;
  mapY: number;
}

interface ExpeditionZoneBlueprint {
  index: number;
  name: string;
  hint: string;
  color: string;
  borderColor: string;
  requiredElement: string;
  mapX: number;
  mapY: number;
  sideNodes: ExpeditionSideNodeBlueprint[];
}

interface PetTemplate {
  id: string;
  name: string;
  element: string;
  description: string;
  rarity: PetRarity;
  stats: Pet["stats"];
  taskMultiplier: number;
  xpMultiplier: number;
  images: PetImages<string>;
}

interface PetProgressionSnapshot {
  evolutionStage: number;
  stats: Pet["stats"];
  taskMultiplier: number;
  xpMultiplier: number;
  combatPower: number;
  explorationPower: number;
}

interface ExpeditionEncounter {
  wildPetName: string;
  wildPower: number;
  gearName: string;
  gearRarity: PetRarity;
  enemyTrait: string;
  enemyTraitDescription: string;
  enemyModifier: number;
}

const EXPEDITION_ZONE_BLUEPRINTS: ExpeditionZoneBlueprint[] = [
  {
    index: 0,
    name: "Sunlit Coast",
    hint: "Warm shores where the first trail markers were planted.",
    color: "#d69363",
    borderColor: "#b76d39",
    requiredElement: "",
    mapX: 120,
    mapY: 300,
    sideNodes: [
      {
        id: "zone-0-cache",
        zoneIndex: 0,
        name: "Tide Cache",
        type: "cache",
        requiredElement: "wind",
        rewardKind: "reveal",
        rewardLabel: "Map reveal",
        rewardPower: 2,
        description: "A hidden crate that reveals a nearby route fragment.",
        mapX: 230,
        mapY: 190,
      },
      {
        id: "zone-0-shrine",
        zoneIndex: 0,
        name: "Shell Shrine",
        type: "shrine",
        requiredElement: "forest",
        rewardKind: "xp",
        rewardLabel: "XP",
        rewardPower: 18,
        description: "A calm shrine that rewards patient scouts with XP.",
        mapX: 50,
        mapY: 430,
      },
    ],
  },
  {
    index: 1,
    name: "Mossway Grove",
    hint: "Dense woodland paths that open only after careful scouting.",
    color: "#5f8f67",
    borderColor: "#41704a",
    requiredElement: "",
    mapX: 370,
    mapY: 180,
    sideNodes: [
      {
        id: "zone-1-cache",
        zoneIndex: 1,
        name: "Root Cache",
        type: "cache",
        requiredElement: "earth",
        rewardKind: "consumable",
        rewardLabel: "Battle item",
        rewardPower: 1,
        description: "A buried satchel containing a battle consumable.",
        mapX: 510,
        mapY: 320,
      },
    ],
  },
  {
    index: 2,
    name: "Amber Dunes",
    hint: "Wind-carved ridges that hide caravan routes under shifting sand.",
    color: "#c98b42",
    borderColor: "#9f6424",
    requiredElement: "",
    mapX: 620,
    mapY: 320,
    sideNodes: [
      {
        id: "zone-2-elite",
        zoneIndex: 2,
        name: "Dune Sentinel",
        type: "elite",
        requiredElement: "fire",
        rewardKind: "gear",
        rewardLabel: "Gear",
        rewardPower: 1,
        description: "An elite outcrop that guards a stronger gear drop.",
        mapX: 540,
        mapY: 100,
      },
      {
        id: "zone-2-secret",
        zoneIndex: 2,
        name: "Buried Caravan",
        type: "secret",
        requiredElement: "water",
        rewardKind: "reveal",
        rewardLabel: "Map reveal",
        rewardPower: 3,
        description: "A secret route cache that pushes the map further ahead.",
        mapX: 760,
        mapY: 430,
      },
    ],
  },
  {
    index: 3,
    name: "Cloudbreak Ridge",
    hint: "A high pass where map fragments drift between cliff shadows.",
    color: "#6c89b8",
    borderColor: "#476794",
    requiredElement: "",
    mapX: 880,
    mapY: 170,
    sideNodes: [
      {
        id: "zone-3-shrine",
        zoneIndex: 3,
        name: "Storm Shrine",
        type: "shrine",
        requiredElement: "storm",
        rewardKind: "xp",
        rewardLabel: "XP",
        rewardPower: 24,
        description: "A wind-cut altar that teaches a scout how to read the sky.",
        mapX: 820,
        mapY: 60,
      },
      {
        id: "zone-3-cache",
        zoneIndex: 3,
        name: "Ridge Cache",
        type: "cache",
        requiredElement: "wind",
        rewardKind: "consumable",
        rewardLabel: "Battle item",
        rewardPower: 2,
        description: "A ledge cache with a higher-tier consumable inside.",
        mapX: 1010,
        mapY: 300,
      },
    ],
  },
  {
    index: 4,
    name: "Moonpool Marsh",
    hint: "Still water and silver reeds reflecting what lies further north.",
    color: "#738f84",
    borderColor: "#547265",
    requiredElement: "",
    mapX: 1140,
    mapY: 340,
    sideNodes: [
      {
        id: "zone-4-gear",
        zoneIndex: 4,
        name: "Moonpool Reliquary",
        type: "secret",
        requiredElement: "water",
        rewardKind: "gear",
        rewardLabel: "Gear",
        rewardPower: 2,
        description: "A rare reliquary that tends to drop stronger gear.",
        mapX: 1260,
        mapY: 170,
      },
    ],
  },
  {
    index: 5,
    name: "Glasswind Expanse",
    hint: "Open plains where the route becomes visible after repeated passes.",
    color: "#7a9cba",
    borderColor: "#547792",
    requiredElement: "",
    mapX: 1400,
    mapY: 210,
    sideNodes: [
      {
        id: "zone-5-cache",
        zoneIndex: 5,
        name: "Glass Cache",
        type: "cache",
        requiredElement: "crystal",
        rewardKind: "reveal",
        rewardLabel: "Map reveal",
        rewardPower: 2,
        description: "A reflective cache that helps uncover hidden branches.",
        mapX: 1350,
        mapY: 470,
      },
      {
        id: "zone-5-shrine",
        zoneIndex: 5,
        name: "Wind Shrine",
        type: "shrine",
        requiredElement: "wind",
        rewardKind: "xp",
        rewardLabel: "XP",
        rewardPower: 30,
        description: "A fast-moving shrine that rewards precision scouting.",
        mapX: 1560,
        mapY: 80,
      },
    ],
  },
  {
    index: 6,
    name: "Cinder Hollow",
    hint: "A volcanic basin that glows brighter with each expedition return.",
    color: "#b75d4b",
    borderColor: "#8d3b2f",
    requiredElement: "",
    mapX: 1680,
    mapY: 360,
    sideNodes: [
      {
        id: "zone-6-elite",
        zoneIndex: 6,
        name: "Forge Beast",
        type: "elite",
        requiredElement: "lava",
        rewardKind: "gear",
        rewardLabel: "Gear",
        rewardPower: 2,
        description: "A heat-shimmering elite node with strong item rewards.",
        mapX: 1600,
        mapY: 180,
      },
      {
        id: "zone-6-consumable",
        zoneIndex: 6,
        name: "Cinder Cache",
        type: "cache",
        requiredElement: "fire",
        rewardKind: "consumable",
        rewardLabel: "Battle item",
        rewardPower: 2,
        description: "A smoldering cache that yields combat supplies.",
        mapX: 1835,
        mapY: 470,
      },
    ],
  },
  {
    index: 7,
    name: "Skyheart Summit",
    hint: "The final landmark, revealed only when the map is nearly complete.",
    color: "#7d6fb7",
    borderColor: "#564b8c",
    requiredElement: "",
    mapX: 1960,
    mapY: 180,
    sideNodes: [
      {
        id: "zone-7-secret",
        zoneIndex: 7,
        name: "Starfall Vault",
        type: "secret",
        requiredElement: "solar",
        rewardKind: "gear",
        rewardLabel: "Gear",
        rewardPower: 3,
        description: "A high summit vault with the best gear and loot odds.",
        mapX: 1910,
        mapY: 70,
      },
      {
        id: "zone-7-elite",
        zoneIndex: 7,
        name: "Summit Trial",
        type: "elite",
        requiredElement: "cosmic",
        rewardKind: "reveal",
        rewardLabel: "Map reveal",
        rewardPower: 4,
        description: "A final trial that can push the map to its limit.",
        mapX: 2040,
        mapY: 420,
      },
    ],
  },
];

const PET_TEMPLATES: Record<PetRarity, PetTemplate[]> = {
  [PetRarity.COMMON]: [
    {
      id: "sprout",
      name: "Sprout",
      element: "forest",
      description:
        "A mushroom grove buddy that grows brighter wherever it rests.",
      rarity: PetRarity.COMMON,
      stats: { attack: 5, defense: 5, speed: 5, luck: 5 },
      taskMultiplier: 0.05,
      xpMultiplier: 0.9,
      images: {
        base: "assets/pets/sprout/base.png",
        evo1: "assets/pets/sprout/evo1.png",
        evo2: "assets/pets/sprout/evo2.png",
        variants: {
          default: "assets/pets/sprout/variants/default.png",
        },
      },
    },
    {
      id: "pebble",
      name: "Pebble",
      element: "earth",
      description:
        "A sturdy little boulder critter that gathers flowers and moss.",
      rarity: PetRarity.COMMON,
      stats: { attack: 6, defense: 6, speed: 4, luck: 4 },
      taskMultiplier: 0.05,
      xpMultiplier: 1.1,
      images: {
        base: "assets/pets/pebble/base.png",
        evo1: "assets/pets/pebble/evo1.png",
        evo2: "assets/pets/pebble/evo2.png",
        variants: {
          default: "assets/pets/pebble/variants/default.png",
        },
      },
    },
    {
      id: "moss",
      name: "Moss",
      element: "forest",
      description:
        "A calm woodland lump that carries a tiny meadow on its back.",
      rarity: PetRarity.COMMON,
      stats: { attack: 4, defense: 7, speed: 5, luck: 4 },
      taskMultiplier: 0.05,
      xpMultiplier: 0.85,
      images: {
        base: "assets/pets/moss/base.png",
        evo1: "assets/pets/moss/evo1.png",
        evo2: "assets/pets/moss/evo2.png",
        variants: {
          default: "assets/pets/moss/variants/default.png",
        },
      },
    },
    {
      id: "zephie",
      name: "Zephie",
      element: "wind",
      description:
        "A breezy sky puff that plays with petals and leaves as if they were part of its aura.",
      rarity: PetRarity.COMMON,
      stats: { attack: 4, defense: 5, speed: 7, luck: 6 },
      taskMultiplier: 0.05,
      xpMultiplier: 1,
      images: {
        base: "assets/pets/zephie/base.png",
        evo1: "assets/pets/zephie/evo1.png",
        evo2: "assets/pets/zephie/evo2.png",
        variants: {
          default: "assets/pets/zephie/variants/default.png",
        },
      },
    },
  ],
  [PetRarity.RARE]: [
    {
      id: "ember",
      name: "Ember",
      element: "fire",
      description: "A cheerful flame sprite that burns hottest at its core.",
      rarity: PetRarity.RARE,
      stats: { attack: 8, defense: 6, speed: 7, luck: 6 },
      taskMultiplier: 0.1,
      xpMultiplier: 1.3,
      images: {
        base: "assets/pets/ember/base.png",
        evo1: "assets/pets/ember/evo1.png",
        evo2: "assets/pets/ember/evo2.png",
        variants: {
          default: "assets/pets/ember/variants/default.png",
        },
      },
    },
    {
      id: "ripple",
      name: "Ripple",
      element: "water",
      description:
        "A playful water critter that stirs bright rings wherever it splashes down.",
      rarity: PetRarity.RARE,
      stats: { attack: 7, defense: 7, speed: 8, luck: 6 },
      taskMultiplier: 0.1,
      xpMultiplier: 1.45,
      images: {
        base: "assets/pets/ripple/base.png",
        evo1: "assets/pets/ripple/evo1.png",
        evo2: "assets/pets/ripple/evo2.png",
        variants: {
          default: "assets/pets/ripple/variants/default.png",
        },
      },
    },
    {
      id: "tempo",
      name: "Tempo",
      element: "storm",
      description:
        "A thunder puff that gathers rainlight and hums before each tiny lightning burst.",
      rarity: PetRarity.RARE,
      stats: { attack: 8, defense: 5, speed: 8, luck: 7 },
      taskMultiplier: 0.1,
      xpMultiplier: 1.4,
      images: {
        base: "assets/pets/tempo/base.png",
        evo1: "assets/pets/tempo/evo1.png",
        evo2: "assets/pets/tempo/evo2.png",
        variants: {
          default: "assets/pets/tempo/variants/default.png",
        },
      },
    },
    {
      id: "glint",
      name: "Glint",
      element: "crystal",
      description:
        "A prism critter whose tiny gemstone horns scatter warm light into the grass around it.",
      rarity: PetRarity.RARE,
      stats: { attack: 6, defense: 8, speed: 6, luck: 8 },
      taskMultiplier: 0.1,
      xpMultiplier: 1.5,
      images: {
        base: "assets/pets/glint/base.png",
        evo1: "assets/pets/glint/evo1.png",
        evo2: "assets/pets/glint/evo2.png",
        variants: {
          default: "assets/pets/glint/variants/default.png",
        },
      },
    },
  ],
  [PetRarity.EPIC]: [
    {
      id: "astra",
      name: "Astra",
      element: "cosmic",
      description:
        "A star cloud companion that glitters like a whole sky in miniature.",
      rarity: PetRarity.EPIC,
      stats: { attack: 9, defense: 10, speed: 8, luck: 9 },
      taskMultiplier: 0.15,
      xpMultiplier: 1.7,
      images: {
        base: "assets/pets/astra/base.png",
        evo1: "assets/pets/astra/evo1.png",
        evo2: "assets/pets/astra/evo2.png",
        variants: {
          default: "assets/pets/astra/variants/default.png",
        },
      },
    },
    {
      id: "umbra",
      name: "Umbra",
      element: "shadow",
      description:
        "A velvet shadow sprite that glows softly in moonlit fog instead of hiding inside it.",
      rarity: PetRarity.EPIC,
      stats: { attack: 10, defense: 8, speed: 9, luck: 9 },
      taskMultiplier: 0.15,
      xpMultiplier: 1.75,
      images: {
        base: "assets/pets/umbra/base.png",
        evo1: "assets/pets/umbra/evo1.png",
        evo2: "assets/pets/umbra/evo2.png",
        variants: {
          default: "assets/pets/umbra/variants/default.png",
        },
      },
    },
  ],
  [PetRarity.LEGENDARY]: [
    {
      id: "nova",
      name: "Nova",
      element: "solar",
      description:
        "A radiant star-core pet whose aura bends fire and starlight together.",
      rarity: PetRarity.LEGENDARY,
      stats: { attack: 11, defense: 10, speed: 10, luck: 9 },
      taskMultiplier: 0.2,
      xpMultiplier: 1.85,
      images: {
        base: "assets/pets/nova/base.png",
        evo1: "assets/pets/nova/evo1.png",
        evo2: "assets/pets/nova/evo2.png",
        variants: {
          default: "assets/pets/nova/variants/default.png",
        },
      },
    },
    {
      id: "cindra",
      name: "Cindra",
      element: "lava",
      description:
        "A molten cuddle beast with a bright magma heart and a habit of kicking up ember sparks.",
      rarity: PetRarity.LEGENDARY,
      stats: { attack: 12, defense: 11, speed: 9, luck: 10 },
      taskMultiplier: 0.2,
      xpMultiplier: 1.9,
      images: {
        base: "assets/pets/cindra/base.png",
        evo1: "assets/pets/cindra/evo1.png",
        evo2: "assets/pets/cindra/evo2.png",
        variants: {
          default: "assets/pets/cindra/variants/default.png",
        },
      },
    },
  ],
};

function getExperienceForLevel(level: number, baseCost: number): number {
  return baseCost * level * (level - 1);
}

export function getLevel(experience: number, levelBaseCost: number): number {
  if (experience < 0) return 1;
  let level = 1;
  while (getExperienceForLevel(level + 1, levelBaseCost) <= experience) {
    level++;
  }
  return level;
}

export function getLevelProgress(
  experience: number,
  levelBaseCost: number,
): number {
  const level = getLevel(experience, levelBaseCost);
  const levelStart = getExperienceForLevel(level, levelBaseCost);
  const nextLevelStart = getExperienceForLevel(level + 1, levelBaseCost);
  const nextLevelCost = nextLevelStart - levelStart;
  if (nextLevelCost <= 0) return 0;
  return Math.min(1, Math.max(0, (experience - levelStart) / nextLevelCost));
}

export function getExpeditionMapRegionCount(
  expeditionProgress: ExpeditionProgress,
): number {
  return Math.min(
    EXPEDITION_MAP_REGIONS,
    Math.floor(expeditionProgress.revealPoints / EXPEDITION_POINTS_PER_REGION),
  );
}

export function getExpeditionDurationMs(
  zoneIndex: number,
  explorationPower: number,
): number {
  return Math.max(
    EXPEDITION_MIN_DURATION_MS,
    EXPEDITION_BASE_DURATION_MS +
      zoneIndex * EXPEDITION_DURATION_STEP_MS -
      explorationPower * EXPEDITION_POWER_REDUCTION_MS,
  );
}

function getBonusFromLevel(level: number): number {
  return Math.min(level * STREAK_BONUS_PER_DAY, STREAK_BONUS_CAP);
}

function getEvolutionStage(fusionLevel: number): number {
  if (fusionLevel >= EVOLUTION_STAGE_TWO_FUSIONS) {
    return 2;
  }

  if (fusionLevel >= EVOLUTION_STAGE_ONE_FUSIONS) {
    return 1;
  }

  return 0;
}

function getCombatPower(stats: Pet["stats"], evolutionStage: number): number {
  return (
    stats.attack * 4 +
    stats.defense * 3 +
    stats.speed * 2 +
    stats.luck +
    evolutionStage * 12
  );
}

function getExplorationPower(
  stats: Pet["stats"],
  evolutionStage: number,
): number {
  return (
    stats.speed * 3 +
    stats.luck * 3 +
    stats.attack +
    stats.defense +
    evolutionStage * 10
  );
}

function getRewardMultiplier(
  streakBonus: number,
  petMultiplier: number,
): number {
  return (1 + streakBonus) * (1 + petMultiplier);
}

function addStats(left: PetStats, right: PetStats): PetStats {
  return {
    attack: left.attack + right.attack,
    defense: left.defense + right.defense,
    speed: left.speed + right.speed,
    luck: left.luck + right.luck,
  };
}

function getZeroStats(): PetStats {
  return {
    attack: 0,
    defense: 0,
    speed: 0,
    luck: 0,
  };
}

function createPetFromTemplate(template: PetTemplate): Pet {
  const createdAt = Date.now();
  const progression = getPetProgressionSnapshot(template.id, 0);

  return {
    id: generateId(),
    templateId: template.id,
    name: template.name,
    rarity: template.rarity,
    baseStats: progression.stats,
    level: 1,
    experience: 0,
    fusionLevel: 0,
    evolutionStage: progression.evolutionStage,
    stats: progression.stats,
    combatPower: progression.combatPower,
    explorationPower: progression.explorationPower,
    passives: [],
    taskMultiplier: progression.taskMultiplier,
    xpMultiplier: progression.xpMultiplier,
    activeImageVariantId: "default",
    equippedGearId: "",
    equipped: false,
    createdAt,
    bond: 0,
  };
}

function getPetTemplate(templateId: string): PetTemplate {
  const template = Object.values(PET_TEMPLATES)
    .flat()
    .find((petTemplate) => petTemplate.id === templateId);

  if (template) {
    return template;
  }

  return PET_TEMPLATES[PetRarity.COMMON][0];
}

export function getPetTemplateId(name: string, rarity: PetRarity): string {
  const template = PET_TEMPLATES[rarity].find(
    (petTemplate) => petTemplate.name === name,
  );

  if (template) {
    return template.id;
  }

  return PET_TEMPLATES[rarity][0].id;
}

export function getPetElement(templateId: string): string {
  return getPetTemplate(templateId).element;
}

export function getPetTemplates(): PetTemplate[] {
  return Object.values(PET_TEMPLATES).flat();
}

export function getSellValue(rarity: PetRarity): number {
  if (rarity === PetRarity.LEGENDARY) {
    return LEGENDARY_SELL_VALUE;
  }

  if (rarity === PetRarity.EPIC) {
    return EPIC_SELL_VALUE;
  }

  if (rarity === PetRarity.RARE) {
    return RARE_SELL_VALUE;
  }

  return COMMON_SELL_VALUE;
}

function getFusionBonusStats(templateId: string): Pet["stats"] {
  const templateStats = getPetTemplate(templateId).stats;

  return {
    attack: Math.max(1, Math.round(templateStats.attack * 0.15)),
    defense: Math.max(1, Math.round(templateStats.defense * 0.15)),
    speed: Math.max(1, Math.round(templateStats.speed * 0.15)),
    luck: Math.max(1, Math.round(templateStats.luck * 0.15)),
  };
}

export function getPetProgressionSnapshot(
  templateId: string,
  fusionLevel: number,
): PetProgressionSnapshot {
  const template = getPetTemplate(templateId);
  const fusionBonus = getFusionBonusStats(templateId);
  const evolutionStage = getEvolutionStage(fusionLevel);
  const stats = {
    attack: template.stats.attack + fusionBonus.attack * fusionLevel,
    defense: template.stats.defense + fusionBonus.defense * fusionLevel,
    speed: template.stats.speed + fusionBonus.speed * fusionLevel,
    luck: template.stats.luck + fusionBonus.luck * fusionLevel,
  };
  const taskMultiplier =
    template.taskMultiplier + fusionLevel * FUSION_TASK_MULTIPLIER_STEP;

  return {
    evolutionStage,
    stats,
    taskMultiplier,
    xpMultiplier: template.xpMultiplier,
    combatPower: getCombatPower(stats, evolutionStage),
    explorationPower: getExplorationPower(stats, evolutionStage),
  };
}

function getExpeditionEncounter(zoneIndex: number): ExpeditionEncounter {
  const encounterIndex = Math.min(zoneIndex, EXPEDITION_WILD_PET_NAMES.length - 1);
  const wildPower = 18 + encounterIndex * 14;
  const enemyTraitIndex = Math.min(zoneIndex, 4);
  const enemyTraits = [
    {
      name: "Brutal",
      description: "Hits harder than its size suggests.",
      modifier: 4,
    },
    {
      name: "Guarded",
      description: "Tanks damage and drags the fight longer.",
      modifier: 6,
    },
    {
      name: "Swift",
      description: "Punishes slow loadouts and weak initiative.",
      modifier: 5,
    },
    {
      name: "Aggressive",
      description: "Presses the attack and rewards stronger burst items.",
      modifier: 7,
    },
    {
      name: "Relentless",
      description: "A late-zone threat that tests every part of the loadout.",
      modifier: 10,
    },
  ];
  const enemyTrait = enemyTraits[enemyTraitIndex];

  return {
    wildPetName: EXPEDITION_WILD_PET_NAMES[encounterIndex],
    wildPower: wildPower + enemyTrait.modifier,
    gearName: EXPEDITION_GEAR_NAMES[encounterIndex],
    gearRarity: GEAR_RARITY_BY_ZONE[encounterIndex],
    enemyTrait: enemyTrait.name,
    enemyTraitDescription: enemyTrait.description,
    enemyModifier: enemyTrait.modifier,
  };
}

export function getExpeditionBattlePreview(zoneIndex: number): ExpeditionEncounter {
  return getExpeditionEncounter(zoneIndex);
}

export function getExpeditionZoneBlueprints(): ExpeditionZoneBlueprint[] {
  return EXPEDITION_ZONE_BLUEPRINTS;
}

export function getExpeditionZoneBlueprint(zoneIndex: number): ExpeditionZoneBlueprint {
  return EXPEDITION_ZONE_BLUEPRINTS[
    Math.min(zoneIndex, EXPEDITION_ZONE_BLUEPRINTS.length - 1)
  ];
}

export function getExpeditionSideNodeById(
  nodeId: string,
): ExpeditionSideNodeBlueprint {
  const node = EXPEDITION_ZONE_BLUEPRINTS.flatMap((zone) => zone.sideNodes).find(
    (candidate) => candidate.id === nodeId,
  );

  if (node) {
    return node;
  }

  return EXPEDITION_ZONE_BLUEPRINTS[0].sideNodes[0];
}

export function getExpeditionNodeDurationMs(
  nodeId: string,
  petId: string,
  gameState: GameState,
): number {
  const node = getExpeditionSideNodeById(nodeId);
  const scout = gameState.pets.filter((pet) => pet.id === petId)[0];
  const baseDuration = 18000 + node.rewardPower * 3200;
  const speedBonus = scout.explorationPower * 85;

  return Math.max(9000, baseDuration - speedBonus);
}

function applyExpeditionNodeReward(
  gameState: GameState,
  nodeId: string,
  petId: string,
): GameState {
  const node = getExpeditionSideNodeById(nodeId);
  const scout = gameState.pets.filter((pet) => pet.id === petId)[0];
  const scoutElement = getPetElement(scout.templateId);
  const elementMatched = scoutElement === node.requiredElement;

  if (isExpeditionNodeCompleted(gameState, nodeId)) {
    return gameState;
  }

  if (!elementMatched) {
    return gameState;
  }

  const rewardMultiplier = elementMatched ? 2 : 1;
  const nextGameState = {
    ...gameState,
    battleConsumables:
      node.rewardKind === "consumable"
        ? [
            ...gameState.battleConsumables,
            createBattleConsumableDrop(
              node.zoneIndex,
              true,
              node.rewardPower + rewardMultiplier,
            ),
          ]
        : gameState.battleConsumables,
    gearItems:
      node.rewardKind === "gear"
        ? [
            ...gameState.gearItems,
            createGearDrop(node.zoneIndex, true, node.rewardPower + rewardMultiplier),
          ]
        : gameState.gearItems,
    pets:
      node.rewardKind === "xp"
        ? gameState.pets.map((pet) => {
            if (pet.id !== petId) {
              return pet;
            }

            const experience = pet.experience + node.rewardPower * rewardMultiplier;

            return {
              ...pet,
              experience,
              level: getLevel(experience, PET_LEVEL_BASE_COST),
            };
          })
        : gameState.pets,
    expeditionProgress: {
      ...gameState.expeditionProgress,
      revealPoints:
        gameState.expeditionProgress.revealPoints +
        (node.rewardKind === "reveal"
          ? node.rewardPower * rewardMultiplier
          : rewardMultiplier),
      completedNodeIds: [...gameState.expeditionProgress.completedNodeIds, node.id],
    },
    lastPlayedAt: Date.now(),
  };

  return refreshPetGearState(nextGameState);
}

function getGearBonusStats(rarity: PetRarity, zoneIndex: number): PetStats {
  const tierBonus = rarity === PetRarity.LEGENDARY ? 4 : rarity === PetRarity.EPIC ? 3 : rarity === PetRarity.RARE ? 2 : 1;
  const spreadBonus = Math.floor(zoneIndex / 2);

  return {
    attack: tierBonus + spreadBonus,
    defense: tierBonus + spreadBonus,
    speed: Math.max(1, tierBonus - 1 + spreadBonus),
    luck: Math.max(1, Math.floor(tierBonus / 2) + spreadBonus),
  };
}

function getGearDropName(zoneIndex: number): string {
  return EXPEDITION_GEAR_NAMES[Math.min(zoneIndex, EXPEDITION_GEAR_NAMES.length - 1)];
}

function boostGearRarity(rarity: PetRarity, boost: number): PetRarity {
  if (boost <= 0) {
    return rarity;
  }

  if (rarity === PetRarity.COMMON) {
    return boost >= 2 ? PetRarity.RARE : PetRarity.COMMON;
  }

  if (rarity === PetRarity.RARE) {
    return boost >= 2 ? PetRarity.EPIC : PetRarity.RARE;
  }

  if (rarity === PetRarity.EPIC) {
    return boost >= 2 ? PetRarity.LEGENDARY : PetRarity.EPIC;
  }

  return PetRarity.LEGENDARY;
}

function getUnequippedGearItems(gameState: GameState, petId: string): GearItem[] {
  return gameState.gearItems.filter((gearItem) => gearItem.equippedPetId === petId);
}

function getBattleConsumableRarity(zoneIndex: number): PetRarity {
  if (zoneIndex >= 6) {
    return PetRarity.LEGENDARY;
  }

  if (zoneIndex >= 4) {
    return PetRarity.EPIC;
  }

  if (zoneIndex >= 2) {
    return PetRarity.RARE;
  }

  return PetRarity.COMMON;
}

export function getBattleConsumableKindLabel(kind: BattleConsumableKind): string {
  return BATTLE_CONSUMABLE_KIND_NAMES[kind];
}

export function getBattleConsumableDescription(kind: BattleConsumableKind): string {
  return BATTLE_CONSUMABLE_KIND_DESCRIPTIONS[kind];
}

function getBattleConsumableKind(zoneIndex: number, victory: boolean): BattleConsumableKind {
  const kinds: BattleConsumableKind[] = [
    "heal",
    "attack",
    "shield",
    "speed",
    "burst",
    "revive",
  ];
  const offset = victory ? zoneIndex : zoneIndex + 2;

  return kinds[offset % kinds.length];
}

function createBattleConsumableDrop(
  zoneIndex: number,
  victory: boolean,
  powerBonus: number,
): BattleConsumableItem {
  const kind = getBattleConsumableKind(zoneIndex, victory);
  const rarity = getBattleConsumableRarity(zoneIndex);
  const zoneName = getExpeditionZoneBlueprint(zoneIndex).name;

  return {
    id: generateId(),
    name: `${BATTLE_CONSUMABLE_KIND_NAMES[kind]} of ${zoneName}`,
    kind,
    rarity,
    potency: Math.max(1, powerBonus),
    sourceZoneIndex: zoneIndex,
    acquiredAt: Date.now(),
  };
}

function getBattleConsumableBonus(item: BattleConsumableItem): number {
  const rarityBonus =
    item.rarity === PetRarity.LEGENDARY
      ? 6
      : item.rarity === PetRarity.EPIC
        ? 4
        : item.rarity === PetRarity.RARE
          ? 2
          : 1;

  return item.potency + rarityBonus;
}

function getBattleConsumableEffectTotals(
  consumables: BattleConsumableItem[],
): Record<BattleConsumableKind, number> {
  return consumables.reduce(
    (totals, item) => ({
      ...totals,
      [item.kind]: totals[item.kind] + getBattleConsumableBonus(item),
    }),
    {
      heal: 0,
      attack: 0,
      shield: 0,
      speed: 0,
      burst: 0,
      revive: 0,
    },
  );
}

export interface ExpeditionBattleOutcome {
  zoneIndex: number;
  victory: boolean;
  playerPower: number;
  enemyPower: number;
  xpReward: number;
  encounter: ExpeditionEncounter;
  loadout: BattleConsumableItem[];
}

export function getBattleConsumablesForLoadout(
  gameState: GameState,
  itemIds: string[],
): BattleConsumableItem[] {
  return itemIds
    .map(
      (itemId) =>
        gameState.battleConsumables.filter((item) => item.id === itemId)[0]!,
    );
}

export function getBattleLoadoutPower(
  gameState: GameState,
  itemIds: string[],
): number {
  return getBattleConsumableEffectTotals(
    getBattleConsumablesForLoadout(gameState, itemIds),
  ).attack;
}

export function previewExpeditionBattleOutcome(
  gameState: GameState,
  zoneIndex: number,
  petId: string,
  battleConsumableIds: string[] = [],
): ExpeditionBattleOutcome {
  const fighter = gameState.pets.filter((pet) => pet.id === petId)[0];
  const encounter = getExpeditionEncounter(zoneIndex);
  const loadout = getBattleConsumablesForLoadout(gameState, battleConsumableIds);
  const loadoutTotals = getBattleConsumableEffectTotals(loadout);
  const playerPower =
    fighter.combatPower +
    loadoutTotals.attack * 11 +
    loadoutTotals.speed * 7 +
    loadoutTotals.shield * 9 +
    loadoutTotals.heal * 5 +
    loadoutTotals.burst * 13 +
    loadoutTotals.revive * 18;
  const enemyPower =
    encounter.wildPower +
    zoneIndex * 5 +
    encounter.enemyModifier +
    (loadout.length === 0 ? 8 : 0);
  const victory =
    playerPower >= enemyPower ||
    (loadoutTotals.revive > 0 &&
      playerPower + loadoutTotals.revive * 12 >= enemyPower);
  const xpReward = Math.round(
    EXPEDITION_FIGHT_BASE_XP +
      zoneIndex * EXPEDITION_FIGHT_XP_STEP +
      (victory ? fighter.combatPower * 0.25 : fighter.combatPower * 0.1) +
      loadoutTotals.attack * 2 +
      loadoutTotals.heal,
  );

  return {
    zoneIndex,
    victory,
    playerPower,
    enemyPower,
    xpReward,
    encounter,
    loadout,
  };
}

function getPetGearBonus(gameState: GameState, petId: string): PetStats {
  return getUnequippedGearItems(gameState, petId).reduce(
    (bonus, gearItem) => addStats(bonus, gearItem.bonusStats),
    getZeroStats(),
  );
}

export function refreshPetGearState(gameState: GameState): GameState {
  return {
    ...gameState,
    pets: gameState.pets.map((pet) => {
      const gearBonus = getPetGearBonus(gameState, pet.id);
      const stats = addStats(pet.baseStats, gearBonus);

      return {
        ...pet,
        equippedGearId: getUnequippedGearItems(gameState, pet.id)[0]
          ? getUnequippedGearItems(gameState, pet.id)[0].id
          : "",
        stats,
        combatPower: getCombatPower(stats, pet.evolutionStage),
        explorationPower: getExplorationPower(stats, pet.evolutionStage),
      };
    }),
  };
}

export function equipGearToPet(
  gameState: GameState,
  gearItemId: string,
  petId: string,
): GameState {
  const nextGameState = {
    ...gameState,
    gearItems: gameState.gearItems.map((gearItem) =>
      gearItem.equippedPetId === petId
        ? {
            ...gearItem,
            equippedPetId: gearItem.id === gearItemId ? petId : "",
          }
        : gearItem.id === gearItemId
          ? {
              ...gearItem,
              equippedPetId: petId,
            }
          : gearItem,
    ),
  };

  return refreshPetGearState(nextGameState);
}

function createGearDrop(
  zoneIndex: number,
  victory: boolean,
  rarityBoost: number = 0,
): GearItem {
  const encounter = getExpeditionEncounter(zoneIndex);
  const dropRarity = victory
    ? encounter.gearRarity
    : GEAR_RARITY_BY_ZONE[Math.max(0, zoneIndex - 1)];
  const adjustedRarity = boostGearRarity(dropRarity, rarityBoost);
  const bonusStats = getGearBonusStats(adjustedRarity, zoneIndex + rarityBoost);

  return {
    id: generateId(),
    name: getGearDropName(zoneIndex),
    rarity: adjustedRarity,
    bonusStats,
    sourceZoneIndex: zoneIndex,
    equippedPetId: "",
    acquiredAt: Date.now(),
  };
}

export function calculateUpdatedStreak(
  streak: Streak,
  completedAt: number,
): Streak {
  if (streak.lastCompletedDate === 0) {
    return {
      level: 1,
      bonus: getBonusFromLevel(1),
      lastCompletedDate: getStartOfDay(completedAt),
      consecutiveMisses: 0,
    };
  }

  const dayDifference = getCalendarDayDifference(streak.lastCompletedDate, completedAt);

  if (dayDifference === 0) {
    return {
      ...streak,
      lastCompletedDate: getStartOfDay(completedAt),
      consecutiveMisses: 0,
    };
  }

  if (dayDifference === 1) {
    const level = Math.min(
      streak.level + 1,
      Math.floor(STREAK_BONUS_CAP / STREAK_BONUS_PER_DAY),
    );

    return {
      level,
      bonus: getBonusFromLevel(level),
      lastCompletedDate: getStartOfDay(completedAt),
      consecutiveMisses: 0,
    };
  }

  const missedDays = dayDifference - 1;

  if (missedDays >= 3) {
    return {
      level: 1,
      bonus: getBonusFromLevel(1),
      lastCompletedDate: getStartOfDay(completedAt),
      consecutiveMisses: 0,
    };
  }

  const level = Math.max(streak.level - missedDays, 1);

  return {
    level,
    bonus: getBonusFromLevel(level),
    lastCompletedDate: getStartOfDay(completedAt),
    consecutiveMisses: 0,
  };
}

export function completeTask(gameState: GameState, taskId: string): GameState {
  const targetTask = gameState.tasks.find((task) => task.id === taskId);
  // Only a pending task can be completed; a repeat call (e.g. a double tap) must not pay twice.
  if (!targetTask || targetTask.status !== TaskStatus.PENDING || targetTask.dueDate > Date.now()) {
    return gameState;
  }

  if (targetTask.timer.enabled && targetTask.timer.state !== "ready") {
    return gameState;
  }

  const completedAt = Date.now();
  const usageToday = withToday(gameState.usage, completedAt);
  const facts = getCompletionFacts(targetTask, usageToday, completedAt);
  const activeStyle = getActiveStyle(gameState);
  const nextStreak = calculateUpdatedStreak(gameState.streak, completedAt);
  const equippedPet = gameState.pets.find(
    (pet) => pet.id === gameState.equippedPetId,
  );
  const petMultiplier = equippedPet ? equippedPet.taskMultiplier : 0;
  const rewardMultiplier = getRewardMultiplier(
    nextStreak.bonus + getPerkStreakBonus(activeStyle),
    petMultiplier,
  );
  // Light anti-farming only (§6): coins stop after the daily cap; XP and Bond keep counting.
  const paysCoins = usageToday.todayCoinTasks < DAILY_COIN_TASK_CAP;
  const gainedCoins = paysCoins
    ? Math.round(BASE_TASK_COIN_REWARD * rewardMultiplier) + getPerkCoins(activeStyle, facts)
    : 0;
  const gainedPlayerExperience = Math.round(
    BASE_TASK_PLAYER_EXPERIENCE_REWARD * rewardMultiplier,
  );
  const totalExperience = gameState.totalExperience + gainedPlayerExperience;
  const bondGain = getBondGain(activeStyle, facts, usageToday);
  const usage = recordCompletion(
    {
      ...usageToday,
      todayCoinTasks: usageToday.todayCoinTasks + (paysCoins ? 1 : 0),
      todayBaseBond: usageToday.todayBaseBond + (bondGain.countsTowardBaseCap ? 1 : 0),
    },
    facts,
    completedAt,
  );

  const afterCompletion: GameState = {
    ...gameState,
    level: getLevel(totalExperience, PLAYER_LEVEL_BASE_COST),
    coins: gameState.coins + gainedCoins,
    totalExperience,
    totalTasksCompleted: gameState.totalTasksCompleted + 1,
    tasks: gameState.tasks.map((task) => {
      if (task.id !== taskId) {
        return task;
      }

      const completedTask: Task = {
        ...task,
        status: TaskStatus.COMPLETED,
        dueDate: getNextAvailableDate(task, completedAt),
        completedAt,
      };

      return finishTaskTimer(completedTask);
    }),
    usage,
    streak: nextStreak,
    lastPlayedAt: completedAt,
  };

  const withBond = equippedPet
    ? addCompanionBond(afterCompletion, equippedPet.id, bondGain.bond)
    : afterCompletion;
  return applyCompanionJoins(withBond);
}

/** Creates a companion from a template (every companion exists once; see utils/companions.ts). */
export function createCompanion(templateId: string, bond: number = 0): Pet {
  return withCompanionBond(createPetFromTemplate(getPetTemplate(templateId)), bond);
}

/** Sets a companion's Bond and recomputes its growth, evolution stage and stats. */
export function withCompanionBond(pet: Pet, bond: number): Pet {
  const progression = getPetProgressionSnapshot(pet.templateId, getGrowthLevel(bond));
  return {
    ...pet,
    bond,
    fusionLevel: getGrowthLevel(bond),
    baseStats: progression.stats,
    evolutionStage: progression.evolutionStage,
    stats: progression.stats,
    combatPower: progression.combatPower,
    explorationPower: progression.explorationPower,
    taskMultiplier: progression.taskMultiplier,
  };
}

export function addCompanionBond(gameState: GameState, petId: string, amount: number): GameState {
  if (amount <= 0) {
    return gameState;
  }

  const events: CompanionEvent[] = [];
  const pets = gameState.pets.map((pet) => {
    if (pet.id !== petId) {
      return pet;
    }
    const grown = withCompanionBond(pet, pet.bond + amount);
    if (grown.evolutionStage > pet.evolutionStage) {
      events.push({ kind: "evolved", templateId: pet.templateId });
    }
    return grown;
  });

  return refreshPetGearState({
    ...gameState,
    pets,
    companionEvents: [...gameState.companionEvents, ...events],
  });
}

/** Adds every companion whose "joins when…" rule is now met (§4.1). */
export function applyCompanionJoins(gameState: GameState): GameState {
  // Nobody joins before the player has picked a starter in the tutorial.
  if (gameState.pets.length === 0) {
    return gameState;
  }

  const owned = new Set(gameState.pets.map((pet) => pet.templateId));
  const joining = COMPANIONS.filter(
    (companion) => !owned.has(companion.templateId) && companion.joinsWhen(gameState.usage),
  );
  if (joining.length === 0) {
    return gameState;
  }

  return {
    ...gameState,
    pets: [...gameState.pets, ...joining.map((companion) => createCompanion(companion.templateId))],
    companionEvents: [
      ...gameState.companionEvents,
      ...joining.map((companion) => ({ kind: "joined" as const, templateId: companion.templateId })),
    ],
  };
}

/** Tutorial / first launch: the player picks one of the starters, who becomes active. */
export function adoptStarter(gameState: GameState, templateId: string): GameState {
  if (gameState.pets.length > 0 || !STARTER_TEMPLATE_IDS.includes(templateId)) {
    return gameState;
  }

  const starter = { ...createCompanion(templateId), equipped: true };
  return {
    ...gameState,
    pets: [starter],
    equippedPetId: starter.id,
    lastPlayedAt: Date.now(),
  };
}

export function applyTaskCreated(gameState: GameState, task: Task): GameState {
  return applyCompanionJoins({
    ...gameState,
    usage: recordTaskCreated(gameState.usage, task, Date.now()),
  });
}

export function applyTaskUpdated(gameState: GameState, before: Task, after: Task): GameState {
  if (!isReschedule(before, after)) {
    return gameState;
  }

  const now = Date.now();
  const rescheduled = {
    ...gameState,
    usage: recordReschedule(gameState.usage, before, after, now),
  };
  // Ripple ("go with the flow") gets +1 Bond when a task is moved.
  const active = getActiveCompanion(rescheduled);
  const withRippleBond =
    active && getActiveStyle(rescheduled) === "flow"
      ? addCompanionBond(rescheduled, active.id, 1)
      : rescheduled;
  return applyCompanionJoins(withRippleBond);
}

export function applyTaskDeleted(gameState: GameState, task: Task): GameState {
  return applyCompanionJoins({
    ...gameState,
    usage: recordOverdueDeleted(gameState.usage, task, Date.now()),
  });
}

export function equipPet(gameState: GameState, petId: string): GameState {
  return {
    ...gameState,
    equippedPetId: petId,
    pets: gameState.pets.map((pet) => ({
      ...pet,
      equipped: pet.id === petId,
    })),
    lastPlayedAt: Date.now(),
  };
}

export function completePetExpedition(
  gameState: GameState,
  now: number = Date.now(),
): GameState {
  if (gameState.expeditionProgress.activeZoneEndsAt > now) {
    return gameState;
  }

  if (gameState.expeditionProgress.activeZoneIndex < 0) {
    return gameState;
  }

  return {
    ...gameState,
    expeditionProgress: {
      ...gameState.expeditionProgress,
      revealPoints:
        gameState.expeditionProgress.revealPoints +
        EXPEDITION_POINTS_PER_REGION,
      activeZoneIndex: -1,
      activeZoneEndsAt: 0,
    },
    lastPlayedAt: now,
  };
}

function getCompletedNodeIds(gameState: GameState): string[] {
  return gameState.expeditionProgress.completedNodeIds;
}

export function isExpeditionNodeCompleted(
  gameState: GameState,
  nodeId: string,
): boolean {
  return getCompletedNodeIds(gameState).includes(nodeId);
}

export function exploreExpeditionNode(
  gameState: GameState,
  nodeId: string,
  petId: string,
): GameState {
  const node = getExpeditionSideNodeById(nodeId);
  const scout = gameState.pets.filter((pet) => pet.id === petId)[0];
  const scoutElement = getPetElement(scout.templateId);
  const elementMatched = scoutElement === node.requiredElement;

  if (isExpeditionNodeCompleted(gameState, nodeId)) {
    return gameState;
  }

  if (!elementMatched) {
    return gameState;
  }

  const nextGameState = {
    ...gameState,
    expeditionProgress: {
      ...gameState.expeditionProgress,
      activeNodeId: node.id,
      activeNodePetId: petId,
      activeNodeEndsAt: Date.now() + getExpeditionNodeDurationMs(nodeId, petId, gameState),
    },
    lastPlayedAt: Date.now(),
  };

  return nextGameState;
}

export function completeExpeditionNode(
  gameState: GameState,
  nodeId: string,
  petId: string,
): GameState {
  if (gameState.expeditionProgress.activeNodeId !== nodeId) {
    return gameState;
  }

  const nextGameState = {
    ...applyExpeditionNodeReward(gameState, nodeId, petId),
    expeditionProgress: {
      ...gameState.expeditionProgress,
      activeNodeId: "",
      activeNodePetId: "",
      activeNodeEndsAt: 0,
      completedNodeIds: [...gameState.expeditionProgress.completedNodeIds, nodeId],
    },
    lastPlayedAt: Date.now(),
  };

  return refreshPetGearState(nextGameState);
}

export function sendPetOnExpedition(
  gameState: GameState,
  petId: string,
): GameState {
  const now = Date.now();

  if (gameState.expeditionProgress.activeZoneEndsAt > now) {
    return gameState;
  }

  const expeditionPet = gameState.pets.filter((pet) => pet.id === petId)[0]!;
  const nextZoneIndex = getExpeditionMapRegionCount(
    gameState.expeditionProgress,
  );
  if (nextZoneIndex >= EXPEDITION_MAP_REGIONS) {
    return gameState;
  }
  const nextZone = getExpeditionZoneBlueprint(nextZoneIndex);
  if (
    nextZone.requiredElement !== "" &&
    getPetElement(expeditionPet.templateId) !== nextZone.requiredElement
  ) {
    return gameState;
  }
  const durationMs = getExpeditionDurationMs(
    nextZoneIndex,
    expeditionPet.explorationPower,
  );

  return {
    ...gameState,
    expeditionProgress: {
      expeditionsSent: gameState.expeditionProgress.expeditionsSent + 1,
      revealPoints: gameState.expeditionProgress.revealPoints,
      activeZoneIndex: nextZoneIndex,
      activeZoneEndsAt: now + durationMs,
      activeNodeId: "",
      activeNodePetId: "",
      activeNodeEndsAt: 0,
      completedNodeIds: gameState.expeditionProgress.completedNodeIds,
    },
    lastPlayedAt: now,
  };
}

export function resolveExpeditionBattle(
  gameState: GameState,
  zoneIndex: number,
  petId: string,
  battleConsumableIds: string[] = [],
): GameState {
  const fighter = gameState.pets.filter((pet) => pet.id === petId)[0];
  const encounter = getExpeditionEncounter(zoneIndex);
  const loadout = getBattleConsumablesForLoadout(gameState, battleConsumableIds);
  const loadoutTotals = getBattleConsumableEffectTotals(loadout);
  const playerPower =
    fighter.combatPower +
    loadoutTotals.attack * 11 +
    loadoutTotals.speed * 7 +
    loadoutTotals.shield * 9 +
    loadoutTotals.heal * 5 +
    loadoutTotals.burst * 13 +
    loadoutTotals.revive * 18;
  const enemyPower =
    encounter.wildPower +
    zoneIndex * 5 +
    encounter.enemyModifier +
    (loadout.length === 0 ? 8 : 0);
  const victory =
    playerPower >= enemyPower ||
    (loadoutTotals.revive > 0 &&
      playerPower + loadoutTotals.revive * 12 >= enemyPower);
  const xpReward = Math.round(
    EXPEDITION_FIGHT_BASE_XP +
      zoneIndex * EXPEDITION_FIGHT_XP_STEP +
      (victory ? fighter.combatPower * 0.25 : fighter.combatPower * 0.1) +
      loadoutTotals.attack * 2 +
      loadoutTotals.heal,
  );
  const gearDrop = createGearDrop(zoneIndex, victory, loadoutTotals.burst > 0 ? 1 : 0);
  const consumableDrop = createBattleConsumableDrop(
    zoneIndex,
    victory,
    loadoutTotals.speed + loadoutTotals.shield + 1,
  );

  const nextGameState = {
    ...gameState,
    gearItems: [...gameState.gearItems, gearDrop],
    battleConsumables: [
      ...gameState.battleConsumables.filter(
        (item) => !battleConsumableIds.includes(item.id),
      ),
      consumableDrop,
    ],
    pets: gameState.pets.map((pet) => {
      if (pet.id !== petId) {
        return pet;
      }

      const experience = pet.experience + xpReward;

      return {
        ...pet,
        experience,
        level: getLevel(experience, PET_LEVEL_BASE_COST),
      };
    }),
    lastPlayedAt: Date.now(),
  };

  return refreshPetGearState(nextGameState);
}

export function resolveExpeditionProgress(
  gameState: GameState,
  now: number = Date.now(),
): GameState {
  if (
    gameState.expeditionProgress.activeNodeId !== "" &&
    gameState.expeditionProgress.activeNodeEndsAt <= now
  ) {
    return completeExpeditionNode(
      gameState,
      gameState.expeditionProgress.activeNodeId,
      gameState.expeditionProgress.activeNodePetId,
    );
  }

  if (
    gameState.expeditionProgress.activeZoneIndex < 0 ||
    gameState.expeditionProgress.activeZoneEndsAt > now
  ) {
    return gameState;
  }

  return completePetExpedition(gameState, now);
}
