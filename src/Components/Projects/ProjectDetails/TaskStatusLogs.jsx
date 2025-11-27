import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import theme from '../../../Themes/Themes';
import { getTaskUpdateLogs } from '../../../Services/Project/FetchProjectTask';

const statusColors = {
  not_started: theme.colors.textSecondary,
  in_progress: theme.colors.secondary,
  completed: theme.colors.primary,
  pending: theme.colors.task,
  on_hold: theme.colors.textSecondary,
  cancelled: theme.colors.error,
  untaken: theme.colors.textSecondary,
  taken: theme.colors.primary,
};

function LogRow({ item }) {
  const color = statusColors[String(item.status_change || '').toLowerCase()] || theme.colors.primary;
  const when = item.created_at ? new Date(item.created_at) : null;
  const whenStr = when ? `${when.toLocaleDateString()} ${when.toLocaleTimeString()}` : '';
  return (
    <View style={styles.logRow}>
      <View style={styles.logHeader}>
        <Text style={styles.userName}>{item.user_first_name || item.user_name || 'User'} {item.user_last_name || ''}</Text>
        <View style={[styles.statusPill, { backgroundColor: `${color}20` }]}> 
          <Text style={[styles.statusText, { color }]}>{String(item.status_change || '').replace(/_/g,' ').replace(/\b\w/g, c=>c.toUpperCase())}</Text>
        </View>
      </View>
      {!!item.notes && item.notes.trim().length > 0 && (
        <Text style={styles.notes}>{item.notes}</Text>
      )}
      {!!whenStr && <Text style={styles.time}>{whenStr}</Text>}
    </View>
  );
}

export default function TaskStatusLogs() {
  const route = useRoute();
  const navigation = useNavigation();
  const orgId = route?.params?.orgId || 'one';
  const taskId = route?.params?.taskId || '';
  const taskTitle = route?.params?.taskTitle || 'Task Logs';

  const [loading, setLoading] = React.useState(true);
  const [updates, setUpdates] = React.useState([]);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      const res = await getTaskUpdateLogs(orgId, taskId);
      const arr = Array.isArray(res?.updates) ? res.updates : [];
      // Sort desc by created_at
      arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setUpdates(arr);
    } catch (e) {
      setError(e?.message || 'Failed to load logs');
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, taskId]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['top','bottom']}>
      <View style={styles.headerBar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{taskTitle}</Text>
        <View style={{ width: 24 }} /> {/* Spacer for alignment */}
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={theme.colors.primary} /></View>
      ) : error ? (
        <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>
      ) : updates.length === 0 ? (
        <View style={styles.center}><Text style={styles.emptyText}>No updates yet.</Text></View>
      ) : (
        <FlatList
          data={updates}
          keyExtractor={(it) => String(it.update_id)}
          renderItem={({ item }) => <LogRow item={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  headerBar: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: theme.colors.text,
    flex: 1,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: theme.colors.error },
  emptyText: { color: theme.colors.textSecondary },
  logRow: { backgroundColor: theme.colors.background, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: 12 },
  logHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  userName: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginRight: 8, flex: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  statusText: { fontWeight: '700', fontSize: 12.5 },
  notes: { color: theme.colors.text, marginTop: 8 },
  time: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 6 },
});
