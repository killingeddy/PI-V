import { StyleSheet, Text, View } from "react-native";
import { TextInput } from "react-native-paper";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Seu perfil</Text>
        <Text style={styles.subtitle}>
          Esse é o seu perfil, aqui você pode alterar suas preferências e nos
          ajudar a te recomendar músicas que você realmente vai gostar!
        </Text>
      </View>
      <View style={{ flexDirection: "column", gap: 5, marginBottom: 10 }}>
        <Text style={styles.label}>Nome</Text>
        <TextInput
          label=""
          mode="flat"
          style={{
            backgroundColor: "#8d99ae",
            borderRadius: 10,
            width: "100%",
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
          placeholder="Digite seu nome"
          textColor="#2b2d42"
        />
      </View>
      <View style={{ flexDirection: "column", gap: 5, marginBottom: 10 }}>
        <Text style={styles.label}>Usuário</Text>
        <TextInput
          label=""
          mode="flat"
          style={{
            backgroundColor: "#8d99ae",
            borderRadius: 10,
            width: "100%",
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
          placeholder="Digite seu usuário"
          textColor="#2b2d42"
        />
      </View>
      <View style={{ flexDirection: "column", gap: 5, marginBottom: 10 }}>
        <Text style={styles.label}>Gênero favorito</Text>
        <TextInput
          label=""
          mode="flat"
          style={{
            backgroundColor: "#8d99ae",
            borderRadius: 10,
            width: "100%",
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
          placeholder="Digite seu gênero favorito"
          textColor="#2b2d42"
        />
      </View>
      <View style={{ flexDirection: "column", gap: 5, marginBottom: 10 }}>
        <Text style={styles.label}>Música favorita</Text>
        <TextInput
          label=""
          mode="flat"
          style={{
            backgroundColor: "#8d99ae",
            borderRadius: 10,
            width: "100%",
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
          placeholder="Digite sua música favorita"
          textColor="#2b2d42"
        />
      </View>
      <View style={{ flexDirection: "column", gap: 5, marginBottom: 10 }}>
        <Text style={styles.label}>Artista favorito</Text>
        <TextInput
          label=""
          mode="flat"
          style={{
            backgroundColor: "#8d99ae",
            borderRadius: 10,
            width: "100%",
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
          placeholder="Digite seu artista favorito"
          textColor="#2b2d42"
        />
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
  label: {
    fontSize: 16,
    color: "#8d99ae",
    fontWeight: "600",
  },
});
