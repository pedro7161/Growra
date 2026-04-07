import {
    GameState,
    Pet,
    PetImages,
    PetRarity,
    Streak,
    Task,
    TaskStatus,
} from "../types";
import { getNextAvailableDate, getStartOfDay } from "./taskSchedule";
import { finishTaskTimer } from "./taskTimer";
import { generateId } from "./idUtils";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const STREAK_BONUS_PER_DAY = 0.05;
const STREAK_BONUS_CAP = 1.0;
export const PLAYER_LEVEL_BASE_COST = 50;
export const PET_LEVEL_BASE_COST = 25;
const FUSION_TASK_MULTIPLIER_STEP = 0.02;
const EVOLUTION_STAGE_ONE_FUSIONS = 2;
const EVOLUTION_STAGE_TWO_FUSIONS = 4;

export const BASE_TASK_COIN_REWARD = 10;
export const BASE_TASK_PLAYER_EXPERIENCE_REWARD = 8;
export const BASE_TASK_PET_EXPERIENCE_REWARD = 6;
export const SUMMON_COST = 100;
export const MULTI_SUMMON_COUNT = 11;
export const MULTI_SUMMON_COST = 1000;
export const MULTI_SUMMON_PITY = 10;
export const PITY_CURRENCY_PER_SUMMON = 1;
export const COMMON_PITY_COST = 15;
export const RARE_PITY_COST = 30;
export const EPIC_PITY_COST = 60;
export const LEGENDARY_PITY_COST = 120;
export const MAX_PET_FUSIONS = 4;
export const COMMON_SELL_VALUE = 25;
export const RARE_SELL_VALUE = 60;
export const EPIC_SELL_VALUE = 120;
export const LEGENDARY_SELL_VALUE = 240;
export const LEVEL_THRESHOLDS = [12, 16, 24, 41, 81, 99];

const MAX_DUPE_PITY_VALUE: Record<PetRarity, number> = {
  [PetRarity.COMMON]: 1,
  [PetRarity.RARE]: 2,
  [PetRarity.EPIC]: 3,
  [PetRarity.LEGENDARY]: 5,
};

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

function getDayDifference(
  previousTimestamp: number,
  nextTimestamp: number,
): number {
  return Math.floor(
    (getStartOfDay(nextTimestamp) - getStartOfDay(previousTimestamp)) / DAY_IN_MS,
  );
}

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

function getRandomRarity(): PetRarity {
  const roll = Math.random();

  if (roll < 0.7) {
    return PetRarity.COMMON;
  }

  if (roll < 0.95) {
    return PetRarity.RARE;
  }

  if (roll < 0.99) {
    return PetRarity.EPIC;
  }

  return PetRarity.LEGENDARY;
}

function createPetFromTemplate(template: PetTemplate): Pet {
  const createdAt = Date.now();
  const progression = getPetProgressionSnapshot(template.id, 0);

  return {
    id: generateId(),
    templateId: template.id,
    name: template.name,
    rarity: template.rarity,
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
    equipped: false,
    createdAt,
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

export function getPetTemplates(): PetTemplate[] {
  return Object.values(PET_TEMPLATES).flat();
}

export function getPityCost(rarity: PetRarity): number {
  if (rarity === PetRarity.LEGENDARY) {
    return LEGENDARY_PITY_COST;
  }

  if (rarity === PetRarity.EPIC) {
    return EPIC_PITY_COST;
  }

  if (rarity === PetRarity.RARE) {
    return RARE_PITY_COST;
  }

  return COMMON_PITY_COST;
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

export function getNextEvolutionFusionTarget(
  fusionLevel: number,
): number | null {
  if (fusionLevel < EVOLUTION_STAGE_ONE_FUSIONS) {
    return EVOLUTION_STAGE_ONE_FUSIONS;
  }

  if (fusionLevel < EVOLUTION_STAGE_TWO_FUSIONS) {
    return EVOLUTION_STAGE_TWO_FUSIONS;
  }

  return null;
}

function getProtectedPetId(pets: Pet[]): string {
  const sortedPets = [...pets].sort((leftPet, rightPet) => {
    if (leftPet.fusionLevel !== rightPet.fusionLevel) {
      return rightPet.fusionLevel - leftPet.fusionLevel;
    }

    if (leftPet.equipped !== rightPet.equipped) {
      return leftPet.equipped ? -1 : 1;
    }

    return leftPet.createdAt - rightPet.createdAt;
  });

  return sortedPets[0].id;
}

export function getFuseSourcePets(
  gameState: GameState,
  targetPetId: string,
): Pet[] {
  const targetPet = gameState.pets.find((pet) => pet.id === targetPetId);

  return gameState.pets.filter(
    (pet) =>
      pet.templateId === targetPet?.templateId &&
      pet.id !== targetPetId &&
      !pet.equipped,
  );
}

export function getSellablePets(gameState: GameState): Pet[] {
  const templateIds = [...new Set(gameState.pets.map((pet) => pet.templateId))];

  return templateIds.flatMap((templateId) => {
    const matchingPets = gameState.pets.filter(
      (pet) => pet.templateId === templateId,
    );

    if (matchingPets.length <= 1) {
      return [];
    }

    const protectedPetId = getProtectedPetId(matchingPets);

    return matchingPets.filter(
      (pet) => pet.id !== protectedPetId && !pet.equipped,
    );
  });
}

export function createPet(rarity: PetRarity): Pet {
  const templatePool = PET_TEMPLATES[rarity];
  const template =
    templatePool[Math.floor(Math.random() * templatePool.length)];

  return createPetFromTemplate(template);
}

export function createStarterPet(): Pet {
  const template = PET_TEMPLATES[PetRarity.COMMON][0];

  return { ...createPetFromTemplate(template), equipped: true };
}

export function getAllPets(): Pet[] {
  const allPets: Pet[] = [];

  for (const rarity of Object.values(PetRarity)) {
    const templates = PET_TEMPLATES[rarity] || [];
    for (const template of templates) {
      const pet = createPetFromTemplate(template);
      allPets.push(pet);
    }
  }

  return allPets;
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

  const dayDifference = getDayDifference(streak.lastCompletedDate, completedAt);

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
  if (!targetTask || targetTask.dueDate > Date.now()) {
    return gameState;
  }

  if (targetTask.timer.enabled && targetTask.timer.state !== "ready") {
    return gameState;
  }

  const completedAt = Date.now();
  const nextStreak = calculateUpdatedStreak(gameState.streak, completedAt);
  const equippedPet = gameState.pets.find(
    (pet) => pet.id === gameState.equippedPetId,
  );
  const petMultiplier = equippedPet ? equippedPet.taskMultiplier : 0;
  const rewardMultiplier = getRewardMultiplier(nextStreak.bonus, petMultiplier);
  const gainedCoins = Math.round(BASE_TASK_COIN_REWARD * rewardMultiplier);
  const gainedPlayerExperience = Math.round(
    BASE_TASK_PLAYER_EXPERIENCE_REWARD * rewardMultiplier,
  );
  const gainedPetExperience = Math.round(
    BASE_TASK_PET_EXPERIENCE_REWARD * rewardMultiplier,
  );
  const totalExperience = gameState.totalExperience + gainedPlayerExperience;

  return {
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
    pets: gameState.pets.map((pet) => {
      if (pet.id !== gameState.equippedPetId) {
        return pet;
      }

      const experience = pet.experience + gainedPetExperience;

      return {
        ...pet,
        experience,
        level: getLevel(experience, PET_LEVEL_BASE_COST),
      };
    }),
    streak: nextStreak,
    lastPlayedAt: completedAt,
  };
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

export function summonPet(gameState: GameState): GameState {
  const summonedPet = createPet(getRandomRarity());

  return {
    ...gameState,
    coins: gameState.coins - SUMMON_COST,
    pityCurrency: gameState.pityCurrency + PITY_CURRENCY_PER_SUMMON,
    pets: [...gameState.pets, summonedPet],
    lastPlayedAt: Date.now(),
  };
}

export function multiSummonPet(gameState: GameState): GameState {
  const summonedPets = Array.from({ length: MULTI_SUMMON_COUNT }, () =>
    createPet(getRandomRarity()),
  );

  return {
    ...gameState,
    coins: gameState.coins - MULTI_SUMMON_COST,
    pityCurrency: gameState.pityCurrency + MULTI_SUMMON_PITY,
    pets: [...gameState.pets, ...summonedPets],
    lastPlayedAt: Date.now(),
  };
}

export function redeemPityPet(
  gameState: GameState,
  templateId: string,
): GameState {
  const selectedTemplate = getPetTemplate(templateId);
  const pityCost = getPityCost(selectedTemplate.rarity);
  const redeemedPet = createPetFromTemplate(selectedTemplate);

  return {
    ...gameState,
    pityCurrency: gameState.pityCurrency - pityCost,
    pets: [...gameState.pets, redeemedPet],
    lastPlayedAt: Date.now(),
  };
}

export function fusePet(
  gameState: GameState,
  targetPetId: string,
  sourcePetId: string,
): GameState {
  const targetPet = gameState.pets.find((pet) => pet.id === targetPetId);
  if (!targetPet) return gameState;
  const nextFusionLevel = targetPet.fusionLevel + 1;
  const progression = getPetProgressionSnapshot(
    targetPet.templateId,
    nextFusionLevel,
  );

  return {
    ...gameState,
    pets: gameState.pets
      .filter((pet) => pet.id !== sourcePetId)
      .map((pet) =>
        pet.id === targetPetId
          ? {
              ...pet,
              fusionLevel: nextFusionLevel,
              evolutionStage: progression.evolutionStage,
              stats: progression.stats,
              combatPower: progression.combatPower,
              explorationPower: progression.explorationPower,
              taskMultiplier: progression.taskMultiplier,
            }
          : pet,
      ),
    lastPlayedAt: Date.now(),
  };
}

export function sellPet(gameState: GameState, petId: string): GameState {
  const soldPet = gameState.pets.find((pet) => pet.id === petId);
  if (!soldPet) return gameState;
  const isMaxDupe = soldPet.fusionLevel >= MAX_PET_FUSIONS;

  if (isMaxDupe) {
    return {
      ...gameState,
      pityCurrency:
        gameState.pityCurrency + MAX_DUPE_PITY_VALUE[soldPet.rarity],
      pets: gameState.pets.filter((pet) => pet.id !== petId),
      lastPlayedAt: Date.now(),
    };
  }

  return {
    ...gameState,
    coins: gameState.coins + getSellValue(soldPet.rarity),
    pets: gameState.pets.filter((pet) => pet.id !== petId),
    lastPlayedAt: Date.now(),
  };
}
