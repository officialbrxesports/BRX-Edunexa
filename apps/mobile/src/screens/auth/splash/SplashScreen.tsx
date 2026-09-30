import React, { useEffect } from "react";
import { ActivityIndicator, StatusBar, Text, View } from "react-native";
import BRXLogo from "../../../components/common/BRXLogo";
import theme from "../../../theme";

type Props = {
  navigation: any;
};

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background}
      />

      <BRXLogo />

      <View style={{ marginTop: 48 }}>
        <ActivityIndicator
          size="small"
          color={theme.colors.primary}
        />
      </View>

      <Text
        style={{
          position: "absolute",
          bottom: 32,
          color: theme.colors.textMuted,
          fontSize: 11,
          fontWeight: "600",
        }}
      >
        BRX EduNexa • v1.0.0
      </Text>
    </View>
  );
}