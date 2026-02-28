import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { getUserProfile } from "../Services/Common/authServices";
import { BASE_URL } from "../Config/api";
import { useTheme } from "../Themes/ThemeContext";

// Custom Toast Component
import CustomToast from "../Components/Common/CustomToast";

const ProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [email, setEmail] = useState(null);
  const [mobile, setMobile] = useState(null);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const buildAvatarUri = (profile_pic) => {
    if (!profile_pic) return null;
    if (profile_pic.startsWith("data:")) return profile_pic;
    if (profile_pic.startsWith("http://") || profile_pic.startsWith("https://"))
      return profile_pic;
    if (profile_pic.length > 200) return `data:image/png;base64,${profile_pic}`;

    const base = BASE_URL.replace(/\/$/, "");
    return `${base}/${profile_pic.replace(/^\//, "")}`;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
          setError("User session expired. Please login again.");
          setLoading(false);
          return;
        }

        const profileResponse = await getUserProfile(userId);
        if (!profileResponse.success) throw new Error("Failed to fetch profile");

        const data = profileResponse.data;
        setProfile(data);

        const photoFields = [
          "profile_photo",
          "avatar",
          "photo_url",
          "profile_pic",
          "photo",
        ];
        for (const f of photoFields) {
          if (data[f]) {
            setProfilePhoto(buildAvatarUri(data[f]));
            break;
          }
        }

        const emailFields = ["email", "user_primary_email_id", "user_email"];
        for (const f of emailFields) {
          if (data[f]) {
            setEmail(data[f]);
            break;
          }
        }

        const mobileFields = ["mobile", "user_primary_mobile_no", "phone"];
        for (const f of mobileFields) {
          if (data[f]) {
            setMobile(data[f]);
            break;
          }
        }

        const addressFields = ["address", "user_address"];
        for (const f of addressFields) {
          if (data[f]) {
            setAddress(data[f]);
            break;
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(["userToken", "userId", "userInfo"]);
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, marginTop: theme.spacing.sm }}>
          Loading profile...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.colors.error }]} onPress={handleLogout}>
          <Text style={[styles.logoutButtonText, { color: theme.colors.white }]}>Logout & Return to Login</Text>
        </TouchableOpacity>
        <Toast config={CustomToast} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.background, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Top header with solid color */}
      <View style={[styles.headerBackground, { backgroundColor: theme.colors.primary, borderBottomLeftRadius: theme.radius.lg, borderBottomRightRadius: theme.radius.lg }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { color: theme.colors.white }]}>{"\u2190"}</Text>
        </TouchableOpacity>
        <View style={[styles.avatarWrapper, { backgroundColor: theme.colors.muted100 }]}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.avatar} />
          ) : (
            <View style={[styles.placeholderPhoto, { backgroundColor: theme.colors.muted200 }]}>
              <Text style={{ color: theme.colors.textSecondary }}>No Photo</Text>
            </View>
          )}
        </View>
        <Text style={[styles.name, { color: theme.colors.white }]}>{profile?.full_name || "No Name"}</Text>
        <Text style={[styles.email, { color: theme.colors.white }]}>{email || "No Email"}</Text>
      </View>

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1 }]}>
        <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.infoLabel, { color: theme.colors.primary }]}>Name:</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{profile?.full_name || "N/A"}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.infoLabel, { color: theme.colors.primary }]}>Email:</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{email || "N/A"}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.infoLabel, { color: theme.colors.primary }]}>Mobile:</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{mobile || "N/A"}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.infoLabel, { color: theme.colors.primary }]}>Address:</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{address || "N/A"}</Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={[styles.logoutButtonFull, { backgroundColor: theme.colors.error }]} onPress={handleLogout}>
        <Text style={[styles.logoutButtonText, { color: theme.colors.white }]}>Logout</Text>
      </TouchableOpacity>

      <Toast config={CustomToast} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    paddingBottom: 40,
    alignItems: "center",
  },
  headerBackground: {
    width: "100%",
    paddingVertical: 48,
    paddingTop: 64,
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 24,
    marginTop: 16,
    left: 24,
    padding: 4,
    borderRadius: 12,
  },
  backIcon: {
    fontSize: 22,
    fontWeight: "700",
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 115,
    height: 115,
    borderRadius: 60,
  },
  placeholderPhoto: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  infoCard: {
    width: "90%",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 28,
    elevation: 5,
    marginTop: -24,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 0.7,
  },
  infoLabel: {
    fontWeight: "600",
  },
  infoValue: {},
  logoutButtonFull: {
    width: "70%",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    elevation: 3,
    marginTop: 24,
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  logoutButtonText: {
    fontWeight: "700",
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
});

export default ProfileScreen;