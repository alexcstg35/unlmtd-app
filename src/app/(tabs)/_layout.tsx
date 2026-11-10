import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { TabBar, TABS, TopBar } from '@/components/Shell';
import { brand, useTheme } from '@/theme';

export default function TabsLayout() {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: brand.pitch }}>
      <TopBar />
      <Tabs
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.bg } }}
        tabBar={({ state, navigateToTab }) => (
          <TabBar
            active={state.routes[state.index].name}
            onSelect={(name) => {
              const route = state.routes.find((r) => r.name === name);
              if (route) navigateToTab(route.key);
            }}
          />
        )}>
        {TABS.map((t) => (
          <Tabs.Screen key={t.name} name={t.name} options={{ title: t.label }} />
        ))}
      </Tabs>
    </View>
  );
}
