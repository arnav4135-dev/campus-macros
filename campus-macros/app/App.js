import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import AuthScreen from './src/screens/AuthScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import TodayScreen from './src/screens/TodayScreen';
import MenuScreen from './src/screens/MenuScreen';
import RecommendScreen from './src/screens/RecommendScreen';
import SearchScreen from './src/screens/SearchScreen';
import PhotoScreen from './src/screens/PhotoScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();
const EatStack = createNativeStackNavigator();

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: colors.maroon, background: colors.bg, card: colors.surface, text: colors.ink, border: colors.line } };
const icon = (glyph) => ({ color }) => <Text style={{ fontSize: 20, color }}>{glyph}</Text>;

function Eat() {
  return (
    <EatStack.Navigator screenOptions={{ headerTintColor: colors.maroon, headerTitleStyle: { color: colors.ink } }}>
      <EatStack.Screen name="Menu" component={MenuScreen} options={{ title: "Today's menus" }} />
      <EatStack.Screen name="Recommend" component={RecommendScreen} options={{ title: 'What to get' }} />
    </EatStack.Navigator>
  );
}

function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: colors.maroon, tabBarInactiveTintColor: colors.muted, headerShadowVisible: false, headerTitleStyle: { color: colors.ink } }}>
      <Tab.Screen name="Today" component={TodayScreen} options={{ tabBarIcon: icon('◉') }} />
      <Tab.Screen name="Eat" component={Eat} options={{ headerShown: false, tabBarIcon: icon('▤') }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarIcon: icon('⌕') }} />
      <Tab.Screen name="Snap" component={PhotoScreen} options={{ tabBarIcon: icon('◎') }} />
      <Tab.Screen name="You" component={SettingsScreen} options={{ tabBarIcon: icon('◍') }} />
    </Tab.Navigator>
  );
}

function Root() {
  const { ready, user, needsProfile, profileDone } = useAuth();
  if (!ready) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}><ActivityIndicator color={colors.maroon} /></View>;
  if (!user) return <AuthScreen />;
  if (needsProfile) return <ProfileSetupScreen onDone={profileDone} />;
  return <NavigationContainer theme={theme}><Tabs /></NavigationContainer>;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
