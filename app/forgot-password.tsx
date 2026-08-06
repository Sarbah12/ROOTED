import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_THEMES } from '@/constants/app-theme';
import { resolveIdentifier } from '@/constants/identity';
import { getFirebaseAuth } from '@/context/firebase-auth';
import { useThemeMode } from '@/context/theme-mode';

/**
 * Password reset.
 *
 * Firebase can only mail a reset link to a real inbox, so this asks for an
 * email address rather than any identifier — a username or phone number maps to
 * a synthetic address that nobody receives mail at.
 */
export default function ForgotPasswordScreen() {
  const auth = useMemo(() => getFirebaseAuth(), []);
  const router = useRouter();
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;

  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    setError(null);

    const result = resolveIdentifier(email);
    if (!result.ok || result.kind !== 'email') {
      setError('Enter the email address on your account.');
      return;
    }

    setIsSending(true);
    try {
      await sendPasswordResetEmail(auth, result.email);
      setSent(true);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';

      // Don't reveal whether the address is registered.
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        setSent(true);
      } else if (code === 'auth/network-request-failed') {
        setError('No connection. Check your network and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Unable to send the reset email.');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View pointerEvents="none" style={[styles.glow, { backgroundColor: theme.glow }]} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backRow} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={20} color={theme.textSecondary} />
            <Text style={[styles.backText, { color: theme.textSecondary }]}>Sign in</Text>
          </TouchableOpacity>

          <Text style={[styles.kicker, { color: theme.textMuted }]}>Password reset</Text>
          <Text style={[styles.title, { color: theme.text }]}>
            {sent ? 'Check your email' : 'Reset your password'}
          </Text>

          {sent ? (
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.doneMark, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="mail-outline" size={22} color={theme.primary} />
              </View>
              <Text style={[styles.body, { color: theme.textSecondary }]}>
                If an account uses that address, a reset link is on its way. The link expires after
                an hour.
              </Text>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                onPress={() => router.back()}
                activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Back to sign in</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.body, { color: theme.textSecondary }]}>
                Enter the email on your account and we will send a link to set a new password.
              </Text>

              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setError(null);
                }}
                placeholder="you@example.com"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                onSubmitEditing={handleReset}
                returnKeyType="send"
              />

              {error ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color="#C46A54" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.primary }, isSending && styles.primaryBtnDisabled]}
                onPress={handleReset}
                disabled={isSending}
                activeOpacity={0.85}>
                {isSending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Send reset link</Text>
                )}
              </TouchableOpacity>

              <Text style={[styles.hint, { color: theme.textMuted }]}>
                Signed up with a username or phone number and no recovery email? Get in touch and we
                will sort it out.
              </Text>
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
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  glow: { position: 'absolute', top: -90, right: -90, width: 220, height: 220, borderRadius: 110 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  backText: { fontSize: 14, fontWeight: '700' },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { fontSize: 30, fontFamily: 'Georgia', marginTop: 6, marginBottom: 20 },
  card: { borderWidth: 1, borderRadius: 24, padding: 20, gap: 12 },
  doneMark: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  body: { fontSize: 14.5, lineHeight: 21 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  hint: { fontSize: 11.5, lineHeight: 17 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { flex: 1, color: '#C46A54', fontSize: 12.5, fontWeight: '600' },
  primaryBtn: { borderRadius: 999, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
