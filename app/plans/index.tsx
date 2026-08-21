import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
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
import { planRequest } from '@/hooks/use-plan';
import { usePlans, type StudyPlan } from '@/hooks/use-plans';
import { PLAN_TEMPLATES, type PlanTemplate } from '@/constants/plan-templates';
import { currentDay, useLocalPlans } from '@/hooks/use-local-plans';

type Tab = 'mine' | 'discover';

export default function PlansScreen() {
  const router = useRouter();
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;
  const { idToken } = useFirebaseAuth();
  const { plans, streak, isLoading, error, refresh } = usePlans();
  const localPlans = useLocalPlans();

  const [tab, setTab] = useState<Tab>('mine');
  const [publicPlans, setPublicPlans] = useState<StudyPlan[]>([]);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [startingId, setStartingId] = useState<string | null>(null);

  /**
   * Starts a plan from a template.
   *
   * Kept on the device. Following a plan alone is a list of passages and a
   * record of which days are done — no account, no server, and it works on a
   * plane. Sharing one is what needs a backend, and that is a separate action.
   */
  const startTemplate = async (template: PlanTemplate) => {
    setStartingId(template.id);
    try {
      const created = await localPlans.start(template);
      router.push(`/plans/${encodeURIComponent(created.id)}`);
    } catch {
      Alert.alert('Could not start that plan', 'Please try again.');
    } finally {
      setStartingId(null);
    }
  };

  const loadPublic = useCallback(
    async (term: string) => {
      if (!idToken) return;
      setIsLoadingPublic(true);
      try {
        const query = term.trim() ? `&q=${encodeURIComponent(term.trim())}` : '';
        const payload = await planRequest<{ plans: StudyPlan[] }>(
          `/v1/plans?scope=public${query}`,
          idToken,
        );
        setPublicPlans(payload.plans ?? []);
      } catch {
        // Leave the list empty rather than showing anything invented.
        setPublicPlans([]);
      } finally {
        setIsLoadingPublic(false);
      }
    },
    [idToken],
  );

  // Wait for a pause in typing before searching, so a six-letter word is one
  // request rather than six.
  useEffect(() => {
    if (tab !== 'discover') return;
    const timer = setTimeout(() => void loadPublic(search), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [tab, search, loadPublic]);

  const handleJoinByCode = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;

    if (!idToken) {
      Alert.alert(
        'Sign in to join',
        'Following your own plan needs no account. Joining someone else’s does, so they can see you are reading with them.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Sign in', onPress: () => router.push('/login') },
        ],
      );
      return;
    }

    setIsJoining(true);
    try {
      const found = await planRequest<{ plan: StudyPlan }>(
        `/v1/plans?code=${encodeURIComponent(code)}`,
        idToken,
      );
      await planRequest(`/v1/plans/${found.plan.id}/join`, idToken, { method: 'POST' });
      setJoinCode('');
      await refresh();
      router.push(`/plans/${found.plan.id}`);
    } catch {
      Alert.alert('No plan found', 'Check the code and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    if (tab === 'discover') await loadPublic(search);
    setIsRefreshing(false);
  };

  // On-device plans first; anything the server knows about is added to them.
  const mine = [
    ...localPlans.plans.map((p) => ({
      id: p.id,
      ownerId: '',
      ownerName: null,
      title: p.title,
      description: p.description,
      visibility: 'private' as const,
      joinCode: null,
      durationDays: p.days.length,
      memberCount: 1,
      createdAt: p.startedAt,
      isMember: true,
      currentDay: currentDay(p),
    })),
    ...plans,
  ];

  const list = tab === 'mine' ? mine : publicPlans;
  const busy = tab === 'mine' ? isLoading && localPlans.isLoading : isLoadingPublic;

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
            onPress={() => router.push('/plans/new')}
            activeOpacity={0.85}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.newBtnText}>New plan</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.heroCard, { backgroundColor: theme.primary }]}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>STUDY PLANS</Text>
            </View>
            <View style={styles.streakChip}>
              <Ionicons name="flame" size={13} color="#FFFFFF" />
              <Text style={styles.streakText}>
                {streak.current} {streak.current === 1 ? 'day' : 'days'}
              </Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Read together</Text>
          <Text style={styles.heroBody}>
            Follow a plan alongside others, mark each day as you go, and share what you learnt.
          </Text>
        </View>

        <View style={[styles.joinRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TextInput
            style={[styles.joinInput, { color: theme.text }]}
            value={joinCode}
            onChangeText={setJoinCode}
            placeholder="Have a code? e.g. K4M2PQ"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            onSubmitEditing={handleJoinByCode}
          />
          <TouchableOpacity
            onPress={handleJoinByCode}
            disabled={joinCode.trim().length < 4 || isJoining}
            activeOpacity={0.8}
            style={[
              styles.joinBtn,
              { backgroundColor: theme.primarySoft },
              (joinCode.trim().length < 4 || isJoining) && styles.disabled,
            ]}>
            {isJoining ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text style={[styles.joinBtnText, { color: theme.primary }]}>Join</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.segRow, { backgroundColor: theme.surfaceAlt }]}>
          {(['mine', 'discover'] as Tab[]).map((item) => {
            const active = tab === item;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.segBtn, active && { backgroundColor: theme.surface }]}
                onPress={() => setTab(item)}
                activeOpacity={0.85}>
                <Text style={[styles.segText, { color: active ? theme.primary : theme.textMuted }]}>
                  {item === 'mine' ? 'My plans' : 'Discover'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {tab === 'discover' && !idToken ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.emptyMark, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="people-outline" size={24} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Sign in to discover</Text>
            <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
              Plans other people have shared need an account. Your own plans work without one.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/login')}
              activeOpacity={0.85}>
              <Text style={styles.emptyBtnText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {tab === 'discover' && idToken ? (
          <View style={[styles.searchRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="search" size={16} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Search plans, topics or people"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={10} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={17} color={theme.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {error && tab === 'mine' ? (
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

        {busy && list.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : list.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.emptyMark, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="layers-outline" size={24} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {tab === 'mine'
                ? 'No plans yet'
                : search.trim()
                  ? 'No matches'
                  : 'Nothing public yet'}
            </Text>
            <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
              {tab === 'mine'
                ? 'Create a plan or join one with a code to start reading with others.'
                : search.trim()
                  ? `Nothing public matches “${search.trim()}”. Try a shorter word, or a book of the Bible.`
                  : 'When people publish plans, they will show up here.'}
            </Text>
            {tab === 'mine' ? (
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
                onPress={() => router.push('/plans/new')}
                activeOpacity={0.85}>
                <Text style={styles.emptyBtnText}>Create your own</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={styles.list}>
            {list.map((plan) => {
              const ratio =
                plan.durationDays > 0
                  ? Math.min(1, (plan.currentDay ?? 0) / plan.durationDays)
                  : 0;

              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => router.push(`/plans/${plan.id}`)}
                  activeOpacity={0.86}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: theme.text }]}>{plan.title}</Text>
                      <Text style={[styles.cardMeta, { color: theme.textMuted }]}>
                        {plan.durationDays} days · {plan.memberCount}{' '}
                        {plan.memberCount === 1 ? 'member' : 'members'}
                        {plan.ownerName ? ` · by ${plan.ownerName}` : ''}
                      </Text>
                    </View>
                    {plan.visibility === 'public' ? (
                      <View style={[styles.tag, { backgroundColor: theme.primarySoft }]}>
                        <Text style={[styles.tagText, { color: theme.primary }]}>Public</Text>
                      </View>
                    ) : null}
                  </View>

                  {plan.description ? (
                    <Text style={[styles.cardBody, { color: theme.textSecondary }]} numberOfLines={2}>
                      {plan.description}
                    </Text>
                  ) : null}

                  {plan.isMember ? (
                    <View style={styles.progressBlock}>
                      <View style={[styles.track, { backgroundColor: theme.surfaceAlt }]}>
                        <View
                          style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: theme.primary }]}
                        />
                      </View>
                      <Text style={[styles.progressText, { color: theme.textMuted }]}>
                        Day {plan.currentDay ?? 0} of {plan.durationDays}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.joinHint, { color: theme.primary }]}>Tap to view and join</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {tab === 'mine' && mine.length === 0 && !localPlans.isLoading ? (
          <View style={styles.templates}>
            <Text style={[styles.templatesTitle, { color: theme.text }]}>Or start one of these</Text>
            <Text style={[styles.templatesBlurb, { color: theme.textSecondary }]}>
              Ready-made plans with every day mapped out. You can share yours with a code later.
            </Text>

            {PLAN_TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[styles.templateCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => startTemplate(template)}
                disabled={startingId !== null}
                activeOpacity={0.86}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.templateName, { color: theme.text }]}>{template.title}</Text>
                  <Text style={[styles.templateMeta, { color: theme.textMuted }]}>
                    {template.days.length} days · starts with {template.days[0].reference}
                  </Text>
                </View>
                {startingId === template.id ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Ionicons name="arrow-forward-circle" size={24} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
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
  heroCard: { borderRadius: 28, padding: 20, marginBottom: 14 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  heroBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  streakChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  streakText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { color: '#FFFFFF', fontSize: 28, fontFamily: 'Georgia', marginBottom: 8 },
  heroBody: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 21 },
  joinRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingLeft: 16, paddingRight: 6, paddingVertical: 6, marginBottom: 14 },
  joinInput: { flex: 1, fontSize: 14, fontWeight: '600', letterSpacing: 1 },
  joinBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999, minWidth: 64, alignItems: 'center' },
  joinBtnText: { fontSize: 13.5, fontWeight: '800' },
  disabled: { opacity: 0.5 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: 14 },
  segRow: { flexDirection: 'row', padding: 4, borderRadius: 999, gap: 4, marginBottom: 16 },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 999 },
  segText: { fontSize: 13, fontWeight: '800' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12 },
  bannerText: { flex: 1, fontSize: 12.5, fontWeight: '600' },
  centered: { paddingVertical: 40, alignItems: 'center' },
  emptyCard: { borderWidth: 1, borderRadius: 24, padding: 24, alignItems: 'center', gap: 10 },
  emptyMark: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontFamily: 'Georgia' },
  emptyBody: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  emptyBtn: { marginTop: 8, borderRadius: 999, paddingHorizontal: 22, paddingVertical: 12 },
  emptyBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  list: { gap: 12 },
  templates: { marginTop: 22 },
  templatesTitle: { fontSize: 17, fontFamily: 'Georgia', marginBottom: 5 },
  templatesBlurb: { fontSize: 13.5, lineHeight: 20, marginBottom: 14 },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
  },
  templateName: { fontSize: 15.5, fontWeight: '800' },
  templateMeta: { fontSize: 12.5, fontWeight: '600', marginTop: 3 },
  card: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTitle: { fontSize: 16.5, fontWeight: '800' },
  cardMeta: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  tag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  tagText: { fontSize: 10.5, fontWeight: '800' },
  cardBody: { fontSize: 13.5, lineHeight: 20 },
  progressBlock: { gap: 6, marginTop: 2 },
  track: { height: 6, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  progressText: { fontSize: 11.5, fontWeight: '700' },
  joinHint: { fontSize: 12.5, fontWeight: '800', marginTop: 2 },
});
