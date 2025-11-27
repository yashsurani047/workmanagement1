// src/Screens/CreateTaskWizardScreen.jsx
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import TopNavbar from '../../Components/Common/Topnavbar';
import WizardContainer from '../../Components/Projects/CreateTaskWizard/WizardContainer';
import theme from '../../Themes/Themes';
import { createTask } from '../../Services/Project/FetchProjectTask';

export default function CreateTaskWizardScreen({ route, navigation }) {
  const mode = route?.params?.mode;
  const title = mode === 'sprint' ? 'Create Sprint Task' : 'Create New Task';
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);

      // Format date/time
      const formatDate = (date) => date ? new Date(date).toISOString().split('T')[0] : '';
      const formatTime = (date) => date ? new Date(date).toISOString().split('T')[1].slice(0, 8) : '';

      // Prepare API payload
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

      console.log("Sending task data:", taskData);

      const result = await createTask(taskData);

      if (result.success) {
        Alert.alert('Success', 'Task created successfully!');
        navigation.goBack();
      } else {
        throw new Error(result.error || 'Failed to create task');
      }

    } catch (error) {
      console.error('Create Task Error:', error);
      Alert.alert('Error', error.message || 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <TopNavbar title={title} />
      <View style={styles.container}>
        <WizardContainer onSubmit={handleSubmit} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1 },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
