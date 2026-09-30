import React from "react";
import { Text, View } from "react-native";
import theme from "../../theme";

type Props = {
  compact?: boolean;
};

export default function BRXLogo({ compact = false }: Props) {
  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={{
          width: compact ? 58 : 76,
          height: compact ? 58 : 76,
          borderRadius: compact ? 16 : 22,
          backgroundColor: theme.colors.primary,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: theme.colors.primary,
          shadowOpacity: 0.3,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 7 },
          elevation: 8,
        }}
      >
        <Text
          style={{
            color: theme.colors.textWhite,
            fontSize: compact ? 18 : 24,
            fontWeight: "900",
            letterSpacing: -1,
          }}
        >
          BRX
        </Text>
      </View>

      {!compact && (
        <>
          <Text
            style={{
              marginTop: 14,
              fontSize: 24,
              fontWeight: "900",
              color: theme.colors.text,
            }}
          >
            BRX EduNexa
          </Text>

          <Text
            style={{
              marginTop: 5,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 1.5,
              color: theme.colors.primary,
              textTransform: "uppercase",
            }}
          >
            {`Smart Education Management`}
          </Text>
        </>
      )}
    </View>
  );
}