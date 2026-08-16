import * as Print from 'expo-print';
import { isAvailableAsync, shareAsync } from 'expo-sharing';

import { fileName, noteToHtml } from '@/constants/note-html';
import type { BackendNote } from '@/hooks/use-notes';

/**
 * Builds the PDF and opens the share sheet. Returns false when the device has
 * nowhere to share it, so the caller can say so rather than failing silently.
 */
export async function exportNoteToPdf(note: BackendNote): Promise<boolean> {
  const { uri } = await Print.printToFileAsync({ html: noteToHtml(note) });

  if (!(await isAvailableAsync())) return false;

  await shareAsync(uri, {
    UTI: '.pdf',
    mimeType: 'application/pdf',
    dialogTitle: fileName(note),
  });

  return true;
}
