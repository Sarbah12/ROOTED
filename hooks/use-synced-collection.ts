import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { BACKEND_API_BASE_URL } from '@/constants/firebase';
import { useFirebaseAuth } from '@/context/firebase-auth';

/**
 * Offline-first list backed by AsyncStorage, with the backend as a sync layer.
 *
 * The device is the source of truth: every edit is written to disk immediately
 * and the UI never waits on the network. When the user is signed in and the
 * backend is reachable, pending work is pushed and remote records are pulled.
 * A note or prayer must not disappear because a request failed.
 */

export type SyncedRecord = {
  id: string;
  updatedAt: string;
};

/** The server operation a record still owes, if any. */
type Pending = 'create' | 'update' | 'delete';

export type Stored<T> = T & { pending?: Pending };

export type SyncedCollectionConfig<T extends SyncedRecord, TInput> = {
  /** AsyncStorage key; bump the suffix when the shape changes. */
  storageKey: string;
  /** Collection endpoint, e.g. `/v1/notes`. */
  endpoint: string;
  /** Property holding the array in the list response, e.g. `notes`. */
  listKey: string;
  /** Builds a complete local record from user input. */
  createLocal: (input: TInput) => T;
  /** Serialises a record for POST/PATCH. */
  toPayload: (record: T) => Record<string, unknown>;
};

const REQUEST_TIMEOUT_MS = 8000;

function localId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isLocalId(id: string) {
  return id.startsWith('local-');
}

export function newLocalRecord<T extends SyncedRecord>(fields: Omit<T, 'id' | 'updatedAt'>): T {
  return {
    ...fields,
    id: localId(),
    updatedAt: new Date().toISOString(),
  } as T;
}

async function request<T>(
  path: string,
  idToken: string,
  init?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

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

export function useSyncedCollection<T extends SyncedRecord, TInput>(
  config: SyncedCollectionConfig<T, TInput>,
) {
  const { storageKey, endpoint, listKey, createLocal, toPayload } = config;
  const { idToken, isReady } = useFirebaseAuth();

  const [items, setItems] = useState<Stored<T>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mirrors `items` so callbacks read the latest list without re-binding.
  const itemsRef = useRef<Stored<T>[]>([]);
  const syncingRef = useRef(false);

  const commit = useCallback(
    (next: Stored<T>[]) => {
      const sorted = [...next].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      itemsRef.current = sorted;
      setItems(sorted);
      AsyncStorage.setItem(storageKey, JSON.stringify(sorted)).catch(() => {
        // Best-effort; the in-memory list still reflects the edit.
      });
      return sorted;
    },
    [storageKey],
  );

  // Read from disk first so content appears instantly, online or not.
  useEffect(() => {
    let active = true;
    (async () => {
      let stored: Stored<T>[] = [];
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        stored = raw ? (JSON.parse(raw) as Stored<T>[]) : [];
      } catch {
        stored = [];
      }
      if (!active) return;
      itemsRef.current = stored;
      setItems(stored);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [storageKey]);

  /** Pushes anything pending, then reconciles with the server. */
  const sync = useCallback(async () => {
    if (!idToken || syncingRef.current) return;

    syncingRef.current = true;
    setIsSyncing(true);

    try {
      let working = [...itemsRef.current];

      for (const item of itemsRef.current) {
        if (!item.pending) continue;

        try {
          if (item.pending === 'delete') {
            if (!isLocalId(item.id)) {
              await request(`${endpoint}/${item.id}`, idToken, { method: 'DELETE' });
            }
            working = working.filter((entry) => entry.id !== item.id);
          } else if (item.pending === 'create' || isLocalId(item.id)) {
            const created = await request<T>(endpoint, idToken, {
              method: 'POST',
              body: JSON.stringify(toPayload(item)),
            });
            working = working.map((entry) => (entry.id === item.id ? created : entry));
          } else {
            const updated = await request<T>(`${endpoint}/${item.id}`, idToken, {
              method: 'PATCH',
              body: JSON.stringify(toPayload(item)),
            });
            working = working.map((entry) => (entry.id === item.id ? updated : entry));
          }
        } catch {
          // Leave it pending and carry on; it retries on the next sync.
        }
      }

      const payload = await request<Record<string, T[]>>(endpoint, idToken);
      const remote = payload[listKey] ?? [];

      // Anything still pending is newer than the server's copy, so it wins.
      const stillPending = working.filter((item) => item.pending);
      const pendingIds = new Set(stillPending.map((item) => item.id));

      commit([...stillPending, ...remote.filter((item) => !pendingIds.has(item.id))]);
      setError(null);
    } catch (err) {
      // Offline or backend down — local data stands, so this is not fatal.
      setError(err instanceof Error ? err.message : 'Unable to sync');
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [idToken, endpoint, listKey, toPayload, commit]);

  useEffect(() => {
    if (!isReady || !idToken) return;
    void sync();
  }, [isReady, idToken, sync]);

  const create = useCallback(
    async (input: TInput) => {
      const record = { ...createLocal(input), pending: 'create' as const };
      commit([record, ...itemsRef.current]);
      void sync();
      return record;
    },
    [createLocal, commit, sync],
  );

  const update = useCallback(
    async (id: string, patch: Partial<T>) => {
      const existing = itemsRef.current.find((item) => item.id === id);
      if (!existing) throw new Error('Record not found');

      const updated: Stored<T> = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
        // Something that never reached the server is still a create.
        pending: existing.pending === 'create' ? 'create' : 'update',
      };

      commit(itemsRef.current.map((item) => (item.id === id ? updated : item)));
      void sync();
      return updated;
    },
    [commit, sync],
  );

  const remove = useCallback(
    async (id: string) => {
      const existing = itemsRef.current.find((item) => item.id === id);

      // Never synced, so it can just go.
      if (!existing || existing.pending === 'create' || isLocalId(id)) {
        commit(itemsRef.current.filter((item) => item.id !== id));
        return;
      }

      commit(
        itemsRef.current.map((item) =>
          item.id === id ? { ...item, pending: 'delete' as const } : item,
        ),
      );
      void sync();
    },
    [commit, sync],
  );

  return {
    // Tombstones live in storage until the server confirms; never show them.
    items: items.filter((item) => item.pending !== 'delete'),
    isLoading,
    isSyncing,
    error,
    isSignedIn: Boolean(idToken),
    hasPendingChanges: items.some((item) => item.pending),
    refresh: sync,
    create,
    update,
    remove,
  };
}
