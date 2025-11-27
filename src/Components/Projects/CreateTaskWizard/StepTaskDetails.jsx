// src/Components/CreateTaskWizard/StepTaskDetails.jsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Platform } from 'react-native';
import theme from '../../../Themes/Themes';
import { fetchProjects } from '../../../Services/Project/FetchOrganizationProjects';
import DropdownSelect from '../../Common/DropdownSelect';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function StepTaskDetails({ 
  organizationId = 'one', 
  selectedProject, 
  onSelectProject, 
  onNext, 
  initialProjectId,
  formData,
  updateFormData
}) {
  const [loading, setLoading] = React.useState(true);
  const [projects, setProjects] = React.useState([]);
  const [showDuePicker, setShowDuePicker] = React.useState(false);
  const [showStartPicker, setShowStartPicker] = React.useState(false);
  const [showEndPicker, setShowEndPicker] = React.useState(false);

  const {
    title,
    description,
    priority,
    dueDate,
    allDay,
    startTime,
    endTime
  } = formData;

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchProjects(organizationId);
        const source = Array.isArray(res?.projects) ? res.projects : (res?.success ? res.projects : []);
        // TEMP: log the first few items to verify shape during debugging
        try { console.log('[StepTaskDetails] fetched projects sample:', (source || []).slice(0, 3)); } catch {}
        const normalized = Array.isArray(source)
          ? source.map((p, idx) => {
              const id = String(p?.project_id || p?.id || p?._id || idx);
              const nameCand = [p?.name, p?.title, p?.project_name, p?.project_title]
                .map(v => (typeof v === 'string' ? v.trim() : ''))
                .find(v => v.length > 0);
              const name = nameCand && nameCand.length > 0 ? nameCand : `Project ${id}`;
              return { id, name };
            })
          : [];
        if (mounted) setProjects(normalized);
      } catch (_) {
        if (mounted) setProjects([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [organizationId]);

  React.useEffect(() => {
    if (!initialProjectId || !projects?.length || selectedProject) return;
    const found = projects.find(p => String(p.id) === String(initialProjectId));
    if (found) onSelectProject?.(found);
  }, [initialProjectId, projects, selectedProject, onSelectProject]);

  const options = React.useMemo(() =>
    (projects || []).map(p => {
      const nm = typeof p?.name === 'string' ? p.name.trim() : '';
      const label = nm.length > 0 ? nm : `Project ${p?.id || ''}`;
      return { label: String(label), value: String(p.id) };
    }),
  [projects]);

  const currentValue = selectedProject ? String(selectedProject.id) : '';

  const handleInputChange = (field, value) => {
    updateFormData({ [field]: value });
  };
  const priorityOptions = [
    { label: 'Urgent & Important', value: 'urgent_important' },
    { label: 'Urgent & Not Important', value: 'urgent_not_important' },
    { label: 'Not Urgent & Important', value: 'not_urgent_important' },
    { label: 'Not Urgent & Not Important', value: 'not_urgent_not_important' },
  ];

  const fmtDate = (d) => {
    try { return d ? d.toLocaleDateString() : 'dd/mm/yyyy'; } catch { return 'dd/mm/yyyy'; }
  };
  const fmtTime = (d) => {
    try { return d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:-- --'; } catch { return '--:-- --'; }
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>Project</Text>

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : (
        <DropdownSelect
          label={undefined}
          value={currentValue}
          options={options}
          onChange={(val) => {
            const item = (projects || []).find(p => String(p.id) === String(val));
            if (item) onSelectProject?.(item);
          }}
        />
      )}

      <View style={styles.row2}>
        <View style={styles.col}>
          <Text style={styles.fieldLabel}>Priority</Text>
          <DropdownSelect
            value={priority}
            options={priorityOptions}
            onChange={(val) => handleInputChange('priority', val)}
          />
        </View>
      </View>

      <Text style={styles.fieldLabel}>Task Title</Text>
      <TextInput
        style={styles.input}
        placeholder="What needs to be done?"
        placeholderTextColor={theme.colors.textSecondary}
        value={title}
        onChangeText={(text) => handleInputChange('title', text)}
      />

      <Text style={styles.fieldLabel}>Due Date</Text>
      <TouchableOpacity 
        style={styles.picker} 
        onPress={() => setShowDuePicker(true)}
      >
        <Text style={styles.pickerText}>{fmtDate(dueDate)}</Text>
      </TouchableOpacity>
      {showDuePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(e, d) => {
            if (Platform.OS !== 'ios') setShowDuePicker(false);
            if (e.type !== 'dismissed' && d) {
              handleInputChange('dueDate', d);
            }
          }}
        />
      )}

      <Text style={styles.fieldLabel}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        placeholder="Add details about the task..."
        placeholderTextColor={theme.colors.textSecondary}
        value={description}
        onChangeText={(text) => handleInputChange('description', text)}
      />

      <View style={styles.allDayRow}>
        <TouchableOpacity 
          onPress={() => handleInputChange('allDay', !allDay)} 
          style={styles.checkbox}
        >
          <View style={[styles.checkboxBox, allDay && styles.checkboxBoxChecked]} />
        </TouchableOpacity>
        <Text style={styles.allDayText}>All-day event</Text>
      </View>

      {!allDay && (
        <View style={styles.row2}>
          <View style={styles.col}>
            <Text style={styles.fieldLabel}>Start Time</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowStartPicker(true)}>
              <Text style={styles.pickerText}>{fmtTime(startTime)}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.col}>
            <Text style={styles.fieldLabel}>End Time</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowEndPicker(true)}>
              <Text style={styles.pickerText}>{fmtTime(endTime)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showStartPicker && (
        <DateTimePicker
          value={startTime || new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => {
            if (Platform.OS !== 'ios') setShowStartPicker(false);
            if (e.type !== 'dismissed' && d) {
              handleInputChange('startTime', d);
            }
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endTime || new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => {
            if (Platform.OS !== 'ios') setShowEndPicker(false);
            if (e.type !== 'dismissed' && d) {
              handleInputChange('endTime', d);
            }
          }}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryBtn, !selectedProject && { opacity: 0.5 }]}
          onPress={onNext}
          disabled={!selectedProject}
        >
          <Text style={styles.primaryBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  fieldLabel: { color: theme.colors.text, marginTop: 12, marginBottom: 6, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background, borderRadius: 8, padding: 12, color: theme.colors.text },
  textArea: { height: 100, textAlignVertical: 'top' },
  row2: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  picker: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background, borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerText: { color: theme.colors.text, fontWeight: '600' },
  allDayRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  checkbox: { padding: 4 },
  checkboxBox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background },
  checkboxBoxChecked: { backgroundColor: theme.colors.primary + '55', borderColor: theme.colors.primary },
  allDayText: { color: theme.colors.text },
  footer: { marginTop: 16, alignItems: 'flex-end' },
  primaryBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  primaryBtnText: { color: theme.colors.white, fontWeight: '700' },
});
