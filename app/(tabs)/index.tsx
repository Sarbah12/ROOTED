import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


import { getVerseOfTheDay } from '@/constants/verse-of-the-day';
import { useThemeMode } from '@/context/theme-mode';
import { useNotes } from '@/hooks/use-notes';
import { usePlans } from '@/hooks/use-plans';
import { usePrayers } from '@/hooks/use-prayers';

type RouteHref = './bible' | './notes' | './prayer' | './quiz';

type HomeTheme = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  primary: string;
  primarySoft: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  chipBg: string;
  glow: string;
};

const HOME_THEMES: Record<'light' | 'dark', HomeTheme> = {
  light: {
    background: '#F4F1EA',
    surface: '#FEFDF9',
    surfaceAlt: '#EEF4EF',
    border: '#D7E0DA',
    primary: '#2E6A5C',
    primarySoft: '#DCEAE3',
    text: '#16211C',
    textSecondary: '#5B6961',
    textMuted: '#7D8A83',
    chipBg: '#E8F1EC',
    glow: 'rgba(46, 106, 92, 0.13)',
  },
  dark: {
    background: '#0C1210',
    surface: '#13201B',
    surfaceAlt: '#182922',
    border: '#294036',
    primary: '#79C3B0',
    primarySoft: '#1E3931',
    text: '#F2F5F1',
    textSecondary: '#C0CDC6',
    textMuted: '#8A9A93',
    chipBg: '#20372F',
    glow: 'rgba(121, 195, 176, 0.14)',
  },
};

const FEATURE_CARDS: {
  label: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: RouteHref;
  accent: string;
}[] = [
  {
    label: 'Bible',
    title: 'Bible Reader',
    description: 'Jump back into the chapter you were studying.',
    icon: 'book',
    href: './bible',
    accent: '#2E6A5C',
  },
  {
    label: 'Prayer',
    title: 'Prayer Journal',
    description: 'Track requests and answered prayers in one place.',
    icon: 'heart',
    href: './prayer',
    accent: '#8A6236',
  },
  {
    label: 'Notes',
    title: 'Study Notes',
    description: 'Capture sermon thoughts, verses, and reflections.',
    icon: 'create',
    href: './notes',
    accent: '#5D7A66',
  },
  {
    label: 'Quiz',
    title: 'Bible Quiz',
    description: 'Test your memory with Scripture trivia.',
    icon: 'help-circle',
    href: './quiz',
    accent: '#B98D49',
  },
];

const FEATURE_HIGHLIGHTS = [
  {
    title: 'Continue where you left off',
    body: 'Resume your most recent Bible reading in one tap.',
    icon: 'reader' as const,
  },
  {
    title: 'Keep your prayer list close',
    body: 'Check off answered prayers and revisit ongoing needs.',
    icon: 'heart-outline' as const,
  },
  {
    title: 'Review your study notes',
    body: 'Search through your verse notes and sermon takeaways.',
    icon: 'documents-outline' as const,
  },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { isDarkMode } = useThemeMode();
  const { notes } = useNotes();
  const { prayers } = usePrayers();
  const { plans, streak, isSignedIn } = usePlans();

  // Rotates by calendar day, with the text read from the bundled KJV.
  const verseOfTheDay = useMemo(() => getVerseOfTheDay(), []);

  // Counts and progress come from the user's own data. Nothing here is a
  // placeholder: with no plans joined the tiles read zero rather than inventing
  // a number.
  const snapshotItems = [
    { label: 'Plans', value: String(plans.length), detail: plans.length === 1 ? 'plan joined' : 'plans joined', icon: 'layers' as const },
    { label: 'Notes', value: String(notes.length), detail: notes.length === 1 ? 'study note saved' : 'study notes saved', icon: 'create' as const },
    { label: 'Prayers', value: String(prayers.length), detail: prayers.length === 1 ? 'prayer entry' : 'prayer entries', icon: 'heart' as const },
    { label: 'Streak', value: String(streak.current), detail: streak.current === 1 ? 'day in a row' : 'days in a row', icon: 'flame' as const },
  ];

  // The plan furthest along, for the "keep going" card.
  const activePlan = plans
    .filter((plan) => plan.durationDays > 0)
    .sort((a, b) => (b.currentDay ?? 0) / b.durationDays - (a.currentDay ?? 0) / a.durationDays)[0];
  const activeProgress = activePlan
    ? Math.min(1, (activePlan.currentDay ?? 0) / activePlan.durationDays)
    : 0;
  const theme = isDarkMode ? HOME_THEMES.dark : HOME_THEMES.light;
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateLabel = `${dayNames[today.getDay()]}, ${monthNames[today.getMonth()]} ${today.getDate()}`;

  const goTo = (href: RouteHref) => {
    router.push(href);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View pointerEvents="none" style={[styles.glowTopRight, { backgroundColor: theme.glow }]} />
      <View pointerEvents="none" style={[styles.glowBottomLeft, { backgroundColor: theme.glow }]} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={[styles.brandMark, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Image
                source={require('../../assets/images/rooted-logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={[styles.brandKicker, { color: theme.textMuted }]}>Rooted</Text>
              <Text style={[styles.brandTitle, { color: theme.text }]}>Study dashboard</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => router.push('/settings')}
            activeOpacity={0.8}>
            <Ionicons name="settings-outline" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
          decelerationRate="fast"
          snapToInterval={292}
          snapToAlignment="start">
          <View style={[styles.heroCard, { backgroundColor: theme.primary }]}>
            <View style={styles.heroCardTop}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>TODAY</Text>
              </View>
              <Text style={styles.heroDate}>{dateLabel}</Text>
            </View>
            <Text style={styles.heroTitle}>A calmer, cleaner home for your study flow.</Text>
            <Text style={styles.heroBody}>
              Follow your reading plan, open the verse of the day, and keep your prayer and note
              tools close at hand.
            </Text>
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={[styles.heroPrimaryBtn, { backgroundColor: '#FFFFFF' }]}
                onPress={() => goTo('./bible')}
                activeOpacity={0.85}>
                <Text style={[styles.heroPrimaryBtnText, { color: theme.primary }]}>
                  Resume reading
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.heroGhostBtn, { borderColor: 'rgba(255,255,255,0.35)' }]}
                onPress={() => goTo('./prayer')}
                activeOpacity={0.85}>
                <Text style={styles.heroGhostBtnText}>Open prayer</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.previewCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.previewAccent, { backgroundColor: '#2E6A5C' }]} />
            <Text style={[styles.previewKicker, { color: theme.textMuted }]}>Verse focus</Text>
            <Text style={[styles.previewTitle, { color: theme.text }]}>
              {verseOfTheDay.theme}
            </Text>
            <Text style={[styles.previewVerse, { color: theme.primary }]}>
              {verseOfTheDay.text}
            </Text>
            <Text style={[styles.previewRef, { color: theme.textSecondary }]}>
              {verseOfTheDay.reference}
            </Text>
            <TouchableOpacity
              style={[styles.previewButton, { backgroundColor: theme.primarySoft }]}
              onPress={() => goTo('./bible')}
              activeOpacity={0.8}>
              <Text style={[styles.previewButtonText, { color: theme.primary }]}>
                Open Bible
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.previewCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.previewAccent, { backgroundColor: '#8A6236' }]} />
            <Text style={[styles.previewKicker, { color: theme.textMuted }]}>Study plans</Text>
            <Text style={[styles.previewTitle, { color: theme.text }]}>
              {activePlan ? 'Keep going' : 'No plan yet'}
            </Text>
            <Text style={[styles.previewVerse, { color: theme.textSecondary }]}>
              {activePlan ? activePlan.title : 'Join or create a plan to track your reading.'}
            </Text>
            {activePlan ? (
              <View style={styles.previewProgressBlock}>
                <Text style={[styles.previewProgressValue, { color: theme.text }]}>
                  Day {activePlan.currentDay ?? 0} of {activePlan.durationDays}
                </Text>
                <View style={[styles.previewProgressTrack, { backgroundColor: theme.surfaceAlt }]}>
                  <View
                    style={[
                      styles.previewProgressFill,
                      { width: `${activeProgress * 100}%`, backgroundColor: theme.primary },
                    ]}
                  />
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

        {!isSignedIn ? (
          <TouchableOpacity
            style={[styles.guestCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => router.push('/login')}
            activeOpacity={0.86}>
            <View style={[styles.guestMark, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="person-add-outline" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.guestTitle, { color: theme.text }]}>Sign in for everything else</Text>
              <Text style={[styles.guestBody, { color: theme.textSecondary }]}>
                Notes, prayers, quizzes and study plans need an account. Reading stays free.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.blogCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => router.push('/blog')}
          activeOpacity={0.86}>
          <View style={[styles.blogMark, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="newspaper-outline" size={20} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.blogTitle, { color: theme.text }]}>Community blog</Text>
            <Text style={[styles.blogBody, { color: theme.textSecondary }]}>
              Read what others are learning, or write your own.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { color: theme.text }]}>At a glance</Text>
        <View style={styles.snapshotGrid}>
          {snapshotItems.map((item, index) => (
            <View
              key={item.label}
              style={[
                styles.snapshotCard,
                {
                  backgroundColor: index === 0 ? theme.surfaceAlt : theme.surface,
                  borderColor: theme.border,
                },
              ]}>
              <View style={styles.snapshotTopRow}>
                <View style={[styles.snapshotIcon, { backgroundColor: theme.chipBg }]}>
                  <Ionicons name={item.icon} size={18} color={theme.primary} />
                </View>
                <Text style={[styles.snapshotValue, { color: theme.text }]}>{item.value}</Text>
              </View>
              <Text style={[styles.snapshotLabel, { color: theme.text }]}>{item.label}</Text>
              <Text style={[styles.snapshotDetail, { color: theme.textSecondary }]}>
                {item.detail}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.text }]}>Featured tools</Text>
        <View style={styles.featureGrid}>
          {FEATURE_CARDS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.featureCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => goTo(item.href)}
              activeOpacity={0.85}>
              <View style={[styles.featureIcon, { backgroundColor: `${item.accent}18` }]}>
                <Ionicons name={item.icon} size={20} color={item.accent} />
              </View>
              <Text style={[styles.featureTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                {item.description}
              </Text>
              <View style={styles.featureFooter}>
                <Text style={[styles.featureCta, { color: item.accent }]}>Open</Text>
                <Ionicons name="arrow-forward" size={14} color={item.accent} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.text }]}>What you can do next</Text>
        <View style={styles.highlightStack}>
          {FEATURE_HIGHLIGHTS.map((item, index) => (
            <View
              key={item.title}
              style={[
                styles.highlightCard,
                {
                  backgroundColor: index === 0 ? theme.primarySoft : theme.surface,
                  borderColor: theme.border,
                },
              ]}>
              <View style={[styles.highlightIcon, { backgroundColor: theme.chipBg }]}>
                <Ionicons name={item.icon} size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.highlightTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.highlightBody, { color: theme.textSecondary }]}>
                  {item.body}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.sectionHeaderRow}
          onPress={() => router.push('/plans')}
          activeOpacity={0.7}>
          <Text style={[styles.sectionLabel, { color: theme.text, marginBottom: 0 }]}>
            Study plans
          </Text>
          <Text style={[styles.sectionAction, { color: theme.primary }]}>See all</Text>
        </TouchableOpacity>
        <View style={styles.planStack}>
          {plans.length === 0 ? (
            <TouchableOpacity
              style={[styles.planCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => router.push('/plans')}
              activeOpacity={0.86}>
              <View style={styles.planLeft}>
                <View style={[styles.planDot, { backgroundColor: theme.border }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planName, { color: theme.text }]}>No plans yet</Text>
                  <Text style={[styles.planDuration, { color: theme.textMuted }]}>
                    Tap to join or create one
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            plans.map((plan) => {
              const ratio =
                plan.durationDays > 0
                  ? Math.min(1, (plan.currentDay ?? 0) / plan.durationDays)
                  : 0;

              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                  onPress={() => router.push(`/plans/${plan.id}`)}
                  activeOpacity={0.86}>
                  <View style={styles.planLeft}>
                    <View style={[styles.planDot, { backgroundColor: theme.primary }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.planName, { color: theme.text }]}>{plan.title}</Text>
                      <Text style={[styles.planDuration, { color: theme.textMuted }]}>
                        {plan.durationDays} days · {plan.memberCount}{' '}
                        {plan.memberCount === 1 ? 'member' : 'members'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.planRight}>
                    <Text style={[styles.planPercent, { color: theme.primary }]}>
                      {Math.round(ratio * 100)}%
                    </Text>
                    <View style={[styles.planTrack, { backgroundColor: theme.surfaceAlt }]}>
                      <View
                        style={[
                          styles.planFill,
                          { width: `${ratio * 100}%`, backgroundColor: theme.primary },
                        ]}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <TouchableOpacity
          style={[styles.quizCard, { backgroundColor: '#2E6A5C' }]}
          onPress={() => goTo('./quiz')}
          activeOpacity={0.88}>
          <View style={{ flex: 1 }}>
            <Text style={styles.quizTitle}>Test your knowledge</Text>
            <Text style={styles.quizSub}>Bible trivia across Old and New Testament.</Text>
          </View>
          <View style={styles.quizIcon}>
            <Ionicons name="help-circle" size={28} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
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
    paddingTop: 12,
    paddingBottom: 32,
  },
  glowTopRight: {
    position: 'absolute',
    top: -100,
    right: -90,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  glowBottomLeft: {
    position: 'absolute',
    left: -120,
    bottom: 100,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  brandMark: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  brandLogo: {
    width: 46,
    height: 46,
  },
  brandKicker: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '800',
    marginBottom: 3,
  },
  brandTitle: {
    fontSize: 22,
    lineHeight: 26,
    fontFamily: 'Georgia',
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  carousel: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 6,
  },
  heroCard: {
    width: 284,
    borderRadius: 28,
    padding: 20,
    shadowColor: '#0B1B33',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 6,
  },
  heroCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
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
  heroDate: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Georgia',
    marginBottom: 10,
  },
  heroBody: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },
  heroPrimaryBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  heroGhostBtn: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 108,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGhostBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  previewCard: {
    width: 228,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
  },
  previewAccent: {
    width: 42,
    height: 42,
    borderRadius: 14,
    marginBottom: 16,
  },
  previewKicker: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontWeight: '800',
    marginBottom: 6,
  },
  previewTitle: {
    fontSize: 20,
    fontFamily: 'Georgia',
    lineHeight: 24,
    marginBottom: 8,
  },
  previewVerse: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Georgia',
    marginBottom: 8,
  },
  previewRef: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 14,
  },
  previewButton: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  previewButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  previewProgressBlock: {
    marginTop: 10,
  },
  previewProgressValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 10,
  },
  previewProgressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  previewProgressFill: {
    height: 8,
    borderRadius: 999,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 22,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  snapshotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 10,
  },
  snapshotCard: {
    width: '48%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
  },
  snapshotTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  snapshotIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapshotValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  snapshotLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  snapshotDetail: {
    fontSize: 12,
    lineHeight: 17,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 10,
  },
  featureCard: {
    width: '48%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    minHeight: 168,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
    marginBottom: 12,
  },
  featureFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureCta: {
    fontSize: 12,
    fontWeight: '800',
  },
  highlightStack: {
    paddingHorizontal: 16,
    gap: 10,
  },
  highlightCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    alignItems: 'flex-start',
  },
  highlightIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  highlightBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  blogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginTop: 20,
  },
  blogMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blogTitle: { fontSize: 15, fontWeight: '800' },
  blogBody: { fontSize: 12.5, lineHeight: 18, marginTop: 3 },
  guestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginTop: 20,
  },
  guestMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: { fontSize: 15, fontWeight: '800' },
  guestBody: { fontSize: 12.5, lineHeight: 18, marginTop: 3 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 10,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '800',
  },
  planStack: {
    paddingHorizontal: 16,
    gap: 10,
  },
  planCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  planDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  planName: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  planDuration: {
    fontSize: 12,
  },
  planRight: {
    alignItems: 'flex-end',
    width: 100,
  },
  planPercent: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  planTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  planFill: {
    height: 6,
    borderRadius: 999,
  },
  quizCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  quizTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Georgia',
    marginBottom: 6,
  },
  quizSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 19,
  },
  quizIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});
