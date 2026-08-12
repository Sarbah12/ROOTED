import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_THEMES } from '@/constants/app-theme';
import { BIBLE_BOOKS } from '@/constants/bible-books';
import { useFirebaseAuth } from '@/context/firebase-auth';
import { useThemeMode } from '@/context/theme-mode';
import { planRequest, type PlanDay } from '@/hooks/use-plan';
import type { StudyPlan } from '@/hooks/use-plans';

type Visibility = 'private' | 'link' | 'public';

type DraftDay = {
  reference: string;
  prompt: string;
  /** Carried through untouched; nothing sets it yet, but editing must not wipe it. */
  title: string;
};

const VISIBILITY_OPTIONS: { value: Visibility; label: string; blurb: string; icon: string }[] = [
  { value: 'private', label: 'Private', blurb: 'Only you', icon: 'lock-closed-outline' },
  { value: 'link', label: 'With a code', blurb: 'Anyone you share the code with', icon: 'key-outline' },
  { value: 'public', label: 'Public', blurb: 'Listed for anyone to find', icon: 'globe-outline' },
];

/** Creates a plan, or edits one when ?edit=<id> is passed. */
export default function NewPlanScreen() {
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;
  const { idToken } = useFirebaseAuth();

  const isEditing = Boolean(edit);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('link');
  const [days, setDays] = useState<DraftDay[]>([{ reference: '', prompt: '', title: '' }]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(edit));
  const [originalDayCount, setOriginalDayCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load the plan being edited.
  useEffect(() => {
    if (!edit || !idToken) return;
    let active = true;

    (async () => {
      try {
        const payload = await planRequest<{ plan: StudyPlan; days: PlanDay[] }>(
          `/v1/plans/${edit}`,
          idToken,
        );
        if (!active) return;

        setTitle(payload.plan.title);
        setDescription(payload.plan.description ?? '');
        setVisibility(payload.plan.visibility);
        setOriginalDayCount(payload.days.length);
        setDays(
          payload.days.length
            ? payload.days.map((day) => ({
                reference: day.reference,
                prompt: day.prompt ?? '',
                title: day.title ?? '',
              }))
            : [{ reference: '', prompt: '', title: '' }],
        );
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Could not load this plan.');
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [edit, idToken]);

  const updateDay = (index: number, patch: Partial<DraftDay>) => {
    setDays((prev) => prev.map((day, i) => (i === index ? { ...day, ...patch } : day)));
    setError(null);
  };

  const addDay = () => setDays((prev) => [...prev, { reference: '', prompt: '', title: '' }]);

  const removeDay = (index: number) =>
    setDays((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  /** Fills empty days by walking consecutive chapters from the last entry. */
  const autoFill = () => {
    const seed = days.find((day) => day.reference.trim())?.reference.trim();
    if (!seed) {
      setError('Add a first passage, then auto-fill will continue from it.');
      return;
    }

    const match = seed.match(/^(.*?)(\d+)$/);
    if (!match) {
      setError('Auto-fill needs a reference ending in a chapter number, like "John 1".');
      return;
    }

    const bookName = match[1].trim();
    const startChapter = Number(match[2]);
    const book = BIBLE_BOOKS.find((b) => b.name.toLowerCase() === bookName.toLowerCase());

    if (!book) {
      setError(`"${bookName}" is not a book name I recognise.`);
      return;
    }

    setDays((prev) =>
      prev.map((day, index) => {
        if (day.reference.trim()) return day;
        const chapter = startChapter + index;
        // Do not invent chapters the book does not have.
        if (chapter > book.chapters) return day;
        return { ...day, reference: `${book.name} ${chapter}` };
      }),
    );
    setError(null);
  };

  const submit = async (filled: DraftDay[]) => {
    if (!idToken) return;

    setIsSaving(true);
    try {
      const body = JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        visibility,
        days: filled,
      });

      if (edit) {
        await planRequest(`/v1/plans/${edit}`, idToken, { method: 'PATCH', body });
        router.replace(`/plans/${edit}`);
      } else {
        const plan = await planRequest<StudyPlan>('/v1/plans', idToken, { method: 'POST', body });
        router.replace(`/plans/${plan.id}`);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Could not ${edit ? 'save' : 'create'} the plan.`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    setError(null);

    if (!title.trim()) {
      setError('Give your plan a title.');
      return;
    }

    const filled = days
      .map((day) => ({
        reference: day.reference.trim(),
        prompt: day.prompt.trim(),
        title: day.title,
      }))
      .filter((day) => day.reference);

    if (filled.length === 0) {
      setError('Add at least one day with a passage.');
      return;
    }

    if (!idToken) {
      setError(`Sign in to ${edit ? 'edit' : 'create'} a plan.`);
      return;
    }

    // Shortening a plan drops everyone's ticks for the days that no longer
    // exist, which is not recoverable — so say so before it happens.
    const removed = originalDayCount - filled.length;
    if (edit && removed > 0) {
      Alert.alert(
        `Remove ${removed} ${removed === 1 ? 'day' : 'days'}?`,
        `Anyone following this plan will lose their progress on ${
          removed === 1 ? 'that day' : 'those days'
        }.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save anyway', style: 'destructive', onPress: () => void submit(filled) },
        ],
      );
      return;
    }

    void submit(filled);
  };

  const filledCount = days.filter((day) => day.reference.trim()).length;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View pointerEvents="none" style={[styles.glow, { backgroundColor: theme.glow }]} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backRow} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={20} color={theme.textSecondary} />
            <Text style={[styles.backText, { color: theme.textSecondary }]}>Plans</Text>
          </TouchableOpacity>

          <Text style={[styles.kicker, { color: theme.textMuted }]}>
            {isEditing ? 'Edit plan' : 'New plan'}
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            {isEditing ? 'Make changes' : 'Build a study plan'}
          </Text>

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.textMuted }]}>Title</Text>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                setError(null);
              }}
              placeholder="The Gospel of John in 21 days"
              placeholderTextColor={theme.textMuted}
            />

            <Text style={[styles.label, { color: theme.textMuted }]}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.multiline, { color: theme.text, backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}
              value={description}
              onChangeText={setDescription}
              placeholder="What this plan is about and who it is for."
              placeholderTextColor={theme.textMuted}
              multiline
            />
          </View>

          <Text style={[styles.sectionLabel, { color: theme.text }]}>Who can join</Text>
          <View style={styles.visRow}>
            {VISIBILITY_OPTIONS.map((option) => {
              const active = visibility === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.visCard,
                    {
                      backgroundColor: active ? theme.primarySoft : theme.surface,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setVisibility(option.value)}
                  activeOpacity={0.85}>
                  <Ionicons
                    name={option.icon as never}
                    size={18}
                    color={active ? theme.primary : theme.textMuted}
                  />
                  <Text style={[styles.visLabel, { color: active ? theme.primary : theme.text }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.visBlurb, { color: theme.textMuted }]}>{option.blurb}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.daysHeader}>
            <Text style={[styles.sectionLabel, { color: theme.text, marginTop: 0 }]}>
              Daily readings
            </Text>
            <TouchableOpacity onPress={autoFill} activeOpacity={0.7}>
              <Text style={[styles.autoFill, { color: theme.primary }]}>Auto-fill chapters</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.daysList}>
            {days.map((day, index) => (
              <View
                key={index}
                style={[styles.dayCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.dayHeader}>
                  <View style={[styles.dayBadge, { backgroundColor: theme.primarySoft }]}>
                    <Text style={[styles.dayBadgeText, { color: theme.primary }]}>Day {index + 1}</Text>
                  </View>
                  {days.length > 1 ? (
                    <TouchableOpacity onPress={() => removeDay(index)} activeOpacity={0.7}>
                      <Ionicons name="close-circle-outline" size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}
                  value={day.reference}
                  onChangeText={(value) => updateDay(index, { reference: value })}
                  placeholder="John 1"
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="words"
                />
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}
                  value={day.prompt}
                  onChangeText={(value) => updateDay(index, { prompt: value })}
                  placeholder="A question to reflect on (optional)"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.addDayBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
            onPress={addDay}
            activeOpacity={0.85}>
            <Ionicons name="add" size={18} color={theme.primary} />
            <Text style={[styles.addDayText, { color: theme.primary }]}>Add another day</Text>
          </TouchableOpacity>

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color="#C46A54" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.primary }, isSaving && styles.disabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}>
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {isEditing ? 'Save changes' : 'Create plan'} · {filledCount}{' '}
                {filledCount === 1 ? 'day' : 'days'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 44 },
  glow: { position: 'absolute', top: -90, right: -90, width: 220, height: 220, borderRadius: 110 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backText: { fontSize: 14, fontWeight: '700' },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { fontSize: 28, fontFamily: 'Georgia', marginTop: 6, marginBottom: 18 },
  card: { borderWidth: 1, borderRadius: 22, padding: 18, gap: 6 },
  label: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 12, fontSize: 15, marginTop: 4 },
  multiline: { minHeight: 74, textAlignVertical: 'top' },
  sectionLabel: { fontSize: 17, fontFamily: 'Georgia', marginTop: 22, marginBottom: 10 },
  visRow: { flexDirection: 'row', gap: 8 },
  visCard: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 12, gap: 4 },
  visLabel: { fontSize: 13.5, fontWeight: '800' },
  visBlurb: { fontSize: 11, lineHeight: 15 },
  daysHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 10 },
  autoFill: { fontSize: 13, fontWeight: '800' },
  daysList: { gap: 10 },
  dayCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 4 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  dayBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  dayBadgeText: { fontSize: 11.5, fontWeight: '800' },
  addDayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 16, paddingVertical: 14, marginTop: 12 },
  addDayText: { fontSize: 14, fontWeight: '800' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  errorText: { flex: 1, color: '#C46A54', fontSize: 12.5, fontWeight: '600' },
  primaryBtn: { borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginTop: 18 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  disabled: { opacity: 0.7 },
});
