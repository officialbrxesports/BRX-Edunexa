import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";

import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";

import authService from "../services/auth/auth.service";
import { setCredentials, setHydrated } from "../store/slices/auth.slice";
import type { RootState, AppDispatch } from "../store";

import theme from "../theme";

function AppNavigatorContent() {
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector(
    (state: RootState) => state.auth.user,
  );

  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );

  const isHydrated = useSelector(
    (state: RootState) => state.auth.isHydrated,
  );

  useEffect(() => {
    async function hydrateAuth() {
      try {
        const storedUser = await authService.getStoredUser();
        const token = await authService.getToken();

        if (storedUser && token) {
          dispatch(setCredentials(storedUser));
        }
      } finally {
        dispatch(setHydrated(true));
      }
    }

    hydrateAuth();
  }, [dispatch]);

  if (!isHydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
        />
      </View>
    );
  }

  return isAuthenticated && user ? (
    <MainNavigator role={user.role} />
  ) : (
    <AuthNavigator />
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <AppNavigatorContent />
    </NavigationContainer>
  );
}