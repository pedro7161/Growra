import { GameState, Pet, PetRarity, Streak, TaskStatus } from "../types";
import { getNextAvailableDate } from "./taskSchedule";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const STREAK_BONUS_STEP = 0.1;
const STREAK_BONUS_CAP = 0.5;
const PLAYER_EXPERIENCE_PER_LEVEL = 100;
const PET_EXPERIENCE_PER_LEVEL = 50;
const FUSION_TASK_MULTIPLIER_STEP = 0.02;
const EVOLUTION_STAGE_ONE_FUSIONS = 2;
const EVOLUTION_STAGE_TWO_FUSIONS = 4;

export const BASE_TASK_COIN_REWARD = 10;
export const BASE_TASK_PLAYER_EXPERIENCE_REWARD = 8;
export const BASE_TASK_PET_EXPERIENCE_REWARD = 6;
export const SUMMON_COST = 100;
export const PITY_CURRENCY_PER_SUMMON = 1;
export const COMMON_PITY_COST = 3;
export const RARE_PITY_COST = 6;
export const EPIC_PITY_COST = 10;
export const MAX_PET_FUSIONS = 4;
export const COMMON_SELL_VALUE = 25;
export const RARE_SELL_VALUE = 60;
export const EPIC_SELL_VALUE = 120;

interface PetTemplate {
  id: string;
  name: string;
  rarity: PetRarity;
  stats: Pet["stats"];
  taskMultiplier: number;
}

interface PetProgressionSnapshot {
  evolutionStage: number;
  stats: Pet["stats"];
  taskMultiplier: number;
  combatPower: number;
  explorationPower: number;
}

const PET_TEMPLATES: Record<PetRarity, PetTemplate[]> = {
  [PetRarity.COMMON]: [
    {
      id: "sprout",
      name: "Sprout",
      rarity: PetRarity.COMMON,
      stats: { attack: 5, defense: 5, speed: 5, luck: 5 },
      taskMultiplier: 0.05,
    },
    {
      id: "pebble",
      name: "Pebble",
      rarity: PetRarity.COMMON,
      stats: { attack: 6, defense: 6, speed: 4, luck: 4 },
      taskMultiplier: 0.05,
    },
    {
      id: "moss",
      name: "Moss",
      rarity: PetRarity.COMMON,
      stats: { attack: 4, defense: 7, speed: 5, luck: 4 },
      taskMultiplier: 0.05,
    },
  ],
  [PetRarity.RARE]: [
    {
      id: "ember",
      name: "Ember",
      rarity: PetRarity.RARE,
      stats: { attack: 8, defense: 6, speed: 7, luck: 6 },
      taskMultiplier: 0.1,
    },
    {
      id: "ripple",
      name: "Ripple",
      rarity: PetRarity.RARE,
      stats: { attack: 7, defense: 7, speed: 8, luck: 6 },
      taskMultiplier: 0.1,
    },
  ],
  [PetRarity.EPIC]: [
    {
      id: "nova",
      name: "Nova",
      rarity: PetRarity.EPIC,
      stats: { attack: 10, defense: 9, speed: 9, luck: 8 },
      taskMultiplier: 0.15,
    },
    {
      id: "astra",
      name: "Astra",
      rarity: PetRarity.EPIC,
      stats: { attack: 9, defense: 10, speed: 8, luck: 9 },
      taskMultiplier: 0.15,
    },
  ],
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function getDayStart(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function getDayDifference(previousTimestamp: number, nextTimestamp: number): number {
  return Math.floor((getDayStart(nextTimestamp) - getDayStart(previousTimestamp)) / DAY_IN_MS);
}

function getLevel(experience: number, experiencePerLevel: number): number {
  return Math.floor(experience / experiencePerLevel) + 1;
}

function getBonusFromLevel(level: number): number {
  return Math.min(level * STREAK_BONUS_STEP, STREAK_BONUS_CAP);
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
  return stats.attack * 4 + stats.defense * 3 + stats.speed * 2 + stats.luck + evolutionStage * 12;
}

function getExplorationPower(stats: Pet["stats"], evolutionStage: number): number {
  return stats.speed * 3 + stats.luck * 3 + stats.attack + stats.defense + evolutionStage * 10;
}

function getRewardMultiplier(streakBonus: number, petMultiplier: number): number {
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

  return PetRarity.EPIC;
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
  const template = PET_TEMPLATES[rarity].find((petTemplate) => petTemplate.name === name);

  if (template) {
    return template.id;
  }

  return PET_TEMPLATES[rarity][0].id;
}

export function getPetTemplates(): PetTemplate[] {
  return Object.values(PET_TEMPLATES).flat();
}

export function getPityCost(rarity: PetRarity): number {
  if (rarity === PetRarity.EPIC) {
    return EPIC_PITY_COST;
  }

  if (rarity === PetRarity.RARE) {
    return RARE_PITY_COST;
  }

  return COMMON_PITY_COST;
}

export function getSellValue(rarity: PetRarity): number {
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
  fusionLevel: number
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
  const taskMultiplier = template.taskMultiplier + fusionLevel * FUSION_TASK_MULTIPLIER_STEP;

  return {
    evolutionStage,
    stats,
    taskMultiplier,
    combatPower: getCombatPower(stats, evolutionStage),
    explorationPower: getExplorationPower(stats, evolutionStage),
  };
}

export function getNextEvolutionFusionTarget(fusionLevel: number): number | null {
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

export function getFuseSourcePets(gameState: GameState, targetPetId: string): Pet[] {
  const targetPet = gameState.pets.filter((pet) => pet.id === targetPetId)[0];

  return gameState.pets.filter(
    (pet) => pet.templateId === targetPet.templateId && pet.id !== targetPetId && !pet.equipped
  );
}

export function getSellablePets(gameState: GameState): Pet[] {
  const templateIds = [...new Set(gameState.pets.map((pet) => pet.templateId))];

  return templateIds.flatMap((templateId) => {
    const matchingPets = gameState.pets.filter((pet) => pet.templateId === templateId);

    if (matchingPets.length <= 1) {
      return [];
    }

    const protectedPetId = getProtectedPetId(matchingPets);

    return matchingPets.filter((pet) => pet.id !== protectedPetId && !pet.equipped);
  });
}

export function createPet(rarity: PetRarity): Pet {
  const templatePool = PET_TEMPLATES[rarity];
  const template = templatePool[Math.floor(Math.random() * templatePool.length)];

  return createPetFromTemplate(template);
}

export function createStarterPet(): Pet {
  const template = PET_TEMPLATES[PetRarity.COMMON][0];

  return { ...createPetFromTemplate(template), equipped: true };
}

export function calculateUpdatedStreak(streak: Streak, completedAt: number): Streak {
  if (streak.lastCompletedDate === 0) {
    return {
      level: 1,
      bonus: getBonusFromLevel(1),
      lastCompletedDate: getDayStart(completedAt),
      consecutiveMisses: 0,
    };
  }

  const dayDifference = getDayDifference(streak.lastCompletedDate, completedAt);

  if (dayDifference === 0) {
    return {
      ...streak,
      lastCompletedDate: getDayStart(completedAt),
      consecutiveMisses: 0,
    };
  }

  if (dayDifference === 1) {
    const level = Math.min(streak.level + 1, Math.floor(STREAK_BONUS_CAP / STREAK_BONUS_STEP));

    return {
      level,
      bonus: getBonusFromLevel(level),
      lastCompletedDate: getDayStart(completedAt),
      consecutiveMisses: 0,
    };
  }

  const missedDays = dayDifference - 1;

  if (missedDays >= 3) {
    return {
      level: 1,
      bonus: getBonusFromLevel(1),
      lastCompletedDate: getDayStart(completedAt),
      consecutiveMisses: 0,
    };
  }

  const level = Math.max(streak.level - missedDays, 1);

  return {
    level,
    bonus: getBonusFromLevel(level),
    lastCompletedDate: getDayStart(completedAt),
    consecutiveMisses: 0,
  };
}

export function completeTask(gameState: GameState, taskId: string): GameState {
  const completedAt = Date.now();
  const nextStreak = calculateUpdatedStreak(gameState.streak, completedAt);
  const equippedPet = gameState.pets.find((pet) => pet.id === gameState.equippedPetId);
  const petMultiplier = equippedPet ? equippedPet.taskMultiplier : 0;
  const rewardMultiplier = getRewardMultiplier(nextStreak.bonus, petMultiplier);
  const gainedCoins = Math.round(BASE_TASK_COIN_REWARD * rewardMultiplier);
  const gainedPlayerExperience = Math.round(BASE_TASK_PLAYER_EXPERIENCE_REWARD * rewardMultiplier);
  const gainedPetExperience = Math.round(BASE_TASK_PET_EXPERIENCE_REWARD * rewardMultiplier);
  const totalExperience = gameState.totalExperience + gainedPlayerExperience;

  return {
    ...gameState,
    level: getLevel(totalExperience, PLAYER_EXPERIENCE_PER_LEVEL),
    coins: gameState.coins + gainedCoins,
    totalExperience,
    totalTasksCompleted: gameState.totalTasksCompleted + 1,
    tasks: gameState.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status: TaskStatus.COMPLETED,
            dueDate: getNextAvailableDate(task, completedAt),
            completedAt,
          }
        : task
    ),
    pets: gameState.pets.map((pet) => {
      if (pet.id !== gameState.equippedPetId) {
        return pet;
      }

      const experience = pet.experience + gainedPetExperience;

      return {
        ...pet,
        experience,
        level: getLevel(experience, PET_EXPERIENCE_PER_LEVEL),
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

export function redeemPityPet(gameState: GameState, templateId: string): GameState {
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

export function fusePet(gameState: GameState, targetPetId: string, sourcePetId: string): GameState {
  const targetPet = gameState.pets.filter((pet) => pet.id === targetPetId)[0];
  const nextFusionLevel = targetPet.fusionLevel + 1;
  const progression = getPetProgressionSnapshot(targetPet.templateId, nextFusionLevel);

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
          : pet
      ),
    lastPlayedAt: Date.now(),
  };
}

export function sellPet(gameState: GameState, petId: string): GameState {
  const soldPet = gameState.pets.filter((pet) => pet.id === petId)[0];

  return {
    ...gameState,
    coins: gameState.coins + getSellValue(soldPet.rarity),
    pets: gameState.pets.filter((pet) => pet.id !== petId),
    lastPlayedAt: Date.now(),
  };
}
