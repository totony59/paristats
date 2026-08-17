import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
import { MainTabs } from "./MainTabs";
import { VerificationScreen } from "../screens/VerificationScreen";
import { BetDetailScreen } from "../screens/BetDetailScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#161d2e" },
          headerTintColor: "#f1f5f9",
          contentStyle: { backgroundColor: "#0f1420" },
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="Verification"
          component={VerificationScreen}
          options={{ title: "Vérification" }}
        />
        <Stack.Screen
          name="BetDetail"
          component={BetDetailScreen}
          options={{ title: "Détail du pari" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
