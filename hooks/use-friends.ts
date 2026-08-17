import { useCallback, useEffect, useState } from 'react';

import { useFirebaseAuth } from '@/context/firebase-auth';
import { planRequest } from '@/hooks/use-plan';

/**
 * Friends, and the nudges they send.
 *
 * Reuses planRequest because it already does the one thing that matters here —
 * bearer token, timeout, and an error carrying the server's message rather than
 * a generic failure. The name is about where it started, not what it can do.
 */

export type Friend = {
  friendshipId: string;
  userId: string;
  displayName: string;
  username: string | null;
  status: 'pending' | 'accepted';
  /** They asked, and this user has not answered yet. */
  awaitingMyReply: boolean;
  since: string | null;
  lastNudgedAt: string | null;
};

export type Nudge = {
  id: string;
  message: string;
  fromName: string;
  fromUsername: string | null;
  createdAt: string;
  seen: boolean;
};

/** True when the last nudge to this friend was today. */
export function nudgedToday(friend: Friend) {
  if (!friend.lastNudgedAt) return false;
  const last = new Date(friend.lastNudgedAt);
  const now = new Date();
  return (
    last.getFullYear() === now.getFullYear() &&
    last.getMonth() === now.getMonth() &&
    last.getDate() === now.getDate()
  );
}

export function useFriends() {
  const { idToken, isReady } = useFirebaseAuth();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!idToken) {
      setFriends([]);
      setNudges([]);
      setIsLoading(false);
      return;
    }

    try {
      const [friendPayload, nudgePayload] = await Promise.all([
        planRequest<{ friends: Friend[] }>('/v1/friends', idToken),
        planRequest<{ nudges: Nudge[] }>('/v1/nudges', idToken),
      ]);
      setFriends(friendPayload.friends ?? []);
      setNudges(nudgePayload.nudges ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your friends');
    } finally {
      setIsLoading(false);
    }
  }, [idToken]);

  useEffect(() => {
    if (!isReady) return;
    void refresh();
  }, [isReady, refresh]);

  /** Ask to connect. Throws with the server's wording so the screen can show it. */
  const addFriend = useCallback(
    async (username: string) => {
      if (!idToken) return null;
      const result = await planRequest<{ status: string; displayName: string }>(
        '/v1/friends',
        idToken,
        { method: 'POST', body: JSON.stringify({ username }) },
      );
      await refresh();
      return result;
    },
    [idToken, refresh],
  );

  const accept = useCallback(
    async (friendshipId: string) => {
      if (!idToken) return;
      await planRequest(`/v1/friends/${friendshipId}/accept`, idToken, { method: 'POST' });
      await refresh();
    },
    [idToken, refresh],
  );

  const remove = useCallback(
    async (friendshipId: string) => {
      if (!idToken) return;
      await planRequest(`/v1/friends/${friendshipId}`, idToken, { method: 'DELETE' });
      await refresh();
    },
    [idToken, refresh],
  );

  /**
   * Nudge a friend. The daily limit is enforced by the database, so a refusal
   * here is authoritative rather than advisory.
   */
  const nudge = useCallback(
    async (friendUserId: string, message = '') => {
      if (!idToken) return;
      await planRequest(`/v1/friends/${friendUserId}/nudge`, idToken, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      await refresh();
    },
    [idToken, refresh],
  );

  const markSeen = useCallback(async () => {
    if (!idToken || nudges.every((n) => n.seen)) return;
    await planRequest('/v1/nudges/seen', idToken, { method: 'POST' });
    setNudges((prev) => prev.map((n) => ({ ...n, seen: true })));
  }, [idToken, nudges]);

  return {
    friends: friends.filter((f) => f.status === 'accepted'),
    requests: friends.filter((f) => f.status === 'pending' && f.awaitingMyReply),
    sent: friends.filter((f) => f.status === 'pending' && !f.awaitingMyReply),
    nudges,
    unseenCount: nudges.filter((n) => !n.seen).length,
    isLoading,
    error,
    refresh,
    addFriend,
    accept,
    remove,
    nudge,
    markSeen,
    isSignedIn: Boolean(idToken),
  };
}
