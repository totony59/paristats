import { Text, TouchableOpacity } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainTabParamList, RootStackParamList } from "./types";
import { HomeScreen } from "../screens/HomeScreen";
import { ScannerScreen } from "../screens/ScannerScreen";
import { MesParisScreen } from "../screens/MesParisScreen";
import { BankrollScreen } from "../screens/BankrollScreen";
import { StatistiquesScreen } from "../screens/StatistiquesScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  Home: "🏠",
  Scanner: "📷",
  MesParis: "📋",
  Bankroll: "💰",
  Statistiques: "📊",
};

function TabIcon({ route, focused }: { route: keyof MainTabParamList; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{TAB_ICONS[route]}</Text>;
}

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: "#161d2e" },
        headerTintColor: "#f1f5f9",
        tabBarStyle: { backgroundColor: "#161d2e", borderTopColor: "#232b3d" },
        tabBarActiveTintColor: "#818cf8",
        tabBarInactiveTintColor: "#64748b",
        tabBarIcon: ({ focused }) => (
          <TabIcon route={route.name as keyof MainTabParamList} focused={focused} />
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: "PariStats",
          tabBarLabel: "Accueil",
          headerRight: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate("Settings")
              }
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 16 }}
            >
              <Text style={{ fontSize: 20 }}>⚙️</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen name="Scanner" component={ScannerScreen} options={{ title: "Scanner un pari", tabBarLabel: "Scanner" }} />
      <Tab.Screen name="MesParis" component={MesParisScreen} options={{ title: "Mes paris", tabBarLabel: "Mes paris" }} />
      <Tab.Screen name="Bankroll" component={BankrollScreen} options={{ title: "Bankroll", tabBarLabel: "Bankroll" }} />
      <Tab.Screen
        name="Statistiques"
        component={StatistiquesScreen}
        options={{ title: "Statistiques", tabBarLabel: "Stats" }}
      />
    </Tab.Navigator>
  );
}
