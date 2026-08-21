import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import type { PlanTemplate } from '@/constants/plan-templates';

/**
 * Reading plans that live on the device.
 *
 * Following a plan alone needs no server: it is a list of passages and a record
 * of which days you have done. Only the shared parts — joining by code, seeing
 * how far someone else has got, writing a reflection others read — need an
 * account and a backend.
 *
 * Gating the whole feature on those was the same mistake as gating the Bible
 * would be. Someone who installs the app should be able to start "John in 21
 * days" and tick day one before they have decided whether to sign up.
 *
 * A plan started here can be pushed to the server later; the id prefix is what
 * tells the rest of the app which kind it is looking at.
 */

const KEY = 'rooted:local-plans:v1';

/** Distinguishes an on-device plan from one the server owns. */
export const LOCAL_PREFIX = 'local:';

export function isLocalPlanId(id: string | undefined) {
  return Boolean(id?.startsWith(LOCAL_PREFIX));
}

export type LocalPlanDay = {
  reference: string;
  title?: string;
  prompt?: string;
};

export type LocalPlan = {
  id: string;
  title: string;
  description: string;
  days: LocalPlanDay[];
  /** Day numbers, 1-based, that have been marked done. */
  completedDays: number[];
  startedAt: string;
  /** Set when it came from a template, so the same one is not started twice. */
  templateId?: string;
};

async function read(): Promise<LocalPlan[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LocalPlan[]) : [];
  } catch {
    return [];
  }
}

async function write(plans: LocalPlan[]) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(plans));
  } catch {
    // A plan that fails to save is still usable this session; losing it is
    // better than crashing the screen someone is reading from.
  }
}

/** The furthest unbroken run from day one — the same rule the server uses. */
export function currentDay(plan: LocalPlan) {
  let day = 0;
  const done = new Set(plan.completedDays);
  while (done.has(day + 1)) day += 1;
  return day;
}

export function useLocalPlans() {
  const [plans, setPlans] = useState<LocalPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setPlans(await read());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const start = useCallback(async (template: PlanTemplate) => {
    const plan: LocalPlan = {
      id: `${LOCAL_PREFIX}${template.id}-${Date.now()}`,
      title: template.title,
      description: template.description,
      days: template.days,
      completedDays: [],
      startedAt: new Date().toISOString(),
      templateId: template.id,
    };

    const next = [plan, ...(await read())];
    await write(next);
    setPlans(next);
    return plan;
  }, []);

  const toggleDay = useCallback(async (planId: string, day: number) => {
    const all = await read();
    const next = all.map((plan) => {
      if (plan.id !== planId) return plan;
      const done = plan.completedDays.includes(day);
      return {
        ...plan,
        completedDays: done
          ? plan.completedDays.filter((d) => d !== day)
          : [...plan.completedDays, day].sort((a, b) => a - b),
      };
    });
    await write(next);
    setPlans(next);
  }, []);

  const remove = useCallback(async (planId: string) => {
    const next = (await read()).filter((plan) => plan.id !== planId);
    await write(next);
    setPlans(next);
  }, []);

  return { plans, isLoading, refresh, start, toggleDay, remove };
}

/** One plan, for the detail screen. Reads storage directly rather than a list. */
export function useLocalPlan(planId: string | undefined) {
  const [plan, setPlan] = useState<LocalPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isLocalPlanId(planId)) {
      setIsLoading(false);
      return;
    }
    const found = (await read()).find((p) => p.id === planId) ?? null;
    setPlan(found);
    setIsLoading(false);
  }, [planId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleDay = useCallback(
    async (day: number) => {
      if (!plan) return;

      // Move the tick immediately; storage is not something to wait on.
      const done = plan.completedDays.includes(day);
      const completedDays = done
        ? plan.completedDays.filter((d) => d !== day)
        : [...plan.completedDays, day].sort((a, b) => a - b);

      setPlan({ ...plan, completedDays });

      const all = await read();
      await write(all.map((p) => (p.id === plan.id ? { ...p, completedDays } : p)));
    },
    [plan],
  );

  return { plan, isLoading, refresh, toggleDay };
}
