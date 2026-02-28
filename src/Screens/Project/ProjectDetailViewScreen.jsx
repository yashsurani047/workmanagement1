// src/Screens/Project/ProjectDetailViewScreen.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Easing,
  StatusBar,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../Themes/ThemeContext';
import { getProjectDetails } from '../../Utils/apiUtils';
import {
  Gauge,
  List,
  Rocket,
  Plus,
  ChevronLeft,
  ClipboardList,
  GitBranch,
  X,
  Briefcase,
} from 'lucide-react-native';
import DashboardTab from '../../Components/Projects/ProjectDetails/DashboardTab';
import TasksTab from '../../Components/Projects/ProjectDetails/TasksTab';
import SprintTab from '../../Components/Projects/ProjectDetails/SprintTab';

/* ──────────────────── Status Config ──────────────────── */

const STATUS_CONFIG = {
  'not started': { icon: '⏳', color: '#94A3B8' },
  pending: { icon: '🔄', color: '#F59E0B' },
  'in progress': { icon: '⚡', color: '#3B82F6' },
  completed: { icon: '✅', color: '#22C55E' },
  done: { icon: '✅', color: '#22C55E' },
  cancelled: { icon: '❌', color: '#EF4444' },
  on_hold: { icon: '⏸️', color: '#8B5CF6' },
  'on hold': { icon: '⏸️', color: '#8B5CF6' },
};

/* ──────────────────── Tab Button ──────────────────── */

const TabButton = ({ active, icon: Icon, label, onPress, theme }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 300, friction: 12, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          paddingVertical: 10,
          paddingHorizontal: 8,
          borderRadius: 12,
          backgroundColor: active ? theme.colors.primary : 'transparent',
          ...(active ? {
            shadowColor: theme.colors.primary,
            shadowOpacity: 0.25,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            elevation: 4,
          } : {}),
        }}
      >
        <Icon
          size={18}
          color={active ? '#FFFFFF' : theme.colors.tabInactive}
          strokeWidth={active ? 2.2 : 1.8}
        />
        <Text
          style={{
            fontSize: 13,
            fontWeight: active ? '700' : '500',
            color: active ? '#FFFFFF' : theme.colors.tabInactive,
            letterSpacing: 0.1,
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ──────────────────── FAB Menu Item ──────────────────── */

const FabMenuItem = ({ label, icon: Icon, onPress, theme, delay = 0 }) => {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 250, delay,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 250, delay,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 14,
          backgroundColor: theme.colors.muted100,
          marginBottom: 8,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: `${theme.colors.primary}15`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={18} color={theme.colors.primary} strokeWidth={2} />
        </View>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '600',
            color: theme.colors.text,
            flex: 1,
          }}
        >
          {label}
        </Text>
        <ChevronLeft
          size={14}
          color={theme.colors.textSecondary}
          style={{ transform: [{ rotate: '180deg' }] }}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ──────────────────── Main Screen ──────────────────── */

const ProjectDetails = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const passedProject = route?.params?.project || null;
  const paramId =
    route?.params?.projectId ||
    passedProject?.id ||
    passedProject?._id ||
    passedProject?.project_id ||
    passedProject?.projectId;

  const [project, setProject] = useState(passedProject || null);
  const [loading, setLoading] = useState(!passedProject);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showFabMenu, setShowFabMenu] = useState(false);



  const load = useCallback(async () => {
    if (!paramId) return;
    try {
      setLoading(true);
      const res = await getProjectDetails(paramId);
      const details = res?.project || res?.data || res;
      setProject(details);
    } catch (_) { }
    finally {
      setLoading(false);
    }
  }, [paramId]);

  useEffect(() => {
    if (!passedProject) load();
  }, [load, passedProject]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('userId');
        if (stored) {
          return setCurrentUserId(String(stored));
        }
        const infoRaw = await AsyncStorage.getItem('userInfo');
        const info = infoRaw ? JSON.parse(infoRaw) : null;
        if (info?.user_id) setCurrentUserId(String(info.user_id));
      } catch (_) { }
    })();
  }, []);

  const title = project?.name || project?.title || 'Project Details';
  const status = (project?.status || '').toString().toLowerCase();
  const effectiveProjectId = project?.project_id || project?.id || paramId;
  const statusCfg = STATUS_CONFIG[status] || { icon: '●', color: theme.colors.primary };

  const canManageProject =
    currentUserId &&
    String(currentUserId) === String(project?.assigned_by_user_id);

  // FAB spin animation
  const fabRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fabRotate, {
      toValue: showFabMenu ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [showFabMenu]);

  const fabRotation = fabRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
      />

      {/* ──────── Colourful App Bar ──────── */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.primary }}>
        <View
          style={{
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 18,
            borderBottomLeftRadius: 22,
            borderBottomRightRadius: 22,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>

            {/* Back */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: 'rgba(255,255,255,0.18)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Icon */}
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: 'rgba(255,255,255,0.18)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Briefcase size={18} color="#FFFFFF" strokeWidth={2} />
            </View>

            {/* Title + subtitle */}
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.1 }}
                numberOfLines={1}
              >
                {title}
              </Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', fontWeight: '500', marginTop: 1 }}>
                Project Details
              </Text>
            </View>

            {/* Status pill */}
            {!!status && (
              <View style={{
                paddingHorizontal: 10, paddingVertical: 5,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.18)',
                flexDirection: 'row', alignItems: 'center', gap: 5,
              }}>
                <Text style={{ fontSize: 11 }}>{statusCfg.icon}</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>
                  {status.replace(/\b\w/g, (c) => c.toUpperCase())}
                </Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* ──────── Tab bar ──────── */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 10,
          backgroundColor: theme.colors.background,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: theme.colors.muted100,
            borderRadius: 16,
            padding: 4,
            gap: 4,
          }}
        >
          <TabButton
            active={activeTab === 'dashboard'}
            icon={Gauge} label="Dashboard"
            onPress={() => setActiveTab('dashboard')} theme={theme}
          />
          <TabButton
            active={activeTab === 'tasks'}
            icon={List} label="Tasks"
            onPress={() => setActiveTab('tasks')} theme={theme}
          />
          <TabButton
            active={activeTab === 'sprint'}
            icon={Rocket} label="Sprint"
            onPress={() => setActiveTab('sprint')} theme={theme}
          />
        </View>
      </View>

      {/* ──────── Tab Content ──────── */}
      {activeTab === 'tasks' && (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}>
          <TasksTab projectId={effectiveProjectId} />
        </View>
      )}

      {activeTab === 'sprint' && (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}>
          <SprintTab projectId={effectiveProjectId} />
        </View>
      )}

      {activeTab === 'dashboard' && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
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
        >
          <DashboardTab project={project} loading={loading} paramId={effectiveProjectId} />
        </ScrollView>
      )}

      {/* ──────── FAB ──────── */}
      {activeTab === 'dashboard' && (
        <>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setShowFabMenu(!showFabMenu)}
            style={{
              position: 'absolute',
              right: 20,
              bottom: 40,
              width: 58,
              height: 58,
              borderRadius: 18,
              backgroundColor: theme.colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: theme.colors.primary,
              shadowOpacity: 0.35,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 10,
            }}
          >
            <Animated.View style={{ transform: [{ rotate: fabRotation }] }}>
              <Plus color="#FFFFFF" size={24} strokeWidth={2.5} />
            </Animated.View>
          </TouchableOpacity>

          {/* FAB Menu Modal */}
          <Modal
            visible={showFabMenu}
            transparent
            animationType="fade"
            onRequestClose={() => setShowFabMenu(false)}
          >
            <TouchableWithoutFeedback onPress={() => setShowFabMenu(false)}>
              <View style={{ flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' }}>
                <TouchableWithoutFeedback>
                  <View
                    style={{
                      backgroundColor: theme.colors.card,
                      borderTopLeftRadius: 24,
                      borderTopRightRadius: 24,
                      paddingHorizontal: 20,
                      paddingTop: 14,
                      paddingBottom: 40,
                    }}
                  >
                    {/* Handle bar */}
                    <View
                      style={{
                        height: 5, width: 44,
                        backgroundColor: theme.colors.border,
                        alignSelf: 'center',
                        borderRadius: 3,
                        marginBottom: 20,
                      }}
                    />

                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: '800',
                        color: theme.colors.text,
                        letterSpacing: -0.3,
                        marginBottom: 6,
                      }}
                    >
                      Create New
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: theme.colors.textSecondary,
                        marginBottom: 20,
                      }}
                    >
                      Choose what you'd like to add to this project
                    </Text>

                    {/* Create Task */}
                    <FabMenuItem
                      label="Create Task"
                      icon={ClipboardList}
                      delay={0}
                      theme={theme}
                      onPress={() => {
                        setShowFabMenu(false);
                        navigation.navigate('CreateTaskWizard', { projectId: effectiveProjectId });
                      }}
                    />

                    {/* Create Sprint Task */}
                    <FabMenuItem
                      label="Create Sprint Task"
                      icon={Rocket}
                      delay={80}
                      theme={theme}
                      onPress={() => {
                        setShowFabMenu(false);
                        navigation.navigate('CreateSprintTaskWizard', { projectId: effectiveProjectId });
                      }}
                    />

                    {/* Create Sub Task */}
                    <FabMenuItem
                      label="Create Sub Task"
                      icon={GitBranch}
                      delay={160}
                      theme={theme}
                      onPress={() => {
                        setShowFabMenu(false);
                        navigation.navigate('CreateSubTaskWizard', { projectId: effectiveProjectId });
                      }}
                    />

                    {/* Cancel */}
                    <TouchableOpacity
                      onPress={() => setShowFabMenu(false)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        paddingVertical: 14,
                        borderRadius: 14,
                        borderWidth: 1.5,
                        borderColor: theme.colors.border,
                        marginTop: 8,
                      }}
                    >
                      <X size={16} color={theme.colors.textSecondary} />
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '600',
                          color: theme.colors.textSecondary,
                        }}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
};

export default ProjectDetails;
