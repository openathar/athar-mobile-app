import { router } from 'expo-router';
import { useEffect } from 'react';

import AppTabs from '@/components/app-tabs';
import { hasBeenWelcomed } from '@/lib/welcome';

// Dev screenshots: start Metro with EXPO_PUBLIC_SKIP_WELCOME=1 to land on the tabs directly.
const SKIP_WELCOME = __DEV__ && process.env.EXPO_PUBLIC_SKIP_WELCOME === '1';

export default function TabsLayout() {
  // First open: the welcome comes up once over the tabs.
  useEffect(() => {
    if (SKIP_WELCOME) return;
    hasBeenWelcomed().then((yes) => {
      if (!yes) router.push('/welcome');
    });
  }, []);
  return <AppTabs />;
}
