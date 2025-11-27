import 'react-native-gesture-handler';
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { Text } from 'react-native';
import AppNavigator from "./src/Screens/Navigation/Appnavigator";
import { ToastComponent } from "./src/Components/Common/CustomToast";

export default function App() {
  // Ensure all Text defaults to black unless explicitly overridden
  if (Text && Text.defaultProps == null) {
    Text.defaultProps = {};
  }
  if (Text) {
    const baseStyle = Text.defaultProps?.style;
    Text.defaultProps.style = Array.isArray(baseStyle)
      ? [...baseStyle, { color: '#000000' }]
      : baseStyle
      ? [baseStyle, { color: '#000000' }]
      : { color: '#000000' };
  }
  
  return (
    <NavigationContainer>
      <AppNavigator />
      <ToastComponent />
    </NavigationContainer>
  );
}
