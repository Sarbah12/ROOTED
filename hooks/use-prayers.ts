import { useCallback } from 'react';

import type { PrayerStatus } from '@/constants/bible-study';
import { newLocalRecord, useSyncedCollection } from '@/hooks/use-synced-collection';

export type BackendPrayer = {
  id: string;
  title: string;
  category: string;
  content: string;
  status: PrayerStatus;
  verse: string;
  updatedAt: string;
};

export type PrayerInput = {
  title: string;
  category?: string;
  content?: string;
  status?: PrayerStatus;
  verse?: string;
};

/** Prayer journal — offline-first, synced to /v1/prayers when signed in. */
export function usePrayers() {
  const createLocal = useCallback(
    (input: PrayerInput) =>
      newLocalRecord<BackendPrayer>({
        title: input.title,
        category: input.category ?? 'Personal',
        content: input.content ?? '',
        status: input.status ?? 'unanswered',
        verse: input.verse ?? '',
      }),
    [],
  );

  const toPayload = useCallback(
    (prayer: BackendPrayer) => ({
      title: prayer.title,
      category: prayer.category,
      content: prayer.content,
      status: prayer.status,
      verse: prayer.verse,
    }),
    [],
  );

  const collection = useSyncedCollection<BackendPrayer, PrayerInput>({
    storageKey: 'rooted:prayers:v1',
    endpoint: '/v1/prayers',
    listKey: 'prayers',
    createLocal,
    toPayload,
  });

  return {
    prayers: collection.items,
    isLoading: collection.isLoading,
    isSyncing: collection.isSyncing,
    error: collection.error,
    isSignedIn: collection.isSignedIn,
    hasPendingChanges: collection.hasPendingChanges,
    refresh: collection.refresh,
    createPrayer: collection.create,
    updatePrayer: collection.update,
    deletePrayer: collection.remove,
  };
}
