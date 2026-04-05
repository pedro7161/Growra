import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { TaskStatus } from "../types";

export default function TasksScreen() {
  const [filter, setFilter] = useState<TaskStatus | "all">("all");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FilterTab
          label="All"
          active={filter === "all"}
          onPress={() => setFilter("all")}
        />
        <FilterTab
          label="Active"
          active={filter === TaskStatus.PENDING}
          onPress={() => setFilter(TaskStatus.PENDING)}
        />
        <FilterTab
          label="Completed"
          active={filter === TaskStatus.COMPLETED}
          onPress={() => setFilter(TaskStatus.COMPLETED)}
        />
      </View>

      {/* Tasks List */}
      <ScrollView style={styles.content}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No tasks to display</Text>
          <Text style={styles.emptySubtext}>
            Create your first task to get started
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.filterTab, active && styles.filterTabActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
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
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  filterTabActive: {
    backgroundColor: "#4ecdc4",
  },
  filterText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#fff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
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
});
