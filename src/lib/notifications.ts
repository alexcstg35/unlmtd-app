// Notifications.
// - Game reminders: local notifications scheduled on the phone, two hours before kickoff.
// - Pickup spots and Club news: push notifications sent by UNLMTD's server (src/server/api.ts),
//   so the phone registers its push token there.
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Booking } from '@/bond';
import { fmtTime, parseIso } from './format';

export const supported = Platform.OS === 'ios' || Platform.OS === 'android';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
  });
}

const REMINDER = 'game-reminder';
const HOURS_BEFORE = 2;

/** Ask for permission (once). Returns true when notifications are allowed. */
export async function ensurePermission() {
  if (!supported) return false;
  if (Platform.OS === 'android') {
    // Android 13+ only shows the permission prompt once a channel exists.
    await Notifications.setNotificationChannelAsync('default', { name: 'Games and club news', importance: Notifications.AndroidImportance.HIGH });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** This phone's Expo push token, or null on simulators, web, or before the EAS project is set up. */
export async function getPushToken() {
  if (!supported || !Device.isDevice) return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return null;
  try {
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch {
    return null;
  }
}

/** Kickoff time on this phone's clock. Assumes the phone is in the club's time zone. */
const kickoff = (b: Booking) => {
  const d = parseIso(b.date);
  d.setHours(Math.floor(b.start), Math.round((b.start % 1) * 60), 0, 0);
  return d;
};

/**
 * Keep one reminder per upcoming confirmed booking, two hours before kickoff.
 * Clears all our reminders first, so it's safe to call whenever bookings change.
 */
export async function syncReminders(bookings: Booking[], enabled: boolean) {
  if (!supported) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter((n) => n.content.data?.type === REMINDER).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  if (!enabled) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;

  const now = Date.now();
  for (const b of bookings) {
    if (b.status !== 'confirmed') continue;
    const at = kickoff(b).getTime() - HOURS_BEFORE * 3600_000;
    if (at <= now) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Kickoff in 2 hours',
        body: `${b.title} at ${b.clubName}, ${fmtTime(b.start)}. Check in with your Bond ID.`,
        data: { type: REMINDER, url: `/booking/${b.id}` },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at) },
    });
  }
}

/** Open the screen a notification points to (data.url) when it's tapped. */
export function onNotificationTap(open: (url: string) => void) {
  if (!supported) return () => {};
  const handle = (n: Notifications.Notification) => {
    const url = n.request.content.data?.url;
    if (typeof url === 'string') {
      open(url);
      Notifications.clearLastNotificationResponse();
    }
  };
  const last = Notifications.getLastNotificationResponse();
  if (last?.notification) handle(last.notification);
  const sub = Notifications.addNotificationResponseReceivedListener((r) => handle(r.notification));
  return () => sub.remove();
}
