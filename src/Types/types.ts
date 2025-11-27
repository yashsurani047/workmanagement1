// Types/types.ts
import { NavigatorScreenParams } from "@react-navigation/native";

export type BottomTabParamList = {
  Home: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Main: NavigatorScreenParams<BottomTabParamList>;
  Project: undefined;
  AddTask: undefined;
  Meeting: undefined;
  CreateEvent: undefined;
};

// ✅ Global declaration for TypeScript
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
