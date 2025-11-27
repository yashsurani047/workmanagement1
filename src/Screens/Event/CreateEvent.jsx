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
import { createUpdateEvent, getEventDetails } from '../../Services/Event/EventServices';
import { useRoute, useNavigation } from '@react-navigation/native';
import { fetchEventParticipants } from '../../Services/Event/EventParticipantsService';

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
      try { await AsyncStorage.setItem('organization_id', 'one'); } catch {}
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
        let full = ev;
        try {
          if (id) {
            const dt = await getEventDetails(id);
            full = dt?.event || dt?.data || dt || ev;
          }
        } catch {}
        const s = full?.start_time || full?.start_date || null;
        const e = full?.end_time || full?.end_date || null;
        const sd = s ? new Date(s) : null;
        const ed = e ? new Date(e) : null;
        const isAllDay = (() => {
          try {
            if (!sd || !ed) return false;
            const startTimeStr = `${String(sd.getHours()).padStart(2,'0')}:${String(sd.getMinutes()).padStart(2,'0')}`;
            const endTimeStr = `${String(ed.getHours()).padStart(2,'0')}:${String(ed.getMinutes()).padStart(2,'0')}`;
            return startTimeStr === '00:00' && (endTimeStr === '23:59' || endTimeStr === '23:59');
          } catch { return false; }
        })();

        if (!mounted) return;
        setEventId(id || null);
        setDetails({
          title: full?.title || '',
          type: full?.event_type || full?.type || 'internal',
          allDay: isAllDay,
          startDate: sd ? new Date(sd.getFullYear(), sd.getMonth(), sd.getDate()) : null,
          endDate: ed ? new Date(ed.getFullYear(), ed.getMonth(), ed.getDate()) : null,
          startTime: isAllDay ? null : sd,
          endTime: isAllDay ? null : ed,
          location: full?.location || '',
          description: full?.description || '',
        });
        const memberIds = Array.isArray(full?.internal_guests)
          ? full.internal_guests.map((p) => String(p?.user_id || p?.id)).filter(Boolean)
          : Array.isArray(full?.participants)
          ? full.participants.map((p) => String(typeof p === 'object' ? (p.user_id || p.id) : p)).filter(Boolean)
          : [];
        setParticipants({ members: memberIds });
        const ext = Array.isArray(full?.external_contacts)
          ? full.external_contacts.map((c) => ({ name: c?.name || '', email: c?.email || '', phone: c?.phone || '' }))
          : Array.isArray(full?.external) ? full.external : [];
        if (ext.length) setParticipants((prev) => ({ ...prev, external: ext }));
        const notif = typeof full?.notification_minutes === 'number' ? full.notification_minutes : 0;
        const notifMap = { 0: 'none', 5: '5m', 10: '10m', 15: '15m', 30: '30m', 60: '1h', 1440: '1d' };
        setSettings({
          notifications: notifMap[notif] || 'none',
          visibility: full?.visibility || 'default',
          guestsAllowed: !!(full?.guests_allowed ?? true),
        });
      } catch {}
    };
    init();
    return () => { mounted = false; };
  }, [route?.params]);

  const canNext = () => {
    if (step === 1) return !!details.title && !!details.startDate && !!details.endDate && (details.allDay || (details.startTime && details.endTime));
    return true;
  };

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
    try {
      setSubmitting(true);
      const organization_id = await resolveOrganizationId(route?.params?.event);
      const userInfoRaw = await AsyncStorage.getItem('userInfo');
      const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
      const user_id = userInfo?.user_id || (await AsyncStorage.getItem('user_id')) || null;

      const isExternal = details.type === 'external';
      const memberIds = Array.isArray(participants.members)
        ? participants.members.map((id) => String(id))
        : [];
      let validSet = null;
      try {
        const res = await fetchEventParticipants();
        const users = Array.isArray(res?.users) ? res.users : [];
        validSet = new Set(users.map(u => String(u.id)));
        console.log('Valid user IDs from fetchEventParticipants:', JSON.stringify(Array.from(validSet), null, 2));
      } catch (e) {
        console.warn('Failed to fetch valid users for validation:', e?.message || e);
      }
      let memberIdsOut = (validSet && validSet.size > 0)
        ? memberIds.filter(id => validSet.has(String(id))).map(id => String(id))
        : memberIds.map(id => String(id));
      console.log('Selected memberIds from EventParticipants (submit):', JSON.stringify(memberIds, null, 2));
      console.log('Filtered valid memberIds to send (submit):', JSON.stringify(memberIdsOut, null, 2));

      // Preserve existing internal guests for updates
      let existingGuests = [];
      if (eventId) {
        existingGuests = await getExistingGuests(eventId);
        if (!Array.isArray(existingGuests) || existingGuests.length === 0) {
          try {
            const fallback = Array.isArray(route?.params?.event?.internal_guests)
              ? route.params.event.internal_guests.map((p) => String(p?.user_id || p?.id)).filter(Boolean)
              : [];
            if (fallback.length > 0) existingGuests = fallback;
          } catch {}
        }
      }
      // Merge existing guests with new selections, avoiding duplicates
      const mergedGuests = [...new Set([...existingGuests, ...memberIdsOut])];
      memberIdsOut = mergedGuests;
      console.log('Merged internal guests (including existing):', JSON.stringify(memberIdsOut, null, 2));

      const extContacts = Array.isArray(participants?.external) ? participants.external : [];

      const payload = {
        title: details.title,
        description: details.description || '',
        location: details.location || '',
        all_day: !!details.allDay,
        start_time: details.allDay
          ? `${toIsoDate(details.startDate)}T00:00:00`
          : toIsoDateTime(details.startDate, details.startTime),
        end_time: details.allDay
          ? `${toIsoDate(details.endDate)}T23:59:00`
          : toIsoDateTime(details.endDate, details.endTime),
        start_date: details.allDay
          ? `${toIsoDate(details.startDate)}T00:00:00`
          : toIsoDateTime(details.startDate, details.startTime),
        end_date: details.allDay
          ? `${toIsoDate(details.endDate)}T23:59:00`
          : toIsoDateTime(details.endDate, details.endTime),
        ...(isExternal ? {} : (memberIdsOut.length > 0 ? { internal_guest_ids: memberIdsOut.map(String) } : {})),
        external_contacts: isExternal ? extContacts : [],
        event_type: details.type || 'internal',
        notification_minutes: mapNotificationToMinutes(settings.notifications),
        visibility: settings.visibility || 'default',
        guests_allowed: !!settings.guestsAllowed,
        organization_id,
        user_id: String(user_id),
        ...(eventId ? { event_id: eventId } : {}),
      };

      console.log('Event payload (submit):', JSON.stringify(payload, null, 2));
      const res = await createUpdateEvent(payload);
      console.log('createUpdateEvent response (submit):', JSON.stringify(res, null, 2));
      if (res && (res.success !== false)) {
        const msg = eventId ? 'Event updated' : 'Event created';
        Toast.show({ type: 'custom_success', text1: msg, position: 'bottom', visibilityTime: 1500 });
        try {
          const newEventId = eventId || res?.event_id || res?.id || res?.data?.event_id;
          if (newEventId) {
            const isExternal = details.type === 'external';
            const shouldVerify = !isExternal && (memberIdsOut?.length || 0) > 0;
            if (shouldVerify) {
              let detailsResp = null;
              let lastErr = null;
              for (let i = 0; i < 3; i++) {
                try {
                  detailsResp = await getEventDetails(newEventId);
                  break;
                } catch (err) {
                  lastErr = err;
                  const st = err?.response?.status;
                  if (st === 500) {
                    await sleep(500 + i * 300);
                    continue;
                  }
                  break;
                }
              }
              if (detailsResp) {
                const ev = detailsResp?.event || detailsResp?.data || detailsResp || {};
                const guests = Array.isArray(ev.internal_guests) ? ev.internal_guests : [];
                console.log('Post-save event details participants check:', {
                  internal_guests_count: guests.length,
                  internal_guests: JSON.stringify(guests, null, 2),
                });
                if (guests.length === 0 && memberIdsOut.length > 0) {
                  console.log('Attempting fallback participant update (submit)...');
                  const fbPayload = {
                    event_id: newEventId,
                    ...(memberIdsOut.length > 0 ? { internal_guest_ids: memberIdsOut.map(String) } : {}),
                    organization_id,
                    user_id: String(user_id),
                  };
                  console.log('Fallback payload (submit):', JSON.stringify(fbPayload, null, 2));
                  const fbRes = await createUpdateEvent(fbPayload);
                  console.log('Fallback createUpdateEvent response (submit):', JSON.stringify(fbRes, null, 2));
                  const verify2 = await getEventDetails(newEventId);
                  const ev2 = verify2?.event || verify2?.data || verify2 || {};
                  const guests2 = Array.isArray(ev2.internal_guests) ? ev2.internal_guests : [];
                  console.log('Fallback verification (submit):', {
                    internal_guests_count: guests2.length,
                    internal_guests: JSON.stringify(guests2, null, 2),
                  });
                  if (guests2.length === 0) {
                    Toast.show({
                      type: 'custom_error',
                      text1: 'No participants saved on server',
                      position: 'bottom',
                      visibilityTime: 1600,
                    });
                  }
                }
              } else if (lastErr) {
                console.warn('Post-save verification failed:', lastErr?.message || lastErr);
              }
            }
          }
        } catch (e) {
          const st = e?.response?.status;
          if (st === 500) {
            console.log('Post-save verification skipped due to 500');
          } else {
            console.warn('Post-save verification failed:', e?.message || e);
          }
        }
        try {
          navigation.popToTop();
        } catch {}
      } else {
        const msg = (res && (res.message || res.error)) || res;
        console.error('Create event failed:', typeof msg === 'object' ? JSON.stringify(msg) : msg);
        Toast.show({
          type: 'custom_error',
          text1: msg?.message || 'Failed to create/update event',
          position: 'bottom',
          visibilityTime: 2000,
        });
      }
    } catch (e) {
      const resp = e?.response;
      const info = {
        status: resp?.status,
        url: resp?.config?.url,
        method: resp?.config?.method,
        data: resp?.data,
        message: e?.message,
      };
      console.error('Create event exception:', JSON.stringify(info, null, 2));
      Toast.show({
        type: 'custom_error',
        text1: e?.message || 'Failed to create/update event',
        position: 'bottom',
        visibilityTime: 2000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onSaveParticipants = async () => {
    try {
      setSubmitting(true);
      const organization_id = await resolveOrganizationId(route?.params?.event);
      const userInfoRaw = await AsyncStorage.getItem('userInfo');
      const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
      const user_id = userInfo?.user_id || (await AsyncStorage.getItem('user_id')) || null;

      const isExternal = details.type === 'external';
      const memberIds = Array.isArray(participants.members)
        ? participants.members.map((id) => String(id))
        : [];
      let validSet = null;
      try {
        const res = await fetchEventParticipants();
        const users = Array.isArray(res?.users) ? res.users : [];
        validSet = new Set(users.map(u => String(u.id)));
        console.log('Valid user IDs from fetchEventParticipants (participants step):', JSON.stringify(Array.from(validSet), null, 2));
      } catch (e) {
        console.warn('Failed to fetch valid users for validation (participants step):', e?.message || e);
      }
      let memberIdsOut = (validSet && validSet.size > 0)
        ? memberIds.filter(id => validSet.has(String(id))).map(id => String(id))
        : memberIds.map(id => String(id));
      console.log('Selected memberIds from EventParticipants (participants step):', JSON.stringify(memberIds, null, 2));
      console.log('Filtered valid memberIds to send (participants step):', JSON.stringify(memberIdsOut, null, 2));

      // Preserve existing internal guests for updates
      let existingGuests = [];
      if (eventId) {
        existingGuests = await getExistingGuests(eventId);
        // Merge existing guests with new selections, avoiding duplicates
        const mergedGuests = [...new Set([...existingGuests, ...memberIdsOut])];
        memberIdsOut = mergedGuests;
        console.log('Merged internal guests (including existing, participants step):', JSON.stringify(memberIdsOut, null, 2));
      }

      const extContacts = Array.isArray(participants?.external) ? participants.external : [];

      const payload = {
        title: details.title,
        description: details.description || '',
        location: details.location || '',
        all_day: !!details.allDay,
        start_time: details.allDay
          ? `${toIsoDate(details.startDate)}T00:00:00`
          : toIsoDateTime(details.startDate, details.startTime),
        end_time: details.allDay
          ? `${toIsoDate(details.endDate)}T23:59:00`
          : toIsoDateTime(details.endDate, details.endTime),
        start_date: details.allDay
          ? `${toIsoDate(details.startDate)}T00:00:00`
          : toIsoDateTime(details.startDate, details.startTime),
        end_date: details.allDay
          ? `${toIsoDate(details.endDate)}T23:59:00`
          : toIsoDateTime(details.endDate, details.endTime),
        ...(isExternal ? {} : {
          participants: memberIdsOut,
          internal_guest_ids: memberIdsOut, // Try alternative field name
          internal_guests: memberIdsOut.map(id => ({ user_id: id })), // Try object format
        }),
        external_contacts: isExternal ? extContacts : [],
        event_type: details.type || 'internal',
        notification_minutes: mapNotificationToMinutes(settings.notifications),
        visibility: settings.visibility || 'default',
        guests_allowed: !!settings.guestsAllowed,
        organization_id,
        user_id: String(user_id),
        ...(eventId ? { event_id: eventId } : {}),
      };

      console.log('Event payload (participants step):', JSON.stringify(payload, null, 2));
      const res = await createUpdateEvent(payload);
      console.log('createUpdateEvent response (participants step):', JSON.stringify(res, null, 2));
      const newId = res?.event_id || res?.id || res?.data?.event_id || null;
      if (!eventId && newId) setEventId(newId);
      try {
        const checkId = eventId || newId;
        const shouldVerify = !isExternal && (memberIdsOut?.length || 0) > 0;
        if (checkId && shouldVerify) {
          let detailsResp = null;
          let lastErr = null;
          for (let i = 0; i < 2; i++) {
            try {
              detailsResp = await getEventDetails(checkId);
              break;
            } catch (err) {
              lastErr = err;
              const st = err?.response?.status;
              if (st === 500) {
                await sleep(400 + i * 300);
                continue;
              }
              break;
            }
          }
          const ev = detailsResp?.event || detailsResp?.data || detailsResp || {};
          const guests = Array.isArray(ev.internal_guests) ? ev.internal_guests : [];
          console.log('Participants step save verification:', {
            internal_guests_count: guests.length,
            internal_guests: JSON.stringify(guests, null, 2),
          });
          if (guests.length === 0 && memberIdsOut.length > 0) {
            console.log('Attempting fallback participant update (participants step)...');
            const fbPayload = {
              event_id: checkId,
              ...(memberIdsOut.length > 0 ? { internal_guest_ids: memberIdsOut.map(String) } : {}),
              organization_id,
              user_id: String(user_id),
            };
            console.log('Fallback payload (participants step):', JSON.stringify(fbPayload, null, 2));
            const fbRes = await createUpdateEvent(fbPayload);
            console.log('Fallback createUpdateEvent response (participants step):', JSON.stringify(fbRes, null, 2));
            const verify2 = await getEventDetails(checkId);
            const ev2 = verify2?.event || verify2?.data || verify2 || {};
            const guests2 = Array.isArray(ev2.internal_guests) ? ev2.internal_guests : [];
            console.log('Fallback verification (participants step):', {
              internal_guests_count: guests2.length,
              internal_guests: JSON.stringify(guests2, null, 2),
            });
            if (guests2.length === 0) {
              Toast.show({
                type: 'custom_error',
                text1: 'No participants saved on server',
                position: 'bottom',
                visibilityTime: 1600,
              });
            }
          }
        }
      } catch (e) {
        const status = e?.response?.status;
        if (status === 500) {
          console.log('Participants step verification skipped due to 500');
        } else {
          console.warn('Participants step verification failed:', e?.message || e);
        }
      }
      Toast.show({
        type: 'custom_success',
        text1: 'Participants saved',
        position: 'bottom',
        visibilityTime: 1200,
      });
      setStep(3);
    } catch (e) {
      const resp = e?.response;
      const info = {
        status: resp?.status,
        url: resp?.config?.url,
        method: resp?.config?.method,
        data: resp?.data,
        message: e?.message,
      };
      console.error('Save participants failed:', JSON.stringify(info, null, 2));
      Toast.show({
        type: 'custom_error',
        text1: e?.message || 'Failed to save participants',
        position: 'bottom',
        visibilityTime: 1600,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onBack = () => {
    if (step === 1) {
      navigation.goBack();
    } else {
      setStep(step - 1);
    }
  };

  const onNext = () => {
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