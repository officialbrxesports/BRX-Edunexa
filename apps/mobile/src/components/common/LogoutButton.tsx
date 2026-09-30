import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
} from "react-native";
import { useDispatch } from "react-redux";

import authService from "../../services/auth/auth.service";
import { logout } from "../../store/slices/auth.slice";
import type { AppDispatch } from "../../store";
import theme from "../../theme";

export default function LogoutButton() {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);
      await authService.logout();
      dispatch(logout());
    } finally {
      setLoading(false);
    }
  }

  return (
    <Pressable
      disabled={loading}
      onPress={handleLogout}
      style={{
        marginTop: 24,
        height: 50,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#FECACA",
        backgroundColor: "#FEF2F2",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.danger} />
      ) : (
        <Text
          style={{
            color: theme.colors.danger,
            fontSize: 14,
            fontWeight: "900",
          }}
        >
          Sign Out
        </Text>
      )}
    </Pressable>
  );
}
