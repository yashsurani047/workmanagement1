import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../HomeScreen";
import ProfileScreen from "../ProfileScreen";
import ProjectDetails from "../Project/ProjectDetailViewScreen.jsx";
import Bottomnav from "../../Components/Common/Bottomnav.jsx";
import AddTask from "../Tasks/AddTask.jsx";
import CreateEvent from "../Event/CreateEvent.jsx";
import CreatMeeting from "../Meeting/CreatMeeting.jsx";
import MeetingDetailsList from "../../Components/Meeting/MeetingDetailsList.jsx";
import MeetingDetail from "../Meeting/MeetingDetail.jsx";
import CreateProjectScreen from "../Project/CreateProjectScreen.jsx";
import CreateTaskWizardScreen from "../Project/CreateTaskWizardScreen.jsx";
import CreateSprintTaskWizardScreen from "../Project/CreateSprintTaskWizardScreen.jsx";
import EventDetailsList from "../../Components/Event/EventDetailsList.jsx";
import theme from "../../Themes/Themes";
import TakeSprintTask from "../../Components/Projects/ProjectDetails/TakeSprintTask.jsx";
import TaskStatusChange from "../../Components/Projects/ProjectDetails/TaskStatusChange.jsx";
import TaskStatusLogs from "../../Components/Projects/ProjectDetails/TaskStatusLogs.jsx";
import ProjectsListScreen from "../ProjectsListScreen.jsx";
import TasksListScreen from "../TasksListScreen.jsx";

// Create navigators
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Simple placeholder for the home stack

// Main navigation container
function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{  
        headerShown: false,
      }}
    >
      <Stack.Screen name="Tabs">
        {() => (
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarStyle: {
                backgroundColor: theme.colors.background,
                borderTopColor: theme.colors.border,
                height: 60,
                paddingBottom: 6,
                paddingTop: 6,
              },
            }}
            tabBar={(props) => <Bottomnav {...props} />}
          >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
          </Tab.Navigator>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="Project"
        component={ProjectDetails}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateProject"
        component={CreateProjectScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProjectsList"
        component={ProjectsListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TasksList"
        component={TasksListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateEvent"
        component={CreateEvent}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EventDetailsList"
        component={EventDetailsList}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Meeting"
        component={CreatMeeting}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddTask"
        component={AddTask}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProjectDetails"
        component={ProjectDetails}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MeetingDetailsList"
        component={MeetingDetailsList}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MeetingDetail"
        component={MeetingDetail}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateTaskWizard"
        component={CreateTaskWizardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateSprintTaskWizard"
        component={CreateSprintTaskWizardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TakeSprintTask"
        component={TakeSprintTask}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TaskStatusChange"
        component={TaskStatusChange}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TaskStatusLogs"
        component={TaskStatusLogs}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default MainNavigator;
