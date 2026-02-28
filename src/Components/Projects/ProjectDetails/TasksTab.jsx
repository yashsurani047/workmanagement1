// src/Components/Projects/ProjectDetails/TasksTab.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../../Themes/ThemeContext';
import {
  CheckCircle,
  Clock,
  Circle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  GitBranch,
  User,
  Calendar,
  Tag,
  ClipboardList,
} from 'lucide-react-native';

// ─── Mock Data ─────────────────────────────────────────────────────────────
const MOCK_TASKS = [
  {
    task_id: '1',
    title: 'Design Login Screen',
    description: 'Create wireframes and high-fidelity mockups for the login flow.',
    status: 'completed',
    priority: 'urgent_important',
    creator_full_name: 'Alice Johnson',
    assignee_names: 'Bob Smith, Carol White',
    due_date: '2025-03-10',
    subtasks: [
      { subtask_id: 's1', title: 'Create wireframes', status: 'completed', due_date: '2025-02-28' },
      { subtask_id: 's2', title: 'Design mockups', status: 'completed', due_date: '2025-03-05' },
    ],
  },
  {
    task_id: '2',
    title: 'Implement Authentication API',
    description: 'Build JWT-based auth endpoints with refresh token support.',
    status: 'in_progress',
    priority: 'urgent_important',
    creator_full_name: 'Bob Smith',
    assignee_names: 'Alice Johnson',
    due_date: '2025-03-20',
    subtasks: [
      { subtask_id: 's3', title: 'Write login endpoint', status: 'completed', due_date: '2025-03-12' },
      { subtask_id: 's4', title: 'Add refresh token logic', status: 'in_progress', due_date: '2025-03-18' },
      { subtask_id: 's5', title: 'Write unit tests', status: 'not_started', due_date: '2025-03-20' },
    ],
  },
  {
    task_id: '3',
    title: 'Set Up CI/CD Pipeline',
    description: 'Configure GitHub Actions for automated testing and deployment.',
    status: 'pending',
    priority: 'not_urgent_important',
    creator_full_name: 'Carol White',
    assignee_names: 'Dave Lee',
    due_date: '2025-04-01',
    subtasks: [],
  },
  {
    task_id: '4',
    title: 'Write API Documentation',
    description: 'Document all public REST endpoints using Swagger/OpenAPI.',
    status: 'not_started',
    priority: 'not_urgent_not_important',
    creator_full_name: 'Dave Lee',
    assignee_names: 'Carol White',
    due_date: '2025-04-15',
    subtasks: [
      { subtask_id: 's6', title: 'Document auth endpoints', status: 'not_started', due_date: '2025-04-10' },
    ],
  },
  {
    task_id: '5',
    title: 'Database Schema Migration',
    description: 'Migrate legacy tables to the new normalised schema.',
    status: 'on_hold',
    priority: 'urgent_not_important',
    creator_full_name: 'Eve Martin',
    assignee_names: 'Alice Johnson, Bob Smith',
    due_date: '2025-03-25',
    subtasks: [],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const STATUS_META = {
  completed: { label: 'Completed', color: '#10B981' },
  in_progress: { label: 'In Progress', color: '#F59E0B' },
  pending: { label: 'Pending', color: '#3B82F6' },
  not_started: { label: 'Not Started', color: '#6B7280' },
  on_hold: { label: 'On Hold', color: '#8B5CF6' },
  cancelled: { label: 'Cancelled', color: '#EF4444' },
  approved: { label: 'Approved', color: '#10B981' },
  untaken: { label: 'Untaken', color: '#6B7280' },
  taken: { label: 'Taken', color: '#3B82F6' },
};

const PRIORITY_META = {
  urgent_important: { label: 'Urgent & Important', color: '#EF4444' },
  urgent_not_important: { label: 'Urgent', color: '#F97316' },
  not_urgent_important: { label: 'Important', color: '#3B82F6' },
  not_urgent_not_important: { label: 'Low', color: '#6B7280' },
  medium: { label: 'Medium', color: '#F59E0B' },
};

const getStatus = (raw) => STATUS_META[String(raw).toLowerCase()] || { label: raw || 'Unknown', color: '#6B7280' };
const getPriority = (raw) => PRIORITY_META[String(raw).toLowerCase()] || { label: raw || '', color: '#6B7280' };

const fmtDate = (val) => {
  if (!val) return null;
  try { return new Date(val).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }
  catch { return val; }
};

const SubtaskIcon = ({ status }) => {
  const c = getStatus(status).color;
  if (status === 'completed') return <CheckCircle size={13} color={c} />;
  if (status === 'in_progress') return <Clock size={13} color={c} />;
  if (status === 'cancelled') return <AlertCircle size={13} color={c} />;
  return <Circle size={13} color={c} />;
};

// ─── Task Card ───────────────────────────────────────────────────────────────
function TaskCard({ item }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const statusMeta = getStatus(item.status);
  const priorityMeta = getPriority(item.priority);

  return (
    <View style={{
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
    }}>
      {/* Left accent stripe */}
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: statusMeta.color, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }} />

      <View style={{ paddingLeft: 14, paddingRight: 12, paddingTop: 12, paddingBottom: 10 }}>

        {/* Top row: title + menu */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          {/* Subtask toggle */}
          {item.subtasks?.length > 0 && (
            <TouchableOpacity onPress={() => setExpanded(e => !e)} style={{ marginTop: 2 }}>
              {expanded
                ? <ChevronDown size={16} color={theme.colors.primary} strokeWidth={2.5} />
                : <ChevronRight size={16} color={theme.colors.primary} strokeWidth={2.5} />}
            </TouchableOpacity>
          )}
          <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: theme.colors.text, lineHeight: 21 }} numberOfLines={2}>
            {item.title}
          </Text>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ padding: 4 }}>
            <MoreVertical size={17} color={theme.colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Description */}
        {!!item.description && (
          <Text style={{ fontSize: 12.5, color: theme.colors.textSecondary, marginTop: 5, lineHeight: 18, marginLeft: item.subtasks?.length > 0 ? 24 : 0 }} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Meta row */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10, alignItems: 'center', marginLeft: item.subtasks?.length > 0 ? 24 : 0 }}>
          {/* Creator */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <User size={11} color={theme.colors.textSecondary} strokeWidth={2} />
            <Text style={{ fontSize: 11.5, color: theme.colors.textSecondary, fontWeight: '500' }}>{item.creator_full_name}</Text>
          </View>

          {/* Due date */}
          {!!item.due_date && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Calendar size={11} color={theme.colors.textSecondary} strokeWidth={2} />
              <Text style={{ fontSize: 11.5, color: theme.colors.textSecondary, fontWeight: '500' }}>{fmtDate(item.due_date)}</Text>
            </View>
          )}

          {/* Subtask count badge */}
          {item.subtasks?.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <GitBranch size={11} color={theme.colors.primary} strokeWidth={2} />
              <Text style={{ fontSize: 11.5, color: theme.colors.primary, fontWeight: '600' }}>{item.subtasks.length} subtasks</Text>
            </View>
          )}
        </View>

        {/* Badges row */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center', marginLeft: item.subtasks?.length > 0 ? 24 : 0 }}>
          {/* Priority */}
          {!!item.priority && (
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: `${priorityMeta.color}18` }}>
              <Text style={{ fontSize: 10.5, fontWeight: '700', color: priorityMeta.color }}>{priorityMeta.label}</Text>
            </View>
          )}

          {/* Status */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8, backgroundColor: `${statusMeta.color}18` }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusMeta.color }} />
            <Text style={{ fontSize: 10.5, fontWeight: '700', color: statusMeta.color }}>{statusMeta.label}</Text>
          </View>
        </View>

        {/* Subtasks expanded */}
        {expanded && item.subtasks?.length > 0 && (
          <View style={{ marginTop: 12, marginLeft: 24, borderLeftWidth: 2, borderLeftColor: `${theme.colors.primary}30`, paddingLeft: 12, gap: 8 }}>
            {item.subtasks.map((sub) => {
              const sm = getStatus(sub.status);
              return (
                <View key={sub.subtask_id} style={{
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  backgroundColor: theme.colors.muted100,
                  borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
                }}>
                  <SubtaskIcon status={sub.status} />
                  <Text style={{ flex: 1, fontSize: 12.5, fontWeight: '600', color: theme.colors.text, textDecorationLine: sub.status === 'completed' ? 'line-through' : 'none' }} numberOfLines={1}>
                    {sub.title}
                  </Text>
                  {!!sub.due_date && (
                    <Text style={{ fontSize: 10.5, color: theme.colors.textSecondary, fontWeight: '500' }}>{fmtDate(sub.due_date)}</Text>
                  )}
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: `${sm.color}18` }}>
                    <Text style={{ fontSize: 9.5, fontWeight: '700', color: sm.color }}>{sm.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Action menu bottom sheet */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.38)', justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback>
              <View style={{ backgroundColor: theme.colors.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 36 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, alignSelf: 'center', marginBottom: 18 }} />
                <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 16 }}>Task Actions</Text>

                {[
                  { icon: Edit2, label: 'Edit Task', color: theme.colors.text },
                  { icon: GitBranch, label: 'Add Subtask', color: theme.colors.primary },
                  { icon: Trash2, label: 'Delete Task', color: '#EF4444' },
                ].map(({ icon: Icon, label, color }) => (
                  <TouchableOpacity key={label} onPress={() => setMenuVisible(false)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${color}12`, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color={color} strokeWidth={2} />
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color }}>{label}</Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity onPress={() => setMenuVisible(false)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: theme.colors.border }}>
                  <X size={15} color={theme.colors.textSecondary} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

// ─── Summary chips ───────────────────────────────────────────────────────────
function SummaryChip({ label, count, color }) {
  const { theme } = useTheme();
  return (
    <View style={{ alignItems: 'center', flex: 1, paddingVertical: 10, backgroundColor: `${color}12`, borderRadius: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color }}>{count}</Text>
      <Text style={{ fontSize: 10.5, fontWeight: '600', color: theme.colors.textSecondary, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function TasksTab({ projectId }) {
  const { theme } = useTheme();
  const [filter, setFilter] = useState('all');

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Completed' },
  ];

  const filtered = filter === 'all'
    ? MOCK_TASKS
    : MOCK_TASKS.filter(t => t.status === filter);

  const total = MOCK_TASKS.length;
  const done = MOCK_TASKS.filter(t => t.status === 'completed').length;
  const inProgress = MOCK_TASKS.filter(t => t.status === 'in_progress').length;
  const pending = MOCK_TASKS.filter(t => t.status === 'pending').length;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.task_id}
        renderItem={({ item }) => <TaskCard item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 40, paddingTop: 4 }}
        ListHeaderComponent={() => (
          <View>
            {/* Summary row */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              <SummaryChip label="Total" count={total} color={theme.colors.primary} />
              <SummaryChip label="In Progress" count={inProgress} color="#F59E0B" />
              <SummaryChip label="Pending" count={pending} color="#3B82F6" />
              <SummaryChip label="Done" count={done} color="#10B981" />
            </View>

            {/* Filter chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
              {filters.map(f => {
                const active = filter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setFilter(f.key)}
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
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: `${theme.colors.primary}12`, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <ClipboardList size={26} color={theme.colors.primary} strokeWidth={1.8} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text }}>No Tasks Found</Text>
            <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 }}>No tasks match this filter.</Text>
          </View>
        )}
      />
    </View>
  );
}