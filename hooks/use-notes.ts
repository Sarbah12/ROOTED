import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { BACKEND_API_BASE_URL } from '@/constants/firebase';
import { useFirebaseAuth } from '@/context/firebase-auth';

/**
 * Notes are offline-first: the device is the source of truth and every edit is
 * written to AsyncStorage immediately. The backend is a sync layer — when the
 * user is signed in and reachable, local changes are pushed and remote ones
 * pulled. Losing a note because the network blipped is not acceptable for a
 * journal, so nothing here depends on the request succeeding.
 */

export type BackendNote = {
  id: string;
  title: string;
  reference: string;
  content: string;
  tags: string[];
  color: string;
  updatedAt: string;
};

export type NoteInput = {
  title: string;
  reference: string;
  content: string;
  tags: string[];
  color?: string;
};

/** A note plus the sync operation still owed to the server, if any. */
type StoredNote = BackendNote & {
  pending?: 'create' | 'update' | 'delete';
};

const STORAGE_KEY = 'rooted:notes:v1';
const DEFAULT_COLOR = '#2E6A5C';
const REQUEST_TIMEOUT_MS = 8000;

function localId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isLocalId(id: string) {
  return id.startsWith('local-');
}

function sortByUpdated(notes: StoredNote[]) {
  return [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

async function readLocal(): Promise<StoredNote[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredNote[]) : [];
  } catch {
    return [];
  }
}

async function writeLocal(notes: StoredNote[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // Persisting is best-effort; the in-memory list still reflects the edit.
  }
}

async function request<T>(path: string, idToken: string, init?: RequestInit): Promise<T> {
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

export function useNotes() {
  const { idToken, isReady } = useFirebaseAuth();
  const [notes, setNotes] = useState<StoredNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mirrors `notes` so callbacks can read the latest list without re-binding.
  const notesRef = useRef<StoredNote[]>([]);
  const syncingRef = useRef(false);

  const commit = useCallback((next: StoredNote[]) => {
    const sorted = sortByUpdated(next);
    notesRef.current = sorted;
    setNotes(sorted);
    void writeLocal(sorted);
    return sorted;
  }, []);

  // Load from disk first so notes appear instantly, offline or not.
  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await readLocal();
      if (!active) return;
      notesRef.current = stored;
      setNotes(sortByUpdated(stored));
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  /** Pushes anything pending, then reconciles with the server. */
  const sync = useCallback(async () => {
    if (!idToken || syncingRef.current) {
      return;
    }

    syncingRef.current = true;
    setIsSyncing(true);

    try {
      let working = [...notesRef.current];

      for (const note of notesRef.current) {
        if (!note.pending) continue;

        try {
          if (note.pending === 'delete') {
            if (!isLocalId(note.id)) {
              await request(`/v1/notes/${note.id}`, idToken, { method: 'DELETE' });
            }
            working = working.filter((item) => item.id !== note.id);
          } else if (note.pending === 'create' || isLocalId(note.id)) {
            const created = await request<BackendNote>('/v1/notes', idToken, {
              method: 'POST',
              body: JSON.stringify({
                title: note.title,
                reference: note.reference,
                content: note.content,
                tags: note.tags,
                color: note.color,
              }),
            });
            working = working.map((item) => (item.id === note.id ? created : item));
          } else {
            const updated = await request<BackendNote>(`/v1/notes/${note.id}`, idToken, {
              method: 'PATCH',
              body: JSON.stringify({
                title: note.title,
                reference: note.reference,
                content: note.content,
                tags: note.tags,
                color: note.color,
              }),
            });
            working = working.map((item) => (item.id === note.id ? updated : item));
          }
        } catch {
          // Leave this one pending and try the rest; it retries next sync.
        }
      }

      const payload = await request<{ notes: BackendNote[] }>('/v1/notes', idToken);

      // Anything still pending is newer than what the server knows, so it wins.
      const stillPending = working.filter((note) => note.pending);
      const pendingIds = new Set(stillPending.map((note) => note.id));
      const merged = [
        ...stillPending,
        ...payload.notes.filter((note) => !pendingIds.has(note.id)),
      ];

      commit(merged);
      setError(null);
    } catch (err) {
      // Offline or backend down — local notes stand, so this is not fatal.
      setError(err instanceof Error ? err.message : 'Unable to sync notes');
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [idToken, commit]);

  useEffect(() => {
    if (!isReady || !idToken) return;
    void sync();
  }, [isReady, idToken, sync]);

  const createNote = useCallback(
    async (input: NoteInput) => {
      const note: StoredNote = {
        id: localId(),
        title: input.title,
        reference: input.reference,
        content: input.content,
        tags: input.tags,
        color: input.color ?? DEFAULT_COLOR,
        updatedAt: new Date().toISOString(),
        pending: 'create',
      };

      commit([note, ...notesRef.current]);
      void sync();
      return note;
    },
    [commit, sync],
  );

  const updateNote = useCallback(
    async (id: string, input: Partial<NoteInput>) => {
      const existing = notesRef.current.find((note) => note.id === id);
      if (!existing) {
        throw new Error('Note not found');
      }

      const updated: StoredNote = {
        ...existing,
        ...input,
        updatedAt: new Date().toISOString(),
        // A note that has not reached the server yet is still a create.
        pending: existing.pending === 'create' ? 'create' : 'update',
      };

      commit(notesRef.current.map((note) => (note.id === id ? updated : note)));
      void sync();
      return updated;
    },
    [commit, sync],
  );

  const deleteNote = useCallback(
    async (id: string) => {
      const existing = notesRef.current.find((note) => note.id === id);

      // Never synced, so it can just go.
      if (!existing || existing.pending === 'create' || isLocalId(id)) {
        commit(notesRef.current.filter((note) => note.id !== id));
        return;
      }

      commit(
        notesRef.current.map((note) =>
          note.id === id ? { ...note, pending: 'delete' as const } : note,
        ),
      );
      void sync();
    },
    [commit, sync],
  );

  // Tombstones stay in storage until the server confirms; never show them.
  const visibleNotes = notes.filter((note) => note.pending !== 'delete');

  return {
    notes: visibleNotes,
    isLoading,
    isSyncing,
    error,
    isSignedIn: Boolean(idToken),
    hasPendingChanges: notes.some((note) => note.pending),
    refresh: sync,
    createNote,
    updateNote,
    deleteNote,
  };
}
