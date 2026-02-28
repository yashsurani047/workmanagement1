// src/Components/Event/EventDetailsList.jsx
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Plus, Calendar, MoreVertical, Edit3, X, Trash2, Clock } from "lucide-react-native";
import { useTheme } from "../../Themes/ThemeContext";
import Toast from "react-native-toast-message";
import TopNavbar from "../Common/Topnavbar";

const MOCK_EVENTS = [
  {
    event_id: "1",
    title: "Quarterly Team Sync",
    description: "Discussing Q1 goals and team performance metrics.",
    start_time: new Date(Date.now() + 86400000).toISOString(),
    end_time: new Date(Date.now() + 86400000 + 3600000).toISOString(),
    location: "Conference Room A",
    event_type: "internal",
    visibility: "default"
  },
  {
    event_id: "2",
    title: "New Product Launch",
    description: "External presentation for the upcoming mobile app release.",
    start_time: new Date(Date.now() + 172800000).toISOString(),
    end_time: new Date(Date.now() + 172800000 + 7200000).toISOString(),
    location: "Virtual (Zoom)",
    event_type: "external",
    visibility: "public"
  },
  {
    event_id: "3",
    title: "UI/UX Workshop",
    description: "Internal training session for design principles.",
    start_time: new Date(Date.now() - 86400000).toISOString(),
    end_time: new Date(Date.now() - 86400000 + 3600000).toISOString(),
    location: "Design Lab",
    event_type: "internal",
    visibility: "default"
  },
  {
    event_id: "4",
    title: "Client Feedback Session",
    description: "Weekly catch-up with the key stakeholders from XYZ Corp.",
    start_time: new Date(Date.now() + 259200000).toISOString(),
    end_time: new Date(Date.now() + 259200000 + 1800000).toISOString(),
    location: "Client Office",
    event_type: "external",
    visibility: "private"
  },
  {
    event_id: "5",
    title: "Annual Sports Day",
    description: "Company-wide outdoor event for team building.",
    start_time: new Date(Date.now() + 604800000).toISOString(),
    end_time: new Date(Date.now() + 604800000 + 28800000).toISOString(),
    location: "Central Park Stadium",
    event_type: "internal",
    visibility: "public"
  }
];

// helper: minimal shimmer card (Animated)
const ShimmerCard = ({ theme }) => {
  const shimmer = new Animated.Value(0);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const bg = shimmer.interpolate({ inputRange: [0, 1], outputRange: [theme.colors.muted100, theme.colors.muted200] });
  return (
    <View style={{
      backgroundColor: theme.colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: "hidden",
      flexDirection: "row",
      marginBottom: 12,
      shadowColor: theme.colors.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    }}>
      <View style={{ width: 6, backgroundColor: theme.colors.event }} />
      <View style={{ flex: 1, padding: 14 }}>
        <Animated.View style={{ height: 16, width: "60%", borderRadius: 6, backgroundColor: bg }} />
        <Animated.View style={{ height: 12, width: "45%", borderRadius: 6, backgroundColor: bg, marginTop: 10 }} />
      </View>
    </View>
  );
};

// Format helpers
const formatDateISO = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const EventCard = ({ event, onPress, onMenu, showMenu = true, theme }) => {
  const title = event?.title || event?.name || "Untitled Event";
  const descr = event?.description || "";
  const startVal = event?.start_time || event?.start_date;
  const endVal = event?.end_time || event?.end_date;
  let startDateStr = "";
  let endDateStr = "";
  let startTimeStr = "";
  let endTimeStr = "";
  try {
    const ds = new Date(startVal);
    const de = new Date(endVal);
    const dateOpts = { weekday: "short", month: "short", day: "numeric" };
    startDateStr = ds.toLocaleDateString(undefined, dateOpts);
    endDateStr = de.toLocaleDateString(undefined, dateOpts);
    const fmt = (dt) => {
      let h = dt.getHours();
      const m = String(dt.getMinutes()).padStart(2, "0");
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12;
      if (h === 0) h = 12;
      return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
    };
    startTimeStr = fmt(ds);
    endTimeStr = fmt(de);
  } catch { }

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={{
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: "hidden",
      flexDirection: "row",
      shadowColor: theme.colors.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    }}>
      <View style={{ width: 4, backgroundColor: theme.colors.event }} />
      <View style={{ flex: 1, padding: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 14.5, fontWeight: "700", color: theme.colors.text, flex: 1, marginRight: 8 }} numberOfLines={1}>
            {title}
          </Text>
          {showMenu && (
            <TouchableOpacity style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 4 }} onPress={onMenu}>
              <MoreVertical size={14} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {!!descr && <Text style={{ marginTop: 2, color: theme.colors.textSecondary, fontSize: 12 }} numberOfLines={1}>{descr}</Text>}

        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          {!!startDateStr && (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Calendar size={11} color={theme.colors.event} />
              <Text style={{ fontSize: 11, fontWeight: "600", color: theme.colors.event, marginLeft: 4 }}>{startDateStr}</Text>
            </View>
          )}

          {(!!startTimeStr || !!endTimeStr) && (
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.muted100, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
              <Clock size={11} color={theme.colors.textSecondary} />
              <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginLeft: 4 }}>
                {startTimeStr}{endTimeStr ? ` - ${endTimeStr}` : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function EventDetailsList(props) {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate] = useState(() => formatDateISO(new Date()));
  const [canUserActions, setCanUserActions] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuEvent, setMenuEvent] = useState(null);

  const load = useCallback(
    async (opts = { silent: false }) => {
      if (!opts?.silent) setLoading(true);
      setError("");

      // Simulate network delay
      await new Promise(r => setTimeout(r, 600));

      const events = [...MOCK_EVENTS];
      events.sort((a, b) => {
        const da = new Date(a.start_time || a.start_date || a.date || 0).getTime();
        const db = new Date(b.start_time || b.start_date || b.date || 0).getTime();
        return da - db;
      });

      setList(events);
      setCanUserActions(true);
      if (!opts?.silent) setLoading(false);
    },
    []
  );

  useEffect(() => {
    if (Array.isArray(props?.items) && props.items.length > 0) {
      const itemsCopy = [...props.items];
      itemsCopy.sort((a, b) => {
        const da = new Date(a.start_time || a.start_date || a.date || 0).getTime();
        const db = new Date(b.start_time || b.start_date || b.date || 0).getTime();
        return da - db;
      });
      setList(itemsCopy);
      setLoading(false);
    } else {
      load();
    }
  }, [props?.items, load]);

  useFocusEffect(
    useCallback(() => {
      load({ silent: true });
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load({ silent: false });
    setRefreshing(false);
  }, [load]);

  const handleDelete = async (id) => {
    // Mock delete
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    setList((prev) => prev.filter((e) => String(e?.event_id || e?.id) !== String(id)));
    setLoading(false);
    Toast.show({ type: "success", text1: "Event deleted (Mock)", position: "bottom", visibilityTime: 1400 });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["bottom"]}>
      <TopNavbar navigation={navigation} />

      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 20, fontWeight: "800", color: theme.colors.text }}>Upcoming Events</Text>
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6
          }}
          onPress={() => navigation.navigate("CreateEvent")}
        >
          <Plus size={16} color="#FFF" strokeWidth={3} />
          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>New Event</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={{ padding: 12 }}>
          <Text style={{ color: theme.colors.error }}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={{ padding: 16 }}>
          {Array.from({ length: Math.max(3, Math.ceil((Dimensions.get("window").height - 240) / 110)) }).map((_, i) => (
            <ShimmerCard key={i} theme={theme} />
          ))}
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item, idx) => String(item?.event_id || item?.id || idx)}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              theme={theme}
              onPress={() => { }}
              onMenu={() => {
                setMenuEvent(item);
                setMenuVisible(true);
              }}
              showMenu={canUserActions}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            !loading ? (
              <View style={{ padding: 24 }}>
                <Text style={{ color: theme.colors.textSecondary, textAlign: "center" }}>No events found.</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Per-item menu modal */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)", justifyContent: "flex-end" }} onPress={() => setMenuVisible(false)}>
          <View style={{ backgroundColor: theme.colors.card, padding: 12, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 8, paddingHorizontal: 4 }}>Event actions</Text>

            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 8 }}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate("CreateEvent", { event: menuEvent });
              }}
            >
              <Edit3 size={16} color={theme.colors.text} />
              <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: "600", marginLeft: 10 }}>Edit Event</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 8 }}
              onPress={() => {
                const id = menuEvent?.event_id || menuEvent?.id;
                Alert.alert("Delete event", "Are you sure you want to delete this event?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                      setMenuVisible(false);
                      await handleDelete(id);
                    },
                  },
                ]);
              }}
            >
              <Trash2 size={16} color={theme.colors.error} />
              <Text style={{ color: theme.colors.error, fontSize: 15, fontWeight: "600", marginLeft: 10 }}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 8 }} onPress={() => setMenuVisible(false)}>
              <X size={16} color={theme.colors.textSecondary} />
              <Text style={{ color: theme.colors.textSecondary, fontSize: 15, fontWeight: "600", marginLeft: 10 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
