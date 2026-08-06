import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BIBLE_BOOKS, BIBLE_BOOKS_BY_ID, type Testament } from '@/constants/bible-books';
import { SPACING } from '@/constants/bible-study';
import {
  DEFAULT_TRANSLATION_ID,
  TRANSLATIONS,
  getTranslation,
} from '@/constants/bible-translations';
import { APP_THEMES } from '@/constants/app-theme';
import { useThemeMode } from '@/context/theme-mode';
import { useChapter } from '@/hooks/use-chapter';

export default function BibleReaderScreen() {
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;
  const [selectedBookId, setSelectedBookId] = useState('jhn');
  const [selectedChapter, setSelectedChapter] = useState(3);
  const [translationId, setTranslationId] = useState(DEFAULT_TRANSLATION_ID);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [chapterModalVisible, setChapterModalVisible] = useState(false);
  const [translationModalVisible, setTranslationModalVisible] = useState(false);
  const [highlightedVerses, setHighlightedVerses] = useState<number[]>([]);
  const [bookmarkedVerses, setBookmarkedVerses] = useState<number[]>([]);
  const [fontSize, setFontSize] = useState(17);
  const [testament, setTestament] = useState<Testament>('NT');

  const selectedBook = BIBLE_BOOKS_BY_ID[selectedBookId];
  const translation = getTranslation(translationId);
  const { verses, loading, error, origin } = useChapter(
    translationId,
    selectedBookId,
    selectedChapter,
  );
  const filteredBooks = BIBLE_BOOKS.filter((book) => book.testament === testament);
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateLabel = `${dayNames[today.getDay()]}, ${monthNames[today.getMonth()]} ${today.getDate()}`;

  const toggleHighlight = (verse: number) => {
    setHighlightedVerses((prev) =>
      prev.includes(verse) ? prev.filter((item) => item !== verse) : [...prev, verse],
    );
  };

  const toggleBookmark = (verse: number) => {
    setBookmarkedVerses((prev) =>
      prev.includes(verse) ? prev.filter((item) => item !== verse) : [...prev, verse],
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View pointerEvents="none" style={[styles.glowOne, { backgroundColor: theme.glow }]} />
      <View pointerEvents="none" style={[styles.glowTwo, { backgroundColor: theme.glow }]} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.kicker, { color: theme.textMuted }]}>Bible Reader</Text>
            <Text style={[styles.title, { color: theme.text }]}>Read with focus</Text>
          </View>
          <View style={styles.topActions}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setFontSize((size) => Math.max(13, size - 2))}
              activeOpacity={0.8}>
              <Text style={[styles.fontBtnText, { color: theme.text }]}>A-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setFontSize((size) => Math.min(24, size + 2))}
              activeOpacity={0.8}>
              <Text style={[styles.fontBtnText, { color: theme.text }]}>A+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              activeOpacity={0.8}>
              <Ionicons name="search-outline" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.heroWrap}>
          <View style={[styles.heroCard, { backgroundColor: theme.primary }]}>
            <View style={styles.heroHeader}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>TODAY</Text>
              </View>
              <Text style={styles.heroDate}>{dateLabel}</Text>
            </View>
            <Text style={styles.heroTitle}>{selectedBook.name} {selectedChapter}</Text>
            <Text style={styles.heroBody}>
              Use chapter selectors, highlight verses, and keep bookmarks close as you study.
            </Text>
            <View style={styles.heroStats}>
              <View style={styles.heroStatChip}>
                <Ionicons name="bookmark-outline" size={14} color="#FFFFFF" />
                <Text style={styles.heroStatText}>{bookmarkedVerses.length} saved</Text>
              </View>
              <View style={styles.heroStatChip}>
                <Ionicons name="color-wand-outline" size={14} color="#FFFFFF" />
                <Text style={styles.heroStatText}>{highlightedVerses.length} highlighted</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.selectorRow}>
          <TouchableOpacity
            style={[styles.selectorCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => setBookModalVisible(true)}
            activeOpacity={0.85}>
            <Text style={[styles.selectorLabel, { color: theme.textMuted }]}>Book</Text>
            <View style={styles.selectorValueRow}>
              <Text style={[styles.selectorValue, { color: theme.text }]}>{selectedBook.name}</Text>
              <Ionicons name="chevron-down" size={14} color={theme.primary} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectorCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => setChapterModalVisible(true)}
            activeOpacity={0.85}>
            <Text style={[styles.selectorLabel, { color: theme.textMuted }]}>Chapter</Text>
            <View style={styles.selectorValueRow}>
              <Text style={[styles.selectorValue, { color: theme.text }]}>{selectedChapter}</Text>
              <Ionicons name="chevron-down" size={14} color={theme.primary} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.selectorCard,
              styles.selectorCardNarrow,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => setTranslationModalVisible(true)}
            activeOpacity={0.85}>
            <Text style={[styles.selectorLabel, { color: theme.textMuted }]}>Version</Text>
            <View style={styles.selectorValueRow}>
              <Text style={[styles.selectorValue, { color: theme.text }]}>{translation.abbr}</Text>
              {origin === 'offline' ? (
                <Ionicons name="cloud-done-outline" size={14} color={theme.primary} />
              ) : (
                <Ionicons name="chevron-down" size={14} color={theme.primary} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.verseWrap}>
          {error ? (
            <View
              style={[
                styles.noticeCard,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
              ]}>
              <Ionicons name="cloud-offline-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.noticeText, { color: theme.textSecondary }]}>{error}</Text>
            </View>
          ) : null}

          {loading && verses.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <ActivityIndicator color={theme.primary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Loading {selectedBook.name} {selectedChapter}
              </Text>
              <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
                Fetching the {translation.abbr} text.
              </Text>
            </View>
          ) : verses.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="book-outline" size={44} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {selectedBook.name} {selectedChapter} is unavailable
              </Text>
              <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
                Try another translation, or switch back to KJV to read offline.
              </Text>
            </View>
          ) : (
            verses.map((verseItem) => {
              const isHighlighted = highlightedVerses.includes(verseItem.verse);
              const isBookmarked = bookmarkedVerses.includes(verseItem.verse);

              return (
                <TouchableOpacity
                  key={verseItem.verse}
                  style={[
                    styles.verseCard,
                    {
                      backgroundColor: isHighlighted ? theme.primarySoft : theme.surface,
                      borderColor: isHighlighted ? theme.primary : theme.border,
                    },
                  ]}
                  onLongPress={() => toggleHighlight(verseItem.verse)}
                  activeOpacity={0.78}>
                  <View style={styles.verseTopRow}>
                    <View style={[styles.verseNumberChip, { backgroundColor: theme.chipBg }]}>
                      <Text style={[styles.verseNumberText, { color: theme.primary }]}>
                        {verseItem.verse}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleBookmark(verseItem.verse)}>
                      <Ionicons
                        name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                        size={18}
                        color={isBookmarked ? theme.primary : theme.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.verseText, { color: theme.text, fontSize }]}>{verseItem.text}</Text>
                </TouchableOpacity>
              );
            })
          )}
          {verses.length > 0 ? (
            <Text style={[styles.tip, { color: theme.textMuted }]}>Long-press a verse to highlight it.</Text>
          ) : null}
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => setSelectedChapter((chapter) => Math.max(1, chapter - 1))}
            disabled={selectedChapter <= 1}
            activeOpacity={0.8}>
            <Ionicons
              name="chevron-back"
              size={18}
              color={selectedChapter <= 1 ? theme.textMuted : theme.text}
            />
            <Text style={[styles.navText, { color: selectedChapter <= 1 ? theme.textMuted : theme.text }]}>
              Previous
            </Text>
          </TouchableOpacity>
          <Text style={[styles.navCenter, { color: theme.textMuted }]}>
            {selectedChapter} / {selectedBook.chapters}
          </Text>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() =>
              setSelectedChapter((chapter) => Math.min(selectedBook.chapters, chapter + 1))
            }
            disabled={selectedChapter >= selectedBook.chapters}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.navText,
                { color: selectedChapter >= selectedBook.chapters ? theme.textMuted : theme.text },
              ]}>
              Next
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={selectedChapter >= selectedBook.chapters ? theme.textMuted : theme.text}
            />
          </TouchableOpacity>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>

      <Modal
        visible={bookModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBookModalVisible(false)}>
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Book</Text>
            <TouchableOpacity onPress={() => setBookModalVisible(false)}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalToggleRow}>
            {(['OT', 'NT'] as Testament[]).map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.modalToggle,
                  {
                    backgroundColor: testament === item ? theme.primarySoft : theme.surface,
                    borderColor: testament === item ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setTestament(item)}
                activeOpacity={0.8}>
                <Text style={{ color: testament === item ? theme.primary : theme.textSecondary, fontWeight: '800' }}>
                  {item === 'OT' ? 'Old Testament' : 'New Testament'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={filteredBooks}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ gap: 10, paddingHorizontal: SPACING.md }}
            contentContainerStyle={{ paddingBottom: 32, gap: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.gridItem,
                  {
                    backgroundColor: selectedBook.id === item.id ? theme.primarySoft : theme.surface,
                    borderColor: selectedBook.id === item.id ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => {
                  setSelectedBookId(item.id);
                  setSelectedChapter(1);
                  setTestament(item.testament);
                  setBookModalVisible(false);
                }}
                activeOpacity={0.8}>
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14 }}>{item.name}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>{item.chapters} chapters</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      <Modal
        visible={chapterModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setChapterModalVisible(false)}>
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Chapter</Text>
            <TouchableOpacity onPress={() => setChapterModalVisible(false)}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={Array.from({ length: selectedBook.chapters }, (_, index) => index + 1)}
            keyExtractor={(item) => String(item)}
            numColumns={5}
            columnWrapperStyle={{ gap: 10, paddingHorizontal: SPACING.md }}
            contentContainerStyle={{ paddingBottom: 32, gap: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.chapterItem,
                  {
                    backgroundColor: selectedChapter === item ? theme.primarySoft : theme.surface,
                    borderColor: selectedChapter === item ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => {
                  setSelectedChapter(item);
                  setChapterModalVisible(false);
                }}
                activeOpacity={0.8}>
                <Text style={{ color: selectedChapter === item ? theme.primary : theme.text, fontWeight: '800' }}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      <Modal
        visible={translationModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTranslationModalVisible(false)}>
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Version</Text>
            <TouchableOpacity onPress={() => setTranslationModalVisible(false)}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: SPACING.md, gap: 10 }}>
            {TRANSLATIONS.map((item) => {
              const isActive = item.id === translationId;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.translationRow,
                    {
                      backgroundColor: isActive ? theme.primarySoft : theme.surface,
                      borderColor: isActive ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => {
                    setTranslationId(item.id);
                    setTranslationModalVisible(false);
                  }}
                  activeOpacity={0.85}>
                  <View style={styles.translationInfo}>
                    <View style={styles.translationTitleRow}>
                      <Text style={[styles.translationAbbr, { color: theme.text }]}>{item.abbr}</Text>
                      {item.source === 'offline' ? (
                        <View style={[styles.offlineChip, { backgroundColor: theme.chipBg }]}>
                          <Ionicons name="cloud-done-outline" size={11} color={theme.primary} />
                          <Text style={[styles.offlineChipText, { color: theme.primary }]}>Offline</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.translationName, { color: theme.textSecondary }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.translationNote, { color: theme.textMuted }]}>{item.note}</Text>
                  </View>
                  {isActive ? (
                    <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                  ) : null}
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.licenseNote, { color: theme.textMuted }]}>
              All versions are in the public domain. KJV is bundled with the app; the rest
              download once and are then cached for offline reading.
            </Text>
          </ScrollView>
        </SafeAreaView>
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
  glowOne: {
    position: 'absolute',
    top: -90,
    right: -100,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  glowTwo: {
    position: 'absolute',
    bottom: 40,
    left: -110,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: 12,
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
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontBtnText: {
    fontSize: 12,
    fontWeight: '900',
  },
  heroWrap: {
    paddingHorizontal: SPACING.md,
    marginTop: 14,
  },
  heroCard: {
    borderRadius: 28,
    padding: 20,
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
    fontSize: 28,
    fontFamily: 'Georgia',
    marginBottom: 8,
  },
  heroBody: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  heroStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  heroStatText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: SPACING.md,
    marginTop: 14,
  },
  selectorCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
  },
  selectorCardNarrow: {
    flex: 0.72,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
  },
  translationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  translationInfo: {
    flex: 1,
  },
  translationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  translationAbbr: {
    fontSize: 16,
    fontWeight: '800',
  },
  offlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  offlineChipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  translationName: {
    fontSize: 13.5,
    fontWeight: '600',
    marginTop: 2,
  },
  translationNote: {
    fontSize: 12,
    marginTop: 2,
  },
  licenseNote: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  selectorLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontWeight: '800',
    marginBottom: 6,
  },
  selectorValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  selectorValue: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  verseWrap: {
    paddingHorizontal: SPACING.md,
    marginTop: 12,
    gap: 10,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Georgia',
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  verseCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
  },
  verseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  verseNumberChip: {
    minWidth: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  verseNumberText: {
    fontWeight: '900',
    fontSize: 13,
  },
  verseText: {
    lineHeight: 27,
    fontFamily: 'Georgia',
  },
  tip: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 4,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: SPACING.md,
    marginTop: 10,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 108,
    justifyContent: 'center',
  },
  navText: {
    fontSize: 13,
    fontWeight: '800',
  },
  navCenter: {
    fontSize: 12,
    fontWeight: '800',
  },
  modalSafe: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalToggleRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: SPACING.md,
    marginBottom: 12,
  },
  modalToggle: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  gridItem: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 14,
    gap: 6,
  },
  chapterItem: {
    width: '18%',
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
});
