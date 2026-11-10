// Keeps notifications in step with the app: reminders follow bookings, the push token
// follows the Notifications switches, and tapping a notification opens its screen.
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { getPushToken, onNotificationTap, supported, syncReminders } from '@/lib/notifications';
import { registerPushDevice, serverEnabled } from '@/server/api';

import { useApp } from './app';
import { useData } from './data';

export function NotificationSync() {
  const { user, club, notif } = useApp();
  const { upcoming } = useData();

  useEffect(() => onNotificationTap((url) => router.push(url as Href)), []);

  useEffect(() => {
    syncReminders(user ? upcoming : [], notif.remind).catch(() => {});
  }, [user, upcoming, notif.remind]);

  useEffect(() => {
    if (!supported || !serverEnabled || !(notif.spots || notif.news)) return;
    (async () => {
      if (!(await Notifications.getPermissionsAsync()).granted) return;
      const token = await getPushToken();
      if (!token) return;
      await registerPushDevice({
        token,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        bondUserId: user?.id,
        clubId: club?.id,
        topics: { spots: notif.spots, news: notif.news },
      });
    })().catch(() => {});
  }, [user?.id, club?.id, notif.spots, notif.news]);

  return null;
}
