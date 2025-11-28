import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  Alert,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import theme from '../../Themes/Themes';
import { Plus, MoreVertical, Calendar, Edit3, Trash2, X, Filter } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { deleteMeeting as deleteMeetingApi } from '../../Services/Meeting/MeetingsService';

const API_BASE_URL = 'https://taboodi.com/api/';

// --- Format helpers ---
const formatDateISO = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// --- Shimmer header used during pull-to-refresh ---
const ShimmerHeader = () => {
  const shimmer = new Animated.Value(0);
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const bg = shimmer.interpolate({ inputRange: [0, 1], outputRange: [theme.colors.muted100, theme.colors.muted200] });
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
      <Animated.View style={{ height: 14, width: '30%', borderRadius: 6, backgroundColor: bg, marginBottom: 8 }} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Animated.View style={{ height: 10, width: 80, borderRadius: 999, backgroundColor: bg }} />
        <Animated.View style={{ height: 10, width: 60, borderRadius: 999, backgroundColor: bg }} />
        <Animated.View style={{ height: 10, width: 100, borderRadius: 999, backgroundColor: bg }} />
      </View>
    </View>
  );
};

const timeRange = (startISO, endISO) => {
  try {
    const s = new Date(startISO);
    const e = new Date(endISO);
    const fmt = (dt) => {
      let h = dt.getHours();
      const m = String(dt.getMinutes()).padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h === 0) h = 12;
      return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
    };
    return `${fmt(s)} - ${fmt(e)}`;
  } catch {
    return '';
  }
};

// --- Shimmer loader ---
const ShimmerCard = () => {
  const shimmer = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const bg = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.muted100, theme.colors.muted200],
  });

  return (
    <View style={[styles.card, styles.shadow, { flexDirection: 'row' }]}>
      <View style={[styles.leftStripe, { backgroundColor: theme.colors.muted200 }]} />
      <View style={styles.body}>
        <Animated.View style={{ height: 18, width: '60%', borderRadius: 6, backgroundColor: bg }} />
        <Animated.View style={{ height: 12, width: '50%', borderRadius: 6, backgroundColor: bg, marginTop: 8 }} />
        <Animated.View style={{ height: 10, width: '40%', borderRadius: 6, backgroundColor: bg, marginTop: 6 }} />
        <View style={styles.rowBetween}>
          <Animated.View style={{ height: 20, width: 70, borderRadius: 12, backgroundColor: bg }} />
          <Animated.View style={{ height: 20, width: 70, borderRadius: 12, backgroundColor: bg }} />
        </View>
      </View>
    </View>
  );
};

// --- Meeting Color Logic ---
const meetingColors = [
  theme.colors.meeting,
  theme.colors.event,
  theme.colors.timesheet,
  theme.colors.ticket,
  theme.colors.task,
  theme.colors.project,
];

const getMeetingStripeColor = (meeting, index) => {
  const type = String(meeting?.meeting_type || '').toLowerCase();
  const scope = String(meeting?.meeting_scope || '').toLowerCase();

  if (type.includes('planning')) return theme.colors.project;
  if (type.includes('review')) return theme.colors.event;
  if (type.includes('standup')) return theme.colors.task;
  if (type.includes('retro')) return theme.colors.timesheet;

  if (scope === 'client') return theme.colors.meeting;
  if (scope === 'internal') return theme.colors.ticket;

  // Cycle through theme palette if no specific match
  return meetingColors[index % meetingColors.length];
};

// --- Meeting Card ---
const MeetingCard = ({ meeting, index, onMenu, onPress }) => {
  const title = meeting?.title || 'Untitled Meeting';
  const descr = meeting?.description || '';
  const when = timeRange(meeting?.start_time, meeting?.end_time);
  const type = meeting?.meeting_type || '';
  const scope = meeting?.meeting_scope || '';
  const stripeColor = getMeetingStripeColor(meeting, index);

  let dateStr = '';
  try {
    const d = new Date(meeting?.start_time);
    const opts = { weekday: 'short', month: 'short', day: 'numeric' };
    dateStr = d.toLocaleDateString(undefined, opts);
  } catch {}

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.card, styles.shadow, { flexDirection: 'row' }]}>
      <View style={[styles.leftStripe, { backgroundColor: stripeColor }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.rightTopRow}>
            {!!type && (
              <View style={[styles.statusSoft, { backgroundColor: `${stripeColor}20` }]}>
                <Text style={[styles.statusSoftText, { color: stripeColor }]}>{type}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.itemIconBtn} onPress={onMenu}>
              <MoreVertical size={18} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {!!descr && <Text style={styles.desc} numberOfLines={2}>{descr}</Text>}

        <View style={styles.metaRow}>
          {!!dateStr && (
            <View style={[styles.dateChip, { backgroundColor: `${stripeColor}15`, borderColor: `${stripeColor}40` }]}>
              <Calendar size={12} color={stripeColor} />
              <Text style={[styles.dateChipText, { color: stripeColor }]}>{dateStr}</Text>
            </View>
          )}
          {!!when && <Text style={styles.meta}>{when}</Text>}
        </View>

        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }} />
          {!!scope && (
            <View style={[styles.pill, { backgroundColor: `${stripeColor}15` }]}>
              <Text style={[styles.pillText, { color: stripeColor }]}>{scope}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// --- Main Screen ---
export default function MeetingDetailsList(props) {
  const navigation = useNavigation();
  const route = useRoute();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuMeeting, setMenuMeeting] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');

  const [selectedDate, setSelectedDate] = useState(() => {
    const p = route?.params?.start_date;
    if (p) return p;
    return formatDateISO(new Date());
  });

  const load = useCallback(async (opts = { silent: false }) => {
    try {
      setError('');
      if (!opts?.silent) setLoading(true);
      const userInfoRaw = await AsyncStorage.getItem('userInfo');
      const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
      const organizationId =
        route?.params?.organizationId ||
        (await AsyncStorage.getItem('organization_id')) ||
        userInfo?.organization_id ||
        'one';
      const username =
        route?.params?.username ||
        (await AsyncStorage.getItem('username')) ||
        userInfo?.user_name ||
        userInfo?.username ||
        '';
      const startDate = selectedDate;

      const url = `${API_BASE_URL}organizations/${organizationId}/users/${username}/meetings/?start_date=${startDate}`;
      const response = await fetch(url);
      const raw = await response.text();
      const contentType = response.headers.get('content-type') || '';
      let data = null;

      try {
        if (contentType.includes('application/json') && raw && raw.trim().length > 0) {
          data = JSON.parse(raw);
        }
      } catch (_) {}

      if (!response.ok) {
        const msg = data?.message || data?.error || raw || `Failed to fetch meetings (HTTP ${response.status})`;
        throw new Error(msg);
      }

      const meetings = Array.isArray(data?.meetings) ? data.meetings : [];
      setList(meetings);
    } catch (e) {
      setError(e?.message || 'Failed to load meetings');
      setList([]);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [route?.params, selectedDate]);

  useEffect(() => {
    if (!Array.isArray(props?.items)) {
      load();
    } else {
      setLoading(false);
      setError('');
    }
  }, [load, props?.items]);

  useFocusEffect(
    React.useCallback(() => {
      if (Array.isArray(props?.items)) return undefined;
      const intervalId = setInterval(() => {
        load({ silent: true });
      }, 1000);
      return () => clearInterval(intervalId);
    }, [load, props?.items])
  );

  const openMenu = (meeting) => { setMenuMeeting(meeting); setMenuVisible(true); };
  const closeMenu = () => { setMenuVisible(false); setMenuMeeting(null); };

  const onEdit = () => {
    try {
      const id = menuMeeting?.meeting_id || menuMeeting?.id;
      closeMenu();
      navigation.navigate('Meeting', { mode: 'edit', meetingId: id, meeting: menuMeeting });
    } catch { closeMenu(); }
  };

  const onDelete = () => {
    const id = menuMeeting?.meeting_id || menuMeeting?.id;
    Alert.alert(
      'Delete meeting',
      'Are you sure you want to delete this meeting?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              closeMenu();
              const res = await deleteMeetingApi(id);
              if (res?.success) {
                setList((prev) => prev.filter((m) => String(m?.meeting_id || m?.id) !== String(id)));
                Toast.show({ type: 'custom_success', text1: 'Meeting deleted', position: 'bottom', visibilityTime: 1500 });
                try { await load({ silent: true }); } catch {}
              } else {
                Toast.show({ type: 'custom_error', text1: res?.error || 'Failed to delete meeting', position: 'bottom', visibilityTime: 2000 });
              }
            } catch (e) {
              Toast.show({ type: 'custom_error', text1: e?.message || 'Failed to delete meeting', position: 'bottom', visibilityTime: 2000 });
            }
          }
        }
      ]
    );
  };

  const displayed = React.useMemo(() => {
    const src = Array.isArray(props?.items) ? props.items : list;
    let arr = Array.isArray(src) ? src : [];
    const q = query.trim().toLowerCase();
    if (q) {
      arr = arr.filter((m) => {
        const name = String(m?.title || '').toLowerCase();
        const desc = String(m?.description || '').toLowerCase();
        return name.includes(q) || desc.includes(q);
      });
    }
    if (typeFilter !== 'all') {
      arr = arr.filter((m) => String(m?.meeting_type || '').toLowerCase() === String(typeFilter));
    }
    if (scopeFilter !== 'all') {
      arr = arr.filter((m) => String(m?.meeting_scope || '').toLowerCase() === String(scopeFilter));
    }
    return arr;
  }, [props?.items, list, query, typeFilter, scopeFilter]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meetings</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setFilterOpen(true)}
          >
            <Filter size={16} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Meeting')}
          >
            <Plus size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: theme.colors.error }}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={{ padding: 16 }}>
          {Array.from({ length: Math.max(3, Math.ceil((Dimensions.get('window').height - 220) / 110)) }).map((_, i) => (
            <ShimmerCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={loading ? [] : displayed}
          keyExtractor={(item, idx) => String(item.meeting_id || idx)}
          renderItem={({ item, index }) => (
            <MeetingCard
              meeting={item}
              index={index}
              onMenu={() => openMenu(item)}
              onPress={() => {
                try {
                  const id = item?.meeting_id || item?.id;
                  navigation.navigate('MeetingDetail', { meetingId: id, meeting: item });
                } catch {}
              }}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 }}
          ListHeaderComponent={refreshing ? <ShimmerHeader /> : null}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            !Array.isArray(props?.items) ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  await load({ silent: true });
                  setRefreshing(false);
                }}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            ) : undefined
          }
          ListEmptyComponent={
            !loading ? (
              <View style={{ padding: 24 }}>
                <Text style={{ color: theme.colors.textMuted, textAlign: 'center' }}>No meetings found for today.</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Three-dot menu modal */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={closeMenu}>
        <Pressable style={styles.menuBackdrop} onPress={closeMenu}>
          <View style={styles.menuSheet}>
            <Text style={styles.menuTitle}>Meeting actions</Text>
            <TouchableOpacity style={styles.menuItem} onPress={onEdit}>
              <Edit3 size={16} color={theme.colors.text} />
              <Text style={styles.menuItemText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={onDelete}>
              <Trash2 size={16} color={theme.colors.error} />
              <Text style={[styles.menuItemText, { color: theme.colors.error }]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={closeMenu}>
              <X size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Filter modal */}
      <Modal
        visible={filterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setFilterOpen(false)}>
          <View style={{ flex: 1, backgroundColor: theme.colors.overlayLight, justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback>
              <View style={{ backgroundColor: theme.colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 }}>
                <View style={{ height: 4, width: 44, backgroundColor: theme.colors.muted200, alignSelf: 'center', borderRadius: 2, marginBottom: 12 }} />
                <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text, marginBottom: 12 }}>Filter Meetings</Text>

                {/* Search */}
                <View style={{ borderWidth: 1, borderColor: theme.colors.muted200, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14 }}>
                  <TextInput
                    placeholder="Search by title or description"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={query}
                    onChangeText={setQuery}
                    style={{ color: theme.colors.text }}
                  />
                </View>

                {/* Type */}
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 8 }}>Type</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {['all','planning','review','standup','retro'].map((t) => {
                    const active = typeFilter === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setTypeFilter(t)}
                        style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: active ? theme.colors.primary : theme.colors.muted200, backgroundColor: active ? `${theme.colors.primary}15` : theme.colors.white }}
                      >
                        <Text style={{ color: active ? theme.colors.primary : theme.colors.text, fontWeight: active ? '600' : '500' }}>{t.replace(/\b\w/g, c => c.toUpperCase())}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Scope */}
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 8 }}>Scope</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {['all','client','internal'].map((s) => {
                    const active = scopeFilter === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        onPress={() => setScopeFilter(s)}
                        style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: active ? theme.colors.primary : theme.colors.muted200, backgroundColor: active ? `${theme.colors.primary}15` : theme.colors.white }}
                      >
                        <Text style={{ color: active ? theme.colors.primary : theme.colors.text, fontWeight: active ? '600' : '500' }}>{s.replace(/\b\w/g, c => c.toUpperCase())}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Actions */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <TouchableOpacity
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.colors.muted100, alignItems: 'center' }}
                    onPress={() => { setQuery(''); setTypeFilter('all'); setScopeFilter('all'); }}
                  >
                    <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.colors.primary, alignItems: 'center' }}
                    onPress={() => setFilterOpen(false)}
                  >
                    <Text style={{ color: theme.colors.white, fontWeight: '700' }}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.text },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerIconBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 50,
    padding: 6,
    marginRight: 8,
  },
  itemIconBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 50,
    padding: 6,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.muted100,
    overflow: 'hidden',
  },
  leftStripe: { width: 5 },
  shadow: {
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  body: { flex: 1, padding: 14 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rightTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16.5, fontWeight: '700', color: theme.colors.text, flex: 1, marginRight: 8 },
  desc: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 13.5 },
  metaRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meta: { color: theme.colors.textSecondary, fontSize: 12.5 },
  rowBetween: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  dateChipText: { fontSize: 12, fontWeight: '600' },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pillText: { fontSize: 12, fontWeight: '600' },
  statusSoft: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  statusSoftText: { fontWeight: '600', fontSize: 12.5 },

  // Menu styles
  menuBackdrop: { flex: 1, backgroundColor: theme.colors.overlayLight, justifyContent: 'flex-end' },
  menuSheet: { backgroundColor: theme.colors.background, padding: 12, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  menuTitle: { color: theme.colors.textSecondary, fontSize: 12, marginBottom: 8, paddingHorizontal: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 8 },
  menuItemText: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
});
