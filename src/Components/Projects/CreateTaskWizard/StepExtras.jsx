// src/Components/CreateTaskWizard/StepExtras.jsx

import React from 'react';
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
  MessageSquare,
  Paperclip,
  Plus,
  X,
  FileText,
  Rocket,
  ChevronLeft,
  Link as LinkIcon,
} from 'lucide-react-native';

const FieldLabel = ({ icon: Icon, label, color }) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        marginBottom: 8,
        marginTop: 18,
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 7,
          backgroundColor: `${color || theme.colors.primary}18`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={12} color={color || theme.colors.primary} strokeWidth={2.2} />
      </View>
      <Text
        style={{
          fontSize: 12.5,
          fontWeight: '700',
          color: theme.colors.text,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

export default function StepExtras({
  value,
  onChange,
  onBack,
  onCreate,
  mode = 'create',
  title = 'Create Task',
}) {
  const { theme } = useTheme();

  const [linkTitle, setLinkTitle] = React.useState('');
  const [linkUrl, setLinkUrl] = React.useState('');

  const attachments = Array.isArray(value.attachments)
    ? value.attachments
    : [];
  const links = Array.isArray(value.links) ? value.links : [];

  // ------------------------
  // External Links Functions
  // ------------------------

  const addLink = () => {
    if (!linkTitle.trim() || !linkUrl.trim()) return;

    const newLink = {
      id: String(Date.now()),
      title: linkTitle.trim(),
      url: linkUrl.trim(),
    };

    onChange({ ...value, links: [...links, newLink] });

    setLinkTitle('');
    setLinkUrl('');
  };

  const removeLink = (id) =>
    onChange({ ...value, links: links.filter((l) => l.id !== id) });

  // ------------------------
  // Attachments Functions
  // ------------------------

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

      onChange({
        ...value,
        attachments: [...attachments, ...picked],
      });
    });
  };

  const removeAttachment = (id) =>
    onChange({
      ...value,
      attachments: attachments.filter((f) => f.id !== id),
    });

  // ------------------------
  // UI
  // ------------------------

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 20}
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: 16,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* External Links */}
          <FieldLabel icon={LinkIcon} label="External Links" color="#6366F1" />

          <View style={{ gap: 8 }}>
            <TextInput
              value={linkTitle}
              onChangeText={setLinkTitle}
              placeholder="Link Title"
              placeholderTextColor={theme.colors.textSecondary}
              style={{
                borderWidth: 1.5,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.muted100,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 11,
                fontSize: 14,
                fontWeight: '500',
                color: theme.colors.text,
              }}
            />

            <TextInput
              value={linkUrl}
              onChangeText={setLinkUrl}
              placeholder="https://example.com"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="url"
              autoCapitalize="none"
              style={{
                borderWidth: 1.5,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.muted100,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 11,
                fontSize: 14,
                fontWeight: '500',
                color: theme.colors.text,
              }}
            />

            <TouchableOpacity
              onPress={addLink}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: theme.colors.primary,
              }}
            >
              <Plus size={16} color="#FFF" strokeWidth={2.5} />
              <Text
                style={{
                  fontSize: 13.5,
                  fontWeight: '600',
                  color: '#FFF',
                }}
              >
                Add Link
              </Text>
            </TouchableOpacity>
          </View>

          {links.map((item) => (
            <View
              key={item.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.card,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginTop: 8,
              }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  backgroundColor: '#6366F118',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <LinkIcon size={16} color="#6366F1" strokeWidth={1.8} />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: theme.colors.text,
                  }}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.colors.textSecondary,
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {item.url}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => removeLink(item.id)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  backgroundColor: '#EF444412',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={14} color="#EF4444" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          ))}

          {links.length === 0 && (
            <Text
              style={{
                fontSize: 12.5,
                color: theme.colors.textSecondary,
                textAlign: 'center',
                paddingVertical: 6,
                fontWeight: '500',
              }}
            >
              No external links added
            </Text>
          )}


          {/* Attachments */}
          <FieldLabel icon={Paperclip} label="Attachments" color="#F59E0B" />

          <TouchableOpacity
            onPress={addAttachments}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: theme.colors.border,
              borderStyle: 'dashed',
              backgroundColor: theme.colors.muted100,
              marginBottom: 10,
            }}
          >
            <Plus size={16} color={theme.colors.primary} strokeWidth={2.5} />
            <Text
              style={{
                fontSize: 13.5,
                fontWeight: '600',
                color: theme.colors.primary,
              }}
            >
              Add Files
            </Text>
          </TouchableOpacity>

          {attachments.length === 0 && (
            <Text
              style={{
                fontSize: 12.5,
                color: theme.colors.textSecondary,
                textAlign: 'center',
                paddingVertical: 4,
                fontWeight: '500',
              }}
            >
              No attachments added
            </Text>
          )}
        </ScrollView>

        {/* Footer */}
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.background,
          }}
        >
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.8}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              paddingVertical: 13,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: theme.colors.border,
            }}
          >
            <ChevronLeft
              size={16}
              color={theme.colors.textSecondary}
              strokeWidth={2.5}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: theme.colors.textSecondary,
              }}
            >
              Back
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onCreate}
            activeOpacity={0.8}
            style={{
              flex: 2,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 13,
              borderRadius: 14,
              backgroundColor: theme.colors.primary,
              elevation: 5,
            }}
          >
            <Rocket size={18} color="#FFF" strokeWidth={2.5} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#FFF',
              }}
            >
              {title}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}