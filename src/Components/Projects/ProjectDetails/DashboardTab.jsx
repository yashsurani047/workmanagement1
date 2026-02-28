import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../Themes/ThemeContext';
import { getProjectDetails } from '../../../Utils/apiUtils';
import { getProjectAssignedUsers } from '../../../Services/Project/FetchprojectUsers';
import {
  FileText,
  User,
  Calendar,
  CalendarCheck,
  Activity,
  Users,
  UserCheck,
  RefreshCw,
  AlertCircle,
  Hash,
  Briefcase,
} from 'lucide-react-native';

// ─── Status → colour + label ───────────────────────────────────────────────
const STATUS_META = {
  not_started: { label: 'Not Started', bg: '#6B728020', text: '#6B7280', dot: '#6B7280' },
  planned: { label: 'Planned', bg: '#3B82F620', text: '#3B82F6', dot: '#3B82F6' },
  scheduled: { label: 'Scheduled', bg: '#8B5CF620', text: '#8B5CF6', dot: '#8B5CF6' },
  in_progress: { label: 'In Progress', bg: '#F59E0B20', text: '#F59E0B', dot: '#F59E0B' },
  on_hold: { label: 'On Hold', bg: '#EF444420', text: '#EF4444', dot: '#EF4444' },
  completed: { label: 'Completed', bg: '#10B98120', text: '#10B981', dot: '#10B981' },
  cancelled: { label: 'Cancelled', bg: '#EF444420', text: '#EF4444', dot: '#EF4444' },
};

const getStatus = (raw) => {
  const key = (raw || '').toLowerCase().replace(/\s+/g, '_');
  return STATUS_META[key] || { label: raw || 'Unknown', bg: '#6B728018', text: '#6B7280', dot: '#6B7280' };
};

const fmt = (val) => {
  if (!val || val === '-') return '—';
  // Try to prettify date strings like "2025-04-01"
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
    try {
      return new Date(val).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return val; }
  }
  return val;
};

// ─── Avatar circle from name initials ─────────────────────────────────────
const Avatar = ({ name, color, size = 36 }) => {
  const { theme } = useTheme();
  const initials = (name || '?')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color || `${theme.colors.primary}22`,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.36, fontWeight: '700', color: color ? '#fff' : theme.colors.primary }}>
        {initials}
      </Text>
    </View>
  );
};

// ─── Section header ────────────────────────────────────────────────────────
const Section = ({ icon: Icon, label, color, children }) => {
  const { theme } = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: `${color}18`, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={13} color={color} strokeWidth={2.2} />
        </View>
        <Text style={{ fontSize: 11, fontWeight: '800', color: theme.colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase' }}>
          {label}
        </Text>
      </View>
      {children}
    </View>
  );
};

// ─── Info row (bill/receipt style) ─────────────────────────────────────────
const InfoRow = ({ label, value, last = false }) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '500', color: theme.colors.textSecondary, flex: 1 }}>
        {label}
      </Text>
      <Text
        style={{ fontSize: 13, fontWeight: '600', color: theme.colors.text, maxWidth: '55%', textAlign: 'right' }}
        numberOfLines={2}
      >
        {fmt(value) || '—'}
      </Text>
    </View>
  );
};

// ─── Card wrapper ───────────────────────────────────────────────────────────
const Card = ({ children, style }) => {
  const { theme } = useTheme();
  return (
    <View
      style={[{
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }, style]}
    >
      {children}
    </View>
  );
};

// ─── Avatar colours pool ───────────────────────────────────────────────────
const AV_COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#14B8A6'];

export default function DashboardTab({ project: incomingProject, paramId, fetchProjectByIdProp }) {
  const { theme } = useTheme();
  const [projectState, setProjectState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [assigneesState, setAssigneesState] = useState([]);

  const STORAGE_PREFIX = '@WorkManagement:project:';
  const MAX_RETRIES = 3;

  const saveToCache = useCallback(async (project) => {
    try {
      const id = project?.project_id || project?.projectId || project?.id;
      if (!id) return;
      await AsyncStorage.setItem(`${STORAGE_PREFIX}${id}`, JSON.stringify(project));
    } catch (_) { }
  }, []);

  const loadFromCache = useCallback(async (id) => {
    try {
      const cached = await AsyncStorage.getItem(`${STORAGE_PREFIX}${id}`);
      return cached ? JSON.parse(cached) : null;
    } catch (_) { return null; }
  }, []);

  const fetchProject = useCallback(async (id) => {
    const res = typeof fetchProjectByIdProp === 'function'
      ? await fetchProjectByIdProp(id)
      : await getProjectDetails(id);
    const p = res?.project || res?.data || res || null;
    if (p) await saveToCache(p);
    return p;
  }, [fetchProjectByIdProp, saveToCache]);

  const fetchAssignees = useCallback(async (id) => {
    try {
      const res = await getProjectAssignedUsers(id);
      const list = res?.data || res || [];
      if (Array.isArray(list)) setAssigneesState(list);
    } catch (_) { }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (incomingProject) {
          const p = incomingProject.project || incomingProject;
          if (mounted) { setProjectState(p); setLoading(false); await saveToCache(p); }
          return;
        }
        if (!paramId) {
          if (mounted) { setLoading(false); setError('No project ID provided'); }
          return;
        }
        const cached = await loadFromCache(paramId);
        if (cached && mounted) {
          setProjectState(cached); setLoading(false);
          if (fetchProjectByIdProp) {
            const fresh = await fetchProject(paramId);
            if (fresh && mounted) setProjectState(fresh);
          }
          fetchAssignees(paramId);
          return;
        }
        const p = await fetchProject(paramId);
        if (mounted) {
          if (p) { setProjectState(p); setLoading(false); fetchAssignees(paramId); }
          else if (retryCount < MAX_RETRIES) setRetryCount(prev => prev + 1);
          else { setLoading(false); setError('Failed to fetch project after retries'); }
        }
      } catch (err) {
        if (mounted) { setLoading(false); setError(err.message || 'Error loading project'); }
      }
    })();
    return () => { mounted = false; };
  }, [paramId, incomingProject, fetchProjectByIdProp, retryCount, loadFromCache, fetchProject, saveToCache]);

  const project = projectState || {};

  const resolveAssignees = () => {
    for (const src of [
      incomingProject?.assignees,
      incomingProject?.project?.assignees,
      project?.assignees,
      project?.assigned_users,
      project?.assignedUsers,
      project?.assigned_to,
    ]) { if (Array.isArray(src) && src.length) return src; }
    return [];
  };

  const fallbackAssignees = resolveAssignees();
  const assignees = assigneesState?.length ? assigneesState : fallbackAssignees;

  // ─── Loading ────────────────────────────────────────────────────────────
  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: `${theme.colors.primary}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <ActivityIndicator color={theme.colors.primary} size="small" />
      </View>
      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>Loading project…</Text>
      <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 }}>Please wait a moment</Text>
    </View>
  );

  // ─── Error ───────────────────────────────────────────────────────────────
  if (error) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: `${theme.colors.error}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <AlertCircle size={26} color={theme.colors.error} strokeWidth={1.8} />
      </View>
      <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 4 }}>Unable to Load</Text>
      <Text style={{ fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' }}>{error}</Text>
      <TouchableOpacity
        onPress={() => { setError(null); setLoading(true); setRetryCount(0); }}
        style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: `${theme.colors.primary}15` }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} color={theme.colors.primary} strokeWidth={2} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.primary }}>Retry</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  // ─── Derived values ───────────────────────────────────────────────────────
  const name = project?.name || project?.title || project?.project_name || '—';
  const description = project?.description || project?.desc || '';
  const status = (project?.status || '').toString();
  const statusMeta = getStatus(status);
  const start = project?.start_date || project?.startDate || '';
  const end = project?.end_date || project?.endDate || '';
  const dueTime = project?.due_time || project?.dueTime || '';
  const createdBy = project?.assigned_by || project?.created_by || project?.owner || '';
  const assignedBy = project?.assigned_by || project?.assignedBy || '';
  const remarks = project?.remarks || '';
  const priority = project?.priority || '';
  const projectId = project?.project_id || project?.id || paramId || '';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
    >

      {/* ══════════ HERO CARD ══════════ */}
      <Card style={{ marginBottom: 14 }}>
        {/* Project icon + name + status badge */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <View style={{
            width: 48, height: 48, borderRadius: 14,
            backgroundColor: `${theme.colors.primary}18`,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Briefcase size={22} color={theme.colors.primary} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: theme.colors.text, lineHeight: 22 }} numberOfLines={2}>
              {name}
            </Text>
            {!!projectId && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <Hash size={11} color={theme.colors.textSecondary} strokeWidth={2} />
                <Text style={{ fontSize: 11, color: theme.colors.textSecondary, fontWeight: '500' }}>
                  {projectId}
                </Text>
              </View>
            )}
          </View>
          {/* Status badge */}
          <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: statusMeta.bg, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: statusMeta.dot }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: statusMeta.text }}>{statusMeta.label}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: theme.colors.border, marginHorizontal: -16, marginBottom: 14 }} />

        {/* Description */}
        {!!description ? (
          <View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
              Description
            </Text>
            <Text style={{ fontSize: 13.5, color: theme.colors.text, lineHeight: 20, fontWeight: '400' }}>
              {description}
            </Text>
          </View>
        ) : (
          <Text style={{ fontSize: 13, color: theme.colors.textSecondary, fontStyle: 'italic' }}>
            No description provided.
          </Text>
        )}
      </Card>

      {/* ══════════ PROJECT DETAILS CARD (bill style) ══════════ */}
      <Card>
        <Section icon={FileText} label="Project Details" color={theme.colors.primary}>
          <InfoRow label="Start Date" value={start} />
          <InfoRow label="End Date" value={end} />
          {!!dueTime && <InfoRow label="Due Time" value={dueTime} />}
          {!!priority && <InfoRow label="Priority" value={priority.replace(/_/g, ' ')} />}
          <InfoRow label="Created By" value={createdBy} />
          <InfoRow label="Assigned By" value={assignedBy} last={!remarks} />
          {!!remarks && <InfoRow label="Remarks" value={remarks} last />}
        </Section>
      </Card>

      {/* ══════════ TEAM CARD ══════════ */}
      <Card>
        <Section icon={Users} label="Team" color="#8B5CF6">
          {assignees.length === 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${theme.colors.textSecondary}15`, alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={18} color={theme.colors.textSecondary} strokeWidth={1.8} />
              </View>
              <Text style={{ fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500' }}>
                No assignees yet
              </Text>
            </View>
          ) : (
            assignees.map((item, idx) => {
              const memberName = item.user_name || item.userName || item.name || item.username || 'Unknown';
              const role = item.role || item.user_role || '';
              const avColor = AV_COLORS[idx % AV_COLORS.length];
              const isLast = idx === assignees.length - 1;
              return (
                <View
                  key={String(item.user_id ?? item.id ?? item.userId ?? idx)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 10,
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: theme.colors.border,
                  }}
                >
                  <Avatar name={memberName} color={avColor} size={38} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text }}>{memberName}</Text>
                    {!!role && (
                      <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2, fontWeight: '500' }}>{role}</Text>
                    )}
                  </View>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: `${avColor}18` }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: avColor }}>Member</Text>
                  </View>
                </View>
              );
            })
          )}
        </Section>
      </Card>

    </ScrollView>
  );
}