import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  COLORS,
  QUIZ_DIFFICULTY_COLORS,
  QUIZ_QUESTIONS,
} from '@/constants/bible-study';
import { APP_THEMES } from '@/constants/app-theme';
import { useThemeMode } from '@/context/theme-mode';

type Phase = 'intro' | 'quiz' | 'results';

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
  const [phase, setPhase] = useState<Phase>('intro');
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [filter, setFilter] = useState('All');

  const questions = QUIZ_QUESTIONS.filter(
    (question) => filter === 'All' || question.category === filter,
  );
  const q = questions[current];
  const progress = questions.length > 0 ? current / questions.length : 0;
  const categories = ['All', ...new Set(QUIZ_QUESTIONS.map((question) => question.category))];

  const restart = () => {
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setAnswers([]);
    setPhase('intro');
  };

  const startQuiz = () => {
    setPhase('quiz');
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setAnswers([]);
  };

  const handleSelect = (option: string) => {
    if (revealed || !q) {
      return;
    }

    setSelected(option);
    setRevealed(true);

    const correct = option === q.answer;
    if (correct) {
      setScore((value) => value + 1);
    }

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
    if (current + 1 >= questions.length) {
      setPhase('results');
      return;
    }

    setCurrent((value) => value + 1);
    setSelected(null);
    setRevealed(false);
  };

  const renderIntro = () => (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.heroCard, { backgroundColor: theme.primary }]}>
        <View style={styles.heroHeader}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>QUIZ</Text>
          </View>
          <Text style={styles.heroMeta}>{QUIZ_QUESTIONS.length} questions</Text>
        </View>
        <Text style={styles.heroTitle}>Test what you remember and keep learning.</Text>
        <Text style={styles.heroBody}>
          Choose a category, answer at your pace, and review the verse reference after each
          question.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, { color: theme.text }]}>Choose a category</Text>
        <Text style={[styles.sectionMeta, { color: theme.textMuted }]}>You can switch later</Text>
      </View>
      <View style={styles.catGrid}>
        {categories.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.catCard,
              {
                backgroundColor: filter === item ? theme.primarySoft : theme.surface,
                borderColor: filter === item ? theme.primary : theme.border,
              },
            ]}
            onPress={() => setFilter(item)}
            activeOpacity={0.8}>
            <Text style={[styles.catCardText, { color: filter === item ? theme.primary : theme.text }]}>
              {item}
            </Text>
            <Text style={[styles.catCardCount, { color: theme.textMuted }]}>
              {item === 'All'
                ? QUIZ_QUESTIONS.length
                : QUIZ_QUESTIONS.filter((question) => question.category === item).length}{' '}
              Qs
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, { color: theme.text }]}>Difficulty</Text>
        <Text style={[styles.sectionMeta, { color: theme.textMuted }]}>Easy to hard</Text>
      </View>
      <View style={styles.legendRow}>
        {Object.entries(QUIZ_DIFFICULTY_COLORS).map(([difficulty, color]) => (
          <View
            key={difficulty}
            style={[styles.legendItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>{difficulty}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={[styles.startBtn, { backgroundColor: theme.primary }]} onPress={startQuiz} activeOpacity={0.85}>
        <Text style={styles.startBtnText}>Start quiz</Text>
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </ScrollView>
  );

  const renderResults = () => {
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const grade = pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good job!' : 'Keep studying';
    const gradeColor = pct >= 80 ? COLORS.success : pct >= 60 ? COLORS.warning : COLORS.danger;

    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: theme.primary }]}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>RESULTS</Text>
            </View>
            <Text style={styles.heroMeta}>{pct}% correct</Text>
          </View>
          <Text style={styles.heroTitle}>{grade}</Text>
          <Text style={styles.heroBody}>
            You scored {score} out of {questions.length}. Review the questions below and try again
            when you are ready.
          </Text>
        </View>

        <View style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.resultRow}>
            <View style={[styles.scorePill, { backgroundColor: theme.primarySoft }]}>
              <Text style={[styles.scoreValue, { color: theme.primary }]}>{score}</Text>
              <Text style={[styles.scoreLabel, { color: theme.textMuted }]}>Correct</Text>
            </View>
            <View style={[styles.scorePill, { backgroundColor: theme.primarySoft }]}>
              <Text style={[styles.scoreValue, { color: gradeColor }]}>{pct}%</Text>
              <Text style={[styles.scoreLabel, { color: theme.textMuted }]}>Score</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: theme.text }]}>Review answers</Text>
          <Text style={[styles.sectionMeta, { color: theme.textMuted }]}>What to revisit</Text>
        </View>

        <View style={styles.reviewList}>
          {answers.map((answer, index) => (
            <View
              key={`${answer.question}-${index}`}
              style={[
                styles.reviewItem,
                {
                  backgroundColor: theme.surface,
                  borderColor: answer.correct ? COLORS.success : COLORS.danger,
                },
              ]}>
              <View
                style={[
                  styles.reviewIcon,
                  { backgroundColor: answer.correct ? `${COLORS.success}22` : `${COLORS.danger}22` },
                ]}>
                <Ionicons
                  name={answer.correct ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={answer.correct ? COLORS.success : COLORS.danger}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.reviewQ, { color: theme.text }]}>{answer.question}</Text>
                {!answer.correct ? (
                  <Text style={[styles.reviewCorrectAns, { color: theme.textSecondary }]}>
                    Correct answer: {answer.answer}
                  </Text>
                ) : null}
                <Text style={[styles.reviewRef, { color: theme.textMuted }]}>{answer.reference}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.startBtn, { backgroundColor: theme.primary }]} onPress={restart} activeOpacity={0.85}>
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
          <Text style={styles.startBtnText}>Try again</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderQuiz = () => {
    if (!q) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="help-circle-outline" size={32} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No questions available</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            This category does not have questions right now. Try a different filter.
          </Text>
          <TouchableOpacity style={[styles.startBtn, { backgroundColor: theme.primary }]} onPress={() => setFilter('All')} activeOpacity={0.85}>
            <Text style={styles.startBtnText}>Back to categories</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.quizTopRow}>
          <TouchableOpacity
            onPress={restart}
            style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            activeOpacity={0.8}>
            <Ionicons name="close" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.progressLabel, { color: theme.textMuted }]}>
            {current + 1} of {questions.length}
          </Text>
          <View style={[styles.scoreChip, { backgroundColor: theme.primarySoft }]}>
            <Text style={[styles.scoreChipText, { color: theme.primary }]}>{score} pts</Text>
          </View>
        </View>

        <View style={[styles.progressBar, { backgroundColor: theme.surfaceAlt }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: theme.primary }]} />
        </View>

        <View style={styles.quizMeta}>
          <View
            style={[
              styles.diffBadge,
              { backgroundColor: `${QUIZ_DIFFICULTY_COLORS[q.difficulty]}22` },
            ]}>
            <View style={[styles.diffDot, { backgroundColor: QUIZ_DIFFICULTY_COLORS[q.difficulty] }]} />
            <Text style={[styles.diffText, { color: QUIZ_DIFFICULTY_COLORS[q.difficulty] }]}>
              {q.difficulty}
            </Text>
          </View>
          <Text style={[styles.catLabel, { color: theme.textMuted }]}>{q.category}</Text>
        </View>

        <View style={[styles.questionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.questionText, { color: theme.text }]}>{q.question}</Text>
        </View>

        <View style={styles.optionsList}>
          {q.options.map((option) => {
            const isCorrect = option === q.answer;
            const isSelected = selected === option;
            const optionStyle = [
              styles.optionBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
              revealed && isCorrect ? { backgroundColor: `${COLORS.success}20`, borderColor: COLORS.success } : null,
              revealed && !isCorrect && isSelected ? { backgroundColor: `${COLORS.danger}20`, borderColor: COLORS.danger } : null,
              !revealed && isSelected ? { backgroundColor: theme.primarySoft, borderColor: theme.primary } : null,
            ];
            const optionTextStyle = [
              styles.optionText,
              { color: theme.text },
              revealed && isCorrect ? { color: COLORS.success } : null,
              revealed && !isCorrect && isSelected ? { color: COLORS.danger } : null,
            ];
            let iconName: keyof typeof Ionicons.glyphMap | null = null;

            if (revealed) {
              if (isCorrect) {
                iconName = 'checkmark-circle';
              } else if (isSelected) {
                iconName = 'close-circle';
              }
            }

            return (
              <TouchableOpacity
                key={option}
                style={optionStyle}
                onPress={() => handleSelect(option)}
                activeOpacity={0.8}>
                <Text style={optionTextStyle}>{option}</Text>
                {iconName ? (
                  <Ionicons
                    name={iconName}
                    size={18}
                    color={option === q.answer ? COLORS.success : COLORS.danger}
                  />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {revealed ? (
          <View style={[styles.referenceCard, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
            <Ionicons name="book-outline" size={14} color={theme.primary} />
            <Text style={[styles.referenceText, { color: theme.primary }]}>Scripture: {q.reference}</Text>
          </View>
        ) : null}

        {revealed ? (
          <TouchableOpacity style={[styles.startBtn, { backgroundColor: theme.primary }]} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.startBtnText}>
              {current + 1 >= questions.length ? 'See results' : 'Next question'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View pointerEvents="none" style={[styles.glowTopRight, { backgroundColor: theme.glow }]} />
      <View pointerEvents="none" style={[styles.glowBottomLeft, { backgroundColor: theme.glow }]} />

      {phase === 'intro' ? renderIntro() : phase === 'results' ? renderResults() : renderQuiz()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 8,
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
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catCard: {
    width: '31%',
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
  },
  catCardText: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  catCardCount: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '800',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    paddingVertical: 15,
    borderRadius: 20,
  },
  startBtnText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  resultRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scorePill: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: 16,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginTop: 2,
  },
  reviewList: {
    gap: 10,
  },
  reviewItem: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
  },
  reviewIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewQ: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  reviewCorrectAns: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 2,
  },
  reviewRef: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Georgia',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  quizTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  scoreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  scoreChipText: {
    fontSize: 13,
    fontWeight: '900',
  },
  progressBar: {
    height: 4,
    borderRadius: 999,
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 999,
  },
  quizMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  diffDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  diffText: {
    fontSize: 12,
    fontWeight: '800',
  },
  catLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  questionCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
  questionText: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: 'Georgia',
  },
  optionsList: {
    gap: 10,
  },
  optionBtn: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  referenceCard: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  referenceText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
