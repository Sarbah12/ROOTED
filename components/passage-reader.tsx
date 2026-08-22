import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { APP_THEMES } from '@/constants/app-theme';
import { parsePassage, type PassageChapter } from '@/constants/passage';
import {
  ALL_TRANSLATIONS,
  getTranslation,
  getTranslationsByLanguage,
  isUnavailableFor,
} from '@/constants/bible-translations';
import { BIBLE_BOOKS_BY_ID } from '@/constants/bible-books';
import { useThemeMode } from '@/context/theme-mode';
import { useChapter } from '@/hooks/use-chapter';

/**
 * The passage a plan day asks you to read, in the version you choose.
 *
 * The day screen used to name the reference and leave you to find it, which
 * meant leaving the plan, switching tab, navigating to the book and chapter,
 * and then finding your way back. The reading is the point of the day, so it
 * belongs on the day.
 */

/** One chapter. Separate component because each needs its own fetch. */
function Chapter({
  translationId,
  chapter,
  showHeading,
}: {
  translationId: string;
  chapter: PassageChapter;
  showHeading: boolean;
}) {
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;
  const state = useChapter(translationId, chapter.bookId, chapter.chapter);

  return (
    <View style={styles.chapter}>
      {showHeading ? (
        <Text style={[styles.chapterHeading, { color: theme.textMuted }]}>
          {chapter.bookName} {chapter.chapter}
        </Text>
      ) : null}

      {state.loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginVertical: 18 }} />
      ) : state.error ? (
        <Text style={[styles.error, { color: theme.textMuted }]}>{state.error}</Text>
      ) : (
        state.verses.map((verse) => (
          <Text key={verse.verse} style={[styles.verse, { color: theme.text }]}>
            <Text style={[styles.verseNum, { color: theme.primary }]}>{verse.verse} </Text>
            {verse.text}
          </Text>
        ))
      )}

      {state.copyright ? (
        <Text style={[styles.copyright, { color: theme.textMuted }]}>{state.copyright}</Text>
      ) : null}
    </View>
  );
}

export function PassageReader({
  reference,
  translationId,
  onChangeTranslation,
}: {
  reference: string;
  translationId: string;
  onChangeTranslation: (id: string) => void;
}) {
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;
  const [pickerOpen, setPickerOpen] = useState(false);

  const chapters = parsePassage(reference);
  const translation = getTranslation(translationId);

  // A day that spans both testaments cannot be read in a New Testament only
  // translation, so say so rather than rendering half of it.
  const missing = chapters.filter((c) => {
    const book = BIBLE_BOOKS_BY_ID[c.bookId];
    return book && isUnavailableFor(translation, book.testament);
  });

  return (
    <View>
      <View style={styles.bar}>
        <Text style={[styles.reference, { color: theme.text }]}>{reference}</Text>
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={[styles.versionBtn, { backgroundColor: theme.primarySoft }]}>
          <Text style={[styles.versionText, { color: theme.primary }]}>{translation.abbr}</Text>
          <Ionicons name="chevron-down" size={13} color={theme.primary} />
        </Pressable>
      </View>

      {chapters.length === 0 ? (
        <Text style={[styles.error, { color: theme.textMuted }]}>
          Could not read “{reference}”.
        </Text>
      ) : missing.length === chapters.length ? (
        <Text style={[styles.error, { color: theme.textMuted }]}>
          {translation.name} covers the New Testament only, so this reading is not in it. Choose
          another version.
        </Text>
      ) : (
        chapters.map((chapter) => (
          <Chapter
            key={`${chapter.bookId}-${chapter.chapter}`}
            translationId={translationId}
            chapter={chapter}
            // With one chapter the reference above already says which.
            showHeading={chapters.length > 1}
          />
        ))
      )}

      <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: theme.background }]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>Choose a version</Text>
              <Pressable onPress={() => setPickerOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {getTranslationsByLanguage().map((group) => (
                <View key={group.language} style={styles.group}>
                  <Text style={[styles.groupName, { color: theme.textMuted }]}>{group.language}</Text>
                  {group.translations.map((item) => {
                    const active = item.id === translationId;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          onChangeTranslation(item.id);
                          setPickerOpen(false);
                        }}
                        style={[
                          styles.option,
                          { borderColor: active ? theme.primary : theme.border },
                          active && { backgroundColor: theme.primarySoft },
                        ]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.optionName, { color: active ? theme.primary : theme.text }]}>
                            {item.abbr} · {item.name}
                          </Text>
                          <Text style={[styles.optionNote, { color: theme.textMuted }]}>
                            {item.coverage === 'nt' ? 'New Testament only · ' : ''}
                            {item.note}
                          </Text>
                        </View>
                        {active ? <Ionicons name="checkmark" size={18} color={theme.primary} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
              <View style={{ height: 28 }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/** Exposed so a caller can validate a stored id before passing it in. */
export function isKnownTranslation(id: string) {
  return ALL_TRANSLATIONS.some((t) => t.id === id);
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  reference: { flex: 1, fontSize: 17, fontFamily: 'Georgia' },
  versionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7 },
  versionText: { fontSize: 13, fontWeight: '800' },
  chapter: { marginBottom: 18 },
  chapterHeading: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  verse: { fontSize: 16.5, lineHeight: 27, fontFamily: 'Georgia', marginBottom: 8 },
  verseNum: { fontSize: 12, fontWeight: '800' },
  copyright: { fontSize: 10.5, lineHeight: 15, marginTop: 8 },
  error: { fontSize: 14, lineHeight: 21, marginVertical: 14 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '82%', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 18, paddingTop: 18 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sheetTitle: { fontSize: 19, fontFamily: 'Georgia' },
  group: { marginBottom: 18 },
  groupName: { fontSize: 11.5, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 8 },
  optionName: { fontSize: 14.5, fontWeight: '700' },
  optionNote: { fontSize: 12, marginTop: 2 },
});
