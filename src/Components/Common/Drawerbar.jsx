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
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile } from '../../Services/Common/authServices';
import { BASE_URL } from '../../Config/api.jsx';
import { useTheme, ACCENT_COLORS } from '../../Themes/ThemeContext';

// Lucide Icons
import { User, Settings, HelpCircle, ChevronRight, Sun, Moon, Palette, Check } from 'lucide-react-native';

// Navigation Hook
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const Drawerbar = ({ visible, onClose, onLogout }) => {
  const { theme, mode, accent, setAccent, toggleMode, isDark } = useTheme();
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [avatar, setAvatar] = React.useState(null);
  const [themeOpen, setThemeOpen] = React.useState(false);

  const [render, setRender] = React.useState(visible);

  const slideX = React.useRef(new Animated.Value(-width)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;

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
            'profile_photo', 'avatar', 'photo_url', 'profile_pic', 'photo',
            'profile_image', 'avatar_url', 'image_url', 'image', 'picture', 'profilePic',
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
        if (finished) {
          setRender(false);
          setThemeOpen(false);
        }
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

  const menuItems = [
    { key: 'profile', label: 'My Profile', icon: User },
    { key: 'theme', label: 'Theme & Colors', icon: Palette },
    { key: 'settings', label: 'Settings', icon: Settings },
    { key: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  if (!render) return null;

  const STATUSBAR_PADDING = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

  return (
    <Modal
      visible={render}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles(theme).overlay, { opacity: overlayOpacity }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[styles(theme).drawer, { transform: [{ translateX: slideX }] }]}
            >
              {/* Header */}
              <View style={[styles(theme).headerTop, { paddingTop: STATUSBAR_PADDING + 24 }]}>
                <View style={styles(theme).headerContent}>
                  <View style={styles(theme).avatarWrap}>
                    {avatar ? (
                      <Image
                        source={{ uri: avatar }}
                        style={styles(theme).avatar}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles(theme).avatar, styles(theme).avatarFallback]}>
                        {loading ? (
                          <ActivityIndicator color={theme.colors.white} />
                        ) : (
                          <Text style={styles(theme).avatarInitials}>{initials}</Text>
                        )}
                      </View>
                    )}
                  </View>

                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles(theme).name} numberOfLines={1}>
                      {profile?.full_name || profile?.username || 'User'}
                    </Text>
                    <Text style={styles(theme).sub} numberOfLines={1}>
                      {profile?.email || profile?.user_primary_email_id || ''}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles(theme).divider} />

              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {/* Menu items */}
                <View style={styles(theme).menuContainer}>
                  {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <TouchableOpacity
                        key={item.key}
                        activeOpacity={0.7}
                        style={[
                          styles(theme).menuItem,
                          index === 0 && styles(theme).menuItemFirst,
                        ]}
                        onPress={() => {
                          if (item.key === 'profile') {
                            onClose && onClose();
                            navigation.navigate('Profile');
                          } else if (item.key === 'theme') {
                            setThemeOpen(!themeOpen);
                          }
                        }}
                      >
                        <View style={styles(theme).menuLeft}>
                          <Icon size={20} color={item.key === 'theme' ? theme.colors.primary : theme.colors.text} style={{ width: 26 }} />
                          <Text style={[styles(theme).menuLabel, item.key === 'theme' && { color: theme.colors.primary, fontWeight: '600' }]}>{item.label}</Text>
                        </View>
                        <ChevronRight size={20} color={theme.colors.textSecondary} />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* ─── Theme Settings Panel ─── */}
                {themeOpen && (
                  <View style={styles(theme).themePanel}>
                    {/* Light / Dark Toggle */}
                    <View style={styles(theme).themeModeRow}>
                      <Text style={styles(theme).themeSectionLabel}>Mode</Text>
                      <View style={styles(theme).modeToggleRow}>
                        <TouchableOpacity
                          style={[
                            styles(theme).modeBtn,
                            !isDark && { backgroundColor: theme.colors.primary },
                          ]}
                          onPress={() => toggleMode()}
                          activeOpacity={0.8}
                        >
                          <Sun size={16} color={!isDark ? '#fff' : theme.colors.textSecondary} />
                          <Text style={[styles(theme).modeBtnText, !isDark && { color: '#fff' }]}>Light</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles(theme).modeBtn,
                            isDark && { backgroundColor: theme.colors.primary },
                          ]}
                          onPress={() => toggleMode()}
                          activeOpacity={0.8}
                        >
                          <Moon size={16} color={isDark ? '#fff' : theme.colors.textSecondary} />
                          <Text style={[styles(theme).modeBtnText, isDark && { color: '#fff' }]}>Dark</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Accent Color Grid */}
                    <Text style={styles(theme).themeSectionLabel}>Accent Color</Text>
                    <View style={styles(theme).colorGrid}>
                      {ACCENT_COLORS.map((c) => {
                        const isSelected = accent === c.hex;
                        return (
                          <TouchableOpacity
                            key={c.hex}
                            style={[
                              styles(theme).colorSwatch,
                              { backgroundColor: c.hex },
                              isSelected && styles(theme).colorSwatchSelected,
                            ]}
                            onPress={() => setAccent(c.hex)}
                            activeOpacity={0.8}
                          >
                            {isSelected && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Footer */}
              <View style={styles(theme).bottomRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles(theme).secondaryBtn}
                  onPress={onClose}
                >
                  <Text style={styles(theme).secondaryBtnText}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles(theme).destructiveBtn}
                  onPress={onLogout || (() => { })}
                >
                  <Text style={styles(theme).destructiveBtnText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = (theme) => StyleSheet.create({
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

  // ─── Theme Settings Panel ───
  themePanel: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  themeSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  themeModeRow: {
    marginBottom: 16,
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.muted100,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: theme.colors.text,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  // Footer
  bottomRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: 8,
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
