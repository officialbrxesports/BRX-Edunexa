import React from "react";
import { Pressable, SafeAreaView, Text, View } from "react-native";
import theme from "../../../theme";

type Props = {
  navigation: any;
};

export default function RegisterScreen({ navigation }: Props) {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}
    >
      <View style={{ flex: 1, padding: 24 }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text
            style={{
              color: theme.colors.primary,
              fontWeight: "800",
              fontSize: 14,
            }}
          >
            ← Back
          </Text>
        </Pressable>

        <View style={{ marginTop: 50 }}>
          <Text
            style={{
              fontSize: 30,
              fontWeight: "900",
              color: theme.colors.text,
            }}
          >
            Create Account
          </Text>

          <Text
            style={{
              marginTop: 10,
              color: theme.colors.textSecondary,
              lineHeight: 21,
            }}
          >
            Institution registration will be connected to the BRX EduNexa
            registration API next.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}