// src/Components/Projects/CreateSprintTaskWizard/SprintWizardContainer.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTheme } from '../../../Themes/ThemeContext';
import {
  Type,
  AlignLeft,
  Flag,
  MessageSquare,
  Paperclip,
  Plus,
  X,
  FileText,
  ChevronDown,
  Check,
  Rocket,
  Loader,
} from 'lucide-react-native';

const PRIORITY_OPTIONS = [
  { label: 'Urgent & Important', value: 'urgent_important', color: '#EF4444' },
  { label: 'Urgent & Not Important', value: 'urgent_not_important', color: '#F97316' },
  { label: 'Not Urgent & Important', value: 'not_urgent_important', color: '#3B82F6' },
  { label: 'Not Urgent & Not Imp.', value: 'not_urgent_not_imp', color: '#6B7280' },
];

export default function SprintWizardContainer({ onSubmit, submitting = false }) {
  const { theme } = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [remarks, setRemarks] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [priorityOpen, setPriorityOpen] = useState(false);

  const selectedPriority = PRIORITY_OPTIONS.find(p => p.value === priority) || null;
  const canCreate = !!title?.trim();

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
      setAttachments(prev => [...prev, ...picked]);
    });
  };

  const removeAttachment = (id) => setAttachments(prev => prev.filter(f => f.id !== id));

  const handleCreate = () => {
    onSubmit?.({
      title,
      description,
      extras: { priority, remarks, attachments },
      type: 'sprint_task',
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ─── Task Title ─── */}
        <View style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${theme.colors.primary}15`, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
              <Type size={14} color={theme.colors.primary} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text }}>Task Title</Text>
            <Text style={{ fontSize: 12, color: theme.colors.error, marginLeft: 3 }}>*</Text>
          </View>
          <TextInput
            style={{
              borderWidth: 1.5,
              borderColor: title ? theme.colors.primary : theme.colors.border,
              backgroundColor: theme.colors.muted100,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 11,
              fontSize: 14,
              fontWeight: '500',
              color: theme.colors.text,
            }}
            placeholder="What needs to be done?"
            placeholderTextColor={theme.colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />
        </View>

        {/* ─── Description ─── */}
        <View style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${theme.colors.secondary}15`, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
              <AlignLeft size={14} color={theme.colors.secondary} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text }}>Description</Text>
          </View>
          <TextInput
            style={{
              borderWidth: 1.5,
              borderColor: description ? theme.colors.primary : theme.colors.border,
              backgroundColor: theme.colors.muted100,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 11,
              fontSize: 14,
              fontWeight: '500',
              color: theme.colors.text,
              height: 100,
              textAlignVertical: 'top',
            }}
            multiline
            placeholder="Add details about the task…"
            placeholderTextColor={theme.colors.textSecondary}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* ─── Priority ─── */}
        <View style={{ marginBottom: 18, zIndex: 50 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${theme.colors.textSecondary}12`, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
              <Flag size={14} color={theme.colors.primary} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text }}>Priority</Text>
          </View>

          {/* Trigger */}
          <TouchableOpacity
            onPress={() => setPriorityOpen(prev => !prev)}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1.5,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.muted100,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 11,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              {selectedPriority ? (
                <>
                  <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: selectedPriority.color }} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
                    {selectedPriority.label}
                  </Text>
                </>
              ) : (
                <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.textSecondary }}>
                  Select priority…
                </Text>
              )}
            </View>
            <ChevronDown size={15} color={theme.colors.textSecondary} strokeWidth={2}
              style={{ transform: [{ rotate: priorityOpen ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>

          {/* Dropdown */}
          {priorityOpen && (
            <View style={{
              position: 'absolute', top: 74, left: 0, right: 0,
              backgroundColor: theme.colors.card,
              borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border,
              shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
              elevation: 12, zIndex: 999, overflow: 'hidden',
            }}>
              {PRIORITY_OPTIONS.map((opt, idx) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => { setPriority(opt.value); setPriorityOpen(false); }}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    paddingVertical: 12, paddingHorizontal: 14,
                    backgroundColor: priority === opt.value ? `${opt.color}12` : 'transparent',
                    borderBottomWidth: idx < PRIORITY_OPTIONS.length - 1 ? 1 : 0,
                    borderBottomColor: theme.colors.border,
                  }}
                >
                  <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: opt.color }} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: priority === opt.value ? opt.color : theme.colors.text, flex: 1 }}>
                    {opt.label}
                  </Text>
                  {priority === opt.value && <Check size={13} color={opt.color} strokeWidth={3} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ─── Remarks ─── */}
        <View style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${theme.colors.primary}15`, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
              <MessageSquare size={14} color={theme.colors.primary} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text }}>Remarks</Text>
          </View>
          <TextInput
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Any additional notes or comments…"
            placeholderTextColor={theme.colors.textSecondary}
            style={{
              backgroundColor: theme.colors.muted100,
              borderColor: remarks ? theme.colors.primary : theme.colors.border,
              borderWidth: 1.5,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 11,
              fontSize: 14,
              fontWeight: '500',
              color: theme.colors.text,
              height: 90,
              textAlignVertical: 'top',
            }}
            multiline
          />
        </View>

        {/* ─── Attachments ─── */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${theme.colors.task}15`, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
              <Paperclip size={14} color={theme.colors.task} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text }}>Attachments</Text>
          </View>

          <TouchableOpacity
            onPress={addAttachments}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              paddingVertical: 12, borderRadius: 12,
              borderWidth: 1.5, borderColor: theme.colors.border, borderStyle: 'dashed',
              backgroundColor: theme.colors.muted100, marginBottom: 10,
            }}
          >
            <Plus size={16} color={theme.colors.primary} strokeWidth={2.5} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.primary }}>Add Files</Text>
          </TouchableOpacity>

          {attachments.map((item) => (
            <View key={item.id} style={{
              flexDirection: 'row', alignItems: 'center',
              borderWidth: 1, borderColor: theme.colors.border,
              backgroundColor: theme.colors.card, borderRadius: 12,
              paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
            }}>
              <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: `${theme.colors.task}12`, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <FileText size={16} color={theme.colors.task} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.text }} numberOfLines={1}>{item.name}</Text>
                <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 }}>{(item.size / 1024).toFixed(1)} KB</Text>
              </View>
              <TouchableOpacity
                onPress={() => removeAttachment(item.id)}
                style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: `${theme.colors.error}12`, alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={14} color={theme.colors.error} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          ))}

          {attachments.length === 0 && (
            <Text style={{ fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center', paddingVertical: 4, fontWeight: '500' }}>
              No attachments added
            </Text>
          )}
        </View>

      </ScrollView>

      {/* ─── Create Button (pinned) ─── */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.background }}>
        <TouchableOpacity
          onPress={handleCreate}
          disabled={!canCreate || submitting}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            paddingVertical: 14, borderRadius: 14,
            backgroundColor: theme.colors.primary,
            opacity: (!canCreate || submitting) ? 0.5 : 1,
            shadowColor: theme.colors.primary,
            shadowOpacity: (canCreate && !submitting) ? 0.3 : 0,
            shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
            elevation: (canCreate && !submitting) ? 6 : 0,
          }}
        >
          {submitting
            ? <Loader size={18} color="#FFFFFF" strokeWidth={2} />
            : <Rocket size={18} color="#FFFFFF" strokeWidth={2} />
          }
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 }}>
            {submitting ? 'Creating…' : 'Create Task'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
