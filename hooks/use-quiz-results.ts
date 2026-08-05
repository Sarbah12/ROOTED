import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Per-subject quiz history, stored on device.
 *
 * There is no backend endpoint for quiz results, so this is local only —
 * unlike notes and prayers, nothing here syncs.
 */

export type QuizResult = {
  /** `book:jhn` or `topic:faith`. */
  subjectKey: string;
  bestScore: number;
  bestTotal: number;
  attempts: number;
  lastScore: number;
  lastTakenAt: string;
};

const STORAGE_KEY = 'rooted:quiz-results:v1';

export function subjectKey(kind: 'book' | 'topic', id: string) {
  return `${kind}:${id}`;
}

export function useQuizResults() {
  const [results, setResults] = useState<Record<string, QuizResult>>({});
  const [isLoading, setIsLoading] = useState(true);
  const resultsRef = useRef<Record<string, QuizResult>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      let stored: Record<string, QuizResult> = {};
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        stored = raw ? (JSON.parse(raw) as Record<string, QuizResult>) : {};
      } catch {
        stored = {};
      }
      if (!active) return;
      resultsRef.current = stored;
      setResults(stored);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const recordResult = useCallback(
    async (kind: 'book' | 'topic', id: string, score: number, total: number) => {
      const key = subjectKey(kind, id);
      const previous = resultsRef.current[key];

      const next: QuizResult = {
        subjectKey: key,
        // Compare as a ratio so a longer quiz does not automatically "win".
        bestScore:
          previous && previous.bestScore / previous.bestTotal >= score / total
            ? previous.bestScore
            : score,
        bestTotal:
          previous && previous.bestScore / previous.bestTotal >= score / total
            ? previous.bestTotal
            : total,
        attempts: (previous?.attempts ?? 0) + 1,
        lastScore: score,
        lastTakenAt: new Date().toISOString(),
      };

      const updated = { ...resultsRef.current, [key]: next };
      resultsRef.current = updated;
      setResults(updated);

      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Best-effort; the score still shows for this session.
      }

      return next;
    },
    [],
  );

  const getResult = useCallback(
    (kind: 'book' | 'topic', id: string) => results[subjectKey(kind, id)] ?? null,
    [results],
  );

  return { results, isLoading, recordResult, getResult };
}
