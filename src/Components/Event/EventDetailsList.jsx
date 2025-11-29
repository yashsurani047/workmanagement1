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
import { Plus, Calendar, MoreVertical, Edit3, X, Trash2 } from "lucide-react-native";
import theme from "../../Themes/Themes";
import Toast from "react-native-toast-message";
import { getOrganizationEvents, getUserEvents, deleteEvent } from "../../Services/Event/EventServices";

// helper: minimal shimmer card (Animated)
const ShimmerCard = () => {
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
    <View style={[styles.card, styles.shadow, { flexDirection: "row", marginBottom: 12 }]}>
      <View style={[styles.leftStripe, { backgroundColor: theme.colors.event }]} />
      <View style={styles.body}>
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

const timeRange = (startISO, endISO) => {
  try {
    const s = new Date(startISO);
    const e = new Date(endISO);
    const fmt = (dt) => {
      let h = dt.getHours();
      const m = String(dt.getMinutes()).padStart(2, "0");
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12;
      if (h === 0) h = 12;
      return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
    };
    return `${fmt(s)} - ${fmt(e)}`;
  } catch {
    return "";
  }
};

const EventCard = ({ event, onPress, onMenu, showMenu = true }) => {
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
  } catch {}

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.card, styles.shadow, { flexDirection: "row" }]}>
      <View style={[styles.leftStripe, { backgroundColor: theme.colors.event }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {showMenu && (
            <TouchableOpacity style={styles.itemIconBtn} onPress={onMenu}>
              <MoreVertical size={18} color={theme.colors.text} />
            </TouchableOpacity>
          )}
        </View>

        {!!descr && <Text style={styles.desc} numberOfLines={2}>{descr}</Text>}

        <View style={styles.metaRow}>
          {!!startDateStr && (
            <View style={[styles.dateChip, { backgroundColor: `${theme.colors.event}15`, borderColor: `${theme.colors.event}40`, marginRight: 8 }]}>
              <Calendar size={12} color={theme.colors.event} />
              <Text style={[styles.dateChipText, { color: theme.colors.event, marginLeft: 6 }]}>{startDateStr}</Text>
            </View>
          )}
          {!!startTimeStr && <Text style={styles.meta}>{startTimeStr}</Text>}
        </View>

        <View style={[styles.metaRow, { marginTop: 6 }]}>
          {!!endDateStr && (
            <View style={[styles.dateChip, { backgroundColor: `${theme.colors.event}15`, borderColor: `${theme.colors.event}40`, marginRight: 8 }]}>
              <Calendar size={12} color={theme.colors.event} />
              <Text style={[styles.dateChipText, { color: theme.colors.event, marginLeft: 6 }]}>{endDateStr}</Text>
            </View>
          )}
          {!!endTimeStr && <Text style={styles.meta}>{endTimeStr}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function EventDetailsList(props) {
  const navigation = useNavigation();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate] = useState(() => formatDateISO(new Date()));
  const [canUserActions, setCanUserActions] = useState(false); // true if userId exists
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuEvent, setMenuEvent] = useState(null);

  const load = useCallback(
    async (opts = { silent: false }) => {
      try {
        if (!opts?.silent) setLoading(true);
        setError("");
        const userInfoRaw = await AsyncStorage.getItem("userInfo");
        const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
        const organizationId = (await AsyncStorage.getItem("organization_id")) || userInfo?.organization_id || "one";
        const storedUserId = await AsyncStorage.getItem("user_id");
        const userId = storedUserId || userInfo?.user_id || "";
        setCanUserActions(!!userId);

        let data;
        if (userId) {
          data = await getUserEvents(organizationId, userId);
        } else {
          data = await getOrganizationEvents(organizationId, selectedDate);
        }

        const events = Array.isArray(data?.events) ? data.events : Array.isArray(data) ? data : [];
        // Sort by start date ascending
        events.sort((a, b) => {
          const da = new Date(a.start_time || a.start_date || a.date || 0).getTime();
          const db = new Date(b.start_time || b.start_date || b.date || 0).getTime();
          return da - db;
        });
        setList(events);
      } catch (e) {
        setError(e?.message || "Failed to load events");
        setList([]);
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [selectedDate]
  );

  // If parent passes items, use them (no fetch). Otherwise load.
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

  // reload when screen comes into focus
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
    try {
      await deleteEvent(String(id));
      Toast.show({ type: "custom_success", text1: "Event deleted", position: "bottom", visibilityTime: 1400 });
      setList((prev) => prev.filter((e) => String(e?.event_id || e?.id) !== String(id)));
    } catch (e) {
      Toast.show({ type: "custom_error", text1: e?.message || "Failed to delete", position: "bottom" });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
        <View style={styles.headerActions}>
          {canUserActions && (
            <TouchableOpacity style={[styles.headerIconBtn, { marginLeft: 10 }]} onPress={() => navigation.navigate("CreateEvent")}>
              <Plus size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {error ? (
        <View style={{ padding: 12 }}>
          <Text style={{ color: theme.colors.error }}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={{ padding: 16 }}>
          {Array.from({ length: Math.max(3, Math.ceil((Dimensions.get("window").height - 240) / 110)) }).map((_, i) => (
            <ShimmerCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item, idx) => String(item?.event_id || item?.id || idx)}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => {
                // navigate to event details if you have a route
                // navigation.navigate('EventDetail', { event: item });
              }}
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
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuSheet}>
            <Text style={styles.menuTitle}>Event actions</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate("CreateEvent", { event: menuEvent });
              }}
            >
              <Edit3 size={16} color={theme.colors.text} />
              <Text style={styles.menuItemText}>Edit Event</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
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
              <Text style={[styles.menuItemText, { color: theme.colors.error }]}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
              <X size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
   // borderBottomWidth: 1,
    //borderBottomColor: theme.colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: theme.colors.text },
  headerActions: { flexDirection: "row", alignItems: "center" },
  headerIconBtn: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 50, padding: 6 },
  itemIconBtn: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 50, padding: 6 },
  card: { backgroundColor: theme.colors.white, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.muted100, overflow: "hidden" },
  leftStripe: { width: 6 },
  shadow: { shadowColor: theme.colors.shadow, shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  body: { flex: 1, padding: 14 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 16.5, fontWeight: "700", color: theme.colors.text, flex: 1, marginRight: 8 },
  desc: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 13.5 },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start" },
  meta: { color: theme.colors.textSecondary, fontSize: 12.5 },
  dateChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  dateChipText: { fontSize: 12, fontWeight: "600", marginLeft: 6 },

  // Menu styles
  menuBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)", justifyContent: "flex-end" },
  menuSheet: { backgroundColor: theme.colors.background, padding: 12, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  menuTitle: { color: theme.colors.textSecondary, fontSize: 12, marginBottom: 8, paddingHorizontal: 4 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 8 },
  menuItemText: { color: theme.colors.text, fontSize: 15, fontWeight: "600", marginLeft: 10 },
});
