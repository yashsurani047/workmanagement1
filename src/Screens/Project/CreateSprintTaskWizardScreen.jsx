// src/Screens/Project/CreateSprintTaskWizardScreen.jsx
import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  Animated,
  Easing,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useTheme } from '../../Themes/ThemeContext';
import Toast from 'react-native-toast-message';
import SprintWizardContainer from '../../Components/Projects/CreateSprintTaskWizard/SprintWizardContainer';
import { createSprintTask } from '../../Services/Project/FetchSprintTask';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, ListTodo, Loader } from 'lucide-react-native';

export default function CreateSprintTaskWizardScreen({ route, navigation }) {
  const { theme } = useTheme();
  const projectId = route?.params?.projectId;
  const [organizationId, setOrganizationId] = useState(route?.params?.organizationId || '');
  const [submitting, setSubmitting] = useState(false);

  // Spinner rotation for loading state
  const spinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (submitting) {
      spinAnim.setValue(0);
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true })
      ).start();
    }
  }, [submitting]);
  const spinRotation = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // Load org id from storage if not passed
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (organizationId) return;
      try {
        const raw = await AsyncStorage.getItem('userInfo');
        const info = raw ? JSON.parse(raw) : null;
        if (mounted && info?.organization_id) setOrganizationId(String(info.organization_id));
      } catch (_) { }
      if (mounted && !organizationId) setOrganizationId('one');
    })();
    return () => { mounted = false; };
  }, [organizationId]);

  const handleSubmit = async ({ title, description, extras }) => {
    if (submitting) return;
    try {
      if (!title?.trim()) {
        Toast.show({ type: 'error', text1: 'Please enter a title' });
        return;
      }
      if (!organizationId) {
        Toast.show({ type: 'error', text1: 'Missing organization. Please try again.' });
        return;
      }
      setSubmitting(true);
      const taskData = {
        project_id: projectId,
        title,
        description,
        priority: extras?.priority || '',
        attachments: extras?.attachments || [],
        remarks: extras?.remarks || '',
      };
      await createSprintTask(organizationId, taskData);
      Toast.show({ type: 'success', text1: 'Sprint task created', position: 'bottom', visibilityTime: 2000 });
      setTimeout(() => navigation?.goBack?.(), 1200);
    } catch (e) {
      Toast.show({ type: 'error', text1: e?.message || 'Failed to create sprint task', position: 'bottom', visibilityTime: 2500 });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Submitting overlay ───────────────────────────────────────────────────
  if (submitting) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
        <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: `${theme.colors.primary}12`, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Animated.View style={{ transform: [{ rotate: spinRotation }] }}>
              <Loader size={32} color={theme.colors.primary} strokeWidth={2} />
            </Animated.View>
          </View>
          <Text style={{ fontSize: 17, fontWeight: '700', color: theme.colors.text, letterSpacing: -0.3 }}>
            Creating Sprint Task…
          </Text>
          <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 6 }}>
            Please wait a moment
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      {/* ════════════ COLORFUL APP BAR ════════════ */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
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
          {/* Row: back + icon + title */}
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
              <ListTodo size={19} color="#FFFFFF" strokeWidth={2} />
            </View>

            {/* Titles */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.1 }}>
                Create Sprint Task
              </Text>
              <Text style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.72)', fontWeight: '500', marginTop: 1 }}>
                Add a new task to your sprint
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* ════════════ FORM CONTENT ════════════ */}
      <View style={{ flex: 1 }}>
        <SprintWizardContainer
          initialProjectId={projectId}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </View>
    </View>
  );
}
