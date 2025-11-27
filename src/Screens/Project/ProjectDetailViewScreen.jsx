// src/Screens/ProjectDetails.jsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import theme from '../../Themes/Themes';
import { getProjectDetails } from '../../Utils/apiUtils';
import { Gauge, List, Rocket, Plus, ChevronLeft} from 'lucide-react-native';
import DashboardTab from '../../Components/Projects/ProjectDetails/DashboardTab';
import TasksTab from '../../Components/Projects/ProjectDetails/TasksTab';
import SprintTab from '../../Components/Projects/ProjectDetails/SprintTab';

const ProjectDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const passedProject = route?.params?.project || null;
  const paramId = route?.params?.projectId || passedProject?.id || passedProject?._id || passedProject?.project_id || passedProject?.projectId;

  const [project, setProject] = React.useState(passedProject || null);
  const [loading, setLoading] = React.useState(!passedProject);
  const [refreshing, setRefreshing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [currentUserId, setCurrentUserId] = React.useState(null);
  const [showFabMenu, setShowFabMenu] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!paramId) return;
    try {
      setLoading(true);
      const res = await getProjectDetails(paramId);
      // API shape may vary; prefer res.project or res.data then fallback to res
      const details = res?.project || res?.data || res;
      setProject(details);
    } catch (e) {
      // keep previous state; optionally log
    } finally {
      setLoading(false);
    }
  }, [paramId]);

  React.useEffect(() => {
    if (!passedProject) load();
  }, [load, passedProject]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('userId');
        if (mounted && stored) {
          setCurrentUserId(String(stored));
          return;
        }
        const infoRaw = await AsyncStorage.getItem('userInfo');
        const info = infoRaw ? JSON.parse(infoRaw) : null;
        if (mounted && info?.user_id) setCurrentUserId(String(info.user_id));
      } catch (_) {}
    })();
    return () => { mounted = false; };
  }, []);

  const title = project?.name || project?.title || 'Project Details';
  const status = (project?.status || '').toString();
  const effectiveProjectId = project?.project_id || project?.id || paramId;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}> 
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {!!status && (
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{status.replace(/\b\w/g, (c) => c.toUpperCase())}</Text>
          </View>
        )}
      </View>

      <View style={styles.tabsBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'dashboard' && styles.activeTabItem]}
          onPress={() => setActiveTab('dashboard')}
          activeOpacity={0.8}
        >
          <Gauge
            size={22}
            color={activeTab === 'dashboard' ? theme.colors.primary : theme.colors.tabInactive}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'tasks' && styles.activeTabItem]}
          onPress={() => setActiveTab('tasks')}
          activeOpacity={0.8}
        >
          <List
            size={22}
            color={activeTab === 'tasks' ? theme.colors.primary : theme.colors.tabInactive}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'sprint' && styles.activeTabItem]}
          onPress={() => setActiveTab('sprint')}
          activeOpacity={0.8}
        >
          <Rocket
            size={22}
            color={activeTab === 'sprint' ? theme.colors.primary : theme.colors.tabInactive}
          />
        </TouchableOpacity>
      </View>

      {activeTab === 'tasks' && (
        <View style={{ flex: 1, padding: 16 }}>
          <TasksTab projectId={effectiveProjectId} />
        </View>
      )}
      {activeTab === 'sprint' && (
        <View style={{ flex: 1, padding: 16 }}>
          <SprintTab projectId={effectiveProjectId} />
        </View>
      )}
      {activeTab === 'dashboard' && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                try {
                  setRefreshing(true);
                  await load();
                } finally {
                  setRefreshing(false);
                }
              }}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          <DashboardTab project={project} loading={loading} paramId={effectiveProjectId} />
        </ScrollView>
      )}

      {activeTab === 'dashboard' && (
        <>
          <TouchableOpacity
            style={styles.fab}
            activeOpacity={0.9}
            onPress={() => setShowFabMenu(true)}
          >
            <Plus color={theme.colors.white} size={22} />
          </TouchableOpacity>

          {showFabMenu && (
            <>
              <TouchableOpacity style={styles.fabMenuBackdrop} activeOpacity={1} onPress={() => setShowFabMenu(false)} />
              <View style={styles.fabMenuContainer}>
                {currentUserId && String(currentUserId) === String(project?.assigned_by_user_id) && (
                  <TouchableOpacity
                    style={styles.fabMenuItem}
                    activeOpacity={0.8}
                    onPress={() => {
                      setShowFabMenu(false);
                      navigation.navigate('CreateTaskWizard', { projectId: effectiveProjectId });
                    }}
                  >
                    <Text style={styles.fabMenuText}>Create Task</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.fabMenuItem}
                  activeOpacity={0.8}
                  onPress={() => {
                    setShowFabMenu(false);
                    navigation.navigate('CreateSprintTaskWizard', { projectId: effectiveProjectId });
                  }}
                >
                  <Text style={styles.fabMenuText}>Create Sprint Task</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
   backButton: {
    padding: 4,
    marginRight: 8,
  },
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: { 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    backgroundColor: theme.colors.background, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: theme.colors.text,
    flex: 1,
  },
  statusPill: { alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: `${theme.colors.primary}20` },
  statusText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
  tabsBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.background },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  activeTabItem: { borderBottomWidth: 2, borderBottomColor: theme.colors.primary },
  content: { padding: 16 },
  placeholder: { height: 200 },
  fab: { position: 'absolute', right: 16, bottom: 120, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: theme.colors.shadow, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  fabMenuBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.overlayLight },
  fabMenuContainer: { position: 'absolute', right: 16, bottom: 184, minWidth: 200, backgroundColor: theme.colors.background, borderRadius: 12, paddingVertical: 8, elevation: 8, shadowColor: theme.colors.shadow, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, borderWidth: 1, borderColor: theme.colors.border },
  fabMenuItem: { paddingVertical: 12, paddingHorizontal: 14 },
  fabMenuText: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
});

export default ProjectDetails;
