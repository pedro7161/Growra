import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameState, SaveData, Task, Pet, TaskStatus } from "../types";

const SAVE_KEY = "growra_save_data";

export const gameStateService = {
  async loadGame(): Promise<SaveData | null> {
    try {
      const data = await AsyncStorage.getItem(SAVE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Failed to load game:", error);
      return null;
    }
  },

  async saveGame(saveData: SaveData): Promise<void> {
    try {
      await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } catch (error) {
      console.error("Failed to save game:", error);
    }
  },

  async resetGame(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SAVE_KEY);
    } catch (error) {
      console.error("Failed to reset game:", error);
    }
  },

  async addTask(gameState: GameState, task: Task): Promise<GameState> {
    return {
      ...gameState,
      tasks: [...gameState.tasks, task],
    };
  },

  async completeTask(gameState: GameState, taskId: string): Promise<GameState> {
    const updatedTasks = gameState.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status: TaskStatus.COMPLETED,
            completedAt: Date.now(),
          }
        : task
    );

    return {
      ...gameState,
      tasks: updatedTasks,
    };
  },

  async equipPet(gameState: GameState, petId: string): Promise<GameState> {
    const updatedPets = gameState.pets.map((pet) => ({
      ...pet,
      equipped: pet.id === petId,
    }));

    return {
      ...gameState,
      pets: updatedPets,
      equippedPetId: petId,
    };
  },

  async addPet(gameState: GameState, pet: Pet): Promise<GameState> {
    return {
      ...gameState,
      pets: [...gameState.pets, pet],
    };
  },
};
