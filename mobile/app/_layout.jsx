import { useColorScheme } from "@/hooks/useColorScheme";
import Entypo from "@expo/vector-icons/Entypo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TouchableOpacity } from "react-native";
import "react-native-reanimated";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  const router = useRouter();

  const logOut = async () => {
    try {
      await AsyncStorage.removeItem("user");
      router.push({
        pathname: "/(tabs)",
        params: { screen: "home" },
      });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="recommendations"
          options={{
            title: "Suas Recomendações",
            headerStyle: { backgroundColor: "#e9edc9" },
            headerShadowVisible: false,
            headerLeft: () => {
              return (
                <TouchableOpacity
                  style={{ padding: 10 }}
                  onPress={() => {
                    router.push({
                      pathname: "/(tabs)",
                      params: { screen: "home" },
                    });
                  }}
                >
                  <Entypo name="chevron-left" size={24} color="black" />
                </TouchableOpacity>
              );
            },
            headerRight: () => {
              return (
                <TouchableOpacity
                  style={{ padding: 10 }}
                  onPress={() => {
                    logOut();
                  }}
                >
                  <Entypo name="log-out" size={24} color="black" />
                </TouchableOpacity>
              );
            },
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
