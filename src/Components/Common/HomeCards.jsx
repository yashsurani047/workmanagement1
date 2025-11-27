// src/Components/HomeCards.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
  Easing,
} from "react-native";
import {
  Folder,
  ListTodo,
  Calendar,
  CalendarClock,
} from "lucide-react-native";
import theme from "../../Themes/Themes";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { fetchPersonalTasks } from "../../Services/Tasks/FetchPersonalTask";
import { fetchMeetings } from "../../Services/Meeting/FetchMeetings";
import { getUserEvents, getOrganizationEvents } from "../../Services/Event/EventServices";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SCREEN_WIDTH = Dimensions.get("window").width;

// Dynamic responsive layout
const CARD_SIZE = SCREEN_WIDTH / 4.5; // auto adjust for all devices
const CARD_GAP = 10;

const getSoftBgColor = (key) => {
  return {
    project: theme.colors.projectSoft,
    task: theme.colors.taskSoft,
    meeting: theme.colors.meetingSoft,
    event: theme.colors.eventSoft,
  }[key] || theme.colors.background;
};

const HomeCards = ({ counts: countsProp, onPress, currentUserId, organizationId }) => {
  const navigation = useNavigation();
  const [counts, setCounts] = useState(countsProp || {});

  // Sync external counts into internal state
  useEffect(() => {
    setCounts((prev) => ({ ...prev, ...countsProp }));
  }, [countsProp]);

  const loadEventCount = React.useCallback(async (mounted = true) => {
    try {
      const userInfo = JSON.parse(await AsyncStorage.getItem("userInfo") || "{}");

      const orgId =
        organizationId ||
        (await AsyncStorage.getItem("organization_id")) ||
        userInfo?.organization_id;

      const userId =
        currentUserId ||
        (await AsyncStorage.getItem("user_id")) ||
        userInfo?.user_id;

      let eventsArr = [];

      if (userId) {
        const res = await getUserEvents(orgId, userId);
        eventsArr = res?.events || res || [];
      } else {
        const d = new Date();
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate()
        ).padStart(2, "0")}`;

        const orgRes = await getOrganizationEvents(orgId, date);
        eventsArr = orgRes?.events || orgRes || [];
      }

      if (mounted) {
        setCounts((prev) => ({ ...prev, event: eventsArr.length }));
      }
    } catch (err) {
      console.log("Event Count Error", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // load tasks
        const taskRes = await fetchPersonalTasks();
        const taskCount = taskRes?.taskStats?.total ?? 0;

        // load meetings
        const meetingRes = await fetchMeetings();
        const meetingCount = Array.isArray(meetingRes?.meetings)
          ? meetingRes.meetings.length
          : 0;

        if (mounted) {
          setCounts((prev) => ({
            ...prev,
            task: taskCount,
            meeting: meetingCount,
          }));
        }

        await loadEventCount(mounted);
      } catch (err) {
        console.log("HomeCards Fetch Error:", err);
      }
    };

    load();
    return () => (mounted = false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      loadEventCount(active);
      return () => (active = false);
    }, [loadEventCount])
  );

  const cards = [
    { id: "project", label: "Project", icon: Folder, color: theme.colors.project },
    { id: "task", label: "Task", icon: ListTodo, color: theme.colors.task },
    { id: "meeting", label: "Meeting", icon: Calendar, color: theme.colors.meeting },
    { id: "event", label: "Event", icon: CalendarClock, color: theme.colors.event },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {cards.map((card) => {
          const IconComponent = card.icon;
          const count = counts[card.id] ?? 0;

          const handlePress = () => {
            if (onPress) return onPress(card.id);

            switch (card.id) {
              case "project":
                navigation.navigate("Project");
                break;
              case "task":
                navigation.navigate("AddTask");
                break;
              case "meeting":
                navigation.navigate("MeetingDetailsList");
                break;
              case "event":
                navigation.navigate("EventDetailsList");
                break;
              default:
                Alert.alert("No screen found");
            }
          };

          return (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.card,
                { backgroundColor: getSoftBgColor(card.id) },
              ]}
              onPress={handlePress}
              activeOpacity={0.8}
            >
              <View style={[styles.iconCircle, { backgroundColor: `${card.color}20` }]}>
                <IconComponent size={20} color={card.color} />
              </View>

              <Text style={styles.cardTitle}>{card.label}</Text>
              <Text style={styles.cardCount}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: theme.colors.sectionBg,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-evenly", // PERFECT CENTERING
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 4,
  },

  card: {
    width: CARD_SIZE,
    height: CARD_SIZE + 20, // squareish layout
    borderRadius: 18,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: theme.colors.borderMuted,

    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },

  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 2,
  },

  cardCount: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.primary,
  },
});

export default HomeCards;
