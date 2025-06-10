import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "toastify-react-native";
import { api } from "../tools/api";
import Loader from "../tools/loader";

export default function RecommendationsScreen() {
  const [loading, setLoading] = React.useState(false);
  const [recommendations, setRecommendations] = React.useState([]);
  const [user, setUser] = React.useState(null);
  const [limit, setLimit] = React.useState(10);

  const getRecommendations = async () => {
    setLoading(true);
    await api
      .get(`/users/${user?.id}/recommendations`, {
        params: {
          n: limit,
        },
      })
      .then((response) => {
        console.log("Recommendations response:", response.data);

        setRecommendations(response.data);
      })
      .catch((error) => {
        Toast.error(
          error.response?.data?.error || "Erro ao obter recomendações",
          {
            duration: 3000,
            position: "top",
          }
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const getUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      console.log("userData", userData);

      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Erro ao obter usuário:", error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      getUser();
      if (!user) {
        return;
      }
      getRecommendations();
    }, [user?.id, limit])
  );

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/recommendations.png")}
        style={{
          width: "100%",
          height: 390,
          alignSelf: "center",
          position: "absolute",
          top: -5,
        }}
        resizeMode="contain"
      />
      {loading ? (
        <Loader />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: "80%" }}
          contentContainerStyle={{
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "space-between",
            flexDirection: "row",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Text style={styles.title}>Suas Recomendações</Text>
          <Text style={styles.subtitle}>
            Aqui estão as recomendações personalizadas para você.
          </Text>
          {recommendations.map((item, index) => (
            <View key={index} style={styles.card}>
              <Text>{item?.artistDetails?.name}</Text>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => {
              setLimit((prev) => prev + 10);
            }}
            style={{
              backgroundColor: "#accbde",
              padding: 10,
              borderRadius: 5,
              alignItems: "center",
              width: "100%",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>
              Carregar mais
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "flex-end",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  card: {
    borderWidth: 3,
    borderColor: "#accbde",
    width: "48%",
    paddingBlock: 20,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
});
