import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_THEMES } from '@/constants/app-theme';
import { useFirebaseAuth } from '@/context/firebase-auth';
import { useAppSettings } from '@/context/app-settings';

const REMINDER_TIMES = ['7:00 AM', '12:30 PM', '8:00 PM'] as const;
const FONT_SIZES = [
  { label: 'Small', value: 'S' },
  { label: 'Default', value: 'A' },
  { label: 'Large', value: 'A+' },
] as const;

const ACCOUNT_ROWS = [
  { label: 'Phone number', value: 'Add a number', icon: 'call-outline' },
  { label: 'Apple ID / iCloud', value: 'Connect', icon: 'logo-apple' },
] as const;

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useAppSettings();
  const { signOut } = useFirebaseAuth();

  const isDarkMode = settings.darkMode;
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;

  // Every toggle writes straight through to storage, so choices survive a
  // restart instead of resetting to these defaults.
  const setIsDarkMode = (value: boolean) => updateSettings({ darkMode: value });
  const remindersEnabled = settings.remindersEnabled;
  const setRemindersEnabled = (value: boolean) => updateSettings({ remindersEnabled: value });
  const verseNotificationsEnabled = settings.verseNotificationsEnabled;
  const setVerseNotificationsEnabled = (value: boolean) =>
    updateSettings({ verseNotificationsEnabled: value });
  const streakBadgeEnabled = settings.streakBadgeEnabled;
  const setStreakBadgeEnabled = (value: boolean) => updateSettings({ streakBadgeEnabled: value });
  const selectedReminderTime = settings.reminderTime as (typeof REMINDER_TIMES)[number];
  const setSelectedReminderTime = (value: (typeof REMINDER_TIMES)[number]) =>
    updateSettings({ reminderTime: value });
  const selectedFontSize = settings.fontSize as (typeof FONT_SIZES)[number]['label'];
  const setSelectedFontSize = (value: (typeof FONT_SIZES)[number]['label']) =>
    updateSettings({ fontSize: value });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View pointerEvents="none" style={[styles.glowTopRight, { backgroundColor: theme.glow }]} />
      <View pointerEvents="none" style={[styles.glowBottomLeft, { backgroundColor: theme.glow }]} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => router.back()}
            activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={18} color={theme.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: theme.textMuted }]}>Rooted settings</Text>
            <Text style={[styles.title, { color: theme.text }]}>Your personal control center</Text>
          </View>
          <View style={styles.spacer} />
        </View>

        <View style={[styles.heroCard, { backgroundColor: theme.primary }]}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>ACCOUNT</Text>
            </View>
            <View style={[styles.heroMark, { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
              <Image
                source={require('../assets/images/rooted-logo.png')}
                style={styles.heroLogo}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.heroTitleText}>Personalize how Rooted looks and feels.</Text>
          <Text style={styles.heroBody}>
            Adjust the theme, reading preferences, reminders, and account options to fit your
            rhythm.
          </Text>
          <View style={styles.heroChipRow}>
            <View style={styles.heroChip}>
              <Ionicons name="moon-outline" size={12} color="#FFFFFF" />
              <Text style={styles.heroChipText}>Dark mode</Text>
            </View>
            <View style={styles.heroChip}>
              <Ionicons name="notifications-outline" size={12} color="#FFFFFF" />
              <Text style={styles.heroChipText}>Reminders</Text>
            </View>
            <View style={styles.heroChip}>
              <Ionicons name="text-outline" size={12} color="#FFFFFF" />
              <Text style={styles.heroChipText}>Reading text</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.text }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={styles.rowCopy}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>Dark mode</Text>
              <Text style={[styles.rowBody, { color: theme.textSecondary }]}>
                Switch the app into a darker reading environment.
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: theme.border, true: theme.primarySoft }}
              thumbColor={isDarkMode ? theme.primary : '#FFFFFF'}
              ios_backgroundColor={theme.border}
            />
          </View>

          <View style={styles.divider} />

          <View>
            <Text style={[styles.subSectionLabel, { color: theme.textMuted }]}>Reading text size</Text>
            <View style={styles.pillRow}>
              {FONT_SIZES.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: selectedFontSize === item.label ? theme.primarySoft : theme.surfaceSoft,
                      borderColor: selectedFontSize === item.label ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedFontSize(item.label)}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.pillText,
                      { color: selectedFontSize === item.label ? theme.primary : theme.textSecondary },
                    ]}>
                    {item.value}
                  </Text>
                  <Text
                    style={[
                      styles.pillLabel,
                      { color: selectedFontSize === item.label ? theme.primary : theme.textSecondary },
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.text }]}>Notifications</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {[
            {
              title: 'Daily reminders',
              body: 'Get a gentle reminder to read and pray each day.',
              value: remindersEnabled,
              setter: setRemindersEnabled,
            },
            {
              title: 'Verse notifications',
              body: 'Receive the verse of the day as a lock-screen friendly nudge.',
              value: verseNotificationsEnabled,
              setter: setVerseNotificationsEnabled,
            },
            {
              title: 'Study streak badge',
              body: 'Celebrate progress as you keep your reading rhythm going.',
              value: streakBadgeEnabled,
              setter: setStreakBadgeEnabled,
            },
          ].map((item, index) => (
            <View
              key={item.title}
              style={[styles.preferenceRow, index < 2 && styles.preferenceDivider]}>
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.rowBody, { color: theme.textSecondary }]}>{item.body}</Text>
              </View>
              <Switch
                value={item.value}
                onValueChange={item.setter}
                trackColor={{ false: theme.border, true: theme.primarySoft }}
                thumbColor={item.value ? theme.primary : '#FFFFFF'}
                ios_backgroundColor={theme.border}
              />
            </View>
          ))}

          <View style={styles.divider} />

          <View>
            <Text style={[styles.subSectionLabel, { color: theme.textMuted }]}>Reminder time</Text>
            <View style={styles.pillRow}>
              {REMINDER_TIMES.map((time) => (
                <TouchableOpacity
                  key={time}
                  onPress={() => setSelectedReminderTime(time)}
                  style={[
                    styles.timeChip,
                    {
                      backgroundColor:
                        selectedReminderTime === time ? theme.chipBg : theme.surfaceSoft,
                      borderColor: selectedReminderTime === time ? theme.primary : theme.border,
                    },
                  ]}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.timeChipText,
                      {
                        color: selectedReminderTime === time ? theme.primary : theme.textSecondary,
                      },
                    ]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.text }]}>Account</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {ACCOUNT_ROWS.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.accountRow, index < ACCOUNT_ROWS.length - 1 && styles.preferenceDivider]}
              activeOpacity={0.8}>
              <View style={styles.accountLeft}>
                <View style={[styles.accountIcon, { backgroundColor: theme.primarySoft }]}>
                  <Ionicons name={item.icon} size={14} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>{item.label}</Text>
                  <Text style={[styles.rowBody, { color: theme.textSecondary }]}>{item.value}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.signOutBtn, { borderColor: theme.border }]}
          activeOpacity={0.8}
          onPress={async () => {
            await signOut();
            router.replace('/login');
          }}>
          <Ionicons name="log-out-outline" size={16} color="#C46A54" />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <Text style={[styles.footerText, { color: theme.textMuted }]}>
          Changes here shape how Rooted feels every time you open the app.
        </Text>

        <View style={{ height: 24 }} />
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
    paddingTop: 12,
    paddingBottom: 32,
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
    bottom: 80,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  spacer: {
    width: 42,
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
  heroMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroLogo: {
    width: 36,
    height: 36,
  },
  heroTitleText: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
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
  sectionLabel: {
    fontSize: 18,
    fontFamily: 'Georgia',
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  rowBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(125, 138, 131, 0.18)',
  },
  subSectionLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontWeight: '800',
    marginBottom: 10,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pillText: {
    fontSize: 16,
    fontWeight: '900',
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  timeChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timeChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 2,
  },
  preferenceDivider: {
    paddingBottom: 14,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(125, 138, 131, 0.18)',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 2,
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  accountIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F7EEE9',
  },
  signOutText: {
    color: '#C46A54',
    fontWeight: '800',
    fontSize: 14,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 8,
    marginTop: 16,
  },
});
