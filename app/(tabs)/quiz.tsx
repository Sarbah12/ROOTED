import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_THEMES } from '@/constants/app-theme';
import { QUIZ_DIFFICULTY_COLORS } from '@/constants/bible-study';
import {
  getBookSubjects,
  getQuestionsForSubject,
  getTopicSubjects,
  shuffle,
  type QuizQuestion,
  type QuizSubject,
} from '@/constants/quiz';
import { explainAnswer } from '@/constants/quiz-explanation';
import { useThemeMode } from '@/context/theme-mode';
import { SignInRequired } from '@/components/sign-in-required';
import { useFirebaseAuth } from '@/context/firebase-auth';
import { useQuizResults } from '@/hooks/use-quiz-results';

type Phase = 'browse' | 'quiz' | 'results';
type Mode = 'book' | 'topic';

type AnswerRecord = {
  question: string;
  selected: string;
  correct: boolean;
  answer: string;
  reference: string;
};

export default function QuizScreen() {
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;
  const { getResult, recordResult } = useQuizResults();
  const { firebaseUser } = useFirebaseAuth();

  const [phase, setPhase] = useState<Phase>('browse');
  const [mode, setMode] = useState<Mode>('book');
  const [subject, setSubject] = useState<QuizSubject | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  const bookSubjects = useMemo(() => getBookSubjects(), []);
  const topicSubjects = useMemo(() => getTopicSubjects(), []);
  const subjects = mode === 'book' ? bookSubjects : topicSubjects;

  const q = questions[current];
  const progress = questions.length > 0 ? current / questions.length : 0;

  const startQuiz = (next: QuizSubject) => {
    const pool = shuffle(getQuestionsForSubject(next.kind, next.id));
    setSubject(next);
    setQuestions(pool);
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setAnswers([]);
    setPhase('quiz');
  };

  const backToBrowse = () => {
    setPhase('browse');
    setSubject(null);
    setQuestions([]);
  };

  const handleSelect = (option: string) => {
    if (revealed) return;
    setSelected(option);
    setRevealed(true);

    const correct = option === q.answer;
    if (correct) setScore((value) => value + 1);

    setAnswers((previous) => [
      ...previous,
      {
        question: q.question,
        selected: option,
        correct,
        answer: q.answer,
        reference: q.reference,
      },
    ]);
  };

  const handleNext = () => {
    const isLast = current + 1 >= questions.length;

    if (isLast) {
      const finalScore = score;
      if (subject) {
        void recordResult(subject.kind, subject.id, finalScore, questions.length);
      }
      setPhase('results');
      return;
    }

    setCurrent((value) => value + 1);
    setSelected(null);
    setRevealed(false);
  };

  if (!firebaseUser) {
    return (
      <SignInRequired
        icon="help-circle-outline"
        title="Sign in to take quizzes"
        body="Scores are saved against your account so you can see how a subject is going over time."
      />
    );
  }

  // ---------------------------------------------------------------- browse
  if (phase === 'browse') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View pointerEvents="none" style={[styles.glowTopRight, { backgroundColor: theme.glow }]} />
        <View pointerEvents="none" style={[styles.glowBottomLeft, { backgroundColor: theme.glow }]} />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.heroCard, { backgroundColor: theme.primary }]}>
            <View style={styles.heroHeader}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>QUIZ</Text>
              </View>
              <Text style={styles.heroMeta}>{subjects.length} available</Text>
            </View>
            <Text style={styles.heroTitle}>Test what you studied</Text>
            <Text style={styles.heroBody}>
              Pick a book you have been reading, or a topic you have been studying, and
              check what stayed with you.
            </Text>
          </View>

          <View style={[styles.segRow, { backgroundColor: theme.surfaceAlt }]}>
            {(['book', 'topic'] as Mode[]).map((item) => {
              const active = mode === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.segBtn, active && { backgroundColor: theme.surface }]}
                  onPress={() => setMode(item)}
                  activeOpacity={0.85}>
                  <Ionicons
                    name={item === 'book' ? 'book-outline' : 'pricetags-outline'}
                    size={15}
                    color={active ? theme.primary : theme.textMuted}
                  />
                  <Text
                    style={[
                      styles.segText,
                      { color: active ? theme.primary : theme.textMuted },
                    ]}>
                    {item === 'book' ? 'By book' : 'By topic'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: theme.text }]}>
              {mode === 'book' ? 'Books' : 'Topics'}
            </Text>
            <Text style={[styles.sectionMeta, { color: theme.textMuted }]}>Tap to start</Text>
          </View>

          <View style={styles.subjectList}>
            {subjects.map((item) => {
              const result = getResult(item.kind, item.id);
              const pct = result ? Math.round((result.bestScore / result.bestTotal) * 100) : null;

              return (
                <TouchableOpacity
                  key={`${item.kind}-${item.id}`}
                  style={[
                    styles.subjectCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                  onPress={() => startQuiz(item)}
                  activeOpacity={0.85}>
                  <View style={styles.subjectMain}>
                    <Text style={[styles.subjectName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.subjectBlurb, { color: theme.textSecondary }]} numberOfLines={1}>
                      {item.blurb}
                    </Text>
                    <Text style={[styles.subjectMeta, { color: theme.textMuted }]}>
                      {item.questionCount} question{item.questionCount === 1 ? '' : 's'}
                      {result ? ` · ${result.attempts} attempt${result.attempts === 1 ? '' : 's'}` : ''}
                    </Text>
                  </View>

                  {pct !== null ? (
                    <View style={[styles.scorePill, { backgroundColor: theme.primarySoft }]}>
                      <Text style={[styles.scorePillValue, { color: theme.primary }]}>{pct}%</Text>
                      <Text style={[styles.scorePillLabel, { color: theme.primary }]}>best</Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ------------------------------------------------------------------ quiz
  if (phase === 'quiz' && q) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View pointerEvents="none" style={[styles.glowTopRight, { backgroundColor: theme.glow }]} />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.quizTopBar}>
            <TouchableOpacity onPress={backToBrowse} style={styles.backBtn} activeOpacity={0.8}>
              <Ionicons name="chevron-back" size={20} color={theme.textSecondary} />
              <Text style={[styles.backText, { color: theme.textSecondary }]}>Subjects</Text>
            </TouchableOpacity>
            <Text style={[styles.quizSubject, { color: theme.text }]} numberOfLines={1}>
              {subject?.name}
            </Text>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: theme.surfaceAlt }]}>
            <View
              style={[styles.progressFill, { backgroundColor: theme.primary, width: `${progress * 100}%` }]}
            />
          </View>
          <View style={styles.progressMetaRow}>
            <Text style={[styles.progressMeta, { color: theme.textMuted }]}>
              Question {current + 1} of {questions.length}
            </Text>
            <Text style={[styles.progressMeta, { color: theme.textMuted }]}>Score {score}</Text>
          </View>

          <View style={[styles.qCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.qMetaRow}>
              <View
                style={[
                  styles.difficultyChip,
                  { backgroundColor: `${QUIZ_DIFFICULTY_COLORS[q.difficulty]}22` },
                ]}>
                <Text
                  style={[styles.difficultyText, { color: QUIZ_DIFFICULTY_COLORS[q.difficulty] }]}>
                  {q.difficulty}
                </Text>
              </View>
              <Text style={[styles.qReference, { color: theme.textMuted }]}>{q.reference}</Text>
            </View>

            <Text style={[styles.qText, { color: theme.text }]}>{q.question}</Text>
          </View>

          <View style={styles.options}>
            {q.options.map((option) => {
              const isChosen = selected === option;
              const isAnswer = option === q.answer;

              let background = theme.surface;
              let borderColor = theme.border;
              let textColor = theme.text;

              if (revealed && isAnswer) {
                background = theme.primarySoft;
                borderColor = theme.primary;
                textColor = theme.primary;
              } else if (revealed && isChosen) {
                background = `${QUIZ_DIFFICULTY_COLORS.Hard}18`;
                borderColor = QUIZ_DIFFICULTY_COLORS.Hard;
                textColor = QUIZ_DIFFICULTY_COLORS.Hard;
              }

              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionBtn, { backgroundColor: background, borderColor }]}
                  onPress={() => handleSelect(option)}
                  disabled={revealed}
                  activeOpacity={0.85}>
                  <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
                  {revealed && isAnswer ? (
                    <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                  ) : null}
                  {revealed && isChosen && !isAnswer ? (
                    <Ionicons name="close-circle" size={20} color={QUIZ_DIFFICULTY_COLORS.Hard} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          {/*
            Shown whether the answer was right or wrong. Getting it right and
            being told nothing teaches as little as getting it wrong — the
            passage is the point, not the score.
          */}
          {revealed ? (
            (() => {
              const explanation = explainAnswer(q.reference);
              if (!explanation) return null;

              return (
                <View
                  style={[
                    styles.explainCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}>
                  <View style={styles.explainHeader}>
                    <Ionicons name="book-outline" size={15} color={theme.primary} />
                    <Text style={[styles.explainRef, { color: theme.primary }]}>
                      {explanation.reference}
                    </Text>
                  </View>

                  <Text style={[styles.explainAnswer, { color: theme.text }]}>{q.answer}</Text>

                  {explanation.verses.map((verse) => (
                    <Text key={verse.verse} style={[styles.explainVerse, { color: theme.textSecondary }]}>
                      <Text style={[styles.explainVerseNum, { color: theme.textMuted }]}>
                        {verse.verse}{' '}
                      </Text>
                      {verse.text}
                    </Text>
                  ))}

                  {explanation.truncated ? (
                    <Text style={[styles.explainMore, { color: theme.textMuted }]}>
                      Read the rest in {q.reference}.
                    </Text>
                  ) : null}
                </View>
              );
            })()
          ) : null}

          {revealed ? (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
              onPress={handleNext}
              activeOpacity={0.88}>
              <Text style={styles.primaryBtnText}>
                {current + 1 >= questions.length ? 'See results' : 'Next question'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --------------------------------------------------------------- results
  const total = questions.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const best = subject ? getResult(subject.kind, subject.id) : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View pointerEvents="none" style={[styles.glowTopRight, { backgroundColor: theme.glow }]} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: theme.primary }]}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>RESULTS</Text>
            </View>
            <Text style={styles.heroMeta}>{subject?.name}</Text>
          </View>
          <Text style={styles.heroTitle}>
            {score} / {total} · {pct}%
          </Text>
          <Text style={styles.heroBody}>
            {pct >= 80
              ? 'Strong recall. This one has stuck with you.'
              : pct >= 50
                ? 'A solid start — worth another pass through the passage.'
                : 'Worth re-reading this one before trying again.'}
            {best && best.attempts > 1
              ? `  Best so far: ${Math.round((best.bestScore / best.bestTotal) * 100)}%.`
              : ''}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: theme.text }]}>Review</Text>
          <Text style={[styles.sectionMeta, { color: theme.textMuted }]}>
            {answers.filter((item) => item.correct).length} correct
          </Text>
        </View>

        {answers.map((item, index) => (
          <View
            key={`${item.question}-${index}`}
            style={[
              styles.reviewCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderLeftColor: item.correct ? theme.primary : QUIZ_DIFFICULTY_COLORS.Hard,
              },
            ]}>
            <Text style={[styles.reviewQuestion, { color: theme.text }]}>{item.question}</Text>
            {!item.correct ? (
              <Text style={[styles.reviewLine, { color: QUIZ_DIFFICULTY_COLORS.Hard }]}>
                You said: {item.selected}
              </Text>
            ) : null}
            <Text style={[styles.reviewLine, { color: theme.primary }]}>
              Answer: {item.answer}
            </Text>
            <Text style={[styles.reviewRef, { color: theme.textMuted }]}>{item.reference}</Text>
          </View>
        ))}

        <View style={styles.resultActions}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={backToBrowse}
            activeOpacity={0.85}>
            <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Other subjects</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, styles.primaryBtnFlex, { backgroundColor: theme.primary }]}
            onPress={() => subject && startQuiz(subject)}
            activeOpacity={0.88}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  glowTopRight: {
    position: 'absolute',
    top: -90,
    right: -90,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  glowBottomLeft: {
    position: 'absolute',
    left: -120,
    bottom: 60,
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  heroCard: {
    borderRadius: 28,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#0B1B33',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 6,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '700',
    maxWidth: '60%',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    fontFamily: 'Georgia',
    marginBottom: 8,
  },
  heroBody: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 21,
  },

  segRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 999,
    gap: 4,
    marginBottom: 4,
  },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 999,
  },
  segText: {
    fontSize: 13,
    fontWeight: '800',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 12,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 18,
    fontFamily: 'Georgia',
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '700',
  },

  subjectList: {
    gap: 10,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  subjectMain: { flex: 1 },
  subjectName: {
    fontSize: 16,
    fontWeight: '800',
  },
  subjectBlurb: {
    fontSize: 12.5,
    marginTop: 2,
  },
  subjectMeta: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 6,
  },
  scorePill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    minWidth: 56,
  },
  scorePillValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  scorePillLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  quizTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
  },
  quizSubject: {
    flex: 1,
    textAlign: 'right',
    fontSize: 15,
    fontFamily: 'Georgia',
  },

  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 14,
  },
  progressMeta: {
    fontSize: 12,
    fontWeight: '700',
  },

  qCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  qMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  difficultyChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '800',
  },
  qReference: {
    fontSize: 12,
    fontWeight: '700',
  },
  qText: {
    fontSize: 19,
    lineHeight: 27,
    fontFamily: 'Georgia',
  },

  options: {
    gap: 10,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },

  explainCard: { borderWidth: 1, borderRadius: 20, padding: 16, marginTop: 14, marginBottom: 4 },
  explainHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  explainRef: { fontSize: 12.5, fontWeight: '800', letterSpacing: 0.3 },
  explainAnswer: { fontSize: 15.5, fontWeight: '700', marginBottom: 10 },
  explainVerse: { fontSize: 14.5, lineHeight: 24, fontFamily: 'Georgia', marginBottom: 6 },
  explainVerseNum: { fontSize: 11, fontWeight: '800' },
  explainMore: { fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 15,
    marginTop: 18,
  },
  primaryBtnFlex: { flex: 1, marginTop: 0 },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 15,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },

  reviewCard: {
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  reviewQuestion: {
    fontSize: 14.5,
    fontWeight: '700',
    lineHeight: 21,
    marginBottom: 8,
  },
  reviewLine: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  reviewRef: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 6,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
});
