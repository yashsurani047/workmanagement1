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
import { CommonActions } from "@react-navigation/native";
import { getUserProfile } from "../Services/Common/authServices";
import { BASE_URL } from "../Config/api";
import theme from "../Themes/Themes";

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

    // Base64 string
    if (profile_pic.startsWith("data:")) return profile_pic;

    // Full URL
    if (profile_pic.startsWith("http://") || profile_pic.startsWith("https://"))
      return profile_pic;

    // Base64 without prefix
    if (profile_pic.length > 200) {
      return `data:image/png;base64,${profile_pic}`;
    }

    // Relative path
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

        if (!profileResponse.success) {
          throw new Error("Failed to fetch profile");
        }

        const data = profileResponse.data;
        setProfile(data);

        // Set Photo
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

        // Set Email
        const emailFields = ["email", "user_primary_email_id", "user_email"];
        for (const f of emailFields) {
          if (data[f]) {
            setEmail(data[f]);
            break;
          }
        }

        // Set Mobile
        const mobileFields = ["mobile", "user_primary_mobile_no", "phone"];
        for (const f of mobileFields) {
          if (data[f]) {
            setMobile(data[f]);
            break;
          }
        }

        // Set Address
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

  // 🔥 Logout Working 100%
  const handleLogout = async () => {
    try {
      // Clear all async storage
      await AsyncStorage.multiRemove(["userToken", "userId", "userInfo"]);
      
      // Show success message
      Toast.show({
        type: "success",
        text1: "Logged out successfully!",
        visibilityTime: 1500,
        position: 'bottom'
      });

      // Wait for toast to show, then navigate
      setTimeout(() => {
        // Reset navigation stack and go to Login
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }, 1000);

    } catch (error) {
      console.error("Logout error:", error);
      Toast.show({
        type: "error",
        text1: "Error during logout. Please try again.",
        visibilityTime: 2000,
        position: 'bottom'
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
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
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>User Profile</Text>

          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
          ) : (
            <View style={styles.placeholderPhoto}>
              <Text style={styles.placeholderText}>No Photo</Text>
            </View>
          )}

          <View style={styles.infoContainer}>
            <ProfileItem label="Full Name" value={profile.full_name || "N/A"} />
            <ProfileItem label="Email" value={email || "N/A"} />
            <ProfileItem label="Mobile" value={mobile || "N/A"} />
            <ProfileItem label="Address" value={address || "N/A"} />
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Toast Provider MUST be inside return */}
      <Toast config={CustomToast} />
    </>
  );
};

const ProfileItem = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  card: {
    width: "100%",
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
  },
  profilePhoto: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: theme.spacing.lg,
  },
  placeholderPhoto: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: theme.colors.muted100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  placeholderText: {
    color: theme.colors.textSecondary,
  },
  infoContainer: {
    width: "100%",
    marginBottom: theme.spacing.lg,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: theme.spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  value: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  logoutButton: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.radius.sm,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
    width: "100%",
  },
  logoutButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: "600",
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    fontSize: 16,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
});

export default ProfileScreen;
