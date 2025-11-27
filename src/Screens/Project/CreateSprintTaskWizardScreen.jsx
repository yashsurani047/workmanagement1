// src/Screens/Project/CreateSprintTaskWizardScreen.jsx
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import TopNavbar from '../../Components/Common/Topnavbar';
import SprintWizardContainer from '../../Components/Projects/CreateSprintTaskWizard/SprintWizardContainer';
import theme from '../../Themes/Themes';
import { createSprintTask } from '../../Services/Project/FetchSprintTask';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CreateSprintTaskWizardScreen({ route, navigation }) {
  const projectId = route?.params?.projectId;
  const [organizationId, setOrganizationId] = React.useState(route?.params?.organizationId || '');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (organizationId) return;
      try {
        const raw = await AsyncStorage.getItem('userInfo');
        const info = raw ? JSON.parse(raw) : null;
        if (mounted && info?.organization_id) setOrganizationId(String(info.organization_id));
      } catch (_) {}
      if (mounted && !organizationId) setOrganizationId('one');
    })();
    return () => { mounted = false; };
  }, [organizationId]);

  const handleSubmit = async ({ project, title, description, extras }) => {
    if (submitting) return;
    try {
      const taskData = {
        project_id: project?.id || project?.project_id || projectId,
        project_name: project?.name || project?.title || '',
        title,
        description,
        tags: extras?.tags || [],
        attachments: extras?.attachments || [],
        remarks: extras?.remarks || '',
      };
      if (!taskData.project_id) {
        Toast.show({ type: 'custom_error', text1: 'Please select a project' });
        return;
      }
      if (!taskData.title?.trim()) {
        Toast.show({ type: 'custom_error', text1: 'Please enter a title' });
        return;
      }
      if (!taskData.description?.trim()) {
        Toast.show({ type: 'custom_error', text1: 'Please enter a description' });
        return;
      }
      if (!organizationId) {
        Toast.show({ type: 'custom_error', text1: 'Missing organization. Please try again.' });
        return;
      }

      setSubmitting(true);
      await createSprintTask(organizationId, taskData);
      Toast.show({ type: 'custom_success', text1: 'Sprint task created', position: 'bottom', visibilityTime: 2000 });
      // Give the toast time to show before navigating back
      setTimeout(() => navigation?.goBack?.(), 1200);
    } catch (e) {
      console.log('Create sprint task error:', e?.message || e);
      Toast.show({ type: 'custom_error', text1: e?.message || 'Failed to create sprint task', position: 'bottom', visibilityTime: 2500 });
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <TopNavbar title="Create Sprint Task" />
      <View style={styles.container}>
        <SprintWizardContainer initialProjectId={projectId} onSubmit={handleSubmit} submitting={submitting} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1 },
});
