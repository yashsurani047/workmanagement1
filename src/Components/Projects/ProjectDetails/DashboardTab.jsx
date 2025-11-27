import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../../../Themes/Themes';
import { getProjectDetails } from '../../../Utils/apiUtils';
import { getProjectAssignedUsers } from '../../../Services/Project/FetchprojectUsers';

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value ?? '-'}</Text>
  </View>
);

export default function DashboardTab({ project: incomingProject, paramId, fetchProjectByIdProp }) {
  const [projectState, setProjectState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [assigneesState, setAssigneesState] = useState([]);

  const STORAGE_PREFIX = '@WorkManagement:project:';
  const MAX_RETRIES = 3;

  // Save project to AsyncStorage
  const saveToCache = useCallback(async (project) => {
    try {
      if (!project) return;
      const id = project.project_id || project.projectId || project.id;
      if (!id) return;
      await AsyncStorage.setItem(`${STORAGE_PREFIX}${id}`, JSON.stringify(project));
    } catch (e) {
      console.warn('Failed to save project to cache:', e.message);
    }
  }, []);

  // Load project from AsyncStorage
  const loadFromCache = useCallback(async (id) => {
    try {
      const cached = await AsyncStorage.getItem(`${STORAGE_PREFIX}${id}`);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (e) {
      console.warn('Failed to load project from cache:', e.message);
      return null;
    }
  }, []);

  // Fetch project with retry logic
  const fetchProject = useCallback(async (id) => {
    try {
      let res = null;
      if (typeof fetchProjectByIdProp === 'function') {
        res = await fetchProjectByIdProp(id);
      } else {
        res = await getProjectDetails(id);
      }
      const project = res?.project || res?.data || res || null;
      if (project) {
        await saveToCache(project);
        return project;
      }
      return null;
    } catch (err) {
      throw new Error(err.message || 'Failed to fetch project');
    }
  }, [fetchProjectByIdProp, saveToCache]);

  // Fetch assignees dynamically
  const fetchAssignees = useCallback(async (id) => {
    try {
      if (!id) return;
      const res = await getProjectAssignedUsers(id);
      const list = res?.data || res || [];
      if (Array.isArray(list)) setAssigneesState(list);
    } catch (_) {
      // silent fail; UI will fallback to project-level assignees
    }
  }, []);

  // Main data loading logic
  useEffect(() => {
    let mounted = true;

    async function initializeData() {
      try {
        // If incomingProject is provided, use it and cache it
        if (incomingProject) {
          const project = incomingProject.project || incomingProject;
          if (mounted) {
            setProjectState(project);
            setLoading(false);
            await saveToCache(project);
          }
          return;
        }

        // If no incomingProject but paramId is provided, try cache or fetch
        if (!paramId) {
          if (mounted) {
            setLoading(false);
            setError('No project ID provided');
          }
          return;
        }

        // Try loading from cache first
        const cachedProject = await loadFromCache(paramId);
        if (cachedProject && mounted) {
          setProjectState(cachedProject);
          setLoading(false);
          // Optionally fetch fresh data in the background
          if (fetchProjectByIdProp) {
            const freshProject = await fetchProject(paramId);
            if (freshProject && mounted) {
              setProjectState(freshProject);
              await saveToCache(freshProject);
            }
          }
          // Always refresh assignees in background
          fetchAssignees(paramId);
          return;
        }

        // If no cache, try fetching
        const project = await fetchProject(paramId);
        if (mounted) {
          if (project) {
            setProjectState(project);
            setLoading(false);
            // fetch assignees after successful project fetch
            fetchAssignees(paramId);
          } else if (retryCount < MAX_RETRIES) {
            setRetryCount(prev => prev + 1);
            setTimeout(() => initializeData(), 1000 * retryCount); // Exponential backoff
          } else {
            setLoading(false);
            setError('Failed to fetch project after retries');
          }
        }
        
      } catch (err) {
        if (mounted) {
          setLoading(false);
          setError(err.message || 'Error loading project');
        }
      }
    }

    initializeData();
    return () => { mounted = false; };
  }, [paramId, incomingProject, fetchProjectByIdProp, retryCount, loadFromCache, fetchProject, saveToCache]);

  // Normalize project fields
  const project = projectState || {};

  // Resolve assignees (unchanged)
  const resolveAssignees = () => {
    if (incomingProject?.assignees && Array.isArray(incomingProject.assignees) && incomingProject.assignees.length) return incomingProject.assignees;
    if (incomingProject?.project?.assignees && Array.isArray(incomingProject.project.assignees) && incomingProject.project.assignees.length) return incomingProject.project.assignees;
    if (project?.assignees && Array.isArray(project.assignees) && project.assignees.length) return project.assignees;
    if (project?.assigned_users && Array.isArray(project.assigned_users) && project.assigned_users.length) return project.assigned_users;
    if (project?.assignedUsers && Array.isArray(project.assignedUsers) && project.assignedUsers.length) return project.assignedUsers;
    if (project?.assigned_to && Array.isArray(project.assigned_to) && project.assigned_to.length) return project.assigned_to;
    return [];
  };

  const fallbackAssignees = resolveAssignees();
  const assignees = assigneesState && assigneesState.length ? assigneesState : fallbackAssignees;

  if (loading) return (
    <View style={[styles.wrapper, { padding: 18 }]}>
      <ActivityIndicator />
      <Text style={[styles.muted, { marginTop: 8 }]}>Loading project details...</Text>
    </View>
  );

  if (error) return (
    <View style={styles.wrapper}>
      <Text style={{ color: theme.colors.error }}>Error: {error}</Text>
    </View>
  );

  const status = (project?.status || '').toString();
  const description = project?.description || project?.desc || '';
  const start = project?.start_date || project?.startDate || '';
  const end = project?.end_date || project?.endDate || '';
  const createdBy = project?.assigned_by || project?.created_by || project?.owner || '';
  const assignedBy = project?.assigned_by || project?.assignedBy || (project?.assigned && project?.assigned.by) || '';

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        {!!description && (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.paragraph}>{description}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Summary</Text>
        <Row label="Name" value={project?.name || project?.title || '-'} />
        <Row label="Status" value={status || '-'} />
        <Row label="Start Date" value={start || '-'} />
        <Row label="End Date" value={end || '-'} />
        <Row label="Created By" value={createdBy || '-'} />
        <Row label="Assigned By" value={assignedBy || '-'} />

        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Assignees</Text>
          {assignees.length === 0 ? (
            <Text style={styles.paragraph}>No assignees</Text>
          ) : (
            <FlatList
              data={assignees}
              keyExtractor={(it, idx) => String(it.user_id ?? it.id ?? it.userId ?? idx)}
              renderItem={({ item }) => (
                <View style={styles.assigneeRow}>
                  <View style={styles.assigneeInfo}>
                    <Text style={styles.assigneeName}>{item.user_name || item.userName || item.name || item.username || 'Unknown'}</Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { padding: 12 },
  card: { backgroundColor: theme.colors.background, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  paragraph: { color: theme.colors.textSecondary, lineHeight: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  label: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
  value: { color: theme.colors.text, fontSize: 13, marginLeft: 16, flexShrink: 1, textAlign: 'right' },
  muted: { color: theme.colors.textSecondary },
  code: { fontFamily: 'Menlo', fontSize: 12, color: theme.colors.text },
  assigneeRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  assigneeInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  assigneeName: { color: theme.colors.text, fontWeight: '600' },
  assigneeMeta: { color: theme.colors.textSecondary, fontSize: 12 },
});