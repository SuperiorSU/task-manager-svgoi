// View-model shape for the Notification Preferences screen. The real backend
// model (NotificationPreference — inAppEnabled/emailEnabled/pushEnabled +
// mutedTypes: NotificationType[]) is a per-type mute list, not the grouped
// toggle rows this screen shows, so useProfile.ts adapts between the two.

export type DeliveryMethod = {
  id: string;
  key: 'inApp' | 'email' | 'push';
  label: string;
  enabled: boolean;
};

export type NotificationTypeToggle = {
  id: string;
  key: string;
  label: string;
  enabled: boolean;
};

export type NotificationPreferencesView = {
  delivery: DeliveryMethod[];
  types: NotificationTypeToggle[];
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
};
