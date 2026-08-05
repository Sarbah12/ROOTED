import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { NOTE_COLORS } from '@/constants/bible-study';
import { APP_THEMES } from '@/constants/app-theme';
import { useThemeMode } from '@/context/theme-mode';
import { useNotes, type BackendNote } from '@/hooks/use-notes';

type NoteForm = {
  title: string;
  reference: string;
  content: string;
  tags: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function StudyNotesScreen() {
  const { isDarkMode } = useThemeMode();
  const theme = isDarkMode ? APP_THEMES.dark : APP_THEMES.light;
  const { notes, isLoading, error, isSignedIn, refresh, createNote, updateNote, deleteNote } =
    useNotes();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<BackendNote | null>(null);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState<NoteForm>({
    title: '',
    reference: '',
    content: '',
    tags: '',
  });

  const openCreate = () => {
    setEditingNote(null);
    setSaveError(null);
    setForm({ title: '', reference: '', content: '', tags: '' });
    setModalVisible(true);
  };

  const openEdit = (note: BackendNote) => {
    setEditingNote(note);
    setSaveError(null);
    setForm({
      title: note.title,
      reference: note.reference,
      content: note.content,
      tags: note.tags.join(', '),
    });
    setModalVisible(true);
  };

  const saveNote = async () => {
    if (!form.title.trim()) {
      return;
    }

    const tags = form.tags
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);

    setIsSaving(true);
    setSaveError(null);

    try {
      if (editingNote) {
        await updateNote(editingNote.id, {
          title: form.title,
          reference: form.reference,
          content: form.content,
          tags,
        });
      } else {
        await createNote({
          title: form.title,
          reference: form.reference,
          content: form.content,
          tags,
          color: NOTE_COLORS[notes.length % NOTE_COLORS.length],
        });
      }
      setModalVisible(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteNote(id).catch((err) => {
      Alert.alert('Unable to delete note', err instanceof Error ? err.message : undefined);
    });
  };

  const filtered = notes.filter((note) => {
    const query = search.toLowerCase();
    return (
      note.title.toLowerCase().includes(query) ||
      note.reference.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query)
    );
  });

  if (isLoading && notes.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.centeredState}>
          <ActivityIndicator color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View pointerEvents="none" style={[styles.glowTopRight, { backgroundColor: theme.glow }]} />
      <View pointerEvents="none" style={[styles.glowBottomLeft, { backgroundColor: theme.glow }]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.kicker, { color: theme.textMuted }]}>Study Notes</Text>
            <Text style={[styles.title, { color: theme.text }]}>Capture what stands out</Text>
          </View>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={openCreate}
            activeOpacity={0.8}>
            <Ionicons name="add" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.heroCard, { backgroundColor: theme.primary }]}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>NOTES</Text>
            </View>
            <Text style={styles.heroMeta}>{filtered.length} saved</Text>
          </View>
          <Text style={styles.heroTitle}>Store sermon thoughts, verse insights, and reminders.</Text>
          <Text style={styles.heroBody}>
            Keep your study in one place with searchable notes, scripture references, and tags.
          </Text>
          <TouchableOpacity
            style={styles.heroButton}
            onPress={openCreate}
            activeOpacity={0.85}>
            <Text style={[styles.heroButtonText, { color: theme.primary }]}>New note</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={18} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search notes by title, verse, or content"
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.8}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {!isSignedIn ? (
          <View
            style={[styles.errorBanner, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <Ionicons name="phone-portrait-outline" size={16} color={theme.textSecondary} />
            <Text style={[styles.errorBannerText, { color: theme.textSecondary }]}>
              Saved on this device. Sign in to sync across devices.
            </Text>
          </View>
        ) : error ? (
          <TouchableOpacity
            onPress={refresh}
            style={[styles.errorBanner, { backgroundColor: theme.primarySoft, borderColor: theme.border }]}
            activeOpacity={0.8}>
            <Ionicons name="cloud-offline-outline" size={16} color={theme.primary} />
            <Text style={[styles.errorBannerText, { color: theme.text }]}>
              Saved on this device. Couldn&apos;t sync — tap to retry.
            </Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: theme.text }]}>Recent notes</Text>
          <Text style={[styles.sectionMeta, { color: theme.textMuted }]}>
            Tap a card to edit
          </Text>
        </View>

        {filtered.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="create-outline" size={28} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No notes yet</Text>
            <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
              Start with a new reflection, verse summary, or sermon takeaway.
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: theme.primary }]}
              onPress={openCreate}
              activeOpacity={0.85}>
              <Text style={styles.emptyButtonText}>Create note</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((note) => (
              <TouchableOpacity
                key={note.id}
                style={[styles.noteCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => openEdit(note)}
                activeOpacity={0.84}>
                <View style={[styles.noteAccent, { backgroundColor: note.color }]} />
                <View style={styles.noteContent}>
                  <View style={styles.noteTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.noteTitle, { color: theme.text }]} numberOfLines={1}>
                        {note.title}
                      </Text>
                      <Text style={[styles.noteRef, { color: theme.primary }]}>{note.reference}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(note.id)}
                      style={[styles.deleteBtn, { backgroundColor: theme.primarySoft }]}
                      activeOpacity={0.8}>
                      <Ionicons name="trash-outline" size={14} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.noteBody, { color: theme.textSecondary }]} numberOfLines={3}>
                    {note.content}
                  </Text>
                  <View style={styles.noteFooter}>
                    <View style={styles.tagRow}>
                      {note.tags.slice(0, 3).map((tag) => (
                        <View
                          key={tag}
                          style={[styles.tag, { backgroundColor: theme.chipBg }]}>
                          <Text style={[styles.tagText, { color: theme.chipText }]}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={[styles.noteDate, { color: theme.textMuted }]}>
                      {formatDate(note.updatedAt)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <SafeAreaView style={[styles.modalSafe, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.8}>
                <Text style={[styles.modalAction, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingNote ? 'Edit note' : 'New note'}
              </Text>
              <TouchableOpacity onPress={saveNote} activeOpacity={0.8} disabled={isSaving}>
                <Text style={[styles.modalAction, { color: theme.primary, opacity: isSaving ? 0.5 : 1 }]}>
                  {isSaving ? 'Saving…' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
              {saveError ? (
                <Text style={[styles.saveErrorText, { color: theme.text }]}>{saveError}</Text>
              ) : null}
              <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.formLabel, { color: theme.textMuted }]}>Title</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceSoft }]}
                  value={form.title}
                  onChangeText={(value) => setForm((current) => ({ ...current, title: value }))}
                  placeholder="Faith and works"
                  placeholderTextColor={theme.textMuted}
                />

                <Text style={[styles.formLabel, { color: theme.textMuted }]}>Scripture reference</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceSoft }]}
                  value={form.reference}
                  onChangeText={(value) =>
                    setForm((current) => ({ ...current, reference: value }))
                  }
                  placeholder="James 2:14-26"
                  placeholderTextColor={theme.textMuted}
                />

                <Text style={[styles.formLabel, { color: theme.textMuted }]}>Note</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    styles.formTextArea,
                    { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceSoft },
                  ]}
                  value={form.content}
                  onChangeText={(value) => setForm((current) => ({ ...current, content: value }))}
                  placeholder="Write your reflection here..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />

                <Text style={[styles.formLabel, { color: theme.textMuted }]}>Tags</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceSoft }]}
                  value={form.tags}
                  onChangeText={(value) => setForm((current) => ({ ...current, tags: value }))}
                  placeholder="Faith, Grace, Sermon"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              <View style={{ height: 28 }} />
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveErrorText: {
    marginHorizontal: 16,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
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
    bottom: 70,
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
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
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    borderRadius: 28,
    padding: 20,
    marginBottom: 14,
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
  heroMeta: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    fontFamily: 'Georgia',
    marginBottom: 8,
  },
  heroBody: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  heroButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 18,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 18,
    fontFamily: 'Georgia',
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 220,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Georgia',
  },
  emptyBody: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  emptyButton: {
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  list: {
    gap: 12,
  },
  noteCard: {
    borderWidth: 1,
    borderRadius: 24,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  noteAccent: {
    width: 5,
  },
  noteContent: {
    flex: 1,
    padding: 16,
  },
  noteTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  noteRef: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteBody: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  tagRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  noteDate: {
    fontSize: 11,
    fontWeight: '700',
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
    fontSize: 17,
    fontFamily: 'Georgia',
  },
  modalAction: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalScroll: {
    flex: 1,
  },
  formCard: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  formLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontWeight: '800',
    marginTop: 4,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  formTextArea: {
    minHeight: 160,
    paddingTop: 14,
    lineHeight: 22,
  },
});
