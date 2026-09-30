import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HeadDashboardScreen from "../../screens/head/HeadDashboardScreen";

const Stack = createNativeStackNavigator();

export default function HeadStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="HeadDashboard"
        component={HeadDashboardScreen}
      />
    </Stack.Navigator>
  );
}
