// src/Components/Projects/CreateSubTaskWizard/SubTaskWizardContainer.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../Themes/ThemeContext';
import { FileText, Paperclip, ChevronLeft, X, Check } from 'lucide-react-native';
import StepBasicInfo from './StepBasicInfo';
import StepResourcesFiles from './StepResourcesFiles';

const STEPS = [
  { key: 'details', label: 'Subtask Details', icon: FileText },
  { key: 'resources', label: 'Resources', icon: Paperclip },
];

export default function SubTaskWizardContainer({
  organizationId = 'one',
  onSubmit,
  initialTask = null,
  mode = 'create',
  navigation,
  parentTask,
}) {
  const { theme } = useTheme();
  const [step, setStep] = useState(0);

  const safeCreateDate = (dateValue) => {
    if (!dateValue) return null;
    try {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : date;
    } catch (e) {
      return null;
    }
  };

  const [formData, setFormData] = useState({
    title: initialTask?.title || '',
    description: initialTask?.description || '',
    status: initialTask?.status || 'not_started',
    priority: initialTask?.priority || 'urgent_important',
    dueDate: safeCreateDate(initialTask?.due_date),
    allDay: initialTask?.all_day === '1' || initialTask?.all_day === true || false,
    startTime: safeCreateDate(initialTask?.start_time),
    endTime: safeCreateDate(initialTask?.end_time),
    assignees: Array.isArray(initialTask?.assigned_to) ? initialTask.assigned_to : [],
    links: Array.isArray(initialTask?.links) ? initialTask.links : [],
    attachments: Array.isArray(initialTask?.attachments) ? initialTask.attachments : [],
    taskId: initialTask?.task_id || initialTask?.id || null,
  });

  const updateFormData = (updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  // Progress bar animation
  const progressAnim = useRef(new Animated.Value((step + 1) / STEPS.length)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (step + 1) / STEPS.length,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [step]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
        {/* ─── Colored App Bar ─── */}
        <View style={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 15,
          backgroundColor: theme.colors.primary,

          borderBottomLeftRadius: 35,
          borderBottomRightRadius: 35,
          marginTop: 0, // Margin to show top radius
        }}>
          {/* Title row with Badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 }}>
                {mode === 'edit' ? 'Update Subtask' : 'New Subtask'}
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600', marginTop: 0 }}>
                Step {step + 1} of {STEPS.length}
              </Text>
            </View>

            {/* Step badge */}
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.18)',
              borderRadius: 22,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.25)',
            }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFF' }}>
                {step + 1}/{STEPS.length}
              </Text>
            </View>
          </View>

          {/* Progress Bar inside App Bar */}
          <View style={{ height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' }}>
            <Animated.View style={{
              height: '100%', borderRadius: 2.5, backgroundColor: '#FFF',
              width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
            }} />
          </View>
        </View>
      </SafeAreaView>

      {/* ─── Step Indicator Pills ─── */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        gap: 10,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}>
        {STEPS.map((s, idx) => {
          const active = idx === step;
          const passed = idx < step;
          const Icon = s.icon;
          return (
            <TouchableOpacity key={s.key} onPress={() => setStep(idx)} activeOpacity={0.8} style={{
              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
              paddingVertical: 9, borderRadius: 12,
              backgroundColor: active ? theme.colors.primary : passed ? `${theme.colors.primary}15` : theme.colors.muted100,
              ...(active ? { shadowColor: theme.colors.primary, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4 } : {}),
            }}>
              {passed ? (
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={11} color="#FFF" strokeWidth={3} />
                </View>
              ) : (
                <Icon size={14} color={active ? '#FFF' : theme.colors.tabInactive} strokeWidth={active ? 2.2 : 1.8} />
              )}
              <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: active || passed ? '700' : '500', color: active ? '#FFF' : passed ? theme.colors.primary : theme.colors.tabInactive }}>
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ─── Step Content ─── */}
      <View style={{ flex: 1 }}>
        {step === 0 && (
          <StepBasicInfo
            organizationId={organizationId}
            onNext={goNext}
            formData={formData}
            updateFormData={updateFormData}
            navigation={navigation}
          />
        )}
        {step === 1 && (
          <StepResourcesFiles
            onNext={goNext}
            onBack={goBack}
            onCreate={() => onSubmit?.(formData)}
            formData={formData}
            updateFormData={updateFormData}
            mode={mode}
            title={mode === 'edit' ? 'Update Subtask' : 'Create Subtask'}
          />
        )}
      </View>
    </View>
  );
}
