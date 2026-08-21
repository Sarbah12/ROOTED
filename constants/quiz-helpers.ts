import type { QuizDifficulty, QuizQuestion } from '@/constants/quiz';

/**
 * Builds a question with the answer taken from the options by index.
 *
 * Keeping `answer` as a separate string makes it possible to ship a question
 * whose answer is not among the choices — the kind of mistake that survives
 * review and then embarrasses you in front of a user. Taking it by index makes
 * that impossible to express.
 *
 * Shared by every bank so there is one definition rather than one per file.
 */
export function q(
  id: string,
  question: string,
  options: string[],
  answerIndex: number,
  reference: string,
  difficulty: QuizDifficulty,
  bookId: string,
  topics: string[] = [],
): QuizQuestion {
  return { id, question, options, answer: options[answerIndex], reference, difficulty, bookId, topics };
}
