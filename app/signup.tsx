import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
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
import {
  USERNAME_RULES,
  isSyntheticEmail,
  resolveIdentifier,
  validatePassword,
} from '@/constants/identity';
import { getFirebaseAuth } from '@/context/firebase-auth';
import { useThemeMode } from '@/context/theme-mode';
import { useAuthRedirect } from '@/hooks/use-auth-redirect';

/**
 * Account creation.
 *
 * The identifier can be an email, a username, or a phone number; all three are
 * mapped onto a Firebase email address (see constants/identity.ts). When the
 * chosen identifier is not a real inbox we ask for a recovery email, otherwise
 * a forgotten password would be unrecoverable.
 */
export default function SignUpScreen() {
  const auth = useMemo(() => getFirebaseAuth(), []);
  const router = useRouter();
  const goAfterAuth = useAuthRedirect();
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;

  const [displayName, setDisplayName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolved = identifier.trim() ? resolveIdentifier(identifier) : null;
  const needsRecoveryEmail = Boolean(resolved?.ok && isSyntheticEmail(resolved.email));

  const handleSignUp = async () => {
    setError(null);

    if (!displayName.trim()) {
      setError('Tell us what to call you.');
      return;
    }

    const result = resolveIdentifier(identifier);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    const passwordProblem = validatePassword(password);
    if (passwordProblem) {
      setError(passwordProblem);
      return;
    }

    if (password !== confirmPassword) {
      setError('Those passwords do not match.');
      return;
    }

    if (isSyntheticEmail(result.email) && recoveryEmail.trim()) {
      const recovery = resolveIdentifier(recoveryEmail);
      if (!recovery.ok || recovery.kind !== 'email') {
        setError('That recovery email does not look right.');
        return;
      }
    }

    setIsCreating(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, result.email, password);
      await updateProfile(credential.user, { displayName: displayName.trim() });
      goAfterAuth();
      return;
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';

      if (code === 'auth/email-already-in-use') {
        setError(
          result.kind === 'username'
            ? 'That username is taken. Try another.'
            : result.kind === 'phone'
              ? 'An account already uses that phone number.'
              : 'An account already uses that email.'
        );
      } else if (code === 'auth/weak-password') {
        setError('That password is too weak.');
      } else if (code === 'auth/network-request-failed') {
        setError('No connection. Check your network and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Unable to create your account.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View pointerEvents="none" style={[styles.glow, { backgroundColor: theme.glow }]} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backRow} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={20} color={theme.textSecondary} />
            <Text style={[styles.backText, { color: theme.textSecondary }]}>Sign in</Text>
          </TouchableOpacity>

          <Text style={[styles.kicker, { color: theme.textMuted }]}>Create account</Text>
          <Text style={[styles.title, { color: theme.text }]}>Start your study</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Your notes, prayers, and reading progress stay with your account.
          </Text>

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.textMuted }]}>Display name</Text>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Ada Lovelace"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="words"
            />

            <Text style={[styles.label, { color: theme.textMuted }]}>Email, username, or phone</Text>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}
              value={identifier}
              onChangeText={(value) => {
                setIdentifier(value);
                setError(null);
              }}
              placeholder="you@example.com"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {resolved?.ok ? (
              <Text style={[styles.hint, { color: theme.textMuted }]}>
                Signing up with your{' '}
                {resolved.kind === 'email' ? 'email' : resolved.kind === 'phone' ? 'phone number' : 'username'}
                {resolved.kind === 'username' ? ` — ${USERNAME_RULES}` : ''}
              </Text>
            ) : null}

            {needsRecoveryEmail ? (
              <>
                <Text style={[styles.label, { color: theme.textMuted }]}>Recovery email (optional)</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}
                  value={recoveryEmail}
                  onChangeText={setRecoveryEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={[styles.hint, { color: theme.textMuted }]}>
                  Without one there is no way to reset a forgotten password.
                </Text>
              </>
            ) : null}

            <Text style={[styles.label, { color: theme.textMuted }]}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput, { color: theme.text, backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setError(null);
                }}
                placeholder="At least 8 characters"
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword((value) => !value)}
                activeOpacity={0.7}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: theme.textMuted }]}>Confirm password</Text>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                setError(null);
              }}
              placeholder="Repeat your password"
              placeholderTextColor={theme.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
            />

            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={14} color="#C46A54" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.primary }, isCreating && styles.primaryBtnDisabled]}
              onPress={handleSignUp}
              disabled={isCreating}
              activeOpacity={0.85}>
              {isCreating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Create account</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.footerLink}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Already have an account? <Text style={{ color: theme.primary, fontWeight: '800' }}>Sign in</Text>
            </Text>
          </TouchableOpacity>
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
  title: { fontSize: 30, fontFamily: 'Georgia', marginTop: 6 },
  subtitle: { fontSize: 14.5, lineHeight: 21, marginTop: 8, marginBottom: 20 },
  card: { borderWidth: 1, borderRadius: 24, padding: 20, gap: 6 },
  label: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  hint: { fontSize: 11.5, lineHeight: 17, marginTop: 2 },
  passwordRow: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 48 },
  passwordToggle: { position: 'absolute', right: 14, height: 40, width: 30, alignItems: 'center', justifyContent: 'center' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  errorText: { flex: 1, color: '#C46A54', fontSize: 12.5, fontWeight: '600' },
  primaryBtn: { borderRadius: 999, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  footerLink: { marginTop: 22, alignItems: 'center' },
  footerText: { fontSize: 14 },
});
