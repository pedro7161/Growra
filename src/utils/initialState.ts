import { GameState, SaveData, Pet, PetRarity, Streak } from "../types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function createInitialStreak(): Streak {
  return {
    level: 0,
    bonus: 0,
    lastCompletedDate: 0,
    consecutiveMisses: 0,
  };
}

export function createInitialPet(): Pet {
  return {
    id: generateId(),
    name: "Sprout",
    rarity: PetRarity.COMMON,
    level: 1,
    experience: 0,
    stats: {
      attack: 5,
      defense: 5,
      speed: 5,
      luck: 5,
    },
    passives: [],
    taskMultiplier: 0.05, // 5% bonus
    equipped: true,
    createdAt: Date.now(),
  };
}

export function createInitialGameState(): GameState {
  const starterPet = createInitialPet();

  return {
    playerId: generateId(),
    level: 1,
    coins: 0,
    totalExperience: 0,
    tasks: [],
    pets: [starterPet],
    equippedPetId: starterPet.id,
    streak: createInitialStreak(),
    createdAt: Date.now(),
    lastPlayedAt: Date.now(),
  };
}

export function createSaveData(gameState: GameState): SaveData {
  return {
    gameState,
    lastSavedAt: Date.now(),
    version: 1,
  };
}
