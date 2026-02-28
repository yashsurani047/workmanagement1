// src/Components/Projects/CreateSubTaskWizard/StepBasicInfo.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  FlatList,
} from 'react-native';
import { useTheme } from '../../../Themes/ThemeContext';
import DropdownSelect from '../../Common/DropdownSelect';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getUsers } from '../../../Utils/apiUtils';
import {
  Type,
  AlignLeft,
  Activity,
  Flag,
  Calendar,
  Clock,
  Users,
  Search,
  X,
  ChevronRight,
  Check,
  CalendarClock,
} from 'lucide-react-native';

const fmtDate = (d) => {
  try { return d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select date'; }
  catch { return 'Select date'; }
};
const fmtTime = (d) => {
  try { return d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select time'; }
  catch { return 'Select time'; }
};

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

export default function StepBasicInfo({
  organizationId = 'one',
  onNext,
  formData,
  updateFormData,
  navigation,
}) {
  const { theme } = useTheme();
  const [showDuePicker, setShowDuePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef();

  const { title, description, estimatedTime, status, priority, dueDate, allDay, startTime, endTime, assignees = [] } = formData;

  const set = (field, value) => updateFormData({ [field]: value });

  const statusOptions = [
    { label: 'Not Started', value: 'not_started' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'On Hold', value: 'on_hold' },
  ];

  const priorityOptions = [
    { label: 'Urgent & Important', value: 'urgent_important' },
    { label: 'Urgent & Not Important', value: 'urgent_not_important' },
    { label: 'Not Urgent & Important', value: 'not_urgent_important' },
    { label: 'Not Urgent & Not Important', value: 'not_urgent_not_important' },
  ];

  useEffect(() => {
    if (!searchText || searchText.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await getUsers(organizationId);
        if (res && Array.isArray(res.users)) {
          const filtered = res.users
            .filter(u => typeof u.user_full_name === 'string' && u.user_full_name.toLowerCase().includes(searchText.toLowerCase()))
            .filter(u => !assignees.find(a => a.id === u.user_id));
          setSearchResults(filtered.map(u => ({ id: u.user_id, name: u.user_full_name, avatar: u.user_full_name.charAt(0).toUpperCase() })));
        }
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 350);
    return () => clearTimeout(searchTimeout.current);
  }, [searchText, organizationId, assignees]);

  const canContinue = !!title?.trim();

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >

      {/* Title */}
      <FieldLabel icon={Type} label="Subtask Title" required />
      <TextInput
        style={{ borderWidth: 1.5, borderColor: title ? theme.colors.primary : theme.colors.border, backgroundColor: theme.colors.muted100, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, fontWeight: '500', color: theme.colors.text }}
        placeholder="What needs to be done?"
        placeholderTextColor={theme.colors.textSecondary}
        value={title}
        onChangeText={(v) => set('title', v)}
      />

      {/* Description */}
      <FieldLabel icon={AlignLeft} label="Description" color={theme.colors.secondary} />
      <TextInput
        style={{ borderWidth: 1.5, borderColor: description ? theme.colors.primary : theme.colors.border, backgroundColor: theme.colors.muted100, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, fontWeight: '500', color: theme.colors.text, height: 80, textAlignVertical: 'top' }}
        multiline
        placeholder="Add details about the subtask…"
        placeholderTextColor={theme.colors.textSecondary}
        value={estimatedTime}
        onChangeText={(v) => set('estimatedTime', v)}
      />

      {/* Due Date & All Day Toggle */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
        <View style={{ flex: 1.5 }}>
          <FieldLabel icon={Calendar} label="Due Date" color="#10B981" />
          <TouchableOpacity onPress={() => setShowDuePicker(true)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: theme.colors.muted100, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 }}>
            <Text style={{ fontSize: 13.5, fontWeight: '500', color: dueDate ? theme.colors.text : theme.colors.textSecondary }}>{fmtDate(dueDate)}</Text>
            <Calendar size={15} color={theme.colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

      </View>

      {showDuePicker && (
        <DateTimePicker value={dueDate || new Date()} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(e, d) => { if (Platform.OS !== 'ios') setShowDuePicker(false); if (e.type !== 'dismissed' && d) set('dueDate', d); }} />
      )}

      {/* Estimated Time */}
      <FieldLabel icon={CalendarClock} label="Estimated Time" color={theme.colors.secondary} />
      <TextInput
        style={{ borderWidth: 1.5, borderColor: description ? theme.colors.primary : theme.colors.border, backgroundColor: theme.colors.muted100, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, fontWeight: '500', color: theme.colors.text, textAlignVertical: 'top' }}
        multiline
        placeholder="Add estimated time for the subtask…"
        placeholderTextColor={theme.colors.textSecondary}
        value={estimatedTime}
        onChangeText={(v) => set('estimatedTime', v)}
      />

      {/* Assigned Team Members */}
      <FieldLabel icon={Users} label="Assign Team Members" color={theme.colors.primary} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: theme.colors.muted100, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 }}>
        <Search size={16} color={theme.colors.textSecondary} strokeWidth={2} />
        <TextInput
          style={{ flex: 1, fontSize: 14, fontWeight: '500', color: theme.colors.text, paddingVertical: 9 }}
          placeholder="Search team members…"
          placeholderTextColor={theme.colors.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Status & Priority Row */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {/* <View style={{ flex: 1 }}>
          <FieldLabel icon={Activity} label="Status" color={theme.colors.task} />
          <DropdownSelect value={status} options={statusOptions} onChange={(v) => set('status', v)} />
        </View> */}
        <View style={{ flex: 1 }}>
          <FieldLabel icon={Flag} label="Priority" color={theme.colors.event} />
          <DropdownSelect value={priority} options={priorityOptions} onChange={(v) => set('priority', v)} />
        </View>
      </View>


      {/* Start / End Time
      {!allDay && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <FieldLabel icon={Clock} label="Start Time" color="#8B5CF6" />
            <TouchableOpacity onPress={() => setShowStartPicker(true)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: theme.colors.muted100, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: startTime ? theme.colors.text : theme.colors.textSecondary }}>{fmtTime(startTime)}</Text>
              <Clock size={14} color={theme.colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <FieldLabel icon={Clock} label="End Time" color="#EC4899" />
            <TouchableOpacity onPress={() => setShowEndPicker(true)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: theme.colors.muted100, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: endTime ? theme.colors.text : theme.colors.textSecondary }}>{fmtTime(endTime)}</Text>
              <Clock size={14} color={theme.colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showStartPicker && (
        <DateTimePicker value={startTime || new Date()} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => { if (Platform.OS !== 'ios') setShowStartPicker(false); if (e.type !== 'dismissed' && d) set('startTime', d); }} />
      )}
      {showEndPicker && (
        <DateTimePicker value={endTime || new Date()} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => { if (Platform.OS !== 'ios') setShowEndPicker(false); if (e.type !== 'dismissed' && d) set('endTime', d); }} />
      )}
 */}
      {/* Results Dropdown */}
      {searchText.length > 1 && searchResults.length > 0 && (
        <View style={{ marginTop: 8, maxHeight: 150, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.card, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, overflow: 'hidden', zIndex: 100 }}>
          <FlatList
            data={searchResults}
            keyExtractor={(i) => String(i.id)}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => { set('assignees', [...assignees, item]); setSearchText(''); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.borderMuted }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>{item.avatar}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Selected Members Chips */}
      {assignees.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {assignees.map((a) => (
            <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${theme.colors.primary}12`, paddingLeft: 4, paddingRight: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: `${theme.colors.primary}25` }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>{a.avatar}</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.text }}>{a.name}</Text>
              <TouchableOpacity onPress={() => set('assignees', assignees.filter(u => u.id !== a.id))}>
                <X size={14} color={theme.colors.error} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Footer Buttons */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 28 }}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          activeOpacity={0.8}
          style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            paddingVertical: 14, borderRadius: 14,
            borderWidth: 1.5, borderColor: theme.colors.border,
            backgroundColor: theme.colors.card,
          }}
        >
          <X size={16} color={theme.colors.textSecondary} strokeWidth={2} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text }}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onNext}
          disabled={!canContinue}
          activeOpacity={0.8}
          style={{
            flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            paddingVertical: 14, borderRadius: 14,
            backgroundColor: theme.colors.primary,
            opacity: canContinue ? 1 : 0.45,
            shadowColor: theme.colors.primary,
            shadowOpacity: canContinue ? 0.3 : 0,
            shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
            elevation: canContinue ? 6 : 0,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFF', letterSpacing: 0.2 }}>Next: Resources</Text>
          <ChevronRight size={18} color="#FFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}
