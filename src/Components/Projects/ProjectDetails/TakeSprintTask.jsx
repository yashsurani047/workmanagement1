// src/Components/Projects/ProjectDetails/TakeSprintTask.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, Platform, ActivityIndicator, ScrollView, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import theme from '../../../Themes/Themes';
import { takeSprintTask } from '../../../Services/Project/FetchSprintTask';

export default function TakeSprintTask() {
  const navigation = useNavigation();
  const route = useRoute();
  const task = route?.params?.task;
  const onTaken = route?.params?.onTaken;

  const [dueDate, setDueDate] = React.useState(null);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [allDay, setAllDay] = React.useState(false);
  const [estimatedTime, setEstimatedTime] = React.useState(new Date());
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [notes, setNotes] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!task) return;
    navigation.setOptions?.({ title: 'Take Task' });
  }, [task, navigation]);

  const formatDate = (d) => {
    if (!d) return '';
    // yyyy-mm-dd
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
    
  const formatTime = (d) => {
    if (!d) return '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}:00`;
  };

  const submit = async () => {
    if (!task) return;
    try {
      setSubmitting(true);
      const userInfoRaw = await AsyncStorage.getItem('userInfo');
      const storedUserId = await AsyncStorage.getItem('userId');
      let parsedInfo = null;
      try { parsedInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null; } catch {}
      const organizationId = String(parsedInfo?.organization_id || 'one');
      const userId = storedUserId || String(parsedInfo?.user_id || '');

      await takeSprintTask(organizationId, {
        sprintTaskId: task?.task_id || task?.sprint_task_id || task?.id,
        userId,
        notes,
        dueDate: formatDate(dueDate),
        estimatedTime: allDay ? null : formatTime(estimatedTime),
        allDay,
      });

      if (typeof onTaken === 'function') {
        try { await onTaken(); } catch (_) {}
      }
      navigation.goBack();
    } catch (e) {
      console.log('TakeSprintTask submit error:', e?.message || e);
      // Optionally show a toast/snackbar in your app shell
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !!dueDate && !!notes && (allDay || !!estimatedTime);

  return (
    <SafeAreaView style={styles.safe} edges={['top','bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Configure your assignment</Text>

      <Text style={styles.label}>Due Date *</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowDatePicker(true)}
        accessibilityLabel="Select due date"
      >
        <Text style={styles.inputText}>{dueDate ? dueDate.toLocaleDateString() : 'Select date'}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(event, selectedDate) => {
            if (Platform.OS !== 'ios') setShowDatePicker(false);
            if (event.type !== 'dismissed' && selectedDate) setDueDate(selectedDate);
          }}
        />
      )}
      {Platform.OS === 'ios' && showDatePicker && (
        <TouchableOpacity style={styles.confirmButton} onPress={() => setShowDatePicker(false)}>
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
      )}

      <View style={styles.rowBetween}>
        <Text style={styles.label}>All Day Task</Text>
        <Switch value={allDay} onValueChange={setAllDay} />
      </View>

      {!allDay && (
        <>
          <Text style={styles.label}>Estimated Time *</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowTimePicker(true)}
            accessibilityLabel="Select estimated time"
          >
            <Text style={styles.inputText}>{estimatedTime ? estimatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select time'}</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={estimatedTime || new Date()}
              mode="time"
              is24Hour
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedTime) => {
                if (Platform.OS !== 'ios') setShowTimePicker(false);
                if (event.type !== 'dismissed' && selectedTime) setEstimatedTime(selectedTime);
              }}
            />
          )}
          {Platform.OS === 'ios' && showTimePicker && (
            <TouchableOpacity style={styles.confirmButton} onPress={() => setShowTimePicker(false)}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <Text style={styles.label}>Personal Notes *</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Add any personal notes..."
        placeholderTextColor={theme.colors.textSecondary}
        style={[styles.textArea]}
        multiline
      />

          <View style={styles.footer}>
            <TouchableOpacity style={styles.ghostBtn} onPress={() => navigation.goBack()} disabled={submitting}>
              <Text style={styles.ghostBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryBtn, (!canSubmit || submitting) && { opacity: 0.7 }]} onPress={submit} disabled={!canSubmit || submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Confirm & Take Task</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 24 },
  title: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
  label: { fontSize: 13, color: theme.colors.text, marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 14, backgroundColor: theme.colors.background },
  inputText: { color: theme.colors.text },
  textArea: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, height: 100, textAlignVertical: 'top', color: theme.colors.text, backgroundColor: theme.colors.background },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  primaryBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  ghostBtn: { paddingHorizontal: 12, paddingVertical: 12 },
  ghostBtnText: { color: theme.colors.text },
  confirmButton: { alignSelf: 'flex-end', marginTop: 8, backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  confirmButtonText: { color: '#fff', fontWeight: '700' },
});
