import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Platform,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  X,
  Type,
  AlignLeft,
  Activity,
  Palette,
  Clock,
  MessageSquare,
  Check,
  Flag,
} from "lucide-react-native";
import { useTheme } from "../../../Themes/ThemeContext";

export default function ProjectDetailsTab({
  styles,
  formData,
  setFormData,
  statusOpen,
  setStatusOpen,
  STATUS_OPTIONS,
  getStatusIcon,
  getStatusColor,
  showColorPicker,
  toggleColorPicker,
  fadeAnim,
  scaleAnim,
  CheckIcon,
  COLOR_PALETTE,
  showStartDatePicker,
  setShowStartDatePicker,
  showEndDatePicker,
  setShowEndDatePicker,
  showDueTimePicker,
  setShowDueTimePicker,
  isMounted,
  setActiveTab,
  isSubmitting,
  navigation,
}) {
  const { theme } = useTheme();
  const [noEndDate, setNoEndDate] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);

  const PRIORITY_OPTIONS = [
    { label: 'Urgent & Important', value: 'urgent_important', color: '#EF4444', icon: '🔴' },
    { label: 'Urgent & Not Important', value: 'urgent_not_important', color: '#F97316', icon: '🟠' },
    { label: 'Not Urgent & Important', value: 'not_urgent_important', color: '#3B82F6', icon: '🔵' },
    { label: 'Not Urgent & Not Imp.', value: 'not_urgent_not_imp', color: '#6B7280', icon: '⚪' },
  ];

  const selectedPriority = PRIORITY_OPTIONS.find(p => p.value === formData.priority) || null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 8 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ─── Project Name ─── */}
        <View style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: `${theme.colors.primary}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}
            >
              <Type size={16} color={theme.colors.primary} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text }}>
              Project Name
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.error, marginLeft: 4 }}>*</Text>
          </View>
          <TextInput
            style={{
              borderWidth: 1.5,
              borderColor: formData.projectName ? theme.colors.primary : theme.colors.border,
              backgroundColor: theme.colors.muted100,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 15,
              fontWeight: '500',
              color: theme.colors.text,
            }}
            placeholder="Enter project name"
            placeholderTextColor={theme.colors.textSecondary}
            value={formData.projectName}
            onChangeText={(v) => setFormData((prev) => ({ ...prev, projectName: v }))}
          />
        </View>

        {/* ─── Description ─── */}
        <View style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
            <View
              style={{
                width: 25,
                height: 20,
                borderRadius: 8,
                backgroundColor: `${theme.colors.secondary}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}
            >
              <AlignLeft size={16} color={theme.colors.secondary} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text }}>
              Description
            </Text>
          </View>
          <TextInput
            style={{
              borderWidth: 1.5,
              borderColor: formData.description ? theme.colors.primary : theme.colors.border,
              backgroundColor: theme.colors.muted100,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 15,
              fontWeight: '500',
              color: theme.colors.text,
              height: 55,
              textAlignVertical: 'top',
            }}
            placeholder="Briefly describe..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            value={formData.description}
            onChangeText={(v) => setFormData((prev) => ({ ...prev, description: v }))}
          />
        </View>

        {/* ─── Status & Project Color — always in one row ─── */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10, zIndex: 10 }}>

          {/* Status */}
          <View style={{ flex: 1, zIndex: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  backgroundColor: `${theme.colors.task}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 6,
                }}
              >
                <Activity size={13} color={theme.colors.task} strokeWidth={2} />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text }}>Status</Text>
            </View>
            <DropDownPicker
              open={statusOpen}
              value={formData.status}
              items={STATUS_OPTIONS.map((o) => ({
                ...o,
                icon: () => getStatusIcon(o.value, 16, getStatusColor(o.value)),
              }))}
              setOpen={setStatusOpen}
              setValue={(v) => setFormData((prev) => ({ ...prev, status: v() }))}
              style={[
                styles.dropdown,
                {
                  borderColor: statusOpen ? theme.colors.primary : theme.colors.border,
                  borderRadius: 14,
                  backgroundColor: theme.colors.muted100,
                  borderWidth: 1.5,
                  paddingVertical: 10,
                },
              ]}
              dropDownContainerStyle={{
                borderColor: theme.colors.border,
                borderRadius: 14,
                backgroundColor: theme.colors.card,
              }}
              textStyle={{ color: theme.colors.text, fontWeight: '500', fontSize: 12 }}
            />
          </View>

          {/* Project Color */}
          <View style={{ flex: 1, zIndex: -1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  backgroundColor: `${theme.colors.event}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 6,
                }}
              >
                <Palette size={13} color={theme.colors.event} strokeWidth={2} />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text }}>Color</Text>
            </View>
            <TouchableOpacity
              onPress={toggleColorPicker}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.muted100,
                borderRadius: 14,
                paddingHorizontal: 12,
                paddingVertical: 10,
                gap: 8,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  backgroundColor: formData.projectColor,
                  borderWidth: 2,
                  borderColor: `${formData.projectColor}40`,
                }}
              />
              <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: theme.colors.text }} numberOfLines={1}>
                {String(formData.projectColor).toUpperCase()}
              </Text>
              <ChevronDown size={14} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Color Picker Modal ─── */}
        <Modal visible={showColorPicker} transparent animationType="fade" onRequestClose={toggleColorPicker}>
          <TouchableWithoutFeedback onPress={toggleColorPicker}>
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)',
              }}
            >
              <TouchableWithoutFeedback>
                <Animated.View
                  style={[
                    {
                      backgroundColor: theme.colors.card,
                      borderRadius: 20,
                      padding: 24,
                      width: '85%',
                      maxWidth: 360,
                      shadowColor: '#000',
                      shadowOpacity: 0.2,
                      shadowRadius: 20,
                      shadowOffset: { width: 0, height: 8 },
                      elevation: 10,
                    },
                    { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '800',
                      color: theme.colors.text,
                      marginBottom: 16,
                      textAlign: 'center',
                    }}
                  >
                    Select Color
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                    {COLOR_PALETTE.map((color, index) => (
                      <TouchableOpacity
                        key={`${color}-${index}`}
                        onPress={() => {
                          setFormData((prev) => ({ ...prev, projectColor: color }));
                          toggleColorPicker();
                        }}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          backgroundColor: color,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: formData.projectColor === color ? 3 : 0,
                          borderColor: '#FFFFFF',
                          shadowColor: color,
                          shadowOpacity: formData.projectColor === color ? 0.5 : 0,
                          shadowRadius: 6,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: formData.projectColor === color ? 4 : 0,
                        }}
                      >
                        {formData.projectColor === color && (
                          <Check size={18} color="#FFFFFF" strokeWidth={3} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* ─── Row 1: Start Date + Priority ─── */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10, zIndex: 20 }}>

          {/* Start Date */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: `${theme.colors.primary}15`, alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                <Calendar size={13} color={theme.colors.primary} strokeWidth={2} />
              </View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.text }}>Start Date</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (isMounted.current && !showStartDatePicker) {
                  setShowStartDatePicker(true);
                  setShowEndDatePicker(false);
                  setShowDueTimePicker(false);
                  setPriorityOpen(false);
                }
              }}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                borderWidth: 1.5,
                borderColor: formData.startDate ? theme.colors.primary : theme.colors.border,
                backgroundColor: theme.colors.muted100,
                borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9,
              }}
            >
              <Calendar size={14} color={theme.colors.textSecondary} strokeWidth={1.8} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: formData.startDate ? theme.colors.text : theme.colors.textSecondary }} numberOfLines={1}>
                {formData.startDate ? formData.startDate.toLocaleDateString() : 'Select date'}
              </Text>
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={formData.startDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(event, selectedDate) => {
                  if (isMounted.current) {
                    if (selectedDate && event.type !== 'dismissed') {
                      setFormData((prev) => {
                        const next = { ...prev, startDate: selectedDate };
                        if (next.endDate && next.endDate < selectedDate) next.endDate = selectedDate;
                        return next;
                      });
                    }
                    setShowStartDatePicker(false);
                  }
                }}
              />
            )}
          </View>

          {/* Priority Dropdown */}
          <View style={{ flex: 1, zIndex: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: `${theme.colors.textSecondary}15`, alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                <Flag size={13} color={theme.colors.primary} strokeWidth={2} />
              </View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.text }}>Priority</Text>
            </View>

            {/* Trigger button */}
            <TouchableOpacity
              onPress={() => { setPriorityOpen(prev => !prev); setShowStartDatePicker(false); setShowEndDatePicker(false); setShowDueTimePicker(false); }}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                borderWidth: 1.5,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.muted100,
                borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                {selectedPriority ? (
                  <>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: selectedPriority.color }} />
                    <Text style={{ fontSize: 11, fontWeight: '700', flexShrink: 1 }} numberOfLines={1}>
                      {selectedPriority.label}
                    </Text>
                  </>
                ) : (
                  <Text style={{ fontSize: 12, fontWeight: '500', color: theme.colors.textSecondary }}>Select</Text>
                )}
              </View>
              <ChevronDown size={14} color={theme.colors.textSecondary} strokeWidth={2} style={{ transform: [{ rotate: priorityOpen ? '180deg' : '0deg' }] }} />
            </TouchableOpacity>

            {/* Dropdown list */}
            {priorityOpen && (
              <View
                style={{
                  position: 'absolute', top: 62, left: 0, right: 0,
                  backgroundColor: theme.colors.card,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
                  elevation: 10,
                  zIndex: 999,
                  overflow: 'hidden',
                }}
              >
                {PRIORITY_OPTIONS.map((opt, idx) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, priority: opt.value }));
                      setPriorityOpen(false);
                    }}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 10,
                      paddingVertical: 10, paddingHorizontal: 12,
                      backgroundColor: formData.priority === opt.value ? `${opt.color}15` : 'transparent',
                      borderBottomWidth: idx < PRIORITY_OPTIONS.length - 1 ? 1 : 0,
                      borderBottomColor: theme.colors.border,
                    }}
                  >
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: opt.color }} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: formData.priority === opt.value ? opt.color : theme.colors.text, flex: 1 }}>
                      {opt.label}
                    </Text>
                    {formData.priority === opt.value && <Check size={13} color={opt.color} strokeWidth={3} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ─── Checkbox: No End Date & Due Time ─── */}
        <TouchableOpacity
          onPress={() => {
            setNoEndDate(prev => !prev);
            setPriorityOpen(false);
            if (!noEndDate) setFormData(prev => ({ ...prev, endDate: null, dueTime: null }));
          }}
          activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, paddingVertical: 4, zIndex: -1 }}
        >
          <View
            style={{
              width: 23, height: 23, borderRadius: 6, borderWidth: 2,
              borderColor: noEndDate ? theme.colors.primary : theme.colors.textSecondary,
              backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {noEndDate && <Check size={13} color={theme.colors.primary} strokeWidth={3.5} />}
          </View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: noEndDate ? theme.colors.primary : theme.colors.textSecondary }}>
            No End Date &amp; Due Time
          </Text>
        </TouchableOpacity>

        {/* ─── Row 2: End Date + Due Time (hidden when checkbox ON) ─── */}
        {!noEndDate && (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10, zIndex: -1 }}>

            {/* End Date */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 7,
                    backgroundColor: `${theme.colors.event}15`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 6,
                  }}
                >
                  <Calendar size={13} color={theme.colors.event} strokeWidth={2} />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.text }}>End Date</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (isMounted.current && !showEndDatePicker) {
                    setShowEndDatePicker(true);
                    setShowStartDatePicker(false);
                    setShowDueTimePicker(false);
                  }
                }}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  borderWidth: 1.5,
                  borderColor: formData.endDate ? theme.colors.primary : theme.colors.border,
                  backgroundColor: theme.colors.muted100,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                }}
              >
                <Calendar size={14} color={theme.colors.textSecondary} strokeWidth={1.8} />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: formData.endDate ? theme.colors.text : theme.colors.textSecondary,
                  }}
                  numberOfLines={1}
                >
                  {formData.endDate ? formData.endDate.toLocaleDateString() : 'Select date'}
                </Text>
              </TouchableOpacity>
              {showEndDatePicker && (
                <DateTimePicker
                  value={formData.endDate || formData.startDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(event, selectedDate) => {
                    if (isMounted.current) {
                      if (selectedDate && event.type !== 'dismissed') {
                        setFormData((prev) => ({ ...prev, endDate: selectedDate }));
                      }
                      setShowEndDatePicker(false);
                    }
                  }}
                />
              )}
            </View>

            {/* Due Time */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 7,
                    backgroundColor: `${theme.colors.task}15`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 6,
                  }}
                >
                  <Clock size={13} color={theme.colors.task} strokeWidth={2} />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.text }}>Due Time</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (isMounted.current && !showDueTimePicker) {
                    setShowDueTimePicker(true);
                    setShowStartDatePicker(false);
                    setShowEndDatePicker(false);
                  }
                }}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  borderWidth: 1.5,
                  borderColor: formData.dueTime ? theme.colors.primary : theme.colors.border,
                  backgroundColor: theme.colors.muted100,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                }}
              >
                <Clock size={14} color={theme.colors.textSecondary} strokeWidth={1.8} />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: formData.dueTime ? theme.colors.text : theme.colors.textSecondary,
                  }}
                  numberOfLines={1}
                >
                  {formData.dueTime
                    ? formData.dueTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Select time'}
                </Text>
              </TouchableOpacity>
              {showDueTimePicker && (
                <DateTimePicker
                  value={formData.dueTime || new Date()}
                  mode="time"
                  is24Hour
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(event, selectedDate) => {
                    if (isMounted.current) {
                      if (selectedDate && event.type !== 'dismissed') {
                        setFormData((prev) => ({ ...prev, dueTime: selectedDate }));
                      }
                      setShowDueTimePicker(false);
                    }
                  }}
                />
              )}
            </View>
          </View>
        )}

        {/* ─── Remarks (full width, always visible) ─── */}
        <View style={{ marginBottom: 10, zIndex: -1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                backgroundColor: `${theme.colors.primary}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 6,
              }}
            >
              <MessageSquare size={13} color={theme.colors.primary} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.text }}>Remarks</Text>
          </View>
          <TextInput
            style={{
              borderWidth: 1.5,
              borderColor: formData.remarks ? theme.colors.primary : theme.colors.border,
              backgroundColor: theme.colors.muted100,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 13,
              fontWeight: '500',
              color: theme.colors.text,
              minHeight: 48,
              textAlignVertical: 'top',
            }}
            placeholder="Notes..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            value={formData.remarks}
            onChangeText={(v) => setFormData((prev) => ({ ...prev, remarks: v }))}
          />
        </View>
      </ScrollView>

      {/* ─── Footer Buttons (pinned, always visible) ─── */}
      <View style={{ flexDirection: 'row', gap: 12, paddingTop: 8, paddingBottom: 4 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 12,
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
          onPress={() => setActiveTab('team')}
          disabled={isSubmitting}
          activeOpacity={0.8}
          style={{
            flex: 1.5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 12,
            borderRadius: 15,
            backgroundColor: theme.colors.primary,
            opacity: isSubmitting ? 0.5 : 1,
            shadowColor: theme.colors.primary,
            shadowOpacity: isSubmitting ? 0 : 0.3,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: isSubmitting ? 0 : 6,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 }}>
            Next: Team &amp; Dates
          </Text>
          <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
