// src/Components/ProjectDetails/SprintTab.jsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../../../Themes/Themes';
import getSprintTasks from '../../../Services/Project/FetchSprintTask';
import { useNavigation, useRoute } from '@react-navigation/native';

const statusColors = {
  in_progress: theme.colors.secondary,
  approved: theme.colors.success,
  completed: theme.colors.primary,
  pending: theme.colors.task,
  on_hold: theme.colors.textSecondary,
  cancelled: theme.colors.error,
  untaken: theme.colors.textSecondary,
};
const getStatusColor = (status = '') => {
  const key = String(status).toLowerCase();
  return statusColors[key] || theme.colors.primary;
};

function SprintTaskItem({ item, onPress }) {
  const statusColor = getStatusColor(item.status);
  const priorityColor = theme.colors.primary;
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => onPress?.(item)} style={[styles.projectCard, styles.shadow]}>
      <View style={[styles.leftStripe, { backgroundColor: statusColor }]} />
      <View style={styles.cardBody}>
        <View style={styles.topRow}>
          <Text style={styles.projectTitle} numberOfLines={1}>{item.title}</Text>
        </View>
        {!!item.project_name && <Text style={styles.metaText} numberOfLines={1}>{item.project_name}</Text>}
        {!!item.creator_full_name && <Text style={styles.metaText} numberOfLines={1}>Created by <Text style={styles.boldText}>{item.creator_full_name}</Text></Text>}
        {!!item.assignee_names && <Text style={styles.metaText} numberOfLines={1}>Assignees: {item.assignee_names}</Text>}
        <View style={styles.bottomRow}>
          <View style={styles.pillsRow}>
            {!!item.priority && (
              <Text style={[styles.pillSoft, { borderColor: priorityColor, backgroundColor: `${priorityColor}20`, color: priorityColor }]}>
                {String(item.priority || '').replace(/_/g,' ').replace(/\b\w/g, c=>c.toUpperCase())}
              </Text>
            )}
          </View>
          <View style={[styles.statusSoft, { backgroundColor: `${statusColor}26` }]}>
            <Text style={[styles.statusSoftText, { color: statusColor }]}>
              {String(item.status || '').replace(/_/g,' ').replace(/\b\w/g, c=>c.toUpperCase())}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function SprintTab({ projectId: propProjectId }) {
  const route = useRoute();
  const navigation = useNavigation();
  
  // Handle back button press
  const handleBack = () => {
    navigation.navigate('Tabs'); // Navigate to the main tabs screen
  };
  const [tasks, setTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    try {
      setError('');
      setLoading(true);

      // Get user + org info
      const userInfoRaw = await AsyncStorage.getItem('userInfo');
      const storedUserId = await AsyncStorage.getItem('userId');
      let parsedInfo = null;
      try { parsedInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null; } catch {}

      const organizationId = String(parsedInfo?.organization_id || 'one');
      const userId = storedUserId || String(parsedInfo?.user_id || '');
      const effectiveProjectId =
        propProjectId ||
        route?.params?.projectId ||
        route?.params?.project?.project_id ||
        route?.params?.project?.id;

      if (!effectiveProjectId) {
        setError('No project ID found.');
        setTasks([]);
        return;
      }

      const rawTasks = await getSprintTasks(organizationId, effectiveProjectId);

      // Normalize task data
      const normalized = rawTasks.map(t => {
        const assignees = Array.isArray(t.assignees) ? t.assignees : [];
        const assigneeNames = assignees.map(a => a?.full_name || a?.name || '').join(', ');
        const assigneeIds = assignees.map(a => a?.user_id || a?.id || '').join(',');
        return {
          task_id: t.sprint_task_id || t.id,
          title: t.title,
          project_name: t.project_name || '',
          creator_full_name: t.creator_name || t.created_by || '',
          creator_user_id: String(t.creator_user_id || ''),
          assignee_ids: assigneeIds,
          assignee_names: assigneeNames,
          priority: t.priority,
          status: t.status,
          due_date: t.due_date,
        };
      });

      // Show ALL sprint tasks for the project (no per-task assignment filter)
      setTasks(normalized);
    } catch (err) {
      setError(err?.message || 'Failed to load sprint tasks');
      console.error('SprintTab error:', err);
    } finally {
      setLoading(false);
    }
  }, [propProjectId, route?.params?.projectId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const openTakeModal = (task) => {
    if (String(task.status).toLowerCase() !== 'untaken') return;
    navigation.navigate('TakeSprintTask', { task, onTaken: load });
  };

  return (
    <View style={styles.container}>
      {/* Header with back button */}
   
      <FlatList
        data={tasks}
        keyExtractor={(item) => String(item.task_id || item.id)}
        renderItem={({ item }) => <SprintTaskItem item={item} onPress={openTakeModal} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {loading ? 'Loading sprint tasks...' : error || 'No sprint tasks found.'}
            </Text>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={tasks.length === 0 ? { flex: 1, paddingHorizontal: 8, paddingBottom: 24 } : { paddingHorizontal: 8, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  projectCard: { flexDirection: 'row', backgroundColor: theme.colors.background, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border },
  shadow: { shadowColor: theme.colors.shadow, shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  leftStripe: { width: 5 },
  cardBody: { flex: 1, padding: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  projectTitle: { fontSize: 16.5, fontWeight: '700', color: theme.colors.text, flex: 1 },
  metaText: { fontSize: 12.5, color: theme.colors.textSecondary, marginBottom: 4 },
  boldText: { fontWeight: 'bold', color: theme.colors.text },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  statusSoft: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  statusSoftText: { fontWeight: '600', fontSize: 12.5 },
  pillsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pillSoft: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, borderWidth: 1, overflow: 'hidden', fontSize: 12, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: theme.colors.text },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding:2,
    marginBottom:10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
 
  modalCard: { backgroundColor: theme.colors.background, padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
  label: { fontSize: 13, color: theme.colors.text, marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: theme.colors.text, backgroundColor: theme.colors.background },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  primaryBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  ghostBtn: { paddingHorizontal: 12, paddingVertical: 12 },
  ghostBtnText: { color: theme.colors.text },
});
