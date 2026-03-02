// src/Screens/HomeScreen.jsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
<<<<<<< HEAD
  RefreshControl,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
=======
  Modal,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import AsyncStorage from "@react-native-async-storage/async-storage";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import LinearGradient from "react-native-linear-gradient";
>>>>>>> f012798c2d8a64d738e7f62bf4a0d13e0cf411e2
import TopNavbar from "../Components/Common/Topnavbar";
import HomeCards from "../Components/Common/HomeCards";
import { useTheme } from "../Themes/ThemeContext";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Zap,
  AlarmClock,
  Users,
  CalendarCheck,
  ChevronRight,
  Star,
  Target,
  Activity,
  Flame,
  BarChart3,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Mock data ───────────────────────────────────────────────────────────────
const TODAY_TASKS = [
  { id: "t1", title: "Review Client CRM Data", priority: "high", done: true, time: "9:00 AM" },
  { id: "t2", title: "Prepare Q3 Presentation", priority: "high", done: false, time: "11:00 AM" },
  { id: "t3", title: "Team Sync with Design", priority: "medium", done: false, time: "2:00 PM" },
  { id: "t4", title: "Update Sprint Board", priority: "low", done: false, time: "4:00 PM" },
];

const RECENT_ACTIVITY = [
  { id: "a1", type: "task", action: "Task completed", desc: "Sprint Planning finalized", time: "10 min ago", iconColor: "#2ECC71" },
  { id: "a2", type: "project", action: "Project updated", desc: "Website Redesign — new milestone", time: "25 min ago", iconColor: "#6366F1" },
  { id: "a3", type: "meeting", action: "Meeting scheduled", desc: "Stakeholder Review at 3 PM", time: "1 hr ago", iconColor: "#FF6B6B" },
  { id: "a4", type: "task", action: "Comment added", desc: "CRM Integration feedback shared", time: "2 hr ago", iconColor: "#FFA500" },
];

const UPCOMING_MEETINGS = [
  { id: "m1", title: "Design Review", time: "11:00 AM", duration: "30 min", participants: 4, color: "#6366F1" },
  { id: "m2", title: "Stakeholder Sync", time: "3:00 PM", duration: "1 hr", participants: 7, color: "#FF6B6B" },
];

const QUICK_ACTIONS = [
  { id: "project", label: "New Project", icon: Briefcase, screen: "ProjectsList", color: "#6366F1", bg: "#6366F120" },
  { id: "task", label: "Add Task", icon: CheckCircle2, screen: "AddTask", color: "#2ECC71", bg: "#2ECC7120" },
  { id: "meeting", label: "Schedule", icon: AlarmClock, screen: "MeetingDetailsList", color: "#FF6B6B", bg: "#FF6B6B20" },
  { id: "event", label: "New Event", icon: CalendarCheck, screen: "EventDetailsList", color: "#FFA500", bg: "#FFA50020" },
];

const PRIORITY_COLOR = { high: "#E74C3C", medium: "#FFA500", low: "#2ECC71" };
const PRIORITY_BG = { high: "#E74C3C15", medium: "#FFA50015", low: "#2ECC7115" };

// ─── Sub-components ──────────────────────────────────────────────────────────

const SectionHeader = ({ title, subtitle, onSeeAll, theme }) => (
  <View style={sh.row}>
    <View>
      <Text style={[sh.title, { color: theme.colors.text }]}>{title}</Text>
      {subtitle ? <Text style={[sh.sub, { color: theme.colors.textSecondary }]}>{subtitle}</Text> : null}
    </View>
    {onSeeAll && (
      <TouchableOpacity onPress={onSeeAll} style={sh.seeAllBtn} activeOpacity={0.7}>
        <Text style={[sh.seeAll, { color: theme.colors.primary }]}>See all</Text>
        <ChevronRight size={14} color={theme.colors.primary} />
      </TouchableOpacity>
    )}
  </View>
);
const sh = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  title: { fontSize: 16, fontWeight: "800", letterSpacing: -0.2 },
  sub: { fontSize: 12, marginTop: 1 },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAll: { fontSize: 13, fontWeight: "600" },
});

// ─── Animated Progress Bar ────────────────────────────────────────────────────
const ProgressBar = ({ progress, color, trackColor }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: progress, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [progress]);
  return (
    <View style={[pb.track, { backgroundColor: trackColor }]}>
      <Animated.View style={[pb.fill, { backgroundColor: color, width: anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} />
    </View>
  );
};
const pb = StyleSheet.create({
  track: { height: 6, borderRadius: 99, overflow: "hidden", flex: 1 },
  fill: { height: "100%", borderRadius: 99 },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
const HomeScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
<<<<<<< HEAD
  const [tasks, setTasks] = useState(TODAY_TASKS);
=======
  const [userInfo, setUserInfo] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [animX, setAnimX] = useState(new Animated.Value(0));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

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
>>>>>>> f012798c2d8a64d738e7f62bf4a0d13e0cf411e2

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  const toggleTask = (id) => setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t));

  const completedCount = tasks.filter((t) => t.done).length;
  const completionRate = tasks.length ? completedCount / tasks.length : 0;

  const s = stylesFactory(theme, isDark);

  return (
    <SafeAreaView style={[s.container]} edges={["bottom"]}>
      <TopNavbar navigation={navigation} />

<<<<<<< HEAD
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── HomeCards (Project / Task / Meeting / Event counts) ── */}
          <View style={s.homeCardsWrapper}>
            <HomeCards navigation={navigation} />
          </View>

          {/* ── Quick Actions ── */}
          <View style={s.section}>
            <SectionHeader title="Quick Actions" theme={theme} />
            <View style={s.quickRow}>
              {QUICK_ACTIONS.map((qa) => {
                const Icon = qa.icon;
                return (
                  <TouchableOpacity
                    key={qa.id}
                    style={[s.quickCard, { backgroundColor: isDark ? theme.colors.card : "#FFFFFF" }]}
                    onPress={() => navigation.navigate(qa.screen)}
                    activeOpacity={0.75}
                  >
                    <View style={[s.quickIcon, { backgroundColor: qa.bg }]}>
                      <Icon size={20} color={qa.color} />
                    </View>
                    <Text style={[s.quickLabel, { color: theme.colors.text }]}>{qa.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Today's Overview Stats ── */}
          <View style={s.section}>
            <SectionHeader title="Today's Overview" subtitle="Your daily work snapshot" theme={theme} />
            <View style={s.statsRow}>
              <StatCard icon={Target} label="Tasks Done" value={`${completedCount}/${tasks.length}`} color="#6366F1" bg={isDark ? "#6366F120" : "#EEF2FF"} theme={theme} />
              <StatCard icon={Flame} label="Streak" value="7 days" color="#F97316" bg={isDark ? "#F9731620" : "#FFF7ED"} theme={theme} />
              <StatCard icon={BarChart3} label="Progress" value="68%" color="#2ECC71" bg={isDark ? "#2ECC7120" : "#F0FDF4"} theme={theme} />
            </View>
          </View>

          {/* ── Today's Progress ── */}
          <View style={s.section}>
            <SectionHeader title="Today's Tasks" subtitle={`${completedCount} of ${tasks.length} completed`} onSeeAll={() => navigation.navigate("AddTask")} theme={theme} />

            {/* Progress Overview */}
            <View style={[s.progressCard, { backgroundColor: isDark ? theme.colors.card : "#FFFFFF" }]}>
              <View style={s.progressHeader}>
                <View>
                  <Text style={[s.progressPct, { color: theme.colors.primary }]}>{Math.round(completionRate * 100)}%</Text>
                  <Text style={[s.progressSub, { color: theme.colors.textSecondary }]}>tasks complete</Text>
                </View>
                <View style={s.streakBadge}>
                  <Zap size={14} color="#F97316" />
                  <Text style={s.streakText}>On fire!</Text>
=======
      {loading ? (
        <ShimmerLoading />
      ) : (
        <Animated.View
          style={[{
            flex: 1,
            transform: [
              { translateX: Animated.add(
                animX,
                swipeAnim.interpolate({
                  inputRange: [-200, 0, 200],
                  outputRange: [-20, 0, 20],
                  extrapolate: 'clamp',
                })
              ) }
            ],
            opacity: swipeAnim.interpolate({
              inputRange: [-200, 0, 200],
              outputRange: [0.8, 1, 0.8],
              extrapolate: 'clamp',
            }),
          }]}
          {...panResponder.panHandlers}
        >
          {!category && (
            <View>
              {/* Date Picker Modal (Native Picker Only) */}
              <Modal
                visible={showDatePicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display={Platform.OS === 'android' ? 'calendar' : 'inline'}
                    onChange={(event, date) => {
                      if (Platform.OS === 'android' && event?.type === 'dismissed') {
                        setShowDatePicker(false);
                        return;
                      }
                      if (date) {
                        setTempDate(date);
                        setSelectedDate(date);
                        setShowDatePicker(false);
                      }
                    }}
                  />
                </View>
              </Modal>

              <View style={styles.dateStrip}>
                <DateSelector
                  selectedDateId={formatDateISO(selectedDate)}
                  onRequestPickDate={() => { setTempDate(selectedDate); setShowDatePicker(true); }}
                  onDateChange={(id) => {
                    if (!id) { setSelectedDate(new Date()); return; }
                    try { setSelectedDate(new Date(id)); } catch { setSelectedDate(new Date()); }
                  }}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Focus Today</Text>
                <View style={styles.cardBox}>
                  <Text style={styles.cardTitleText}>Review Client CRM Data</Text>
                  <View style={{ height: 8 }} />
                  <Text style={styles.cardSubText}>Prepare Q3 Presentation Draft</Text>
>>>>>>> f012798c2d8a64d738e7f62bf4a0d13e0cf411e2
                </View>
              </View>
              <View style={s.progressBarRow}>
                <ProgressBar progress={completionRate} color={theme.colors.primary} trackColor={isDark ? "#2D2D3D" : "#F0F0F0"} />
              </View>
            </View>

            {/* Task List */}
            {tasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[s.taskRow, { backgroundColor: isDark ? theme.colors.card : "#FFFFFF" }]}
                onPress={() => toggleTask(task.id)}
                activeOpacity={0.8}
              >
                <View style={[s.taskCheck, { borderColor: task.done ? theme.colors.primary : theme.colors.border, backgroundColor: task.done ? theme.colors.primary : "transparent" }]}>
                  {task.done && <CheckCircle2 size={14} color="#FFF" />}
                </View>
                <View style={s.taskMid}>
                  <Text style={[s.taskTitle, { color: theme.colors.text, textDecorationLine: task.done ? "line-through" : "none", opacity: task.done ? 0.5 : 1 }]} numberOfLines={1}>{task.title}</Text>
                  <View style={s.taskMeta}>
                    <Clock size={11} color={theme.colors.textSecondary} />
                    <Text style={[s.taskTime, { color: theme.colors.textSecondary }]}>{task.time}</Text>
                  </View>
                </View>
                <View style={[s.priorityTag, { backgroundColor: PRIORITY_BG[task.priority] }]}>
                  <Text style={[s.priorityText, { color: PRIORITY_COLOR[task.priority] }]}>{task.priority}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Upcoming Meetings ── */}
          <View style={s.section}>
            <SectionHeader title="Upcoming Meetings" subtitle="Today's schedule" onSeeAll={() => navigation.navigate("MeetingDetailsList")} theme={theme} />
            {UPCOMING_MEETINGS.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[s.meetingCard, { backgroundColor: isDark ? theme.colors.card : "#FFFFFF" }]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate("MeetingDetailsList")}
              >
                <View style={[s.meetingAccent, { backgroundColor: m.color }]} />
                <View style={s.meetingInfo}>
                  <Text style={[s.meetingTitle, { color: theme.colors.text }]}>{m.title}</Text>
                  <View style={s.meetingMeta}>
                    <Clock size={12} color={theme.colors.textSecondary} />
                    <Text style={[s.meetingTime, { color: theme.colors.textSecondary }]}>{m.time} · {m.duration}</Text>
                    <Users size={12} color={theme.colors.textSecondary} style={{ marginLeft: 8 }} />
                    <Text style={[s.meetingTime, { color: theme.colors.textSecondary }]}>{m.participants}</Text>
                  </View>
                </View>
                <View style={[s.joinBtn, { backgroundColor: `${m.color}18`, borderColor: `${m.color}40` }]}>
                  <Text style={[s.joinText, { color: m.color }]}>Join</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Project Highlights ── */}
          <View style={s.section}>
            <SectionHeader title="Active Projects" subtitle="In-progress highlights" onSeeAll={() => navigation.navigate("ProjectsList")} theme={theme} />
            <ProjectCard name="Website Redesign" progress={0.72} daysLeft={16} color="#6366F1" members={3} theme={theme} isDark={isDark} />
            <ProjectCard name="Mobile App Dev" progress={0.35} daysLeft={33} color="#FF6B6B" members={2} theme={theme} isDark={isDark} />
          </View>

          {/* ── Recent Activity ── */}
          <View style={s.section}>
            <SectionHeader title="Recent Activity" subtitle="What's happening" theme={theme} />
            {RECENT_ACTIVITY.map((item) => (
              <View key={item.id} style={[s.activityRow, { backgroundColor: isDark ? theme.colors.card : "#FFFFFF" }]}>
                <View style={[s.activityDot, { backgroundColor: `${item.iconColor}22` }]}>
                  <Activity size={14} color={item.iconColor} />
                </View>
                <View style={s.activityBody}>
                  <Text style={[s.activityAction, { color: theme.colors.text }]}>{item.action}</Text>
                  <Text style={[s.activityDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>{item.desc}</Text>
                </View>
                <Text style={[s.activityTime, { color: theme.colors.textMuted }]}>{item.time}</Text>
              </View>
            ))}
          </View>

          {/* ── Productivity Tip ── */}
          <View style={s.section}>
            <View style={[s.tipCard, { backgroundColor: theme.colors.primary }]}>
              <View style={s.tipIconWrap}>
                <Star size={20} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.tipTitle}>Productivity Tip</Text>
                <Text style={s.tipBody}>Focus on your top 3 tasks each morning. Completing them gives momentum for the rest of the day.</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 24 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── ProjectCard helper ───────────────────────────────────────────────────────
const ProjectCard = ({ name, progress, daysLeft, color, members, theme, isDark }) => (
  <View style={[pc.card, { backgroundColor: isDark ? theme.colors.card : "#FFFFFF" }]}>
    <View style={pc.top}>
      <View style={[pc.dot, { backgroundColor: `${color}25` }]}>
        <Briefcase size={14} color={color} />
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={[pc.name, { color: theme.colors.text }]} numberOfLines={1}>{name}</Text>
        <Text style={[pc.meta, { color: theme.colors.textSecondary }]}>{members} members · {daysLeft} days left</Text>
      </View>
      <Text style={[pc.pct, { color: color }]}>{Math.round(progress * 100)}%</Text>
    </View>
    <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
      <ProgressBar progress={progress} color={color} trackColor={isDark ? "#2D2D3D" : "#F0F0F0"} />
    </View>
  </View>
);
const pc = StyleSheet.create({
  card: { borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  top: { flexDirection: "row", alignItems: "center" },
  dot: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 14, fontWeight: "700" },
  meta: { fontSize: 12, marginTop: 2 },
  pct: { fontSize: 15, fontWeight: "800", marginLeft: 8 },
});

// ─── StatCard helper ──────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, bg, theme }) => (
  <View style={[sc.card, { backgroundColor: bg }]}>
    <View style={[sc.iconWrap, { backgroundColor: `${color}22` }]}>
      <Icon size={16} color={color} />
    </View>
    <Text style={[sc.value, { color: theme.colors.text }]}>{value}</Text>
    <Text style={[sc.label, { color: theme.colors.textSecondary }]}>{label}</Text>
  </View>
);
const sc = StyleSheet.create({
  card: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", marginHorizontal: 4 },
  iconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  value: { fontSize: 16, fontWeight: "800" },
  label: { fontSize: 11, marginTop: 2, textAlign: "center" },
});

export default HomeScreen;

<<<<<<< HEAD
// ─── Styles ───────────────────────────────────────────────────────────────────
const stylesFactory = (theme, isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? theme.colors.background : "#F4F6FA",
    },
    scrollContent: {
      paddingBottom: 20,
    },
    homeCardsWrapper: {
      marginBottom: 4,
    },

    // Section
    section: {
      paddingHorizontal: 16,
      marginTop: 20,
    },

    // Quick Actions
    quickRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    quickCard: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    quickIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    quickLabel: {
      fontSize: 11,
      fontWeight: "700",
    },

    // Stats
    statsRow: {
      flexDirection: "row",
      marginHorizontal: -4,
    },

    // Progress card
    progressCard: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    progressPct: {
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -1,
    },
    progressSub: {
      fontSize: 12,
      marginTop: 2,
    },
    progressBarRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    streakBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFF7ED",
      borderRadius: 99,
      paddingHorizontal: 10,
      paddingVertical: 4,
      gap: 4,
    },
    streakText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#F97316",
    },

    // Task rows
    taskRow: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 14,
      padding: 12,
      marginBottom: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
      gap: 10,
    },
    taskCheck: {
      width: 24,
      height: 24,
      borderRadius: 7,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    taskMid: {
      flex: 1,
    },
    taskTitle: {
      fontSize: 14,
      fontWeight: "600",
    },
    taskMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 3,
    },
    taskTime: {
      fontSize: 11,
    },
    priorityTag: {
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    priorityText: {
      fontSize: 10,
      fontWeight: "700",
      textTransform: "capitalize",
    },

    // Meetings
    meetingCard: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 14,
      marginBottom: 8,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    meetingAccent: {
      width: 5,
      alignSelf: "stretch",
    },
    meetingInfo: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    meetingTitle: {
      fontSize: 14,
      fontWeight: "700",
    },
    meetingMeta: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
      gap: 4,
    },
    meetingTime: {
      fontSize: 12,
    },
    joinBtn: {
      marginRight: 12,
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    joinText: {
      fontSize: 12,
      fontWeight: "700",
    },

    // Activity
    activityRow: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 14,
      padding: 12,
      marginBottom: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
      gap: 10,
    },
    activityDot: {
      width: 36,
      height: 36,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },
    activityBody: {
      flex: 1,
    },
    activityAction: {
      fontSize: 13,
      fontWeight: "700",
    },
    activityDesc: {
      fontSize: 12,
      marginTop: 2,
    },
    activityTime: {
      fontSize: 11,
    },

    // Tip card
    tipCard: {
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    tipIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    tipTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: "#FFF",
      marginBottom: 4,
    },
    tipBody: {
      fontSize: 12,
      color: "rgba(255,255,255,0.85)",
      lineHeight: 17,
    },
  });
=======
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalActions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
>>>>>>> f012798c2d8a64d738e7f62bf4a0d13e0cf411e2
