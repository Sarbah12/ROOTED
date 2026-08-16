import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_THEMES } from '@/constants/app-theme';
import { parseQuery, searchBible, type SearchResult } from '@/constants/bible-search';
import { useThemeMode } from '@/context/theme-mode';

type Scope = 'all' | 'OT' | 'NT';

/** Splits on **term** so matches can be bolded without a markdown renderer. */
function Highlighted({ text, terms, color, accent }: {
  text: string;
  terms: string[];
  color: string;
  accent: string;
}) {
  if (terms.length === 0) return <Text style={{ color }}>{text}</Text>;

  const pattern = new RegExp(
    `(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi',
  );
  const parts = text.split(pattern);

  return (
    <Text style={{ color }}>
      {parts.map((part, index) =>
        pattern.test(part) && terms.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
          <Text key={index} style={{ color: accent, fontWeight: '800' }}>
            {part}
          </Text>
        ) : (
          <Text key={index}>{part}</Text>
        ),
      )}
    </Text>
  );
}

export default function BibleSearchScreen() {
  const router = useRouter();
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;

  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  // Bumped on each new search so an in-flight scan can bail out.
  const runId = useRef(0);

  const terms = parseQuery(query).terms;

  const runSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    const currentRun = ++runId.current;
    setIsSearching(true);
    setResults([]);
    setProgress(0);
    setHasSearched(true);

    await searchBible(trimmed, {
      testament: scope === 'all' ? 'all' : scope,
      shouldCancel: () => runId.current !== currentRun,
      onProgress: ({ results: found, booksScanned, totalBooks }) => {
        if (runId.current !== currentRun) return;
        setResults(found);
        setProgress(booksScanned / totalBooks);
      },
    });

    if (runId.current === currentRun) setIsSearching(false);
  }, [query, scope]);

  // Re-run when the testament filter changes, if a search is already showing.
  useEffect(() => {
    if (hasSearched && query.trim().length >= 2) void runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
          <View
            style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="search-outline" size={17} color={theme.textMuted} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={query}
              onChangeText={setQuery}
              placeholder="Search the Bible"
              placeholderTextColor={theme.textMuted}
              autoFocus
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={runSearch}
            />
            {query.length > 0 ? (
              <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7} hitSlop={8}>
                <Ionicons name="close-circle" size={17} color={theme.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={[styles.scopeRow, { backgroundColor: theme.surfaceAlt }]}>
          {([
            { value: 'all' as const, label: 'Whole Bible' },
            { value: 'OT' as const, label: 'Old Testament' },
            { value: 'NT' as const, label: 'New Testament' },
          ]).map((option) => {
            const active = scope === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.scopeBtn, active && { backgroundColor: theme.surface }]}
                onPress={() => setScope(option.value)}
                activeOpacity={0.85}>
                <Text style={[styles.scopeText, { color: active ? theme.primary : theme.textMuted }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isSearching ? (
          <View style={[styles.progressTrack, { backgroundColor: theme.surfaceAlt }]}>
            <View
              style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: theme.primary }]}
            />
          </View>
        ) : null}

        {hasSearched ? (
          <Text style={[styles.summary, { color: theme.textMuted }]}>
            {isSearching
              ? `Searching… ${results.length} so far`
              : `${results.length} ${results.length === 1 ? 'result' : 'results'}${
                  results.length >= 200 ? ' (showing the first 200)' : ''
                }`}
          </Text>
        ) : null}

        <FlatList
          data={results}
          keyExtractor={(item) => `${item.bookId}-${item.chapter}-${item.verse}`}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            !hasSearched ? (
              <View style={styles.empty}>
                <View style={[styles.emptyMark, { backgroundColor: theme.primarySoft }]}>
                  <Ionicons name="search" size={22} color={theme.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  Search all 31,102 verses
                </Text>
                <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
                  Works offline. Every word must appear in the verse, so “faith works”
                  finds “faith without works”. Use quotes for an exact phrase.
                </Text>
              </View>
            ) : !isSearching ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Nothing found</Text>
                <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
                  Try fewer or different words.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.result, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/bible',
                  params: { bookId: item.bookId, chapter: String(item.chapter) },
                })
              }
              activeOpacity={0.85}>
              <Text style={[styles.reference, { color: theme.primary }]}>
                {item.bookName} {item.chapter}:{item.verse}
              </Text>
              <Text style={[styles.verseText, { color: theme.text }]}>
                <Highlighted
                  text={item.text}
                  terms={terms}
                  color={theme.text}
                  accent={theme.primary}
                />
              </Text>
            </TouchableOpacity>
          )}
        />

        {isSearching ? (
          <View style={styles.searchingRow}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 10 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: { flex: 1, fontSize: 15 },
  scopeRow: { flexDirection: 'row', marginHorizontal: 16, padding: 4, borderRadius: 999, gap: 4 },
  scopeBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 999 },
  scopeText: { fontSize: 12.5, fontWeight: '800' },
  progressTrack: { height: 3, marginHorizontal: 16, marginTop: 10, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  summary: { fontSize: 12, fontWeight: '700', paddingHorizontal: 20, paddingTop: 12 },
  list: { padding: 16, gap: 10 },
  result: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 6 },
  reference: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  verseText: { fontSize: 15, lineHeight: 23, fontFamily: 'Georgia' },
  empty: { alignItems: 'center', gap: 10, paddingTop: 60, paddingHorizontal: 30 },
  emptyMark: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontFamily: 'Georgia' },
  emptyBody: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  searchingRow: { paddingVertical: 12, alignItems: 'center' },
});
