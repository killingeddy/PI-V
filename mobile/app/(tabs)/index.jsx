import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bem-vindo!</Text>
        <Text style={styles.subtitle}>
          Confira a seguir as recomendações que temos para você baseado no seu
          perfil
        </Text>
      </View>
      <View style={styles.content}>
        <View style={styles.card}></View>
        <View style={styles.card}></View>
        <View style={styles.card}></View>
        <View style={styles.card}></View>
        <View style={styles.card}></View>
        <View style={styles.card}></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2b2d42",
    padding: 10,
  },
  header: {
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#8d99ae",
    paddingBottom: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8d99ae",
  },
  subtitle: {
    fontSize: 16,
    color: "#8d99ae",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    backgroundColor: "#8d99ae",
    width: 170,
    height: 170,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
