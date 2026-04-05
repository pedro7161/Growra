import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Modal,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { TaskType, TaskFrequency } from "../types";

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, type: TaskType, frequency: TaskFrequency) => void;
}

export default function AddTaskModal({
  visible,
  onClose,
  onSubmit,
}: AddTaskModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TaskType>(TaskType.CUSTOM);
  const [frequency, setFrequency] = useState<TaskFrequency>(TaskFrequency.ONCE);

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name, description, type, frequency);
      setName("");
      setDescription("");
      setType(TaskType.CUSTOM);
      setFrequency(TaskFrequency.ONCE);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Add Task</Text>
            <TouchableOpacity onPress={handleSubmit}>
              <Text style={styles.submitButton}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.field}>
              <Text style={styles.label}>Task Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter task name"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#ccc"
              />
            </View>

            {/* Description Input */}
            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter task description (optional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                placeholderTextColor="#ccc"
              />
            </View>

            {/* Task Type */}
            <View style={styles.field}>
              <Text style={styles.label}>Task Type</Text>
              <View style={styles.buttonGroup}>
                <TypeButton
                  label="Custom"
                  active={type === TaskType.CUSTOM}
                  onPress={() => setType(TaskType.CUSTOM)}
                />
                <TypeButton
                  label="Predefined"
                  active={type === TaskType.PREDEFINED}
                  onPress={() => setType(TaskType.PREDEFINED)}
                />
              </View>
            </View>

            {/* Frequency */}
            <View style={styles.field}>
              <Text style={styles.label}>Frequency</Text>
              <View style={styles.buttonGroup}>
                <FrequencyButton
                  label="Once"
                  active={frequency === TaskFrequency.ONCE}
                  onPress={() => setFrequency(TaskFrequency.ONCE)}
                />
                <FrequencyButton
                  label="Daily"
                  active={frequency === TaskFrequency.DAILY}
                  onPress={() => setFrequency(TaskFrequency.DAILY)}
                />
                <FrequencyButton
                  label="Weekly"
                  active={frequency === TaskFrequency.WEEKLY}
                  onPress={() => setFrequency(TaskFrequency.WEEKLY)}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function TypeButton({
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
      style={[styles.button, active && styles.buttonActive]}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, active && styles.buttonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function FrequencyButton({
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
      style={[styles.button, active && styles.buttonActive]}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, active && styles.buttonTextActive]}>
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
  content: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  cancelButton: {
    fontSize: 14,
    color: "#999",
  },
  submitButton: {
    fontSize: 14,
    color: "#4ecdc4",
    fontWeight: "600",
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
  },
  textArea: {
    textAlignVertical: "top",
    paddingTop: 10,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
  },
  buttonActive: {
    backgroundColor: "#4ecdc4",
  },
  buttonText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  buttonTextActive: {
    color: "#fff",
  },
});
