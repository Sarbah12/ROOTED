import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_THEMES } from '@/constants/app-theme';
import { useThemeMode } from '@/context/theme-mode';

/**
 * Shown in place of a feature that needs an account.
 *
 * Reading the Bible is deliberately open to everyone — someone should be able
 * to install the app and read Scripture without handing over any details.
 * Everything that stores something about a person needs an account.
 */
export function SignInRequired({
  title,
  body,
  icon = 'lock-closed-outline',
}: {
  title: string;
  body: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const router = useRouter();
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;

  // Carry where the user was heading, so signing in returns them to the thing
  // they wanted rather than dropping them on the home tab.
  const pathname = usePathname();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View pointerEvents="none" style={[styles.glow, { backgroundColor: theme.glow }]} />

      <View style={styles.center}>
        <View style={[styles.mark, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name={icon} size={28} color={theme.primary} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{body}</Text>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
          onPress={() => router.push({ pathname: '/login', params: { next: pathname } })}
          activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Sign in</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push({ pathname: '/signup', params: { next: pathname } })}
          activeOpacity={0.7}>
          <Text style={[styles.secondaryText, { color: theme.primary }]}>Create an account</Text>
        </TouchableOpacity>

        <View style={[styles.readingNote, { borderColor: theme.border }]}>
          <Ionicons name="book-outline" size={15} color={theme.textMuted} />
          <Text style={[styles.readingNoteText, { color: theme.textMuted }]}>
            Reading the Bible stays free, with no account needed.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  glow: { position: 'absolute', top: -90, right: -90, width: 220, height: 220, borderRadius: 110 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, gap: 12 },
  mark: { width: 66, height: 66, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 23, fontFamily: 'Georgia', textAlign: 'center', marginTop: 4 },
  body: { fontSize: 14.5, lineHeight: 22, textAlign: 'center' },
  primaryBtn: {
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 46,
    marginTop: 10,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  secondaryBtn: { paddingVertical: 8 },
  secondaryText: { fontSize: 14, fontWeight: '800' },
  readingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 15,
    marginTop: 18,
  },
  readingNoteText: { fontSize: 12, fontWeight: '600' },
});
