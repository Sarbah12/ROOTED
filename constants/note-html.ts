import type { BackendNote } from '@/hooks/use-notes';

/**
 * A note as a printable HTML document.
 *
 * People keep sermon notes to give away — to a small group, a spouse who
 * missed the service, a pastor who asked for feedback. Until now the only way
 * out of the app was to select the text and copy it, which loses the preacher,
 * the passage and the date, which are the things that make a note findable a
 * year later.
 *
 * Kept apart from expo-print so the document can be rendered and inspected
 * in Node — a layout that only exists inside a native module is a layout
 * nobody checks until a user complains about it.
 */

const GREEN = '#2E6A5C';
const INK = '#16211C';
const BODY = '#4A574F';
const MUTED = '#7D8A83';
const RULE = '#D7E0DA';

/** Anything the user typed goes through this before reaching the document. */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Blank lines become paragraphs; single newlines stay as line breaks. */
function paragraphs(text: string) {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) return '<p class="empty">No notes were written.</p>';

  return blocks
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

function formatDate(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

/** The detail line under the title — only the parts that were filled in. */
function metaRows(note: BackendNote) {
  const rows: [string, string][] = [];

  if (note.kind === 'sermon') {
    if (note.preacher?.trim()) rows.push(['Preacher', note.preacher.trim()]);
    if (note.church?.trim()) rows.push(['Church', note.church.trim()]);
    if (note.series?.trim()) rows.push(['Series', note.series.trim()]);
    const preached = formatDate(note.sermonDate);
    if (preached) rows.push(['Preached', preached]);
  }

  if (note.reference?.trim()) rows.push(['Passage', note.reference.trim()]);
  if (note.tags?.length) rows.push(['Tags', note.tags.join(', ')]);

  return rows;
}

export function noteToHtml(note: BackendNote) {
  const rows = metaRows(note);
  const kindLabel = note.kind === 'sermon' ? 'Sermon notes' : 'Study notes';

  return `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  @page { margin: 56px 52px; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: ${INK}; margin: 0; }
  .kicker {
    font-family: Helvetica, Arial, sans-serif;
    font-size: 10px; font-weight: 700; letter-spacing: 1.6px;
    text-transform: uppercase; color: ${GREEN}; margin-bottom: 10px;
  }
  h1 { font-size: 26px; line-height: 1.25; margin: 0 0 18px; font-weight: normal; }
  table.meta { width: 100%; border-collapse: collapse; margin-bottom: 22px; }
  table.meta td { padding: 5px 0; vertical-align: top; font-size: 12px; }
  table.meta td.k {
    font-family: Helvetica, Arial, sans-serif; color: ${MUTED};
    width: 92px; letter-spacing: .4px;
  }
  table.meta td.v { color: ${INK}; font-weight: bold; }
  hr { border: 0; border-top: 1px solid ${RULE}; margin: 0 0 22px; }
  p { font-size: 13.5px; line-height: 1.72; color: ${BODY}; margin: 0 0 13px; }
  p.empty { color: ${MUTED}; font-style: italic; }
  .foot {
    margin-top: 30px; padding-top: 12px; border-top: 1px solid ${RULE};
    font-family: Helvetica, Arial, sans-serif; font-size: 9.5px; color: ${MUTED};
  }
</style></head>
<body>
  <div class="kicker">${kindLabel}</div>
  <h1>${escapeHtml(note.title?.trim() || 'Untitled note')}</h1>
  ${
    rows.length
      ? `<table class="meta">${rows
          .map(
            ([key, value]) =>
              `<tr><td class="k">${escapeHtml(key)}</td><td class="v">${escapeHtml(value)}</td></tr>`,
          )
          .join('')}</table>`
      : ''
  }
  <hr/>
  ${paragraphs(note.content ?? '')}
  <div class="foot">Saved from Rooted${
    note.updatedAt ? ` · ${escapeHtml(formatDate(note.updatedAt))}` : ''
  }</div>
</body></html>`;
}

/** A filename someone can find later, rather than note-1723.pdf. */
export function fileName(note: BackendNote) {
  const base = (note.title?.trim() || (note.kind === 'sermon' ? 'Sermon notes' : 'Study notes'))
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 48);
  return `${base || 'Rooted-note'}.pdf`;
}

