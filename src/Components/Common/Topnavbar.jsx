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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Bell } from 'lucide-react-native';
import theme from '../../Themes/Themes';
// Removed app logo per request
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile } from '../../Services/Common/authServices';
import { BASE_URL } from '../../Config/api';

const { width } = Dimensions.get('window');

const TopNavbar = () => {
  const [fullName, setFullName] = React.useState('User');
  const [avatar, setAvatar] = React.useState(null);

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
              const photoFields = ['profile_photo','avatar','photo_url','profile_pic','photo'];
              let photoVal = null;
              for (const f of photoFields) { if (data[f]) { photoVal = data[f]; break; } }
              setFullName(name);
              setAvatar(buildAvatarUri(photoVal));
              return;
            }
          } catch {}
        }
        const raw = await AsyncStorage.getItem('userInfo');
        const info = raw ? JSON.parse(raw) : null;
        const name = info?.full_name || info?.username || info?.user_name || 'User';
        const photo = info?.avatar || info?.profile_image || info?.photo_url || null;
        setFullName(name);
        setAvatar(photo);
      } catch {}
    };
    loadUser();
  }, []);

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={Platform.OS === 'ios' ? ['top', 'left', 'right'] : ['top', 'left', 'right']}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
        translucent={false}
      />

      {/* Top Row removed (logo and bell icon) */}
      <View style={styles.topNavbar} />

      <View style={styles.greetingRow}>
        <View style={styles.leftRow}>
          <Image
            source={avatar ? { uri: avatar } : { uri: 'https://i.pravatar.cc/150?img=3' }}
            style={styles.avatar}
          />
          <Text style={styles.greeting} numberOfLines={1}>{getGreeting()}, {fullName}!</Text>
        </View>
        <TouchableOpacity style={styles.bellButton} activeOpacity={0.7}>
          <Bell size={22} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search Bar with Icon Prefix */}
      <View style={styles.searchContainer}>
        <Search size={16} color={theme.colors.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor={theme.colors.gray}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    // Reserve space below for the overlapping search bar (height 45 -> half 22 + extra)
    marginBottom: 44,
  },
  topNavbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: width * 0.7,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginLeft: 10,
    flexShrink: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: theme.colors.white,
    marginRight: 1,
    
  },
  bellButton: {
    padding: 6,
    alignSelf: 'flex-start',
    marginTop:6,
  },
  textContainer: {
    marginLeft: 10,
    flex: 1,
  },
  greeting: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  subGreeting: {
    color: theme.colors.white,
    fontSize: 12,
    marginTop: 2,
  },
  searchContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: -16, // push search a bit lower so it doesn't cover avatar/greeting
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 45,
    alignSelf: 'center',
    paddingVertical: Platform.OS === 'android' ? 6 : 8,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
  },


  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.black,
    marginLeft: 8, //  Space between icon and text
    paddingVertical: 0, // Prevents extra internal padding (especially on iOS)
  },
  greeting: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default TopNavbar;