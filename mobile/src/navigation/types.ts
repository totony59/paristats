import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { AIAnalyzeResponse } from "@paristats/shared";
import type { PickedImage } from "../api/client";

export type MainTabParamList = {
  Home: undefined;
  Scanner: undefined;
  MesParis: undefined;
  Bankroll: undefined;
  Statistiques: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  Verification: { analysis: AIAnalyzeResponse; image: PickedImage };
  BetDetail: { betId: string };
  Settings: undefined;
};

/** Props pour un écran vivant dans la barre d'onglets (peut aussi naviguer vers un écran du stack parent). */
export type TabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

/** Props pour un écran du stack racine (poussé au-dessus des onglets). */
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
