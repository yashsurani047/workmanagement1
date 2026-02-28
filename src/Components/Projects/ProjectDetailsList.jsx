// src/Components/Projects/ProjectDetailsList.jsx
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  RefreshControl,
  Animated,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Image,
  ActivityIndicator,
  Easing,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
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
  FolderOpen,
} from "lucide-react-native";
import { useTheme } from "../../Themes/ThemeContext";
import { BASE_URL } from "../../Config/api.jsx";
import { getUserProfile } from "../../Services/Common/authServices";
import {
  fetchProjectAssigneesAPI,
  deleteProjectApi,
} from "../../Services/Project/fetchProjects";

/* ──────────────────── helpers ──────────────────── */

const buildDisplayName = (a) => {
  if (!a) return "User";
  const full = a.full_name || a.name;
  if (full && typeof full === "string") return full;
  const uname = a.user_name || a.username || a.user || "";
  if (uname) {
    return uname
      .replace(/[._-]+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  }
  const email = a.user_primary_email_id || a.email || "";
  if (email && typeof email === "string") {
    const local = email.split("@")[0] || "";
    const cleaned = local.replace(/[._-]+/g, " ").trim();
    if (cleaned)
      return cleaned
        .split(" ")
        .filter(Boolean)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");
  }
  return String(a.user_id || a.id || "User").slice(0, 12);
};

const buildAvatarUri = (val) => {
  if (!val || typeof val !== "string") return null;
  if (val.startsWith("data:")) return val;
  if (val.startsWith("http://") || val.startsWith("https://")) return val;
  if (val.length > 200) return `data:image/png;base64,${val}`;
  const base = (BASE_URL || "").replace(/\/$/, "");
  return `${base}/${val.replace(/^\//, "")}`;
};

const resolvePhotoFromUser = (u) => {
  if (!u || typeof u !== "object") return null;
  const fields = [
    "profile_photo", "avatar", "photo_url", "profile_pic", "photo",
    "profile_image", "avatar_url", "image_url", "image", "picture", "profilePic",
  ];
  for (const f of fields) {
    if (u[f]) return buildAvatarUri(String(u[f]));
  }
  return null;
};

const extractPhotoFromProfile = (data) => {
  if (!data || typeof data !== "object") return null;
  const fields = [
    "profile_photo", "avatar", "photo_url", "profile_pic", "photo",
    "profile_image", "avatar_url", "image_url", "image", "picture", "profilePic",
  ];
  for (const f of fields) {
    if (data[f]) return buildAvatarUri(String(data[f]));
  }
  return null;
};

const formatDate = (iso) => {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch { return null; }
};


/* ──────────────────── Animated Project Card ──────────────────── */

const PRIORITY_COLORS = {
  high: "#EF4444",
  medium: "#F59E0B",
  low: "#10B981",
  urgent: "#DC2626",
  critical: "#B91C1C",
};

const STATUS_CONFIG = {
  "in progress": { label: "In Progress", icon: "⚡" },
  approved: { label: "Approved", icon: "✓" },
  completed: { label: "Completed", icon: "✓" },
  pending: { label: "Pending", icon: "⏳" },
  "on hold": { label: "On Hold", icon: "⏸" },
  cancelled: { label: "Cancelled", icon: "✕" },
  "not started": { label: "Not Started", icon: "○" },
};

const ProjectCard = ({ project, onPress, onMore, isCreator, theme, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const profileCacheRef = useRef({});

  useEffect(() => {
    const delay = Math.min(index * 80, 400);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const statusColors = {
    "in progress": theme.colors.secondary,
    approved: theme.colors.success,
    completed: theme.colors.primary,
    pending: "#F59E0B",
    "on hold": theme.colors.textSecondary,
    cancelled: theme.colors.error,
    "not started": theme.colors.gray,
  };

  const title = project.name || "Untitled Project";
  const status = (project.status || "in progress").toLowerCase();
  const statusColor = statusColors[status] || theme.colors.primary;
  const statusCfg = STATUS_CONFIG[status] || { label: status, icon: "●" };
  const priority = (project.priority || "").toLowerCase();
  const priorityColor = PRIORITY_COLORS[priority] || null;
  const description = project.description || "";
  const dueDate = project.dueDate || project.due_date || project.end_date;

  const [assignees, setAssignees] = useState([]);

  // Progress simulation based on status
  const progressMap = {
    "not started": 0,
    pending: 0.1,
    "in progress": 0.55,
    approved: 0.85,
    completed: 1.0,
    "on hold": 0.35,
    cancelled: 0,
  };
  const progress = progressMap[status] || 0.3;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 900,
      delay: Math.min(index * 80, 400) + 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, index]);

  useEffect(() => {
    let mounted = true;
    const loadAssignees = async () => {
      try {
        const projectId = project?.id || project?._id || project?.project_id;
        if (!projectId) return;
        let token = await AsyncStorage.getItem("userToken");
        if (!token) {
          const ui = await AsyncStorage.getItem("userInfo");
          token = ui ? JSON.parse(ui)?.token : null;
        }
        const res = await fetchProjectAssigneesAPI({ projectId, token });
        if (mounted && res.success) {
          const list = Array.isArray(res.data) ? res.data : [];
          let mapped = list.map((a) => ({
            id: a.user_id || a.id || a._id,
            name: buildDisplayName(a),
            photo: resolvePhotoFromUser(a),
          }));
          setAssignees(mapped);
          const enriched = await Promise.all(
            mapped.map(async (m) => {
              if (m.photo) return m;
              if (!m.id) return m;
              const cache = profileCacheRef.current;
              if (cache[m.id]) return { ...m, photo: cache[m.id] };
              try {
                const prof = await getUserProfile(m.id);
                if (prof?.success && prof?.data) {
                  const photo = extractPhotoFromProfile(prof.data);
                  if (photo) { cache[m.id] = photo; return { ...m, photo }; }
                }
              } catch { }
              return m;
            })
          );
          if (mounted) setAssignees(enriched);
        }
      } catch { }
    };
    loadAssignees();
    return () => { mounted = false; };
  }, [project]);

  const members = (() => {
    if (assignees.length > 0) return assignees;
    const pm = Array.isArray(project.members) ? project.members : [];
    return pm.map((m) =>
      typeof m === "string"
        ? { name: m, photo: null }
        : { name: buildDisplayName(m), photo: resolvePhotoFromUser(m) }
    );
  })();

  const avatarColors = ["#6366F1", "#EC4899", "#14B8A6", "#F59E0B", "#8B5CF6", "#EF4444"];

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        onPress={() => onPress(project)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={{
          backgroundColor: theme.colors.card,
          borderRadius: 20,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
          shadowOpacity: 0.1,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
        }}
      >
        {/* ─── Top accent bar ─── */}
        <View
          style={{
            height: 4,
            backgroundColor: statusColor,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        />

        <View style={{ padding: 18 }}>
          {/* ─── Row 1: Title + Menu ─── */}
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            {/* Icon container */}
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: `${statusColor}15`,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <FolderOpen size={22} color={statusColor} strokeWidth={1.8} />
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "800",
                    color: theme.colors.text,
                    flex: 1,
                    letterSpacing: -0.3,
                  }}
                  numberOfLines={1}
                >
                  {title}
                </Text>

                {isCreator && onMore && (
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); onMore(project); }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{
                      padding: 6,
                      borderRadius: 10,
                      backgroundColor: theme.colors.muted100,
                      marginLeft: 8,
                    }}
                  >
                    <MoreVertical size={16} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* ─── Status + Priority row ─── */}
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, gap: 8, flexWrap: "wrap" }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 20,
                    backgroundColor: `${statusColor}15`,
                  }}
                >
                  <Text style={{ fontSize: 11, marginRight: 4 }}>{statusCfg.icon}</Text>
                  <Text
                    style={{
                      fontSize: 11.5,
                      fontWeight: "700",
                      color: statusColor,
                      letterSpacing: 0.2,
                    }}
                  >
                    {statusCfg.label}
                  </Text>
                </View>

                {priorityColor && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 20,
                      backgroundColor: `${priorityColor}12`,
                    }}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: priorityColor,
                        marginRight: 5,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: priorityColor,
                        textTransform: "capitalize",
                      }}
                    >
                      {priority}
                    </Text>
                  </View>
                )}

                {dueDate && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 20,
                      backgroundColor: theme.colors.muted100,
                    }}
                  >
                    <CalendarDays size={11} color={theme.colors.textSecondary} />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: theme.colors.textSecondary,
                        marginLeft: 4,
                      }}
                    >
                      {formatDate(dueDate)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* ─── Description ─── */}
          {!!description && (
            <Text
              style={{
                fontSize: 13.5,
                color: theme.colors.textSecondary,
                marginTop: 12,
                lineHeight: 19,
                letterSpacing: 0.1,
              }}
              numberOfLines={2}
            >
              {description}
            </Text>
          )}

          {/* ─── Progress bar ─── */}
          <View style={{ marginTop: 16 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 11.5,
                  fontWeight: "600",
                  color: theme.colors.textSecondary,
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                }}
              >
                Progress
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: statusColor,
                }}
              >
                {Math.round(progress * 100)}%
              </Text>
            </View>
            <View
              style={{
                height: 5,
                borderRadius: 3,
                backgroundColor: theme.colors.muted100,
                overflow: "hidden",
              }}
            >
              <Animated.View
                style={{
                  height: "100%",
                  borderRadius: 3,
                  backgroundColor: statusColor,
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                }}
              />
            </View>
          </View>

          {/* ─── Divider ─── */}
          <View
            style={{
              height: 1,
              backgroundColor: theme.colors.borderMuted,
              marginVertical: 14,
            }}
          />

          {/* ─── Bottom row: Avatars + Arrow ─── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Avatar stack */}
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <View style={{ flexDirection: "row" }}>
                {members.slice(0, 5).map((m, idx) => {
                  const bg = avatarColors[idx % avatarColors.length];
                  const initials = (m?.name || "")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <View
                      key={idx}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        justifyContent: "center",
                        alignItems: "center",
                        marginLeft: idx === 0 ? 0 : -8,
                        borderWidth: 2.5,
                        borderColor: theme.colors.card,
                        overflow: "hidden",
                        backgroundColor: bg,
                      }}
                    >
                      {m?.photo ? (
                        <Image
                          source={{ uri: m.photo }}
                          style={{ width: "100%", height: "100%", borderRadius: 16 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontWeight: "800",
                            fontSize: 10,
                          }}
                        >
                          {initials || "U"}
                        </Text>
                      )}
                    </View>
                  );
                })}
                {members.length > 5 && (
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      justifyContent: "center",
                      alignItems: "center",
                      marginLeft: -8,
                      borderWidth: 2.5,
                      borderColor: theme.colors.card,
                      backgroundColor: theme.colors.muted200,
                    }}
                  >
                    <Text
                      style={{
                        color: theme.colors.text,
                        fontWeight: "800",
                        fontSize: 10,
                      }}
                    >
                      +{members.length - 5}
                    </Text>
                  </View>
                )}
              </View>

              {members.length > 0 && (
                <View style={{ marginLeft: 10, flexDirection: "row", alignItems: "center" }}>
                  <Users size={12} color={theme.colors.textSecondary} />
                  <Text
                    style={{
                      fontSize: 11.5,
                      color: theme.colors.textSecondary,
                      fontWeight: "600",
                      marginLeft: 4,
                    }}
                  >
                    {members.length}
                  </Text>
                </View>
              )}
            </View>

            {/* Navigate arrow */}
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                backgroundColor: `${theme.colors.primary}10`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronRight size={16} color={theme.colors.primary} strokeWidth={2.5} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ──────────────────── Shimmer Card ──────────────────── */

const ShimmerProjectCard = ({ theme, index }) => {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 300,
      delay: index * 60,
      useNativeDriver: true,
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
        width: w,
        height: h,
        borderRadius: r,
        backgroundColor: theme.colors.muted200,
        marginTop: mt,
        opacity: pulseAnim,
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
        paddingVertical: 60,
        paddingHorizontal: 32,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          backgroundColor: `${theme.colors.primary}12`,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Sparkles size={36} color={theme.colors.primary} strokeWidth={1.5} />
      </View>
      <Text
        style={{
          fontSize: 19,
          fontWeight: "800",
          color: theme.colors.text,
          marginBottom: 8,
          letterSpacing: -0.3,
        }}
      >
        No projects yet
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: theme.colors.textSecondary,
          textAlign: "center",
          lineHeight: 21,
        }}
      >
        Create your first project and start organizing your work beautifully.
      </Text>
    </Animated.View>
  );
};

/* ──────────────────── Summary Stats Row ──────────────────── */

const StatsRow = ({ data, theme }) => {
  const total = data.length;
  const completed = data.filter((p) => (p.status || "").toLowerCase() === "completed").length;
  const inProgress = data.filter((p) => (p.status || "").toLowerCase() === "in progress").length;

  if (total === 0) return null;

  return (
    <View
      style={{
        flexDirection: "row",
        paddingHorizontal: 20,
        marginBottom: 14,
        gap: 10,
      }}
    >
      {[
        { label: "Total", value: total, color: theme.colors.primary, icon: FolderOpen },
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
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: stat.color,
              marginTop: 4,
            }}
          >
            {stat.value}
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: theme.colors.textSecondary,
              marginTop: 2,
              textTransform: "uppercase",
              letterSpacing: 0.5,
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

const CardDetailsList = ({
  items = [],
  onItemPress,
  onRefresh,
  navigation: navProp,
}) => {
  const { theme } = useTheme();
  const navigation = navProp || useNavigation();
  const [data, setData] = useState(items);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [actionsProject, setActionsProject] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const ui = await AsyncStorage.getItem("userInfo");
        if (ui) {
          const p = JSON.parse(ui);
          setCurrentUserId(p.id || p.user_id || p._id);
        }
      } catch { }
    })();
  }, []);

  useEffect(() => {
    setData(items);
    setLoading(items?.length === 0);
  }, [items]);

  const isCurrentUserCreator = (project) => {
    if (!currentUserId || !project) return false;
    const cid =
      project.assigned_by_user_id ||
      project.created_by_user_id ||
      project.creator_user_id;
    return cid && cid.toString() === currentUserId.toString();
  };

  const displayed = useMemo(() => {
    let list = Array.isArray(data) ? data : [];
    if (statusFilter !== "all")
      list = list.filter(
        (p) => (p.status || "").toLowerCase() === statusFilter
      );
    if (priorityFilter !== "all")
      list = list.filter(
        (p) =>
          (p.priority || "").toLowerCase() === priorityFilter.toLowerCase()
      );
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) =>
          (p.name || p.title || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, statusFilter, priorityFilter, query]);

  const handleDelete = async (project) => {
    const projectId = project?.id || project?._id;
    if (!projectId) return Alert.alert("Error", "Missing project ID");
    Alert.alert(
      "Delete Project",
      "This action cannot be undone. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const res = await deleteProjectApi(projectId);
            if (res?.success) {
              setData((prev) =>
                prev.filter((p) => (p.id || p._id) !== projectId)
              );
            } else Alert.alert("Error", res?.message || "Failed");
          },
        },
      ]
    );
  };

  const handleMore = (project) => {
    if (isCurrentUserCreator(project)) {
      setActionsProject(project);
      setActionsOpen(true);
    }
  };

  const handleUpdate = () => {
    if (!actionsProject) return;
    const params = {
      mode: "edit",
      project: actionsProject,
      projectId: actionsProject.id || actionsProject._id,
    };
    (navigation?.getParent?.() || navigation)?.navigate(
      "CreateProject",
      params
    );
    setActionsOpen(false);
  };

  const handleItemPress = (item) => {
    if (onItemPress) return onItemPress(item);
    const projectId = item?.id || item?._id;
    (navigation?.getParent?.() || navigation)?.navigate("ProjectDetails", {
      projectId,
      project: item,
    });
  };

  const statusOptions = [
    "all", "in progress", "approved", "completed", "pending", "on hold", "cancelled",
  ];
  const priorityOptions = ["all", "high", "medium", "low"];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>

      {/* ─── Header ─── */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 10,
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 26,
              fontWeight: "900",
              color: theme.colors.text,
              letterSpacing: -0.5,
            }}
          >
            Projects
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: theme.colors.textSecondary,
              marginTop: 2,
              fontWeight: "500",
            }}
          >
            {displayed.length} project{displayed.length !== 1 ? "s" : ""} found
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              backgroundColor: theme.colors.muted100,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
            onPress={() => setFilterOpen(true)}
          >
            <Filter size={18} color={theme.colors.primary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              backgroundColor: theme.colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => navigation.navigate("CreateProject")}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── List ─── */}
      <FlatList
        data={
          loading
            ? Array(5)
              .fill(null)
              .map((_, i) => ({ __shimmer: true, id: `s-${i}` }))
            : displayed
        }
        renderItem={({ item, index }) =>
          item?.__shimmer ? (
            <ShimmerProjectCard theme={theme} index={index} />
          ) : (
            <ProjectCard
              project={item}
              onPress={handleItemPress}
              onMore={handleMore}
              isCreator={isCurrentUserCreator(item)}
              theme={theme}
              index={index}
            />
          )
        }
        keyExtractor={(item, i) => item.id || item._id || i.toString()}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: 40,
        }}
        ListHeaderComponent={
          !loading && displayed.length > 0 ? (
            <StatsRow data={displayed} theme={theme} />
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListEmptyComponent={
          !loading ? <EmptyState theme={theme} /> : null
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={
              onRefresh
                ? async () => {
                  setRefreshing(true);
                  await onRefresh();
                  setRefreshing(false);
                }
                : null
            }
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />

      {/* ─── Filter Modal ─── */}
      <Modal
        visible={filterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setFilterOpen(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.overlay,
              justifyContent: "flex-end",
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: theme.colors.card,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  paddingHorizontal: 20,
                  paddingTop: 14,
                  paddingBottom: 40,
                }}
              >
                <View
                  style={{
                    height: 5,
                    width: 44,
                    backgroundColor: theme.colors.border,
                    alignSelf: "center",
                    borderRadius: 3,
                    marginBottom: 20,
                  }}
                />
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "800",
                    color: theme.colors.text,
                    marginBottom: 20,
                    letterSpacing: -0.3,
                  }}
                >
                  Filter Projects
                </Text>

                {/* Search */}
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    marginBottom: 20,
                    backgroundColor: theme.colors.muted100,
                  }}
                >
                  <TextInput
                    placeholder="Search projects…"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={query}
                    onChangeText={setQuery}
                    style={{
                      color: theme.colors.text,
                      fontSize: 15,
                      fontWeight: "500",
                    }}
                  />
                </View>

                {/* Status */}
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: theme.colors.textSecondary,
                    marginBottom: 10,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Status
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 20,
                  }}
                >
                  {statusOptions.map((s) => {
                    const active = statusFilter === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        onPress={() => setStatusFilter(s)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 20,
                          borderWidth: 1.5,
                          borderColor: active
                            ? theme.colors.primary
                            : theme.colors.border,
                          backgroundColor: active
                            ? `${theme.colors.primary}15`
                            : "transparent",
                        }}
                      >
                        <Text
                          style={{
                            color: active
                              ? theme.colors.primary
                              : theme.colors.text,
                            fontWeight: active ? "700" : "500",
                            fontSize: 13,
                            textTransform: "capitalize",
                          }}
                        >
                          {s}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Priority */}
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: theme.colors.textSecondary,
                    marginBottom: 10,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Priority
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 24,
                  }}
                >
                  {priorityOptions.map((p) => {
                    const active =
                      priorityFilter.toLowerCase() === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        onPress={() => setPriorityFilter(p)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 20,
                          borderWidth: 1.5,
                          borderColor: active
                            ? theme.colors.primary
                            : theme.colors.border,
                          backgroundColor: active
                            ? `${theme.colors.primary}15`
                            : "transparent",
                        }}
                      >
                        <Text
                          style={{
                            color: active
                              ? theme.colors.primary
                              : theme.colors.text,
                            fontWeight: active ? "700" : "500",
                            fontSize: 13,
                            textTransform: "capitalize",
                          }}
                        >
                          {p}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Actions */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: theme.colors.border,
                      alignItems: "center",
                    }}
                    onPress={() => {
                      setQuery("");
                      setStatusFilter("all");
                      setPriorityFilter("all");
                    }}
                  >
                    <Text
                      style={{
                        color: theme.colors.text,
                        fontWeight: "700",
                        fontSize: 15,
                      }}
                    >
                      Clear
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 14,
                      backgroundColor: theme.colors.primary,
                      alignItems: "center",
                    }}
                    onPress={() => setFilterOpen(false)}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontWeight: "700",
                        fontSize: 15,
                      }}
                    >
                      Apply
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Actions Modal ─── */}
      <Modal
        visible={actionsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setActionsOpen(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setActionsOpen(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.overlay,
              justifyContent: "flex-end",
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: theme.colors.card,
                  padding: 16,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                }}
              >
                <View
                  style={{
                    height: 5,
                    width: 44,
                    backgroundColor: theme.colors.border,
                    alignSelf: "center",
                    borderRadius: 3,
                    marginBottom: 16,
                  }}
                />
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: 12,
                    marginBottom: 10,
                    paddingHorizontal: 4,
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Project Actions
                </Text>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 10,
                    borderRadius: 12,
                    backgroundColor: theme.colors.muted100,
                    marginBottom: 8,
                  }}
                  onPress={() => {
                    setActionsOpen(false);
                    handleUpdate();
                  }}
                >
                  <Edit3 size={18} color={theme.colors.primary} />
                  <Text
                    style={{
                      color: theme.colors.text,
                      fontSize: 15,
                      fontWeight: "600",
                    }}
                  >
                    Edit Project
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 10,
                    borderRadius: 12,
                    marginBottom: 8,
                  }}
                  onPress={() => {
                    setActionsOpen(false);
                    actionsProject && handleDelete(actionsProject);
                  }}
                >
                  <Trash2 size={18} color={theme.colors.error} />
                  <Text
                    style={{
                      color: theme.colors.error,
                      fontSize: 15,
                      fontWeight: "600",
                    }}
                  >
                    Delete Project
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 10,
                    borderRadius: 12,
                  }}
                  onPress={() => setActionsOpen(false)}
                >
                  <X size={18} color={theme.colors.textSecondary} />
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: 15,
                      fontWeight: "600",
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default CardDetailsList;