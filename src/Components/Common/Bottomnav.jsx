// src/Components/Bottomnav.jsx
import React, { useState, useEffect } from "react";
import { fetchProjectsAPI } from "../../Services/Project/fetchProjects";
import { fetchPersonalTasks } from "../../Services/Tasks/FetchPersonalTask";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchMeetings } from "../../Services/Meeting/FetchMeetings";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Home, Folder, ListTodo, Calendar, CalendarClock } from "lucide-react-native";
import { getUserEvents, getOrganizationEvents } from "../../Services/Event/EventServices";
import theme from "../../Themes/Themes";

export default function Bottomnav({ state, navigation }) {
  const [isSheetVisible, setSheetVisible] = useState(false);
  const [projectCount, setProjectCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [meetingCount, setMeetingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaskLoading, setIsTaskLoading] = useState(true);
  const [isMeetingLoading, setIsMeetingLoading] = useState(true);
  const [eventCount, setEventCount] = useState(0);
  const [isEventLoading, setIsEventLoading] = useState(true);

  const currentRoute = state.routes[state.index] || {};
  const currentRouteName = currentRoute?.name;
  const currentCategory = currentRoute?.params?.category;

  const bottomTabs = [
    { id: "home", label: "Home", icon: Home, screen: "Home" },
    { id: "project", label: "Project", icon: Folder, screen: "Home", count: projectCount, loading: isLoading },
    { id: "task", label: "Task", icon: ListTodo, screen: "Home", count: taskCount, loading: isTaskLoading },
    { id: "meeting", label: "Meeting", icon: Calendar, screen: "Home", count: meetingCount, loading: isMeetingLoading },
    { id: "event", label: "Event", icon: CalendarClock, screen: "Home", count: eventCount, loading: isEventLoading },
  ];

  const toggleSheet = () => setSheetVisible(!isSheetVisible);

  const handlePress = (id) => {
    switch (id) {
      case "home":
        navigation.navigate("Home");
        break;
      case "project":
        navigation.navigate("Home", { category: "project" });
        break;
      case "task":
        navigation.navigate("Home", { category: "task" });
        break;
      case "meeting":
        navigation.navigate("Home", { category: "meeting" });
        break;
      case "event":
        navigation.navigate("Home", { category: "event" });
        break;
      default:
        Alert.alert("No screen found");
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchCounts = async () => {
      try {
        setIsLoading(true);
        setIsTaskLoading(true);
        setIsMeetingLoading(true);
        setIsEventLoading(true);

        const userId = (await AsyncStorage.getItem("userId")) || (await AsyncStorage.getItem("user_id"));
        const userInfoString = await AsyncStorage.getItem("userInfo");
        const parsedUser = userInfoString ? JSON.parse(userInfoString) : null;
        let token = await AsyncStorage.getItem("token");
        const userToken = await AsyncStorage.getItem("userToken");
        if (!token) token = parsedUser?.token || userToken || null;
        const orgIdFromStore = (await AsyncStorage.getItem("organization_id")) || undefined;

        // Projects
        if (userId) {
          const orgId = parsedUser?.organization_id || orgIdFromStore || "one";
          const res = await fetchProjectsAPI({ token: token || parsedUser?.token, userId, orgId });
          if (isMounted) setProjectCount(res?.success ? (Array.isArray(res.data) ? res.data.length : 0) : 0);
        }

        // Tasks
        const taskRes = await fetchPersonalTasks();
        if (isMounted) setTaskCount(Array.isArray(taskRes?.tasks) ? taskRes.tasks.length : 0);

        // Meetings
        const meetingRes = await fetchMeetings();
        if (isMounted) setMeetingCount(Array.isArray(meetingRes?.meetings) ? meetingRes.meetings.length : 0);

        // Events
        try {
          const orgId = parsedUser?.organization_id || orgIdFromStore || "one";
          let eventsArr = [];
          if (userId) {
            const data = await getUserEvents(orgId, userId);
            eventsArr = Array.isArray(data?.events) ? data.events : Array.isArray(data) ? data : [];
          } else {
            const today = new Date();
            const start = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
            const data = await getOrganizationEvents(orgId, start);
            eventsArr = Array.isArray(data?.events) ? data.events : Array.isArray(data) ? data : [];
          }
          if (isMounted) setEventCount(eventsArr.length);
        } catch (e) {
          if (isMounted) setEventCount(0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsTaskLoading(false);
          setIsMeetingLoading(false);
          setIsEventLoading(false);
        }
      }
    };

    fetchCounts();
    const intervalId = setInterval(fetchCounts, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Recalculate when current tab or category changes to keep counts fresh
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        // debounce-like minimal delay
        await new Promise(r => setTimeout(r, 50));
        if (cancelled) return;
        // reuse the same logic by toggling loading flags briefly
        setIsLoading(true); setIsTaskLoading(true); setIsMeetingLoading(true); setIsEventLoading(true);
        const userId = (await AsyncStorage.getItem("userId")) || (await AsyncStorage.getItem("user_id"));
        const userInfoString = await AsyncStorage.getItem("userInfo");
        const parsedUser = userInfoString ? JSON.parse(userInfoString) : null;
        const orgId = parsedUser?.organization_id || (await AsyncStorage.getItem("organization_id")) || "one";

        // Projects
        if (userId) {
          const token = (await AsyncStorage.getItem("token")) || parsedUser?.token || (await AsyncStorage.getItem("userToken"));
          const res = await fetchProjectsAPI({ token, userId, orgId });
          setProjectCount(res?.success ? (Array.isArray(res.data) ? res.data.length : 0) : 0);
        }
        // Tasks
        const taskRes = await fetchPersonalTasks();
        setTaskCount(Array.isArray(taskRes?.tasks) ? taskRes.tasks.length : 0);
        // Meetings
        const meetingRes = await fetchMeetings();
        setMeetingCount(Array.isArray(meetingRes?.meetings) ? meetingRes.meetings.length : 0);
        // Events
        try {
          let eventsArr = [];
          if (userId) {
            const data = await getUserEvents(orgId, userId);
            eventsArr = Array.isArray(data?.events) ? data.events : Array.isArray(data) ? data : [];
          } else {
            const d = new Date();
            const start = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            const data = await getOrganizationEvents(orgId, start);
            eventsArr = Array.isArray(data?.events) ? data.events : Array.isArray(data) ? data : [];
          }
          setEventCount(eventsArr.length);
        } catch { setEventCount(0); }
      } finally {
        setIsLoading(false); setIsTaskLoading(false); setIsMeetingLoading(false); setIsEventLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [currentRouteName, currentCategory]);

  return (
    <>
      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
        <View style={styles.container}>
          {bottomTabs.map((tab) => {
            const IconComponent = tab.icon;
            const isHomeScreen = currentRouteName === "Home";
            const isActive = tab.screen !== "Home"
              ? currentRouteName === tab.screen
              : (tab.id === "home" ? isHomeScreen && !currentCategory : isHomeScreen && currentCategory === tab.id);

            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tabItem}
                onPress={() => handlePress(tab.id)}
                activeOpacity={0.8}
              >
                <View style={{ position: "relative" }}>
                  <IconComponent
                    size={24}
                    color={isActive ? theme.colors.primary : theme.colors.tabInactive}
                  />
                  {tab.count !== undefined && (
                    <View style={[styles.countBadge, { backgroundColor: `${theme.colors.primary}20` }]}>
                      <Text style={[styles.countBadgeText, { color: theme.colors.primary }]}>
                        {tab.loading ? "..." : tab.count}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: isActive ? theme.colors.primary : theme.colors.tabInactive, fontSize: 12, marginTop: 4 }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>

      {/* Bottom Sheet Modal */}
      <Modal transparent visible={isSheetVisible} animationType="slide" onRequestClose={toggleSheet}>
        <TouchableWithoutFeedback onPress={toggleSheet}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.sheet}>{/* Sheet content */}</View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.border },
  container: { flexDirection: "row", height: 64, backgroundColor: theme.colors.background, alignItems: "center", justifyContent: "space-around" },
  tabItem: { alignItems: "center", justifyContent: "center", flex: 1 },
  countBadge: { position: "absolute", top: -4, right: -10, minWidth: 18, height: 18, borderRadius: 9, justifyContent: "center", alignItems: "center", paddingHorizontal: 4 },
  countBadgeText: { fontSize: 10, fontWeight: "700" },
  overlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: "flex-end" },
  sheet: { backgroundColor: theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30 },
});