import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import theme from '../../Themes/Themes';

export default function DropdownSelect({ label, value, options = [], onChange }) {
  const [open, setOpen] = useState(false);

  const currentLabel = options.find(o => o.value === value)?.label || value || 'Select';

  return (
    <View style={styles.wrap}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={styles.triggerText}>{currentLabel}</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <FlatList
              data={options}
              keyExtractor={(item, idx) => String(idx)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => { onChange(item.value); setOpen(false); }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 14, color: theme.colors.text, marginBottom: 6 },
  trigger: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background, borderRadius: 8, padding: 12 },
  triggerText: { color: theme.colors.text, fontWeight: '600' },
  // Use themed overlay color for modal backdrop
  backdrop: { flex: 1, backgroundColor: theme.colors.overlayLight, justifyContent: 'flex-end' },
  sheet: { backgroundColor: theme.colors.background, padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '50%' },
  option: { padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8 },
  optionText: { color: theme.colors.text },
});
