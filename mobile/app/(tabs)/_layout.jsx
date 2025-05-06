import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { useColorScheme } from "@/hooks/useColorScheme";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Octicons from "@expo/vector-icons/Octicons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#edf2f4",
        tabBarInactiveTintColor: "#edf2f480",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
          },
          default: {
            position: "absolute",
            backgroundColor: "#8d99ae",
            borderRadius: 10,
            width: "90%",
            bottom: 20,
            left: "5%",
            right: "5%",
            justifyContent: "center",
            borderTopColor: "transparent",
            borderTopWidth: 0,
            height: 60,
          },
        }),
        tabBarShowLabel: false,
        tabBarIconStyle: {
          marginBottom: 0,
          marginTop: 0,
          position: "absolute",
          top: "25%",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => (
            <Octicons size={28} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={30} name="search" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome size={26} name="user-o" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
