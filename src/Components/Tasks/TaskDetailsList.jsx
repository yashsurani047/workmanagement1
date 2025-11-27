import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Alert,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MoreVertical, Plus, Filter, User, Edit3, Trash2, X } from "lucide-react-native";
import theme from "../../Themes/Themes";
import { deletePersonalTask } from "../../Services/Tasks/FetchPersonalTask";

const statusColors = {
  completed: theme.colors.primary,
  in_progress: theme.colors.secondary,
  not_started: theme.colors.textSecondary,
  rejected: theme.colors.error,
  pending: theme.colors.task,
  cancelled: theme.colors.error,
  on_hold: theme.colors.textSecondary,
  archived: theme.colors.textSecondary,
};
const getStatusColor = (status = "") => statusColors[(status || "").toLowerCase()] || theme.colors.primary;

const priorityColors = {
  urgent_important: theme.colors.error,
  urgent_not_important: theme.colors.event || theme.colors.secondary,
  not_urgent_important: theme.colors.success,
  not_urgent_not_important: theme.colors.textSecondary,
  high: theme.colors.error,
  medium: theme.colors.secondary,
  low: theme.colors.success,
};
const getPriorityColor = (p = "") => priorityColors[(p || "").toLowerCase()] || theme.colors.textSecondary;
const formatLabel = (s = "") => String(s).replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const TaskCard = ({ task, onPress, onMenuPress }) => {
  const title = task?.title || "Untitled Task";
  const status = (task?.status || "not_started").toLowerCase();
  const statusColor = getStatusColor(status);
  const createdBy = task?.created_by || "";
  const priority = task?.priority || "medium";
  const collaborators = Array.isArray(task?.collaborators) ? task.collaborators : [];
  const priorityColor = getPriorityColor(priority);
  const dateText =
    task?.start_date && task?.end_date
      ? `${task.start_date} → ${task.end_date}`
      : task?.start_date || task?.end_date || "";
  const attachmentCount = Array.isArray(task?.attachments) ? task.attachments.length : 0;

  return (
    <TouchableOpacity
      style={[styles.card, styles.shadow]}
      onPress={() => onPress?.(task)}
      activeOpacity={0.9}
    >
      <View style={[styles.leftStripe, { backgroundColor: statusColor }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.rightTopRow}>
            <View style={[styles.statusPill, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {status.replace(/\b\w/g, (c) => c.toUpperCase())}
              </Text>
            </View>
            <TouchableOpacity onPress={() => onMenuPress?.(task)} style={styles.headerIconBtn}>
              <MoreVertical size={18} color={theme.colors.text || "#111"} />
            </TouchableOpacity>
          </View>
        </View>
        {!!task?.description && <Text style={styles.desc} numberOfLines={2}>{task.description}</Text>}
        {!!dateText && <Text style={styles.meta}>{dateText}</Text>}
        <View style={styles.bottomRow}>
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
              {createdBy ? `Created by ${createdBy}` : ''}
            </Text>
            {priority && (
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(priority) + '20' }]}>
                <Text style={[styles.priorityText, { color: getPriorityColor(priority) }]}>
                  {formatLabel(priority)}
                </Text>
              </View>
            )}
          </View>
          {/* Collaborators */}
          {collaborators.length > 0 && (
            <View style={styles.collaboratorsContainer}>
              <User size={14} color={theme.colors.textSecondary} style={styles.collaboratorIcon} />
              <Text style={styles.collaboratorsText}>
                {collaborators.length} {collaborators.length === 1 ? 'collaborator' : 'collaborators'}
              </Text>
            </View>
          )}
          {attachmentCount > 0 && (
            <View style={[styles.priorityPill, { backgroundColor: `${theme.colors.textSecondary}20`, marginLeft: 8 }]}>
              <Text style={[styles.priorityText, { color: theme.colors.textSecondary }]}>
                {attachmentCount} {attachmentCount === 1 ? 'Attachment' : 'Attachments'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const TaskDetailsList = ({ items = [], onItemPress, onTaskMenuPress, onRefresh, navigation }) => {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [displayed, setDisplayed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const slideAnim = new Animated.Value(300);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Handle menu press
  const handleMenuPress = (task) => {
    setSelectedTask(task);
    if (onTaskMenuPress) return onTaskMenuPress(task);
    setActionsOpen(true);
  };
  
  // Load tasks
  const loadFromApi = useCallback(async () => {
    try {
      setLoading(true);
      // Add your API call here if needed
      // const result = await fetchTasks();
      // setDisplayed(result.tasks || []);
      setDisplayed(items);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [items]);
  
  // Initialize data
  useEffect(() => {
    loadFromApi();
  }, [loadFromApi]);

  const handleTaskPress = (task) => {
    setSelectedTask(task);
    setShowTaskForm(true);
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    setShowTaskForm(true);
  };

  const handleTaskSaved = (task) => {
    setShowTaskForm(false);
    if (onRefresh) onRefresh();
  };

  const confirmDelete = async () => {
    if (!selectedTask || deleting) return;
    try {
      setDeleting(true);
      const orgId = (await AsyncStorage.getItem("organization_id")) || "one";
      const taskId = selectedTask.personal_task_id || selectedTask.id || selectedTask._id;
      if (!taskId) {
        Alert.alert("Error", "Missing task ID");
        return;
      }
      const res = await deletePersonalTask(orgId, taskId);
      if (res?.success !== false) {
        // Optimistically remove from list
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

  return (
    <View style={{ flex: 1 }}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tasks</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setFilterOpen(true)}
          >
            <Filter size={16} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate("AddTask")}
          >
            <Plus size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* FILTER SHEET */}
      <Modal
        visible={filterOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterOpen(false)}
        onShow={() => {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }}
      >
        <TouchableWithoutFeedback onPress={() => setFilterOpen(false)}>
          <View style={styles.sheetOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.sheetContainer, { transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.sheetGrabber} />
                <Text style={styles.sheetTitle}>Filter Tasks</Text>

                {/* Filter by Name */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="Search by title or description"
                    placeholderTextColor="#6B7280"
                    value={query}
                    onChangeText={setQuery}
                  />
                </View>

                {/* Filter by Status */}
                <Text style={styles.sheetSection}>Filter by Status</Text>
                <View style={styles.filterRow}>
                  {[
                    { label: "All", value: "all" },
                    { label: "Completed", value: "completed" },
                    { label: "In Progress", value: "in_progress" },
                    { label: "Not Started", value: "not_started" },
                    { label: "Pending", value: "pending" },
                    { label: "On Hold", value: "on_hold" },
                    { label: "Rejected", value: "rejected" },
                    { label: "Cancelled", value: "cancelled" },
                    { label: "Archived", value: "archived" },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setStatusFilter(opt.value)}
                      style={[styles.filterPill, statusFilter === opt.value && styles.filterPillActive]}
                    >
                      <Text style={[styles.filterPillText, statusFilter === opt.value && styles.filterPillTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Filter by Priority */}
                <Text style={styles.sheetSection}>Filter by Priority</Text>
                <View style={styles.filterRow}>
                  {[
                    { label: "All", value: "all" },
                    { label: "Urgent & Important", value: "urgent_important" },
                    { label: "Urgent & Not Important", value: "urgent_not_important" },
                    { label: "Not Urgent & Important", value: "not_urgent_important" },
                    { label: "Not Urgent & Not Important", value: "not_urgent_not_important" },
                    { label: "High", value: "high" },
                    { label: "Medium", value: "medium" },
                    { label: "Low", value: "low" },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setPriorityFilter(opt.value)}
                      style={[styles.filterPill, priorityFilter === opt.value && styles.filterPillActive]}
                    >
                      <Text style={[styles.filterPillText, priorityFilter === opt.value && styles.filterPillTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Actions */}
                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    style={styles.clearBtn}
                    onPress={() => {
                      setQuery("");
                      setStatusFilter("all");
                      setPriorityFilter("all");
                    }}
                  >
                    <Text style={styles.clearBtnText}>Clear Filters</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.applyBtn} onPress={() => setFilterOpen(false)}>
                    <Text style={styles.applyBtnText}>Apply Filters</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ACTIONS POPUP */}
      <Modal visible={actionsOpen} transparent animationType="fade" onRequestClose={() => setActionsOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setActionsOpen(false)}>
          <View style={{ flex: 1, backgroundColor: theme.colors.overlayLight || 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback>
              <View style={{ backgroundColor: theme.colors.background, padding: 12, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 8, paddingHorizontal: 4 }}>Task actions</Text>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 8 }}
                  onPress={() => { setActionsOpen(false); navigation && navigation.navigate && navigation.navigate('AddTask', { mode: 'update', task: selectedTask }); }}>
                  <Edit3 size={16} color={theme.colors.text} />
                  <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '500' }}>Edit Task</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 8 }}
                  onPress={() => {
                    Alert.alert(
                      'Delete Task',
                      'Are you sure you want to delete this task? This action cannot be undone.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: deleting ? 'Deleting...' : 'Delete', style: 'destructive', onPress: confirmDelete },
                      ]
                    );
                  }}
                >
                  <Trash2 size={16} color={theme.colors.error} />
                  <Text style={{ color: theme.colors.error, fontSize: 14, fontWeight: '600' }}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 8 }}
                  onPress={() => setActionsOpen(false)}>
                  <X size={16} color={theme.colors.textSecondary} />
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 14, fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* LIST */}
      <FlatList
        data={loading ? Array.from({ length: 6 }).map((_, i) => ({ __shimmer: true, id: `s-${i}` })) : displayed}
        keyExtractor={(item) => String(item.personal_task_id || item.id || Math.random())}
        renderItem={({ item }) => {
          if (item?.__shimmer) return <ShimmerCard />;
          return <TaskCard task={item} onPress={onItemPress} onMenuPress={handleMenuPress} />;
        }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 60 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!loading ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
            <Text style={{ fontSize: 16, color: theme.colors.textSecondary, marginBottom: 8 }}>No tasks found</Text>
            {/* <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginBottom: 16 }}>
              Tap the + icon above to create your first task.
            </Text> */}
            {/* <TouchableOpacity
              style={[styles.headerIconBtn, { paddingHorizontal: 12, paddingVertical: 8 }]}
              onPress={() => navigation.navigate('AddTask')}
            >
              <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Create Task</Text>
            </TouchableOpacity> */}
          </View>
        ) : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadFromApi();
              setRefreshing(false);
            }}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />
    </View>
  );
};

export default TaskDetailsList;

const styles = StyleSheet.create({
  // Existing styles
  collaboratorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  collaboratorIcon: {
    marginRight: 4,
  },
  collaboratorsText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  header: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "700", color: theme.colors.text },
  headerActions: { flexDirection: "row", alignItems: "center" },
  headerIconBtn: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 50, padding: 6, marginLeft: 8 },
  card: { flexDirection: "row", backgroundColor: theme.colors.background, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: theme.colors.border },
  shadow: { shadowColor: theme.colors.shadow, shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  leftStripe: { width: 5 },
  body: { flex: 1, padding: 14 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rightTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 16.5, fontWeight: "700", color: theme.colors.text, flex: 1, marginRight: 8 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  statusText: { fontWeight: "600", fontSize: 12.5 },
  desc: { marginTop: 6, color: theme.colors.textSecondary, fontSize: 13.5 },
  meta: { marginTop: 6, color: theme.colors.textSecondary, fontSize: 12.5 },
  bottomRow: { marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  creatorText: { color: theme.colors.textSecondary, fontSize: 12.5, flex: 1, marginRight: 8 },
  priorityPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  priorityText: { fontWeight: "600", fontSize: 12.5 },
  sheetOverlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: "flex-end" },
  sheetContainer: { backgroundColor: theme.colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40, maxHeight: "80%", shadowColor: theme.colors.shadow, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: -2 }, elevation: 5 },
  sheetGrabber: { width: 40, height: 5, backgroundColor: theme.colors.border, borderRadius: 2.5, alignSelf: "center", marginBottom: 12 },
  sheetTitle: { fontSize: 20, fontWeight: "700", color: theme.colors.text, marginBottom: 16, textAlign: "center" },
  inputContainer: { marginBottom: 20, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.muted100 },
  filterInput: { padding: 12, fontSize: 16, color: theme.colors.text },
  sheetSection: { fontSize: 16, fontWeight: "600", color: theme.colors.text, marginBottom: 12, marginTop: 8 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  filterPill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: theme.colors.muted100, borderWidth: 1, borderColor: theme.colors.border },
  filterPillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterPillText: { fontSize: 14, color: theme.colors.text, fontWeight: "500" },
  filterPillTextActive: { color: theme.colors.white, fontWeight: "600" },
  sheetActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  clearBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center", marginRight: 8 },
  clearBtnText: { fontSize: 16, color: theme.colors.error, fontWeight: "600" },
  applyBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.colors.primary, alignItems: "center", marginLeft: 8 },
  applyBtnText: { fontSize: 16, color: theme.colors.white, fontWeight: "600" },
});

/* ---------------- SHIMMER EFFECT ---------------- */
const ShimmerBlock = ({ height = 16, width = "100%", radius = 8, style }) => {
  const opacity = React.useRef(new Animated.Value(0.3)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[
        { height, width, borderRadius: radius, backgroundColor: theme.colors.muted200, opacity },
        style,
      ]}
    />
  );
};

const ShimmerCard = () => (
  <View style={[styles.card, styles.shadow, { flexDirection: "row" }]}>
    <View style={[styles.leftStripe, { backgroundColor: theme.colors.border }]} />
    <View style={styles.body}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <ShimmerBlock height={18} width={"60%"} radius={6} />
        <ShimmerBlock height={24} width={60} radius={12} />
      </View>
      <ShimmerBlock height={14} width={"90%"} radius={6} style={{ marginTop: 8 }} />
      <ShimmerBlock height={12} width={"40%"} radius={6} style={{ marginTop: 6 }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <ShimmerBlock height={12} width={"30%"} radius={6} />
        <ShimmerBlock height={24} width={90} radius={12} />
      </View>
    </View>
  </View>
);
