import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../../Themes/Themes';
import MeetingStepper from '../../Components/Meeting/MeetingStepper';
import MeetingDetailsForm from '../../Components/Meeting/MeetingDetailsForm';
import MeetingParticipants from '../../Components/Meeting/MeetingParticipants';
import MeetingAgenda from '../../Components/Meeting/MeetingAgenda';
import { createMeeting, updateMeeting, toApiDateTime } from '../../Services/Meeting/MeetingsService';
import Toast from 'react-native-toast-message';

export default function CreatMeeting({ navigation, route }) {
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState({ title: '', description: '', scope: 'Internal', type: 'Hybrid', virtualUrl: '', location: '', start: null, end: null });
  const [participants, setParticipants] = useState({ selected: [] });
  const [agenda, setAgenda] = useState({ items: [{ title: '', description: '' }] });
  const [submitting, setSubmitting] = useState(false);
  const isEdit = route?.params?.mode === 'edit';
  const meetingParam = route?.params?.meeting || null;

  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (submitting) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: false }),
          Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: false }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [submitting, shimmer]);

  const shimmerBg = shimmer.interpolate({ inputRange: [0, 1], outputRange: [theme.colors.primary, theme.colors.projectSoft] });

  useEffect(() => {
    try {
      if (!isEdit || !meetingParam) return;
      const inverseScope = { internal: 'Internal', external: 'External' };
      const inverseType = { virtual: 'Virtual', in_person: 'In Person', hybrid: 'Hybrid' };
      setDetails({
        title: meetingParam?.title || '',
        description: meetingParam?.description || '',
        scope: inverseScope[meetingParam?.meeting_scope] || 'Internal',
        type: inverseType[meetingParam?.meeting_type] || 'Hybrid',
        virtualUrl: meetingParam?.meeting_url || '',
        location: meetingParam?.location || '',
        start: meetingParam?.start_time ? new Date(meetingParam.start_time) : null,
        end: meetingParam?.end_time ? new Date(meetingParam.end_time) : null,
      });
      const sel = Array.isArray(meetingParam?.participants)
        ? meetingParam.participants.map((p) => (typeof p === 'object' ? (p.user_id || p.id) : p)).filter(Boolean)
        : [];
      setParticipants({ selected: sel });
      const items = Array.isArray(meetingParam?.agenda_items)
        ? meetingParam.agenda_items.map((a) => ({ title: a?.title || '', description: a?.description || '' }))
        : [{ title: '', description: '' }];
      setAgenda({ items });
    } catch {}
  }, [isEdit, meetingParam]);

  const canNext = () => {
    if (step === 1) return !!details.title && !!details.start && !!details.end;
    if (step === 2) return true;
    return true;
  };

  const onNext = async () => {
    if (step < 3) { setStep(step + 1); return; }
    try {
      if (submitting) return;
      if (!details.title?.trim()) { Alert.alert('Validation', 'Title is required'); return; }
      if (!details.start || !details.end) { Alert.alert('Validation', 'Start and end time are required'); return; }

      const scopeMap = { Internal: 'internal', External: 'external' };
      const typeMap = { Virtual: 'virtual', 'In Person': 'in_person', Hybrid: 'hybrid' };

      const payload = {
        title: details.title.trim(),
        description: details.description?.trim() || '',
        start_time: toApiDateTime(details.start),
        end_time: toApiDateTime(details.end),
        meeting_scope: scopeMap[details.scope] || 'internal',
        meeting_type: typeMap[details.type] || 'virtual',
        meeting_url: details.virtualUrl?.trim() || '',
        location: details.location?.trim() || '',
        participants: Array.isArray(participants.selected) ? participants.selected : [],
        external_emails: [],
        agenda_items: Array.isArray(agenda.items)
          ? agenda.items.map((it, idx) => ({ title: it.title?.trim() || '', description: it.description?.trim() || '', duration: 15, sort_order: idx + 1 }))
          : [],
        send_notifications: true,
        sort_order: 0,
      };
      setSubmitting(true);
      let res;
      if (isEdit) {
        const meetingId = route?.params?.meetingId || meetingParam?.meeting_id || meetingParam?.id;
        res = await updateMeeting(meetingId, payload);
      } else {
        res = await createMeeting(payload);
      }
      if (res?.success) {
        Toast.show({ type: 'custom_success', text1: isEdit ? 'Meeting updated successfully' : 'Meeting scheduled successfully', position: 'bottom', visibilityTime: 1500 });
        setTimeout(() => {
          navigation.navigate('Tabs', { screen: 'Home' });
        }, 800);
      } else {
        Toast.show({ type: 'custom_error', text1: res?.error || (isEdit ? 'Failed to update meeting' : 'Failed to create meeting'), position: 'bottom', visibilityTime: 2000 });
        setSubmitting(false);
      }
    } catch (e) {
      Toast.show({ type: 'custom_error', text1: e?.message || (isEdit ? 'Failed to update meeting' : 'Failed to create meeting'), position: 'bottom', visibilityTime: 2000 });
      setSubmitting(false);
    }
  };
  const onBack = () => { if (step > 1) setStep(step - 1); else navigation.goBack(); };

  return (
    <SafeAreaView style={styles.screen} edges={['top','bottom','left','right']}>
      <MeetingStepper currentStep={step} />

      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 && (
          <MeetingDetailsForm value={details} onChange={setDetails} />
        )}
        {step === 2 && (
          <MeetingParticipants value={participants} onChange={setParticipants} />
        )}
        {step === 3 && (
          <MeetingAgenda value={agenda} onChange={setAgenda} />
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onBack} disabled={submitting}>
          <Text style={styles.cancelText}>{step === 1 ? 'Cancel' : 'Back'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            (!canNext() || submitting) && styles.disabled,
            submitting && step === 3 ? { backgroundColor: undefined } : null,
          ]}
          disabled={!canNext() || submitting}
          onPress={onNext}
          activeOpacity={submitting ? 1 : 0.7}
        >
          {submitting && step === 3 ? (
            <Animated.View style={[styles.loadingWrap, { backgroundColor: shimmerBg }]}>
              <ActivityIndicator color={theme.colors.background} size="small" />
              <Text style={[styles.primaryText, { marginLeft: 8 }]}>{isEdit ? 'Updating...' : 'Scheduling...'}</Text>
            </Animated.View>
          ) : (
            <Text style={styles.primaryText}>{step === 3 ? (isEdit ? 'Update Meeting' : 'Create Meeting') : 'Next'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.background },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  cancelText: { color: theme.colors.text, fontSize: 16 },
  primaryBtn: { backgroundColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  primaryText: { color: theme.colors.background, fontWeight: '700' },
  disabled: { opacity: 0.6 },
  loadingWrap: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
});
