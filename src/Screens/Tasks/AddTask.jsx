import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import {
  Calendar,
  Clock,
  Repeat,
  ChevronDown,
  X,
} from 'lucide-react-native';
import theme from '../../Themes/Themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { createTask, updatePersonalTask } from '../../Services/Tasks/FetchPersonalTask';
import { useRoute } from '@react-navigation/native';

const priorityOptions = [
  { label: 'Urgent & Important', value: 'urgent-important' },
  { label: 'Urgent & Not Important', value: 'urgent-not-important' },
  { label: 'Not Urgent & Important', value: 'not-urgent-important' },
  { label: 'Not Urgent & Not Important', value: 'not-urgent-not-important' },
];

const AddTaskScreen = ({ navigation }) => {
  const route = useRoute();
  const mode = route?.params?.mode || 'create';
  const editingTask = route?.params?.task || null;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [autoRecurrence, setAutoRecurrence] = useState(false);
  const [recurrenceModalVisible, setRecurrenceModalVisible] = useState(false);
  const [recurrenceOption, setRecurrenceOption] = useState('none');
  const [selectedWeekdays, setSelectedWeekdays] = useState([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [priority, setPriority] = useState(priorityOptions[0].value);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [status, setStatus] = useState('pending');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showRecurrenceEndPicker, setShowRecurrenceEndPicker] = useState(false);

  const formatDate = (d) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const weekdayList = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  const toggleWeekday = (key) => {
    setSelectedWeekdays((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const formatTime = (d) => {
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  };

  const startOfDay = (d) => {
    const dt = new Date(d);
    dt.setHours(0, 0, 0, 0);
    return dt;
  };

  const parseDateString = (str) => {
    // expects dd-mm-yyyy
    const [dd, mm, yyyy] = str.split('-').map((v) => parseInt(v, 10));
    if (!dd || !mm || !yyyy) return null;
    return startOfDay(new Date(yyyy, mm - 1, dd));
  };

  const toApiDate = (str) => {
    // convert dd-mm-yyyy -> yyyy-mm-dd
    const d = parseDateString(str);
    if (!d) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const toApiTime = (str) => {
    // convert "hh:mm AM" -> HH:MM
    if (!str) return null;
    try {
      const [time, ampm] = str.split(' ');
      let [h, m] = time.split(':').map((v) => parseInt(v, 10));
      if (ampm?.toUpperCase() === 'PM' && h < 12) h += 12;
      if (ampm?.toUpperCase() === 'AM' && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    } catch {
      return null;
    }
  };

  const mapPriorityToApi = (val) => (val ? val.replace(/-/g, '_') : 'not_urgent_not_important');
  const mapPriorityToUi = (val) => (val ? String(val).replace(/_/g, '-') : 'not-urgent-not-important');

  React.useEffect(() => {
    if (editingTask) {
      setTitle(editingTask?.title || '');
      setDescription(editingTask?.description || '');
      setPriority(mapPriorityToUi(editingTask?.priority));
      // dates from yyyy-mm-dd -> dd-mm-yyyy
      const sd = editingTask?.start_date || '';
      const ed = editingTask?.end_date || '';
      const toUiDate = (s) => {
        if (!s) return '';
        const [y, m, d] = s.split('-');
        if (!y || !m || !d) return '';
        return `${d}-${m}-${y}`;
      };
      setStartDate(toUiDate(sd));
      setEndDate(toUiDate(ed));
      // times HH:MM -> hh:mm AM/PM
      const toUiTime = (s) => {
        if (!s) return '';
        let [hh, mm] = s.split(':').map((v) => parseInt(v, 10));
        let ampm = 'AM';
        if (hh >= 12) {
          ampm = 'PM';
          if (hh > 12) hh -= 12;
        } else if (hh === 0) {
          hh = 12;
        }
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ampm}`;
      };
      setAllDay(!!editingTask?.all_day);
      setStartTime(editingTask?.all_day ? '' : toUiTime(editingTask?.start_time));
      setEndTime(editingTask?.all_day ? '' : toUiTime(editingTask?.end_time));
      setStatus((editingTask?.status || 'pending').toLowerCase());
    }
  }, [editingTask]);

  const onCreatePress = async () => {
    try {
      if (!title?.trim()) {
        Alert.alert('Validation', 'Title is required');
        return;
      }
      if (!startDate) {
        Alert.alert('Validation', 'Start date is required');
        return;
      }
      if (!allDay && (!startTime || !endTime)) {
        Alert.alert('Validation', 'Start and End time are required for non all-day tasks');
        return;
      }

      const userInfoRaw = await AsyncStorage.getItem('userInfo');
      const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
      const orgId = (await AsyncStorage.getItem('organization_id')) || (userInfo?.organization_id) || 'one';
      const userId = (await AsyncStorage.getItem('user_id')) || userInfo?.user_id || null;
      const createdBy = (
        userInfo?.user_name ||
        userInfo?.username ||
        (await AsyncStorage.getItem('username')) ||
        null
      );

      if (!createdBy) {
        Alert.alert('Error', 'Your account username is missing. Please sign in again.');
        return;
      }

      let rec = 'none';
      let recDays = null;
      if (autoRecurrence) {
        if (recurrenceOption === 'daily') rec = 'daily';
        else if (recurrenceOption === 'weekly') {
          rec = 'weekly';
          recDays = Array.isArray(selectedWeekdays) && selectedWeekdays.length > 0 ? selectedWeekdays : null;
        } else if (recurrenceOption === 'weekday') {
          rec = 'weekly';
          recDays = ['monday','tuesday','wednesday','thursday','friday'];
        } else if (recurrenceOption === 'monthly') rec = 'monthly';
        else if (recurrenceOption === 'annually') rec = 'annually';
        else rec = 'none';
      }

      const payload = {
        title: title.trim(),
        description: description?.trim() || '',
        priority: mapPriorityToApi(priority),
        start_date: toApiDate(startDate),
        end_date: endDate ? toApiDate(endDate) : null,
        all_day: allDay ? 1 : 0,
        start_time: allDay ? null : toApiTime(startTime),
        end_time: allDay ? null : toApiTime(endTime),
        created_by: createdBy,
        creator_user_id: userId,
        recurrence: rec,
        recurrence_days: recDays,
        recurrence_end_date: recurrenceEndDate ? toApiDate(recurrenceEndDate) : null,
      };

      const res = await createTask(orgId, payload);
      if (res?.success) {
        Alert.alert('Success', 'Task created successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', res?.error || 'Failed to create task');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to create task');
    }
  };

  const selectedPriorityLabel =
    priorityOptions.find((p) => p.value === priority)?.label || '';

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{mode === 'update' ? 'Update Task' : 'Create Personal Task'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <X size={24} color={theme.colors.background} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter task title"
                value={title}
                onChangeText={setTitle}
              />
      <DateTimePickerModal
        isVisible={showEndDatePicker}
        mode="date"
        onConfirm={(date) => {
          const picked = startOfDay(date);
          setEndDate(formatDate(picked));
          setShowEndDatePicker(false);
        }}
        onCancel={() => setShowEndDatePicker(false)}
        minimumDate={startDate ? parseDateString(startDate) || startOfDay(new Date()) : startOfDay(new Date())}
      />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe the task details..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* All Day */}
            <View style={styles.row}>
              <Switch value={allDay} onValueChange={setAllDay} />
              <Text style={styles.switchLabel}>All day</Text>
            </View>

            {/* Date & Time */}
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeField}>
                  <Text style={styles.label}>
                    Start Date <Text style={styles.required}>*</Text>
                  </Text>
                  <TouchableOpacity style={styles.pickerButton} onPress={() => setShowStartDatePicker(true)}>
                    <Text style={styles.pickerText}>
                      {startDate || 'dd-mm-yyyy'}
                    </Text>
                    <Calendar size={18} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.dateTimeField}>
                  <Text style={styles.label}>End Date</Text>
                  <TouchableOpacity style={styles.pickerButton} onPress={() => setShowEndDatePicker(true)}>
                    <Text style={styles.pickerText}>
                      {endDate || 'dd-mm-yyyy'}
                    </Text>
                    <Calendar size={18} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {!allDay && (
                <View style={styles.dateTimeRow}>
                  <View style={styles.dateTimeField}>
                    <Text style={styles.label}>
                      Start Time <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity style={styles.pickerButton} onPress={() => setShowStartTimePicker(true)}>
                      <Text style={styles.pickerText}>
                        {startTime || '--:-- --'}
                      </Text>
                      <Clock size={18} color={theme.colors.text} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dateTimeField}>
                    <Text style={styles.label}>
                      End Time <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity style={styles.pickerButton} onPress={() => setShowEndTimePicker(true)}>
                      <Text style={styles.pickerText}>
                        {endTime || '--:-- --'}
                      </Text>
                      <Clock size={18} color={theme.colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.row}>
              <Repeat size={20} color={theme.colors.text} />
              <Text style={styles.recurrenceLabel}>Recurrence options</Text>
              <TouchableOpacity style={styles.recurrenceBtn} onPress={() => setRecurrenceModalVisible(true)}>
                <Text style={{ color: theme.colors.background, fontWeight: '600' }}>Select</Text>
              </TouchableOpacity>
            </View>

            {/* Priority */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Priority</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowPriorityDropdown(!showPriorityDropdown)}
              >
                <Text style={styles.dropdownText}>{selectedPriorityLabel}</Text>
                <ChevronDown
                  size={20}
                  color={theme.colors.white}
                  style={{ transform: [{ rotate: showPriorityDropdown ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>

              {showPriorityDropdown && (
                <View style={styles.dropdownList}>
                  {priorityOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.dropdownItem,
                        option.value === priority && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setPriority(option.value);
                        setShowPriorityDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          option.value === priority && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {mode === 'update' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Status</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowStatusDropdown(!showStatusDropdown)}
                >
                  <Text style={styles.dropdownText}>
                    {(
                      {
                        pending: 'Pending',
                        in_progress: 'In Progress',
                        completed: 'Completed',
                        not_started: 'Not Started',
                        on_hold: 'On Hold',
                        cancelled: 'Cancelled',
                      }[status] || 'Pending'
                    )}
                  </Text>
                  <ChevronDown
                    size={20}
                    color={theme.colors.white}
                    style={{ transform: [{ rotate: showStatusDropdown ? '180deg' : '0deg' }] }}
                  />
                </TouchableOpacity>

                {showStatusDropdown && (
                  <View style={styles.dropdownList}>
                    {[
                      { label: 'Pending', value: 'pending' },
                      { label: 'In Progress', value: 'in_progress' },
                      { label: 'Completed', value: 'completed' },
                      { label: 'Not Started', value: 'not_started' },
                      { label: 'On Hold', value: 'on_hold' },
                      { label: 'Cancelled', value: 'cancelled' },
                    ].map((opt) => (
                      <Pressable
                        key={opt.value}
                        style={[
                          styles.dropdownItem,
                          opt.value === status && styles.dropdownItemSelected,
                        ]}
                        onPress={() => {
                          setStatus(opt.value);
                          setShowStatusDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            opt.value === status && styles.dropdownItemTextSelected,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        {mode === 'update' ? (
          <TouchableOpacity
            style={styles.createButton}
            onPress={async () => {
              try {
                if (!title?.trim()) return Alert.alert('Validation', 'Title is required');
                const userInfoRaw = await AsyncStorage.getItem('userInfo');
                const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
                const orgId = (await AsyncStorage.getItem('organization_id')) || userInfo?.organization_id || 'one';
                const taskId = editingTask?.personal_task_id || editingTask?.id;
                if (!taskId) return Alert.alert('Error', 'Missing task id');

                // Map recurrence like create
                let rec = 'none';
                let recDays = null;
                if (autoRecurrence) {
                  if (recurrenceOption === 'daily') rec = 'daily';
                  else if (recurrenceOption === 'weekly') {
                    rec = 'weekly';
                    recDays = Array.isArray(selectedWeekdays) && selectedWeekdays.length > 0 ? selectedWeekdays : null;
                  } else if (recurrenceOption === 'weekday') {
                    rec = 'weekly';
                    recDays = ['monday','tuesday','wednesday','thursday','friday'];
                  } else if (recurrenceOption === 'monthly') rec = 'monthly';
                  else if (recurrenceOption === 'annually') rec = 'annually';
                  else rec = 'none';
                }

                const updatedData = {
                  organization_id: orgId,
                  title: title.trim(),
                  description: description?.trim() || '',
                  priority: mapPriorityToApi(priority),
                  start_date: toApiDate(startDate) || '',
                  end_date: endDate ? toApiDate(endDate) : '',
                  all_day: allDay ? 1 : 0,
                  start_time: allDay ? '' : (toApiTime(startTime) || ''),
                  end_time: allDay ? '' : (toApiTime(endTime) || ''),
                  recurrence: rec,
                  recurrence_days: recDays,
                  recurrence_end_date: recurrenceEndDate ? toApiDate(recurrenceEndDate) : '',
                  status: status || 'pending',
                };

                const res = await updatePersonalTask(orgId, taskId, updatedData);
                if (res?.success) {
                  Alert.alert('Success', 'Task updated', [{ text: 'OK', onPress: () => navigation.goBack() }]);
                } else {
                  Alert.alert('Error', res?.error || 'Failed to update task');
                }
              } catch (e) {
                Alert.alert('Error', e?.message || 'Failed to update task');
              }
            }}
          >
            <Text style={styles.createText}>Update Task</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.createButton} onPress={onCreatePress}>
            <Text style={styles.createText}>Create Task</Text>
          </TouchableOpacity>
        )}
      </View>

      <DateTimePickerModal
        isVisible={showStartDatePicker}
        mode="date"
        onConfirm={(date) => {
          const picked = startOfDay(date);
          const newStart = formatDate(picked);
          setStartDate(newStart);
          // If existing endDate is before new start, clear it
          const end = endDate ? parseDateString(endDate) : null;
          if (end && end < picked) setEndDate('');
          setShowStartDatePicker(false);
        }}
        onCancel={() => setShowStartDatePicker(false)}
        minimumDate={startOfDay(new Date())}
      />
      <DateTimePickerModal
        isVisible={showEndDatePicker}
        mode="date"
        onConfirm={(date) => {
          const picked = startOfDay(date);
          setEndDate(formatDate(picked));
          setShowEndDatePicker(false);
        }}
        onCancel={() => setShowEndDatePicker(false)}
        minimumDate={startDate ? parseDateString(startDate) || startOfDay(new Date()) : startOfDay(new Date())}
      />
      <DateTimePickerModal
        isVisible={showStartTimePicker}
        mode="time"
        is24Hour={false}
        onConfirm={(date) => {
          setStartTime(formatTime(date));
          setShowStartTimePicker(false);
        }}
        onCancel={() => setShowStartTimePicker(false)}
      />
      <DateTimePickerModal
        isVisible={showEndTimePicker}
        mode="time"
        is24Hour={false}
        onConfirm={(date) => {
          setEndTime(formatTime(date));
          setShowEndTimePicker(false);
        }}
        onCancel={() => setShowEndTimePicker(false)}
      />

      {/* Recurrence End Date Picker */}
      <DateTimePickerModal
        isVisible={showRecurrenceEndPicker}
        mode="date"
        onConfirm={(date) => {
          const picked = startOfDay(date);
          setRecurrenceEndDate(formatDate(picked));
          setShowRecurrenceEndPicker(false);
        }}
        onCancel={() => setShowRecurrenceEndPicker(false)}
        minimumDate={startOfDay(new Date())}
      />

      {/* Recurrence Options Modal */}
      {recurrenceModalVisible && (
        <View style={styles.recurrenceModalBackdrop}>
          <View style={styles.recurrenceModal}>
            <Text style={styles.recurrenceTitle}>Recurrence options</Text>

            <TouchableOpacity style={styles.radioRow} onPress={() => { setRecurrenceOption('none'); setAutoRecurrence(false); }}>
              <View style={[styles.radioOuter, recurrenceOption==='none' && styles.radioOuterActive]}>
                {recurrenceOption==='none' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Does not repeat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.radioRow} onPress={() => { setRecurrenceOption('daily'); setAutoRecurrence(true); }}>
              <View style={[styles.radioOuter, recurrenceOption==='daily' && styles.radioOuterActive]}>
                {recurrenceOption==='daily' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Daily</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.radioRow} onPress={() => { setRecurrenceOption('weekly'); setAutoRecurrence(true); }}>
              <View style={[styles.radioOuter, recurrenceOption==='weekly' && styles.radioOuterActive]}>
                {recurrenceOption==='weekly' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Weekly</Text>
            </TouchableOpacity>

            {recurrenceOption === 'weekly' && (
              <View style={{ marginLeft: 36, marginTop: 6 }}>
                <Text style={{ marginBottom: 8, color: theme.colors.text }}>Repeat on:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {weekdayList.map((d) => (
                    <TouchableOpacity key={d.key} style={styles.checkboxRow} onPress={() => toggleWeekday(d.key)}>
                      <View style={[styles.checkboxBox, selectedWeekdays.includes(d.key) && styles.checkboxBoxChecked]} />
                      <Text style={styles.checkboxLabel}>{d.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.radioRow} onPress={() => { setRecurrenceOption('monthly'); setAutoRecurrence(true); }}>
              <View style={[styles.radioOuter, recurrenceOption==='monthly' && styles.radioOuterActive]}>
                {recurrenceOption==='monthly' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Monthly</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.radioRow} onPress={() => { setRecurrenceOption('annually'); setAutoRecurrence(true); }}>
              <View style={[styles.radioOuter, recurrenceOption==='annually' && styles.radioOuterActive]}>
                {recurrenceOption==='annually' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Annually</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.radioRow} onPress={() => { setRecurrenceOption('weekday'); setAutoRecurrence(true); }}>
              <View style={[styles.radioOuter, recurrenceOption==='weekday' && styles.radioOuterActive]}>
                {recurrenceOption==='weekday' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Every weekday (Mon–Fri)</Text>
            </TouchableOpacity>

            <View style={{ marginTop: 12 }}>
              <Text style={{ marginBottom: 6, color: theme.colors.text }}>Recurrence End Date</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={() => setShowRecurrenceEndPicker(true)}>
                <Text style={styles.pickerText}>{recurrenceEndDate || 'dd-mm-yyyy'}</Text>
                <Calendar size={18} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity style={styles.createButton} onPress={() => setRecurrenceModalVisible(false)}>
                <Text style={styles.createText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.background,
  },
  scrollView: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 6,
  },
  required: {
    color: theme.colors.primary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.colors.background,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.text,
  },
  dateTimeContainer: {
    marginBottom: 16,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateTimeField: {
    flex: 1,
    marginHorizontal: 6,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: theme.colors.background,
  },
  pickerText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  recurrenceLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  switchContainer: {
    marginLeft: 'auto',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 8,
  },
  dropdownText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownList: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    elevation: 2,
  },
  dropdownItem: {
    padding: 12,
  },
  dropdownItemSelected: {
    backgroundColor: theme.colors.primary,
  },
  dropdownItemText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  dropdownItemTextSelected: {
    color: theme.colors.background,
    fontWeight: '600',
  },
  recurrenceModalBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: theme.colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  recurrenceModal: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  recurrenceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 10,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioOuterActive: {
    borderColor: theme.colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  radioLabel: {
    color: theme.colors.text,
    fontSize: 15,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 4,
    marginRight: 6,
  },
  checkboxBoxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxLabel: {
    color: theme.colors.text,
    fontSize: 14,
  },
  recurrenceBtn: {
    marginLeft: 'auto',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 12,
  },
  cancelText: {
    color: theme.colors.text,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddTaskScreen;