import React from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { GameState } from "../types";

interface DashboardScreenProps {
  gameState: GameState;
}

export default function DashboardScreen({ gameState }: DashboardScreenProps) {

  const equippedPet = gameState.pets.find((p) => p.id === gameState.equippedPetId);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Pet Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipped Pet</Text>
          {equippedPet ? (
            <View style={styles.petCard}>
              <Text style={styles.petName}>{equippedPet.name}</Text>
              <Text style={styles.petInfo}>Level {equippedPet.level}</Text>
              <Text style={styles.petInfo}>Rarity: {equippedPet.rarity}</Text>
              <Text style={styles.petInfo}>
                Experience: {equippedPet.experience}
              </Text>
            </View>
          ) : (
            <Text>No pet equipped</Text>
          )}
        </View>

        {/* Streak Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streak</Text>
          <View style={styles.streakCard}>
            <Text style={styles.streakValue}>{gameState.streak.level}</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
            <Text style={styles.bonusText}>
              +{(gameState.streak.bonus * 100).toFixed(0)}% bonus
            </Text>
          </View>
        </View>

        {/* Player Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stats</Text>
          <View style={styles.statsCard}>
            <Text style={styles.statRow}>Level: {gameState.level}</Text>
            <Text style={styles.statRow}>Coins: {gameState.coins}</Text>
            <Text style={styles.statRow}>
              Total XP: {gameState.totalExperience}
            </Text>
          </View>
        </View>

        {/* Tasks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Tasks ({gameState.tasks.length})
          </Text>
          {gameState.tasks.length === 0 ? (
            <Text style={styles.emptyText}>No tasks yet</Text>
          ) : (
            gameState.tasks.map((task) => (
              <View key={task.id} style={styles.taskItem}>
                <Text style={styles.taskName}>{task.name}</Text>
                <Text style={styles.taskStatus}>{task.status}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  petCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  petName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  petInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  streakCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    elevation: 2,
  },
  streakValue: {
    fontSize: 36,
    fontWeight: "700",
    color: "#ff6b6b",
  },
  streakLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  bonusText: {
    fontSize: 12,
    color: "#4ecdc4",
    marginTop: 8,
  },
  statsCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  statRow: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  taskItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#4ecdc4",
  },
  taskName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  taskStatus: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
});
