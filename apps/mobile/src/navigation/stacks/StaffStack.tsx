import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import StaffDashboardScreen from "../../screens/staff/StaffDashboardScreen";

const Stack = createNativeStackNavigator();

export default function StaffStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="StaffDashboard"
        component={StaffDashboardScreen}
      />
    </Stack.Navigator>
  );
}
