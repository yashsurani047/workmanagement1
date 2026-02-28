// src/Components/Meeting/MeetingDetailsList.jsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  Alert,
  TextInput,
  TouchableWithoutFeedback,
  StatusBar,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../Themes/ThemeContext';
import TopNavbar from '../Common/Topnavbar';
import {
  Plus,
  MoreVertical,
  Calendar,
  Edit3,
  Trash2,
  X,
  Filter,
  Clock,
  Users,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Video,
  MapPin,
  Eye,
  Lock,
  Shield,
} from 'lucide-react-native';

/* ──────────────────── Mock Data ──────────────────── */

const MOCK_MEETINGS = [
  {
    meeting_id: 'm1',
    title: 'Sprint Planning Q1',
    description: 'Plan the upcoming sprint tasks and assign responsibilities across the team.',
    meeting_type: 'planning',
    meeting_scope: 'internal',
    start_datetime: '2026-02-26T10:00:00',
    end_datetime: '2026-02-26T11:30:00',
    location: 'Conference Room A',
    participants: ['Alice', 'Bob', 'Charlie'],
  },
  {
    meeting_id: 'm2',
    title: 'Client Onboarding Demo',
    description: 'Walkthrough the new product features with the client team and collect feedback.',
    meeting_type: 'demo',
    meeting_scope: 'client',
    start_datetime: '2026-02-26T14:00:00',
    end_datetime: '2026-02-26T15:00:00',
    location: 'Zoom Call',
    participants: ['Eve', 'Frank'],
  },
  {
    meeting_id: 'm3',
    title: 'Weekly Standup',
    description: 'Quick sync on blockers, progress, and upcoming priorities.',
    meeting_type: 'standup',
    meeting_scope: 'internal',
    start_datetime: '2026-02-26T09:00:00',
    end_datetime: '2026-02-26T09:15:00',
    location: 'Google Meet',
    participants: ['Grace', 'Heidi', 'Ivan'],
  },
  {
    meeting_id: 'm4',
    title: 'Design Review – Mobile App',
    description: 'Review the latest mobile UI designs and provide feedback before handoff.',
    meeting_type: 'review',
    meeting_scope: 'internal',
    start_datetime: '2026-02-27T11:00:00',
    end_datetime: '2026-02-27T12:00:00',
    location: 'Design Studio',
    participants: ['Julia', 'Karen'],
  },
  {
    meeting_id: 'm5',
    title: 'Quarterly Retrospective',
    description: 'Reflect on what went well, what could improve, and action items for next quarter.',
    meeting_type: 'retro',
    meeting_scope: 'internal',
    start_datetime: '2026-02-28T16:00:00',
    end_datetime: '2026-02-28T17:30:00',
    location: 'Board Room',
    participants: ['Leo', 'Mike', 'Nina'],
  },
  {
    meeting_id: 'm6',
    title: 'Hybrid Team Sync',
    description: 'A sync involving both internal team members and external stakeholders.',
    meeting_type: 'standup',
    meeting_scope: 'both',
    start_datetime: '2026-03-01T10:00:00',
    end_datetime: '2026-03-01T11:00:00',
    location: 'Hybrid (Room B/Zoom)',
    participants: ['Alice', 'Bob', 'John Client'],
  },
];

/* ──────────────────── helpers ──────────────────── */

const formatDateISO = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatLabel = (s = '') =>
  String(s).replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

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
    return `${fmt(s)} – ${fmt(e)}`;
  } catch {
    return '';
  }
};

const formatDate = (iso) => {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return null;
  }
};

/* ──────────────────── Animated Meeting Card ──────────────────── */

const MeetingCard = ({ meeting, index, onMenu, onPress, theme }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    const delay = Math.min(index * 80, 400);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 500, delay,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 500, delay,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1, duration: 500, delay,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  // ─── Theme-based configs ───
  const TYPE_CONFIG = {
    planning: { icon: '📋', color: theme.colors.project },
    review: { icon: '🔍', color: theme.colors.meeting },
    standup: { icon: '⚡', color: theme.colors.task },
    retro: { icon: '🔄', color: theme.colors.event },
    kickoff: { icon: '🚀', color: theme.colors.timesheet },
    demo: { icon: '🖥️', color: theme.colors.primary },
    interview: { icon: '🎤', color: theme.colors.error },
  };

  const SCOPE_CONFIG = {
    client: { icon: '🤝', color: theme.colors.meeting },
    internal: { icon: '🏢', color: theme.colors.ticket },
    external: { icon: '🌐', color: theme.colors.task },
    both: { icon: '👥', color: theme.colors.primary },
  };

  const meetingColors = [
    theme.colors.meeting,
    theme.colors.event,
    theme.colors.timesheet,
    theme.colors.ticket,
    theme.colors.task,
    theme.colors.project,
  ];

  const getMeetingStripeColor = () => {
    const type = String(meeting?.meeting_type || '').toLowerCase();
    const scope = String(meeting?.meeting_scope || '').toLowerCase();
    if (TYPE_CONFIG[type]) return TYPE_CONFIG[type].color;
    if (type.includes('planning')) return theme.colors.project;
    if (type.includes('review')) return theme.colors.meeting;
    if (type.includes('standup')) return theme.colors.task;
    if (type.includes('retro')) return theme.colors.event;
    if (scope === 'client') return theme.colors.meeting;
    if (scope === 'internal') return theme.colors.ticket;
    return meetingColors[index % meetingColors.length];
  };

  const title = meeting?.title || 'Untitled Meeting';
  const descr = meeting?.description || '';
  const when = timeRange(meeting?.start_time, meeting?.end_time);
  const type = (meeting?.meeting_type || '').toLowerCase();
  const scope = (meeting?.meeting_scope || '').toLowerCase();
  const stripeColor = getMeetingStripeColor();
  const typeCfg = TYPE_CONFIG[type] || { icon: '📅', color: stripeColor };
  const scopeCfg = SCOPE_CONFIG[scope] || null;
  const location = meeting?.location || meeting?.venue || '';
  const attendees = Array.isArray(meeting?.attendees) ? meeting.attendees : [];

  let dateStr = formatDate(meeting?.start_time);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97, useNativeDriver: true, tension: 100, friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1, useNativeDriver: true, tension: 100, friction: 10,
    }).start();
  };

  const avatarColors = [
    theme.colors.project,
    theme.colors.meeting,
    theme.colors.task,
    theme.colors.event,
    theme.colors.timesheet,
    theme.colors.ticket,
  ];

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={{
          backgroundColor: theme.colors.card,
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
          shadowOpacity: 0.1,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
        }}
      >
        {/* ─── Top accent bar ─── */}
        <View
          style={{
            height: 4,
            backgroundColor: stripeColor,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        />

        <View style={{ padding: 18 }}>
          {/* ─── Row 1: Icon + Title + Menu ─── */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            {/* Meeting icon container */}
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: `${stripeColor}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Video size={22} color={stripeColor} strokeWidth={1.8} />
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '800',
                    color: theme.colors.text,
                    flex: 1,
                    letterSpacing: -0.3,
                  }}
                  numberOfLines={1}
                >
                  {title}
                </Text>

                {onMenu && (
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation?.(); onMenu(); }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{
                      padding: 6,
                      borderRadius: 10,
                      backgroundColor: theme.colors.muted100,
                      marginLeft: 8,
                    }}
                  >
                    <MoreVertical size={16} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* ─── Type + Scope + Date chips ─── */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8, flexWrap: 'wrap' }}>
                {/* Type chip */}
                {!!type && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 20,
                      backgroundColor: `${typeCfg.color}15`,
                    }}
                  >
                    <Text style={{ fontSize: 11, marginRight: 4 }}>{typeCfg.icon}</Text>
                    <Text
                      style={{
                        fontSize: 11.5,
                        fontWeight: '700',
                        color: typeCfg.color,
                        letterSpacing: 0.2,
                      }}
                    >
                      {formatLabel(type)}
                    </Text>
                  </View>
                )}

                {/* Scope chip */}
                {scopeCfg && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 20,
                      backgroundColor: `${scopeCfg.color}12`,
                    }}
                  >
                    <Text style={{ fontSize: 10, marginRight: 4 }}>{scopeCfg.icon}</Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: scopeCfg.color,
                      }}
                    >
                      {formatLabel(scope)}
                    </Text>
                  </View>
                )}

                {/* Date chip */}
                {dateStr && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 20,
                      backgroundColor: theme.colors.muted100,
                    }}
                  >
                    <Calendar size={11} color={theme.colors.textSecondary} />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: theme.colors.textSecondary,
                        marginLeft: 4,
                      }}
                    >
                      {dateStr}
                    </Text>
                  </View>
                )}

                {/* Visibility chip */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 20,
                    backgroundColor: theme.colors.muted100,
                  }}
                >
                  {(meeting?.visibility === 'private') ? (
                    <Lock size={11} color={theme.colors.error} />
                  ) : (meeting?.visibility === 'organization') ? (
                    <Shield size={11} color={theme.colors.primary} />
                  ) : (
                    <Eye size={11} color={theme.colors.success} />
                  )}
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.colors.textSecondary,
                      marginLeft: 4,
                      textTransform: 'capitalize'
                    }}
                  >
                    {meeting?.visibility || 'Public'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ─── Description ─── */}
          {!!descr && (
            <Text
              style={{
                fontSize: 13.5,
                color: theme.colors.textSecondary,
                marginTop: 12,
                lineHeight: 19,
                letterSpacing: 0.1,
              }}
              numberOfLines={2}
            >
              {descr}
            </Text>
          )}

          {/* ─── Time bar ─── */}
          {!!when && (
            <View
              style={{
                marginTop: 14,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: `${stripeColor}08`,
                borderWidth: 1,
                borderColor: `${stripeColor}18`,
              }}
            >
              <Clock size={14} color={stripeColor} strokeWidth={2} />
              <Text
                style={{
                  fontSize: 13.5,
                  fontWeight: '700',
                  color: stripeColor,
                  marginLeft: 8,
                  letterSpacing: 0.2,
                }}
              >
                {when}
              </Text>
            </View>
          )}

          {/* ─── Location row ─── */}
          {!!location && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
              <MapPin size={13} color={theme.colors.textSecondary} />
              <Text
                style={{
                  fontSize: 12.5,
                  color: theme.colors.textSecondary,
                  fontWeight: '500',
                  marginLeft: 6,
                }}
                numberOfLines={1}
              >
                {location}
              </Text>
            </View>
          )}

          {/* ─── Divider ─── */}
          <View
            style={{
              height: 1,
              backgroundColor: theme.colors.borderMuted,
              marginVertical: 14,
            }}
          />

          {/* ─── Bottom row: Attendees + Arrow ─── */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Attendee avatars */}
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {attendees.length > 0 && (
                <>
                  <View style={{ flexDirection: 'row' }}>
                    {attendees.slice(0, 5).map((a, idx) => {
                      const bg = avatarColors[idx % avatarColors.length];
                      const name = typeof a === 'string' ? a : (a?.name || a?.full_name || a?.user_name || 'U');
                      const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                      return (
                        <View
                          key={idx}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginLeft: idx === 0 ? 0 : -8,
                            borderWidth: 2.5,
                            borderColor: theme.colors.card,
                            backgroundColor: bg,
                          }}
                        >
                          <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 10 }}>{initials}</Text>
                        </View>
                      );
                    })}
                    {attendees.length > 5 && (
                      <View
                        style={{
                          width: 32, height: 32, borderRadius: 16,
                          justifyContent: 'center', alignItems: 'center',
                          marginLeft: -8, borderWidth: 2.5,
                          borderColor: theme.colors.card,
                          backgroundColor: theme.colors.muted200,
                        }}
                      >
                        <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 10 }}>
                          +{attendees.length - 5}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={{ marginLeft: 10, flexDirection: 'row', alignItems: 'center' }}>
                    <Users size={12} color={theme.colors.textSecondary} />
                    <Text style={{ fontSize: 11.5, color: theme.colors.textSecondary, fontWeight: '600', marginLeft: 4 }}>
                      {attendees.length}
                    </Text>
                  </View>
                </>
              )}

              {attendees.length === 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Users size={13} color={theme.colors.textSecondary} />
                  <Text style={{ fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500', marginLeft: 5 }}>
                    No attendees
                  </Text>
                </View>
              )}
            </View>

            {/* Navigate arrow */}
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                backgroundColor: `${theme.colors.primary}10`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronRight size={16} color={theme.colors.primary} strokeWidth={2.5} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ──────────────────── Shimmer Card ──────────────────── */

const ShimmerMeetingCard = ({ theme, index }) => {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const Block = ({ w, h, r = 8, mt = 0 }) => (
    <Animated.View
      style={{
        width: w, height: h, borderRadius: r,
        backgroundColor: theme.colors.muted200, marginTop: mt, opacity: pulseAnim,
      }}
    />
  );

  return (
    <Animated.View
      style={{
        opacity: fadeIn,
        backgroundColor: theme.colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
      }}
    >
      <View style={{ height: 4, backgroundColor: theme.colors.muted200 }} />
      <View style={{ padding: 18 }}>
        <View style={{ flexDirection: 'row' }}>
          <Block w={44} h={44} r={14} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Block w="70%" h={18} r={6} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Block w={80} h={22} r={11} />
              <Block w={55} h={22} r={11} />
            </View>
          </View>
        </View>
        <Block w="90%" h={14} mt={14} />
        <Block w="100%" h={40} r={12} mt={14} />
        <View style={{ height: 1, backgroundColor: theme.colors.borderMuted, marginVertical: 14 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row' }}>
            {[0, 1, 2].map((i) => (
              <Block key={i} w={32} h={32} r={16} />
            ))}
          </View>
          <Block w={30} h={30} r={10} />
        </View>
      </View>
    </Animated.View>
  );
};

/* ──────────────────── Empty State ──────────────────── */

const EmptyState = ({ theme }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
      }}
    >
      <View
        style={{
          width: 80, height: 80, borderRadius: 24,
          backgroundColor: `${theme.colors.primary}12`,
          alignItems: 'center', justifyContent: 'center', marginBottom: 20,
        }}
      >
        <Sparkles size={36} color={theme.colors.primary} strokeWidth={1.5} />
      </View>
      <Text
        style={{
          fontSize: 19, fontWeight: '800', color: theme.colors.text,
          marginBottom: 8, letterSpacing: -0.3,
        }}
      >
        No meetings today
      </Text>
      <Text
        style={{
          fontSize: 14, color: theme.colors.textSecondary,
          textAlign: 'center', lineHeight: 21,
        }}
      >
        Your schedule is clear! Tap + to schedule a new meeting.
      </Text>
    </Animated.View>
  );
};

/* ──────────────────── Stats Row ──────────────────── */

const StatsRow = ({ data, theme }) => {
  const total = data.length;
  if (total === 0) return null;

  const types = {};
  data.forEach((m) => {
    const t = (m?.meeting_type || 'other').toLowerCase();
    types[t] = (types[t] || 0) + 1;
  });

  return (
    <View style={{ flexDirection: 'row', marginBottom: 14, gap: 10 }}>
      {[
        { label: 'Total', value: total, color: theme.colors.primary, icon: Video },
        { label: 'Types', value: Object.keys(types).length, color: theme.colors.secondary, icon: TrendingUp },
        { label: 'Today', value: total, color: theme.colors.success, icon: Calendar },
      ].map((stat) => (
        <View
          key={stat.label}
          style={{
            flex: 1,
            backgroundColor: `${stat.color}10`,
            borderRadius: 14,
            padding: 12,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: `${stat.color}20`,
          }}
        >
          <stat.icon size={18} color={stat.color} strokeWidth={2} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: stat.color, marginTop: 4 }}>
            {stat.value}
          </Text>
          <Text
            style={{
              fontSize: 11, fontWeight: '600', color: theme.colors.textSecondary,
              marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5,
            }}
          >
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

/* ──────────────────── Main Component ──────────────────── */

export default function MeetingDetailsList(props) {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [list] = useState(MOCK_MEETINGS);
  const [loading] = useState(false);
  const [error] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuMeeting, setMenuMeeting] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [refreshing] = useState(false);


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
    Alert.alert(
      'Delete Meeting',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => { closeMenu(); }
        }
      ]
    );
  };

  const displayed = useMemo(() => {
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

  const typeOptions = ['all', 'planning', 'review', 'standup', 'retro', 'kickoff', 'demo'];
  const scopeOptions = ['all', 'client', 'internal', 'external', 'both'];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* ─── Header ─── */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 10,
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 26,
              fontWeight: '900',
              color: theme.colors.text,
              letterSpacing: -0.5,
            }}
          >
            Meetings
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: theme.colors.textSecondary,
              marginTop: 2,
              fontWeight: '500',
            }}
          >
            {displayed.length} meeting{displayed.length !== 1 ? 's' : ''} found
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={{
              width: 42, height: 42, borderRadius: 14,
              backgroundColor: theme.colors.muted100,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: theme.colors.border,
            }}
            onPress={() => setFilterOpen(true)}
          >
            <Filter size={18} color={theme.colors.primary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              width: 42, height: 42, borderRadius: 14,
              backgroundColor: theme.colors.primary,
              alignItems: 'center', justifyContent: 'center',
            }}
            onPress={() => navigation.navigate('Meeting')}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Error ─── */}
      {!!error && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
          <View style={{ padding: 12, borderRadius: 12, backgroundColor: `${theme.colors.error}10`, borderWidth: 1, borderColor: `${theme.colors.error}20` }}>
            <Text style={{ color: theme.colors.error, fontSize: 13, fontWeight: '500' }}>{error}</Text>
          </View>
        </View>
      )}

      {/* ─── List ─── */}
      <FlatList
        data={
          loading
            ? Array(5).fill(null).map((_, i) => ({ __shimmer: true, id: `s-${i}` }))
            : displayed
        }
        renderItem={({ item, index }) =>
          item?.__shimmer ? (
            <ShimmerMeetingCard theme={theme} index={index} />
          ) : (
            <MeetingCard
              meeting={item}
              index={index}
              theme={theme}
              onMenu={() => openMenu(item)}
              onPress={() => {
                try {
                  const id = item?.meeting_id || item?.id;
                  navigation.navigate('MeetingDetail', { meetingId: id, meeting: item });
                } catch { }
              }}
            />
          )
        }
        keyExtractor={(item, idx) => String(item?.meeting_id || item?.id || idx)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 }}
        ListHeaderComponent={
          !loading && displayed.length > 0 ? <StatsRow data={displayed} theme={theme} /> : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListEmptyComponent={!loading ? <EmptyState theme={theme} /> : null}
        showsVerticalScrollIndicator={false}
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
      />

      {/* ─── Actions Modal ─── */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={closeMenu}>
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={{ flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: theme.colors.card,
                  padding: 16,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                }}
              >
                <View style={{ height: 5, width: 44, backgroundColor: theme.colors.border, alignSelf: 'center', borderRadius: 3, marginBottom: 16 }} />
                <Text
                  style={{
                    color: theme.colors.textSecondary, fontSize: 12, marginBottom: 10,
                    paddingHorizontal: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5,
                  }}
                >
                  Meeting Actions
                </Text>

                {/* Edit */}
                <TouchableOpacity
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    paddingVertical: 14, paddingHorizontal: 10, borderRadius: 12,
                    backgroundColor: theme.colors.muted100, marginBottom: 8,
                  }}
                  onPress={onEdit}
                >
                  <Edit3 size={18} color={theme.colors.primary} />
                  <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '600' }}>Edit Meeting</Text>
                </TouchableOpacity>

                {/* Delete */}
                <TouchableOpacity
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    paddingVertical: 14, paddingHorizontal: 10, borderRadius: 12,
                    marginBottom: 8,
                  }}
                  onPress={onDelete}
                >
                  <Trash2 size={18} color={theme.colors.error} />
                  <Text style={{ color: theme.colors.error, fontSize: 15, fontWeight: '600' }}>Delete Meeting</Text>
                </TouchableOpacity>

                {/* Cancel */}
                <TouchableOpacity
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    paddingVertical: 14, paddingHorizontal: 10, borderRadius: 12,
                  }}
                  onPress={closeMenu}
                >
                  <X size={18} color={theme.colors.textSecondary} />
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 15, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Filter Modal ─── */}
      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setFilterOpen(false)}>
          <View style={{ flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: theme.colors.card,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  paddingHorizontal: 20,
                  paddingTop: 14,
                  paddingBottom: 40,
                  maxHeight: '85%',
                }}
              >
                <View style={{ height: 5, width: 44, backgroundColor: theme.colors.border, alignSelf: 'center', borderRadius: 3, marginBottom: 20 }} />
                <Text style={{ fontSize: 20, fontWeight: '800', color: theme.colors.text, marginBottom: 20, letterSpacing: -0.3 }}>
                  Filter Meetings
                </Text>

                {/* Search */}
                <View
                  style={{
                    borderWidth: 1, borderColor: theme.colors.border,
                    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 20,
                    backgroundColor: theme.colors.muted100,
                  }}
                >
                  <TextInput
                    placeholder="Search by title or description…"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={query}
                    onChangeText={setQuery}
                    style={{ color: theme.colors.text, fontSize: 15, fontWeight: '500' }}
                  />
                </View>

                {/* Type */}
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Type
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {typeOptions.map((t) => {
                    const active = typeFilter === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setTypeFilter(t)}
                        style={{
                          paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                          borderWidth: 1.5,
                          borderColor: active ? theme.colors.primary : theme.colors.border,
                          backgroundColor: active ? `${theme.colors.primary}15` : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            color: active ? theme.colors.primary : theme.colors.text,
                            fontWeight: active ? '700' : '500', fontSize: 13,
                          }}
                        >
                          {formatLabel(t)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Scope */}
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Scope
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                  {scopeOptions.map((s) => {
                    const active = scopeFilter === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        onPress={() => setScopeFilter(s)}
                        style={{
                          paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                          borderWidth: 1.5,
                          borderColor: active ? theme.colors.primary : theme.colors.border,
                          backgroundColor: active ? `${theme.colors.primary}15` : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            color: active ? theme.colors.primary : theme.colors.text,
                            fontWeight: active ? '700' : '500', fontSize: 13,
                          }}
                        >
                          {formatLabel(s)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Actions */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1, paddingVertical: 14, borderRadius: 14,
                      borderWidth: 1.5, borderColor: theme.colors.border, alignItems: 'center',
                    }}
                    onPress={() => { setQuery(''); setTypeFilter('all'); setScopeFilter('all'); }}
                  >
                    <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 15 }}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1, paddingVertical: 14, borderRadius: 14,
                      backgroundColor: theme.colors.primary, alignItems: 'center',
                    }}
                    onPress={() => setFilterOpen(false)}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
