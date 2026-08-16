import { ROOTED_MARK_DATA_URI } from '@/constants/rooted-mark';
import type { BackendNote } from '@/hooks/use-notes';

/**
 * A note as a printable document.
 *
 * Sermon notes get handed to other people — a small group, a spouse who missed
 * the service, a pastor who asked what landed. So this is designed to be read
 * by someone who was not there: the preacher, the passage and the date sit at
 * the top where they answer the first questions, and the writing gets a proper
 * measure instead of running the full width of the page.
 *
 * Kept apart from expo-print so the document can be rendered and inspected in
 * Node — a layout that only exists inside a native module is a layout nobody
 * checks until a user complains about it.
 */

const GREEN = '#2E6A5C';
const GREEN_DEEP = '#1C453A';
const GOLD = '#B08442';
const CREAM = '#F7F4ED';
const INK = '#16211C';
const BODY = '#46534B';
const MUTED = '#84908A';
const RULE = '#DDE5DF';

/** Anything the user typed goes through this before reaching the document. */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Blank lines become paragraphs; single newlines stay as line breaks. Lines
 * that open like a list keep their shape rather than being reflowed into prose,
 * because sermon notes are mostly lists.
 */
function renderBody(text: string) {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return '<p class="empty">No notes were written for this one.</p>';
  }

  return blocks
    .map((block) => {
      const lines = block.split('\n');
      const numbered = lines.every((line) => /^\s*\d+[.)]\s+/.test(line));
      const bulleted = lines.every((line) => /^\s*[-–—•*]\s+/.test(line));

      if (numbered || bulleted) {
        const items = lines
          .map((line) => line.replace(/^\s*(\d+[.)]|[-–—•*])\s+/, ''))
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join('');
        // Numbered points are usually the preacher's structure, and losing the
        // numbers loses the structure.
        return numbered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`;
      }

      return `<p>${escapeHtml(block).replace(/\n/g, '<br/>')}</p>`;
    })
    .join('');
}

function formatDate(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Only the parts that were actually filled in. */
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

  return rows;
}

export function noteToHtml(note: BackendNote) {
  const rows = metaRows(note);
  const isSermon = note.kind === 'sermon';
  const kindLabel = isSermon ? 'Sermon notes' : 'Study notes';
  const tags = note.tags?.filter(Boolean) ?? [];

  return `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  @page { margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; color: ${INK}; background: #FFFFFF;
         font-family: Georgia, 'Times New Roman', serif; }

  /* A band of colour at the top so the page is recognisable face down on a
     table, and so a printed stack has a spine of green down the edge. */
  .band { background: ${GREEN}; padding: 26px 52px 22px; color: #FFFFFF; }
  .brand { display: flex; align-items: center; }
  .brand .chip {
    background: #FFFFFF; border-radius: 9px; padding: 5px 7px; margin-right: 11px;
    display: inline-block; line-height: 0;
  }
  .brand img { width: 30px; height: 29px; }
  .brand .name { font-size: 19px; letter-spacing: .3px; }
  .brand .kind {
    margin-left: auto; font-family: Helvetica, Arial, sans-serif;
    font-size: 9px; font-weight: bold; letter-spacing: 1.8px; text-transform: uppercase;
    color: #FFFFFF; opacity: .85;
    border: 1px solid rgba(255,255,255,.45); border-radius: 20px; padding: 5px 12px;
  }

  .sheet { padding: 34px 52px 44px; }

  h1 { font-size: 27px; line-height: 1.24; margin: 0 0 4px; font-weight: normal; color: ${INK}; }
  .rule { width: 46px; height: 3px; background: ${GOLD}; border-radius: 2px; margin: 16px 0 22px; }

  /* Details sit in a tinted block so the eye can skip them on a re-read. */
  .meta { background: ${CREAM}; border-radius: 10px; padding: 16px 20px; margin-bottom: 26px; }
  .meta table { width: 100%; border-collapse: collapse; }
  .meta td { padding: 4px 0; vertical-align: top; font-size: 11.5px; }
  .meta td.k {
    font-family: Helvetica, Arial, sans-serif; color: ${GOLD};
    width: 86px; letter-spacing: .6px; text-transform: uppercase; font-size: 9px;
    font-weight: bold; padding-top: 6px;
  }
  .meta td.v { color: ${INK}; font-size: 12.5px; }

  p { font-size: 13px; line-height: 1.78; color: ${BODY}; margin: 0 0 14px; max-width: 34em; }
  p.empty { color: ${MUTED}; font-style: italic; }
  ul, ol { margin: 0 0 14px; padding-left: 20px; max-width: 34em; }
  ol li { padding-left: 3px; }
  li { font-size: 13px; line-height: 1.72; color: ${BODY}; margin-bottom: 7px; }
  li::marker { color: ${GOLD}; font-weight: bold; }

  .tags { margin-top: 26px; }
  .tag {
    display: inline-block; font-family: Helvetica, Arial, sans-serif;
    font-size: 9.5px; font-weight: bold; letter-spacing: .5px;
    color: ${GREEN_DEEP}; background: #E4EFE8;
    border-radius: 20px; padding: 5px 12px; margin: 0 6px 6px 0;
  }

  .foot {
    margin-top: 34px; padding-top: 13px; border-top: 1px solid ${RULE};
    font-family: Helvetica, Arial, sans-serif; font-size: 9px; color: ${MUTED};
    display: flex; align-items: center;
  }
  .foot .right { margin-left: auto; }
</style></head>
<body>
  <div class="band">
    <div class="brand">
      <span class="chip"><img src="${ROOTED_MARK_DATA_URI}" alt="" /></span>
      <span class="name">Rooted</span>
      <span class="kind">${kindLabel}</span>
    </div>
  </div>

  <div class="sheet">
    <h1>${escapeHtml(note.title?.trim() || 'Untitled note')}</h1>
    <div class="rule"></div>

    ${
      rows.length
        ? `<div class="meta"><table>${rows
            .map(
              ([key, value]) =>
                `<tr><td class="k">${escapeHtml(key)}</td><td class="v">${escapeHtml(value)}</td></tr>`,
            )
            .join('')}</table></div>`
        : ''
    }

    ${renderBody(note.content ?? '')}

    ${
      tags.length
        ? `<div class="tags">${tags
            .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
            .join('')}</div>`
        : ''
    }

    <div class="foot">
      <span>Written in Rooted</span>
      <span class="right">${escapeHtml(formatDate(note.updatedAt))}</span>
    </div>
  </div>
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
