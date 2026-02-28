// src/Components/Projects/CreateSprintTaskWizard/SprintStepTaskDetails.jsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../../Themes/ThemeContext';
import { Type, AlignLeft, ChevronRight } from 'lucide-react-native';

export default function SprintStepTaskDetails({ title, description, setTitle, setDescription, onNext }) {
  const { theme } = useTheme();
  const canContinue = !!title?.trim();

  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >

      {/* ─── Task Title ─── */}
      <View style={{ marginBottom: 20 }}>
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
            <Type size={16} color={theme.colors.primary} strokeWidth={2} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text }}>
            Task Title
          </Text>
          <Text style={{ fontSize: 12, color: theme.colors.error, marginLeft: 4 }}>*</Text>
        </View>

        <TextInput
          style={{
            borderWidth: 1.5,
            borderColor: title ? theme.colors.primary : theme.colors.border,
            backgroundColor: theme.colors.muted100,
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 15,
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
      <View style={{ marginBottom: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: `${theme.colors.secondary}15`,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <AlignLeft size={16} color={theme.colors.secondary} strokeWidth={2} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text }}>
            Description
          </Text>
        </View>

        <TextInput
          style={{
            borderWidth: 1.5,
            borderColor: description ? theme.colors.primary : theme.colors.border,
            backgroundColor: theme.colors.muted100,
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 15,
            fontWeight: '500',
            color: theme.colors.text,
            height: 120,
            textAlignVertical: 'top',
          }}
          multiline
          placeholder="Add details about the task…"
          placeholderTextColor={theme.colors.textSecondary}
          value={description}
          onChangeText={setDescription}
        />
      </View>

      {/* ─── Continue Button ─── */}
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: theme.colors.primary,
          paddingVertical: 16,
          borderRadius: 14,
          opacity: canContinue ? 1 : 0.45,
          shadowColor: theme.colors.primary,
          shadowOpacity: canContinue ? 0.3 : 0,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: canContinue ? 6 : 0,
          marginBottom: 20,
        }}
        onPress={onNext}
        disabled={!canContinue}
        activeOpacity={0.8}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 }}>
          Continue
        </Text>
        <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>
    </ScrollView>
  );
}
