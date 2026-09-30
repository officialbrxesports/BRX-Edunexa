import React from "react";
import { SafeAreaView, Text, View } from "react-native";
import theme from "../../theme";
import LogoutButton from "../../components/common/LogoutButton";

export default function StudentDashboardScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 30, fontWeight: "900", color: theme.colors.text }}>
          Student Dashboard 🎓
        </Text>

        <Text style={{ marginTop: 8, fontSize: 15, color: theme.colors.textSecondary }}>
          View your academic activity in one place.
        </Text>

        <View style={{
          marginTop: 28,
          padding: 20,
          borderRadius: 18,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: theme.colors.text }}>
            My Learning
          </Text>

          <Text style={{ marginTop: 8, color: theme.colors.textSecondary }}>
            Attendance • Assignments • Results • Fees
          </Text>
        </View>

        <LogoutButton />
      </View>
    </SafeAreaView>
  );
}
