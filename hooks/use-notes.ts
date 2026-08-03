import { useCallback, useEffect, useState } from 'react';

import { BACKEND_API_BASE_URL } from '@/constants/firebase';
import { useFirebaseAuth } from '@/context/firebase-auth';

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

async function request<T>(path: string, idToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_API_BASE_URL}${path}`, {
    ...init,
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
}

export function useNotes() {
  const { idToken, isReady } = useFirebaseAuth();
  const [notes, setNotes] = useState<BackendNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!idToken) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = await request<{ notes: BackendNote[] }>('/v1/notes', idToken);
      setNotes(payload.notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load notes');
    } finally {
      setIsLoading(false);
    }
  }, [idToken]);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    refresh();
  }, [isReady, refresh]);

  const createNote = useCallback(
    async (input: NoteInput) => {
      if (!idToken) {
        throw new Error('Not signed in');
      }
      const created = await request<BackendNote>('/v1/notes', idToken, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      setNotes((previous) => [created, ...previous]);
      return created;
    },
    [idToken],
  );

  const updateNote = useCallback(
    async (id: string, input: Partial<NoteInput>) => {
      if (!idToken) {
        throw new Error('Not signed in');
      }
      const updated = await request<BackendNote>(`/v1/notes/${id}`, idToken, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
      setNotes((previous) => previous.map((note) => (note.id === id ? updated : note)));
      return updated;
    },
    [idToken],
  );

  const deleteNote = useCallback(
    async (id: string) => {
      if (!idToken) {
        throw new Error('Not signed in');
      }
      await request(`/v1/notes/${id}`, idToken, { method: 'DELETE' });
      setNotes((previous) => previous.filter((note) => note.id !== id));
    },
    [idToken],
  );

  return {
    notes,
    isLoading,
    error,
    isSignedIn: Boolean(idToken),
    refresh,
    createNote,
    updateNote,
    deleteNote,
  };
}
