import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SignInRequired } from '@/components/sign-in-required';
import { APP_THEMES } from '@/constants/app-theme';
import { useThemeMode } from '@/context/theme-mode';
import { usePosts } from '@/hooks/use-posts';

type Tab = 'feed' | 'mine';

function timeAgo(iso: string | null) {
  if (!iso) return '';
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h ago`;
  const days = Math.floor(minutes / (60 * 24));
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function BlogScreen() {
  const router = useRouter();
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;

  const [tab, setTab] = useState<Tab>('feed');
  const { posts, isLoading, error, refresh, isSignedIn } = usePosts(tab);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isSignedIn) {
    return (
      <SignInRequired
        icon="newspaper-outline"
        title="Sign in to read the blog"
        body="Posts are written by the community, so an account is needed to read, like and comment."
      />
    );
  }

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View pointerEvents="none" style={[styles.glow, { backgroundColor: theme.glow }]} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/blog/new')}
            activeOpacity={0.85}>
            <Ionicons name="create-outline" size={16} color="#FFFFFF" />
            <Text style={styles.newBtnText}>Write</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.heroCard, { backgroundColor: theme.primary }]}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>BLOG</Text>
          </View>
          <Text style={styles.heroTitle}>What the community is writing</Text>
          <Text style={styles.heroBody}>
            Share what you are learning, and read what others have found in the Word.
          </Text>
        </View>

        <View style={[styles.segRow, { backgroundColor: theme.surfaceAlt }]}>
          {([
            { value: 'feed' as const, label: 'Latest' },
            { value: 'mine' as const, label: 'My posts' },
          ]).map((option) => {
            const active = tab === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.segBtn, active && { backgroundColor: theme.surface }]}
                onPress={() => setTab(option.value)}
                activeOpacity={0.85}>
                <Text style={[styles.segText, { color: active ? theme.primary : theme.textMuted }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {error ? (
          <TouchableOpacity
            onPress={refresh}
            style={[styles.banner, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
            activeOpacity={0.8}>
            <Ionicons name="cloud-offline-outline" size={16} color={theme.textSecondary} />
            <Text style={[styles.bannerText, { color: theme.textSecondary }]}>
              Couldn&apos;t reach the server. Tap to retry.
            </Text>
          </TouchableOpacity>
        ) : null}

        {isLoading && posts.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : posts.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.emptyMark, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="newspaper-outline" size={24} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {tab === 'mine' ? 'You have not written yet' : 'Nothing published yet'}
            </Text>
            <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
              {tab === 'mine'
                ? 'Write about something you have been studying. Drafts stay private until you publish.'
                : 'When people publish, their posts appear here.'}
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/blog/new')}
              activeOpacity={0.85}>
              <Text style={styles.emptyBtnText}>Write a post</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {posts.map((post) => (
              <TouchableOpacity
                key={post.id}
                style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => router.push(`/blog/${post.id}`)}
                activeOpacity={0.86}>
                <View style={styles.cardHead}>
                  <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
                    <Text style={[styles.avatarText, { color: theme.primary }]}>
                      {post.authorName.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.author, { color: theme.text }]}>{post.authorName}</Text>
                    <Text style={[styles.meta, { color: theme.textMuted }]}>
                      {post.status === 'draft'
                        ? 'Draft'
                        : timeAgo(post.publishedAt ?? post.createdAt)}
                    </Text>
                  </View>
                  {post.status === 'draft' ? (
                    <View style={[styles.draftTag, { backgroundColor: theme.surfaceAlt }]}>
                      <Text style={[styles.draftTagText, { color: theme.textMuted }]}>DRAFT</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={[styles.title, { color: theme.text }]}>{post.title}</Text>
                {post.excerpt ? (
                  <Text style={[styles.excerpt, { color: theme.textSecondary }]} numberOfLines={3}>
                    {post.excerpt}
                  </Text>
                ) : null}

                {post.tags.length > 0 ? (
                  <View style={styles.tagRow}>
                    {post.tags.slice(0, 3).map((tag) => (
                      <View key={tag} style={[styles.tag, { backgroundColor: theme.chipBg }]}>
                        <Text style={[styles.tagText, { color: theme.primary }]}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={styles.statRow}>
                  <View style={styles.stat}>
                    <Ionicons
                      name={post.likedByMe ? 'heart' : 'heart-outline'}
                      size={15}
                      color={post.likedByMe ? theme.primary : theme.textMuted}
                    />
                    <Text style={[styles.statText, { color: theme.textMuted }]}>
                      {post.likeCount}
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="chatbubble-outline" size={14} color={theme.textMuted} />
                    <Text style={[styles.statText, { color: theme.textMuted }]}>
                      {post.commentCount}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  glow: { position: 'absolute', top: -90, right: -90, width: 220, height: 220, borderRadius: 110 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  backBtn: { padding: 4 },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  newBtnText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '800' },
  heroCard: { borderRadius: 28, padding: 20, marginBottom: 14, gap: 8 },
  heroBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginBottom: 6 },
  heroBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: { color: '#FFFFFF', fontSize: 25, lineHeight: 31, fontFamily: 'Georgia' },
  heroBody: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 21 },
  segRow: { flexDirection: 'row', padding: 4, borderRadius: 999, gap: 4, marginBottom: 16 },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 999 },
  segText: { fontSize: 13, fontWeight: '800' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12 },
  bannerText: { flex: 1, fontSize: 12.5, fontWeight: '600' },
  centered: { paddingVertical: 40, alignItems: 'center' },
  emptyCard: { borderWidth: 1, borderRadius: 24, padding: 24, alignItems: 'center', gap: 10 },
  emptyMark: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontFamily: 'Georgia', textAlign: 'center' },
  emptyBody: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  emptyBtn: { marginTop: 8, borderRadius: 999, paddingHorizontal: 22, paddingVertical: 12 },
  emptyBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  list: { gap: 12 },
  card: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 9 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '800' },
  author: { fontSize: 13.5, fontWeight: '800' },
  meta: { fontSize: 11.5, fontWeight: '600', marginTop: 1 },
  draftTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  draftTagText: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.6 },
  title: { fontSize: 18, lineHeight: 24, fontFamily: 'Georgia' },
  excerpt: { fontSize: 13.5, lineHeight: 20 },
  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  tagText: { fontSize: 10.5, fontWeight: '800' },
  statRow: { flexDirection: 'row', gap: 16, marginTop: 2 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontSize: 12, fontWeight: '700' },
});
