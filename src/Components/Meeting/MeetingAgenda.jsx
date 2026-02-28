import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { X, Plus, ListChecks, Type, AlignLeft, Clock, FileText, ChevronDown, Paperclip, Upload, Image as ImageIcon, Trash2 } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Alert, Image, ScrollView } from 'react-native';
import { useTheme } from '../../Themes/ThemeContext';

export default function MeetingAgenda({ value, onChange }) {
  const { theme } = useTheme();
  const [items, setItems] = useState(value.items || [{ title: '', duration: '15', description: '' }]);
  const [notes, setNotes] = useState(value.notes || []);
  const [attachments, setAttachments] = useState(value.attachments || []);
  const [activeNoteDropdown, setActiveNoteDropdown] = useState(null);

  const noteTypes = ['Note', 'Decision', 'Action Item'];

  const setItem = (idx, patch) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    setItems(next);
    onChange({ ...value, items: next });
  };

  const addItem = () => {
    const next = [...items, { title: '', duration: '15', description: '' }];
    setItems(next);
    onChange({ ...value, items: next });
  };

  const removeItem = (idx) => {
    const next = items.filter((_, i) => i !== idx);
    const ensured = next.length > 0 ? next : [{ title: '', duration: '15', description: '' }];
    setItems(ensured);
    onChange({ ...value, items: ensured });
  };

  const addNote = () => {
    const next = [...notes, { content: '', type: 'Note', id: Date.now().toString() }];
    setNotes(next);
    onChange({ ...value, notes: next });
  };

  const setNote = (idx, patch) => {
    const next = notes.map((n, i) => (i === idx ? { ...n, ...patch } : n));
    setNotes(next);
    onChange({ ...value, notes: next });
  };

  const removeNote = (idx) => {
    const next = notes.filter((_, i) => i !== idx);
    setNotes(next);
    onChange({ ...value, notes: next });
  };

  const pickDocument = async () => {
    const options = {
      mediaType: 'photo',
      selectionLimit: 0,
      includeBase64: false,
    };

    try {
      const result = await launchImageLibrary(options);
      if (result.didCancel || !result.assets) return;

      const newAttachments = result.assets.map((file) => ({
        id: Date.now().toString() + Math.random(),
        uri: file.uri,
        name: file.fileName || `image_${Date.now()}`,
        type: file.type || 'image/jpeg',
        size: file.fileSize ? `${(file.fileSize / (1024 * 1024)).toFixed(2)} MB` : 'Unknown',
        mimeType: file.type,
      }));
      const next = [...attachments, ...newAttachments];
      setAttachments(next);
      onChange({ ...value, attachments: next });
    } catch (err) {
      Alert.alert('Error', 'Failed to pick file.');
    }
  };

  const removeAttachment = (id) => {
    const next = attachments.filter((a) => a.id !== id);
    setAttachments(next);
    onChange({ ...value, attachments: next });
  };

  return (
    <View>
      {/* ─── Section Header ─── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: `${theme.colors.primary}15`,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <ListChecks size={16} color={theme.colors.primary} strokeWidth={2} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.text }}>
            Agenda Items
          </Text>
        </View>
        <TouchableOpacity
          onPress={addItem}
          activeOpacity={0.8}
          style={{ backgroundColor: theme.colors.muted200, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.text }}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Agenda Cards ─── */}
      {items.map((it, idx) => (
        <View
          key={idx}
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 16,
            backgroundColor: theme.colors.card,
            padding: 16,
            marginBottom: 14,
          }}
        >
          {/* Card header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: `${theme.colors.primary}12`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '800',
                    color: theme.colors.primary,
                  }}
                >
                  {idx + 1}
                </Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text }}>
                Agenda Item {idx + 1}
              </Text>
            </View>

            {items.length > 1 && (
              <TouchableOpacity
                onPress={() => removeItem(idx)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  backgroundColor: `${theme.colors.error}12`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} color={theme.colors.error} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          {/* Title and Duration Section */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            {/* Title input */}
            <View style={{ flex: 1.5 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Type size={12} color={theme.colors.textSecondary} strokeWidth={2} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text, marginLeft: 6 }}>
                  Title
                </Text>
              </View>
              <TextInput
                style={{
                  borderWidth: 1.5,
                  borderColor: it.title ? theme.colors.primary : theme.colors.border,
                  backgroundColor: theme.colors.muted100,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  height: 48,
                  fontSize: 14,
                  fontWeight: '500',
                  color: theme.colors.text,
                }}
                placeholder="Agenda item title"
                placeholderTextColor={theme.colors.textSecondary}
                value={it.title}
                onChangeText={(t) => setItem(idx, { title: t })}
              />
            </View>

            {/* Duration input */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Clock size={12} color={theme.colors.textSecondary} strokeWidth={2} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text, marginLeft: 6 }}>
                  Duration (min)
                </Text>
              </View>
              <TextInput
                style={{
                  borderWidth: 1.5,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.muted100,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  height: 48,
                  fontSize: 14,
                  fontWeight: '600',
                  color: theme.colors.text,
                }}
                placeholder="15"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                value={String(it.duration)}
                onChangeText={(t) => setItem(idx, { duration: t })}
              />
            </View>
          </View>

          {/* Description input */}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <AlignLeft size={12} color={theme.colors.textSecondary} strokeWidth={2} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text, marginLeft: 6 }}>
                Description
              </Text>
            </View>
            <TextInput
              style={{
                borderWidth: 1.5,
                borderColor: it.description ? theme.colors.primary : theme.colors.border,
                backgroundColor: theme.colors.muted100,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                fontWeight: '500',
                color: theme.colors.text,
                height: 80,
                textAlignVertical: 'top',
              }}
              placeholder="Describe this agenda point..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={3}
              value={it.description}
              onChangeText={(t) => setItem(idx, { description: t })}
            />
          </View>
        </View>
      ))}

      <View style={{ marginBottom: 32 }} />

      {/* ─── Notes Section ─── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${theme.colors.warning}15`, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <FileText size={16} color={theme.colors.warning} strokeWidth={2} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.text }}>Notes</Text>
        </View>
        <TouchableOpacity
          onPress={addNote}
          style={{ backgroundColor: theme.colors.muted200, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.text }}>+ Add Note</Text>
        </TouchableOpacity>
      </View>

      {notes.map((n, idx) => (
        <View key={n.id} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, backgroundColor: theme.colors.card, padding: 16, marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <FileText size={14} color={theme.colors.textSecondary} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text }}>Note {idx + 1}</Text>
            </View>
            <TouchableOpacity onPress={() => removeNote(idx)}>
              <X size={16} color={theme.colors.error} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1.5 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text, marginBottom: 8 }}>Content</Text>
              <TextInput
                style={{ borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: theme.colors.muted100, borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 14, color: theme.colors.text }}
                placeholder="Note content"
                value={n.content}
                onChangeText={(t) => setNote(idx, { content: t })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text, marginBottom: 8 }}>Type</Text>
              <TouchableOpacity
                onPress={() => setActiveNoteDropdown(activeNoteDropdown === idx ? null : idx)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: theme.colors.muted100, borderRadius: 12, paddingHorizontal: 12, height: 48 }}
              >
                <Text style={{ fontSize: 14, color: theme.colors.text, fontWeight: '600' }}>{n.type}</Text>
                <ChevronDown size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>

              {activeNoteDropdown === idx && (
                <View style={{ marginTop: 6, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, overflow: 'hidden' }}>
                  {noteTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => {
                        setNote(idx, { type });
                        setActiveNoteDropdown(null);
                      }}
                      style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.borderMuted }}
                    >
                      <Text style={{ fontSize: 13, color: theme.colors.text }}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      ))}

      {/* ─── Attachments Section ─── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 10 }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${theme.colors.info}15`, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
          <Paperclip size={16} color={theme.colors.info} strokeWidth={2} />
        </View>
        <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.text }}>Attachments</Text>
      </View>

      <TouchableOpacity
        onPress={pickDocument}
        activeOpacity={0.8}
        style={{ borderWidth: 2, borderColor: theme.colors.border, borderStyle: 'dashed', borderRadius: 16, paddingVertical: 24, alignItems: 'center', backgroundColor: theme.colors.muted100, marginBottom: 16 }}
      >
        <Upload size={24} color={theme.colors.primary} style={{ marginBottom: 8 }} />
        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text }}>Upload Files</Text>
        <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 }}>Add documents, images or presentations</Text>
      </TouchableOpacity>

      <View style={{ gap: 10 }}>
        {attachments.map((file) => (
          <View key={file.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, padding: 12, borderRadius: 14 }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${theme.colors.primary}10`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <ImageIcon size={20} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text }} numberOfLines={1}>{file.name}</Text>
              <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 }}>{file.size}</Text>
            </View>
            <TouchableOpacity onPress={() => removeAttachment(file.id)}>
              <Trash2 size={18} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}
