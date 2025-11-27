import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showCustomToast } from "../../Components/Common/CustomToast";
import theme from "../../Themes/Themes";
import { loginUser } from "../../Services/Common/authServices";
import WorkManaLogo from "../../Assets/WorkManaLogo";

const LoginScreen = ({ navigation }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      showCustomToast('error', 'Please enter both username and password');
      return;
    }

    try {
      setLoading(true);
      const result = await loginUser(identifier, password);
      setLoading(false);

      if (result.success) {
        const userData = result.data;

        // 1. SAVE TOKEN
        if (userData?.token) {
          await AsyncStorage.setItem("userToken", userData.token);
          console.log(
            "Token saved in AsyncStorage:",
            userData.token.substring(0, 10) + "..."
          );
        } else {
          console.warn("No token in login response! Response:", userData);
        }

        // 2. SAVE USER ID
        const userId = userData?.user_id;
        if (userId) {
          await AsyncStorage.setItem("userId", String(userId));
          console.log("User ID stored:", userId);
        } else {
          console.warn("No user_id in login response");
        }

        // 3. SAVE FULL USER INFO
        const userInfo = {
          username: userData.username,
          full_name: userData.full_name,
          user_id: userData.user_id,
          organization_id: userData.organization_id,
          token: userData.token,
        };
        await AsyncStorage.setItem("userInfo", JSON.stringify(userInfo));
        console.log("✅ userInfo saved:", userInfo);

        // 3b. STORE organization_id separately for modules that read this key directly
        if (userData?.organization_id) {
          await AsyncStorage.setItem("organization_id", String(userData.organization_id));
        }

        // 4. SUCCESS TOAST
        showCustomToast('success', 'Login successful!');

        // 5. NAVIGATE TO MAIN (Home Tab)
       setTimeout(() => {
  navigation.replace("Main", { screen: "Home", params: { userId: userData.user_id } });
}, 1500);
      } else {
        console.log("Login failed:", result.error);
        showCustomToast('error', result.error || 'Invalid credentials');
      }
    } catch (error) {
      setLoading(false);
      console.error("Login error:", error);
      showCustomToast('error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <WorkManaLogo height={100} width={100} />

      <Text style={styles.title}>WorkManagement</Text>

      {/* Username / Email Input */}
      <View style={styles.inputContainer}>
        <Mail color={theme.colors.primary} size={20} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Username or Email"
          placeholderTextColor={theme.colors.textSecondary}
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
        />
      </View>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <Lock color={theme.colors.primary} size={20} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          {showPassword ? (
            <EyeOff color={theme.colors.primary} size={20} />
          ) : (
            <Eye color={theme.colors.primary} size={20} />
          )}
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

    </View>
  );
};

// ✅ Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: theme.colors.primary,
    marginBottom: 30,
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    width: "100%",
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default LoginScreen;
