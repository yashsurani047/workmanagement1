// src/Components/Common/Drawerbar.jsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Modal,
  Platform,
  StatusBar,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile } from '../../Services/Common/authServices';
import theme from '../../Themes/Themes';
import { BASE_URL } from '../../Config/api.jsx';

// ⭐ Lucide Icons
import { X, User, Settings, HelpCircle, ChevronRight } from 'lucide-react-native';

// ⭐ Navigation Hook (NEW)
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const Drawerbar = ({ visible, onClose, onLogout }) => {
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [avatar, setAvatar] = React.useState(null);

  const [render, setRender] = React.useState(visible);

  const slideX = React.useRef(new Animated.Value(-width)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;

  // ⭐ Initialize navigation
  const navigation = useNavigation();

  const buildAvatarUri = (val) => {
    if (!val) return null;
    if (typeof val !== 'string') return null;
    if (val.startsWith('data:')) return val;
    if (val.startsWith('http://') || val.startsWith('https://')) return val;
    if (val.length > 200) return `data:image/png;base64,${val}`;
    const base = (BASE_URL || '').replace(/\/$/, '');
    return `${base}/${val.replace(/^\//, '')}`;
  };

  React.useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
          setLoading(false);
          return;
        }
        const resp = await getUserProfile(userId);
        if (mounted && resp?.success && resp?.data) {
          const data = resp.data;
          setProfile(data);

          const fields = [
            'profile_photo',
            'avatar',
            'photo_url',
            'profile_pic',
            'photo',
            'profile_image',
            'avatar_url',
            'image_url',
            'image',
            'picture',
            'profilePic',
          ];

          for (const f of fields) {
            if (data[f]) {
              setAvatar(buildAvatarUri(String(data[f])));
              break;
            }
          }
        }
      } catch (e) {
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (visible) run();
    return () => { mounted = false; };
  }, [visible]);

  React.useEffect(() => {
    if (visible) {
      setRender(true);
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: -width,
          duration: 230,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setRender(false);
      });
    }
  }, [visible]);

  const initials = React.useMemo(() => {
    const name = profile?.full_name || profile?.username || 'User';
    return name
      .split(' ')
      .map((s) => s[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [profile]);

  // ⭐ Menu items with icons
  const menuItems = [
    { key: 'profile', label: 'My Profile', icon: User },
    { key: 'settings', label: 'Settings', icon: Settings },
    { key: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  if (!render) return null;

  return (
    <Modal
      visible={render}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[styles.drawer, { transform: [{ translateX: slideX }] }]}
            >
              {/* Header */}
              <View style={styles.headerTop}>
                <View style={styles.headerContent}>
                  <View style={styles.avatarWrap}>
                    {avatar ? (
                      <Image
                        source={{ uri: avatar }}
                        style={styles.avatar}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.avatar, styles.avatarFallback]}>
                        {loading ? (
                          <ActivityIndicator color={theme.colors.white} />
                        ) : (
                          <Text style={styles.avatarInitials}>{initials}</Text>
                        )}
                      </View>
                    )}
                  </View>

                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>
                      {profile?.full_name || profile?.username || 'User'}
                    </Text>
                    <Text style={styles.sub} numberOfLines={1}>
                      {profile?.email || profile?.user_primary_email_id || ''}
                    </Text>
                  </View>

                  {/* ⭐ Lucide close icon */}
                  <TouchableOpacity
                    style={styles.headerCloseIcon}
                    onPress={onClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={18} color={theme.colors.white} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              {/* ⭐ Menu items */}
              <View style={styles.menuContainer}>
                {menuItems.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <TouchableOpacity
                      key={item.key}
                      activeOpacity={0.7}
                      style={[
                        styles.menuItem,
                        index === 0 && styles.menuItemFirst,
                      ]}
                      onPress={() => {
                        onClose && onClose();
                        if (item.key === 'profile') {
                          navigation.navigate('Profile'); // ⭐ PROFILE REDIRECT
                        }
                      }}
                    >
                      <View style={styles.menuLeft}>
                        <Icon size={20} color={theme.colors.text} style={{ width: 26 }} />
                        <Text style={styles.menuLabel}>{item.label}</Text>
                      </View>

                      <ChevronRight size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ flex: 1 }} />

              {/* Footer */}
              <View style={styles.bottomRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.secondaryBtn}
                  onPress={onClose}
                >
                  <Text style={styles.secondaryBtnText}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.destructiveBtn}
                  onPress={onLogout || (() => {})}
                >
                  <Text style={styles.destructiveBtnText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const STATUSBAR_PADDING =
  Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

// ⭐ Styles (unchanged)
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlayLight || 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: Math.min(0.82 * width, 340),
    backgroundColor: theme.colors.background,
    paddingBottom: 16,
    elevation: 24,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },

  headerTop: {
    paddingTop: STATUSBAR_PADDING + 24,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primary,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: theme.colors.background,
    overflow: 'hidden',
    backgroundColor: theme.colors.textSecondary,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: 18,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.white,
  },
  sub: {
    fontSize: 12,
    color: theme.colors.white,
    opacity: 0.85,
    marginTop: 2,
  },

  headerCloseIcon: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },

  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    opacity: 0.5,
  },

  menuContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginTop: 4,
  },
  menuItemFirst: {
    marginTop: 8,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  menuLabel: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
    marginLeft: 5,
  },

  bottomRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secondaryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: theme.colors.surface || theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryBtnText: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  destructiveBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: theme.colors.error,
  },
  destructiveBtnText: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
});

export default Drawerbar;
