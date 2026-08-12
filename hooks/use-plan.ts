import { useCallback, useEffect, useState } from 'react';

import { BACKEND_API_BASE_URL } from '@/constants/firebase';
import { useFirebaseAuth } from '@/context/firebase-auth';
import type { StudyPlan } from '@/hooks/use-plans';

/**
 * A single study plan: its days, the caller's progress, the member list, and
 * the reflection feed for a given day.
 *
 * Unlike notes and prayers this is not offline-first — a shared plan is only
 * meaningful against the server, and showing stale members or reflections would
 * be misleading. When it cannot load, screens say so rather than inventing
 * progress.
 */

export type PlanDay = {
  day: number;
  reference: string;
  title: string;
  prompt: string;
};

export type PlanMember = {
  userId: string;
  displayName: string;
  role: 'owner' | 'member';
  currentDay: number;
  daysDone: number;
  joinedAt: string;
};

export type Reflection = {
  id: string;
  planId: string;
  userId: string;
  authorName: string;
  day: number;
  body: string;
  createdAt: string;
  updatedAt: string;
};

const TIMEOUT_MS = 10_000;

export async function planRequest<T>(
  path: string,
  idToken: string,
  init?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
        ...init?.headers,
      },
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.message || `Request to ${path} failed`);
    }
    return payload as T;
  } finally {
    clearTimeout(timer);
  }
}

export function usePlan(planId: string | undefined) {
  const { idToken, isReady } = useFirebaseAuth();

  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [days, setDays] = useState<PlanDay[]>([]);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [members, setMembers] = useState<PlanMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!planId || !idToken) {
      setIsLoading(false);
      return;
    }

    try {
      const payload = await planRequest<{
        plan: StudyPlan;
        days: PlanDay[];
        completedDays: number[];
        members: PlanMember[];
      }>(`/v1/plans/${planId}`, idToken);

      setPlan(payload.plan);
      setDays(payload.days ?? []);
      setCompletedDays(payload.completedDays ?? []);
      setMembers(payload.members ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load this plan');
    } finally {
      setIsLoading(false);
    }
  }, [planId, idToken]);

  useEffect(() => {
    if (!isReady) return;
    void refresh();
  }, [isReady, refresh]);

  const toggleDay = useCallback(
    async (day: number) => {
      if (!planId || !idToken) return;

      const wasDone = completedDays.includes(day);
      // Move the tick immediately; the server is the authority but the UI
      // should not wait on a round trip.
      setCompletedDays((prev) =>
        wasDone ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
      );

      try {
        const payload = await planRequest<{ completedDays?: number[] }>(
          `/v1/plans/${planId}/days/${day}/complete`,
          idToken,
          { method: wasDone ? 'DELETE' : 'POST' },
        );
        if (payload.completedDays) setCompletedDays(payload.completedDays);
        void refresh();
      } catch (err) {
        // Put it back — the change did not stick.
        setCompletedDays((prev) =>
          wasDone ? [...prev, day].sort((a, b) => a - b) : prev.filter((d) => d !== day),
        );
        setError(err instanceof Error ? err.message : 'Could not save that');
      }
    },
    [planId, idToken, completedDays, refresh],
  );

  const join = useCallback(async () => {
    if (!planId || !idToken) return;
    await planRequest(`/v1/plans/${planId}/join`, idToken, { method: 'POST' });
    await refresh();
  }, [planId, idToken, refresh]);

  const leave = useCallback(async () => {
    if (!planId || !idToken) return;
    await planRequest(`/v1/plans/${planId}/leave`, idToken, { method: 'POST' });
    await refresh();
  }, [planId, idToken, refresh]);

  /**
   * Owner-only edit. Sending `days` replaces the whole schedule, so callers
   * pass every day back, not just the changed one.
   */
  const update = useCallback(
    async (input: {
      title?: string;
      description?: string;
      visibility?: StudyPlan['visibility'];
      days?: { reference: string; title?: string; prompt?: string }[];
    }) => {
      if (!planId || !idToken) return;
      await planRequest(`/v1/plans/${planId}`, idToken, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
      await refresh();
    },
    [planId, idToken, refresh],
  );

  return {
    plan,
    days,
    completedDays,
    members,
    isLoading,
    error,
    refresh,
    toggleDay,
    join,
    leave,
    update,
    isSignedIn: Boolean(idToken),
  };
}

/** Reflections for one day of one plan. */
export function useReflections(planId: string | undefined, day: number) {
  const { idToken, isReady } = useFirebaseAuth();

  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!planId || !idToken) {
      setIsLoading(false);
      return;
    }

    try {
      const payload = await planRequest<{ reflections: Reflection[] }>(
        `/v1/plans/${planId}/days/${day}/reflections`,
        idToken,
      );
      setReflections(payload.reflections ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load reflections');
    } finally {
      setIsLoading(false);
    }
  }, [planId, day, idToken]);

  useEffect(() => {
    if (!isReady) return;
    void refresh();
  }, [isReady, refresh]);

  const post = useCallback(
    async (body: string) => {
      if (!planId || !idToken) return;
      const created = await planRequest<Reflection>(
        `/v1/plans/${planId}/days/${day}/reflections`,
        idToken,
        { method: 'POST', body: JSON.stringify({ body }) },
      );
      setReflections((prev) => [created, ...prev]);
    },
    [planId, day, idToken],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!idToken) return;
      await planRequest(`/v1/reflections/${id}`, idToken, { method: 'DELETE' });
      setReflections((prev) => prev.filter((item) => item.id !== id));
    },
    [idToken],
  );

  /** Report objectionable content — required by App Store Guideline 1.2. */
  const report = useCallback(
    async (targetId: string, reason: string) => {
      if (!idToken) return;
      await planRequest('/v1/reports', idToken, {
        method: 'POST',
        body: JSON.stringify({ targetType: 'reflection', targetId, reason }),
      });
    },
    [idToken],
  );

  /** Block a user; their posts disappear from every feed. */
  const block = useCallback(
    async (userId: string) => {
      if (!idToken) return;
      await planRequest('/v1/blocks', idToken, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      setReflections((prev) => prev.filter((item) => item.userId !== userId));
    },
    [idToken],
  );

  return { reflections, isLoading, error, refresh, post, remove, report, block };
}
