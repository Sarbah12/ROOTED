import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';

/**
 * Where to go once authentication succeeds.
 *
 * Nothing used to happen when a sign-in worked. The screen stayed put, and the
 * app only looked signed in once the user tapped a tab and that screen
 * remounted — so a sign-in that had actually succeeded felt broken. This sends
 * them onward: back to whatever they were trying to reach, or the home tab.
 */
export function useAuthRedirect() {
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();

  return useCallback(() => {
    // Only ever an in-app path. `next` arrives as a query parameter, so it can
    // also arrive from a deep link, and following an arbitrary string would
    // hand a stranger control of where sign-in lands.
    const target = typeof next === 'string' && next.startsWith('/') ? next : '/(tabs)';
    router.replace(target as never);
  }, [next, router]);
}
