import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  OAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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

import { APP_THEMES } from '@/constants/app-theme';
import { resolveIdentifier } from '@/constants/identity';
import { getFirebaseAuth } from '@/context/firebase-auth';
import { useThemeMode } from '@/context/theme-mode';
import { useAuthRedirect } from '@/hooks/use-auth-redirect';

const AppleAuthenticationModule =
  Platform.OS === 'ios' ? AppleAuthentication : null;

const BENEFITS = [
  {
    icon: 'book-outline',
    title: 'Keep reading progress in sync',
    body: 'Return to the same chapter and verse on any device.',
  },
  {
    icon: 'heart-outline',
    title: 'Save prayer requests securely',
    body: 'Track answered prayers, ongoing requests, and daily gratitude.',
  },
  {
    icon: 'create-outline',
    title: 'Carry your notes with you',
    body: 'Store sermon notes, reflections, and study highlights in one place.',
  },
] as const;

type CountryOption = {
  name: string;
  code: string;
  flag: string;
};

const COUNTRIES: CountryOption[] = [
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'Ghana', code: '+233', flag: '🇬🇭' },
  { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦' },
  { name: 'Kenya', code: '+254', flag: '🇰🇪' },
];

function BenefitRow({
  icon,
  title,
  body,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  theme: (typeof APP_THEMES)[keyof typeof APP_THEMES];
}) {
  return (
    <View style={[styles.benefitRow, { borderColor: theme.border, backgroundColor: theme.surfaceSoft }]}>
      <View style={[styles.benefitIcon, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name={icon} size={16} color={theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.benefitTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.benefitBody, { color: theme.textSecondary }]}>{body}</Text>
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const auth = useMemo(() => getFirebaseAuth(), []);
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;
  const router = useRouter();
  const goAfterAuth = useAuthRedirect();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRIES[0]);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const [isAppleChecking, setIsAppleChecking] = useState(true);
  const [isAppleSigningIn, setIsAppleSigningIn] = useState(false);

  const canSubmit = identifier.trim().length > 0 && password.length > 0;

  useEffect(() => {
    let isMounted = true;

    if (!AppleAuthenticationModule) {
      setIsAppleAvailable(false);
      setIsAppleChecking(false);
      return () => {
        isMounted = false;
      };
    }

    AppleAuthenticationModule.isAvailableAsync()
      .then((available: boolean) => {
        if (isMounted) {
          setIsAppleAvailable(available);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsAppleAvailable(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsAppleChecking(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignIn = async () => {
    setFormError(null);

    // One field accepts an email, a username, or a phone number; this works out
    // which was typed and maps it to the address Firebase authenticates.
    const resolved = resolveIdentifier(identifier, selectedCountry.code);
    if (!resolved.ok) {
      setFormError(resolved.message);
      return;
    }

    if (!password) {
      setFormError('Enter your password.');
      return;
    }

    setIsSigningIn(true);
    try {
      await signInWithEmailAndPassword(auth, resolved.email, password);
      goAfterAuth();
      return;
    } catch (error) {
      const code = (error as { code?: string })?.code ?? '';

      // Firebase returns a deliberately vague code here; keep it vague so the
      // screen does not confirm whether an account exists.
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setFormError('That sign-in did not match. Check your details and try again.');
      } else if (code === 'auth/too-many-requests') {
        setFormError('Too many attempts. Wait a moment before trying again.');
      } else if (code === 'auth/network-request-failed') {
        setFormError('No connection. Check your network and try again.');
      } else {
        setFormError(error instanceof Error ? error.message : 'Unable to sign in.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (isAppleChecking) {
      Alert.alert('Apple sign-in is still loading', 'Please wait a moment and try again.');
      return;
    }

    if (!AppleAuthenticationModule) {
      Alert.alert('Apple sign-in is unavailable', 'Apple sign-in only works on iOS devices.');
      return;
    }

    if (!isAppleAvailable) {
      Alert.alert('Apple sign-in is unavailable', 'This device does not support Sign in with Apple.');
      return;
    }

    setIsAppleSigningIn(true);
    try {
      const credential = await AppleAuthenticationModule.signInAsync({
        requestedScopes: [
          AppleAuthenticationModule.AppleAuthenticationScope.FULL_NAME,
          AppleAuthenticationModule.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('Apple sign-in did not return an identity token.');
      }

      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: credential.identityToken,
      });
      await signInWithCredential(auth, firebaseCredential);
      goAfterAuth();
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in with Apple.';
      Alert.alert('Apple sign-in failed', message);
    } finally {
      setIsAppleSigningIn(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View pointerEvents="none" style={[styles.glowTopRight, { backgroundColor: theme.glow }]} />
      <View pointerEvents="none" style={[styles.glowBottomLeft, { backgroundColor: theme.glow }]} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.heroCard, { backgroundColor: theme.primary }]}>
            <View style={styles.heroHeader}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>WELCOME BACK</Text>
              </View>
            </View>
            <View style={styles.logoWrap}>
              <Image
                source={require('../assets/images/rooted-logo.png')}
                style={styles.heroLogo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.heroTitle}>Root your reading, notes, and prayers in one place.</Text>
            <Text style={styles.heroBody}>
              Sign in with your email, username, or phone number to keep study plans, notes, and
              prayer requests together.
            </Text>
            <View style={styles.heroChipRow}>
              <View style={styles.heroChip}>
                <Ionicons name="phone-portrait-outline" size={12} color="#FFFFFF" />
                <Text style={styles.heroChipText}>Phone</Text>
              </View>
              <View style={styles.heroChip}>
                <Ionicons name="logo-apple" size={12} color="#FFFFFF" />
                <Text style={styles.heroChipText}>Apple</Text>
              </View>
            </View>
          </View>

          <View style={[styles.phoneCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.formHeader}>
              <View>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Secure sign in</Text>
                <Text style={[styles.formTitle, { color: theme.text }]}>Welcome back</Text>
              </View>
              <View style={[styles.formMark, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="lock-closed-outline" size={14} color={theme.primary} />
              </View>
            </View>

            <TextInput
              style={[
                styles.input,
                { color: theme.text, backgroundColor: theme.surfaceSoft, borderColor: theme.border },
              ]}
              value={identifier}
              onChangeText={(value) => {
                setIdentifier(value);
                setFormError(null);
              }}
              placeholder="Email, username, or phone"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
            />

            <View style={styles.passwordRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  { color: theme.text, backgroundColor: theme.surfaceSoft, borderColor: theme.border },
                ]}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setFormError(null);
                }}
                placeholder="Password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
                onSubmitEditing={handleSignIn}
                returnKeyType="go"
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword((value) => !value)}
                activeOpacity={0.7}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={theme.textMuted}
                />
              </TouchableOpacity>
            </View>

            {formError ? (
              <View style={styles.formErrorRow}>
                <Ionicons name="alert-circle-outline" size={14} color="#C46A54" />
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: theme.primary },
                (!canSubmit || isSigningIn) && styles.primaryBtnDisabled,
              ]}
              disabled={!canSubmit || isSigningIn}
              onPress={handleSignIn}
              activeOpacity={0.85}>
              {isSigningIn ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Sign in</Text>
              )}
            </TouchableOpacity>

            <View style={styles.authLinksRow}>
              <TouchableOpacity onPress={() => router.push('/forgot-password')} activeOpacity={0.7}>
                <Text style={[styles.authLink, { color: theme.primary }]}>Forgot password?</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/signup')} activeOpacity={0.7}>
                <Text style={[styles.authLink, { color: theme.primary }]}>Create account</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.helperText, { color: theme.textMuted }]}>
              Signing in with a phone number? Set your calling code with the picker below.
            </Text>

            <TouchableOpacity
              style={[
                styles.countryPicker,
                { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
              ]}
              onPress={() => setCountryPickerVisible(true)}
              activeOpacity={0.8}>
              <View style={styles.countryLeft}>
                <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                <View>
                  <Text style={[styles.countryName, { color: theme.text }]}>{selectedCountry.name}</Text>
                  <Text style={[styles.countryHint, { color: theme.textMuted }]}>Calling code for phone sign-in</Text>
                </View>
              </View>
              <View style={styles.countryRight}>
                <Text style={[styles.countryCode, { color: theme.primary }]}>{selectedCountry.code}</Text>
                <Ionicons name="chevron-down" size={16} color={theme.primary} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.textMuted }]}>or continue with</Text>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          </View>

          <View style={styles.socialStack}>
            <TouchableOpacity
              style={[
                styles.socialBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
                (isAppleChecking ||
                  !AppleAuthenticationModule ||
                  !isAppleAvailable ||
                  isAppleSigningIn) &&
                  styles.socialBtnDisabled,
              ]}
              onPress={handleAppleSignIn}
              disabled={isAppleChecking || !AppleAuthenticationModule || !isAppleAvailable || isAppleSigningIn}
              activeOpacity={0.84}>
              <View style={[styles.socialIcon, { backgroundColor: theme.primarySoft }]}>
                {isAppleSigningIn ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Ionicons name="logo-apple" size={18} color={theme.primary} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.socialTitle, { color: theme.text }]}>Continue with Apple</Text>
                <Text style={[styles.socialSubtitle, { color: theme.textSecondary }]}>
                  Use your Apple ID or iCloud account.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={[styles.benefitCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.benefitHeader}>
              <Ionicons name="sparkles-outline" size={16} color={theme.primary} />
              <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Why sign in</Text>
            </View>
            {BENEFITS.map((item) => (
              <BenefitRow key={item.title} icon={item.icon} title={item.title} body={item.body} theme={theme} />
            ))}
          </View>

          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            Sign-in helps keep your study experience consistent across devices.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={countryPickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCountryPickerVisible(false)}>
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCountryPickerVisible(false)} activeOpacity={0.8}>
              <Text style={[styles.modalAction, { color: theme.textSecondary }]}>Close</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select country</Text>
            <View style={{ width: 48 }} />
          </View>

          <FlatList
            data={COUNTRIES}
            keyExtractor={(item) => `${item.code}-${item.name}`}
            contentContainerStyle={styles.countryList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.countryRow,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => {
                  setSelectedCountry(item);
                  setCountryPickerVisible(false);
                }}
                activeOpacity={0.85}>
                <View style={styles.countryLeft}>
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <View>
                    <Text style={[styles.countryName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.countryHint, { color: theme.textMuted }]}>Calling code</Text>
                  </View>
                </View>
                <Text style={[styles.countryCode, { color: theme.primary }]}>{item.code}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 28,
    gap: 14,
  },
  glowTopRight: {
    position: 'absolute',
    top: -90,
    right: -90,
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
  logoWrap: {
    alignSelf: 'center',
    width: '100%',
    height: 164,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  heroLogo: {
    width: '100%',
    height: '100%',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 29,
    lineHeight: 35,
    fontFamily: 'Georgia',
    marginBottom: 8,
  },
  heroBody: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  heroChipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  formTitle: {
    fontSize: 20,
    fontFamily: 'Georgia',
    marginTop: 2,
  },
  formMark: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryPicker: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  countryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  countryFlag: {
    fontSize: 22,
  },
  countryName: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  countryHint: {
    fontSize: 11,
    fontWeight: '700',
  },
  countryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countryCode: {
    fontSize: 15,
    fontWeight: '900',
  },
  phoneCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  primaryBtn: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryBtnDisabled: {
    opacity: 0.55,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  passwordRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  passwordToggle: {
    position: 'absolute',
    right: 14,
    height: 40,
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  formErrorText: {
    flex: 1,
    color: '#C46A54',
    fontSize: 12.5,
    fontWeight: '600',
  },
  authLinksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  authLink: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontWeight: '800',
  },
  socialStack: {
    gap: 10,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  socialBtnDisabled: {
    opacity: 0.55,
  },
  socialIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 2,
  },
  socialSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  benefitCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  benefitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
  },
  benefitIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
  },
  benefitBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 10,
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
    fontSize: 18,
    fontFamily: 'Georgia',
  },
  modalAction: {
    fontSize: 15,
    fontWeight: '800',
  },
  countryList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  countryRow: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeModalSafe: {
    flex: 1,
  },
  codeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  codeCard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  codeTitle: {
    fontSize: 22,
    fontFamily: 'Georgia',
  },
  codeBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  codeInput: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 18,
    letterSpacing: 5,
    textAlign: 'center',
  },
});
