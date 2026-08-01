import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_THEMES } from '@/constants/app-theme';
import { useThemeMode } from '@/context/theme-mode';

export default function ModalScreen() {
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View pointerEvents="none" style={[styles.glowTopRight, { backgroundColor: theme.glow }]} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="information-circle-outline" size={28} color={theme.primary} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Modal page</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            This route is available for quick pop-up content or future in-app prompts. It now
            follows the same visual style as the rest of the app.
          </Text>

          <Link href="/" dismissTo asChild>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
              <Text style={styles.buttonText}>Go to home</Text>
            </TouchableOpacity>
          </Link>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  glowTopRight: {
    position: 'absolute',
    top: -90,
    right: -90,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  card: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Georgia',
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  button: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
