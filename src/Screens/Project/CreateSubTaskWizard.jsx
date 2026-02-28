// src/Screens/Project/CreateSubTaskWizard.jsx
import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import SubTaskWizardContainer from '../../Components/Projects/CreateSubTaskWizard/SubTaskWizardContainer';
import { addSubtask, uploadAttachments } from '../../Services/Project/FetchSubTask';

export default function CreateSubTaskWizardScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const {
    organizationId = 'one',
    initialTask = null,
    mode = 'create',
    parentTask = {},
    taskId: routeTaskId // Direct taskId from route params
  } = route.params || {};

  const insets = useSafeAreaInsets();

  const handleSubmit = async (formData) => {
    try {
      // Debug log to check the parentTask and formData
      console.log('Parent Task in handleSubmit:', parentTask);
      console.log('Form Data in handleSubmit:', formData);

      // Prepare subtask data for API
      const subtaskData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : '',
        is_full_day: formData.allDay ? 1 : 0,
        start_time: formData.allDay ? '' : (formData.startTime ? formData.startTime.toTimeString().slice(0, 8) : ''),
        end_time: formData.allDay ? '' : (formData.endTime ? formData.endTime.toTimeString().slice(0, 8) : ''),
        assigned_users: formData.assignees || [],
        links: formData.links || [],
        files: formData.attachments || [],
      };

      // Add subtask_id for edit mode
      if (mode === 'edit' && initialTask) {
        subtaskData.subtask_id = initialTask.task_id || initialTask.id;
      }

      // Get parent task ID with multiple fallbacks
      const parentTaskId = routeTaskId || parentTask?.id || parentTask?.task_id || formData.parentTaskId;

      if (!parentTaskId) {
        const errorMsg = 'No parent task ID provided. Cannot create subtask without a parent task.';
        console.error(errorMsg, {
          routeParams: route.params,
          parentTask,
          formData,
          routeTaskId
        });
        Alert.alert('Error', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('Creating subtask with parent ID:', parentTaskId, 'from source:', {
        routeTaskId,
        parentTaskId: parentTask?.id || parentTask?.task_id,
        formDataParentTaskId: formData.parentTaskId
      });

      // Ensure we have a valid parent task ID
      if (typeof parentTaskId !== 'string') {
        const errorMsg = `Invalid parent task ID type: ${typeof parentTaskId}. Expected string.`;
        console.error(errorMsg, { parentTaskId });
        Alert.alert('Error', errorMsg);
        throw new Error(errorMsg);
      }

      // Call addSubtask API with the verified parent task ID
      console.log('Calling addSubtask with:', { parentTaskId, subtaskData });
      const result = await addSubtask(parentTaskId, subtaskData);

      if (result.success) {
        // Upload attachments if present
        if (formData.attachments && formData.attachments.length > 0) {
          const userId = sessionStorage.getItem('user_id') || 'default_user';
          const uploadResult = await uploadAttachments(result.subtask_id, formData.attachments, userId);
          if (!uploadResult.success) {
            console.warn('Failed to upload attachments:', uploadResult.error);
            Alert.alert(
              'Warning',
              'Subtask created successfully but some attachments failed to upload.',
              [{ text: 'OK' }]
            );
          }
        }
        Alert.alert(
          'Success',
          result.message || `Subtask ${mode === 'edit' ? 'updated' : 'created'} successfully!`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert(
          'Error',
          result.error || `Failed to ${mode === 'edit' ? 'update' : 'create'} subtask`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error submitting subtask:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };


  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View
        style={[
          styles.screen,
          {
            paddingBottom: insets.bottom || 16, // graceful fallback
          },
        ]}
      >
        <SubTaskWizardContainer
          organizationId={organizationId}
          onSubmit={handleSubmit}
          initialTask={initialTask}
          mode={mode}
          navigation={navigation}
          parentTask={parentTask}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
