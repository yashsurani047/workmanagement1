// src/components/TopNavbar.jsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  Dimensions,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search, Bell } from 'lucide-react-native';
import { useTheme } from '../../Themes/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile } from '../../Services/Common/authServices';
import { BASE_URL } from '../../Config/api';
import Drawerbar from './Drawerbar';

const { width } = Dimensions.get('window');

const TopNavbar = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [fullName, setFullName] = React.useState('User');
  const [avatar, setAvatar] = React.useState(null);
  const [drawerVisible, setDrawerVisible] = React.useState(false);

  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const pressAnim = React.useRef(new Animated.Value(1)).current;
  const spinnerAnim = React.useRef(new Animated.Value(0)).current;

  const combinedScale = Animated.multiply(pulseAnim, pressAnim);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const buildAvatarUri = (profile_pic) => {
    if (!profile_pic) return null;
    if (profile_pic.startsWith('data:')) return profile_pic;
    if (profile_pic.startsWith('http://') || profile_pic.startsWith('https://')) return profile_pic;
    if (profile_pic.length > 200) return `data:image/png;base64,${profile_pic}`;
    const base = (BASE_URL || '').replace(/\/$/, '');
    return `${base}/${String(profile_pic).replace(/^\//, '')}`;
  };

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          try {
            const resp = await getUserProfile(userId);
            if (resp?.success && resp?.data) {
              const data = resp.data;
              const name = data.full_name || data.username || data.user_name || 'User';
              const photoFields = ['profile_photo', 'avatar', 'photo_url', 'profile_pic', 'photo'];
              let photoVal = null;
              for (const f of photoFields) {
                if (data[f]) {
                  photoVal = data[f];
                  break;
                }
              }
              setFullName(name);
              setAvatar(buildAvatarUri(photoVal));
              return;
            }
          } catch { }
        }
        const raw = await AsyncStorage.getItem('userInfo');
        const info = raw ? JSON.parse(raw) : null;
        const name = info?.full_name || info?.username || info?.user_name || 'User';
        const photo = info?.avatar || info?.profile_image || info?.photo_url || null;
        setFullName(name);
        setAvatar(photo);
      } catch { }
    };
    loadUser();
  }, []);

  // Gentle continuous pulse
  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  // Spinning ring
  React.useEffect(() => {
    spinnerAnim.setValue(0);
    const spinLoop = Animated.loop(
      Animated.timing(spinnerAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.start();
    return () => spinLoop.stop();
  }, [spinnerAnim]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userId', 'userInfo']);
      setDrawerVisible(false);
      setTimeout(() => {
        navigation.reset && navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }, 150);
    } catch (e) { }
  };

  const handleAvatarPress = () => {
    Animated.sequence([
      Animated.timing(pressAnim, {
        toValue: 1.2,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(pressAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDrawerVisible(true);
    });
  };

  return (
    <SafeAreaView
      style={[s.safeArea, { backgroundColor: theme.colors.primary }]}
      edges={Platform.OS === 'ios' ? ['top', 'left', 'right'] : ['top', 'left', 'right']}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
        translucent={false}
      />


      <View style={s.greetingRow}>
        <View style={s.leftRow}>
          <TouchableOpacity
            onPress={handleAvatarPress}
            activeOpacity={0.8}
          >
            <View style={s.avatarContainer}>
              <Animated.Image
                source={avatar ? { uri: avatar } : { uri: 'https://i.pravatar.cc/150?img=3' }}
                style={[
                  s.avatar,
                  {
                    transform: [{ scale: combinedScale }],
                    borderColor: 'rgba(255,255,255,0.4)',
                    borderWidth: 1.5,
                  },
                ]}
              />
              <Animated.View
                style={[
                  s.spinnerRing,
                  {
                    borderColor: 'rgba(255,255,255,0.3)',
                    borderTopColor: '#FFF',
                    transform: [
                      {
                        rotate: spinnerAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
          </TouchableOpacity>
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>
              {getGreeting()},
            </Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: -0.4 }} numberOfLines={1}>
              {fullName}!
            </Text>
          </View>
        </View>

        <TouchableOpacity style={s.actionButton} activeOpacity={0.7}>
          <View style={s.iconBadge}>
            <Bell size={20} color="#FFF" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Drawer overlay */}
      <Drawerbar
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onLogout={handleLogout}
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safeArea: {
    paddingTop: Platform.OS === 'ios' ? 0 : 2,
    paddingBottom: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  topNavbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 23,
  },
  spinnerRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 27,
    borderWidth: 1.5,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: '#008080', // same as primary
  },
  statusRow: {
    height: 0,
    opacity: 0,
  },
});

export default TopNavbar;
