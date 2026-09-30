import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import LogoutButton from "../../components/common/LogoutButton";
import dashboardService, {
  type DashboardStats,
} from "../../services/api/dashboard.service";
import theme from "../../theme";

const initialStats: DashboardStats = {
  students: 0,
  teachers: 0,
  staff: 0,
  classes: 0,
  activeStudents: 0,
  activeTeachers: 0,
  activeStaff: 0,
  totalUsers: 0,
  generatedAt: "",
};

const dashboardCards = [
  {
    key: "students",
    title: "Students",
    icon: "people-outline" as const,
  },
  {
    key: "teachers",
    title: "Teachers",
    icon: "school-outline" as const,
  },
  {
    key: "staff",
    title: "Staff",
    icon: "person-outline" as const,
  },
  {
    key: "classes",
    title: "Classes",
    icon: "business-outline" as const,
  },
];

export default function HeadDashboardScreen() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (error) {
      console.error("Head dashboard error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  function handleRefresh() {
    setRefreshing(true);
    loadDashboard();
  }

  const getCardValue = (key: string) => {
    switch (key) {
      case "students":
        return stats.students;
      case "teachers":
        return stats.teachers;
      case "staff":
        return stats.staff;
      case "classes":
        return stats.classes;
      default:
        return 0;
    }
  };

  const getActiveValue = (key: string) => {
    switch (key) {
      case "students":
        return stats.activeStudents;
      case "teachers":
        return stats.activeTeachers;
      case "staff":
        return stats.activeStaff;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
        />
        <Text style={styles.loadingText}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>BRX EDUNEXA</Text>

          <Text style={styles.title}>
            Head Dashboard
          </Text>

          <Text style={styles.subtitle}>
            Manage your institution
          </Text>
        </View>

        <LogoutButton />
      </View>

      <View style={styles.searchBox}>
        <Ionicons
          name="search-outline"
          size={21}
          color={theme.colors.textMuted}
        />

        <Text style={styles.searchPlaceholder}>
          Search anything...
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Quick Access
        </Text>

        <Text style={styles.viewAll}>
          View All
        </Text>
      </View>

      <View style={styles.grid}>
        {dashboardCards.map((card, index) => {
          const value = getCardValue(card.key);
          const active = getActiveValue(card.key);

          return (
            <View
              key={card.key}
              style={[
                styles.card,
                index % 4 === 0 && styles.cardBlue,
                index % 4 === 1 && styles.cardPurple,
                index % 4 === 2 && styles.cardGreen,
                index % 4 === 3 && styles.cardOrange,
              ]}
            >
              <View style={styles.iconCircle}>
                <Ionicons
                  name={card.icon}
                  size={24}
                  color={theme.colors.primary}
                />
              </View>

              <Text style={styles.cardTitle}>
                {card.title}
              </Text>

              <Text style={styles.cardValue}>
                {value}
              </Text>

              {active !== null && (
                <Text style={styles.activeText}>
                  {active} active
                </Text>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.totalCard}>
        <View style={styles.totalIcon}>
          <Ionicons
            name="analytics-outline"
            size={26}
            color={theme.colors.textWhite}
          />
        </View>

        <View style={styles.totalInfo}>
          <Text style={styles.totalLabel}>
            Total Users
          </Text>

          <Text style={styles.totalValue}>
            {stats.totalUsers}
          </Text>

          <Text style={styles.totalDescription}>
            Active users across your institution
          </Text>
        </View>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusIcon}>
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={theme.colors.success}
          />
        </View>

        <View style={styles.statusInfo}>
          <Text style={styles.statusTitle}>
            Live Dashboard
          </Text>

          <Text style={styles.statusText}>
            Connected directly to BRX EduNexa API
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 16,
    paddingBottom: 36,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },

  loadingText: {
    marginTop: 12,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  title: {
    marginTop: 4,
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 13,
  },

  searchBox: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 24,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  searchPlaceholder: {
    marginLeft: 10,
    color: theme.colors.textMuted,
    fontSize: 14,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 19,
    fontWeight: "800",
  },

  viewAll: {
    color: "#4F46E5",
    fontSize: 13,
    fontWeight: "700",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48.5%",
    minHeight: 150,
    padding: 16,
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  cardBlue: {
    backgroundColor: "#EEF4FF",
  },

  cardPurple: {
    backgroundColor: "#F3EEFF",
  },

  cardGreen: {
    backgroundColor: "#ECFDF5",
  },

  cardOrange: {
    backgroundColor: "#FFF4E8",
  },

  iconCircle: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },

  cardTitle: {
    marginTop: 13,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },

  cardValue: {
    marginTop: 4,
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "800",
  },

  activeText: {
    marginTop: 3,
    color: theme.colors.success,
    fontSize: 11,
    fontWeight: "700",
  },

  totalCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    marginTop: 8,
    borderRadius: 22,
    backgroundColor: "#2563EB",
  },

  totalIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  totalInfo: {
    marginLeft: 14,
  },

  totalLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    opacity: 0.9,
  },

  totalValue: {
    marginTop: 1,
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
  },

  totalDescription: {
    marginTop: 2,
    color: "#FFFFFF",
    fontSize: 11,
    opacity: 0.85,
  },

  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  statusIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#ECFDF5",
  },

  statusInfo: {
    marginLeft: 12,
    flex: 1,
  },

  statusTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "800",
  },

  statusText: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
});
