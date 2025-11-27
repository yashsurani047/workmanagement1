// src/Components/CreateTaskWizard/WizardContainer.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import theme from '../../../Themes/Themes';
import StepTaskDetails from './StepTaskDetails';
import StepAssignment from './StepAssignment';
import StepExtras from './StepExtras';

const steps = ['Task Details', 'Assignment', 'Extras'];

export default function WizardContainer({ organizationId = 'one', onSubmit }) {
  const [step, setStep] = React.useState(0);
  
  // Form state
  const [formData, setFormData] = React.useState({
    project: null,
    title: '',
    description: '',
    priority: 'urgent_important',
    dueDate: null,
    allDay: false,
    startTime: null,
    endTime: null,
    assignees: [],
    tags: [],
    remarks: '',
    attachments: []
  });

  const updateFormData = (updates) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

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
          <StepTaskDetails
            organizationId={organizationId}
            selectedProject={formData.project}
            onSelectProject={(project) => updateFormData({ project })}
            onNext={goNext}
            formData={formData}
            updateFormData={updateFormData}
          />
        )}
        {step === 1 && (
          <StepAssignment
            projectId={formData.project?.id}
            selectedAssignees={formData.assignees}
            onChangeAssignees={(assignees) => updateFormData({ assignees })}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 2 && (
          <StepExtras
            value={{ tags: formData.tags, remarks: formData.remarks }}
            onChange={(updates) => updateFormData(updates)}
            onBack={goBack}
            onCreate={() => onSubmit?.(formData)}
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
