import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_THEMES } from '@/constants/app-theme';
import { useFirebaseAuth } from '@/context/firebase-auth';
import { useThemeMode } from '@/context/theme-mode';
import { usePost } from '@/hooks/use-posts';

const MAX_COMMENT = 2000;

function timeAgo(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;
  const { firebaseUser } = useFirebaseAuth();

  const { post, comments, isLoading, error, toggleLike, comment, removeComment, remove, report, block } =
    usePost(id);

  const [draft, setDraft] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const isMine = post?.authorId === firebaseUser?.uid;

  const handleShare = async () => {
    if (!post) return;
    try {
      await Share.share({
        message: `"${post.title}" by ${post.authorName} — read it in Rooted.`,
      });
    } catch {
      // Share sheet unavailable; nothing more to do.
    }
  };

  const handleComment = async () => {
    const body = draft.trim();
    if (!body) return;

    setIsPosting(true);
    try {
      await comment(body);
      setDraft('');
    } catch {
      Alert.alert('Could not post', 'Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  /** Report or block — required by App Store Guideline 1.2. */
  const moderatePost = () => {
    if (!post) return;

    if (isMine) {
      Alert.alert('Your post', undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => router.push(`/blog/new?edit=${post.id}`) },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            remove()
              .then(() => router.back())
              .catch(() => Alert.alert('Could not delete'));
          },
        },
      ]);
      return;
    }

    Alert.alert(`${post.authorName}'s post`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Report this post?', 'Tell us what is wrong with it.', [
            { text: 'Cancel', style: 'cancel' },
            ...['Offensive', 'Spam', 'Misleading'].map((reason) => ({
              text: reason,
              onPress: () => {
                report('post', post.id, reason)
                  .then(() => Alert.alert('Thanks', 'We will take a look.'))
                  .catch(() => Alert.alert('Could not report'));
              },
            })),
          ]),
      },
      {
        text: `Block ${post.authorName}`,
        style: 'destructive',
        onPress: () => {
          block(post.authorId)
            .then(() => {
              Alert.alert('Blocked', `You will not see ${post.authorName}'s posts.`);
              router.back();
            })
            .catch(() => Alert.alert('Could not block'));
        },
      },
    ]);
  };

  const moderateComment = (commentId: string, authorId: string, authorName: string) => {
    const mine = authorId === firebaseUser?.uid;

    if (mine || isMine) {
      Alert.alert(mine ? 'Your comment' : `${authorName}'s comment`, undefined, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeComment(commentId).catch(() => Alert.alert('Could not delete')),
        },
      ]);
      return;
    }

    Alert.alert(`${authorName}'s comment`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        style: 'destructive',
        onPress: () => {
          report('comment', commentId, 'Offensive')
            .then(() => Alert.alert('Thanks', 'We will take a look.'))
            .catch(() => Alert.alert('Could not report'));
        },
      },
      {
        text: `Block ${authorName}`,
        style: 'destructive',
        onPress: () => {
          block(authorId).catch(() => Alert.alert('Could not block'));
        },
      },
    ]);
  };

  if (isLoading && !post) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={32} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Post unavailable</Text>
          <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
            {error ?? 'It may have been removed, or it is still a draft.'}
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
            activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} hitSlop={8}>
              <Ionicons name="chevron-back" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
            <View style={styles.topActions}>
              <TouchableOpacity onPress={handleShare} activeOpacity={0.8} hitSlop={8}>
                <Ionicons name="share-outline" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={moderatePost} activeOpacity={0.8} hitSlop={8}>
                <Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {post.status === 'draft' ? (
            <View style={[styles.draftBanner, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Ionicons name="eye-off-outline" size={15} color={theme.textSecondary} />
              <Text style={[styles.draftBannerText, { color: theme.textSecondary }]}>
                This is a draft. Only you can see it.
              </Text>
            </View>
          ) : null}

          <Text style={[styles.title, { color: theme.text }]}>{post.title}</Text>

          <View style={styles.byline}>
            <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
              <Text style={[styles.avatarText, { color: theme.primary }]}>
                {post.authorName.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.author, { color: theme.text }]}>{post.authorName}</Text>
              <Text style={[styles.meta, { color: theme.textMuted }]}>
                {timeAgo(post.publishedAt ?? post.createdAt)}
              </Text>
            </View>
          </View>

          {post.tags.length > 0 ? (
            <View style={styles.tagRow}>
              {post.tags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: theme.chipBg }]}>
                  <Text style={[styles.tagText, { color: theme.primary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <Text style={[styles.body, { color: theme.text }]}>{post.body}</Text>

          <View style={[styles.actionBar, { borderColor: theme.border }]}>
            <TouchableOpacity style={styles.action} onPress={toggleLike} activeOpacity={0.7}>
              <Ionicons
                name={post.likedByMe ? 'heart' : 'heart-outline'}
                size={21}
                color={post.likedByMe ? theme.primary : theme.textMuted}
              />
              <Text
                style={[
                  styles.actionText,
                  { color: post.likedByMe ? theme.primary : theme.textMuted },
                ]}>
                {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}
              </Text>
            </TouchableOpacity>

            <View style={styles.action}>
              <Ionicons name="chatbubble-outline" size={19} color={theme.textMuted} />
              <Text style={[styles.actionText, { color: theme.textMuted }]}>
                {post.commentCount}
              </Text>
            </View>

            <TouchableOpacity style={styles.action} onPress={handleShare} activeOpacity={0.7}>
              <Ionicons name="share-outline" size={19} color={theme.textMuted} />
              <Text style={[styles.actionText, { color: theme.textMuted }]}>Share</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionLabel, { color: theme.text }]}>Comments</Text>

          <View style={[styles.composer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput
              style={[styles.composerInput, { color: theme.text }]}
              value={draft}
              onChangeText={setDraft}
              placeholder="Add a comment…"
              placeholderTextColor={theme.textMuted}
              multiline
              maxLength={MAX_COMMENT}
            />
            <View style={styles.composerFooter}>
              <Text style={[styles.counter, { color: theme.textMuted }]}>
                {draft.length}/{MAX_COMMENT}
              </Text>
              <TouchableOpacity
                style={[
                  styles.postBtn,
                  { backgroundColor: theme.primary },
                  (!draft.trim() || isPosting) && styles.disabled,
                ]}
                onPress={handleComment}
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

          {comments.length === 0 ? (
            <Text style={[styles.emptyFeed, { color: theme.textMuted }]}>
              No comments yet. Be the first.
            </Text>
          ) : (
            <View style={styles.commentList}>
              {comments.map((item) => (
                <View
                  key={item.id}
                  style={[styles.comment, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={styles.commentHead}>
                    <View style={[styles.smallAvatar, { backgroundColor: theme.primarySoft }]}>
                      <Text style={[styles.smallAvatarText, { color: theme.primary }]}>
                        {item.authorName.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.commentAuthor, { color: theme.text }]}>
                        {item.userId === firebaseUser?.uid ? 'You' : item.authorName}
                      </Text>
                      <Text style={[styles.meta, { color: theme.textMuted }]}>
                        {timeAgo(item.createdAt)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => moderateComment(item.id, item.userId, item.authorName)}
                      activeOpacity={0.7}
                      hitSlop={8}>
                      <Ionicons name="ellipsis-horizontal" size={17} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.commentBody, { color: theme.textSecondary }]}>{item.body}</Text>
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 44 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  topActions: { flexDirection: 'row', gap: 18 },
  draftBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 14 },
  draftBannerText: { fontSize: 12.5, fontWeight: '600' },
  title: { fontSize: 28, lineHeight: 36, fontFamily: 'Georgia', marginBottom: 14 },
  byline: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  avatar: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '800' },
  author: { fontSize: 14.5, fontWeight: '800' },
  meta: { fontSize: 11.5, fontWeight: '600', marginTop: 1 },
  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 16 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  tagText: { fontSize: 11, fontWeight: '800' },
  body: { fontSize: 16.5, lineHeight: 27, fontFamily: 'Georgia' },
  actionBar: { flexDirection: 'row', gap: 26, borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 14, marginTop: 24 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  actionText: { fontSize: 13.5, fontWeight: '700' },
  sectionLabel: { fontSize: 17, fontFamily: 'Georgia', marginTop: 24, marginBottom: 12 },
  composer: { borderWidth: 1, borderRadius: 18, padding: 14 },
  composerInput: { fontSize: 15, lineHeight: 22, minHeight: 60, textAlignVertical: 'top' },
  composerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  counter: { fontSize: 11.5, fontWeight: '700' },
  postBtn: { paddingHorizontal: 22, paddingVertical: 10, borderRadius: 999, minWidth: 74, alignItems: 'center' },
  postBtnText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '800' },
  disabled: { opacity: 0.5 },
  emptyFeed: { fontSize: 13.5, textAlign: 'center', paddingVertical: 26 },
  commentList: { gap: 10, marginTop: 14 },
  comment: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 9 },
  commentHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  smallAvatar: { width: 30, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  smallAvatarText: { fontSize: 13, fontWeight: '800' },
  commentAuthor: { fontSize: 13.5, fontWeight: '800' },
  commentBody: { fontSize: 14.5, lineHeight: 22 },
  primaryBtn: { borderRadius: 999, paddingVertical: 15, paddingHorizontal: 40, marginTop: 8 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  emptyTitle: { fontSize: 19, fontFamily: 'Georgia' },
  emptyBody: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
