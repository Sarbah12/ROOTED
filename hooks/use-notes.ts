import { useCallback } from 'react';

import { newLocalRecord, useSyncedCollection } from '@/hooks/use-synced-collection';

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

const DEFAULT_COLOR = '#2E6A5C';

/** Study notes — offline-first, synced to /v1/notes when signed in. */
export function useNotes() {
  const createLocal = useCallback(
    (input: NoteInput) =>
      newLocalRecord<BackendNote>({
        title: input.title,
        reference: input.reference,
        content: input.content,
        tags: input.tags,
        color: input.color ?? DEFAULT_COLOR,
      }),
    [],
  );

  const toPayload = useCallback(
    (note: BackendNote) => ({
      title: note.title,
      reference: note.reference,
      content: note.content,
      tags: note.tags,
      color: note.color,
    }),
    [],
  );

  const collection = useSyncedCollection<BackendNote, NoteInput>({
    storageKey: 'rooted:notes:v1',
    endpoint: '/v1/notes',
    listKey: 'notes',
    createLocal,
    toPayload,
  });

  return {
    notes: collection.items,
    isLoading: collection.isLoading,
    isSyncing: collection.isSyncing,
    error: collection.error,
    isSignedIn: collection.isSignedIn,
    hasPendingChanges: collection.hasPendingChanges,
    refresh: collection.refresh,
    createNote: collection.create,
    updateNote: collection.update,
    deleteNote: collection.remove,
  };
}
