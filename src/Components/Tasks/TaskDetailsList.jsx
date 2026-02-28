// src/Components/Tasks/TaskDetailsList.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Alert,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  SafeAreaView,
  StatusBar,
  Easing,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  MoreVertical,
  Plus,
  Filter,
  Edit3,
  Trash2,
  X,
  Clock,
  Users,
  ChevronRight,
  CalendarDays,
  Sparkles,
  TrendingUp,
  ClipboardList,
  Paperclip,
  User,
  Calendar,
} from "lucide-react-native";
import { useTheme } from "../../Themes/ThemeContext";
import { deletePersonalTask } from "../../Services/Tasks/FetchPersonalTask";

/* ──────────────────── helpers ──────────────────── */

const formatLabel = (s = "") =>
  String(s)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (iso) => {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return null;
  }
};

const relativeTime = (iso) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(iso);
  } catch {
    return "";
  }
};

/* ──────────────────── config ──────────────────── */

const PRIORITY_COLORS = {
  urgent_important: "#EF4444",
  urgent_not_important: "#F97316",
  not_urgent_important: "#10B981",
  not_urgent_not_important: "#94A3B8",
  high: "#EF4444",
  medium: "#F59E0B",
  low: "#10B981",
  urgent: "#DC2626",
  critical: "#B91C1C",
};

const STATUS_CONFIG = {
  completed: { label: "Completed", icon: "✓" },
  in_progress: { label: "In Progress", icon: "⚡" },
  not_started: { label: "Not Started", icon: "○" },
  pending: { label: "Pending", icon: "⏳" },
  on_hold: { label: "On Hold", icon: "⏸" },
  rejected: { label: "Rejected", icon: "✕" },
  cancelled: { label: "Cancelled", icon: "✕" },
  archived: { label: "Archived", icon: "📦" },
};

/* ──────────────────── Animated Task Card ──────────────────── */

/* ──────────────────── Helpers & Colors ──────────────────── */

const TASK_COLORS = ["#10B981", "#F59E0B", "#F97316", "#EF4444", "#8B5CF6", "#3B82F6"];

/* ──────────────────── Modern Task Card (Timeline Style) ──────────────────── */

const TaskCard = ({ task, isLast, onPress, onMenuPress, theme, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay: index * 80, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, delay: index * 80, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [index]);

  const formatDisplayTime = (t) => {
    if (!t) return null;
    if (t.includes("AM") || t.includes("PM")) return t;
    try {
      const [h, m] = t.split(":");
      let hh = parseInt(h, 10);
      const ampm = hh >= 12 ? "PM" : "AM";
      hh = hh % 12 || 12;
      return `${hh}:${m} ${ampm}`;
    } catch { return t; }
  };

  const isCompleted = (task?.status || "").toLowerCase() === "completed";
  const title = task?.title || "Untitled Task";
  const description = task?.description || "";
  const startTime = formatDisplayTime(task?.start_time) || "08:00";
  const endTime = formatDisplayTime(task?.end_time) || "10:00";

  const cardColor = isCompleted
    ? TASK_COLORS[index % TASK_COLORS.length]
    : theme.colors.card;
  const borderColor = TASK_COLORS[index % TASK_COLORS.length];
  const textColor = isCompleted ? "#FFFFFF" : "#1F2937";
  const subTextColor = isCompleted ? "rgba(255,255,255,0.85)" : "#6B7280";

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        marginBottom: 16,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPress?.(task)}
        style={{
          backgroundColor: cardColor,
          borderRadius: 16,
          paddingHorizontal: 20,
          paddingVertical: 18,
          borderLeftWidth: 6,
          borderLeftColor: borderColor,
          shadowColor: "#000",
          shadowOpacity: 0.04,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: textColor, flexShrink: 1 }}>
                {title}
              </Text>
              {isCompleted && (
                <View style={{
                  backgroundColor: "rgba(255,255,255,0.25)",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4
                }}>
                  <Sparkles size={11} color="#FFFFFF" strokeWidth={3} />
                  <Text style={{ fontSize: 10, fontWeight: "800", color: "#FFFFFF", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Completed
                  </Text>
                </View>
              )}
            </View>
            {!!description && (
              <Text style={{ fontSize: 14, color: subTextColor, marginBottom: 12 }} numberOfLines={2}>
                {description}
              </Text>
            )}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Calendar size={16} color={subTextColor} strokeWidth={2} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: subTextColor }}>
                {startTime} - {endTime}
              </Text>
            </View>
          </View>

          {onMenuPress && (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); onMenuPress(task); }}
              style={{ padding: 4 }}
            >
              <MoreVertical size={20} color={subTextColor} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
          {isCompleted && (
            <View style={{ position: "absolute", right: -5, bottom: -5, opacity: 0.15, zIndex: -1 }}>
              <Sparkles size={80} color="#FFFFFF" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ──────────────────── Shimmer Card ──────────────────── */

const ShimmerTaskCard = ({ theme, index }) => {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const Block = ({ w, h, r = 8, mt = 0 }) => (
    <Animated.View
      style={{
        width: w, height: h, borderRadius: r,
        backgroundColor: theme.colors.muted200, marginTop: mt, opacity: pulseAnim,
      }}
    />
  );

  return (
    <Animated.View
      style={{
        opacity: fadeIn,
        backgroundColor: theme.colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: "hidden",
      }}
    >
      <View style={{ height: 4, backgroundColor: theme.colors.muted200 }} />
      <View style={{ padding: 18 }}>
        <View style={{ flexDirection: "row" }}>
          <Block w={44} h={44} r={14} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Block w="70%" h={18} r={6} />
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <Block w={80} h={22} r={11} />
              <Block w={55} h={22} r={11} />
            </View>
          </View>
        </View>
        <Block w="90%" h={14} mt={14} />
        <Block w="60%" h={14} mt={6} />
        <Block w="100%" h={5} r={3} mt={16} />
        <View style={{ height: 1, backgroundColor: theme.colors.borderMuted, marginVertical: 14 }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flexDirection: "row" }}>
            {[0, 1, 2].map((i) => (
              <Block key={i} w={32} h={32} r={16} />
            ))}
          </View>
          <Block w={30} h={30} r={10} />
        </View>
      </View>
    </Animated.View>
  );
};

/* ──────────────────── Empty State ──────────────────── */

const EmptyState = ({ theme }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        paddingHorizontal: 32,
      }}
    >
      <View
        style={{
          width: 80, height: 80, borderRadius: 24,
          backgroundColor: `${theme.colors.primary}12`,
          alignItems: "center", justifyContent: "center", marginBottom: 20,
        }}
      >
        <Sparkles size={36} color={theme.colors.primary} strokeWidth={1.5} />
      </View>
      <Text
        style={{
          fontSize: 19, fontWeight: "800", color: theme.colors.text,
          marginBottom: 8, letterSpacing: -0.3,
        }}
      >
        No tasks yet
      </Text>
      <Text
        style={{
          fontSize: 14, color: theme.colors.textSecondary,
          textAlign: "center", lineHeight: 21,
        }}
      >
        Create your first task and start organizing your work beautifully.
      </Text>
    </Animated.View>
  );
};

/* ──────────────────── Summary Stats Row ──────────────────── */

const StatsRow = ({ data, theme }) => {
  const total = data.length;
  const completed = data.filter((t) => (t.status || "").toLowerCase() === "completed").length;
  const inProgress = data.filter((t) => (t.status || "").toLowerCase() === "in_progress").length;

  if (total === 0) return null;

  return (
    <View style={{ flexDirection: "row", paddingHorizontal: 20, marginBottom: 14, gap: 10 }}>
      {[
        { label: "Total", value: total, color: theme.colors.primary, icon: ClipboardList },
        { label: "Active", value: inProgress, color: theme.colors.secondary, icon: TrendingUp },
        { label: "Done", value: completed, color: theme.colors.success, icon: Sparkles },
      ].map((stat) => (
        <View
          key={stat.label}
          style={{
            flex: 1,
            backgroundColor: `${stat.color}10`,
            borderRadius: 14,
            padding: 12,
            alignItems: "center",
            borderWidth: 1,
            borderColor: `${stat.color}20`,
          }}
        >
          <stat.icon size={18} color={stat.color} strokeWidth={2} />
          <Text style={{ fontSize: 20, fontWeight: "800", color: stat.color, marginTop: 4 }}>
            {stat.value}
          </Text>
          <Text
            style={{
              fontSize: 11, fontWeight: "600", color: theme.colors.textSecondary,
              marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5,
            }}
          >
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

/* ──────────────────── Main List Component ──────────────────── */

const TaskDetailsList = ({ items = [], onItemPress, onTaskMenuPress, onRefresh, navigation }) => {
  const { theme } = useTheme();
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [displayed, setDisplayed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadFromApi = useCallback(async () => {
    try {
      setLoading(true);
      setDisplayed(items);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [items]);

  useEffect(() => {
    loadFromApi();
  }, [loadFromApi]);

  const handleMenuPress = (task) => {
    setSelectedTask(task);
    if (onTaskMenuPress) return onTaskMenuPress(task);
    setActionsOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTask || deleting) return;
    try {
      setDeleting(true);
      const orgId = (await AsyncStorage.getItem("organization_id")) || "one";
      const taskId = selectedTask.personal_task_id || selectedTask.id || selectedTask._id;
      if (!taskId) { Alert.alert("Error", "Missing task ID"); return; }
      const res = await deletePersonalTask(orgId, taskId);
      if (res?.success !== false) {
        setDisplayed((prev) => prev.filter((t) => (t.personal_task_id || t.id || t._id) !== taskId));
        setActionsOpen(false);
        if (onRefresh) onRefresh();
      } else {
        Alert.alert("Error", res?.error || "Failed to delete task");
      }
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to delete task");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    let list = Array.isArray(displayed) ? displayed : [];
    if (statusFilter !== "all") list = list.filter((t) => (t.status || "").toLowerCase() === statusFilter);
    if (priorityFilter !== "all") list = list.filter((t) => (t.priority || "").toLowerCase() === priorityFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((t) =>
        (t.title || "").toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [displayed, statusFilter, priorityFilter, query]);

  const handleUpdate = () => {
    if (!selectedTask) return;
    navigation && navigation.navigate && navigation.navigate("AddTask", { mode: "update", task: selectedTask });
    setActionsOpen(false);
  };

  const statusOptions = [
    "all", "completed", "in_progress", "not_started", "pending", "on_hold", "rejected", "cancelled", "archived",
  ];
  const priorityOptions = [
    { label: "All", value: "all" },
    { label: "High", value: "high" },
    { label: "Medium", value: "medium" },
    { label: "Low", value: "low" },
    { label: "Urgent & Important", value: "urgent_important" },
    { label: "Urgent & Not Important", value: "urgent_not_important" },
    { label: "Not Urgent & Important", value: "not_urgent_important" },
    { label: "Not Urgent & Not Important", value: "not_urgent_not_important" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>

      {/* ─── Modern Task Header ─── */}
      <View
        style={{
          paddingHorizontal: 14,
          paddingTop: 10,
          paddingBottom: 12,
          backgroundColor: theme.colors.background,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
          <View>
            <Text style={{
              fontSize: 12,
              fontWeight: "700",
              color: theme.colors.primary,
              textTransform: "uppercase",
              letterSpacing: 1.2,
              marginBottom: 2
            }}>
              Personal View
            </Text>
            <Text style={{
              fontSize: 26,
              fontWeight: "900",
              color: theme.colors.text,
              letterSpacing: -0.8
            }}>
              My Tasks
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => setFilterOpen(true)}
              style={{
                width: 44, height: 44, borderRadius: 15,
                backgroundColor: theme.colors.card,
                alignItems: "center", justifyContent: "center",
                borderWidth: 1.5, borderColor: theme.colors.border
              }}
            >
              <Filter size={20} color={theme.colors.text} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("AddTask")}
              style={{
                width: 44, height: 44, borderRadius: 15,
                backgroundColor: theme.colors.primary,
                alignItems: "center", justifyContent: "center",
                shadowColor: theme.colors.primary,
                shadowOpacity: 0.3, shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4
              }}
            >
              <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{
          marginTop: 12,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.colors.muted100,
          alignSelf: "flex-start",
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12
        }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary, marginRight: 8 }} />
          <Text style={{ fontSize: 13, color: theme.colors.textSecondary, fontWeight: "600" }}>
            {displayed.length} active items to complete
          </Text>
        </View>
      </View>

      {/* ─── List ─── */}
      <FlatList
        data={
          loading
            ? Array(5).fill(null).map((_, i) => ({ __shimmer: true, id: `s-${i}` }))
            : filtered
        }
        renderItem={({ item, index }) =>
          item?.__shimmer ? (
            <ShimmerTaskCard theme={theme} index={index} />
          ) : (
            <TaskCard
              task={item}
              isLast={index === filtered.length - 1}
              onPress={onItemPress}
              onMenuPress={handleMenuPress}
              theme={theme}
              index={index}
            />
          )
        }
        keyExtractor={(item, i) => String(item.personal_task_id || item.id || item._id || i)}
        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 40 }}
        ListHeaderComponent={null}
        ItemSeparatorComponent={null}
        ListEmptyComponent={!loading ? <EmptyState theme={theme} /> : null}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={
              onRefresh
                ? async () => { setRefreshing(true); await onRefresh(); setRefreshing(false); }
                : async () => { setRefreshing(true); await loadFromApi(); setRefreshing(false); }
            }
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />

      {/* ─── Filter Modal ─── */}
      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setFilterOpen(false)}>
          <View style={{ flex: 1, backgroundColor: theme.colors.overlay, justifyContent: "flex-end" }}>
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: theme.colors.card,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  paddingHorizontal: 20,
                  paddingTop: 14,
                  paddingBottom: 40,
                  maxHeight: "85%",
                }}
              >
                <View style={{ height: 5, width: 44, backgroundColor: theme.colors.border, alignSelf: "center", borderRadius: 3, marginBottom: 20 }} />
                <Text style={{ fontSize: 20, fontWeight: "800", color: theme.colors.text, marginBottom: 20, letterSpacing: -0.3 }}>
                  Filter Tasks
                </Text>

                {/* Search */}
                <View
                  style={{
                    borderWidth: 1, borderColor: theme.colors.border,
                    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 20,
                    backgroundColor: theme.colors.muted100,
                  }}
                >
                  <TextInput
                    placeholder="Search by title or description…"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={query}
                    onChangeText={setQuery}
                    style={{ color: theme.colors.text, fontSize: 15, fontWeight: "500" }}
                  />
                </View>

                {/* Status */}
                <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.textSecondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Status
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                  {statusOptions.map((s) => {
                    const active = statusFilter === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        onPress={() => setStatusFilter(s)}
                        style={{
                          paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                          borderWidth: 1.5,
                          borderColor: active ? theme.colors.primary : theme.colors.border,
                          backgroundColor: active ? `${theme.colors.primary}15` : "transparent",
                        }}
                      >
                        <Text
                          style={{
                            color: active ? theme.colors.primary : theme.colors.text,
                            fontWeight: active ? "700" : "500", fontSize: 13,
                          }}
                        >
                          {formatLabel(s)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Priority */}
                <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.textSecondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Priority
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
                  {priorityOptions.map((p) => {
                    const active = priorityFilter === p.value;
                    return (
                      <TouchableOpacity
                        key={p.value}
                        onPress={() => setPriorityFilter(p.value)}
                        style={{
                          paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                          borderWidth: 1.5,
                          borderColor: active ? theme.colors.primary : theme.colors.border,
                          backgroundColor: active ? `${theme.colors.primary}15` : "transparent",
                        }}
                      >
                        <Text
                          style={{
                            color: active ? theme.colors.primary : theme.colors.text,
                            fontWeight: active ? "700" : "500", fontSize: 13,
                          }}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Actions */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1, paddingVertical: 14, borderRadius: 14,
                      borderWidth: 1.5, borderColor: theme.colors.border, alignItems: "center",
                    }}
                    onPress={() => { setQuery(""); setStatusFilter("all"); setPriorityFilter("all"); }}
                  >
                    <Text style={{ color: theme.colors.text, fontWeight: "700", fontSize: 15 }}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1, paddingVertical: 14, borderRadius: 14,
                      backgroundColor: theme.colors.primary, alignItems: "center",
                    }}
                    onPress={() => setFilterOpen(false)}
                  >
                    <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Actions Modal ─── */}
      <Modal visible={actionsOpen} transparent animationType="fade" onRequestClose={() => setActionsOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setActionsOpen(false)}>
          <View style={{ flex: 1, backgroundColor: theme.colors.overlay, justifyContent: "flex-end" }}>
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: theme.colors.card,
                  padding: 16,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                }}
              >
                <View style={{ height: 5, width: 44, backgroundColor: theme.colors.border, alignSelf: "center", borderRadius: 3, marginBottom: 16 }} />
                <Text
                  style={{
                    color: theme.colors.textSecondary, fontSize: 12, marginBottom: 10,
                    paddingHorizontal: 4, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5,
                  }}
                >
                  Task Actions
                </Text>

                {/* Edit */}
                <TouchableOpacity
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 12,
                    paddingVertical: 14, paddingHorizontal: 10, borderRadius: 12,
                    backgroundColor: theme.colors.muted100, marginBottom: 8,
                  }}
                  onPress={() => { setActionsOpen(false); handleUpdate(); }}
                >
                  <Edit3 size={18} color={theme.colors.primary} />
                  <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: "600" }}>Edit Task</Text>
                </TouchableOpacity>

                {/* Delete */}
                <TouchableOpacity
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 12,
                    paddingVertical: 14, paddingHorizontal: 10, borderRadius: 12,
                    marginBottom: 8,
                  }}
                  onPress={() => {
                    Alert.alert(
                      "Delete Task",
                      "Are you sure? This cannot be undone.",
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: deleting ? "Deleting…" : "Delete", style: "destructive", onPress: confirmDelete },
                      ]
                    );
                  }}
                >
                  <Trash2 size={18} color={theme.colors.error} />
                  <Text style={{ color: theme.colors.error, fontSize: 15, fontWeight: "600" }}>Delete Task</Text>
                </TouchableOpacity>

                {/* Cancel */}
                <TouchableOpacity
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 12,
                    paddingVertical: 14, paddingHorizontal: 10, borderRadius: 12,
                  }}
                  onPress={() => setActionsOpen(false)}
                >
                  <X size={18} color={theme.colors.textSecondary} />
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 15, fontWeight: "600" }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default TaskDetailsList;
