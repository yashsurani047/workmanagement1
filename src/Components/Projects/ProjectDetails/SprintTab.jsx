// src/Components/Projects/ProjectDetails/SprintTab.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '../../../Themes/ThemeContext';
import {
  Rocket,
  User,
  Calendar,
  Flag,
  CheckCircle,
  Clock,
  Circle,
  AlertCircle,
  ChevronRight,
  X,
  Zap,
} from 'lucide-react-native';

// ─── Mock Sprint Tasks ───────────────────────────────────────────────────────
const MOCK_SPRINT_TASKS = [
  {
    task_id: 'st1',
    title: 'Implement Push Notifications',
    description: 'Integrate Firebase Cloud Messaging for iOS and Android.',
    status: 'in_progress',
    priority: 'urgent_important',
    creator_full_name: 'Alice Johnson',
    assignee_names: 'Bob Smith',
    due_date: '2025-03-18',
    sprint: 'Sprint 3',
    points: 8,
  },
  {
    task_id: 'st2',
    title: 'Fix Dark Mode Theming Bugs',
    description: 'Resolve contrast and colour override issues in dark theme.',
    status: 'completed',
    priority: 'urgent_not_important',
    creator_full_name: 'Carol White',
    assignee_names: 'Alice Johnson',
    due_date: '2025-03-10',
    sprint: 'Sprint 3',
    points: 3,
  },
  {
    task_id: 'st3',
    title: 'Set Up Analytics Dashboard',
    description: 'Build a real-time analytics view for project metrics.',
    status: 'not_started',
    priority: 'not_urgent_important',
    creator_full_name: 'Dave Lee',
    assignee_names: 'Eve Martin',
    due_date: '2025-04-05',
    sprint: 'Sprint 4',
    points: 13,
  },
  {
    task_id: 'st4',
    title: 'Refactor Auth Module',
    description: 'Modularise authentication into reusable hooks and services.',
    status: 'pending',
    priority: 'not_urgent_not_important',
    creator_full_name: 'Eve Martin',
    assignee_names: 'Dave Lee, Bob Smith',
    due_date: '2025-03-28',
    sprint: 'Sprint 3',
    points: 5,
  },
  {
    task_id: 'st5',
    title: 'Optimise Image Upload Flow',
    description: 'Add client-side image compression and progress feedback.',
    status: 'on_hold',
    priority: 'urgent_important',
    creator_full_name: 'Bob Smith',
    assignee_names: 'Carol White',
    due_date: '2025-03-22',
    sprint: 'Sprint 3',
    points: 5,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_META = {
  completed: { label: 'Completed', color: '#10B981' },
  in_progress: { label: 'In Progress', color: '#F59E0B' },
  pending: { label: 'Pending', color: '#3B82F6' },
  not_started: { label: 'Not Started', color: '#6B7280' },
  on_hold: { label: 'On Hold', color: '#8B5CF6' },
  cancelled: { label: 'Cancelled', color: '#EF4444' },
  untaken: { label: 'Untaken', color: '#94A3B8' },
  taken: { label: 'Taken', color: '#3B82F6' },
};

const PRIORITY_META = {
  urgent_important: { label: 'Urgent & Imp.', color: '#EF4444' },
  urgent_not_important: { label: 'Urgent', color: '#F97316' },
  not_urgent_important: { label: 'Important', color: '#3B82F6' },
  not_urgent_not_important: { label: 'Low', color: '#6B7280' },
  medium: { label: 'Medium', color: '#F59E0B' },
};

const getStatus = (raw) => STATUS_META[String(raw || '').toLowerCase()] || { label: raw || 'Unknown', color: '#6B7280' };
const getPriority = (raw) => PRIORITY_META[String(raw || '').toLowerCase()] || { label: raw || '', color: '#6B7280' };

const fmtDate = (val) => {
  if (!val) return null;
  try { return new Date(val).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }
  catch { return val; }
};

const StatusIcon = ({ status, size = 14 }) => {
  const c = getStatus(status).color;
  if (status === 'completed') return <CheckCircle size={size} color={c} />;
  if (status === 'in_progress') return <Clock size={size} color={c} />;
  if (status === 'cancelled') return <AlertCircle size={size} color={c} />;
  if (status === 'on_hold') return <AlertCircle size={size} color={c} />;
  return <Circle size={size} color={c} />;
};

// ─── Sprint Task Card ─────────────────────────────────────────────────────────
function SprintTaskCard({ item, onPress }) {
  const { theme } = useTheme();
  const statusMeta = getStatus(item.status);
  const priorityMeta = getPriority(item.priority);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress?.(item)}
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      {/* Status stripe */}
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: statusMeta.color, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }} />

      <View style={{ paddingLeft: 14, paddingRight: 12, paddingVertical: 12 }}>
        {/* Top: Sprint label + status icon */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: `${theme.colors.primary}12` }}>
            <Rocket size={10} color={theme.colors.primary} strokeWidth={2} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: theme.colors.primary }}>{item.sprint || 'Sprint'}</Text>
          </View>

          {/* Story points */}
          {!!item.points && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: `${theme.colors.secondary}12` }}>
              <Zap size={10} color={theme.colors.secondary} strokeWidth={2} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: theme.colors.secondary }}>{item.points} pts</Text>
            </View>
          )}

          <View style={{ flex: 1 }} />
          <StatusIcon status={item.status} size={16} />
        </View>

        {/* Title */}
        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text, lineHeight: 21, marginBottom: 4 }} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Description */}
        {!!item.description && (
          <Text style={{ fontSize: 12.5, color: theme.colors.textSecondary, lineHeight: 18, marginBottom: 8 }} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Meta */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <User size={11} color={theme.colors.textSecondary} strokeWidth={2} />
            <Text style={{ fontSize: 11.5, color: theme.colors.textSecondary, fontWeight: '500' }}>{item.creator_full_name}</Text>
          </View>
          {!!item.due_date && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Calendar size={11} color={theme.colors.textSecondary} strokeWidth={2} />
              <Text style={{ fontSize: 11.5, color: theme.colors.textSecondary, fontWeight: '500' }}>{fmtDate(item.due_date)}</Text>
            </View>
          )}
        </View>

        {/* Badges */}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {!!item.priority && (
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: `${priorityMeta.color}18` }}>
              <Text style={{ fontSize: 10.5, fontWeight: '700', color: priorityMeta.color }}>{priorityMeta.label}</Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: `${statusMeta.color}18` }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusMeta.color }} />
            <Text style={{ fontSize: 10.5, fontWeight: '700', color: statusMeta.color }}>{statusMeta.label}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <ChevronRight size={14} color={theme.colors.textSecondary} strokeWidth={2} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Summary Chip ─────────────────────────────────────────────────────────────
function SummaryChip({ label, count, color }) {
  const { theme } = useTheme();
  return (
    <View style={{ alignItems: 'center', flex: 1, paddingVertical: 10, backgroundColor: `${color}12`, borderRadius: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color }}>{count}</Text>
      <Text style={{ fontSize: 10.5, fontWeight: '600', color: theme.colors.textSecondary, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ task, onClose }) {
  const { theme } = useTheme();
  if (!task) return null;
  const statusMeta = getStatus(task.status);
  const priorityMeta = getPriority(task.priority);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.38)', justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback>
            <View style={{ backgroundColor: theme.colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 40 }}>
              {/* Handle */}
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, alignSelf: 'center', marginBottom: 18 }} />

              {/* Sprint + points */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: `${theme.colors.primary}12` }}>
                  <Rocket size={11} color={theme.colors.primary} strokeWidth={2} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.colors.primary }}>{task.sprint || 'Sprint'}</Text>
                </View>
                {!!task.points && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: `${theme.colors.secondary}12` }}>
                    <Zap size={11} color={theme.colors.secondary} strokeWidth={2} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.colors.secondary }}>{task.points} story pts</Text>
                  </View>
                )}
              </View>

              <Text style={{ fontSize: 19, fontWeight: '800', color: theme.colors.text, marginBottom: 6 }}>{task.title}</Text>
              {!!task.description && (
                <Text style={{ fontSize: 13.5, color: theme.colors.textSecondary, lineHeight: 20, marginBottom: 14 }}>{task.description}</Text>
              )}

              {/* Info rows */}
              {[
                { label: 'Status', value: statusMeta.label, color: statusMeta.color },
                { label: 'Priority', value: priorityMeta.label, color: priorityMeta.color },
                { label: 'Created By', value: task.creator_full_name, color: null },
                { label: 'Assignees', value: task.assignee_names, color: null },
                { label: 'Due Date', value: fmtDate(task.due_date) || '—', color: null },
              ].map(({ label, value, color }, i, arr) => (
                <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: theme.colors.border }}>
                  <Text style={{ fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500' }}>{label}</Text>
                  <Text style={{ fontSize: 13, color: color || theme.colors.text, fontWeight: '600', maxWidth: '60%', textAlign: 'right' }}>{value || '—'}</Text>
                </View>
              ))}

              <TouchableOpacity onPress={onClose}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: theme.colors.border }}>
                <X size={15} color={theme.colors.textSecondary} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary }}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SprintTab({ projectId }) {
  const { theme } = useTheme();
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Completed' },
    { key: 'not_started', label: 'Not Started' },
  ];

  const filtered = filter === 'all'
    ? MOCK_SPRINT_TASKS
    : MOCK_SPRINT_TASKS.filter(t => t.status === filter);

  const total = MOCK_SPRINT_TASKS.length;
  const done = MOCK_SPRINT_TASKS.filter(t => t.status === 'completed').length;
  const inProgress = MOCK_SPRINT_TASKS.filter(t => t.status === 'in_progress').length;
  const totalPts = MOCK_SPRINT_TASKS.reduce((sum, t) => sum + (t.points || 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.task_id}
        renderItem={({ item }) => <SprintTaskCard item={item} onPress={setSelected} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 4, paddingBottom: 40 }}
        ListHeaderComponent={() => (
          <View>
            {/* Summary row */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              <SummaryChip label="Total" count={total} color={theme.colors.primary} />
              <SummaryChip label="In Progress" count={inProgress} color="#F59E0B" />
              <SummaryChip label="Done" count={done} color="#10B981" />
              <SummaryChip label="Pts" count={totalPts} color="#8B5CF6" />
            </View>

            {/* Filter chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
              {filters.map(f => {
                const active = filter === f.key;
                return (
                  <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                      backgroundColor: active ? theme.colors.primary : theme.colors.muted100,
                      borderWidth: 1,
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: active ? '#FFFFFF' : theme.colors.textSecondary }}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: `${theme.colors.primary}12`, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Rocket size={26} color={theme.colors.primary} strokeWidth={1.8} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text }}>No Sprint Tasks</Text>
            <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 }}>No tasks match this filter.</Text>
          </View>
        )}
      />

      {/* Detail bottom sheet modal */}
      {selected && <DetailModal task={selected} onClose={() => setSelected(null)} />}
    </View>
  );
}
