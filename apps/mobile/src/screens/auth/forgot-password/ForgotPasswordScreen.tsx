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

import theme from "../../../theme";
import authService from "../../../services/auth/auth.service";

type Props = {
  navigation: any;
};

export default function ForgotPasswordScreen({
  navigation,
}: Props) {
  const [step, setStep] = useState<"email" | "otp" | "password">(
    "email",
  );

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  async function handleSendOtp() {
    clearMessages();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      await authService.forgotPassword(cleanEmail);

      setEmail(cleanEmail);
      setStep("otp");

      setSuccess(
        "If this account exists, a reset OTP has been sent.",
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Unable to send reset OTP.";

      setError(
        Array.isArray(message)
          ? message.join(", ")
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    clearMessages();

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      await authService.verifyResetOtp(
        email,
        otp,
      );

      setStep("password");
      setSuccess("OTP verified successfully.");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Invalid or expired OTP.";

      setError(
        Array.isArray(message)
          ? message.join(", ")
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    clearMessages();

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await authService.resetPassword(
        email,
        otp,
        password,
      );

      setSuccess(
        "Password reset successfully. You can now sign in.",
      );

      setTimeout(() => {
        navigation.replace("Login");
      }, 1200);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Unable to reset password.";

      setError(
        Array.isArray(message)
          ? message.join(", ")
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  const title =
    step === "email"
      ? "Forgot Password?"
      : step === "otp"
        ? "Verify OTP"
        : "Create New Password";

  const description =
    step === "email"
      ? "Enter your account email to receive a reset OTP."
      : step === "otp"
        ? `Enter the 6-digit OTP sent for ${email}.`
        : "Choose a new secure password for your account.";

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
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            alignSelf: "flex-start",
            paddingVertical: 8,
            paddingRight: 15,
          }}
        >
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

        <View style={{ marginTop: 28 }}>
          <Text
            style={{
              fontSize: 30,
              fontWeight: "900",
              color: theme.colors.text,
            }}
          >
            {title}
          </Text>

          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 21,
              color: theme.colors.textSecondary,
            }}
          >
            {description}
          </Text>
        </View>

        {step === "email" && (
          <View style={{ marginTop: 30 }}>
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
        )}

        {step === "otp" && (
          <View style={{ marginTop: 30 }}>
            <Text
              style={{
                marginBottom: 8,
                fontSize: 13,
                fontWeight: "700",
                color: theme.colors.text,
              }}
            >
              Verification OTP
            </Text>

            <TextInput
              value={otp}
              onChangeText={(value) =>
                setOtp(
                  value.replace(/\D/g, "").slice(0, 6),
                )
              }
              placeholder="Enter 6-digit OTP"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
              style={{
                height: 54,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 14,
                backgroundColor: theme.colors.surface,
                paddingHorizontal: 16,
                fontSize: 20,
                letterSpacing: 7,
                fontWeight: "800",
                color: theme.colors.text,
              }}
            />
          </View>
        )}

        {step === "password" && (
          <View style={{ marginTop: 30 }}>
            <Text
              style={{
                marginBottom: 8,
                fontSize: 13,
                fontWeight: "700",
                color: theme.colors.text,
              }}
            >
              New password
            </Text>

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter new password"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
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

            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              editable={!loading}
              style={{
                height: 54,
                marginTop: 14,
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
        )}

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
                fontWeight: "600",
              }}
            >
              {error}
            </Text>
          </View>
        ) : null}

        {success ? (
          <View
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 12,
              backgroundColor: "#F0FDF4",
              borderWidth: 1,
              borderColor: "#BBF7D0",
            }}
          >
            <Text
              style={{
                color: theme.colors.success,
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              {success}
            </Text>
          </View>
        ) : null}

        <Pressable
          disabled={loading}
          onPress={
            step === "email"
              ? handleSendOtp
              : step === "otp"
                ? handleVerifyOtp
                : handleResetPassword
          }
          style={{
            height: 56,
            marginTop: 26,
            borderRadius: 16,
            backgroundColor: theme.colors.primary,
            alignItems: "center",
            justifyContent: "center",
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
              {step === "email"
                ? "Send OTP"
                : step === "otp"
                  ? "Verify OTP"
                  : "Reset Password"}
            </Text>
          )}
        </Pressable>

        {step === "otp" && (
          <Pressable
            disabled={loading}
            onPress={handleSendOtp}
            style={{
              marginTop: 18,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: theme.colors.primary,
                fontWeight: "800",
                fontSize: 14,
              }}
            >
              Resend OTP
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}