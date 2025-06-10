import { View, ActivityIndicator } from "react-native";

export default function Loader() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator
        size="large"
        color="#235c5b"
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      />
    </View>
  );
}
