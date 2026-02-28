import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  Type,
  AlignLeft,
  Globe,
  Video,
  MapPin,
  Clock,
  Wifi,
  Building2,
  Users,
  Eye,
  Lock,
  Shield,
  ChevronDown,
} from 'lucide-react-native';
import { useTheme } from '../../Themes/ThemeContext';

export default function MeetingDetailsForm({ value, onChange }) {
  const { theme } = useTheme();
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [showVisibility, setShowVisibility] = useState(false);

  const visibilityOptions = [
    { label: 'Private', value: 'private', icon: Lock, color: theme.colors.error },
    { label: 'Public', value: 'public', icon: Eye, color: theme.colors.success },
    { label: 'Organization', value: 'organization', icon: Shield, color: theme.colors.primary },
  ];

  const selectedVisibility = visibilityOptions.find(o => o.value === (value.visibility || 'public')) || visibilityOptions[1];

  const startOfDay = (d) => {
    const dt = new Date(d);
    dt.setHours(0, 0, 0, 0);
    return dt;
  };
  const fmtDateTime = (d) => (d ? d.toLocaleString() : '');

  // ── Reusable section label ──
  const SectionLabel = ({ icon: Icon, iconColor, label, required }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: `${iconColor}15`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}
      >
        <Icon size={16} color={iconColor} strokeWidth={2} />
      </View>
      <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text }}>
        {label}
      </Text>
      {required && (
        <Text style={{ fontSize: 12, color: theme.colors.error, marginLeft: 4 }}>*</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView edges={['left', 'right']}>
      {/* ─── Title ─── */}
      <View style={{ marginBottom: 20 }}>
        <SectionLabel icon={Type} iconColor={theme.colors.primary} label="Title" required />
        <TextInput
          style={{
            borderWidth: 1.5,
            borderColor: value.title ? theme.colors.primary : theme.colors.border,
            backgroundColor: theme.colors.muted100,
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 15,
            fontWeight: '500',
            color: theme.colors.text,
          }}
          placeholder="Meeting title"
          placeholderTextColor={theme.colors.textSecondary}
          value={value.title}
          onChangeText={(t) => onChange({ ...value, title: t })}
        />
      </View>

      {/* ─── Description ─── */}
      <View style={{ marginBottom: 20 }}>
        <SectionLabel icon={AlignLeft} iconColor={theme.colors.secondary} label="Description" />
        <TextInput
          style={{
            borderWidth: 1.5,
            borderColor: value.description ? theme.colors.primary : theme.colors.border,
            backgroundColor: theme.colors.muted100,
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 15,
            fontWeight: '500',
            color: theme.colors.text,
            height: 100,
            textAlignVertical: 'top',
          }}
          placeholder="Meeting description"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          numberOfLines={4}
          value={value.description}
          onChangeText={(t) => onChange({ ...value, description: t })}
        />
      </View>

      {/* ─── Meeting Scope ─── */}
      <View style={{ marginBottom: 20 }}>
        <SectionLabel icon={Globe} iconColor={theme.colors.event} label="Meeting Scope" required />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {['Internal', 'External', 'Both'].map((opt) => {
            const active = value.scope === opt;
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => onChange({ ...value, scope: opt })}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                  backgroundColor: active ? `${theme.colors.primary}12` : theme.colors.muted100,
                  ...(active
                    ? {
                      shadowColor: theme.colors.primary,
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                    }
                    : {}),
                }}
              >
                {opt === 'Internal' ? (
                  <Building2 size={16} color={active ? theme.colors.primary : theme.colors.textSecondary} strokeWidth={1.8} />
                ) : opt === 'External' ? (
                  <Globe size={16} color={active ? theme.colors.primary : theme.colors.textSecondary} strokeWidth={1.8} />
                ) : (
                  <Users size={16} color={active ? theme.colors.primary : theme.colors.textSecondary} strokeWidth={1.8} />
                )}
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: active ? '700' : '500',
                    color: active ? theme.colors.primary : theme.colors.text,
                  }}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ─── Visibility ─── */}
      <View style={{ marginBottom: 20 }}>
        <SectionLabel icon={Shield} iconColor={theme.colors.primary} label="Visibility" required />
        <TouchableOpacity
          onPress={() => setShowVisibility(!showVisibility)}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1.5,
            borderColor: showVisibility ? theme.colors.primary : theme.colors.border,
            backgroundColor: theme.colors.muted100,
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {React.createElement(selectedVisibility.icon, {
              size: 18,
              color: selectedVisibility.color,
              strokeWidth: 2
            })}
            <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text }}>
              {selectedVisibility.label}
            </Text>
          </View>
          <ChevronDown
            size={20}
            color={theme.colors.textSecondary}
            style={{ transform: [{ rotate: showVisibility ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>

        {showVisibility && (
          <View
            style={{
              marginTop: 8,
              backgroundColor: theme.colors.card,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.colors.border,
              overflow: 'hidden',
              elevation: 4,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            {visibilityOptions.map((opt, idx) => {
              const active = (value.visibility || 'public') === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => {
                    onChange({ ...value, visibility: opt.value });
                    setShowVisibility(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    backgroundColor: active ? `${theme.colors.primary}10` : 'transparent',
                    borderBottomWidth: idx === visibilityOptions.length - 1 ? 0 : 1,
                    borderBottomColor: theme.colors.borderMuted,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: `${opt.color}15`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    {React.createElement(opt.icon, { size: 16, color: opt.color, strokeWidth: 2 })}
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: active ? '700' : '500',
                      color: active ? theme.colors.primary : theme.colors.text,
                    }}
                  >
                    {opt.label}
                  </Text>
                  {active && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.colors.primary,
                      }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* ─── Meeting Type ─── */}
      <View style={{ marginBottom: 20 }}>
        <SectionLabel icon={Video} iconColor={theme.colors.task} label="Meeting Type" required />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['Virtual', 'In Person', 'Hybrid'].map((opt) => {
            const active = value.type === opt;
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => onChange({ ...value, type: opt })}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                  backgroundColor: active ? `${theme.colors.primary}12` : theme.colors.muted100,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: active ? '700' : '500',
                    color: active ? theme.colors.primary : theme.colors.text,
                  }}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ─── Virtual URL ─── */}
      {value.type !== 'In Person' && (
        <View style={{ marginBottom: 20 }}>
          <SectionLabel icon={Wifi} iconColor={theme.colors.primary} label="Virtual Meeting URL" required />
          <TextInput
            style={{
              borderWidth: 1.5,
              borderColor: value.virtualUrl ? theme.colors.primary : theme.colors.border,
              backgroundColor: theme.colors.muted100,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
              fontWeight: '500',
              color: theme.colors.text,
            }}
            placeholder="https://meet.google.com/abc-xyz"
            placeholderTextColor={theme.colors.textSecondary}
            value={value.virtualUrl}
            onChangeText={(t) => onChange({ ...value, virtualUrl: t })}
          />
        </View>
      )}

      {/* ─── Physical Location ─── */}
      {value.type !== 'Virtual' && (
        <View style={{ marginBottom: 20 }}>
          <SectionLabel icon={MapPin} iconColor={theme.colors.event} label="Physical Location" />
          <TextInput
            style={{
              borderWidth: 1.5,
              borderColor: value.location ? theme.colors.primary : theme.colors.border,
              backgroundColor: theme.colors.muted100,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
              fontWeight: '500',
              color: theme.colors.text,
            }}
            placeholder="Office Conference Room, 123 Main St..."
            placeholderTextColor={theme.colors.textSecondary}
            value={value.location}
            onChangeText={(t) => onChange({ ...value, location: t })}
          />
        </View>
      )}

      {/* ─── Start / End Date & Time ─── */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <SectionLabel icon={Calendar} iconColor={theme.colors.primary} label="Start" required />
          <TouchableOpacity
            onPress={() => setShowStart(true)}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1.5,
              borderColor: value.start ? theme.colors.primary : theme.colors.border,
              backgroundColor: theme.colors.muted100,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 14,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: value.start ? theme.colors.text : theme.colors.textSecondary,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {fmtDateTime(value.start) || 'Select date & time'}
            </Text>
            <Clock size={16} color={theme.colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
          <SectionLabel icon={Calendar} iconColor={theme.colors.event} label="End" required />
          <TouchableOpacity
            onPress={() => setShowEnd(true)}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1.5,
              borderColor: value.end ? theme.colors.primary : theme.colors.border,
              backgroundColor: theme.colors.muted100,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 14,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: value.end ? theme.colors.text : theme.colors.textSecondary,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {fmtDateTime(value.end) || 'Select date & time'}
            </Text>
            <Clock size={16} color={theme.colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Pickers ─── */}
      <DateTimePickerModal
        isVisible={showStart}
        mode="datetime"
        minimumDate={startOfDay(new Date())}
        onConfirm={(d) => {
          onChange({ ...value, start: d });
          setShowStart(false);
        }}
        onCancel={() => setShowStart(false)}
      />
      <DateTimePickerModal
        isVisible={showEnd}
        mode="datetime"
        minimumDate={value.start || startOfDay(new Date())}
        onConfirm={(d) => {
          onChange({ ...value, end: d });
          setShowEnd(false);
        }}
        onCancel={() => setShowEnd(false)}
      />
    </SafeAreaView>
  );
}
