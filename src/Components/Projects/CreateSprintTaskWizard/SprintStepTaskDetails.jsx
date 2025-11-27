// src/Components/Projects/CreateSprintTaskWizard/SprintStepTaskDetails.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import theme from '../../../Themes/Themes';
import { fetchOrganizationProjects } from '../../../Services/Project/FetchOrganizationProjects';
import DropdownSelect from '../../Common/DropdownSelect';
 

export default function SprintStepTaskDetails({ organizationId = 'one', selectedProject, onSelectProject, onNext, initialProjectId, title, description, setTitle, setDescription }) {
  const [loading, setLoading] = React.useState(true);
  const [projects, setProjects] = React.useState([]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await fetchOrganizationProjects(organizationId);
        if (mounted) setProjects(list);
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
      const label = p.name || p.title || p.project_name || p.project_title || `Project ${p.id || ''}`;
      return { label: String(label), value: String(p.id) };
    }),
  [projects]);

  const currentValue = selectedProject ? String(selectedProject.id) : '';
 

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

      <Text style={styles.fieldLabel}>Task Title</Text>
      <TextInput
        style={styles.input}
        placeholder="What needs to be done?"
        placeholderTextColor={theme.colors.textSecondary}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.fieldLabel}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        placeholder="Add details about the task..."
        placeholderTextColor={theme.colors.textSecondary}
        value={description}
        onChangeText={setDescription}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.primaryBtn, !selectedProject && { opacity: 0.5 }]} onPress={onNext} disabled={!selectedProject}>
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
