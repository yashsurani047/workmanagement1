import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Calendar, Clock } from 'lucide-react-native';
import theme from '../../Themes/Themes';

export default function EventDetailsForm({ value, onChange }) {
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);

  const startOfDay = (d) => { const dt = new Date(d); dt.setHours(0,0,0,0); return dt; };
  const fmtDate = (d) => d ? `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}` : '';
  const fmtTime = (d) => {
    if (!d) return '';
    let h = d.getHours(); const m = String(d.getMinutes()).padStart(2,'0'); const am = h>=12?'PM':'AM'; h = h%12; if (h===0) h=12; return `${String(h).padStart(2,'0')}:${m} ${am}`;
  };

  return (
    <View>
      <TextInput
        style={styles.title}
        placeholder="Event title*"
        value={value.title}
        onChangeText={(t)=>onChange({ ...value, title: t })}
      />

      <Text style={styles.sectionLabel}>Event Type</Text>
      <View style={styles.pillsRow}>
        {['Internal (with team members)','External (with contacts)'].map((label, idx)=>{
          const val = idx===0 ? 'internal' : 'external';
          const active = value.type === val;
          return (
            <TouchableOpacity key={val} style={[styles.pill, active && styles.pillActive]} onPress={()=>onChange({ ...value, type: val })}>
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.allDayRow}>
        <Switch value={!!value.allDay} onValueChange={(v)=>onChange({ ...value, allDay: v })} />
        <Text style={styles.allDayText}>All day</Text>
      </View>

      <View style={styles.cardBox}>
        <View style={styles.row2}>
          <View style={styles.col}>
            <Text style={styles.label}>Start date*</Text>
            <TouchableOpacity style={styles.picker} onPress={()=>setShowStartDate(true)}>
              <Text style={styles.pickerText}>{fmtDate(value.startDate)}</Text>
              <Calendar size={18} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>End date*</Text>
            <TouchableOpacity style={styles.picker} onPress={()=>setShowEndDate(true)}>
              <Text style={styles.pickerText}>{fmtDate(value.endDate)}</Text>
              <Calendar size={18} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {!value.allDay && (
          <View style={[styles.row2,{ marginTop: 10 }] }>
            <View style={styles.col}>
              <Text style={styles.label}>Start time*</Text>
              <TouchableOpacity style={styles.picker} onPress={()=>setShowStartTime(true)}>
                <Text style={styles.pickerText}>{fmtTime(value.startTime)}</Text>
                <Clock size={18} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>End time*</Text>
              <TouchableOpacity style={styles.picker} onPress={()=>setShowEndTime(true)}>
                <Text style={styles.pickerText}>{fmtTime(value.endTime)}</Text>
                <Clock size={18} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <Text style={[styles.sectionLabel,{ marginTop: 14 }]}>Event Details</Text>
      <View style={styles.row2}>
        <View style={styles.col}>
          <TextInput
            style={styles.input}
            placeholder="Add location"
            value={value.location}
            onChangeText={(t)=>onChange({ ...value, location: t })}
          />
        </View>
        <View style={styles.col}>
          <TextInput
            style={[styles.input,{ height: 46 }]}
            placeholder="Add description"
            value={value.description}
            onChangeText={(t)=>onChange({ ...value, description: t })}
          />
        </View>
      </View>

      <DateTimePickerModal
        isVisible={showStartDate}
        mode="date"
        minimumDate={startOfDay(new Date())}
        onConfirm={(d)=>{ onChange({ ...value, startDate: startOfDay(d) }); setShowStartDate(false); }}
        onCancel={()=>setShowStartDate(false)}
      />
      <DateTimePickerModal
        isVisible={showEndDate}
        mode="date"
        minimumDate={value.startDate || startOfDay(new Date())}
        onConfirm={(d)=>{ onChange({ ...value, endDate: startOfDay(d) }); setShowEndDate(false); }}
        onCancel={()=>setShowEndDate(false)}
      />
      <DateTimePickerModal
        isVisible={showStartTime}
        mode="time"
        is24Hour={false}
        onConfirm={(d)=>{ onChange({ ...value, startTime: d }); setShowStartTime(false); }}
        onCancel={()=>setShowStartTime(false)}
      />
      <DateTimePickerModal
        isVisible={showEndTime}
        mode="time"
        is24Hour={false}
        onConfirm={(d)=>{ onChange({ ...value, endTime: d }); setShowEndTime(false); }}
        onCancel={()=>setShowEndTime(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { borderWidth:1, borderColor: theme.colors.border, backgroundColor: theme.colors.background, borderRadius: 8, padding: 12, marginBottom: 12 },
  sectionLabel: { color: theme.colors.text, fontWeight:'700', marginBottom: 8 },
  pillsRow: { flexDirection:'row', gap: 10, marginBottom: 12 },
  pill: { borderWidth:1, borderColor: theme.colors.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.colors.background },
  pillActive: { borderColor: theme.colors.primary + '55', backgroundColor: theme.colors.primary + '15' },
  pillText: { color: theme.colors.text, fontWeight:'600' },
  pillTextActive: { color: theme.colors.primary },
  allDayRow: { flexDirection:'row', alignItems:'center', gap: 10, marginBottom: 10 },
  allDayText: { color: theme.colors.text },
  cardBox: { backgroundColor: theme.colors.background, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: 12 },
  row2: { flexDirection:'row', gap: 12 },
  col: { flex: 1 },
  label: { color: theme.colors.text, marginBottom: 6 },
  picker: { borderWidth:1, borderColor: theme.colors.border, backgroundColor: theme.colors.background, borderRadius: 8, padding: 12, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  pickerText: { color: theme.colors.text, fontWeight:'600' },
  input: { borderWidth:1, borderColor: theme.colors.border, backgroundColor: theme.colors.background, borderRadius: 8, padding: 12 },
});
