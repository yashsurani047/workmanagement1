import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../../../Themes/Themes';

export default function ProjectStepper({ currentStep = 1, title = 'Create New Project' }) {
  const steps = [
    { key: 1, label: 'Details' },
    { key: 2, label: 'Team & Dates' },
    { key: 3, label: 'Attachments' },
  ];

  return (
    <SafeAreaView edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.stepRow}>
        {steps.map((s, idx) => {
          const active = currentStep === s.key;
          const passed = currentStep > s.key;
          return (
            <View key={s.key} style={styles.stepItem}>
              <View style={[styles.stepCircle, (active || passed) && styles.stepCircleActive]}>
                <Text style={[styles.stepNumber, (active || passed) && styles.stepNumberActive]}> {s.key} </Text>
              </View>
              <Text numberOfLines={1} style={[styles.stepLabel, (active || passed) && styles.stepLabelActive]}> {s.label} </Text>
              {idx < steps.length - 1 && <View style={[styles.stepConnector, (currentStep > s.key) && styles.stepConnectorActive]} />}
            </View>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const CIRCLE_SIZE = 28;

const styles = StyleSheet.create({
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}15`,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  stepNumberActive: {
    color: theme.colors.primary,
  },
  stepLabel: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  stepLabelActive: {
    color: theme.colors.text,
  },
  stepConnector: {
    position: 'absolute',
    top: CIRCLE_SIZE / 2,
    right: -16,
    width: '100%',
    maxWidth: 32,
    height: 2,
    backgroundColor: theme.colors.border,
  },
  stepConnectorActive: {
    backgroundColor: theme.colors.primary,
  },
});
