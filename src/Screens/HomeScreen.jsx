// src/Screens/HomeScreen.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Alert,
  SafeAreaView,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import LinearGradient from "react-native-linear-gradient";
import TopNavbar from "../Components/Common/Topnavbar";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { fetchProjectsAPI } from "../Services/Project/fetchProjects";
import TaskDetailsList from "../Components/Tasks/TaskDetailsList";
import CardDetailsList from "../Components/Projects/ProjectDetailsList";
import MeetingDetailsList from "../Components/Meeting/MeetingDetailsList";
import EventDetailsList from "../Components/Event/EventDetailsList";
import { fetchPersonalTasks } from "../Services/Tasks/FetchPersonalTask";
import { fetchMeetings } from "../Services/Meeting/FetchMeetings";
import { getUserEvents } from "../Services/Event/EventServices";
import theme from "../Themes/Themes";

const HomeScreen = ({ navigation }) => {
  const route = useRoute();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // loadUserData defined with stable identity
  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      const userId = (await AsyncStorage.getItem("userId")) || (await AsyncStorage.getItem("user_id"));
      const userInfoString = await AsyncStorage.getItem("userInfo");
      let authToken = await AsyncStorage.getItem("userToken");
      const fallbackToken = await AsyncStorage.getItem("token");
      const parsedUser = userInfoString ? JSON.parse(userInfoString) : null;
      setUserInfo(parsedUser);

      if (!authToken) authToken = fallbackToken || parsedUser?.token || null;
      if (!userId) throw new Error("Authentication info missing. Please login again.");

      const response = await fetchProjectsAPI({
        token: authToken,
        userId,
        orgId: parsedUser?.organization_id || "one",
      });

      if (!response || !response.success) {
        throw new Error(response?.message || "Failed to load projects");
      }

      const formattedProjects = Array.isArray(response.data)
        ? response.data.map((project) => ({
            id: project.id || project._id || project.project_id,
            name:
              project.name ||
              project.title ||
              project.project_name ||
              project.project_title ||
              `Project ${project.id || project.project_id || ""}`,
            status: (project.status || "not started").toLowerCase(),
            description: project.description || "No description available",
            dueDate: project.dueDate || project.due_date || null,
            priority: project.priority || "medium",
            members: project.members || [],
            department_id:
              project.department_id ||
              project.departmentId ||
              (project.department ? project.department.id : null) ||
              null,
            sub_department_id:
              project.sub_department_id ||
              project.subDepartmentId ||
              (project.sub_department ? project.sub_department.id : null) ||
              null,
            ...project,
          }))
        : [];

      setProjects(formattedProjects);

      // No counts needed on home screen anymore
    } catch (error) {
      console.error("HomeScreen loadUserData:", error);
      Alert.alert("Error", error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  // initial load
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // refresh when screen focused
  useFocusEffect(
    useCallback(() => {
      loadUserData();
      // no cleanup needed
    }, [loadUserData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const category = route?.params?.category || null;
    if (!category || category === "project") {
      await loadUserData();
    } else if (category === "task") {
      try {
        const res = await fetchPersonalTasks();
        setTasks(Array.isArray(res?.tasks) ? res.tasks : []);
      } catch {}
    } else if (category === "meeting") {
      try {
        const res = await fetchMeetings();
        setMeetings(Array.isArray(res?.meetings) ? res.meetings : []);
      } catch {}
    } else if (category === "event") {
      try {
        const orgId = (await AsyncStorage.getItem("organization_id")) || userInfo?.organization_id || "one";
        const uid = (await AsyncStorage.getItem("user_id")) || userInfo?.user_id || null;
        if (uid) {
          const data = await getUserEvents(orgId, uid);
          const list = Array.isArray(data?.events) ? data.events : Array.isArray(data) ? data : [];
          setEvents(list);
        } else setEvents([]);
      } catch { setEvents([]); }
    }
    setRefreshing(false);
  }, [loadUserData, route?.params?.category, userInfo]);

  // Fetch data when a tab category param is provided
  useEffect(() => {
    const category = route?.params?.category || null;
    const fetchForCategory = async () => {
      if (category === "task" && tasks.length === 0) {
        try {
          const res = await fetchPersonalTasks();
          setTasks(Array.isArray(res?.tasks) ? res.tasks : []);
        } catch {}
      }
      if (category === "meeting" && meetings.length === 0) {
        try {
          const res = await fetchMeetings();
          setMeetings(Array.isArray(res?.meetings) ? res.meetings : []);
        } catch {}
      }
      if (category === "event" && events.length === 0) {
        try {
          const orgId = (await AsyncStorage.getItem("organization_id")) || userInfo?.organization_id || "one";
          const uid = (await AsyncStorage.getItem("user_id")) || userInfo?.user_id || null;
          if (uid) {
            const data = await getUserEvents(orgId, uid);
            const list = Array.isArray(data?.events) ? data.events : Array.isArray(data) ? data : [];
            setEvents(list);
          } else setEvents([]);
        } catch { setEvents([]); }
      }
    };
    fetchForCategory();
  }, [route?.params?.category, tasks.length, meetings.length, events.length, userInfo]);


  // Shimmer loader component
  const ShimmerLoading = () => (
    <View style={styles.shimmerContainer}>
      <ShimmerPlaceholder LinearGradient={LinearGradient} style={styles.shimmerWelcome} />
      <View style={styles.shimmerCardRow}>
        {[...Array(4)].map((_, index) => (
          <ShimmerPlaceholder key={index} LinearGradient={LinearGradient} style={styles.shimmerCard} />
        ))}
      </View>
      <View style={styles.shimmerList}>
        {[...Array(3)].map((_, i) => (
          <ShimmerPlaceholder key={i} LinearGradient={LinearGradient} style={styles.shimmerListItem} />
        ))}
      </View>
    </View>
  );

  // Simple empty content with guidance to use bottom tabs
  const renderEmptyContent = () => (
    <View style={styles.blankState}>
      <Text style={styles.blankStateTitle}>Explore your work</Text>
      <Text style={styles.blankStateSub}>Use the bottom tabs to view Projects, Tasks, Meetings, and Events.</Text>
      {projects.length === 0 && !loading && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No projects found.</Text>
        </View>
      )}
    </View>
  );

  const category = route?.params?.category || null;
  return (
    // SafeAreaView avoids top padding (TopNavbar handles top safe area). Keep bottom safe area only.
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <TopNavbar navigation={navigation} />

      {loading ? (
        <ShimmerLoading />
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.headerArea}>
            </View>

          {category === "project" ? (
            <CardDetailsList items={projects} navigation={navigation} onRefresh={loadUserData} />
          ) : category === "task" ? (
            <TaskDetailsList items={tasks} navigation={navigation} onRefresh={onRefresh} />
          ) : category === "meeting" ? (
            <MeetingDetailsList items={meetings} />
          ) : category === "event" ? (
            <EventDetailsList items={events} />
          ) : (
            <FlatList
              data={[]}
              keyExtractor={(_, idx) => String(idx)}
              renderItem={null}
              ListEmptyComponent={renderEmptyContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={styles.scrollContent}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerArea: {
    paddingHorizontal: 16,
    marginTop:-10,
    paddingBottom: 8,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 8,
  },
  shimmerContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  shimmerWelcome: {
    width: 200,
    height: 28,
    borderRadius: 4,
    marginBottom: 12,
  },
  shimmerCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  shimmerCard: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  shimmerList: {
    marginTop: 8,
  },
  shimmerListItem: {
    width: "100%",
    height: 90,
    borderRadius: 12,
    marginBottom: 12,
  },
  emptyContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  emptyText: {
    color: theme.colors.secondaryText,
    fontSize: 16,
  },
  stickyHeader: {
    backgroundColor: theme.colors.sectionBg,
    zIndex: 10,
    elevation: 2,
  },
  blankState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  blankStateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 6,
  },
  blankStateSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  });