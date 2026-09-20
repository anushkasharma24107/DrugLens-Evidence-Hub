import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useColors } from '@/hooks/useColors';
import { useSafeTest } from '@/context/SafeTestContext';

export default function TabLayout() {
  const colors = useColors();
  const { user } = useSafeTest();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.mutedForeground, tabBarStyle: { height: 74, paddingTop: 7, paddingBottom: 10, backgroundColor: colors.card, borderTopColor: colors.border }, tabBarLabelStyle: { fontSize: 11, fontWeight: '600' } }}>
    <Tabs.Screen name="index" options={{ title: 'Overview', tabBarIcon: ({ color, size }) => <Feather name="grid" color={color} size={size} /> }} />
    <Tabs.Screen name="tests" options={{ title: 'Tests', tabBarIcon: ({ color, size }) => <Feather name="clipboard" color={color} size={size} /> }} />
    {user?.role === 'admin' && <Tabs.Screen name="admin" options={{ title: 'Admin', tabBarIcon: ({ color, size }) => <Feather name="settings" color={color} size={size} /> }} />}
    <Tabs.Screen name="settings" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} /> }} />
  </Tabs>;
}