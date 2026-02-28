// src/Components/Projects/CreateSprintTaskWizard/SprintStepExtras.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTheme } from '../../../Themes/ThemeContext';
import {
  Flag,
  MessageSquare,
  Paperclip,
  Plus,
  X,
  FileText,
  ChevronDown,
  ChevronLeft,
  Rocket,
  Loader,
  Check,
} from 'lucide-react-native';

const PRIORITY_OPTIONS = [
  { label: 'Urgent & Important', value: 'urgent_important', color: '#EF4444' },
  { label: 'Urgent & Not Important', value: 'urgent_not_important', color: '#F97316' },
  { label: 'Not Urgent & Important', value: 'not_urgent_important', color: '#3B82F6' },
  { label: 'Not Urgent & Not Imp.', value: 'not_urgent_not_imp', color: '#6B7280' },
];

export default function SprintStepExtras({ value, onChange, onBack, onCreate, submitting = false, canCreate = true }) {
  const { theme } = useTheme();
  const [priorityOpen, setPriorityOpen] = useState(false);

  const selectedPriority = PRIORITY_OPTIONS.find(p => p.value === value.priority) || null;

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
      onChange({ ...value, attachments: [...(value.attachments || []), ...picked] });
    });
  };

  const removeAttachment = (id) => {
    const next = (value.attachments || []).filter((f) => f.id !== id);
    onChange({ ...value, attachments: next });
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >

      {/* ─── Priority ─── */}
      <View style={{ marginBottom: 24, zIndex: 50 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: `${theme.colors.textSecondary}15`,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <Flag size={16} color={theme.colors.primary} strokeWidth={2} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text }}>
            Priority
          </Text>
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
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            {selectedPriority ? (
              <>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: selectedPriority.color }} />
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
          <ChevronDown
            size={16}
            color={theme.colors.textSecondary}
            strokeWidth={2}
            style={{ transform: [{ rotate: priorityOpen ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>

        {/* Dropdown list */}
        {priorityOpen && (
          <View
            style={{
              position: 'absolute',
              top: 88,
              left: 0,
              right: 0,
              backgroundColor: theme.colors.card,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.colors.border,
              shadowColor: '#000',
              shadowOpacity: 0.14,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 12,
              zIndex: 999,
              overflow: 'hidden',
            }}
          >
            {PRIORITY_OPTIONS.map((opt, idx) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => {
                  onChange({ ...value, priority: opt.value });
                  setPriorityOpen(false);
                }}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 13,
                  paddingHorizontal: 16,
                  backgroundColor: value.priority === opt.value ? `${opt.color}12` : 'transparent',
                  borderBottomWidth: idx < PRIORITY_OPTIONS.length - 1 ? 1 : 0,
                  borderBottomColor: theme.colors.border,
                }}
              >
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: opt.color }} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: value.priority === opt.value ? opt.color : theme.colors.text, flex: 1 }}>
                  {opt.label}
                </Text>
                {value.priority === opt.value && (
                  <Check size={14} color={opt.color} strokeWidth={3} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* ─── Remarks ─── */}
      <View style={{ marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
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
            <MessageSquare size={16} color={theme.colors.primary} strokeWidth={2} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text }}>
            Remarks
          </Text>
        </View>

        <TextInput
          value={value.remarks}
          onChangeText={(t) => onChange({ ...value, remarks: t })}
          placeholder="Any additional notes or comments…"
          placeholderTextColor={theme.colors.textSecondary}
          style={{
            backgroundColor: theme.colors.muted100,
            borderColor: value.remarks ? theme.colors.primary : theme.colors.border,
            borderWidth: 1.5,
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 14,
            fontWeight: '500',
            color: theme.colors.text,
            height: 110,
            textAlignVertical: 'top',
          }}
          multiline
        />
      </View>

      {/* ─── Attachments ─── */}
      <View style={{ marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: `${theme.colors.task}15`,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <Paperclip size={16} color={theme.colors.task} strokeWidth={2} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text }}>
            Attachments
          </Text>
        </View>

        <TouchableOpacity
          onPress={addAttachments}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 14,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: theme.colors.border,
            borderStyle: 'dashed',
            backgroundColor: theme.colors.muted100,
            marginBottom: 12,
          }}
        >
          <Plus size={18} color={theme.colors.primary} strokeWidth={2} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.primary }}>
            Add Files
          </Text>
        </TouchableOpacity>

        {(value.attachments || []).map((item) => (
          <View
            key={item.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              marginBottom: 8,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: `${theme.colors.task}12`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <FileText size={18} color={theme.colors.task} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2, fontWeight: '500' }}>
                {(item.size / 1024).toFixed(1)} KB
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => removeAttachment(item.id)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: `${theme.colors.error}12`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} color={theme.colors.error} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        ))}

        {(value.attachments || []).length === 0 && (
          <Text style={{ fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', paddingVertical: 8, fontWeight: '500' }}>
            No attachments added
          </Text>
        )}
      </View>

      {/* ─── Footer Buttons ─── */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 30 }}>
        <TouchableOpacity
          onPress={onBack}
          disabled={submitting}
          activeOpacity={0.8}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 16,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.card,
          }}
        >
          <ChevronLeft size={18} color={theme.colors.text} strokeWidth={2} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text }}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onCreate}
          disabled={!canCreate || submitting}
          activeOpacity={0.8}
          style={{
            flex: 1.5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 16,
            borderRadius: 14,
            backgroundColor: theme.colors.primary,
            opacity: (!canCreate || submitting) ? 0.5 : 1,
            shadowColor: theme.colors.primary,
            shadowOpacity: (canCreate && !submitting) ? 0.3 : 0,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
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
    </ScrollView>
  );
}
