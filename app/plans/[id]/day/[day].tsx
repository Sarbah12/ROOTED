import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { getOfflineChapter } from '@/constants/bible-offline';
import { useFirebaseAuth } from '@/context/firebase-auth';
import { useThemeMode } from '@/context/theme-mode';
import { usePlan, useReflections } from '@/hooks/use-plan';

const MAX_LENGTH = 2000;

/** "John 3" -> the chapter's verses from the bundled KJV, or null. */
function resolvePassage(reference: string) {
  const match = reference.trim().match(/^(.*?)\s*(\d+)$/);
  if (!match) return null;

  const name = match[1].trim().toLowerCase();
  const chapter = Number(match[2]);
  const book = BIBLE_BOOKS.find((b) => b.name.toLowerCase() === name);
  if (!book) return null;

  const verses = getOfflineChapter(book.id, chapter);
  if (!verses) return null;

  return { bookName: book.name, chapter, verses };
}

function timeAgo(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function PlanDayScreen() {
  const { id, day } = useLocalSearchParams<{ id: string; day: string }>();
  const dayNumber = Number(day);
  const router = useRouter();
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;
  const { firebaseUser } = useFirebaseAuth();

  const { plan, days, completedDays, toggleDay } = usePlan(id);
  const { reflections, isLoading, post, remove, report, block } = useReflections(id, dayNumber);

  const [draft, setDraft] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const planDay = days.find((entry) => entry.day === dayNumber);
  const passage = useMemo(
    () => (planDay ? resolvePassage(planDay.reference) : null),
    [planDay],
  );
  const isDone = completedDays.includes(dayNumber);

  const handlePost = async () => {
    const body = draft.trim();
    if (!body) return;

    setIsPosting(true);
    try {
      await post(body);
      setDraft('');
    } catch {
      Alert.alert('Could not post', 'Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  /** Report or block — required by App Store Guideline 1.2 for shared content. */
  const handleModerate = (reflectionId: string, authorId: string, authorName: string) => {
    const isMine = authorId === firebaseUser?.uid;

    if (isMine) {
      Alert.alert('Your reflection', undefined, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => remove(reflectionId).catch(() => Alert.alert('Could not delete')),
        },
      ]);
      return;
    }

    Alert.alert(`${authorName}'s reflection`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Report this?', 'Tell us what is wrong with it.', [
            { text: 'Cancel', style: 'cancel' },
            ...['Offensive', 'Spam', 'Off topic'].map((reason) => ({
              text: reason,
              onPress: () => {
                report(reflectionId, reason)
                  .then(() => Alert.alert('Thanks', 'We will take a look.'))
                  .catch(() => Alert.alert('Could not report'));
              },
            })),
          ]);
        },
      },
      {
        text: `Block ${authorName}`,
        style: 'destructive',
        onPress: () => {
          block(authorId)
            .then(() => Alert.alert('Blocked', `You will not see ${authorName}'s posts.`))
            .catch(() => Alert.alert('Could not block'));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={20} color={theme.textSecondary} />
              <Text style={[styles.backText, { color: theme.textSecondary }]}>
                {plan?.title ?? 'Plan'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.kicker, { color: theme.textMuted }]}>Day {dayNumber}</Text>
          <Text style={[styles.title, { color: theme.text }]}>
            {planDay?.reference ?? 'Reading'}
          </Text>

          <TouchableOpacity
            style={[
              styles.doneBtn,
              {
                backgroundColor: isDone ? theme.primarySoft : theme.primary,
                borderColor: theme.primary,
              },
            ]}
            onPress={() => toggleDay(dayNumber)}
            activeOpacity={0.85}>
            <Ionicons
              name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
              size={18}
              color={isDone ? theme.primary : '#FFFFFF'}
            />
            <Text style={[styles.doneText, { color: isDone ? theme.primary : '#FFFFFF' }]}>
              {isDone ? 'Completed' : 'Mark as read'}
            </Text>
          </TouchableOpacity>

          {planDay?.prompt ? (
            <View style={[styles.promptCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Text style={[styles.promptLabel, { color: theme.textMuted }]}>THINK ABOUT</Text>
              <Text style={[styles.promptText, { color: theme.text }]}>{planDay.prompt}</Text>
            </View>
          ) : null}

          {passage ? (
            <View style={[styles.passageCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.passageRef, { color: theme.primary }]}>
                {passage.bookName} {passage.chapter} · KJV
              </Text>
              {passage.verses.map((verse, index) => (
                <Text key={index} style={[styles.verse, { color: theme.text }]}>
                  <Text style={[styles.verseNum, { color: theme.textMuted }]}>{index + 1} </Text>
                  {verse}
                </Text>
              ))}
            </View>
          ) : planDay ? (
            <View style={[styles.promptCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.promptText, { color: theme.textSecondary }]}>
                Open the Bible tab to read {planDay.reference}.
              </Text>
            </View>
          ) : null}

          <Text style={[styles.sectionLabel, { color: theme.text }]}>What did you learn?</Text>

          <View style={[styles.composer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput
              style={[styles.composerInput, { color: theme.text }]}
              value={draft}
              onChangeText={setDraft}
              placeholder="Share a thought with the others reading this plan…"
              placeholderTextColor={theme.textMuted}
              multiline
              maxLength={MAX_LENGTH}
            />
            <View style={styles.composerFooter}>
              <Text style={[styles.counter, { color: theme.textMuted }]}>
                {draft.length}/{MAX_LENGTH}
              </Text>
              <TouchableOpacity
                style={[
                  styles.postBtn,
                  { backgroundColor: theme.primary },
                  (!draft.trim() || isPosting) && styles.disabled,
                ]}
                onPress={handlePost}
                disabled={!draft.trim() || isPosting}
                activeOpacity={0.85}>
                {isPosting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.postBtnText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {isLoading && reflections.length === 0 ? (
            <View style={styles.centered}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : reflections.length === 0 ? (
            <Text style={[styles.emptyFeed, { color: theme.textMuted }]}>
              Nobody has shared yet. Be the first.
            </Text>
          ) : (
            <View style={styles.feed}>
              {reflections.map((item) => (
                <View
                  key={item.id}
                  style={[styles.reflection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={styles.reflectionHeader}>
                    <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
                      <Text style={[styles.avatarText, { color: theme.primary }]}>
                        {item.authorName.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.author, { color: theme.text }]}>
                        {item.userId === firebaseUser?.uid ? 'You' : item.authorName}
                      </Text>
                      <Text style={[styles.timestamp, { color: theme.textMuted }]}>
                        {timeAgo(item.createdAt)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleModerate(item.id, item.userId, item.authorName)}
                      activeOpacity={0.7}
                      hitSlop={8}>
                      <Ionicons name="ellipsis-horizontal" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.reflectionBody, { color: theme.textSecondary }]}>
                    {item.body}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 44 },
  topRow: { flexDirection: 'row', marginBottom: 14 },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 14, fontWeight: '700' },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { fontSize: 28, fontFamily: 'Georgia', marginTop: 6, marginBottom: 16 },
  doneBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 999, paddingVertical: 14 },
  doneText: { fontSize: 14.5, fontWeight: '800' },
  promptCard: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 14, gap: 6 },
  promptLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  promptText: { fontSize: 14.5, lineHeight: 21 },
  passageCard: { borderWidth: 1, borderRadius: 20, padding: 18, marginTop: 14, gap: 10 },
  passageRef: { fontSize: 11.5, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  verse: { fontSize: 15.5, lineHeight: 25, fontFamily: 'Georgia' },
  verseNum: { fontSize: 11, fontWeight: '800', fontFamily: undefined },
  sectionLabel: { fontSize: 17, fontFamily: 'Georgia', marginTop: 26, marginBottom: 10 },
  composer: { borderWidth: 1, borderRadius: 18, padding: 14 },
  composerInput: { fontSize: 15, lineHeight: 22, minHeight: 76, textAlignVertical: 'top' },
  composerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  counter: { fontSize: 11.5, fontWeight: '700' },
  postBtn: { paddingHorizontal: 22, paddingVertical: 10, borderRadius: 999, minWidth: 74, alignItems: 'center' },
  postBtnText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '800' },
  disabled: { opacity: 0.5 },
  centered: { paddingVertical: 30, alignItems: 'center' },
  emptyFeed: { fontSize: 13.5, textAlign: 'center', paddingVertical: 26 },
  feed: { gap: 10, marginTop: 14 },
  reflection: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  reflectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '800' },
  author: { fontSize: 14, fontWeight: '800' },
  timestamp: { fontSize: 11.5, fontWeight: '600', marginTop: 1 },
  reflectionBody: { fontSize: 14.5, lineHeight: 22 },
});
