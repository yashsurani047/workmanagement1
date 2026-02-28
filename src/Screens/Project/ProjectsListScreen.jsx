// src/Screens/Project/ProjectsListScreen.jsx
import React, { useState } from "react";
import CardDetailsList from "../../Components/Projects/ProjectDetailsList";
import { SafeAreaView } from "react-native-safe-area-context";
import TopNavbar from "../../Components/Common/Topnavbar";
import { useTheme } from "../../Themes/ThemeContext";

const MOCK_PROJECTS = [
  {
    id: "1",
    name: "Website Redesign",
    status: "in progress",
    description: "Redesign the company website with a modern UI/UX approach and improved performance.",
    dueDate: "2026-03-15",
    priority: "high",
    members: ["Alice", "Bob", "Charlie"],
    department_id: "d1",
    sub_department_id: "sd1",
  },
  {
    id: "2",
    name: "Mobile App Development",
    status: "not started",
    description: "Build a cross-platform mobile application for iOS and Android using React Native.",
    dueDate: "2026-04-01",
    priority: "medium",
    members: ["Charlie", "Diana"],
    department_id: "d2",
    sub_department_id: "sd2",
  },
  {
    id: "3",
    name: "CRM Integration",
    status: "completed",
    description: "Integrate third-party CRM with internal tools to streamline customer management.",
    dueDate: "2026-02-28",
    priority: "low",
    members: ["Eve"],
    department_id: "d1",
    sub_department_id: null,
  },
  {
    id: "4",
    name: "Q3 Marketing Campaign",
    status: "in progress",
    description: "Plan and execute the Q3 marketing outreach campaign across multiple channels.",
    dueDate: "2026-05-10",
    priority: "high",
    members: ["Frank", "Grace", "Heidi"],
    department_id: "d3",
    sub_department_id: "sd3",
  },
  {
    id: "5",
    name: "Data Analytics Dashboard",
    status: "not started",
    description: "Build a real-time analytics dashboard to track key business metrics and KPIs.",
    dueDate: "2026-06-01",
    priority: "medium",
    members: ["Ivan", "Julia"],
    department_id: "d2",
    sub_department_id: null,
  },
  {
    id: "6",
    name: "Employee Onboarding Portal",
    status: "completed",
    description: "Create a self-service onboarding portal for new employees to reduce HR workload.",
    dueDate: "2026-01-15",
    priority: "low",
    members: ["Karen", "Leo", "Mike"],
    department_id: "d4",
    sub_department_id: "sd4",
  },
];

const ProjectsListScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [projects] = useState(MOCK_PROJECTS);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["bottom"]}>
      <TopNavbar navigation={navigation} />
      <CardDetailsList items={projects} onRefresh={() => { }} navigation={navigation} />
    </SafeAreaView>
  );
};

export default ProjectsListScreen;
