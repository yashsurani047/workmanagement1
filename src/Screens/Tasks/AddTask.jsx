import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
  StatusBar,
  Animated,
  Easing,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  Calendar,
  Clock,
  Repeat,
  ChevronDown,
  ChevronLeft,
  X,
  Type,
  AlignLeft,
  Flag,
  Activity,
  Check,
  ClipboardList,
  Loader,
  Link2,
  Plus,
  Paperclip,
  FileText,
  Upload,
  ExternalLink,
} from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTheme } from '../../Themes/ThemeContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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

const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Not Started', value: 'not_started' },
  { label: 'On Hold', value: 'on_hold' },
  { label: 'Cancelled', value: 'cancelled' },
];

const weekdayList = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

const recurrenceOptions = [
  { key: 'none', label: 'Does not repeat' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'annually', label: 'Annually' },
  { key: 'weekday', label: 'Every weekday (Mon–Fri)' },
];

const AddTaskScreen = ({ navigation }) => {
  const { theme } = useTheme();
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Links & Attachments states
  const [links, setLinks] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [url, setUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showRecurrenceEndPicker, setShowRecurrenceEndPicker] = useState(false);

  // Header animations
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(headerSlide, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Helper functions ──
  const formatDate = (d) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
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
    const [dd, mm, yyyy] = str.split('-').map((v) => parseInt(v, 10));
    if (!dd || !mm || !yyyy) return null;
    return startOfDay(new Date(yyyy, mm - 1, dd));
  };

  const toApiDate = (str) => {
    const d = parseDateString(str);
    if (!d) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const toApiTime = (str) => {
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

  const toggleWeekday = (key) => {
    setSelectedWeekdays((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const addLink = () => {
    if (!url || !linkTitle) {
      Alert.alert('Required Fields', 'Please fill in URL and Link Title');
      return;
    }
    const newLink = {
      id: Date.now().toString(),
      url,
      title: linkTitle,
    };
    setLinks([...links, newLink]);
    setUrl('');
    setLinkTitle('');
  };

  const removeLink = (linkId) => {
    setLinks(links.filter((link) => link.id !== linkId));
  };

  const pickDocument = async () => {
    const options = {
      mediaType: 'photo',
      selectionLimit: 0, // 0 means multi-selection
      includeBase64: false,
    };

    try {
      const result = await launchImageLibrary(options);

      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (result.errorCode) {
        console.warn('ImagePicker Error: ', result.errorMessage);
        Alert.alert('Error', result.errorMessage || 'Failed to pick file.');
        return;
      }

      if (result.assets) {
        const newAttachments = result.assets.map((file) => {
          const cleanName = file.fileName || `image_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          return {
            id: Date.now().toString() + Math.random(),
            uri: file.uri,
            name: cleanName,
            type: file.type || 'image/jpeg',
            size:
              file.fileSize !== null && file.fileSize !== undefined
                ? `${(file.fileSize / (1024 * 1024)).toFixed(2)} MB`
                : 'Unknown',
            mimeType: file.type,
            file: {
              uri: file.uri,
              name: cleanName,
              type: file.type,
            },
          };
        });
        setAttachments([...attachments, ...newAttachments]);
      }
    } catch (err) {
      console.warn('Picker Error: ', err);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  };

  const removeAttachment = (attachmentId) => {
    setAttachments(attachments.filter((att) => att.id !== attachmentId));
  };

  // ── Initialize for edit mode ──
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask?.title || '');
      setDescription(editingTask?.description || '');
      setPriority(mapPriorityToUi(editingTask?.priority));
      const toUiDate = (s) => {
        if (!s) return '';
        const [y, m, d] = s.split('-');
        if (!y || !m || !d) return '';
        return `${d}-${m}-${y}`;
      };
      setStartDate(toUiDate(editingTask?.start_date || ''));
      setEndDate(toUiDate(editingTask?.end_date || ''));
      const toUiTime = (s) => {
        if (!s) return '';
        let [hh, mm] = s.split(':').map((v) => parseInt(v, 10));
        let ampm = 'AM';
        if (hh >= 12) { ampm = 'PM'; if (hh > 12) hh -= 12; } else if (hh === 0) hh = 12;
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ampm}`;
      };
      setAllDay(!!editingTask?.all_day);
      setStartTime(editingTask?.all_day ? '' : toUiTime(editingTask?.start_time));
      setEndTime(editingTask?.all_day ? '' : toUiTime(editingTask?.end_time));
      setStatus((editingTask?.status || 'pending').toLowerCase());

      // Load links and attachments if they exist
      if (editingTask?.links) {
        try {
          const fetchedLinks = typeof editingTask.links === 'string'
            ? JSON.parse(editingTask.links)
            : editingTask.links;
          setLinks(Array.isArray(fetchedLinks) ? fetchedLinks : []);
        } catch (e) {
          console.warn("Error parsing links:", e);
          setLinks([]);
        }
      }

      if (editingTask?.attachments) {
        setAttachments(editingTask.attachments.map(att => ({
          id: att.id || Math.random().toString(),
          name: att.name || att.file_name || 'File',
          size: att.size || 'Size unknown',
          uri: att.file || att.uri || '',
          mimeType: att.mime_type || '',
          isExisting: true
        })));
      }
    }
  }, [editingTask]);

  // ── Build recurrence payload ──
  const buildRecurrence = () => {
    let rec = 'none';
    let recDays = null;
    if (autoRecurrence) {
      if (recurrenceOption === 'daily') rec = 'daily';
      else if (recurrenceOption === 'weekly') {
        rec = 'weekly';
        recDays = Array.isArray(selectedWeekdays) && selectedWeekdays.length > 0 ? selectedWeekdays : null;
      } else if (recurrenceOption === 'weekday') {
        rec = 'weekly';
        recDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      } else if (recurrenceOption === 'monthly') rec = 'monthly';
      else if (recurrenceOption === 'annually') rec = 'annually';
    }
    return { rec, recDays };
  };

  // ── Create task ──
  const onCreatePress = async () => {
    try {
      if (!title?.trim()) return Alert.alert('Validation', 'Title is required');
      if (!startDate) return Alert.alert('Validation', 'Start date is required');
      if (!allDay && (!startTime || !endTime))
        return Alert.alert('Validation', 'Start and End time are required for non all-day tasks');

      setIsSubmitting(true);
      const userInfoRaw = await AsyncStorage.getItem('userInfo');
      const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
      const orgId = (await AsyncStorage.getItem('organization_id')) || userInfo?.organization_id || 'one';
      const userId = (await AsyncStorage.getItem('user_id')) || userInfo?.user_id || null;
      const createdBy = userInfo?.user_name || userInfo?.username || (await AsyncStorage.getItem('username')) || null;

      if (!createdBy) {
        setIsSubmitting(false);
        return Alert.alert('Error', 'Your account username is missing. Please sign in again.');
      }

      const { rec, recDays } = buildRecurrence();
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
        links: links,
        attachments: attachments.map(a => a.file), // passing raw file objects
      };

      const res = await createTask(orgId, payload);
      setIsSubmitting(false);
      if (res?.success) {
        Alert.alert('Success', 'Task created successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        Alert.alert('Error', res?.error || 'Failed to create task');
      }
    } catch (e) {
      setIsSubmitting(false);
      Alert.alert('Error', e?.message || 'Failed to create task');
    }
  };

  // ── Update task ──
  const onUpdatePress = async () => {
    try {
      if (!title?.trim()) return Alert.alert('Validation', 'Title is required');
      setIsSubmitting(true);
      const userInfoRaw = await AsyncStorage.getItem('userInfo');
      const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
      const orgId = (await AsyncStorage.getItem('organization_id')) || userInfo?.organization_id || 'one';
      const taskId = editingTask?.personal_task_id || editingTask?.id;
      if (!taskId) { setIsSubmitting(false); return Alert.alert('Error', 'Missing task id'); }

      const { rec, recDays } = buildRecurrence();
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
        links: links,
        attachments: attachments.map(a => a.file),
      };

      const res = await updatePersonalTask(orgId, taskId, updatedData);
      setIsSubmitting(false);
      if (res?.success) {
        Alert.alert('Success', 'Task updated', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        Alert.alert('Error', res?.error || 'Failed to update task');
      }
    } catch (e) {
      setIsSubmitting(false);
      Alert.alert('Error', e?.message || 'Failed to update task');
    }
  };

  const selectedPriorityLabel = priorityOptions.find((p) => p.value === priority)?.label || '';
  const selectedStatusLabel = statusOptions.find((s) => s.value === status)?.label || 'Pending';

  // ── Render helper: icon-labeled section ──
  const SectionLabel = ({ icon: Icon, iconColor, label, required }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: `${iconColor}15`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}
      >
        <Icon size={16} color={iconColor} strokeWidth={2} />
      </View>
      <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text }}>
        {label}
      </Text>
      {required && <Text style={{ fontSize: 12, color: theme.colors.error, marginLeft: 4 }}>*</Text>}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
      <StatusBar
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      {/* ──────── Header ──────── */}
      <Animated.View
        style={{
          opacity: headerFade,
          transform: [{ translateY: headerSlide }],
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          backgroundColor: theme.colors.background,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: theme.colors.muted100,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
          }}
        >
          <ChevronLeft size={22} color={theme.colors.text} strokeWidth={2} />
        </TouchableOpacity>

        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            backgroundColor: `${theme.colors.primary}15`,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <ClipboardList size={22} color={theme.colors.primary} strokeWidth={1.8} />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 20, fontWeight: '900', color: theme.colors.text, letterSpacing: -0.5 }}
            numberOfLines={1}
          >
            {mode === 'update' ? 'Update Task' : 'Create Personal Task'}
          </Text>
          <Text style={{ fontSize: 12.5, color: theme.colors.textSecondary, fontWeight: '500', marginTop: 2 }}>
            {mode === 'update' ? 'Edit your task details' : 'Add a new personal task'}
          </Text>
        </View>
      </Animated.View>

      {/* ──────── Content ──────── */}
      <ScrollView
        style={{ flex: 1, padding: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Title ─── */}
        <View style={{ marginBottom: 20 }}>
          <SectionLabel icon={Type} iconColor={theme.colors.primary} label="Title" required />
          <TextInput
            style={{
              borderWidth: 1.5,
              borderColor: title ? theme.colors.primary : theme.colors.border,
              backgroundColor: theme.colors.muted100,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
              fontWeight: '500',
              color: theme.colors.text,
            }}
            placeholder="Enter task title"
            placeholderTextColor={theme.colors.textSecondary}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* ─── Description ─── */}
        <View style={{ marginBottom: 20 }}>
          <SectionLabel icon={AlignLeft} iconColor={theme.colors.secondary} label="Description" />
          <TextInput
            style={{
              borderWidth: 1.5,
              borderColor: description ? theme.colors.primary : theme.colors.border,
              backgroundColor: theme.colors.muted100,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
              fontWeight: '500',
              color: theme.colors.text,
              height: 110,
              textAlignVertical: 'top',
            }}
            placeholder="Describe the task details..."
            placeholderTextColor={theme.colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* ─── All Day Toggle ─── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20,
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: theme.colors.muted100,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <TouchableOpacity onPress={() => setAllDay(!allDay)} style={{ padding: 2 }}>
            <View
              style={{
                width: 48,
                height: 26,
                borderRadius: 13,
                backgroundColor: allDay ? theme.colors.primary : theme.colors.border,
                justifyContent: 'center',
                paddingHorizontal: 2,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: '#FFFFFF',
                  transform: [{ translateX: allDay ? 22 : 0 }],
                  shadowColor: '#000',
                  shadowOpacity: 0.15,
                  shadowRadius: 2,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 2,
                }}
              />
            </View>
          </TouchableOpacity>
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>All day</Text>
        </View>

        {/* ─── Start/End Date ─── */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <SectionLabel icon={Calendar} iconColor={theme.colors.primary} label="Start Date" required />
            <TouchableOpacity
              onPress={() => setShowStartDatePicker(true)}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: startDate ? theme.colors.primary : theme.colors.border,
                backgroundColor: theme.colors.muted100,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: startDate ? theme.colors.text : theme.colors.textSecondary,
                }}
              >
                {startDate || 'dd-mm-yyyy'}
              </Text>
              <Calendar size={16} color={theme.colors.textSecondary} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <SectionLabel icon={Calendar} iconColor={theme.colors.event} label="End Date" />
            <TouchableOpacity
              onPress={() => setShowEndDatePicker(true)}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: endDate ? theme.colors.primary : theme.colors.border,
                backgroundColor: theme.colors.muted100,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: endDate ? theme.colors.text : theme.colors.textSecondary,
                }}
              >
                {endDate || 'dd-mm-yyyy'}
              </Text>
              <Calendar size={16} color={theme.colors.textSecondary} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Start/End Time ─── */}
        {!allDay && (
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <SectionLabel icon={Clock} iconColor={theme.colors.task} label="Start Time" required />
              <TouchableOpacity
                onPress={() => setShowStartTimePicker(true)}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: startTime ? theme.colors.primary : theme.colors.border,
                  backgroundColor: theme.colors.muted100,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: startTime ? theme.colors.text : theme.colors.textSecondary,
                  }}
                >
                  {startTime || '--:-- --'}
                </Text>
                <Clock size={16} color={theme.colors.textSecondary} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
              <SectionLabel icon={Clock} iconColor={theme.colors.meeting} label="End Time" required />
              <TouchableOpacity
                onPress={() => setShowEndTimePicker(true)}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: endTime ? theme.colors.primary : theme.colors.border,
                  backgroundColor: theme.colors.muted100,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: endTime ? theme.colors.text : theme.colors.textSecondary,
                  }}
                >
                  {endTime || '--:-- --'}
                </Text>
                <Clock size={16} color={theme.colors.textSecondary} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── Recurrence ───
        <View style={{ marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => setRecurrenceModalVisible(true)}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 14,
              paddingHorizontal: 16,
              backgroundColor: theme.colors.muted100,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: `${theme.colors.event}15`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Repeat size={16} color={theme.colors.event} strokeWidth={2} />
            </View>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
              Recurrence
            </Text>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: recurrenceOption !== 'none' ? theme.colors.primary : theme.colors.card,
                borderWidth: recurrenceOption === 'none' ? 1 : 0,
                borderColor: theme.colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: recurrenceOption !== 'none' ? '#FFFFFF' : theme.colors.textSecondary,
                }}
              >
                {recurrenceOptions.find((r) => r.key === recurrenceOption)?.label || 'Select'}
              </Text>
            </View>
          </TouchableOpacity>
        </View> */}



        {/* ─── Priority ─── */}
        <View style={{ marginBottom: 20 }}>
          <SectionLabel icon={Flag} iconColor={theme.colors.task} label="Priority" />
          <TouchableOpacity
            onPress={() => { setShowPriorityDropdown(!showPriorityDropdown); setShowStatusDropdown(false); }}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: showPriorityDropdown ? theme.colors.primary : theme.colors.border,
              backgroundColor: theme.colors.muted100,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
              {selectedPriorityLabel}
            </Text>
            <ChevronDown
              size={18}
              color={theme.colors.textSecondary}
              style={{ transform: [{ rotate: showPriorityDropdown ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>

          {showPriorityDropdown && (
            <View
              style={{
                marginTop: 6,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 14,
                backgroundColor: theme.colors.card,
                overflow: 'hidden',
              }}
            >
              {priorityOptions.map((option) => {
                const sel = option.value === priority;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => { setPriority(option.value); setShowPriorityDropdown(false); }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      backgroundColor: sel ? `${theme.colors.primary}10` : 'transparent',
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.borderMuted,
                    }}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 7,
                        borderWidth: 2,
                        borderColor: sel ? theme.colors.primary : theme.colors.border,
                        backgroundColor: sel ? theme.colors.primary : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      {sel && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: sel ? '700' : '500', color: sel ? theme.colors.primary : theme.colors.text }}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* ─── Related Links ─── */}
        <View style={{ marginBottom: 24 }}>
          <SectionLabel icon={Link2} iconColor={theme.colors.primary} label="Related Links" />

          {/* Add Link Form */}
          <View
            style={{
              backgroundColor: theme.colors.muted100,
              borderWidth: 1.5,
              borderColor: theme.colors.border,
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <TextInput
              style={{
                borderWidth: 1.5,
                borderColor: url ? theme.colors.primary : theme.colors.border,
                backgroundColor: theme.colors.card,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                fontWeight: '500',
                color: theme.colors.text,
                marginBottom: 10,
              }}
              placeholder="URL (e.g., https://...)"
              placeholderTextColor={theme.colors.textSecondary}
              value={url}
              onChangeText={setUrl}
              keyboardType="url"
            />
            <TextInput
              style={{
                borderWidth: 1.5,
                borderColor: linkTitle ? theme.colors.primary : theme.colors.border,
                backgroundColor: theme.colors.card,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                fontWeight: '500',
                color: theme.colors.text,
                marginBottom: 12,
              }}
              placeholder="Link Title"
              placeholderTextColor={theme.colors.textSecondary}
              value={linkTitle}
              onChangeText={setLinkTitle}
            />
            <TouchableOpacity
              onPress={addLink}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: theme.colors.primary,
                paddingVertical: 12,
                borderRadius: 12,
              }}
            >
              <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Add Link</Text>
            </TouchableOpacity>
          </View>

          {/* Links List */}
          {links.length > 0 && (
            <View style={{ marginTop: 4 }}>
              {links.map((link) => (
                <View
                  key={link.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.colors.card,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: `${theme.colors.primary}12`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <ExternalLink size={18} color={theme.colors.primary} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}
                      numberOfLines={1}
                    >
                      {link.title}
                    </Text>
                    <Text
                      style={{ fontSize: 12, color: theme.colors.primary, marginTop: 2 }}
                      numberOfLines={1}
                    >
                      {link.url}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeLink(link.id)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: `${theme.colors.error}12`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: 8,
                    }}
                  >
                    <X size={16} color={theme.colors.error} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ─── Attachments ─── */}
        <View style={{ marginBottom: 30 }}>
          <SectionLabel icon={Paperclip} iconColor={theme.colors.task} label="Attachments" />

          {/* Upload Area */}
          <TouchableOpacity
            onPress={pickDocument}
            activeOpacity={0.8}
            style={{
              borderWidth: 1.5,
              borderColor: theme.colors.border,
              borderStyle: 'dashed',
              borderRadius: 16,
              paddingVertical: 24,
              alignItems: 'center',
              backgroundColor: theme.colors.muted100,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: `${theme.colors.primary}12`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}
            >
              <Upload size={24} color={theme.colors.primary} strokeWidth={1.8} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text, marginBottom: 4 }}>
              Tap to select files
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
              Supports PDF, DOCX, images, and more
            </Text>
          </TouchableOpacity>

          {/* Attachment list */}
          {attachments.map((attachment) => (
            <View
              key={attachment.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.card,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  backgroundColor: `${theme.colors.task}12`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <FileText size={20} color={theme.colors.task} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}
                  numberOfLines={1}
                >
                  {attachment.name}
                </Text>
                <Text
                  style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2, fontWeight: '500' }}
                >
                  {attachment.size}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => removeAttachment(attachment.id)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: `${theme.colors.error}12`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} color={theme.colors.error} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* ─── Status (edit mode) ─── */}
        {mode === 'update' && (
          <View style={{ marginBottom: 20 }}>
            <SectionLabel icon={Activity} iconColor={theme.colors.event} label="Status" />
            <TouchableOpacity
              onPress={() => { setShowStatusDropdown(!showStatusDropdown); setShowPriorityDropdown(false); }}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: showStatusDropdown ? theme.colors.primary : theme.colors.border,
                backgroundColor: theme.colors.muted100,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
                {selectedStatusLabel}
              </Text>
              <ChevronDown
                size={18}
                color={theme.colors.textSecondary}
                style={{ transform: [{ rotate: showStatusDropdown ? '180deg' : '0deg' }] }}
              />
            </TouchableOpacity>

            {showStatusDropdown && (
              <View
                style={{
                  marginTop: 6,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: 14,
                  backgroundColor: theme.colors.card,
                  overflow: 'hidden',
                }}
              >
                {statusOptions.map((opt) => {
                  const sel = opt.value === status;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => { setStatus(opt.value); setShowStatusDropdown(false); }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        backgroundColor: sel ? `${theme.colors.primary}10` : 'transparent',
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.borderMuted,
                      }}
                    >
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 7,
                          borderWidth: 2,
                          borderColor: sel ? theme.colors.primary : theme.colors.border,
                          backgroundColor: sel ? theme.colors.primary : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        {sel && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: sel ? '700' : '500', color: sel ? theme.colors.primary : theme.colors.text }}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ──────── Footer ──────── */}
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.background,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 16,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.card,
          }}
        >
          <X size={16} color={theme.colors.textSecondary} strokeWidth={2} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text }}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={mode === 'update' ? onUpdatePress : onCreatePress}
          disabled={isSubmitting}
          activeOpacity={0.8}
          style={{
            flex: 1.5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 16,
            borderRadius: 14,
            backgroundColor: theme.colors.primary,
            opacity: isSubmitting ? 0.5 : 1,
            shadowColor: theme.colors.primary,
            shadowOpacity: isSubmitting ? 0 : 0.3,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: isSubmitting ? 0 : 6,
          }}
        >
          {isSubmitting ? (
            <Loader size={18} color="#FFFFFF" strokeWidth={2} />
          ) : (
            <ClipboardList size={18} color="#FFFFFF" strokeWidth={2} />
          )}
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 }}>
            {mode === 'update' ? 'Update Task' : 'Create Task'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ──────── Date/Time Pickers ──────── */}
      <DateTimePickerModal
        isVisible={showStartDatePicker}
        mode="date"
        onConfirm={(date) => {
          const picked = startOfDay(date);
          const newStart = formatDate(picked);
          setStartDate(newStart);
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
          setEndDate(formatDate(startOfDay(date)));
          setShowEndDatePicker(false);
        }}
        onCancel={() => setShowEndDatePicker(false)}
        minimumDate={startDate ? parseDateString(startDate) || startOfDay(new Date()) : startOfDay(new Date())}
      />
      <DateTimePickerModal
        isVisible={showStartTimePicker}
        mode="time"
        is24Hour={false}
        onConfirm={(date) => { setStartTime(formatTime(date)); setShowStartTimePicker(false); }}
        onCancel={() => setShowStartTimePicker(false)}
      />
      <DateTimePickerModal
        isVisible={showEndTimePicker}
        mode="time"
        is24Hour={false}
        onConfirm={(date) => { setEndTime(formatTime(date)); setShowEndTimePicker(false); }}
        onCancel={() => setShowEndTimePicker(false)}
      />
      <DateTimePickerModal
        isVisible={showRecurrenceEndPicker}
        mode="date"
        onConfirm={(date) => { setRecurrenceEndDate(formatDate(startOfDay(date))); setShowRecurrenceEndPicker(false); }}
        onCancel={() => setShowRecurrenceEndPicker(false)}
        minimumDate={startOfDay(new Date())}
      />

      {/* ──────── Recurrence Modal ──────── */}
      <Modal visible={recurrenceModalVisible} transparent animationType="fade" onRequestClose={() => setRecurrenceModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setRecurrenceModalVisible(false)}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <TouchableWithoutFeedback>
              <View
                style={{
                  width: '90%',
                  maxWidth: 420,
                  backgroundColor: theme.colors.card,
                  borderRadius: 20,
                  padding: 24,
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 10,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '800', color: theme.colors.text, marginBottom: 16 }}>
                  Recurrence Options
                </Text>

                {recurrenceOptions.map((opt) => {
                  const active = recurrenceOption === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => {
                        setRecurrenceOption(opt.key);
                        setAutoRecurrence(opt.key !== 'none');
                      }}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 12,
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          borderWidth: 2,
                          borderColor: active ? theme.colors.primary : theme.colors.border,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {active && (
                          <View
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: theme.colors.primary,
                            }}
                          />
                        )}
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: active ? '700' : '500', color: active ? theme.colors.text : theme.colors.textSecondary }}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {/* Weekly day selector */}
                {recurrenceOption === 'weekly' && (
                  <View style={{ marginLeft: 34, marginTop: 4, marginBottom: 8 }}>
                    <Text style={{ marginBottom: 10, color: theme.colors.text, fontWeight: '600', fontSize: 13 }}>
                      Repeat on:
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {weekdayList.map((d) => {
                        const sel = selectedWeekdays.includes(d.key);
                        return (
                          <TouchableOpacity
                            key={d.key}
                            onPress={() => toggleWeekday(d.key)}
                            style={{
                              paddingHorizontal: 14,
                              paddingVertical: 8,
                              borderRadius: 10,
                              borderWidth: 1.5,
                              borderColor: sel ? theme.colors.primary : theme.colors.border,
                              backgroundColor: sel ? `${theme.colors.primary}12` : theme.colors.muted100,
                            }}
                          >
                            <Text style={{ fontSize: 13, fontWeight: sel ? '700' : '500', color: sel ? theme.colors.primary : theme.colors.textSecondary }}>
                              {d.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Recurrence end date */}
                <View style={{ marginTop: 14 }}>
                  <Text style={{ marginBottom: 8, color: theme.colors.text, fontWeight: '600', fontSize: 13 }}>
                    Recurrence End Date
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowRecurrenceEndPicker(true)}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderWidth: 1.5,
                      borderColor: recurrenceEndDate ? theme.colors.primary : theme.colors.border,
                      backgroundColor: theme.colors.muted100,
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: recurrenceEndDate ? theme.colors.text : theme.colors.textSecondary,
                      }}
                    >
                      {recurrenceEndDate || 'dd-mm-yyyy'}
                    </Text>
                    <Calendar size={16} color={theme.colors.textSecondary} strokeWidth={1.8} />
                  </TouchableOpacity>
                </View>

                {/* Done button */}
                <TouchableOpacity
                  onPress={() => setRecurrenceModalVisible(false)}
                  activeOpacity={0.8}
                  style={{
                    marginTop: 20,
                    paddingVertical: 14,
                    borderRadius: 14,
                    backgroundColor: theme.colors.primary,
                    alignItems: 'center',
                    shadowColor: theme.colors.primary,
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 4,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Done</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default AddTaskScreen;