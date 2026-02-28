import { ChevronLeft, Calendar, Clock, MapPin, Users, Target, Info } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../Themes/ThemeContext';
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
  const { theme } = useTheme();
  const styles = useMemo(() => stylesFactory(theme), [theme]);
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
    } catch { }
  };

  return (
    <View style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
        translucent={false}
      />

      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={{ backgroundColor: theme.colors.primary }}
      >
        <View style={styles.appbar}>
          <TouchableOpacity style={styles.appbarBack} onPress={() => navigation.goBack()}>
            <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.appbarTitle}>Meeting Details</Text>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>Overview</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

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
    </View>
  );
}

const stylesFactory = (theme) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 22,
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  appbarBack: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  appbarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  container: {
    padding: 18,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  error: {
    color: theme.colors.primary,
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryCard: {
    borderWidth: 0,
    backgroundColor: theme.colors.card,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  desc: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    width: 80,
  },
  value: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '600',
    flex: 1,
  },
  participant: {
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  agendaItem: {
    marginBottom: 16,
    paddingLeft: 4,
  },
  agendaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  muted: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    backgroundColor: `${theme.colors.primary}12`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  bottomBar: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  secondaryBtnWide: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 16,
  },
  secondaryBtnText: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
    fontSize: 15,
  },
});