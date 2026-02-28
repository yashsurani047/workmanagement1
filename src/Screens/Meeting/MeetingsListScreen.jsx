// src/Screens/Meeting/MeetingsListScreen.jsx
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import TopNavbar from "../../Components/Common/Topnavbar";
import MeetingDetailsList from "../../Components/Meeting/MeetingDetailsList";
import { useTheme } from "../../Themes/ThemeContext";

const MeetingsListScreen = ({ navigation }) => {
    const { theme } = useTheme();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["bottom"]}>
            <TopNavbar navigation={navigation} />
            <MeetingDetailsList />
        </SafeAreaView>
    );
};

export default MeetingsListScreen;
