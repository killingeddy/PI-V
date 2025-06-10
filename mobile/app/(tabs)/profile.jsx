import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput } from "react-native-paper";
import ToastManager, { Toast } from "toastify-react-native";
import { api } from "../../tools/api";
import Loader from "../../tools/loader";

export default function ProfileScreen() {
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");

  const [authType, setAuthType] = React.useState("login");
  const [registerStep, setRegisterStep] = React.useState(1);

  const [selectedArtists, setSelectedArtists] = React.useState([]);

  const [countdown, setCountdown] = React.useState(10);

  const [loading, setLoading] = React.useState(false);
  const [registering, setRegistering] = React.useState(false);

  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      Toast.error("Por favor, preencha todos os campos", {
        duration: 3000,
        position: "top",
      });
      return;
    }

    setLoading(true);

    await api
      .post("/users/login", {
        username,
        password,
      })
      .then((response) => {
        console.log("Login response:", response.data);
        AsyncStorage.setItem("user", JSON.stringify(response.data));
        router.push("/recommendations");
      })
      .catch((error) => {
        Toast.error(error.response?.data?.error || "Erro ao fazer login", {
          duration: 3000,
          position: "top",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const getUser = async () => {
    try {
      const user = await AsyncStorage.getItem("user");
      if (user) {
        router.push("/recommendations");
      }
    } catch (error) {
      console.error("Erro ao obter usuário:", error);
    }
  };

  const handleRegister = async () => {
    if (!name || !username || !password) {
      Toast.error("Por favor, preencha todos os campos", {
        duration: 3000,
        position: "top",
      });
      return;
    }

    setRegistering(true);
    setLoading(true);
    await api
      .post("/users", {
        name,
        username,
        password,
      })
      .then(async (response) => {
        handleRegisterArtists(response.data.id);
        await AsyncStorage.setItem(
          "user",
          JSON.stringify({
            id: response.data.id,
            name: response.data.name,
            username: response.data.username,
          })
        );
      })
      .catch((error) => {
        setRegistering(false);
        setLoading(false);
        Toast.error(error.response?.data?.error || "Erro ao cadastrar", {
          duration: 3000,
          position: "top",
        });
      });
  };

  const handleRegisterArtists = async (userId) => {
    if (selectedArtists.length === 0) {
      Toast.error("Por favor, selecione pelo menos um artista", {
        duration: 3000,
        position: "top",
      });
      return;
    }
    setRegistering(true);
    setLoading(true);
    await api
      .post(`/users/preferences/${userId}`, {
        artistsId: selectedArtists,
      })
      .then((response) => {
        Toast.success("Preferências salvas com sucesso!", {
          duration: 3000,
          position: "top",
        });
        setCountdown(10);
        setTimeout(() => {
          router.push("/recommendations");

          setRegistering(false);
          setLoading(false);
        }, 10000);
        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(interval);
      })
      .catch((error) => {
        Toast.error(
          error.response?.data?.error || "Erro ao salvar preferências",
          {
            duration: 3000,
            position: "top",
          }
        );

        setRegistering(false);
        setLoading(false);
      });
  };

  const [artists, setArtists] = React.useState([]);

  const getArtists = async () => {
    if (!searchQuery) {
      setArtists([]);
      return;
    }
    setLoading(true);
    await api
      .get("/artists", {
        params: {
          limit: 100000,
          search: searchQuery,
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
      getUser();
      getArtists();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/login.png")}
        style={{
          width: "100%",
          height: 390,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
        }}
        resizeMode="contain"
      />
      <View style={{ height: "67%", width: "100%" }}>
        {loading || registering ? (
          <>
            {authType === "register" && registerStep === 2 && registering ? (
              <View>
                <Image
                  source={require("../../assets/images/loading.gif")}
                  style={{
                    width: 300,
                    height: 300,
                    alignSelf: "center",
                    marginTop: 50,
                  }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "#0a6d4f",
                  }}
                >
                  Você tem um gosto e tanto!
                </Text>
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 16,
                    color: "#0a6d4f",
                  }}
                >
                  O sistema está aprendendo sobre você e preparando suas
                  recomendações personalizadas.
                </Text>
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 16,
                    color: "#0a6d4f",
                  }}
                >
                  Aguarde {countdown} segundos para ser redirecionado.
                </Text>
              </View>
            ) : (
              <Loader />
            )}
          </>
        ) : (
          <>
            <View
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                style={{
                  width: "48%",
                  padding: 10,
                  backgroundColor: authType === "login" ? "#e9edc9" : "#fff",
                  borderWidth: 1,
                  borderColor: authType === "login" ? "#e9edc9" : "#accbde",
                  borderRadius: 10,
                  alignItems: "center",
                }}
                onPress={() => setAuthType("login")}
              >
                <Text
                  style={{
                    fontWeight: "bold",
                    color: authType === "login" ? "#0a6d4f" : "#accbde",
                  }}
                >
                  Já tenho conta
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  width: "48%",
                  padding: 10,
                  backgroundColor: authType === "register" ? "#e9edc9" : "#fff",
                  borderWidth: 1,
                  borderColor: authType === "register" ? "#e9edc9" : "#accbde",
                  borderRadius: 10,
                  alignItems: "center",
                }}
                onPress={() => setAuthType("register")}
              >
                <Text
                  style={{
                    fontWeight: "bold",
                    color: authType === "register" ? "#0a6d4f" : "#accbde",
                  }}
                >
                  Quero me cadastrar
                </Text>
              </TouchableOpacity>
            </View>
            {authType === "register" && (
              <View
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 10,
                }}
              >
                <TouchableOpacity
                  style={{
                    width: "48%",
                    padding: 10,
                    backgroundColor: registerStep === 1 ? "#e9edc9" : "#fff",
                    borderWidth: 1,
                    borderColor: registerStep === 1 ? "#e9edc9" : "#accbde",
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                  onPress={() => setRegisterStep(1)}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      color: registerStep === 1 ? "#0a6d4f" : "#accbde",
                    }}
                  >
                    Dados Pessoais
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    width: "48%",
                    padding: 10,
                    backgroundColor: registerStep === 2 ? "#e9edc9" : "#fff",
                    borderWidth: 1,
                    borderColor: registerStep === 2 ? "#e9edc9" : "#accbde",
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                  onPress={() => {
                    if (!name || !username || !password) {
                      Toast.error("Por favor, preencha todos os campos", {
                        duration: 3000,
                        position: "top",
                      });
                      return;
                    }
                    setRegisterStep(2);
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      color: registerStep === 2 ? "#0a6d4f" : "#accbde",
                    }}
                  >
                    Gostos Musicais
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {authType === "login" ? (
              <View style={{ marginTop: 20 }}>
                <TextInput
                  label="Usuário"
                  value={username}
                  onChangeText={setUsername}
                  mode="outlined"
                  style={{ marginBottom: 10 }}
                />
                <TextInput
                  label="Senha"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  mode="outlined"
                />
                <TouchableOpacity
                  style={{
                    marginTop: 10,
                    padding: 10,
                    backgroundColor: "#accbde",
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                  onPress={() => {
                    handleLogin();
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Entrar
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ marginTop: 20 }}>
                {registerStep === 1 && (
                  <>
                    <TextInput
                      label="Nome Completo"
                      value={name}
                      onChangeText={setName}
                      mode="outlined"
                      style={{ marginBottom: 10 }}
                    />
                    <TextInput
                      label="Usuário"
                      value={username}
                      onChangeText={setUsername}
                      mode="outlined"
                      style={{ marginBottom: 10 }}
                    />
                    <TextInput
                      label="Senha"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      mode="outlined"
                    />
                    <TouchableOpacity
                      style={{
                        marginTop: 10,
                        padding: 10,
                        backgroundColor: "#accbde",
                        borderRadius: 10,
                        alignItems: "center",
                      }}
                      onPress={() => {
                        if (!name || !username || !password) {
                          Toast.error("Por favor, preencha todos os campos", {
                            duration: 3000,
                            position: "top",
                          });
                          return;
                        }
                        setRegisterStep(2);
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "bold" }}>
                        Próximo
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                {registerStep === 2 && (
                  <>
                    <View
                      style={{
                        marginBottom: 10,
                        backgroundColor: "#e9edc9",
                        padding: 10,
                        borderRadius: 100,
                      }}
                    >
                      <Text style={{ color: "#0a6d4f", fontWeight: "bold" }}>
                        {selectedArtists.length > 0
                          ? `Artistas selecionados: ${selectedArtists.length}`
                          : "Selecione seus artistas favoritos"}
                      </Text>
                    </View>
                    <TextInput
                      label="Buscar Artistas"
                      value={searchQuery}
                      onChangeText={(text) => {
                        setSearchQuery(text);
                      }}
                      onKeyPress={(e) => {
                        if (e.nativeEvent.key === "Enter") {
                          getArtists();
                        }
                      }}
                      onSubmitEditing={getArtists}
                      mode="outlined"
                      style={{ marginBottom: 10 }}
                    />
                    {artists.length > 0 && (
                      <ScrollView
                        style={{
                          maxHeight: 200,
                          borderWidth: 1,
                          borderColor: "#accbde",
                          borderRadius: 10,
                        }}
                      >
                        {artists.map((artist) => (
                          <TouchableOpacity
                            key={artist.id}
                            style={{
                              padding: 10,
                              borderBottomWidth: 1,
                              borderBottomColor: "#accbde",
                              backgroundColor: selectedArtists.includes(
                                artist.id
                              )
                                ? "#e9edc9"
                                : "#fff",
                            }}
                            onPress={() => {
                              if (selectedArtists.includes(artist.id)) {
                                setSelectedArtists(
                                  selectedArtists.filter(
                                    (id) => id !== artist.id
                                  )
                                );
                              } else {
                                setSelectedArtists([
                                  ...selectedArtists,
                                  artist.id,
                                ]);
                              }
                            }}
                          >
                            <Text
                              style={{
                                color: selectedArtists.includes(artist.id)
                                  ? "#0a6d4f"
                                  : "#000",
                              }}
                            >
                              {artist.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                    {selectedArtists.length > 0 && (
                      <TouchableOpacity
                        style={{
                          marginTop: 10,
                          padding: 10,
                          backgroundColor: "#accbde",
                          borderRadius: 10,
                          alignItems: "center",
                        }}
                        onPress={() => {
                          handleRegister();
                        }}
                      >
                        <Text style={{ color: "#fff", fontWeight: "bold" }}>
                          Cadastrar
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            )}
          </>
        )}
      </View>
      <ToastManager />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
    justifyContent: "flex-end",
  },
});
