import { useFocusEffect } from "expo-router";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../tools/api";
import Loader from "../../tools/loader";

export default function HomeScreen() {
  const [loading, setLoading] = React.useState(true);

  const [artists, setArtists] = React.useState([]);

  const getArtists = async () => {
    setLoading(true);
    await api
      .get("/artists", {
        params: {
          limit: 100,
          offset: 0,
        },
      })
      .then((response) => {
        setArtists(response.data.rows);
      })
      .catch((error) => {})
      .finally(() => {
        setLoading(false);
      });
  };

  useFocusEffect(
    React.useCallback(() => {
      getArtists();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/home.png")}
        style={{
          width: "100%",
          height: 390,
          position: "absolute",
          top: -2,
          left: 0,
          right: 0,
        }}
        resizeMode="contain"
      />
      {loading ? (
        <Loader />
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.subtitle}>
              Confira nossa seleção de artistas
              <Text style={{ fontWeight: "800" }}> mais populares</Text>
            </Text>
          </View>
          <View
            style={{
              width: "95%",
              height: 5,
              backgroundColor: "#e9edc9",
              marginBottom: 10,
              borderRadius: 100,
              alignSelf: "center",
            }}
          />
          <ScrollView
            style={styles.content}
            contentContainerStyle={{
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "space-between",
              flexDirection: "row",
              alignItems: "center",
            }}
            showsVerticalScrollIndicator={false}
          >
            {artists.map((artist, index) => (
              <View key={index} style={styles.card}>
                <Text style={[styles.bodySubtitle]}>#{index + 1}</Text>
                <Text style={{ color: "#0a6d4f", fontWeight: "bold" }}>
                  {artist.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fffbf3",
    padding: 10,
    justifyContent: "flex-end",
  },
  header: {
    marginBottom: 10,
    display: "flex",
    flexDirection: "row",
    width: "80%",
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#accbde",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#accbde",
    zIndex: 1,
    maxWidth: "100%",
  },
  bodySubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0a6d4f",
    zIndex: 1,
    maxWidth: "70%",
    textShadowColor: "#e9edc9",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    flex: 1,
    maxHeight: "70%",
    padding: 10,
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
