# 02 — React Native (Expo) App Directive
### Godigitify Nexus · iOS + Android Mobile Application
**Version:** 1.0 | **Stack:** Expo SDK 52 · EAS Build · React Navigation v7 · Zustand · TanStack Query

---

## DIRECTIVE GOAL
Build a production-grade React Native app that installs, runs, and performs identically on iOS and Android.
This directive covers folder structure, navigation, state management, API integration, performance patterns,
push notifications, file handling, and EAS build configuration.

---

## 1. App Workspace Structure

```
apps/mobile/
├── src/
│   ├── app/                         # Expo Router file-based routes
│   │   ├── _layout.tsx              # Root layout (fonts, theme, auth gate)
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx
│   │   │   └── forgot-password.tsx
│   │   ├── (app)/                   # Protected routes (requires auth)
│   │   │   ├── _layout.tsx          # Tab navigator + auth check
│   │   │   ├── (tabs)/
│   │   │   │   ├── _layout.tsx      # Bottom tab bar
│   │   │   │   ├── index.tsx        # Dashboard / Home
│   │   │   │   ├── tasks.tsx        # My Tasks list
│   │   │   │   ├── calendar.tsx     # Calendar view
│   │   │   │   └── profile.tsx      # Profile + settings
│   │   │   ├── tasks/
│   │   │   │   ├── [id].tsx         # Task detail
│   │   │   │   ├── create.tsx       # Create task (admin/super admin)
│   │   │   │   └── [id]/
│   │   │   │       └── comments.tsx # Task comments thread
│   │   │   ├── notifications.tsx
│   │   │   └── reports/
│   │   │       ├── index.tsx
│   │   │       └── [type].tsx
│   │   └── +not-found.tsx
│   ├── components/
│   │   ├── ui/                      # Primitive UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx            # Priority/status badges
│   │   │   ├── Avatar.tsx
│   │   │   ├── BottomSheet.tsx      # @gorhom/bottom-sheet wrapper
│   │   │   ├── Modal.tsx            # Confirmation modal
│   │   │   ├── Skeleton.tsx         # Loading skeleton
│   │   │   ├── Toast.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── index.ts
│   │   ├── task/
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskStatusBadge.tsx
│   │   │   ├── TaskPriorityIndicator.tsx
│   │   │   ├── TaskActivityTimeline.tsx
│   │   │   ├── TaskCommentItem.tsx
│   │   │   ├── TaskFilterBar.tsx
│   │   │   └── TaskQuickActions.tsx
│   │   ├── dashboard/
│   │   │   ├── StatCard.tsx
│   │   │   ├── ProgressRing.tsx
│   │   │   ├── RecentActivityFeed.tsx
│   │   │   └── WorkloadBar.tsx
│   │   ├── forms/
│   │   │   ├── CreateTaskForm.tsx
│   │   │   ├── AssigneeSelector.tsx
│   │   │   ├── PrioritySelector.tsx
│   │   │   ├── DateTimePicker.tsx
│   │   │   └── FileUploader.tsx
│   │   └── layout/
│   │       ├── ScreenHeader.tsx
│   │       ├── SafeScreen.tsx       # SafeAreaView + KeyboardAvoidingView
│   │       └── TabBarIcon.tsx
│   ├── hooks/
│   │   ├── useAuth.ts               # Auth state + actions
│   │   ├── useTasks.ts              # Task queries + mutations
│   │   ├── useNotifications.ts      # Push notification setup
│   │   ├── useDebounce.ts
│   │   ├── useRefreshControl.ts     # Pull-to-refresh pattern
│   │   ├── useNetworkState.ts       # Offline detection
│   │   ├── usePermissions.ts        # RBAC permission checks
│   │   ├── useFileUpload.ts         # Document picker + upload
│   │   └── useSocket.ts             # WebSocket connection
│   ├── stores/                      # Zustand stores
│   │   ├── auth.store.ts
│   │   ├── app.store.ts             # Theme, locale, offline queue
│   │   └── notification.store.ts
│   ├── services/
│   │   ├── api.service.ts           # Axios/fetch instance (imports @godigitify/api-client)
│   │   ├── auth.service.ts          # Token storage via SecureStore
│   │   ├── notification.service.ts  # Expo push token registration
│   │   ├── socket.service.ts        # Socket.IO client singleton
│   │   └── storage.service.ts       # SecureStore + AsyncStorage wrapper
│   ├── constants/
│   │   ├── colors.ts                # Design token colors
│   │   ├── typography.ts            # Font scale
│   │   ├── spacing.ts               # 4pt spacing grid
│   │   ├── permissions.ts           # RBAC permission keys
│   │   └── queryKeys.ts             # TanStack Query key factory
│   ├── types/
│   │   └── navigation.types.ts      # Screen param types for type-safe navigation
│   └── utils/
│       ├── errorHandler.ts          # Centralized API error handling
│       └── queryClient.ts           # TanStack Query client config
├── assets/
│   ├── fonts/                       # Custom fonts (Inter, etc.)
│   ├── images/                      # Static images + splash
│   └── icons/                       # SVG icons
├── app.json                         # Expo config
├── eas.json                         # EAS build profiles
├── babel.config.js
├── metro.config.js
├── tsconfig.json
└── package.json
```

---

## 2. Core Dependencies

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-notifications": "~0.29.0",
    "expo-document-picker": "~13.0.0",
    "expo-image-picker": "~16.0.0",
    "expo-image": "~2.0.0",
    "expo-file-system": "~18.0.0",
    "expo-constants": "~17.0.0",
    "expo-splash-screen": "~0.29.0",
    "expo-font": "~13.0.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.x",
    "react-native-safe-area-context": "^4.11.0",
    "react-native-screens": "^4.0.0",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-reanimated": "~3.16.0",
    "@gorhom/bottom-sheet": "^5.0.0",
    "@tanstack/react-query": "^5.56.0",
    "zustand": "^5.0.0",
    "zod": "^3.23.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "socket.io-client": "^4.8.0",
    "dayjs": "^1.11.0",
    "react-native-calendar-strip": "^2.2.0",
    "@react-native-async-storage/async-storage": "^2.0.0"
  },
  "devDependencies": {
    "@godigitify/types": "workspace:*",
    "@godigitify/utils": "workspace:*",
    "@godigitify/api-client": "workspace:*"
  }
}
```

---

## 3. Expo Configuration (app.json)

```json
{
  "expo": {
    "name": "SVGOI Tasks",
    "slug": "svgoi-tasks",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.godigitify.svgoitasks",
      "infoPlist": {
        "NSCameraUsageDescription": "Upload task completion proof",
        "NSPhotoLibraryUsageDescription": "Attach photos to tasks",
        "NSPhotoLibraryAddUsageDescription": "Save task files to library"
      }
    },
    "android": {
      "package": "com.godigitify.svgoitasks",
      "adaptiveIcon": {
        "foregroundImage": "./assets/icons/adaptive-icon.png",
        "backgroundColor": "#1A1F2E"
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ]
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          "icon": "./assets/icons/notification-icon.png",
          "color": "#1A1F2E",
          "sounds": []
        }
      ],
      [
        "expo-font",
        {
          "fonts": [
            "./assets/fonts/Inter-Regular.ttf",
            "./assets/fonts/Inter-Medium.ttf",
            "./assets/fonts/Inter-SemiBold.ttf",
            "./assets/fonts/Inter-Bold.ttf"
          ]
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

---

## 4. EAS Build Configuration (eas.json)

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_APP_ENV": "development" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "env": { "EXPO_PUBLIC_APP_ENV": "staging" }
    },
    "production": {
      "autoIncrement": true,
      "env": { "EXPO_PUBLIC_APP_ENV": "production" },
      "ios": { "credentialsSource": "remote" },
      "android": { "credentialsSource": "remote" }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "YOUR_APPLE_ID",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

---

## 5. Auth Store (Zustand + SecureStore)

```typescript
// src/stores/auth.store.ts
// Pattern: Zustand store with SecureStore persistence for tokens
// Access token in memory only. Refresh token in SecureStore.

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User, Role } from '@godigitify/types';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

type AuthStore = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Actions
  login: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
  updateUser: (user: Partial<User>) => void;
  hydrateFromStorage: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (accessToken, refreshToken, user) => {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ user, accessToken, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  refreshTokens: async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) return false;
      // Call refresh endpoint — implemented in auth.service.ts
      return true;
    } catch {
      return false;
    }
  },

  hydrateFromStorage: async () => {
    try {
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (userJson && refreshToken) {
        const user = JSON.parse(userJson) as User;
        // Silently refresh access token
        const refreshed = await get().refreshTokens();
        if (refreshed) set({ user, isAuthenticated: true });
        else await get().logout();
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: (partial) => set((state) => ({
    user: state.user ? { ...state.user, ...partial } : null,
  })),

  hasPermission: (permission) => {
    const { user } = get();
    if (!user) return false;
    // Super Admin bypasses all permission checks
    if (user.role === 'SUPER_ADMIN') return true;
    return user.permissions?.includes(permission) ?? false;
  },
}));
```

---

## 6. TanStack Query Setup

```typescript
// src/utils/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,           // 2 min stale time
      gcTime: 1000 * 60 * 10,              // 10 min garbage collection
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,          // Mobile: no window focus events
      refetchOnReconnect: true,             // Refetch on network reconnect
    },
    mutations: {
      retry: 0,
    },
  },
});
```

```typescript
// src/constants/queryKeys.ts — Query key factory pattern
export const queryKeys = {
  auth: {
    profile: () => ['auth', 'profile'] as const,
  },
  tasks: {
    all: () => ['tasks'] as const,
    list: (filters?: Record<string, unknown>) => ['tasks', 'list', filters] as const,
    detail: (id: string) => ['tasks', 'detail', id] as const,
    comments: (taskId: string) => ['tasks', taskId, 'comments'] as const,
    activity: (taskId: string) => ['tasks', taskId, 'activity'] as const,
  },
  users: {
    all: () => ['users'] as const,
    list: (deptId?: string) => ['users', 'list', deptId] as const,
    profile: (id: string) => ['users', id] as const,
  },
  dashboard: {
    stats: (period: string) => ['dashboard', 'stats', period] as const,
    activity: () => ['dashboard', 'activity'] as const,
  },
  notifications: {
    list: () => ['notifications'] as const,
    unreadCount: () => ['notifications', 'unread-count'] as const,
  },
} as const;
```

---

## 7. useTasks Hook Pattern

```typescript
// src/hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { tasksApi } from '@godigitify/api-client';
import type { TaskFilters, UpdateTaskStatusDto } from '@godigitify/types';

export const useTasks = (filters?: TaskFilters) => {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: () => tasksApi.getList(filters),
    select: (data) => data.data, // Unwrap ApiResponse envelope
  });
};

export const useTask = (id: string) => {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => tasksApi.getById(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

export const useUpdateTaskStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTaskStatusDto }) =>
      tasksApi.updateStatus(id, dto),
    onSuccess: (_, { id }) => {
      // Invalidate both list and detail caches
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.all() });
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.stats('week') });
    },
  });
};
```

---

## 8. Push Notifications Setup

```typescript
// src/services/notification.service.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotifications = async (): Promise<string | null> => {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
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

  // Register token with backend
  // await usersApi.registerPushToken(token.data);

  return token.data;
};
```

---

## 9. Offline Queue Pattern

```typescript
// src/stores/app.store.ts
// Offline mutations are queued and replayed on reconnect
import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';

type QueuedMutation = {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body: unknown;
  timestamp: number;
};

type AppStore = {
  isOnline: boolean;
  offlineQueue: QueuedMutation[];
  addToOfflineQueue: (mutation: Omit<QueuedMutation, 'id' | 'timestamp'>) => void;
  processOfflineQueue: () => Promise<void>;
  setOnlineStatus: (status: boolean) => void;
};
// Implementation follows subscribe-to-NetInfo pattern
```

---

## 10. Performance Patterns — MANDATORY

### Memoization
```typescript
// Every list item component MUST be wrapped in React.memo
export const TaskCard = React.memo(({ task }: { task: Task }) => {
  // Only re-renders when task reference changes
});

// Callbacks passed to list items must be stable
const handleTaskPress = useCallback((id: string) => {
  router.push(`/tasks/${id}`);
}, []);
```

### FlatList Optimization
```typescript
// ALWAYS use these props on FlatList — never use ScrollView + map for lists
<FlatList
  data={tasks}
  keyExtractor={(item) => item.id}
  renderItem={renderTaskCard}
  initialNumToRender={10}
  maxToRenderPerBatch={5}
  windowSize={10}
  removeClippedSubviews={true}
  getItemLayout={getTaskItemLayout}   // Only if fixed height items
  ListEmptyComponent={<EmptyState />}
  ListFooterComponent={isFetching ? <ActivityIndicator /> : null}
/>
```

### Image Optimization
```typescript
// Use expo-image, NEVER the built-in Image component for remote images
import { Image } from 'expo-image';
<Image
  source={{ uri: user.avatarUrl }}
  style={styles.avatar}
  contentFit="cover"
  cachePolicy="memory-disk"           // Aggressive caching
  placeholder={AVATAR_BLUR_HASH}      // BlurHash placeholder
  transition={200}
/>
```

### useDebounce Hook
```typescript
// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export const useDebounce = <T>(value: T, delay = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};
// Use in search inputs — debounce before firing API call
```

---

## 11. File Upload Flow

```typescript
// src/hooks/useFileUpload.ts
// Pattern: pick file → validate → get presigned URL from API → upload directly to S3/Supabase
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export const useFileUpload = (taskId: string) => {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const file = result.assets[0];
    if (!file) return;

    // Validate size (10MB max)
    if (file.size && file.size > 10 * 1024 * 1024) {
      Toast.show({ text: 'File must be under 10MB', type: 'danger' });
      return;
    }

    setUploading(true);
    try {
      // 1. Get presigned upload URL from API
      // 2. Upload directly to storage (bypasses API server for large files)
      // 3. Confirm upload with API (save file reference to task)
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading };
};
```

---

## 12. Protected Routes (Expo Router)

```typescript
// src/app/(app)/_layout.tsx
import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
```

```typescript
// Permission-based component guard
import { useAuthStore } from '@/stores/auth.store';

export const PermissionGate = ({
  permission,
  children,
  fallback = null,
}: {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
};
```

---

## 13. Socket.IO Real-Time Setup

```typescript
// src/services/socket.service.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(process.env.EXPO_PUBLIC_API_URL!, {
    auth: { token },
    transports: ['websocket'],   // Avoid polling on mobile
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect_error', (err) => {
    console.error('Socket error:', err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = () => socket;
```

---

## 14. DOs and DON'Ts — Mobile App

### ✅ DO
- Use **Expo Router** file-based routing — never set up React Navigation manually
- Validate all forms with **react-hook-form + zod resolver** before submission
- Show **skeleton loaders** during data fetching, never blank screens
- Handle **offline state** gracefully — show offline banner, queue mutations
- Store **refresh tokens in SecureStore**, access tokens in Zustand memory only
- Use **expo-image** for all remote images with blur hash placeholders
- Wrap all list item components in **React.memo**
- Use **useCallback** for all event handlers passed as props
- Add **pull-to-refresh** on every scrollable list screen
- Test on **both iOS and Android** before every PR (use EAS Preview builds)
- Use **haptic feedback** (expo-haptics) on important actions (task status change, submit)
- Handle **keyboard avoiding** with KeyboardAvoidingView on all form screens

### ❌ DON'T
- Never use **AsyncStorage** for sensitive data (tokens, PII) — use SecureStore
- Never use **ScrollView + .map()** for large lists — use FlatList/FlashList
- Never fetch data in **useEffect** — use TanStack Query hooks
- Never mutate Zustand state **directly** — always use action functions
- Never use **inline styles** — use StyleSheet.create() or design tokens
- Never ignore **platform differences** — use Platform.select() where needed
- Never use **console.log** in production — strip logs with babel plugin
- Never hardcode **API URLs** — always from EXPO_PUBLIC_* env vars
- Never **block the main thread** with heavy computation — use InteractionManager
- Never skip **error boundaries** on screen components
- Never use `any` type — define proper TypeScript types