import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../../Themes/Themes';
import { getMeeting } from '../../Services/Meeting/MeetingsService';

const fmtDate = (iso) => {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return { date, time };
  } catch { return { date: '', time: '' }; }
};

const durationMins = (startISO, endISO) => {
  try {
    const s = new Date(startISO).getTime();
    const e = new Date(endISO).getTime();
    const mins = Math.max(0, Math.round((e - s) / 60000));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  } catch { return ''; }
};

export default function MeetingDetail({ route, navigation }) {
  const meetingId = route?.params?.meetingId || route?.params?.meeting?.meeting_id || route?.params?.meeting?.id;
  const meetingParam = route?.params?.meeting || null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meeting, setMeeting] = useState(meetingParam || null);

  const loadMeeting = async () => {
    try {
      setError('');
      setLoading(true);
      const id = meetingId;
      if (!id) {
        if (meetingParam) {
          setMeeting(meetingParam);
          return;
        }
        throw new Error('Missing meeting id');
      }
      const res = await getMeeting(id);
      if (res?.success) {
        setMeeting(res.meeting);
      } else {
        if (meetingParam) {
          setMeeting(meetingParam);
          setError('');
        } else {
          throw new Error(res?.error || 'Failed to fetch meeting');
        }
      }
    } catch (e) {
      setError(e?.message || 'Failed to load meeting');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeeting();
  }, [meetingId]);

  const parts = useMemo(() => {
    const arr = Array.isArray(meeting?.participants) ? meeting.participants : [];
    return arr.map(p => typeof p === 'object' ? (p.full_name || p.name || p.username || p.email || p.user_id || p.id) : String(p));
  }, [meeting]);

  const agendaItems = useMemo(() => Array.isArray(meeting?.agenda_items) ? meeting.agenda_items : [], [meeting]);

  const { date: startDate, time: startTime } = fmtDate(meeting?.start_time);
  const { date: endDate, time: endTime } = fmtDate(meeting?.end_time);
  const totalDur = durationMins(meeting?.start_time, meeting?.end_time);

  const openUrl = async (url) => {
    try {
      if (!url) return;
      const safe = String(url).startsWith('http') ? url : `https://${url}`;
      await Linking.openURL(safe);
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.appbar}>
        <TouchableOpacity style={styles.appbarBack} onPress={() => navigation.goBack()}>
          <ChevronLeft size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>Meeting Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        ) : (!meeting && error) ? (
          <View style={styles.center}>
            <Text style={styles.error}>{error}</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.primaryBtn} onPress={loadMeeting}>
                <Text style={styles.primaryBtnText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.secondaryBtnText}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={[styles.card, styles.primaryCard]}>
              <Text style={styles.title}>{meeting?.title || 'Meeting'}</Text>
              {!!meeting?.description && (
                <Text style={styles.desc}>{meeting.description}</Text>
              )}
              <View style={styles.chipsRow}>
                {!!meeting?.meeting_type && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{String(meeting.meeting_type)}</Text>
                  </View>
                )}
                {!!meeting?.meeting_scope && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{String(meeting.meeting_scope)}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Date & Time</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Start:</Text>
                <Text style={styles.value}>{startDate} • {startTime}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>End:</Text>
                <Text style={styles.value}>{endDate} • {endTime}</Text>
              </View>
              {!!totalDur && (
                <View style={styles.row}>
                  <Text style={styles.label}>Duration:</Text>
                  <Text style={styles.value}>{totalDur}</Text>
                </View>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Location Details</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Type:</Text>
                <Text style={styles.value}>{meeting?.meeting_type || '-'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Scope:</Text>
                <Text style={styles.value}>{meeting?.meeting_scope || '-'}</Text>
              </View>
              {!!meeting?.location && (
                <View style={styles.row}>
                  <Text style={styles.label}>Location:</Text>
                  <Text style={styles.value}>{meeting.location}</Text>
                </View>
              )}
              {!!meeting?.meeting_url && (
                <TouchableOpacity style={styles.row} onPress={() => openUrl(meeting.meeting_url)}>
                  <Text style={styles.label}>URL:</Text>
                  <Text style={[styles.value, { color: theme.colors.primary }]} numberOfLines={1}>
                    {meeting.meeting_url}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Participants</Text>
              {parts.length > 0 ? (
                parts.map((p, idx) => (
                  <Text key={`${p}-${idx}`} style={styles.participant}>
                    • {p}
                  </Text>
                ))
              ) : (
                <Text style={styles.muted}>No participants</Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Agenda</Text>
              {agendaItems.length > 0 ? (
                agendaItems.map((it, idx) => (
                  <View key={idx} style={styles.agendaItem}>
                    <Text style={styles.agendaTitle}>{idx + 1}. {it?.title || 'Untitled'}</Text>
                    {!!it?.description && (
                      <Text style={styles.muted}>{it.description}</Text>
                    )}
                    {!!it?.duration && (
                      <Text style={styles.muted}>Duration: {it.duration} min</Text>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.muted}>No agenda items</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.secondaryBtnWide} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryBtnText}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  appbarBack: {
    width: 40,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  appbarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  container: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  error: {
    color: theme.colors.primary,
    fontSize: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryCard: {
    backgroundColor: theme.colors.background,
    borderWidth: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  desc: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    width: 100,
  },
  value: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  participant: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  agendaItem: {
    marginBottom: theme.spacing.sm,
  },
  agendaTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  muted: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: theme.spacing.sm,
    color: theme.colors.primary,
  },
  chip: {
    backgroundColor: theme.colors.muted100,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 12,
  },
  bottomBar: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: theme.spacing.md,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
  },
  primaryBtnText: {
    color: theme.colors.background,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
  },
  secondaryBtnWide: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: theme.radius.md,
  },
  secondaryBtnText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
});