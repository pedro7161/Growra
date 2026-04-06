import { PredefinedTaskTemplate, TaskFrequency } from "../types";

export const predefinedTasks: PredefinedTaskTemplate[] = [
  {
    id: "drink-water",
    name: "Drink Water",
    description: "Finish your daily water target.",
    category: "health",
    recommendedFrequency: TaskFrequency.DAILY,
    calendarColor: "#2ca58d",
  },
  {
    id: "morning-walk",
    name: "Morning Walk",
    description: "Go outside for a short walk to start the day.",
    category: "health",
    recommendedFrequency: TaskFrequency.DAILY,
    calendarColor: "#2ca58d",
  },
  {
    id: "stretch-session",
    name: "Stretch Session",
    description: "Do a quick stretching session.",
    category: "health",
    recommendedFrequency: TaskFrequency.DAILY,
    calendarColor: "#2ca58d",
  },
  {
    id: "deep-focus",
    name: "Deep Focus Block",
    description: "Complete one distraction-free focus block.",
    category: "focus",
    recommendedFrequency: TaskFrequency.DAILY,
    calendarColor: "#2d6ea8",
  },
  {
    id: "email-zero",
    name: "Inbox Reset",
    description: "Clear your email inbox or process the top priority items.",
    category: "focus",
    recommendedFrequency: TaskFrequency.DAILY,
    calendarColor: "#2d6ea8",
  },
  {
    id: "study-session",
    name: "Study Session",
    description: "Complete one focused study block.",
    category: "study",
    recommendedFrequency: TaskFrequency.DAILY,
    calendarColor: "#8f5bd6",
  },
  {
    id: "read-pages",
    name: "Read 20 Pages",
    description: "Read at least twenty pages of a book or study material.",
    category: "study",
    recommendedFrequency: TaskFrequency.DAILY,
    calendarColor: "#8f5bd6",
  },
  {
    id: "tidy-room",
    name: "Tidy Room",
    description: "Reset your room or desk space.",
    category: "home",
    recommendedFrequency: TaskFrequency.WEEKLY,
    calendarColor: "#c05a2f",
  },
  {
    id: "laundry",
    name: "Do Laundry",
    description: "Wash and organize your clothes.",
    category: "home",
    recommendedFrequency: TaskFrequency.WEEKLY,
    calendarColor: "#c05a2f",
  },
  {
    id: "budget-check",
    name: "Budget Check",
    description: "Review your expenses and update your budget.",
    category: "finance",
    recommendedFrequency: TaskFrequency.WEEKLY,
    calendarColor: "#d48a1d",
  },
  {
    id: "save-money",
    name: "Move Money to Savings",
    description: "Transfer a small amount into savings.",
    category: "finance",
    recommendedFrequency: TaskFrequency.WEEKLY,
    calendarColor: "#d48a1d",
  },
  {
    id: "weekly-review",
    name: "Weekly Review",
    description: "Review your week and plan the next one.",
    category: "mindset",
    recommendedFrequency: TaskFrequency.WEEKLY,
    calendarColor: "#556b2f",
  },
  {
    id: "journal",
    name: "Journal Reflection",
    description: "Write a short reflection about your day.",
    category: "mindset",
    recommendedFrequency: TaskFrequency.DAILY,
    calendarColor: "#556b2f",
  },
  {
    id: "gym-session",
    name: "Gym Session",
    description: "Complete your planned workout or training session.",
    category: "fitness",
    recommendedFrequency: TaskFrequency.WEEKLY,
    calendarColor: "#d35454",
  },
  {
    id: "mobility",
    name: "Mobility Routine",
    description: "Do a short mobility and recovery routine.",
    category: "fitness",
    recommendedFrequency: TaskFrequency.DAILY,
    calendarColor: "#d35454",
  },
  {
    id: "family-checkin",
    name: "Family Check-in",
    description: "Call or message a family member.",
    category: "social",
    recommendedFrequency: TaskFrequency.WEEKLY,
    calendarColor: "#1f7a73",
  },
  {
    id: "friend-reachout",
    name: "Reach Out to a Friend",
    description: "Send a message or plan something with a friend.",
    category: "social",
    recommendedFrequency: TaskFrequency.WEEKLY,
    calendarColor: "#1f7a73",
  },
];

export function getPredefinedTaskGroups(): { category: string; tasks: PredefinedTaskTemplate[] }[] {
  const categories = [...new Set(predefinedTasks.map((task) => task.category))];

  return categories.map((category) => ({
    category,
    tasks: predefinedTasks.filter((task) => task.category === category),
  }));
}

export function getPredefinedTask(taskId: string): PredefinedTaskTemplate {
  const selectedTask = predefinedTasks.find((task) => task.id === taskId);

  if (selectedTask) {
    return selectedTask;
  }

  return predefinedTasks[0];
}
