// src/Components/CardDetailsList.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  RefreshControl,
  Animated,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { MoreVertical, Plus, Filter, Edit3, Trash2, X } from "lucide-react-native";
import theme from "../../Themes/Themes";
import { fetchProjectAssigneesAPI, deleteProjectApi } from "../../Services/Project/fetchProjects";

const statusColors = {
  "in progress": theme.colors.secondary,
  approved: theme.colors.success,
  completed: theme.colors.primary,
  pending: theme.colors.task,
  "on hold": theme.colors.textSecondary,
  cancelled: theme.colors.error,
};

const buildDisplayName = (a) => {
  if (!a) return "User";
  const full = a.full_name || a.name;
  if (full && typeof full === "string") return full;
  const uname = a.user_name || a.username || a.user || "";
  if (uname) {
    const cleaned = uname.replace(/[._-]+/g, " ").trim();
    return cleaned
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
  const uid = a.user_id || a.id || "User";
  return String(uid).slice(0, 12);
};

const getStatusColor = (status = "") => {
  const statusLower = status.toLowerCase();
  return statusColors[statusLower] || theme.colors.primary;
};

const ProjectCard = ({ project, onPress, onMore, isCreator = false }) => {
  const title = project.name || "Untitled Project";
  const status = (project.status || "in progress").toLowerCase();
  const statusColor = getStatusColor(status);
  const [assignees, setAssignees] = useState([]);

  const formatDate = (iso) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch { return null; }
  };

  useEffect(() => {
    let mounted = true;
    const loadAssignees = async () => {
      try {
        const projectId = project?.id || project?._id || project?.project_id || project?.projectId;
        if (!projectId) return;
        let token = await AsyncStorage.getItem("userToken") || null;
        if (!token) {
          const userInfo = await AsyncStorage.getItem("userInfo");
          token = userInfo ? JSON.parse(userInfo)?.token : null;
        }
        const res = await fetchProjectAssigneesAPI({ projectId, token });
        if (mounted && res.success) {
          const names = (Array.isArray(res.data) ? res.data : []).map(buildDisplayName);
          setAssignees(names);
        }
      } catch { if (mounted) setAssignees([]); }
    };
    loadAssignees();
    return () => { mounted = false; };
  }, [project]);

  const members = assignees.length > 0 ? assignees : Array.isArray(project.members) ? project.members : [];
  const assignedByName = project.assigned_by || "Unknown";

  return (
    <TouchableOpacity style={[styles.projectCard, styles.shadow]} onPress={() => onPress(project)} activeOpacity={0.95}>
      <View style={[styles.leftStripe, { backgroundColor: statusColor }]} />
      <View style={styles.cardBody}>
        <View style={styles.topRow}>
          <Text style={styles.projectTitle} numberOfLines={1}>{title}</Text>
          {isCreator && (
            <TouchableOpacity onPress={() => onMore?.(project)}>
              <MoreVertical size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.metaText} numberOfLines={1}>
          Assigned by <Text style={styles.boldText}>{assignedByName}</Text>{" "}
          {formatDate(project.created_at) ? `• ${formatDate(project.created_at)}` : "• Unknown date"}
        </Text>
        <View style={styles.bottomRow}>
          <View style={styles.avatarsRow}>
            {members.slice(0, 4).map((m, idx) => (
              <View key={idx} style={[styles.smallAvatar, { backgroundColor: [theme.colors.meeting, theme.colors.project, theme.colors.success, theme.colors.primary][idx % 4] }]}>
                <Text style={styles.smallAvatarText}>
                  {m?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </Text>
              </View>
            ))}
            {members.length > 4 && (
              <View style={[styles.smallAvatar, { backgroundColor: theme.colors.textSecondary }]}>
                <Text style={styles.smallAvatarText}>+{members.length - 4}</Text>
              </View>
            )}
          </View>
          <View style={[styles.statusSoft, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusSoftText, { color: statusColor }]}>
              {status.replace(/\b\w/g, c => c.toUpperCase())}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const CardDetailsList = ({ items = [], onItemPress, onRefresh, navigation: navProp }) => {
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
  const slideAnim = React.useRef(new Animated.Value(300)).current;

  useEffect(() => {
    // Fetch current user info when component mounts
    const fetchCurrentUser = async () => {
      try {
        const userInfo = await AsyncStorage.getItem('userInfo');
        if (userInfo) {
          const parsedUser = JSON.parse(userInfo);
          setCurrentUserId(parsedUser.id || parsedUser.user_id || parsedUser._id);
        }
      } catch (error) {
        console.error('Error fetching current user info:', error);
      }
    };
    
    fetchCurrentUser();
  }, []);

  useEffect(() => { setData(items); setLoading(items?.length === 0); }, [items]);
  
  useEffect(() => {
    Animated.timing(slideAnim, { toValue: filterOpen ? 0 : 300, duration: 300, useNativeDriver: true }).start();
  }, [filterOpen]);
  
  // Check if current user is the creator of the project
  const isCurrentUserCreator = (project) => {
    if (!currentUserId || !project) return false;
    // Check if the current user is the one who created/assigned the project
    return project.assigned_by_user_id && 
           (project.assigned_by_user_id.toString() === currentUserId.toString());
  };

  const displayed = useMemo(() => {
    let list = Array.isArray(data) ? data : [];
    if (statusFilter !== "all") list = list.filter(p => (p.status || "").toLowerCase() === statusFilter);
    if (priorityFilter !== "all") list = list.filter(p => (p.priority || "").toLowerCase() === priorityFilter.toLowerCase());
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(p => (p.name || p.title || "").toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q));
    }
    return list;
  }, [data, statusFilter, priorityFilter, query]);

  const handleDelete = async (project) => {
    const projectId = project?.id || project?._id;
    if (!projectId) return Alert.alert("Error", "Missing project ID");
    Alert.alert("Delete Project", "Are you sure you want to delete this project? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        const res = await deleteProjectApi(projectId);
        if (res?.success) {
          setData(prev => prev.filter(p => (p.id || p._id) !== projectId));
          Alert.alert("Success", "Project deleted");
        } else Alert.alert("Error", res?.message || "Failed");
      }},
    ]);
  };

  const handleMore = (project) => {
    // Only show actions if the current user is the creator
    if (isCurrentUserCreator(project)) {
      setActionsProject(project);
      setActionsOpen(true);
    }
  };
  const handleUpdate = () => {
    if (!actionsProject) return;
    const params = { mode: 'edit', project: actionsProject, projectId: actionsProject.id || actionsProject._id };
    (navigation?.getParent?.() || navigation)?.navigate("CreateProject", params);
    setActionsOpen(false);
  };
  const handleItemPress = (item) => {
    if (onItemPress) return onItemPress(item);
    const projectId = item?.id || item?._id;
    (navigation?.getParent?.() || navigation)?.navigate("ProjectDetails", { projectId, project: item });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Projects</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => setFilterOpen(true)}>
            <Filter size={18} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate("CreateProject")}>
            <Plus size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={filterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setFilterOpen(false)}>
          <View style={{ flex: 1, backgroundColor: theme.colors.overlayLight, justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback>
              <View style={{ backgroundColor: theme.colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 }}>
                <View style={{ height: 4, width: 44, backgroundColor: theme.colors.border, alignSelf: 'center', borderRadius: 2, marginBottom: 12 }} />
                <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text, marginBottom: 12 }}>Filter Projects</Text>

                {/* Search */}
                <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14 }}>
                  <TextInput
                    placeholder="Search by name or description"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={query}
                    onChangeText={setQuery}
                    style={{ color: theme.colors.text }}
                  />
                </View>

                {/* Status */}
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 8 }}>Status</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {['all','in progress','approved','completed','pending','on hold','cancelled'].map((s) => {
                    const active = statusFilter === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        onPress={() => setStatusFilter(s)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: active ? theme.colors.primary : theme.colors.border,
                          backgroundColor: active ? `${theme.colors.primary}15` : theme.colors.background,
                        }}
                      >
                        <Text style={{ color: active ? theme.colors.primary : theme.colors.text, fontWeight: active ? '600' : '500' }}>{s.replace(/\b\w/g, c => c.toUpperCase())}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Priority */}
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 8 }}>Priority</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {['all','high','medium','low'].map((p) => {
                    const active = String(priorityFilter).toLowerCase() === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        onPress={() => setPriorityFilter(p)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: active ? theme.colors.primary : theme.colors.border,
                          backgroundColor: active ? `${theme.colors.primary}15` : theme.colors.background,
                        }}
                      >
                        <Text style={{ color: active ? theme.colors.primary : theme.colors.text, fontWeight: active ? '600' : '500' }}>{p.replace(/\b\w/g, c => c.toUpperCase())}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Actions */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <TouchableOpacity
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.colors.muted100, alignItems: 'center' }}
                    onPress={() => { setQuery(''); setStatusFilter('all'); setPriorityFilter('all'); }}
                  >
                    <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.colors.primary, alignItems: 'center' }}
                    onPress={() => setFilterOpen(false)}
                  >
                    <Text style={{ color: theme.colors.white, fontWeight: '700' }}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <FlatList
        data={loading ? Array(6).fill({ __shimmer: true }) : displayed}
        renderItem={({ item }) => item.__shimmer ? <ShimmerProjectCard /> : (
          <ProjectCard 
            project={item} 
            onPress={handleItemPress} 
            onMore={handleMore} 
            isCreator={isCurrentUserCreator(item)}
          />
        )}
        keyExtractor={(item, i) => item.id || item._id || i.toString()}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh ? async () => { setRefreshing(true); await onRefresh(); setRefreshing(false); } : null} colors={[theme.colors.primary]} />}
      />

      {/* Project actions modal (Event-style) */}
      <Modal visible={actionsOpen} transparent animationType="fade" onRequestClose={() => setActionsOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setActionsOpen(false)}>
          <View style={styles.menuBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.menuSheet}>
                <Text style={styles.menuTitle}>Project actions</Text>
                <TouchableOpacity style={styles.menuItem} onPress={() => { setActionsOpen(false); handleUpdate(); }}>
                  <Edit3 size={16} color={theme.colors.text} />
                  <Text style={styles.menuItemText}>Edit Project</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => { setActionsOpen(false); actionsProject && handleDelete(actionsProject); }}>
                  <Trash2 size={16} color={theme.colors.error} />
                  <Text style={[styles.menuItemText, { color: theme.colors.error }]}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => setActionsOpen(false)}>
                  <X size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.menuItemText, { color: theme.colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "700", color: theme.colors.text },
  headerActions: { flexDirection: "row", gap: 12 },
  headerIconBtn: { padding: 8, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 50 },
  projectCard: { flexDirection: "row", backgroundColor: theme.colors.background, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: theme.colors.border },
  shadow: { shadowColor: theme.colors.shadow, shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  leftStripe: { width: 5 },
  cardBody: { flex: 1, padding: 14 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  projectTitle: { fontSize: 16.5, fontWeight: "700", color: theme.colors.text, flex: 1 },
  metaText: { fontSize: 12.5, color: theme.colors.textSecondary, marginBottom: 8 },
  boldText: { fontWeight: "bold", color: theme.colors.text },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  avatarsRow: { flexDirection: "row" },
  smallAvatar: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center", marginLeft: -6, borderWidth: 2, borderColor: theme.colors.background },
  smallAvatarText: { color: theme.colors.white, fontWeight: "700", fontSize: 11 },
  statusSoft: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  statusSoftText: { fontWeight: "600", fontSize: 12.5 },
  listContent: { paddingHorizontal: 12, paddingBottom: 80 },

  // EXACT ACTION SHEET STYLES - DITTO TO DITTO
  modalOverlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: "flex-end" },
  modalBackdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  actionSheetWrapper: { paddingHorizontal: 10, paddingBottom: 34 },
  actionSheet: { backgroundColor: theme.colors.sectionBg, borderRadius: 13, overflow: "hidden" },
  actionItem: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.background, paddingVertical: 14, paddingHorizontal: 18 },
  actionLabel: { fontSize: 17, color: theme.colors.text, marginLeft: 18, fontWeight: "400" },
  cancelContainer: { marginTop: 8 },
  cancelBtn: { backgroundColor: theme.colors.background, paddingVertical: 14, alignItems: "center", borderRadius: 13 },
  cancelLabel: { fontSize: 17, color: theme.colors.primary, fontWeight: "600" },

  // Event-style menu (for project actions)
  menuBackdrop: { flex: 1, backgroundColor: theme.colors.overlayLight, justifyContent: 'flex-end' },
  menuSheet: { backgroundColor: theme.colors.background, padding: 12, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  menuTitle: { color: theme.colors.textSecondary, fontSize: 12, marginBottom: 8, paddingHorizontal: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 8 },
  menuItemText: { color: theme.colors.text, fontSize: 14, fontWeight: '500' },
});

const ShimmerProjectCard = () => (
  <View style={[styles.projectCard, styles.shadow, { flexDirection: "row" }]}>
    <View style={[styles.leftStripe, { backgroundColor: theme.colors.border }]} />
    <View style={styles.cardBody}>
      <View style={styles.topRow}><View style={{ height: 18, width: "60%", backgroundColor: theme.colors.muted200, borderRadius: 6 }} /></View>
      <View style={{ height: 12, width: "50%", backgroundColor: theme.colors.muted200, borderRadius: 6, marginVertical: 8 }} />
      <View style={styles.bottomRow}>
        <View style={styles.avatarsRow}>
          {[1,2,3].map(i => <View key={i} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: theme.colors.muted200, marginLeft: -6 }} />)}
        </View>
        <View style={{ height: 24, width: 90, backgroundColor: theme.colors.muted200, borderRadius: 12 }} />
      </View>
    </View>
  </View>
);

export default CardDetailsList;