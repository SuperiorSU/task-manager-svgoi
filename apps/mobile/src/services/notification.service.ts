import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import type { Subscription } from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotifications = async (): Promise<string | null> => {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
    // Critical/high-priority events (assignment, overdue, revision requests)
    // use this channel so they're visually distinct from routine updates.
    await Notifications.setNotificationChannelAsync('high-priority', {
      name: 'Urgent task alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
};

export const addNotificationReceivedListener = (
  handler: (notification: Notifications.Notification) => void
): Subscription => Notifications.addNotificationReceivedListener(handler);

export const addNotificationResponseListener = (
  handler: (response: Notifications.NotificationResponse) => void
): Subscription => Notifications.addNotificationResponseReceivedListener(handler);

export const removeNotificationSubscription = (sub: Subscription): void =>
  sub.remove();

export const setBadgeCount = (count: number): Promise<boolean> =>
  Notifications.setBadgeCountAsync(count);
