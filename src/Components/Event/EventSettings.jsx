import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import theme from '../../Themes/Themes';
import DropdownSelect from '../Common/DropdownSelect';

const notificationOptions = [
  { label: 'None', value: 'none' },
  { label: '5 minutes before', value: '5m' },
  { label: '10 minutes before', value: '10m' },
  { label: '15 minutes before', value: '15m' },
  { label: '30 minutes before', value: '30m' },
  { label: '1 hour before', value: '1h' },
  { label: '1 day before', value: '1d' },
];

const visibilityOptions = [
  { label: 'Default', value: 'default' },
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
];

export default function EventSettings({ value, onChange }) {
  const [allowed, setAllowed] = useState(value.guestsAllowed ?? true);

  return (
    <View>
      <View style={styles.row2}>
        <View style={styles.col}>
          <Text style={styles.label}>Notifications</Text>
          <DropdownSelect
            value={value.notifications || 'none'}
            options={notificationOptions}
            onChange={(v)=>onChange({ ...value, notifications: v })}
          />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Visibility</Text>
          <DropdownSelect
            value={value.visibility || 'default'}
            options={visibilityOptions}
            onChange={(v)=>onChange({ ...value, visibility: v })}
          />
        </View>
      </View>

      <View style={styles.sectionBox}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Grant Permissions to Guests</Text>
          <View style={styles.switchWrap}>
            <Text style={styles.switchLabel}>{allowed ? 'Allowed' : 'Blocked'}</Text>
            <Switch
              value={allowed}
              onValueChange={(v)=>{ setAllowed(v); onChange({ ...value, guestsAllowed: v }); }}
            />
          </View>
        </View>
        {allowed && (
          <View style={styles.note}>
            <Text style={styles.noteText}>Full access granted to guests - Users can modify, invite, and see guest list</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row2: { flexDirection:'row', gap: 12 },
  col: { flex: 1 },
  label: { color: theme.colors.text, marginBottom: 6, fontWeight: '700' },
  sectionBox: { marginTop: 16, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.background, padding: 12 },
  rowBetween: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  sectionTitle: { color: theme.colors.text, fontWeight:'700' },
  switchWrap: { flexDirection:'row', alignItems:'center', gap: 8 },
  switchLabel: { color: theme.colors.text },
  note: { marginTop: 10, borderWidth:1, borderColor: theme.colors.successBorder, backgroundColor: theme.colors.successSoft, borderRadius: 10, padding: 12 },
  noteText: { color: theme.colors.successText },
});
