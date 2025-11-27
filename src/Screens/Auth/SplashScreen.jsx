import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import theme from "../../Themes/Themes";
import WorkManaLogo from "../../Assets/WorkManaLogo"; // SVG Logo

const SplashScreen = ({ navigation }) => {
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslate, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    let timer;
    const checkSessionAndNavigate = async () => {
      try {
        const [token, userId] = await Promise.all([
          AsyncStorage.getItem("userToken"),
          AsyncStorage.getItem("userId"),
        ]);
        const isLoggedIn = Boolean(token || userId);
        timer = setTimeout(() => {
          if (isLoggedIn) {
            navigation.replace("Main", { screen: "Home" });
          } else {
            navigation.replace("Login");
          }
        }, 1200);
      } catch (e) {
        timer = setTimeout(() => navigation.replace("Login"), 1200);
      }
    };

    checkSessionAndNavigate();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [navigation, logoOpacity, logoScale, titleOpacity, titleTranslate]);

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle="dark-content"
      />

      {/* Logo animation */}
      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
          marginBottom: 16,
        }}
      >
        <WorkManaLogo height={130} width={130} />
      </Animated.View>

      {/* Title animation */}
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslate }],
          },
        ]}
      >
        WorkManagement
      </Animated.Text>

      {/* Loading Indicator */}
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading workspace...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: theme.colors.primary,
    marginTop: 20,
    letterSpacing: 0.5,
  },
  loaderContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.textSecondary || "#888",
  },
});

export default SplashScreen;
