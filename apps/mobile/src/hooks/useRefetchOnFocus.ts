import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Forces every given refetch function to run whenever the screen gains focus,
 * including the very first time it mounts.
 *
 * Why this exists: a bare `useQuery()` only auto-fetches on mount. On a cold
 * app start the very first fetch can race with token hydration/refresh or a
 * slow-to-wake backend (Supabase free-tier cold start) and the screen that
 * kicked it off may already be mid-transition — the data lands in the React
 * Query cache correctly, but nothing prompts *this* screen to read it until
 * some other state change (like a manual pull-to-refresh) forces a re-render.
 * Tying an explicit refetch to focus removes that gap: every time the tab
 * becomes the active screen, it asks for fresh data itself instead of hoping
 * the initial mount-time fetch already got through cleanly.
 */
export const useRefetchOnFocus = (refetchers: Array<() => unknown>): void => {
  const refetchersRef = useRef(refetchers);
  refetchersRef.current = refetchers;

  useFocusEffect(
    useCallback(() => {
      for (const refetch of refetchersRef.current) refetch();
    }, [])
  );
};
