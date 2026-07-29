import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

/** A query is refetched on focus only when it's stale (or has never loaded). */
export type FocusRefetchable = {
  refetch: () => unknown;
  /** React Query's `isStale` — true when data is past `staleTime` OR absent. */
  isStale: boolean;
};

/**
 * Refetches the given queries when the screen gains focus — but ONLY the ones
 * that are actually stale.
 *
 * Why stale-aware and not unconditional: the earlier version called `refetch()`
 * on every focus, which bypasses React Query's `staleTime` and fired a fresh
 * network request every single time you switched back to a tab. On the
 * dashboards that meant 3–4 requests per tab switch even when the data was
 * seconds old — a big chunk of the "sluggish on navigation" feel.
 *
 * The very FIRST focus after mount always refetches every query, regardless of
 * staleness. This is the initial load (not churn) and it also re-syncs the
 * screen with any query that resolved *during* the navigation transition — on a
 * cold start the access token is refreshed lazily on the first request, so the
 * dashboard's queries frequently settle mid-transition; without this nudge the
 * screen can stay on its skeleton even though the data is already in cache.
 * Only SUBSEQUENT focuses (tab switches, back-navigation) apply the stale check,
 * so returning to a screen whose data is still fresh is a no-op.
 */
export const useRefetchOnFocus = (queries: FocusRefetchable[]): void => {
  const queriesRef = useRef(queries);
  queriesRef.current = queries;
  const firstFocusRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      const isFirstFocus = firstFocusRef.current;
      firstFocusRef.current = false;
      for (const query of queriesRef.current) {
        if (isFirstFocus || query.isStale) query.refetch();
      }
    }, [])
  );
};
