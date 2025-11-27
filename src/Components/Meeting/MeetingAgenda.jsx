import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import theme from '../../Themes/Themes';

export default function MeetingAgenda({ value, onChange }) {
  const [items, setItems] = useState(value.items || [{ title: '', description: '' }]);

  const setItem = (idx, patch) => {
    const next = items.map((it, i)=> i===idx ? { ...it, ...patch } : it);
    setItems(next);
    onChange({ ...value, items: next });
  };

  const addItem = () => {
    const next = [...items, { title: '', description: '' }];
    setItems(next);
    onChange({ ...value, items: next });
  };

  const removeItem = (idx) => {
    const next = items.filter((_, i) => i !== idx);
    const ensured = next.length > 0 ? next : [{ title: '', description: '' }];
    setItems(ensured);
    onChange({ ...value, items: ensured });
  };

  return (
    <View>
      <Text style={styles.title}>Agenda Items</Text>
      {items.map((it, idx)=> (
        <View key={idx} style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>Agenda Item {idx+1}</Text>
            {items.length > 1 && (
              <TouchableOpacity onPress={() => removeItem(idx)} style={styles.removeBtn} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <X size={18} color={theme.colors.text} />
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Title"
            value={it.title}
            onChangeText={(t)=>setItem(idx, { title: t })}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            multiline
            numberOfLines={3}
            value={it.description}
            onChangeText={(t)=>setItem(idx, { description: t })}
          />
        </View>
      ))}
      <TouchableOpacity style={styles.addBtn} onPress={addItem}>
        <Text style={styles.addBtnText}>Add Item</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: '700', color: theme.colors.text, marginBottom: 10 },
  card: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 12, backgroundColor: theme.colors.background, marginBottom: 12 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardHeader: { fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  removeBtn: { padding: 4, borderRadius: 16 },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 10, backgroundColor: theme.colors.background, marginBottom: 8 },
  textArea: { height: 80, textAlignVertical: 'top' },
  addBtn: { alignSelf: 'flex-start', backgroundColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  addBtnText: { color: theme.colors.background, fontWeight: '700' },
});
