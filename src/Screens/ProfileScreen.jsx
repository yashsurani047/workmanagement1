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
import theme from "../Themes/Themes"; // your theme import

// Custom Toast Component
import CustomToast from "../Components/Common/CustomToast";

const ProfileScreen = ({ navigation }) => {
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, marginTop: theme.spacing.sm }}>
          Loading profile...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout & Return to Login</Text>
        </TouchableOpacity>
        <Toast config={CustomToast} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.background}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Top header with solid color */}
      <View style={styles.headerBackground}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>{"\u2190"}</Text>
        </TouchableOpacity>
        <View style={styles.avatarWrapper}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderPhoto}>
              <Text style={styles.placeholderText}>No Photo</Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{profile?.full_name || "No Name"}</Text>
        <Text style={styles.email}>{email || "No Email"}</Text>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name:</Text>
          <Text style={styles.infoValue}>{profile?.full_name || "N/A"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{email || "N/A"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mobile:</Text>
          <Text style={styles.infoValue}>{mobile || "N/A"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Address:</Text>
          <Text style={styles.infoValue}>{address || "N/A"}</Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButtonFull} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <Toast config={CustomToast} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  container: {
    paddingBottom: theme.spacing.lg * 2,
    alignItems: "center",
  },
  headerBackground: {
    width: "100%",
    backgroundColor: theme.colors.primary, // solid color
    paddingVertical: theme.spacing.lg * 2,
    paddingTop: theme.spacing.lg * 2 + theme.spacing.md,
    alignItems: "center",
    borderBottomLeftRadius: theme.radius.lg,
    borderBottomRightRadius: theme.radius.lg,
  },
  backButton: {
    position: "absolute",
    top: theme.spacing.lg,
    marginTop: theme.spacing.md,
    left: theme.spacing.lg,
    padding: theme.spacing.xs,
    borderRadius: theme.radius.md,
  },
  backIcon: {
    fontSize: 22,
    color: theme.colors.white,
    fontWeight: "700",
  },
  avatarWrapper: {
    backgroundColor: theme.colors.muted100,
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.md,
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
    backgroundColor: theme.colors.muted200,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: theme.colors.textMuted,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.white,
  },
  email: {
    fontSize: 14,
    color: theme.colors.white,
    marginTop: theme.spacing.xs,
  },
  infoCard: {
    width: "90%",
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg + theme.spacing.sm,
    elevation: 5,
    marginTop: -theme.spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 0.7,
    borderBottomColor: theme.colors.borderSubtle,
  },
  infoLabel: {
    fontWeight: "600",
    color: theme.colors.project,
  },
  infoValue: {
    color: theme.colors.textSecondary,
  },
  logoutButtonFull: {
    backgroundColor: theme.colors.error,
    width: "70%",
    paddingVertical: theme.spacing.xs + theme.spacing.sm,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    elevation: 3,
    marginTop: theme.spacing.lg,
  },
  logoutButtonText: {
    color: theme.colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
});

export default ProfileScreen;