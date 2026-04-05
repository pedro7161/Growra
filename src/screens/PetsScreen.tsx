import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";

export default function PetsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pets</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Pet Grid */}
        <View style={styles.grid}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No pets yet</Text>
            <Text style={styles.emptySubtext}>
              Complete tasks to earn pets
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Gacha Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.gachaButton}>
          <Text style={styles.gachaButtonText}>Summon Pet</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  grid: {
    minHeight: 400,
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
  },
  footer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  gachaButton: {
    backgroundColor: "#4ecdc4",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  gachaButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
