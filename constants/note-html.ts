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
 * The note, line for line as it was typed.
 *
 * An earlier version turned numbered lines into <ol>. That looked tidier and
 * was wrong: HTML renumbers an ordered list from one, so notes written 1, 2, 5
 * — or restarting at 1 under a new heading, which is how people actually write
 * down three points under each of four headings — came out renumbered. The
 * document has to match the note, so markers are now printed exactly as typed
 * and never regenerated.
 *
 * Leading indentation is kept too, and wrapped lines hang under the text
 * rather than under the marker, so a long point still reads as one point.
 */
function renderBody(text: string) {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.replace(/\s+$/, ''))
    .filter((block) => block.trim());

  if (blocks.length === 0) {
    return '<p class="empty">No notes were written for this one.</p>';
  }

  return blocks
    .map((block) => {
      const lines = block.split('\n').filter((line) => line.trim());

      const rendered = lines
        .map((line) => {
          const indent = (line.match(/^[ \t]*/)?.[0] ?? '')
            .replace(/\t/g, '    ').length;
          const body = line.trim();

          // The marker is captured and reprinted verbatim — never re-derived.
          const marker = body.match(/^(\d+[.)]|[a-zA-Z][.)]|[-–—•*·])\s+/);

          const nest = Math.floor(indent / 2) * 14;

          if (marker) {
            const rest = body.slice(marker[0].length);
            return `<div class="line marked" style="margin-left:${nest}px">
              <span class="marker">${escapeHtml(marker[1])}</span><span>${escapeHtml(rest)}</span>
            </div>`;
          }

          return `<div class="line" style="margin-left:${nest}px">${escapeHtml(body)}</div>`;
        })
        .join('');

      return `<div class="block">${rendered}</div>`;
    })
    .join('');
}

function formatDate(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Every detail that was filled in, whatever the note is tagged as.
 *
 * These used to be printed only for notes marked "sermon", so a study note
 * with a preacher recorded lost it on export — the reader was told less than
 * the writer knew. If a field has a value it was worth typing, so it is worth
 * printing.
 */
function metaRows(note: BackendNote) {
  const rows: [string, string][] = [];

  const add = (label: string, value?: string | null) => {
    if (value?.trim()) rows.push([label, value.trim()]);
  };

  add('Preacher', note.preacher);
  add('Church', note.church);
  add('Series', note.series);
  add('Preached', formatDate(note.sermonDate));
  add('Passage', note.reference);

  if (note.tags?.filter(Boolean).length) {
    add('Tags', note.tags.filter(Boolean).join(', '));
  }

  return rows;
}

export function noteToHtml(note: BackendNote) {
  const rows = metaRows(note);
  const isSermon = note.kind === 'sermon';
  const kindLabel = isSermon ? 'Sermon notes' : 'Study notes';

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

  h1 { font-size: 29px; line-height: 1.24; margin: 0 0 4px; font-weight: normal; color: ${INK}; }
  .rule { width: 46px; height: 3px; background: ${GOLD}; border-radius: 2px; margin: 16px 0 22px; }

  /* Details sit in a tinted block so the eye can skip them on a re-read. */
  .meta { background: ${CREAM}; border-radius: 10px; padding: 18px 22px; margin-bottom: 28px; }
  .meta table { width: 100%; border-collapse: collapse; }
  .meta td { padding: 5px 0; vertical-align: top; font-size: 12px; }
  .meta td.k {
    font-family: Helvetica, Arial, sans-serif; color: ${GOLD};
    width: 86px; letter-spacing: .6px; text-transform: uppercase; font-size: 9px;
    font-weight: bold; padding-top: 6px;
  }
  .meta td.v { color: ${INK}; font-size: 13.5px; }

  p { font-size: 14.5px; line-height: 1.8; color: ${BODY}; margin: 0 0 15px; max-width: 33em; }
  p.empty { color: ${MUTED}; font-style: italic; }

  /* Paragraphs of the note, separated as they were by blank lines. */
  .block { margin: 0 0 19px; max-width: 33em; }

  /* One typed line, printed as typed. Wrapped text hangs under the words
     rather than under the marker, so a long point still reads as one point. */
  .line { font-size: 14.5px; line-height: 1.8; color: ${BODY}; margin-bottom: 4px; }
  .line.marked { padding-left: 1.9em; text-indent: -1.9em; }
  .marker { color: ${GOLD}; font-weight: bold; display: inline-block;
            min-width: 1.9em; text-indent: 0; }


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
