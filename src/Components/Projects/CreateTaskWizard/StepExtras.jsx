// src/Components/CreateTaskWizard/StepExtras.jsx
import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import theme from '../../../Themes/Themes';

export default function StepExtras({ value, onChange, onBack, onCreate }) {
  const [tagsInput, setTagsInput] = React.useState('');

  const addTag = () => {
    const t = tagsInput.trim();
    if (!t) return;
    onChange({ ...value, tags: [...(value.tags || []), t] });
    setTagsInput('');
  };

  const addAttachments = () => {
    launchImageLibrary({ mediaType: 'mixed', selectionLimit: 0 }, (response) => {
      if (response?.didCancel || response?.errorCode) return;
      const picked = (response.assets || []).map((a) => ({
        id: String(Date.now()) + Math.random(),
        name: a.fileName || 'file',
        uri: a.uri,
        type: a.type || 'application/octet-stream',
        size: a.fileSize || 0,
      }));
      onChange({ ...value, attachments: [ ...(value.attachments || []), ...picked ] });
    });
  };

  const removeAttachment = (id) => {
    const next = (value.attachments || []).filter((f) => f.id !== id);
    onChange({ ...value, attachments: next });
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>Tags</Text>
      <View style={styles.row}>
        <TextInput
          value={tagsInput}
          onChangeText={setTagsInput}
          placeholder="Add a tag and press +"
          placeholderTextColor={theme.colors.textSecondary}
          style={styles.input}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addTag}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.selectedTags}>{(value.tags || []).join(', ')}</Text>

      <Text style={[styles.title, { marginTop: 16 }]}>Remarks/Comments</Text>
      <TextInput
        value={value.remarks}
        onChangeText={(t) => onChange({ ...value, remarks: t })}
        placeholder="Any additional notes or comments..."
        placeholderTextColor={theme.colors.textSecondary}
        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
        multiline
      />

      <Text style={[styles.title, { marginTop: 16 }]}>Attachments</Text>
      <View style={[styles.row, { marginBottom: 8 }]}>
        <TouchableOpacity style={styles.primaryBtn} onPress={addAttachments}>
          <Text style={styles.primaryBtnText}>Add Files</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={value.attachments || []}
        keyExtractor={(item) => String(item.id)}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <View style={styles.fileRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.fileMeta}>{(item.size/1024).toFixed(1)} KB</Text>
            </View>
            <TouchableOpacity style={styles.ghostBtn} onPress={() => removeAttachment(item.id)}>
              <Text style={styles.ghostBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.fileMeta}>No attachments added</Text>
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.ghostBtn]} onPress={onBack}>
          <Text style={styles.ghostBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={onCreate}>
          <Text style={styles.primaryBtnText}>Create Task</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, backgroundColor: theme.colors.background, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: theme.colors.text },
  addBtn: { marginLeft: 8, width: 40, height: 40, borderRadius: 8, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: theme.colors.white, fontWeight: '800', fontSize: 18 },
  selectedTags: { color: theme.colors.textSecondary, marginTop: 8 },
  footer: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between' },
  ghostBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border },
  ghostBtnText: { color: theme.colors.text },
  primaryBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  primaryBtnText: { color: theme.colors.white, fontWeight: '700' },
  fileRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  fileName: { color: theme.colors.text, fontWeight: '600' },
  fileMeta: { color: theme.colors.textSecondary, marginTop: 2 },
});
