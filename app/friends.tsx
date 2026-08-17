import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SignInRequired } from '@/components/sign-in-required';
import { APP_THEMES } from '@/constants/app-theme';
import { useThemeMode } from '@/context/theme-mode';
import { nudgedToday, useFriends, type Friend } from '@/hooks/use-friends';

/** How long ago, in the roughest terms that are still useful. */
function ago(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 2) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

export default function FriendsScreen() {
  const router = useRouter();
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;

  const {
    friends,
    requests,
    sent,
    nudges,
    isLoading,
    refresh,
    addFriend,
    accept,
    remove,
    nudge,
    markSeen,
    isSignedIn,
  } = useFriends();

  const [username, setUsername] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Opening the screen is reading them; no separate "mark read" to forget.
  useEffect(() => {
    void markSeen();
  }, [markSeen]);

  if (!isSignedIn) {
    return (
      <SignInRequired
        icon="people-outline"
        title="Sign in to add friends"
        body="Friends need an account on both sides, so you can see each other and send a reminder to read."
      />
    );
  }

  const handleAdd = async () => {
    const handle = username.trim().replace(/^@/, '');
    if (!handle) return;

    setIsAdding(true);
    try {
      const result = await addFriend(handle);
      setUsername('');
      Alert.alert(
        result?.status === 'accepted' ? 'You are now friends' : 'Request sent',
        result?.status === 'accepted'
          ? `${result.displayName} had already asked, so you are connected.`
          : `${result?.displayName ?? handle} will see your request next time they open Rooted.`,
      );
    } catch (error) {
      Alert.alert('Could not add', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleNudge = async (friend: Friend) => {
    setBusyId(friend.userId);
    try {
      await nudge(friend.userId);
      Alert.alert('Nudge sent', `${friend.displayName} will see it next time they open Rooted.`);
    } catch (error) {
      Alert.alert('Not sent', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmRemove = (friend: Friend) => {
    Alert.alert(`Remove ${friend.displayName}?`, 'You will both stop seeing each other here.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => remove(friend.friendshipId).catch(() => {}),
      },
    ]);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View pointerEvents="none" style={[styles.glow, { backgroundColor: theme.glow }]} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }>
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color={theme.textSecondary} />
          <Text style={[styles.backText, { color: theme.textSecondary }]}>Back</Text>
        </TouchableOpacity>

        <Text style={[styles.kicker, { color: theme.textMuted }]}>FRIENDS</Text>
        <Text style={[styles.title, { color: theme.text }]}>Read alongside people</Text>

        {/* Add by username */}
        <View style={[styles.addRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.at, { color: theme.textMuted }]}>@</Text>
          <TextInput
            style={[styles.addInput, { color: theme.text }]}
            value={username}
            onChangeText={setUsername}
            placeholder="their username"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity
            onPress={handleAdd}
            disabled={!username.trim() || isAdding}
            activeOpacity={0.8}
            style={[
              styles.addBtn,
              { backgroundColor: theme.primarySoft },
              (!username.trim() || isAdding) && styles.disabled,
            ]}>
            {isAdding ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text style={[styles.addBtnText, { color: theme.primary }]}>Add</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Nudges waiting for you */}
        {nudges.length ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Nudges for you</Text>
            {nudges.slice(0, 5).map((item) => (
              <View
                key={item.id}
                style={[styles.nudgeCard, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
                <Ionicons name="hand-left-outline" size={17} color={theme.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nudgeFrom, { color: theme.primary }]}>
                    {item.fromName} nudged you to read
                  </Text>
                  {item.message ? (
                    <Text style={[styles.nudgeMsg, { color: theme.text }]}>“{item.message}”</Text>
                  ) : null}
                  <Text style={[styles.nudgeWhen, { color: theme.textMuted }]}>
                    {ago(item.createdAt)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Requests waiting on you */}
        {requests.length ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Wants to connect</Text>
            {requests.map((friend) => (
              <View
                key={friend.friendshipId}
                style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
                  <Text style={[styles.avatarText, { color: theme.primary }]}>
                    {friend.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: theme.text }]}>{friend.displayName}</Text>
                  {friend.username ? (
                    <Text style={[styles.handle, { color: theme.textMuted }]}>@{friend.username}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => accept(friend.friendshipId).catch(() => {})}
                  style={[styles.smallBtn, { backgroundColor: theme.primary }]}
                  activeOpacity={0.85}>
                  <Text style={styles.smallBtnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => remove(friend.friendshipId).catch(() => {})}
                  hitSlop={8}
                  activeOpacity={0.7}>
                  <Ionicons name="close" size={19} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}

        {/* Friends */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Your friends{friends.length ? ` (${friends.length})` : ''}
          </Text>

          {isLoading && friends.length === 0 ? (
            <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
          ) : friends.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="people-outline" size={24} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No friends yet. Add someone by their username and you can remind each other to read.
              </Text>
            </View>
          ) : (
            friends.map((friend) => {
              const already = nudgedToday(friend);
              return (
                <View
                  key={friend.friendshipId}
                  style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
                    <Text style={[styles.avatarText, { color: theme.primary }]}>
                      {friend.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onLongPress={() => confirmRemove(friend)}
                    activeOpacity={0.9}>
                    <Text style={[styles.name, { color: theme.text }]}>{friend.displayName}</Text>
                    <Text style={[styles.handle, { color: theme.textMuted }]}>
                      {already ? 'Nudged today' : friend.username ? `@${friend.username}` : 'Friend'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleNudge(friend)}
                    disabled={already || busyId === friend.userId}
                    activeOpacity={0.85}
                    style={[
                      styles.nudgeBtn,
                      { backgroundColor: already ? theme.surfaceAlt : theme.primary },
                    ]}>
                    {busyId === friend.userId ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text
                        style={[
                          styles.nudgeBtnText,
                          { color: already ? theme.textMuted : '#FFFFFF' },
                        ]}>
                        {already ? 'Sent' : 'Nudge'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {/* Requests you have sent */}
        {sent.length ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Waiting on them</Text>
            {sent.map((friend) => (
              <View
                key={friend.friendshipId}
                style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.avatar, { backgroundColor: theme.surfaceAlt }]}>
                  <Text style={[styles.avatarText, { color: theme.textMuted }]}>
                    {friend.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: theme.textSecondary }]}>
                    {friend.displayName}
                  </Text>
                  <Text style={[styles.handle, { color: theme.textMuted }]}>Request sent</Text>
                </View>
                <TouchableOpacity
                  onPress={() => remove(friend.friendshipId).catch(() => {})}
                  hitSlop={8}
                  activeOpacity={0.7}>
                  <Text style={[styles.cancelText, { color: theme.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={[styles.footnote, { color: theme.textMuted }]}>
          You can nudge each friend once a day. They see it the next time they open Rooted.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 44 },
  glow: { position: 'absolute', top: -90, right: -90, width: 220, height: 220, borderRadius: 110 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backText: { fontSize: 14, fontWeight: '700' },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontSize: 27, fontFamily: 'Georgia', marginTop: 6, marginBottom: 18 },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 4,
  },
  at: { fontSize: 16, fontWeight: '700' },
  addInput: { flex: 1, fontSize: 15 },
  addBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999, minWidth: 62, alignItems: 'center' },
  addBtnText: { fontSize: 13.5, fontWeight: '800' },
  disabled: { opacity: 0.5 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 17, fontFamily: 'Georgia', marginBottom: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '800' },
  name: { fontSize: 15.5, fontWeight: '700' },
  handle: { fontSize: 12.5, marginTop: 2 },
  nudgeBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, minWidth: 74, alignItems: 'center' },
  nudgeBtnText: { fontSize: 13, fontWeight: '800' },
  smallBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  smallBtnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' },
  cancelText: { fontSize: 13, fontWeight: '700' },
  nudgeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  nudgeFrom: { fontSize: 14, fontWeight: '800' },
  nudgeMsg: { fontSize: 14, fontFamily: 'Georgia', marginTop: 4 },
  nudgeWhen: { fontSize: 11.5, marginTop: 4 },
  empty: { borderWidth: 1, borderRadius: 18, padding: 20, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 13.5, lineHeight: 20, textAlign: 'center' },
  footnote: { fontSize: 12, lineHeight: 18, marginTop: 24, textAlign: 'center' },
});
