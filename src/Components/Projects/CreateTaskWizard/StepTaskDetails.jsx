// src/Components/CreateTaskWizard/StepTaskDetails.jsx
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../../Themes/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Type,
  AlignLeft,
  Flag,
  Calendar,
  Clock,
  ChevronRight,
  Check,
} from 'lucide-react-native';

const PRIORITY_OPTIONS = [
  { label: 'Urgent & Important', value: 'urgent_important', color: '#EF4444' },
  { label: 'Urgent & Not Important', value: 'urgent_not_important', color: '#F97316' },
  { label: 'Not Urgent & Important', value: 'not_urgent_important', color: '#3B82F6' },
  { label: 'Not Urgent & Not Imp.', value: 'not_urgent_not_important', color: '#6B7280' },
];

const STATUS_OPTIONS = [
  { label: 'Not Started', value: 'not_started', color: '#EF4444' },
  { label: 'In Progress', value: 'in_progress', color: '#F97316' },
  { label: 'Completed', value: 'completed', color: '#3B82F6' },
  { label: 'On Hold', value: 'on_hold', color: '#6B7280' },
];

const fmtDate = (d) => {
  try { return d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select date'; }
  catch { return 'Select date'; }
};
const fmtTime = (d) => {
  try { return d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select time'; }
  catch { return 'Select time'; }
};

// ─── Section Label ────────────────────────────────────────────────────────────
const FieldLabel = ({ icon: Icon, label, color, required }) => {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7, marginTop: 16 }}>
      <View style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: `${color || theme.colors.primary}18`, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={12} color={color || theme.colors.primary} strokeWidth={2.2} />
      </View>
      <Text style={{ fontSize: 12.5, fontWeight: '700', color: theme.colors.text }}>{label}</Text>
      {required && <Text style={{ fontSize: 12, color: '#EF4444', marginLeft: 1 }}>*</Text>}
    </View>
  );
};

export default function StepTaskDetails({
  onNext,
  formData,
  updateFormData,
}) {
  const { theme } = useTheme();
  const [showDuePicker, setShowDuePicker] = React.useState(false);
  const [showStartPicker, setShowStartPicker] = React.useState(false);
  const [showEndPicker, setShowEndPicker] = React.useState(false);
  const [priorityOpen, setPriorityOpen] = React.useState(false);
  const [statusOpen, setStatusOpen] = React.useState(false);

  const { title, description, priority, status, dueDate, allDay, startTime, endTime, remarks, estimatedTime } = formData;
  const selectedPriority = PRIORITY_OPTIONS.find(p => p.value === priority);
  const selectedStatus = STATUS_OPTIONS.find(s => s.value === status);
  const canContinue = !!title?.trim();

  const set = (field, value) => updateFormData({ [field]: value });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 20}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">


        {/* Task Title */}
        <FieldLabel icon={Type} label="Task Title" required />
        <TextInput
          style={{ borderWidth: 1.5, borderColor: title ? theme.colors.primary : theme.colors.border, backgroundColor: theme.colors.muted100, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, fontWeight: '500', color: theme.colors.text }}
          placeholder="What needs to be done?"
          placeholderTextColor={theme.colors.textSecondary}
          value={title}
          onChangeText={(t) => set('title', t)}
          returnKeyType="next"
        />

        {/* Priority */}
        <FieldLabel icon={Flag} label="Priority" color="#EF4444" />
        <View style={{ zIndex: 50 }}>
          <TouchableOpacity
            onPress={() => { setPriorityOpen(o => !o); setStatusOpen(false); }}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              borderWidth: 1.5, borderColor: theme.colors.border,
              backgroundColor: theme.colors.muted100, borderRadius: 12,
              paddingHorizontal: 14, paddingVertical: 11,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              {selectedPriority
                ? <><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: selectedPriority.color }} /><Text style={{ fontSize: 13.5, fontWeight: '600', color: theme.colors.text }}>{selectedPriority.label}</Text></>
                : <Text style={{ fontSize: 13.5, color: theme.colors.textSecondary }}>Select priority…</Text>
              }
            </View>
            <ChevronRight size={14} color={theme.colors.textSecondary} strokeWidth={2}
              style={{ transform: [{ rotate: priorityOpen ? '90deg' : '0deg' }] }} />
          </TouchableOpacity>

          {priorityOpen && (
            <View style={{
              position: 'absolute', top: 48, left: 0, right: 0, zIndex: 999,
              backgroundColor: theme.colors.card, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border,
              shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 12, overflow: 'hidden',
            }}>
              {PRIORITY_OPTIONS.map((opt, idx) => (
                <TouchableOpacity key={opt.value} onPress={() => { set('priority', opt.value); setPriorityOpen(false); }} activeOpacity={0.7}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14,
                    backgroundColor: priority === opt.value ? `${opt.color}12` : 'transparent',
                    borderBottomWidth: idx < PRIORITY_OPTIONS.length - 1 ? 1 : 0, borderBottomColor: theme.colors.border
                  }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: opt.color }} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: priority === opt.value ? opt.color : theme.colors.text, flex: 1 }}>{opt.label}</Text>
                  {priority === opt.value && <Check size={13} color={opt.color} strokeWidth={3} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* STATUS */}
        <FieldLabel icon={Flag} label="Status" color="#6366F1" />
        <View style={{ zIndex: 40 }}>
          <TouchableOpacity
            onPress={() => { setStatusOpen(o => !o); setPriorityOpen(false); }}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              borderWidth: 1.5,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.muted100, borderRadius: 12,
              paddingHorizontal: 14, paddingVertical: 11,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              {selectedStatus
                ? <><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: selectedStatus.color }} /><Text style={{ fontSize: 13.5, fontWeight: '600', color: theme.colors.text }}>{selectedStatus.label}</Text></>
                : <Text style={{ fontSize: 13.5, color: theme.colors.textSecondary }}>Select status…</Text>
              }
            </View>
            <ChevronRight size={14} color={theme.colors.textSecondary} strokeWidth={2}
              style={{ transform: [{ rotate: statusOpen ? '90deg' : '0deg' }] }} />
          </TouchableOpacity>

          {statusOpen && (
            <View style={{
              position: 'absolute', top: 48, left: 0, right: 0, zIndex: 999,
              backgroundColor: theme.colors.card, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border,
              shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 12, overflow: 'hidden',
            }}>
              {STATUS_OPTIONS.map((opt, idx) => (
                <TouchableOpacity key={opt.value} onPress={() => { set('status', opt.value); setStatusOpen(false); }} activeOpacity={0.7}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14,
                    backgroundColor: status === opt.value ? `${opt.color}12` : 'transparent',
                    borderBottomWidth: idx < STATUS_OPTIONS.length - 1 ? 1 : 0, borderBottomColor: theme.colors.border
                  }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: opt.color }} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: status === opt.value ? opt.color : theme.colors.text, flex: 1 }}>{opt.label}</Text>
                  {status === opt.value && <Check size={13} color={opt.color} strokeWidth={3} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Remarks */}
        <FieldLabel icon={Type} label="Remarks" />
        <TextInput
          style={{
            borderWidth: 1.5,
            borderColor: remarks ? theme.colors.primary : theme.colors.border,
            backgroundColor: theme.colors.muted100, borderRadius: 12,
            paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '500', color: theme.colors.text,
          }}
          placeholder="Enter remarks…"
          placeholderTextColor={theme.colors.textSecondary}
          value={remarks}
          onChangeText={(t) => set('remarks', t)}
          returnKeyType="next"
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />

        {/* Estimated Time */}
        <FieldLabel icon={Clock} label="Estimated Time" color="#8B5CF6" />
        <TextInput
          style={{ borderWidth: 1.5, borderColor: estimatedTime ? theme.colors.primary : theme.colors.border, backgroundColor: theme.colors.muted100, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, fontWeight: '500', color: theme.colors.text }}
          placeholder="e.g. 2 hours, 30 mins…"
          placeholderTextColor={theme.colors.textSecondary}
          value={estimatedTime}
          onChangeText={(t) => set('estimatedTime', t)}
          returnKeyType="next"
        />

        {/* Due Date */}
        <FieldLabel icon={Calendar} label="Due Date" color="#10B981" />
        <TouchableOpacity
          onPress={() => setShowDuePicker(true)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: theme.colors.muted100, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 }}
        >
          <Text style={{ fontSize: 13.5, fontWeight: '500', color: dueDate ? theme.colors.text : theme.colors.textSecondary }}>{fmtDate(dueDate)}</Text>
          <Calendar size={15} color={theme.colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
        {showDuePicker && (
          <DateTimePicker value={dueDate || new Date()} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(e, d) => { if (Platform.OS !== 'ios') setShowDuePicker(false); if (e.type !== 'dismissed' && d) set('dueDate', d); }} />
        )}

        {/* Description */}
        <FieldLabel icon={AlignLeft} label="Description" color={theme.colors.secondary} />
        <TextInput
          style={{ borderWidth: 1.5, borderColor: description ? theme.colors.primary : theme.colors.border, backgroundColor: theme.colors.muted100, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, fontWeight: '500', color: theme.colors.text, height: 100, textAlignVertical: 'top' }}
          multiline
          placeholder="Add details about the task…"
          placeholderTextColor={theme.colors.textSecondary}
          value={description}
          onChangeText={(t) => set('description', t)}
        />

        {/* Start / End Time */}


        {/* Continue button */}
        <TouchableOpacity
          onPress={onNext}
          disabled={!canContinue}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginTop: 24, paddingVertical: 14, borderRadius: 14,
            backgroundColor: theme.colors.primary,
            opacity: canContinue ? 1 : 0.45,
            shadowColor: theme.colors.primary,
            shadowOpacity: canContinue ? 0.3 : 0,
            shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
            elevation: canContinue ? 6 : 0,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFF', letterSpacing: 0.2 }}>Next: Assignment</Text>
          <ChevronRight size={18} color="#FFF" strokeWidth={2.5} />
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
