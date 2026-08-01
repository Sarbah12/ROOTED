import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_THEMES } from '@/constants/app-theme';
import { useFirebaseAuth } from '@/context/firebase-auth';
import { useThemeMode } from '@/context/theme-mode';

export default function SplashScreen() {
  const router = useRouter();
  const { isDarkMode } = useThemeMode();
  const { firebaseUser, isReady } = useFirebaseAuth();
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const haloScale = useRef(new Animated.Value(0.92)).current;
  const haloOpacity = useRef(new Animated.Value(0.2)).current;
  const rootsY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const entry = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 720,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.timing(rootsY, {
        toValue: 0,
        duration: 720,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const halo = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(haloScale, {
            toValue: 1.08,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(haloOpacity, {
            toValue: 0.36,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(haloScale, {
            toValue: 0.92,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(haloOpacity, {
            toValue: 0.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    entry.start();
    halo.start();

    const timer = setTimeout(() => {
      if (!isReady) {
        return;
      }

      router.replace(firebaseUser ? '/(tabs)' : '/login');
    }, 1800);

    return () => {
      clearTimeout(timer);
      halo.stop();
    };
  }, [firebaseUser, haloOpacity, haloScale, isReady, logoOpacity, logoScale, rootsY, router]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View pointerEvents="none" style={[styles.glowTopRight, { backgroundColor: theme.glow }]} />
      <View pointerEvents="none" style={[styles.glowBottomLeft, { backgroundColor: theme.glow }]} />

      <View style={styles.center}>
        <Animated.View
          style={[
            styles.halo,
            {
              borderColor: theme.primarySoft,
              opacity: haloOpacity,
              transform: [{ scale: haloScale }],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.logoShell,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}>
          <Image
            source={require('../assets/images/rooted-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={{ transform: [{ translateY: rootsY }], opacity: logoOpacity }}>
          <Text style={[styles.brand, { color: theme.text }]}>Rooted</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Growing deep in the Word
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  glowTopRight: {
    position: 'absolute',
    top: -110,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  glowBottomLeft: {
    position: 'absolute',
    left: -110,
    bottom: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  halo: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 1,
  },
  logoShell: {
    width: 180,
    height: 180,
    borderRadius: 54,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  logo: {
    width: 170,
    height: 170,
  },
  brand: {
    fontSize: 34,
    fontFamily: 'Georgia',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
});
