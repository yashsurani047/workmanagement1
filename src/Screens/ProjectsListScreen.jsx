// src/Screens/ProjectsListScreen.jsx
import React, { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CardDetailsList from "../Components/Projects/ProjectDetailsList";
import { fetchProjectsAPI } from "../Services/Project/fetchProjects";

const ProjectsListScreen = ({ navigation }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const userId = (await AsyncStorage.getItem("userId")) || (await AsyncStorage.getItem("user_id"));
      const userInfoString = await AsyncStorage.getItem("userInfo");
      const parsedUser = userInfoString ? JSON.parse(userInfoString) : null;
      let authToken = (await AsyncStorage.getItem("userToken")) || (await AsyncStorage.getItem("token")) || parsedUser?.token;
      if (!userId) throw new Error("Authentication info missing. Please login again.");

      const response = await fetchProjectsAPI({ token: authToken, userId, orgId: parsedUser?.organization_id || "one" });
      if (!response || !response.success) throw new Error(response?.message || "Failed to load projects");

      const formatted = Array.isArray(response.data) ? response.data.map((project) => ({
        id: project.id || project._id || project.project_id,
        name: project.name || project.title || project.project_name || project.project_title || `Project ${project.id || project.project_id || ""}`,
        status: (project.status || "not started").toLowerCase(),
        description: project.description || "No description available",
        dueDate: project.dueDate || project.due_date || null,
        priority: project.priority || "medium",
        members: project.members || [],
        department_id: project.department_id || project.departmentId || (project.department ? project.department.id : null) || null,
        sub_department_id: project.sub_department_id || project.subDepartmentId || (project.sub_department ? project.sub_department.id : null) || null,
        ...project,
      })) : [];

      setProjects(formatted);
    } catch (e) {
      console.error("ProjectsListScreen loadProjects:", e);
      Alert.alert("Error", e.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  return (
    <CardDetailsList items={projects} onRefresh={loadProjects} navigation={navigation} />
  );
};

export default ProjectsListScreen;
