import { useCallback, useEffect, useState } from 'react';

import { useFirebaseAuth } from '@/context/firebase-auth';
import { planRequest } from '@/hooks/use-plan';

/**
 * Community blog.
 *
 * Not offline-first: a feed of other people's writing is only meaningful
 * against the server, and showing a stale like count would be worse than
 * showing none. Drafts are the exception the author always sees.
 */

export type Post = {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  excerpt: string;
  coverImageUrl: string | null;
  tags: string[];
  status: 'draft' | 'published';
  likeCount: number;
  commentCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  likedByMe?: boolean;
};

export type PostComment = {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type PostInput = {
  title: string;
  body: string;
  excerpt?: string;
  coverImageUrl?: string;
  tags?: string[];
  status?: 'draft' | 'published';
};

/** The feed, or the caller's own posts including drafts. */
export function usePosts(scope: 'feed' | 'mine' = 'feed', tag?: string) {
  const { idToken, isReady } = useFirebaseAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!idToken) {
      setPosts([]);
      setIsLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({ scope });
      if (tag) params.set('tag', tag);

      const payload = await planRequest<{ posts: Post[] }>(
        `/v1/posts?${params.toString()}`,
        idToken,
      );
      setPosts(payload.posts ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load posts');
    } finally {
      setIsLoading(false);
    }
  }, [idToken, scope, tag]);

  useEffect(() => {
    if (!isReady) return;
    void refresh();
  }, [isReady, refresh]);

  const create = useCallback(
    async (input: PostInput) => {
      if (!idToken) throw new Error('Sign in to write a post');
      const created = await planRequest<Post>('/v1/posts', idToken, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      await refresh();
      return created;
    },
    [idToken, refresh],
  );

  return { posts, isLoading, error, refresh, create, isSignedIn: Boolean(idToken) };
}

/** A single post, its comments, and the actions on it. */
export function usePost(postId: string | undefined) {
  const { idToken, isReady } = useFirebaseAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!postId || !idToken) {
      setIsLoading(false);
      return;
    }

    try {
      const [loaded, commentPayload] = await Promise.all([
        planRequest<Post>(`/v1/posts/${postId}`, idToken),
        planRequest<{ comments: PostComment[] }>(`/v1/posts/${postId}/comments`, idToken),
      ]);
      setPost(loaded);
      setComments(commentPayload.comments ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load this post');
    } finally {
      setIsLoading(false);
    }
  }, [postId, idToken]);

  useEffect(() => {
    if (!isReady) return;
    void refresh();
  }, [isReady, refresh]);

  const toggleLike = useCallback(async () => {
    if (!postId || !idToken || !post) return;

    const wasLiked = Boolean(post.likedByMe);
    // Move the heart straight away; the server is authoritative but the tap
    // should not wait on a round trip.
    setPost((prev) =>
      prev
        ? { ...prev, likedByMe: !wasLiked, likeCount: prev.likeCount + (wasLiked ? -1 : 1) }
        : prev,
    );

    try {
      const result = await planRequest<{ liked: boolean; likeCount: number }>(
        `/v1/posts/${postId}/like`,
        idToken,
        { method: wasLiked ? 'DELETE' : 'POST' },
      );
      setPost((prev) =>
        prev ? { ...prev, likedByMe: result.liked, likeCount: result.likeCount } : prev,
      );
    } catch {
      // Put it back — the change did not stick.
      setPost((prev) =>
        prev
          ? { ...prev, likedByMe: wasLiked, likeCount: prev.likeCount + (wasLiked ? 1 : -1) }
          : prev,
      );
    }
  }, [postId, idToken, post]);

  const comment = useCallback(
    async (body: string) => {
      if (!postId || !idToken) return;
      const created = await planRequest<PostComment>(`/v1/posts/${postId}/comments`, idToken, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
      setComments((prev) => [created, ...prev]);
      setPost((prev) => (prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev));
    },
    [postId, idToken],
  );

  const removeComment = useCallback(
    async (commentId: string) => {
      if (!idToken) return;
      await planRequest(`/v1/comments/${commentId}`, idToken, { method: 'DELETE' });
      setComments((prev) => prev.filter((item) => item.id !== commentId));
      setPost((prev) =>
        prev ? { ...prev, commentCount: Math.max(0, prev.commentCount - 1) } : prev,
      );
    },
    [idToken],
  );

  const update = useCallback(
    async (patch: Partial<PostInput>) => {
      if (!postId || !idToken) return;
      const updated = await planRequest<Post>(`/v1/posts/${postId}`, idToken, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setPost(updated);
      return updated;
    },
    [postId, idToken],
  );

  const remove = useCallback(async () => {
    if (!postId || !idToken) return;
    await planRequest(`/v1/posts/${postId}`, idToken, { method: 'DELETE' });
  }, [postId, idToken]);

  /** Report content — required by App Store Guideline 1.2. */
  const report = useCallback(
    async (targetType: 'post' | 'comment', targetId: string, reason: string) => {
      if (!idToken) return;
      await planRequest('/v1/reports', idToken, {
        method: 'POST',
        body: JSON.stringify({ targetType, targetId, reason }),
      });
    },
    [idToken],
  );

  const block = useCallback(
    async (userId: string) => {
      if (!idToken) return;
      await planRequest('/v1/blocks', idToken, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      setComments((prev) => prev.filter((item) => item.userId !== userId));
    },
    [idToken],
  );

  return {
    post,
    comments,
    isLoading,
    error,
    refresh,
    toggleLike,
    comment,
    removeComment,
    update,
    remove,
    report,
    block,
  };
}
