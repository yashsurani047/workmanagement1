import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../../Themes/Themes';
import EventStepper from '../../Components/Event/EventStepper';
import EventDetailsForm from '../../Components/Event/EventDetailsForm';
import EventParticipants from '../../Components/Event/EventParticipants';
import EventSettings from '../../Components/Event/EventSettings';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function CreateEvent({ navigation }) {
  const route = useRoute();
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState({ title: '', type: 'internal', allDay: false, startDate: null, endDate: null, startTime: null, endTime: null, location: '', description: '' });
  const [participants, setParticipants] = useState({ members: [] });
  const [settings, setSettings] = useState({ notifications: 'none', visibility: 'default', guestsAllowed: true });
  const [submitting, setSubmitting] = useState(false);
  const [eventId, setEventId] = useState(null);

  const resolveOrganizationId = async (ev) => {
    try {
      const userInfoRaw = await AsyncStorage.getItem('userInfo');
      const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
      const cands = [
        await AsyncStorage.getItem('organization_id'),
        await AsyncStorage.getItem('selectedOrganizationId'),
        await AsyncStorage.getItem('orgId'),
        userInfo?.organization_id,
        ev?.organization_id,
      ];
      const firstValid = cands.find(x => {
        const s = String(x ?? '').trim().toLowerCase();
        return !!s && s !== 'null' && s !== 'undefined';
      });
      if (firstValid) return String(firstValid);
      await AsyncStorage.setItem('organization_id', 'one');
      return 'one';
    } catch {
      try { await AsyncStorage.setItem('organization_id', 'one'); } catch { }
      return 'one';
    }
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const ev = route?.params?.event;
        if (!ev) return;
        const id = ev?.event_id || ev?.id;
        const full = ev;
        const s = full?.start_time || full?.start_date || null;
        const e = full?.end_time || full?.end_date || null;
        const sd = s ? new Date(s) : null;
        const ed = e ? new Date(e) : null;

        if (!mounted) return;
        setEventId(id || null);
        setDetails({
          title: full?.title || '',
          type: full?.event_type || full?.type || 'internal',
          allDay: false,
          startDate: sd ? new Date(sd.getFullYear(), sd.getMonth(), sd.getDate()) : null,
          endDate: ed ? new Date(ed.getFullYear(), ed.getMonth(), ed.getDate()) : null,
          startTime: sd,
          endTime: ed,
          location: full?.location || '',
          description: full?.description || '',
        });
      } catch { }
    };
    init();
    return () => { mounted = false; };
  }, [route?.params]);

  const canNext = () => true;

  const toIsoDate = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const toIsoTime = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    const hh = String(dt.getHours()).padStart(2, '0');
    const mi = String(dt.getMinutes()).padStart(2, '0');
    return `${hh}:${mi}:00`;
  };

  const toIsoDateTime = (dateObj, timeObj) => {
    const datePart = toIsoDate(dateObj);
    if (!datePart) return null;
    if (!timeObj) return null;
    const timePart = toIsoTime(timeObj);
    if (!timePart) return null;
    return `${datePart}T${timePart}`;
  };

  const mapNotificationToMinutes = (val) => {
    switch (val) {
      case '5m': return 5;
      case '10m': return 10;
      case '15m': return 15;
      case '30m': return 30;
      case '1h': return 60;
      case '1d': return 1440;
      default: return 0;
    }
  };

  const getExistingGuests = async (eventId) => {
    try {
      const detailsResp = await getEventDetails(eventId);
      const ev = detailsResp?.event || detailsResp?.data || detailsResp || {};
      const guests = Array.isArray(ev.internal_guests)
        ? ev.internal_guests.map((p) => String(p?.user_id || p?.id)).filter(Boolean)
        : [];
      console.log('Existing internal guests from server:', JSON.stringify(guests, null, 2));
      return guests;
    } catch (e) {
      console.warn('Failed to fetch existing guests:', e?.message || e);
      return [];
    }
  };

  const onSubmit = async () => {
    setSubmitting(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1000));
    setSubmitting(false);
    Toast.show({ type: 'success', text1: eventId ? 'Event updated (Mock)' : 'Event created (Mock)', position: 'bottom' });
    navigation.popToTop();
  };

  const onSaveParticipants = async () => {
    setSubmitting(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 600));
    setSubmitting(false);
    Toast.show({ type: 'success', text1: 'Participants saved (Mock)', position: 'bottom' });
    setStep(3);
  };

  const onBack = () => {
    if (step === 1) {
      navigation.goBack();
    } else {
      setStep(step - 1);
    }
  };

  const onNext = () => {
    if (step === 1) {
      if (!details.title || !details.startDate || !details.endDate || (!details.allDay && (!details.startTime || !details.endTime))) {
        Toast.show({ type: 'error', text1: 'Validation', text2: 'Please fill all required fields', position: 'bottom' });
        return;
      }
      setStep(2);
      return;
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      onSubmit();
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <EventStepper currentStep={step} />
      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 && <EventDetailsForm value={details} onChange={setDetails} />}
        {step === 2 && (
          <EventParticipants
            value={participants}
            onChange={setParticipants}
            type={details.type === 'external' ? 'external' : 'internal'}
          />
        )}
        {step === 3 && <EventSettings value={settings} onChange={setSettings} />}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onBack}>
          <Text style={styles.secondaryText}>{step === 1 ? 'Cancel' : 'Back'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, (!canNext() || submitting) && styles.disabled, submitting && styles.primaryBtnLoading]}
          disabled={!canNext() || submitting}
          onPress={step === 2 ? onSaveParticipants : onNext}
        >
          {submitting ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator size="small" color={theme.colors.background} />
              <Text style={[styles.primaryText, { marginLeft: 8 }]}>
                {step === 2 ? 'Saving...' : eventId ? 'Updating...' : 'Creating...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.primaryText}>
              {step === 2 ? 'Save & Next' : step === 3 ? (eventId ? 'Update Event' : 'Create Event') : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  secondaryBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  secondaryText: { color: theme.colors.text, fontSize: 16 },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  primaryText: { color: theme.colors.background, fontWeight: '700' },
  disabled: { opacity: 0.6 },
  primaryBtnLoading: { opacity: 0.9 },
  loaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});