// src/Screens/Project/CreateTaskWizardScreen.jsx
import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  Alert,
  Animated,
  Easing,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useTheme } from '../../Themes/ThemeContext';
import WizardContainer from '../../Components/Projects/CreateTaskWizard/WizardContainer';
import { createTask, updateTask } from '../../Services/Project/FetchProjectTask';
import { ChevronLeft, ClipboardList, Loader } from 'lucide-react-native';

export default function CreateTaskWizardScreen({ route, navigation }) {
  const { theme } = useTheme();
  const mode = route?.params?.mode || 'create';
  const initialTask = route?.params?.task || null;
  const [isLoading, setIsLoading] = useState(false);

  const screenTitle = mode === 'edit'
    ? 'Edit Task'
    : mode === 'sprint'
      ? 'Create Sprint Task'
      : 'Create New Task';

  const subtitle = mode === 'edit'
    ? 'Update this task details'
    : 'Fill in the details to add a new task';

  // Loading spinner rotation
  const spinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isLoading) {
      spinAnim.setValue(0);
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1, duration: 1000,
          easing: Easing.linear, useNativeDriver: true,
        })
      ).start();
    }
  }, [isLoading]);

  const spinRotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);

      const formatDate = (date) => {
        if (!date) return '';
        try {
          const d = new Date(date);
          return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
        } catch { return ''; }
      };
      const formatTime = (date) => {
        if (!date) return '';
        try {
          const d = new Date(date);
          return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[1].slice(0, 8);
        } catch { return ''; }
      };

      const taskData = {
        project_id: formData.project?.id || '',
        project_name: formData.project?.name || '',
        title: formData.title || 'Untitled Task',
        description: formData.description || '',
        priority: formData.priority || 'medium',
        assigned_to: formData.assignees?.map(u => u.id) || [],
        due_date: formatDate(formData.dueDate),
        start_time: formatTime(formData.startTime),
        end_time: formatTime(formData.endTime),
        all_day: formData.allDay || false,
        tags: formData.tags || [],
        remarks: formData.remarks || '',
        attachments: formData.attachments || [],
      };

      let result;
      if (mode === 'edit' && formData.taskId) {
        result = await updateTask('one', formData.taskId, taskData);
      } else {
        result = await createTask(taskData);
      }

      if (result.success) {
        Alert.alert('Success', mode === 'edit' ? 'Task updated successfully!' : 'Task created successfully!');
        navigation.goBack();
      } else {
        throw new Error(result.error || `Failed to ${mode === 'edit' ? 'update' : 'create'} task`);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── Loading overlay ──────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: `${theme.colors.primary}12`, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Animated.View style={{ transform: [{ rotate: spinRotation }] }}>
              <Loader size={32} color={theme.colors.primary} strokeWidth={2} />
            </Animated.View>
          </View>
          <Text style={{ fontSize: 17, fontWeight: '700', color: theme.colors.text, letterSpacing: -0.3 }}>
            {mode === 'edit' ? 'Updating Task…' : 'Creating Task…'}
          </Text>
          <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 6 }}>
            Please wait a moment
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ─── Main screen ──────────────────────────────────────────────────── */
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* ── Wizard content ── */}
      <WizardContainer
        onSubmit={handleSubmit}
        initialTask={initialTask}
        mode={mode}
      />
    </View>
  );
}
