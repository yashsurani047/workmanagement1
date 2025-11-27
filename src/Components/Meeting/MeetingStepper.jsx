import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../../Themes/Themes';

export default function MeetingStepper({ currentStep }) {
  const steps = [
    { key: 1, label: 'Details' },
    { key: 2, label: 'Participants' },
    { key: 3, label: 'Agenda' },
  ];

  return (
    <SafeAreaView edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Schedule New Meeting</Text>
      </View>
      <View style={styles.stepRow}>
        {steps.map((s, idx) => {
          const active = currentStep === s.key;
          return (
            <View key={s.key} style={styles.stepItem}>
              <View style={[styles.stepCircle, active && styles.stepCircleActive]}>
                <Text style={[styles.stepNumber, active && styles.stepNumberActive]}> {s.key} </Text>
              </View>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive]}> {s.label} </Text>
              {idx < steps.length - 1 && <View style={styles.stepDivider} />}
            </View>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  stepCircleActive: {
    borderColor: theme.colors.primary,
  },
  stepNumber: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '600',
  },
  stepNumberActive: {
    color: theme.colors.primary,
  },
  stepLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.text,
  },
  stepLabelActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  stepDivider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 8,
  },
});
