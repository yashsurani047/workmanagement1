// src/Screens/Tasks/TasksListScreen.jsx
import React, { useState } from "react";
import TaskDetailsList from "../../Components/Tasks/TaskDetailsList";
import { SafeAreaView } from "react-native-safe-area-context";
import TopNavbar from "../../Components/Common/Topnavbar";
import { useTheme } from "../../Themes/ThemeContext";

const MOCK_TASKS = [
  {
    id: "t1",
    title: "Design Login Page Mockup",
    description: "Create high-fidelity mockups for the login and sign-up screens using Figma.",
    status: "in progress",
    priority: "high",
    start_time: "09:00",
    end_time: "11:00",
    due_date: "2026-03-01",
    assigned_to: "Alice",
  },
  {
    id: "t2",
    title: "Write API Documentation",
    description: "Document all REST API endpoints with request/response examples for the developer portal.",
    status: "completed",
    priority: "medium",
    start_time: "10:00",
    end_time: "12:30",
    due_date: "2026-02-25",
    assigned_to: "Bob",
  },
  {
    id: "t3",
    title: "Fix Navigation Bug on Android",
    description: "Investigate and resolve the back-navigation crash on Android 13 devices.",
    status: "not started",
    priority: "high",
    start_time: "14:00",
    end_time: "16:00",
    due_date: "2026-03-05",
    assigned_to: "Charlie",
  },
  {
    id: "t4",
    title: "Setup CI/CD Pipeline",
    description: "Configure GitHub Actions for automated testing and deployment to staging and production.",
    status: "in progress",
    priority: "medium",
    start_time: "08:00",
    end_time: "10:00",
    due_date: "2026-03-10",
    assigned_to: "Diana",
  },
  {
    id: "t5",
    title: "Database Schema Optimization",
    description: "Review and optimize the core database schema to improve query performance by 30%+.",
    status: "completed",
    priority: "high",
    start_time: "11:00",
    end_time: "13:00",
    due_date: "2026-02-20",
    assigned_to: "Eve",
  },
  {
    id: "t6",
    title: "User Research Interviews",
    description: "Conduct 10 user interviews to gather feedback on the current onboarding experience.",
    status: "not started",
    priority: "low",
    start_time: "15:00",
    end_time: "17:00",
    due_date: "2026-03-20",
    assigned_to: "Frank",
  },
  {
    id: "t7",
    title: "Mobile Push Notifications",
    description: "Implement push notification support using Firebase Cloud Messaging for iOS and Android.",
    status: "completed",
    priority: "medium",
    start_time: "09:30",
    end_time: "11:30",
    due_date: "2026-02-18",
    assigned_to: "Grace",
  },
];

const TasksListScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [tasks] = useState(MOCK_TASKS);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["bottom"]}>
      <TopNavbar navigation={navigation} />
      <TaskDetailsList items={tasks} navigation={navigation} />
    </SafeAreaView>
  );
};

export default TasksListScreen;
