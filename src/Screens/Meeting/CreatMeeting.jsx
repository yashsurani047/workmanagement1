import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../Themes/ThemeContext';
import MeetingStepper from '../../Components/Meeting/MeetingStepper';
import MeetingDetailsForm from '../../Components/Meeting/MeetingDetailsForm';
import MeetingParticipants from '../../Components/Meeting/MeetingParticipants';
import MeetingAgenda from '../../Components/Meeting/MeetingAgenda';
import { createMeeting, updateMeeting, toApiDateTime } from '../../Services/Meeting/MeetingsService';
import Toast from 'react-native-toast-message';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Video,
  Loader,
} from 'lucide-react-native';

export default function CreatMeeting({ navigation, route }) {
  const { theme } = useTheme();
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState({
    title: '',
    description: '',
    scope: 'Internal',
    type: 'Hybrid',
    virtualUrl: '',
    location: '',
    start: null,
    end: null,
    visibility: 'public',
  });
  const [participants, setParticipants] = useState({ selected: [], external: [] });
  const [agenda, setAgenda] = useState({
    items: [{ title: '', duration: '15', description: '' }],
    notes: [],
    attachments: []
  });
  const [submitting, setSubmitting] = useState(false);
  const isEdit = route?.params?.mode === 'edit';
  const meetingParam = route?.params?.meeting || null;

  // Shimmer animation for submitting state
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

  const shimmerBg = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.primary, `${theme.colors.primary}AA`],
  });

  // Initialize edit mode
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
        visibility: meetingParam?.visibility || 'public',
      });
      const sel = Array.isArray(meetingParam?.participants)
        ? meetingParam.participants
          .map((p) => (typeof p === 'object' ? p.user_id || p.id : p))
          .filter(Boolean)
        : [];
      setParticipants({
        selected: sel,
        external: Array.isArray(meetingParam?.external_emails) ? meetingParam.external_emails : []
      });
      const items = Array.isArray(meetingParam?.agenda_items)
        ? meetingParam.agenda_items.map((a) => ({
          title: a?.title || '',
          description: a?.description || '',
          duration: String(a?.duration || '15'),
        }))
        : [{ title: '', duration: '15', description: '' }];
      const notes = Array.isArray(meetingParam?.notes) ? meetingParam.notes : [];
      const attachments = Array.isArray(meetingParam?.attachments) ? meetingParam.attachments : [];
      setAgenda({ items, notes, attachments });
    } catch { }
  }, [isEdit, meetingParam]);

  const canNext = () => true;

  const onNext = async () => {
    if (step === 1) {
      if (!details.title?.trim()) {
        Alert.alert('Validation', 'Title is required');
        return;
      }
      if (!details.start || !details.end) {
        Alert.alert('Validation', 'Start and end time are required');
        return;
      }
      setStep(2);
      return;
    }
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    try {
      if (submitting) return;
      if (!details.title?.trim()) {
        Alert.alert('Validation', 'Title is required');
        return;
      }
      if (!details.start || !details.end) {
        Alert.alert('Validation', 'Start and end time are required');
        return;
      }

      const scopeMap = { Internal: 'internal', External: 'external', Both: 'both' };
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
        visibility: details.visibility || 'public',
        participants: Array.isArray(participants.selected) ? participants.selected : [],
        external_emails: Array.isArray(participants.external) ? participants.external : [],
        agenda_items: Array.isArray(agenda.items)
          ? agenda.items.map((it, idx) => ({
            title: it.title?.trim() || '',
            description: it.description?.trim() || '',
            duration: parseInt(it.duration) || 15,
            sort_order: idx + 1,
          }))
          : [],
        notes: Array.isArray(agenda.notes) ? agenda.notes : [],
        attachments: Array.isArray(agenda.attachments) ? agenda.attachments : [],
        send_notifications: true,
        sort_order: 0,
      };
      setSubmitting(true);
      let res;
      if (isEdit) {
        const meetingId =
          route?.params?.meetingId || meetingParam?.meeting_id || meetingParam?.id;
        res = await updateMeeting(meetingId, payload);
      } else {
        res = await createMeeting(payload);
      }
      if (res?.success) {
        Toast.show({
          type: 'success',
          text1: isEdit ? 'Meeting updated successfully' : 'Meeting scheduled successfully',
          position: 'bottom',
          visibilityTime: 1500,
        });
        setTimeout(() => {
          navigation.navigate('Tabs', { screen: 'Home' });
        }, 800);
      } else {
        Toast.show({
          type: 'error',
          text1: res?.error || (isEdit ? 'Failed to update meeting' : 'Failed to create meeting'),
          position: 'bottom',
          visibilityTime: 2000,
        });
        setSubmitting(false);
      }
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: e?.message || (isEdit ? 'Failed to update meeting' : 'Failed to create meeting'),
        position: 'bottom',
        visibilityTime: 2000,
      });
      setSubmitting(false);
    }
  };

  const onBack = () => {
    if (step > 1) setStep(step - 1);
    else navigation.goBack();
  };

  // Footer button labels & icons
  const backLabel = step === 1 ? 'Cancel' : 'Back';
  const BackIcon = step === 1 ? X : ChevronLeft;
  const nextLabel = step === 3
    ? isEdit
      ? 'Update Meeting'
      : 'Create Meeting'
    : 'Next';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <MeetingStepper currentStep={step} />

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && <MeetingDetailsForm value={details} onChange={setDetails} />}
        {step === 2 && (
          <MeetingParticipants
            value={participants}
            onChange={setParticipants}
            scope={details.scope}
          />
        )}
        {step === 3 && <MeetingAgenda value={agenda} onChange={setAgenda} />}
      </ScrollView>

      {/* ──────── Footer ──────── */}
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.background,
        }}
      >
        {/* Cancel / Back */}
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
            opacity: submitting ? 0.5 : 1,
          }}
        >
          <BackIcon size={16} color={theme.colors.textSecondary} strokeWidth={2} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text }}>
            {backLabel}
          </Text>
        </TouchableOpacity>

        {/* Next / Create / Update */}
        <TouchableOpacity
          onPress={onNext}
          disabled={!canNext() || submitting}
          activeOpacity={submitting ? 1 : 0.8}
          style={{
            flex: 1.5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 16,
            borderRadius: 14,
            backgroundColor: theme.colors.primary,
            opacity: !canNext() || submitting ? 0.5 : 1,
            shadowColor: theme.colors.primary,
            shadowOpacity: !canNext() || submitting ? 0 : 0.3,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: !canNext() || submitting ? 0 : 6,
          }}
        >
          {submitting && step === 3 ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: '#FFFFFF',
                  letterSpacing: 0.2,
                  marginLeft: 4,
                }}
              >
                {isEdit ? 'Updating...' : 'Scheduling...'}
              </Text>
            </>
          ) : (
            <>
              {step === 3 ? (
                <Video size={18} color="#FFFFFF" strokeWidth={2} />
              ) : (
                <ChevronRight size={18} color="#FFFFFF" strokeWidth={2} />
              )}
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: '#FFFFFF',
                  letterSpacing: 0.2,
                }}
              >
                {nextLabel}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
