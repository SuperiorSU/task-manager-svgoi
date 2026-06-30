import React from 'react';
import { Tabs } from 'expo-router';

import { useColors } from '../../../src/constants/colors';
import { TabBarIcon } from '../../../src/components/layout/TabBarIcon';

export default function AdminTabsLayout() {
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.surface.card,
          borderTopColor: colors.surface.border,
          borderTopWidth: 1,
        },
        tabBarItemStyle: {
          paddingTop: 8,
          paddingBottom: 4,
        },
        tabBarLabelStyle: { fontFamily: 'Inter-Medium', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabBarIcon name="grid" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ focused }) => <TabBarIcon name="check-square" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: 'Team',
          tabBarIcon: ({ focused }) => <TabBarIcon name="users" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused }) => <TabBarIcon name="calendar" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabBarIcon name="user" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
