import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, Easing, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../Themes/ThemeContext';
import { FileText, Users, ListChecks, Check } from 'lucide-react-native';

const STEPS = [
  { key: 1, label: 'Details', icon: FileText },
  { key: 2, label: 'Participants', icon: Users },
  { key: 3, label: 'Agenda', icon: ListChecks },
];

export default function MeetingStepper({ currentStep = 1 }) {
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
              Schedule Meeting
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

        {/* Progress bar inside app bar */}
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

      {/* ─── Step Indicators ─── */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 20,
          paddingBottom: 14,
          backgroundColor: theme.colors.background,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          gap: 8,
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
                paddingVertical: 10,
                borderRadius: 12,
                marginTop: 10,
                backgroundColor: active
                  ? theme.colors.primary
                  : passed
                    ? `${theme.colors.primary}15`
                    : theme.colors.muted100,
                ...(active
                  ? {
                    shadowColor: theme.colors.primary,
                    shadowOpacity: 0.25,
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
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: theme.colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={12} color="#FFFFFF" strokeWidth={3} />
                </View>
              ) : (
                <Icon
                  size={15}
                  color={active ? '#FFFFFF' : theme.colors.tabInactive}
                  strokeWidth={active ? 2.2 : 1.8}
                />
              )}
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 11.5,
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
