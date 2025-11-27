import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CheckCircle, XCircle } from "lucide-react-native";
import theme from "../../Themes/Themes";
import Toast from "react-native-toast-message";

// Custom toast component
const CustomToast = ({ text1, type }) => {
  const isSuccess = type === "success";

  return (
    <View
      style={[
        styles.toastContainer,
        { 
          backgroundColor: isSuccess ? theme.colors.success : theme.colors.error,
        }
      ]}
    >
      {isSuccess ? (
        <CheckCircle color={theme.colors.white} size={22} style={styles.icon} />
      ) : (
        <XCircle color={theme.colors.white} size={22} style={styles.icon} />
      )}
      <Text style={styles.toastText}>{text1}</Text>
    </View>
  );
};

// Toast configuration
const toastConfig = {
  success: (props) => <CustomToast {...props} type="success" />,
  error: (props) => <CustomToast {...props} type="error" />,
};

// Export the Toast component with config
export const ToastComponent = () => (
  <Toast config={toastConfig} position="bottom" />
);

// Helper function to show toast
export const showCustomToast = (type, message, time = 2000) => {
  const toastType = type === 'error' ? 'error' : 'success';
  Toast.show({
    type: toastType,
    text1: message,
    visibilityTime: time,
    autoHide: true,
    position: 'bottom',
  });
};

const styles = StyleSheet.create({
  toastContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 40,
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    elevation: 6,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  icon: {
    marginRight: 8,
  },
  toastText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CustomToast;
