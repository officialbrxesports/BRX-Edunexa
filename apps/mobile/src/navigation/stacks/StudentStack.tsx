import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import StudentDashboardScreen from "../../screens/student/StudentDashboardScreen";

const Stack = createNativeStackNavigator();

export default function StudentStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="StudentDashboard"
        component={StudentDashboardScreen}
      />
    </Stack.Navigator>
  );
}
