import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import theme from '../../../Themes/Themes';
import { updateTaskStatus } from '../../../Services/Project/FetchProjectTask';
import { PauseCircle, X as XIcon, UserMinus, UserCheck } from 'lucide-react-native';

const statusColors = {
  not_started: theme.colors.textSecondary,
  in_progress: theme.colors.secondary,
  completed: theme.colors.primary,
  pending: theme.colors.task,
  on_hold: theme.colors.textSecondary,
  cancelled: theme.colors.error,
  untaken: theme.colors.textSecondary,
  taken: theme.colors.primary,
};

const StatusRow = ({ label, value, active, onPress }) => {
  const color = statusColors[value] || theme.colors.primary;
  const Icon =
    value === 'on_hold' ? PauseCircle :
    value === 'cancelled' ? XIcon :
    value === 'untaken' ? UserMinus :
    value === 'taken' ? UserCheck : null;
  return (
    <TouchableOpacity style={[styles.statusRow, active && { borderColor: color }]} onPress={onPress}>
      <View style={[styles.radioOuter, { borderColor: active ? color : theme.colors.border }]}>
        {active ? <View style={[styles.radioInner, { backgroundColor: color }]} /> : null}
      </View>
      {Icon ? <Icon size={14} color={color} /> : null}
      <Text style={[styles.statusLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function TaskStatusChange() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const task = route?.params?.task || {};
  const orgId = route?.params?.orgId || 'one';
  const [selectedStatus, setSelectedStatus] = React.useState(String(task?.status || 'not_started').toLowerCase());
  const [remarks, setRemarks] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const statusOptions = React.useMemo(() => ([
    { label: 'Not Started', value: 'not_started' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
    { label: 'On Hold', value: 'on_hold' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Untaken', value: 'untaken' },
    { label: 'Taken', value: 'taken' },
  ]), []);

  const onSubmit = async () => {
    try {
      setSubmitting(true);
      const taskId = task?.task_id || task?.id || task?._id;
      const payload = { status: selectedStatus, remarks };
      await updateTaskStatus(orgId, taskId, payload);
      try { Toast.show({ type: 'custom_success', text1: 'Status updated', position: 'bottom', visibilityTime: 1500 }); } catch {}
      navigation.goBack();
    } catch (e) {
      try { Toast.show({ type: 'custom_error', text1: e?.message || 'Failed to update status', position: 'bottom', visibilityTime: 2000 }); } catch {}
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top','bottom']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: 16 + Math.max(insets.top - 8, 0), paddingBottom: 24 + Math.max(insets.bottom - 8, 0) }]}>
        <View style={[styles.centered, { maxWidth: 720 }]}> 
          <Text style={styles.header}>Change Task Status</Text>
          <Text style={styles.subheader} numberOfLines={2}>{task?.title || 'Task'}</Text>

          <View style={{ gap: 10, marginTop: 12 }}>
          {statusOptions.map((opt) => (
            <StatusRow key={opt.value} label={opt.label} value={opt.value} active={selectedStatus === opt.value} onPress={() => setSelectedStatus(opt.value)} />
          ))}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Remarks (Optional)</Text>
          <TextInput
            style={styles.remarksInput}
            placeholder="Add any remarks about this status update..."
            placeholderTextColor={theme.colors.textSecondary}
            value={remarks}
            onChangeText={setRemarks}
            multiline
          />

          <View style={[styles.actionsRow, { flexDirection: isWide ? 'row' : 'column' }]}>
            <TouchableOpacity style={[styles.btn, styles.btnSecondary, !isWide && { width: '100%' }]} onPress={() => navigation.goBack()} disabled={submitting}>
              <Text style={[styles.btnText, { color: theme.colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary, !isWide && { width: '100%', marginTop: 12 }]} onPress={onSubmit} disabled={submitting}>
              <Text style={[styles.btnText, { color: theme.colors.white }]}>{submitting ? 'Updating...' : 'Update Status'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: 16 },
  centered: { width: '100%', alignSelf: 'center' },
  header: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
  subheader: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12 },
  radioOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 14, fontWeight: '600' },
  remarksInput: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 12, color: theme.colors.text, minHeight: 100, textAlignVertical: 'top' },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnSecondary: { backgroundColor: theme.colors.muted100 },
  btnPrimary: { backgroundColor: theme.colors.primary },
  btnText: { fontSize: 16, fontWeight: '700' },
  actionsRow: { gap: 12, marginTop: 20 },
});
