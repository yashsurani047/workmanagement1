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
  Animated,
  PanResponder,
  TouchableOpacity,
  ScrollView,
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
import DateSelector from "../Components/Projects/DateSelector";
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
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [animX, setAnimX] = useState(new Animated.Value(0));
  const baseDate = React.useMemo(() => new Date(), []);
  const dates = React.useMemo(() => {
    const start = new Date(baseDate);
    start.setDate(start.getDate() - 15);
    return Array.from({ length: 90 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [baseDate]);

  const formatDateISO = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };
  const prettyDay = (d) => d.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase();
  const dayNum = (d) => String(d.getDate());
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(selectedDate, i - 3));

  // --- Instagram-like swipe navigation across sections ---
  const order = ["home", "project", "task", "meeting", "event"]; // sequence
  const currentKey = () => {
    const cat = route?.params?.category;
    return cat ? String(cat).toLowerCase() : "home";
  };
  const navigateKey = (key) => {
    if (key === "home") navigation.navigate("Home");
    else navigation.navigate("Home", { category: key });
  };
  const goNext = () => {
    const idx = order.indexOf(currentKey());
    navigateKey(order[(idx + 1) % order.length]);
  };
  const goPrev = () => {
    const idx = order.indexOf(currentKey());
    navigateKey(order[(idx - 1 + order.length) % order.length]);
  };
  const panResponder = React.useMemo(() => (
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) => {
        const absDx = Math.abs(g.dx);
        const absDy = Math.abs(g.dy);
        return absDx > 12 && absDx > absDy; // horizontal intent
      },
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: (_e, g) => {
        const absDx = Math.abs(g.dx);
        const absDy = Math.abs(g.dy);
        return absDx > 12 && absDx > absDy;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_e, g) => {
        const threshold = 40; // pixels
        if (g.dx >= threshold) {
          // left → right
          goPrev();
        } else if (g.dx <= -threshold) {
          // right → left
          goNext();
        }
      },
    })
  ), [route?.params?.category]);

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
        <Animated.View style={{ flex: 1, transform: [{ translateX: animX }] }} {...panResponder.panHandlers}>
          {!category && (
            <View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.pillButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, borderWidth: 1 }]} onPress={() => navigation.navigate("Home", { category: "project" })}>
                  <Text style={[styles.pillButtonText, { color: theme.colors.text }]}>View All</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.pillButton, { backgroundColor: theme.colors.primary }]} onPress={() => setSelectedDate(new Date())}>
                  <Text style={[styles.pillButtonText, { color: theme.colors.white }]}>Pick Date</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateStrip}>
                <DateSelector onDateChange={(id) => {
                  if (!id) { setSelectedDate(new Date()); return; }
                  try { setSelectedDate(new Date(id)); } catch { setSelectedDate(new Date()); }
                }} />
              </View>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Focus Today</Text>
                <View style={styles.cardBox}>
                  <Text style={styles.cardTitleText}>Review Client CRM Data</Text>
                  <View style={{ height: 8 }} />
                  <Text style={styles.cardSubText}>Prepare Q3 Presentation Draft</Text>
                </View>
              </View>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <View style={styles.activityCard}>
                  <Text style={styles.activityTitle}>Task updates and mentions will appear here.</Text>
                  <Text style={styles.activityTime}>Just now</Text>
                </View>
              </View>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Upcoming Meetings</Text>
                <View style={styles.activityCard}>
                  <Text style={styles.activityTitle}>No upcoming meetings.</Text>
                  <Text style={styles.activityTime}>Today</Text>
                </View>
              </View>
            </View>
          )}

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
        </Animated.View>
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  pillButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dateStrip: {
    marginTop: 12,
    marginBottom: 8,
  },
  datePill: {
    width: 56,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  datePillDay: {
    fontSize: 16,
    fontWeight: '700',
  },
  datePillWeek: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  cardBox: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 12,
  },
  cardTitleText: {
    color: theme.colors.text,
    fontSize: 14.5,
    fontWeight: '700',
  },
  cardSubText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  activityCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 12,
  },
  activityTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  activityTime: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 12,
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