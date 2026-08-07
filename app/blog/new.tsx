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
import { useThemeMode } from '@/context/theme-mode';
import { usePost, usePosts } from '@/hooks/use-posts';

const MAX_BODY = 40000;

/** Writes a new post, or edits an existing one when ?edit=<id> is passed. */
export default function ComposePostScreen() {
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;

  const { create } = usePosts('mine');
  const { post: existing, update } = usePost(edit);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the post being edited once it arrives.
  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setBody(existing.body);
    setTags(existing.tags.join(', '));
  }, [existing]);

  const save = async (status: 'draft' | 'published') => {
    setError(null);

    if (!title.trim()) {
      setError('Give your post a title.');
      return;
    }
    if (!body.trim()) {
      setError('Write something first.');
      return;
    }
    if (body.length > MAX_BODY) {
      setError('That post is too long.');
      return;
    }

    const parsedTags = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 5);

    setIsSaving(true);
    try {
      if (edit) {
        await update({ title: title.trim(), body: body.trim(), tags: parsedTags, status });
        router.replace(`/blog/${edit}`);
      } else {
        const created = await create({
          title: title.trim(),
          body: body.trim(),
          tags: parsedTags,
          status,
        });
        router.replace(`/blog/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your post.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDiscard = () => {
    if (!title.trim() && !body.trim()) {
      router.back();
      return;
    }
    Alert.alert('Discard this post?', 'Anything you have written will be lost.', [
      { text: 'Keep writing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { borderColor: theme.border }]}>
          <TouchableOpacity onPress={confirmDiscard} activeOpacity={0.8} hitSlop={8}>
            <Text style={[styles.headerAction, { color: theme.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {edit ? 'Edit post' : 'New post'}
          </Text>
          <TouchableOpacity
            onPress={() => save('published')}
            disabled={isSaving}
            activeOpacity={0.8}
            hitSlop={8}>
            {isSaving ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text style={[styles.headerAction, { color: theme.primary, fontWeight: '800' }]}>
                Publish
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextInput
            style={[styles.titleInput, { color: theme.text }]}
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              setError(null);
            }}
            placeholder="Title"
            placeholderTextColor={theme.textMuted}
            multiline
          />

          <TextInput
            style={[styles.bodyInput, { color: theme.text }]}
            value={body}
            onChangeText={(value) => {
              setBody(value);
              setError(null);
            }}
            placeholder="Write what you have been learning…"
            placeholderTextColor={theme.textMuted}
            multiline
            textAlignVertical="top"
          />

          <View style={[styles.tagRow, { borderColor: theme.border }]}>
            <Ionicons name="pricetags-outline" size={16} color={theme.textMuted} />
            <TextInput
              style={[styles.tagInput, { color: theme.text }]}
              value={tags}
              onChangeText={setTags}
              placeholder="Tags, comma separated (up to 5)"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
            />
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color="#C46A54" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.footerRow}>
            <Text style={[styles.wordCount, { color: theme.textMuted }]}>
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </Text>
            <TouchableOpacity
              style={[styles.draftBtn, { borderColor: theme.border }]}
              onPress={() => save('draft')}
              disabled={isSaving}
              activeOpacity={0.85}>
              <Ionicons name="save-outline" size={15} color={theme.textSecondary} />
              <Text style={[styles.draftBtnText, { color: theme.textSecondary }]}>
                Save as draft
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.hint, { color: theme.textMuted }]}>
            Drafts stay private to you. Publishing puts the post in the community feed, where
            others can like and comment on it.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerAction: { fontSize: 15, fontWeight: '700' },
  headerTitle: { fontSize: 16, fontFamily: 'Georgia' },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 44 },
  titleInput: { fontSize: 26, lineHeight: 34, fontFamily: 'Georgia', marginBottom: 14 },
  bodyInput: { fontSize: 16.5, lineHeight: 27, fontFamily: 'Georgia', minHeight: 280 },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 20,
  },
  tagInput: { flex: 1, fontSize: 14.5 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  errorText: { flex: 1, color: '#C46A54', fontSize: 12.5, fontWeight: '600' },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  wordCount: { fontSize: 12.5, fontWeight: '700' },
  draftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 18,
  },
  draftBtnText: { fontSize: 13.5, fontWeight: '800' },
  hint: { fontSize: 12, lineHeight: 18, marginTop: 18 },
});
