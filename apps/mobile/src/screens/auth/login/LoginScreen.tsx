import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import { useDispatch } from "react-redux";

import BRXLogo from "../../../components/common/BRXLogo";
import theme from "../../../theme";
import authService from "../../../services/auth/auth.service";
import { setCredentials } from "../../../store/slices/auth.slice";
import type { AppDispatch } from "../../../store";

type Props = {
  navigation: any;
};

export default function LoginScreen({ navigation }: Props) {
  const dispatch = useDispatch<AppDispatch>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await authService.login(
        cleanEmail,
        password,
      );

      dispatch(setCredentials(response.user));

    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Unable to sign in. Please check your credentials.";

      setError(
        Array.isArray(message)
          ? message.join(", ")
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background}
      />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 22,
          paddingTop: 42,
          paddingBottom: 30,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <BRXLogo compact />

        <View style={{ marginTop: 34 }}>
          <Text
            style={{
              fontSize: 30,
              fontWeight: "900",
              color: theme.colors.text,
            }}
          >
            Welcome back 👋
          </Text>

          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 21,
              color: theme.colors.textSecondary,
            }}
          >
            Sign in to manage your education ecosystem.
          </Text>
        </View>

        <View style={{ marginTop: 28 }}>
          <Text
            style={{
              marginBottom: 8,
              fontSize: 13,
              fontWeight: "700",
              color: theme.colors.text,
            }}
          >
            Email address
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!loading}
            style={{
              height: 54,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: 14,
              backgroundColor: theme.colors.surface,
              paddingHorizontal: 16,
              fontSize: 15,
              color: theme.colors.text,
            }}
          />
        </View>

        <View style={{ marginTop: 18 }}>
          <Text
            style={{
              marginBottom: 8,
              fontSize: 13,
              fontWeight: "700",
              color: theme.colors.text,
            }}
          >
            Password
          </Text>

          <View
            style={{
              height: 54,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: 14,
              backgroundColor: theme.colors.surface,
            }}
          >
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry={!showPassword}
              editable={!loading}
              style={{
                flex: 1,
                paddingHorizontal: 16,
                fontSize: 15,
                color: theme.colors.text,
              }}
            />

            <Pressable
              disabled={loading}
              onPress={() =>
                setShowPassword((value) => !value)
              }
              style={{ paddingHorizontal: 16 }}
            >
              <Text
                style={{
                  color: theme.colors.primary,
                  fontSize: 12,
                  fontWeight: "800",
                }}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </Text>
            </Pressable>
          </View>
        </View>

        {error ? (
          <View
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 12,
              backgroundColor: "#FEF2F2",
              borderWidth: 1,
              borderColor: "#FECACA",
            }}
          >
            <Text
              style={{
                color: theme.colors.danger,
                fontSize: 13,
                lineHeight: 19,
                fontWeight: "600",
              }}
            >
              {error}
            </Text>
          </View>
        ) : null}

        <Pressable
          disabled={loading}
          onPress={handleLogin}
          style={{
            height: 56,
            marginTop: 28,
            borderRadius: 16,
            backgroundColor: loading
              ? theme.colors.primaryDark
              : theme.colors.primary,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: theme.colors.primary,
            shadowOpacity: 0.25,
            shadowRadius: 12,
            shadowOffset: {
              width: 0,
              height: 7,
            },
            elevation: 6,
          }}
        >
          {loading ? (
            <ActivityIndicator
              color={theme.colors.textWhite}
            />
          ) : (
            <Text
              style={{
                color: theme.colors.textWhite,
                fontSize: 15,
                fontWeight: "900",
              }}
            >
              Sign In
            </Text>
          )}
        </Pressable>

        <Pressable
          disabled={loading}
          onPress={() =>
            navigation.navigate("ForgotPassword")
          }
          style={{
            marginTop: 20,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: theme.colors.primary,
              fontSize: 14,
              fontWeight: "800",
            }}
          >
            Forgot Password?
          </Text>
        </Pressable>

        <View
          style={{
            marginTop: 24,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: theme.colors.textMuted,
              fontSize: 12,
            }}
          >
            Account creation is available on the BRX EduNexa website.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}