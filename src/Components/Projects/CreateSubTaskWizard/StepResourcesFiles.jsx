// src/Components/Projects/CreateSubTaskWizard/StepResourcesFiles.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTheme } from '../../../Themes/ThemeContext';
import {
  Link2,
  Plus,
  Paperclip,
  FileText,
  X,
  Upload,
  ChevronLeft,
  GitBranch,
  ExternalLink,
} from 'lucide-react-native';

export default function StepResourcesFiles({
  onNext,
  onBack,
  onCreate,
  formData,
  updateFormData,
  mode = 'create',
  title = 'Create Subtask',
}) {
  const { theme } = useTheme();
  const [url, setUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');

  const { links = [], attachments = [] } = formData;

  const addLink = () => {
    if (!url || !linkTitle) {
      Alert.alert('Required Fields', 'Please fill in URL and Link Title');
      return;
    }
    const newLink = {
      id: Date.now().toString(),
      url,
      title: linkTitle,
      description: linkDescription,
    };
    updateFormData({ links: [...links, newLink] });
    setUrl('');
    setLinkTitle('');
    setLinkDescription('');
  };

  const removeLink = (linkId) => {
    updateFormData({ links: links.filter((link) => link.id !== linkId) });
  };

  const removeAttachment = (attachmentId) => {
    updateFormData({ attachments: attachments.filter((att) => att.id !== attachmentId) });
  };

  const pickDocument = async () => {
    const options = {
      mediaType: 'photo',
      selectionLimit: 0,
      includeBase64: false,
    };

    try {
      const result = await launchImageLibrary(options);

      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (result.errorCode) {
        console.warn('ImagePicker Error: ', result.errorMessage);
        Alert.alert('Error', result.errorMessage || 'Failed to pick file.');
        return;
      }

      if (result.assets) {
        const newAttachments = result.assets.map((file) => {
          const cleanName = file.fileName || `image_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          return {
            id: Date.now().toString() + Math.random(),
            uri: file.uri,
            name: cleanName,
            type: file.type || 'image/jpeg',
            size:
              file.fileSize !== null && file.fileSize !== undefined
                ? `${(file.fileSize / (1024 * 1024)).toFixed(2)} MB`
                : 'Unknown',
            mimeType: file.type,
          };
        });
        updateFormData({ attachments: [...attachments, ...newAttachments] });
      }
    } catch (err) {
      console.warn('Picker Error: ', err);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ─── Related Links ─── */}
      <View style={{ marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
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
            <Link2 size={16} color={theme.colors.primary} strokeWidth={2} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text }}>
            Related Links
          </Text>
        </View>

        {/* Add Link Form */}
        <View
          style={{
            backgroundColor: theme.colors.muted100,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <TextInput
            style={{
              borderWidth: 1.5,
              borderColor: url ? theme.colors.primary : theme.colors.border,
              backgroundColor: theme.colors.card,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 14,
              fontWeight: '500',
              color: theme.colors.text,
              marginBottom: 10,
            }}
            placeholder="URL"
            placeholderTextColor={theme.colors.textSecondary}
            value={url}
            onChangeText={setUrl}
            keyboardType="url"
          />
          <TextInput
            style={{
              borderWidth: 1.5,
              borderColor: linkTitle ? theme.colors.primary : theme.colors.border,
              backgroundColor: theme.colors.card,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 14,
              fontWeight: '500',
              color: theme.colors.text,
              marginBottom: 10,
            }}
            placeholder="Link Title"
            placeholderTextColor={theme.colors.textSecondary}
            value={linkTitle}
            onChangeText={setLinkTitle}
          />
          <TextInput
            style={{
              borderWidth: 1.5,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 14,
              fontWeight: '500',
              color: theme.colors.text,
              height: 70,
              textAlignVertical: 'top',
              marginBottom: 12,
            }}
            placeholder="Description (Optional)"
            placeholderTextColor={theme.colors.textSecondary}
            value={linkDescription}
            onChangeText={setLinkDescription}
            multiline
          />
          <TouchableOpacity
            onPress={addLink}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: theme.colors.primary,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Add Link</Text>
          </TouchableOpacity>
        </View>

        {/* Links List */}
        {links.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: theme.colors.textSecondary,
                marginBottom: 8,
              }}
            >
              Added Links ({links.length})
            </Text>
            {links.map((link) => (
              <View
                key={link.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.colors.card,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: `${theme.colors.primary}12`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <ExternalLink size={18} color={theme.colors.primary} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}
                    numberOfLines={1}
                  >
                    {link.title}
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: theme.colors.primary, marginTop: 2 }}
                    numberOfLines={1}
                  >
                    {link.url}
                  </Text>
                  {link.description ? (
                    <Text
                      style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 }}
                      numberOfLines={1}
                    >
                      {link.description}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => removeLink(link.id)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: `${theme.colors.error}12`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 8,
                  }}
                >
                  <X size={16} color={theme.colors.error} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ─── Attachments ─── */}
      <View style={{ marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
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

        {/* Upload Area */}
        <TouchableOpacity
          onPress={pickDocument}
          activeOpacity={0.8}
          style={{
            borderWidth: 1.5,
            borderColor: theme.colors.border,
            borderStyle: 'dashed',
            borderRadius: 16,
            paddingVertical: 28,
            alignItems: 'center',
            backgroundColor: theme.colors.muted100,
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: `${theme.colors.primary}12`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}
          >
            <Upload size={24} color={theme.colors.primary} strokeWidth={1.8} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text, marginBottom: 4 }}>
            Tap to select files
          </Text>
          <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
            Supports PDF, DOCX, images, videos, ZIP, and more
          </Text>
        </TouchableOpacity>

        {/* Attachment list */}
        {attachments.map((attachment) => (
          <View
            key={attachment.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.colors.card,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              marginBottom: 8,
            }}
          >
            {attachment.mimeType?.includes('image') ? (
              <Image
                source={{ uri: attachment.uri }}
                style={{ width: 42, height: 42, borderRadius: 10, marginRight: 12 }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  backgroundColor: `${theme.colors.task}12`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <FileText size={20} color={theme.colors.task} strokeWidth={1.8} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}
                numberOfLines={1}
              >
                {attachment.name}
              </Text>
              <Text
                style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2, fontWeight: '500' }}
              >
                {attachment.size}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => removeAttachment(attachment.id)}
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

        {attachments.length === 0 && (
          <Text
            style={{
              fontSize: 13,
              color: theme.colors.textSecondary,
              textAlign: 'center',
              paddingVertical: 8,
              fontWeight: '500',
            }}
          >
            No attachments added
          </Text>
        )}
      </View>

      {/* ─── Footer Buttons ─── */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 30 }}>
        <TouchableOpacity
          onPress={onBack}
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
            shadowColor: theme.colors.primary,
            shadowOpacity: 0.3,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}
        >
          <GitBranch size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 }}>
            {title}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}