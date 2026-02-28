// src/Components/Projects/ProjectTabs/ProjectStepper.jsx
import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, Easing, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../Themes/ThemeContext';
import { FileText, Users, Paperclip, Check } from 'lucide-react-native';

const STEPS = [
  { key: 1, label: 'Details', icon: FileText },
  { key: 2, label: 'Team & Dates', icon: Users },
  { key: 3, label: 'Attachments', icon: Paperclip },
];

export default function ProjectStepper({ currentStep = 1, title = 'Create New Project' }) {
  const { theme } = useTheme();

  // Progress bar animation
  const progressAnim = useRef(new Animated.Value(currentStep / STEPS.length)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep / STEPS.length,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* ─── Colored App Bar ─── */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 18,
          backgroundColor: theme.colors.primary,
          borderBottomLeftRadius: 22,
          borderBottomRightRadius: 22,
        }}
      >
        {/* Title Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '900',
                color: '#FFFFFF',
                letterSpacing: -0.5,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.7)',
                fontWeight: '500',
                marginTop: 2,
              }}
            >
              Step {currentStep} of {STEPS.length}
            </Text>
          </View>

          {/* Step badge */}
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.3)',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>
              {currentStep}/{STEPS.length}
            </Text>
          </View>
        </View>

        {/* ─── Progress Bar inside App Bar ─── */}
        <View style={{ marginTop: 12 }}>
          <View
            style={{
              height: 5,
              borderRadius: 3,
              backgroundColor: 'rgba(255,255,255,0.25)',
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={{
                height: '100%',
                borderRadius: 3,
                backgroundColor: '#FFFFFF',
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }}
            />
          </View>
        </View>
      </View>

      {/* ─── Step Indicator Pills (on white/card background) ─── */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: theme.colors.background,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          gap: 8,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
      >
        {STEPS.map((s) => {
          const active = currentStep === s.key;
          const passed = currentStep > s.key;
          const Icon = s.icon;

          return (
            <View
              key={s.key}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 9,
                borderRadius: 12,
                backgroundColor: active
                  ? theme.colors.primary
                  : passed
                    ? `${theme.colors.primary}15`
                    : theme.colors.muted100,
                ...(active
                  ? {
                    shadowColor: theme.colors.primary,
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 4,
                  }
                  : {}),
              }}
            >
              {passed ? (
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: theme.colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={11} color="#FFFFFF" strokeWidth={3} />
                </View>
              ) : (
                <Icon
                  size={14}
                  color={active ? '#FFFFFF' : theme.colors.tabInactive}
                  strokeWidth={active ? 2.2 : 1.8}
                />
              )}
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 11,
                  fontWeight: active || passed ? '700' : '500',
                  color: active
                    ? '#FFFFFF'
                    : passed
                      ? theme.colors.primary
                      : theme.colors.tabInactive,
                }}
              >
                {s.label}
              </Text>
            </View>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
