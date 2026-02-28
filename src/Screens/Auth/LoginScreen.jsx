import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import theme from "../../Themes/Themes";
import WorkManaLogo from "../../Assets/WorkManaLogo";

const LoginScreen = ({ navigation }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    navigation.replace("Main", { screen: "Home" });
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
        style={styles.button}
        onPress={handleLogin}
      >
        <Text style={styles.buttonText}>Login</Text>
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
