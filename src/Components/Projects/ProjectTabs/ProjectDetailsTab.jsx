import React from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, TouchableWithoutFeedback, Platform, Animated } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar, ChevronDown } from "lucide-react-native";
import theme from "../../../Themes/Themes";

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
  return (
    <View style={styles.tabContent}>
      <Text style={styles.label}>Project Name *</Text>
      <TextInput style={styles.input} placeholder="Enter project name" value={formData.projectName} onChangeText={v => setFormData(prev => ({ ...prev, projectName: v }))} />

      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, styles.textArea]} placeholder="Briefly describe..." multiline value={formData.description} onChangeText={v => setFormData(prev => ({ ...prev, description: v }))} />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Status</Text>
          <DropDownPicker
            open={statusOpen}
            value={formData.status}
            items={STATUS_OPTIONS.map(o => ({ ...o, icon: () => getStatusIcon(o.value, 18, getStatusColor(o.value)) }))}
            setOpen={setStatusOpen}
            setValue={v => setFormData(prev => ({ ...prev, status: v() }))}
            style={[styles.dropdown, { borderColor: statusOpen ? theme.colors.primary : theme.colors.border }]}
            dropDownContainerStyle={{ borderColor: theme.colors.border }}
          />
        </View>
      </View>

      <View style={[styles.row, { marginTop: 16 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Project Color</Text>
          <TouchableOpacity style={styles.colorPickerButton} onPress={toggleColorPicker}>
            <View style={[styles.selectedColorPreview, { backgroundColor: formData.projectColor }]} />
            <Text style={styles.colorPickerText}>{String(formData.projectColor).toUpperCase()}</Text>
            <ChevronDown size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showColorPicker} transparent animationType="fade" onRequestClose={toggleColorPicker}>
        <TouchableWithoutFeedback onPress={toggleColorPicker}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.colorPickerContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                <Text style={styles.modalTitle}>Select Color</Text>
                <View style={styles.colorGrid}>
                  {COLOR_PALETTE.map((color, index) => (
                    <TouchableOpacity
                      key={`${color}-${index}`}
                      style={[styles.colorOption, { backgroundColor: color }, formData.projectColor === color && styles.selectedColorOption]}
                      onPress={() => { setFormData(prev => ({ ...prev, projectColor: color })); toggleColorPicker(); }}
                    >
                      {formData.projectColor === color && <CheckIcon size={16} color={theme.colors.white} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.label}>Start Date</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => {
              if (isMounted.current && !showStartDatePicker) {
                setShowStartDatePicker(true);
                setShowEndDatePicker(false);
                setShowDueTimePicker(false);
              }
            }}
            accessibilityLabel="Select start date"
            accessibilityRole="button"
          >
            <Calendar size={16} color={theme.colors.textSecondary} />
            <Text style={styles.dateText}>
              {formData.startDate ? formData.startDate.toLocaleDateString() : "Select date"}
            </Text>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker
              value={formData.startDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, selectedDate) => {
                if (isMounted.current) {
                  if (selectedDate && event.type !== "dismissed") {
                    setFormData(prev => {
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
          {Platform.OS === "ios" && showStartDatePicker && (
            <TouchableOpacity style={styles.confirmButton} onPress={() => setShowStartDatePicker(false)}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.label}>End Date</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => {
              if (isMounted.current && !showEndDatePicker) {
                setShowEndDatePicker(true);
                setShowStartDatePicker(false);
                setShowDueTimePicker(false);
              }
            }}
            accessibilityLabel="Select end date"
            accessibilityRole="button"
          >
            <Calendar size={16} color={theme.colors.textSecondary} />
            <Text style={styles.dateText}>
              {formData.endDate ? formData.endDate.toLocaleDateString() : "Select date"}
            </Text>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              value={formData.endDate || formData.startDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, selectedDate) => {
                if (isMounted.current) {
                  if (selectedDate && event.type !== "dismissed") {
                    setFormData(prev => ({ ...prev, endDate: selectedDate }));
                  }
                  setShowEndDatePicker(false);
                }
              }}
            />
          )}
          {Platform.OS === "ios" && showEndDatePicker && (
            <TouchableOpacity style={styles.confirmButton} onPress={() => setShowEndDatePicker(false)}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.label}>Due Time</Text>
          <TouchableOpacity
            style={styles.timeInput}
            onPress={() => {
              if (isMounted.current && !showDueTimePicker) {
                setShowDueTimePicker(true);
                setShowStartDatePicker(false);
                setShowEndDatePicker(false);
              }
            }}
            accessibilityLabel="Select due time"
            accessibilityRole="button"
          >
            <Calendar size={16} color={theme.colors.textSecondary} />
            <Text style={styles.timeText}>
              {formData.dueTime ? formData.dueTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Select time"}
            </Text>
          </TouchableOpacity>
          {showDueTimePicker && (
            <DateTimePicker
              value={formData.dueTime || new Date()}
              mode="time"
              is24Hour
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, selectedDate) => {
                if (isMounted.current) {
                  if (selectedDate && event.type !== "dismissed") {
                    setFormData(prev => ({ ...prev, dueTime: selectedDate }));
                  }
                  setShowDueTimePicker(false);
                }
              }}
            />
          )}
          {Platform.OS === "ios" && showDueTimePicker && (
            <TouchableOpacity style={styles.confirmButton} onPress={() => setShowDueTimePicker(false)}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.label}>Remarks</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Notes..." multiline value={formData.remarks} onChangeText={v => setFormData(prev => ({ ...prev, remarks: v }))} />
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.nextButton, isSubmitting && styles.disabledButton]} onPress={() => setActiveTab("team")}>
          <Text style={styles.buttonText}>Next: Team & Dates</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
