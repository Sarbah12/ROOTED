import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { BACKEND_API_BASE_URL } from '@/constants/firebase';
import { useFirebaseAuth } from '@/context/firebase-auth';

/**
 * Study plans and reading streak.
 *
 * Everything here is the user's real data. When it cannot be loaded the hook
 * reports empty rather than inventing numbers — a plan the user has not joined
 * must never show progress, and a streak is either earned or zero.
 */

export type StudyPlan = {
  id: string;
  ownerId: string;
  ownerName: string | null;
  title: string;
  description: string;
  visibility: 'private' | 'link' | 'public';
  joinCode: string | null;
  durationDays: number;
  memberCount: number;
  createdAt: string;
  isMember?: boolean;
  currentDay?: number;
};

export type Streak = {
  current: number;
  longest: number;
  lastCompletedOn: string | null;
  totalDays: number;
};

const PLANS_CACHE_KEY = 'rooted:plans:v1';
const STREAK_CACHE_KEY = 'rooted:streak:v1';
const EMPTY_STREAK: Streak = { current: 0, longest: 0, lastCompletedOn: null, totalDays: 0 };

async function readCache<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function authedGet<T>(path: string, idToken: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}${path}`, {
      signal: controller.signal,
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!response.ok) throw new Error(`Request to ${path} failed`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function usePlans() {
  const { idToken, isReady } = useFirebaseAuth();

  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [streak, setStreak] = useState<Streak>(EMPTY_STREAK);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Show the last known values immediately, then refresh from the server.
  useEffect(() => {
    let active = true;
    (async () => {
      const [cachedPlans, cachedStreak] = await Promise.all([
        readCache<StudyPlan[]>(PLANS_CACHE_KEY, []),
        readCache<Streak>(STREAK_CACHE_KEY, EMPTY_STREAK),
      ]);
      if (!active) return;
      setPlans(cachedPlans);
      setStreak(cachedStreak);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!idToken) {
      // Signed out: no plans, no streak. Not placeholder values.
      setPlans([]);
      setStreak(EMPTY_STREAK);
      setIsLoading(false);
      return;
    }

    try {
      const [planPayload, streakPayload] = await Promise.all([
        authedGet<{ plans: StudyPlan[] }>('/v1/plans?scope=mine', idToken),
        authedGet<Streak>('/v1/me/streak', idToken),
      ]);

      setPlans(planPayload.plans ?? []);
      setStreak(streakPayload ?? EMPTY_STREAK);
      setError(null);

      void AsyncStorage.setItem(PLANS_CACHE_KEY, JSON.stringify(planPayload.plans ?? []));
      void AsyncStorage.setItem(STREAK_CACHE_KEY, JSON.stringify(streakPayload ?? EMPTY_STREAK));
    } catch (err) {
      // Keep whatever was cached; it was real once. Never substitute a guess.
      setError(err instanceof Error ? err.message : 'Unable to load plans');
    } finally {
      setIsLoading(false);
    }
  }, [idToken]);

  useEffect(() => {
    if (!isReady) return;
    void refresh();
  }, [isReady, refresh]);

  return { plans, streak, isLoading, error, refresh, isSignedIn: Boolean(idToken) };
}
