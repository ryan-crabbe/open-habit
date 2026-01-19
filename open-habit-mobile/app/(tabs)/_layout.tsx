import { withLayoutContext, router } from 'expo-router';
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationOptions,
  MaterialTopTabNavigationEventMap,
} from '@react-navigation/material-top-tabs';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

function Header() {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <View style={[styles.header, { backgroundColor: Colors[colorScheme].background }]}>
      <ThemedText style={styles.headerTitle}>OpenHabit</ThemedText>
      <TouchableOpacity
        onPress={() => router.push('/app-settings')}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <IconSymbol name="gearshape.fill" size={24} color={Colors[colorScheme].icon} />
      </TouchableOpacity>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} edges={['top']}>
      <Header />
      <MaterialTopTabs
        tabBarPosition="bottom"
        screenOptions={{
          swipeEnabled: true,
          tabBarActiveTintColor: Colors[colorScheme].tint,
          tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
          tabBarStyle: {
            backgroundColor: Colors[colorScheme].background,
            elevation: 0,
            shadowOpacity: 0,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: Colors[colorScheme].border,
          },
          tabBarIndicatorStyle: {
            backgroundColor: Colors[colorScheme].tint,
            height: 2,
            top: 0,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500',
            textTransform: 'none',
            marginTop: -2,
          },
          tabBarShowIcon: true,
        }}
      >
        <MaterialTopTabs.Screen
          name="index"
          options={{
            title: 'Log',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="checkmark.circle.fill" color={color} />
            ),
          }}
        />
        <MaterialTopTabs.Screen
          name="progress"
          options={{
            title: 'Progress',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="chart.bar.fill" color={color} />
            ),
          }}
        />
        <MaterialTopTabs.Screen
          name="habits"
          options={{
            title: 'Habits',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="square.grid.2x2.fill" color={color} />
            ),
          }}
        />
      </MaterialTopTabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
});
