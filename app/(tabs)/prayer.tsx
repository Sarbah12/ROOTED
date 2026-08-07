import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  COLORS,
  PRAYER_CATEGORIES,
  PRAYER_STATUS_COLORS,
  PRAYER_STATUS_LABELS,
  type PrayerStatus,
} from '@/constants/bible-study';
import { APP_THEMES } from '@/constants/app-theme';
import { useThemeMode } from '@/context/theme-mode';
import { SignInRequired } from '@/components/sign-in-required';
import { usePrayers } from '@/hooks/use-prayers';

type PrayerFilter = 'All' | 'Ongoing' | 'Answered' | 'Trusting';

type PrayerForm = {
  title: string;
  content: string;
  category: string;
  verse: string;
};

function formatUpdated(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function PrayerJournalScreen() {
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;
  const { prayers, isSignedIn, error, refresh, createPrayer, updatePrayer, deletePrayer } =
    usePrayers();
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState<PrayerFilter>('All');
  const [form, setForm] = useState<PrayerForm>({
    title: '',
    content: '',
    category: 'Personal',
    verse: '',
  });

  const savePrayer = () => {
    if (!form.title.trim()) {
      return;
    }

    void createPrayer({ ...form, status: 'unanswered' });
    setModalVisible(false);
    setForm({ title: '', content: '', category: 'Personal', verse: '' });
  };

  const cycleStatus = (id: string, status: PrayerStatus) => {
    const nextStatus: Record<PrayerStatus, PrayerStatus> = {
      unanswered: 'ongoing',
      ongoing: 'answered',
      answered: 'unanswered',
    };

    void updatePrayer(id, { status: nextStatus[status] });
  };

  const filters: PrayerFilter[] = ['All', 'Ongoing', 'Answered', 'Trusting'];
  const filtered = prayers.filter((prayer) => {
    if (filter === 'All') {
      return true;
    }

    return PRAYER_STATUS_LABELS[prayer.status] === filter;
  });

  const answeredCount = prayers.filter((prayer) => prayer.status === 'answered').length;
  const ongoingCount = prayers.filter((prayer) => prayer.status === 'ongoing').length;
  const trustCount = prayers.filter((prayer) => prayer.status === 'unanswered').length;

  if (!isSignedIn) {
    return (
      <SignInRequired
        icon="heart-outline"
        title="Sign in to keep a prayer journal"
        body="Your requests and answered prayers are private to your account."
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View pointerEvents="none" style={[styles.glowTopRight, { backgroundColor: theme.glow }]} />
      <View pointerEvents="none" style={[styles.glowBottomLeft, { backgroundColor: theme.glow }]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.kicker, { color: theme.textMuted }]}>Prayer Journal</Text>
            <Text style={[styles.title, { color: theme.text }]}>Keep every request close</Text>
          </View>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}>
            <Ionicons name="add" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.heroCard, { backgroundColor: theme.primary }]}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>PRAYER</Text>
            </View>
            <Text style={styles.heroMeta}>{prayers.length} entries</Text>
          </View>
          <Text style={styles.heroTitle}>Track requests, praise reports, and answered prayers.</Text>
          <Text style={styles.heroBody}>
            Add a prayer in seconds, mark it as God answers, and keep your list organized by
            category.
          </Text>
          <TouchableOpacity
            style={styles.heroButton}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}>
            <Text style={[styles.heroButtonText, { color: theme.primary }]}>Add prayer</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
        {[
            { label: 'Total', value: prayers.length, color: theme.primary },
            { label: 'Answered', value: answeredCount, color: COLORS.success },
            { label: 'Ongoing', value: ongoingCount, color: COLORS.info },
            { label: 'Trusting', value: trustCount, color: COLORS.danger },
          ].map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {!isSignedIn ? (
          <View style={[styles.syncBanner, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <Ionicons name="phone-portrait-outline" size={16} color={theme.textSecondary} />
            <Text style={[styles.syncBannerText, { color: theme.textSecondary }]}>
              Saved on this device. Sign in to sync across devices.
            </Text>
          </View>
        ) : error ? (
          <TouchableOpacity
            onPress={refresh}
            style={[styles.syncBanner, { backgroundColor: theme.primarySoft, borderColor: theme.border }]}
            activeOpacity={0.8}>
            <Ionicons name="cloud-offline-outline" size={16} color={theme.primary} />
            <Text style={[styles.syncBannerText, { color: theme.text }]}>
              Saved on this device. Couldn&apos;t sync — tap to retry.
            </Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: theme.text }]}>Filters</Text>
          <Text style={[styles.sectionMeta, { color: theme.textMuted }]}>Tap a chip to filter</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filters.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === item ? theme.primarySoft : theme.surface,
                  borderColor: filter === item ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setFilter(item)}
              activeOpacity={0.8}>
              <Text style={[styles.filterText, { color: filter === item ? theme.primary : theme.textSecondary }]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="heart-outline" size={28} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No prayers here</Text>
            <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
              Create a new prayer request and keep your list moving forward.
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: theme.primary }]}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.85}>
              <Text style={styles.emptyButtonText}>Add prayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((prayer) => (
              <View
                key={prayer.id}
                style={[styles.prayerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.prayerTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.prayerTitle, { color: theme.text }]}>{prayer.title}</Text>
                    <View style={styles.metaRow}>
                      <View style={[styles.categoryBadge, { backgroundColor: theme.chipBg }]}>
                        <Text style={[styles.categoryText, { color: theme.chipText }]}>
                          {prayer.category}
                        </Text>
                      </View>
                      {prayer.verse ? (
                        <Text style={[styles.verseRef, { color: theme.textMuted }]}>{prayer.verse}</Text>
                      ) : null}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: theme.surfaceSoft,
                        borderColor: `${PRAYER_STATUS_COLORS[prayer.status]}44`,
                      },
                    ]}
                    onPress={() => cycleStatus(prayer.id, prayer.status)}
                    activeOpacity={0.8}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: PRAYER_STATUS_COLORS[prayer.status] },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: PRAYER_STATUS_COLORS[prayer.status] },
                      ]}>
                      {PRAYER_STATUS_LABELS[prayer.status]}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.prayerBody, { color: theme.textSecondary }]} numberOfLines={4}>
                  {prayer.content}
                </Text>

                <View style={styles.prayerFooter}>
                  <Text style={[styles.prayerDate, { color: theme.textMuted }]}>
                    {formatUpdated(prayer.updatedAt)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => void deletePrayer(prayer.id)}
                    style={[styles.deleteBtn, { backgroundColor: theme.primarySoft }]}
                    activeOpacity={0.8}>
                    <Ionicons name="trash-outline" size={14} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <SafeAreaView style={[styles.modalSafe, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.8}>
                <Text style={[styles.modalAction, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>New prayer</Text>
              <TouchableOpacity onPress={savePrayer} activeOpacity={0.8}>
                <Text style={[styles.modalAction, { color: theme.primary }]}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.formLabel, { color: theme.textMuted }]}>Prayer title</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceSoft }]}
                  value={form.title}
                  onChangeText={(value) => setForm((current) => ({ ...current, title: value }))}
                  placeholder="What are you praying for?"
                  placeholderTextColor={theme.textMuted}
                />

                <Text style={[styles.formLabel, { color: theme.textMuted }]}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryRow}>
                    {PRAYER_CATEGORIES.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.categoryChip,
                          {
                            backgroundColor: form.category === item ? theme.primarySoft : theme.surfaceSoft,
                            borderColor: form.category === item ? theme.primary : theme.border,
                          },
                        ]}
                        onPress={() => setForm((current) => ({ ...current, category: item }))}
                        activeOpacity={0.8}>
                        <Text
                          style={[
                            styles.categoryText,
                            { color: form.category === item ? theme.primary : theme.textSecondary },
                          ]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <Text style={[styles.formLabel, { color: theme.textMuted }]}>Your prayer</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    styles.formTextArea,
                    { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceSoft },
                  ]}
                  value={form.content}
                  onChangeText={(value) => setForm((current) => ({ ...current, content: value }))}
                  placeholder="Write your prayer to God..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />

                <Text style={[styles.formLabel, { color: theme.textMuted }]}>Scripture reference</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceSoft }]}
                  value={form.verse}
                  onChangeText={(value) => setForm((current) => ({ ...current, verse: value }))}
                  placeholder="Philippians 4:6"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              <View style={{ height: 28 }} />
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
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
    right: -80,
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  kicker: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '800',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Georgia',
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 14,
  },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  heroButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  syncBannerText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
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
  filterRow: {
    gap: 8,
    paddingBottom: 6,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 220,
    marginTop: 8,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Georgia',
  },
  emptyBody: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  emptyButton: {
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  list: {
    gap: 12,
    marginTop: 8,
  },
  prayerCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
  },
  prayerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  prayerTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '800',
  },
  verseRef: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  prayerBody: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  prayerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  prayerDate: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSafe: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Georgia',
  },
  modalAction: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalScroll: {
    flex: 1,
  },
  formCard: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  formLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontWeight: '800',
    marginTop: 4,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  formTextArea: {
    minHeight: 140,
    paddingTop: 14,
    lineHeight: 22,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
});
