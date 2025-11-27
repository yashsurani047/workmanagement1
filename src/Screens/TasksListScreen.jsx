// src/Screens/TasksListScreen.jsx
import React, { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import TaskDetailsList from "../Components/Tasks/TaskDetailsList";
import { fetchPersonalTasks } from "../Services/Tasks/FetchPersonalTask";

const TasksListScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetchPersonalTasks();
      setTasks(Array.isArray(res?.tasks) ? res.tasks : []);
    } catch (e) {
      console.error("TasksListScreen loadTasks:", e);
      Alert.alert("Error", e.message || "Failed to load tasks");
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  return (
    <TaskDetailsList items={tasks} navigation={navigation} />
  );
};

export default TasksListScreen;
