import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_THEMES } from '@/constants/app-theme';
import { useThemeMode } from '@/context/theme-mode';
import { usePlan } from '@/hooks/use-plan';

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;

  const { plan, days, completedDays, members, isLoading, error, refresh, toggleDay, join, leave } =
    usePlan(id);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await join();
    } catch {
      Alert.alert('Could not join', 'Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = () => {
    Alert.alert('Leave this plan?', 'Your progress will be kept if you rejoin.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await leave();
            router.back();
          } catch {
            Alert.alert('Could not leave', 'Plan owners cannot leave their own plan.');
          }
        },
      },
    ]);
  };

  const handleShare = async () => {
    if (!plan?.joinCode) return;
    try {
      await Share.share({
        message: `Join me on "${plan.title}" in Rooted. Use code ${plan.joinCode}.`,
      });
    } catch {
      // Share sheet unavailable; the code is on screen anyway.
      Alert.alert('Invite code', plan.joinCode);
    }
  };

  if (isLoading && !plan) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={32} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Plan unavailable</Text>
          <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
            {error ?? 'This plan may be private, or the link is wrong.'}
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
            activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const done = completedDays.length;
  const ratio = plan.durationDays > 0 ? Math.min(1, done / plan.durationDays) : 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View pointerEvents="none" style={[styles.glow, { backgroundColor: theme.glow }]} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          {plan.isMember && plan.joinCode ? (
            <TouchableOpacity onPress={handleShare} activeOpacity={0.8} style={styles.backBtn}>
              <Ionicons name="share-outline" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={[styles.heroCard, { backgroundColor: theme.primary }]}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                {plan.visibility === 'public' ? 'PUBLIC PLAN' : 'STUDY PLAN'}
              </Text>
            </View>
            <Text style={styles.heroMeta}>
              {plan.memberCount} {plan.memberCount === 1 ? 'member' : 'members'}
            </Text>
          </View>

          <Text style={styles.heroTitle}>{plan.title}</Text>
          {plan.description ? <Text style={styles.heroBody}>{plan.description}</Text> : null}
          {plan.ownerName ? (
            <Text style={styles.heroOwner}>Created by {plan.ownerName}</Text>
          ) : null}

          {plan.isMember ? (
            <View style={styles.heroProgress}>
              <View style={styles.heroTrack}>
                <View style={[styles.heroFill, { width: `${ratio * 100}%` }]} />
              </View>
              <Text style={styles.heroProgressText}>
                {done} of {plan.durationDays} days complete
              </Text>
            </View>
          ) : null}
        </View>

        {!plan.isMember ? (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.primary }, isJoining && styles.disabled]}
            onPress={handleJoin}
            disabled={isJoining}
            activeOpacity={0.85}>
            {isJoining ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Join this plan</Text>
            )}
          </TouchableOpacity>
        ) : null}

        {plan.isMember && plan.joinCode ? (
          <TouchableOpacity
            style={[styles.codeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handleShare}
            activeOpacity={0.85}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.codeLabel, { color: theme.textMuted }]}>Invite code</Text>
              <Text style={[styles.codeValue, { color: theme.text }]}>{plan.joinCode}</Text>
            </View>
            <Ionicons name="share-outline" size={18} color={theme.primary} />
          </TouchableOpacity>
        ) : null}

        <Text style={[styles.sectionLabel, { color: theme.text }]}>Daily readings</Text>
        <View style={styles.dayList}>
          {days.map((day) => {
            const isDone = completedDays.includes(day.day);

            return (
              <View
                key={day.day}
                style={[
                  styles.dayRow,
                  {
                    backgroundColor: theme.surface,
                    borderColor: isDone ? theme.primary : theme.border,
                  },
                ]}>
                <TouchableOpacity
                  onPress={() => plan.isMember && toggleDay(day.day)}
                  disabled={!plan.isMember}
                  activeOpacity={0.7}
                  style={[
                    styles.check,
                    {
                      backgroundColor: isDone ? theme.primary : 'transparent',
                      borderColor: isDone ? theme.primary : theme.border,
                    },
                  ]}>
                  {isDone ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => plan.isMember && router.push(`/plans/${plan.id}/day/${day.day}`)}
                  disabled={!plan.isMember}
                  activeOpacity={0.7}>
                  <Text style={[styles.dayNumber, { color: theme.textMuted }]}>Day {day.day}</Text>
                  <Text style={[styles.dayRef, { color: theme.text }]}>{day.reference}</Text>
                  {day.prompt ? (
                    <Text style={[styles.dayPrompt, { color: theme.textSecondary }]} numberOfLines={1}>
                      {day.prompt}
                    </Text>
                  ) : null}
                </TouchableOpacity>

                {plan.isMember ? (
                  <Ionicons name="chevron-forward" size={17} color={theme.textMuted} />
                ) : null}
              </View>
            );
          })}
        </View>

        {members.length > 0 ? (
          <>
            <Text style={[styles.sectionLabel, { color: theme.text }]}>Who&apos;s reading</Text>
            <View style={[styles.memberCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {members.map((member, index) => {
                const memberRatio =
                  plan.durationDays > 0 ? Math.min(1, member.daysDone / plan.durationDays) : 0;

                return (
                  <View
                    key={member.userId}
                    style={[
                      styles.memberRow,
                      index > 0 && { borderTopWidth: 1, borderTopColor: theme.border },
                    ]}>
                    <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
                      <Text style={[styles.avatarText, { color: theme.primary }]}>
                        {member.displayName.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.memberName, { color: theme.text }]}>
                        {member.displayName}
                        {member.role === 'owner' ? ' · owner' : ''}
                      </Text>
                      <View style={[styles.memberTrack, { backgroundColor: theme.surfaceAlt }]}>
                        <View
                          style={[
                            styles.memberFill,
                            { width: `${memberRatio * 100}%`, backgroundColor: theme.primary },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={[styles.memberDays, { color: theme.textMuted }]}>
                      {member.daysDone}/{plan.durationDays}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        ) : null}

        {plan.isMember ? (
          <TouchableOpacity onPress={handleLeave} activeOpacity={0.7} style={styles.leaveBtn}>
            <Text style={[styles.leaveText, { color: theme.textMuted }]}>Leave this plan</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  glow: { position: 'absolute', top: -90, right: -90, width: 220, height: 220, borderRadius: 110 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  backBtn: { padding: 4 },
  heroCard: { borderRadius: 28, padding: 20, marginBottom: 14 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  heroBadgeText: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2 },
  heroMeta: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '700' },
  heroTitle: { color: '#FFFFFF', fontSize: 26, lineHeight: 32, fontFamily: 'Georgia', marginBottom: 8 },
  heroBody: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 21 },
  heroOwner: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '600', marginTop: 8 },
  heroProgress: { marginTop: 16, gap: 6 },
  heroTrack: { height: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' },
  heroFill: { height: '100%', borderRadius: 999, backgroundColor: '#FFFFFF' },
  heroProgressText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '700' },
  codeCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 4 },
  codeLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  codeValue: { fontSize: 20, fontWeight: '800', letterSpacing: 3, marginTop: 2 },
  sectionLabel: { fontSize: 17, fontFamily: 'Georgia', marginTop: 22, marginBottom: 10 },
  dayList: { gap: 8 },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14 },
  check: { width: 26, height: 26, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dayNumber: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  dayRef: { fontSize: 15.5, fontWeight: '700', marginTop: 2 },
  dayPrompt: { fontSize: 12.5, marginTop: 3 },
  memberCard: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  avatar: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '800' },
  memberName: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  memberTrack: { height: 5, borderRadius: 999, overflow: 'hidden' },
  memberFill: { height: '100%', borderRadius: 999 },
  memberDays: { fontSize: 12, fontWeight: '800' },
  primaryBtn: { borderRadius: 999, paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  disabled: { opacity: 0.7 },
  leaveBtn: { marginTop: 26, alignItems: 'center' },
  leaveText: { fontSize: 13.5, fontWeight: '700' },
  emptyTitle: { fontSize: 19, fontFamily: 'Georgia' },
  emptyBody: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
