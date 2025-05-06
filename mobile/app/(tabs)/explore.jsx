import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image, StyleSheet, Text, View } from "react-native";
import { Button, TextInput } from "react-native-paper";

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Procurando por algo?</Text>
        <Text style={styles.subtitle}>
          Nos diga abaixo qual seu mood do dia e vamos te ajudar a encontrar
          músicas que se encaixem perfeitamente!
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <TextInput
          label=""
          mode="flat"
          style={{
            backgroundColor: "#8d99ae",
            borderRadius: 10,
            width: "80%",
            height: 65,
          }}
          theme={{
            colors: {
              primary: "#8d99ae",
              text: "#2b2d42",
              placeholder: "#2b2d42",
              background: "#8d99ae",
              surface: "#8d99ae",
            },
            roundness: 10,
          }}
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          selectionColor="#2b2d42"
          placeholderTextColor="#2b2d42"
          placeholder="Digite aqui o que você procura"
          textColor="#2b2d42"
        />
        <Button
          onPress={() => console.log("Procurar")}
          style={{
            backgroundColor: "#8d99ae",
            borderRadius: 100,
            width: 50,
            height: 65,
            justifyContent: "center",
            display: "flex",
            position: "relative",
          }}
        >
          <MaterialIcons
            name="search"
            size={26}
            color="#2b2d42"
            style={{ marginTop: 10 }}
          />
        </Button>
      </View>
      <Image
        source={require("../../assets/images/search.png")}
        style={{
          width: "100%",
          height: 300,
          borderRadius: 10,
          marginTop: 100,
        }}
      />
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
});
