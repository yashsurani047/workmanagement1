// src/Components/Projects/CreateSprintTaskWizard/SprintWizardContainer.jsx
import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Text } from 'react-native';
import theme from '../../../Themes/Themes';
import SprintStepTaskDetails from './SprintStepTaskDetails';
import SprintStepExtras from './SprintStepExtras';

const steps = ['Task Details', 'Additional Details'];

export default function SprintWizardContainer({ organizationId = 'one', onSubmit, initialProjectId, submitting = false }) {
  const [step, setStep] = React.useState(0);
  const [selectedProject, setSelectedProject] = React.useState(null);
  const [extras, setExtras] = React.useState({ tags: [], remarks: '', attachments: [] });
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');

  const goNext = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <View style={styles.wrapper}>
      <View style={styles.topTabs}>
        {steps.map((label, idx) => (
          <View key={label} style={{ flex: 1 }}>
            <TouchableOpacity
              onPress={() => setStep(idx)}
              activeOpacity={0.8}
              style={[styles.topTab, idx === step && styles.topTabActive]}
            >
              <Text style={[styles.topTabText, idx === step && styles.topTabTextActive]}>{label}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.content}>
        {step === 0 && (
          <SprintStepTaskDetails
            organizationId={organizationId}
            selectedProject={selectedProject}
            onSelectProject={setSelectedProject}
            initialProjectId={initialProjectId}
            title={title}
            description={description}
            setTitle={setTitle}
            setDescription={setDescription}
            onNext={goNext}
          />
        )}
        {step === 1 && (
          <SprintStepExtras
            value={extras}
            onChange={setExtras}
            onBack={goBack}
            submitting={submitting}
            canCreate={!!selectedProject && !!title?.trim() && !!description?.trim()}
            onCreate={() => onSubmit?.({ project: selectedProject, title, description, extras, type: 'sprint_task' })}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, marginTop: 0, paddingTop: Platform.OS === 'android' ? 6 : 2 },
  topTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 0,
    height: 44,
    alignItems: 'center',
    zIndex: 2,
    elevation: 2,
  },
  topTab: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    color: theme.colors.text,
  },
  topTabActive: { borderBottomWidth: 2, borderBottomColor: theme.colors.primary, backgroundColor: theme.colors.background },
  topTabText: { color: theme.colors.text, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  topTabTextActive: { color: theme.colors.primary },
  content: { flex: 1, padding: 16 },
});
