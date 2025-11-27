import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'lucide-react-native';
import theme from '../../Themes/Themes';

export default function MeetingDetailsForm({ value, onChange }) {
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const startOfDay = (d) => { const dt = new Date(d); dt.setHours(0,0,0,0); return dt; };
  const fmtDateTime = (d) => d ? d.toLocaleString() : '';

  return (
    <SafeAreaView edges={['left','right']}> 
      <View style={styles.block}>
        <Text style={styles.label}>Title<Text style={styles.req}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={value.title}
          onChangeText={(t)=>onChange({ ...value, title: t })}
        />
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          multiline
          numberOfLines={4}
          value={value.description}
          onChangeText={(t)=>onChange({ ...value, description: t })}
        />
      </View>

      <View style={styles.rowWrap}>
        <Text style={styles.label}>Meeting Scope<Text style={styles.req}>*</Text></Text>
        <View style={styles.rowBtns}>
          {['Internal','External'].map((opt)=> (
            <TouchableOpacity key={opt} style={[styles.pill, value.scope===opt && styles.pillActive]} onPress={()=>onChange({ ...value, scope: opt })}>
              <Text style={[styles.pillText, value.scope===opt && styles.pillTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.rowWrap}>
        <Text style={styles.label}>Meeting Type<Text style={styles.req}>*</Text></Text>
        <View style={styles.rowBtns}>
          {['Virtual','In Person','Hybrid'].map((opt)=> (
            <TouchableOpacity key={opt} style={[styles.pill, value.type===opt && styles.pillActive]} onPress={()=>onChange({ ...value, type: opt })}>
              <Text style={[styles.pillText, value.type===opt && styles.pillTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {value.type !== 'In Person' && (
        <View style={styles.block}>
          <Text style={styles.label}>Virtual Meeting URL<Text style={styles.req}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="https://meet.google.com/abc-xyz"
            value={value.virtualUrl}
            onChangeText={(t)=>onChange({ ...value, virtualUrl: t })}
          />
        </View>
      )}

      {value.type !== 'Virtual' && (
        <View style={styles.block}>
          <Text style={styles.label}>Physical Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Office Conference Room, 123 Main St..."
            value={value.location}
            onChangeText={(t)=>onChange({ ...value, location: t })}
          />
        </View>
      )}

      <View style={styles.rowCols}>
        <View style={styles.col}>
          <Text style={styles.label}>Start Date & Time<Text style={styles.req}>*</Text></Text>
          <TouchableOpacity style={styles.picker} onPress={()=>setShowStart(true)}>
            <Text style={styles.pickerText}>{fmtDateTime(value.start)}</Text>
            <Calendar color={theme.colors.text} size={18} />
          </TouchableOpacity>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>End Date & Time<Text style={styles.req}>*</Text></Text>
          <TouchableOpacity style={styles.picker} onPress={()=>setShowEnd(true)}>
            <Text style={styles.pickerText}>{fmtDateTime(value.end)}</Text>
            <Calendar color={theme.colors.text} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      <DateTimePickerModal
        isVisible={showStart}
        mode="datetime"
        minimumDate={startOfDay(new Date())}
        onConfirm={(d)=>{ onChange({ ...value, start: d }); setShowStart(false); }}
        onCancel={()=>setShowStart(false)}
      />
      <DateTimePickerModal
        isVisible={showEnd}
        mode="datetime"
        minimumDate={value.start || startOfDay(new Date())}
        onConfirm={(d)=>{ onChange({ ...value, end: d }); setShowEnd(false); }}
        onCancel={()=>setShowEnd(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: 14 },
  label: { fontSize: 14, color: theme.colors.text, marginBottom: 6 },
  req: { color: theme.colors.primary },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 12, backgroundColor: theme.colors.background },
  textArea: { height: 96, textAlignVertical: 'top' },
  rowWrap: { marginBottom: 14 },
  rowBtns: { flexDirection: 'row', gap: 10 },
  pill: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background },
  pillActive: { borderColor: theme.colors.primary + '55', backgroundColor: theme.colors.primary + '15' },
  pillText: { color: theme.colors.text, fontWeight: '600' },
  pillTextActive: { color: theme.colors.primary },
  rowCols: { flexDirection: 'row', gap: 12, marginTop: 6 },
  col: { flex: 1 },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 12 },
  pickerText: { color: theme.colors.text },
});
