/**
 * Builds the Instagram launch carousel.
 *
 *   node marketing/instagram/build-carousel.mjs
 *
 * Renders one 1080x1350 PNG per slide via headless Chrome, so the type is real
 * type rather than something traced by hand, and the whole set can be rebuilt
 * after a copy change instead of re-edited.
 *
 * Colours are the app's own palette (app/(tabs)/index.tsx) and the gold is
 * lifted from the roots in the logo, so the post and the product look like the
 * same thing.
 */

import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const outDir = path.join(here, 'out');
const logo = path.join(root, 'assets', 'images', 'rooted-logo.png');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const W = 1080;
const H = 1350;

const C = {
  bg: '#F4F1EA',
  surface: '#FEFDF9',
  ink: '#16211C',
  body: '#5B6961',
  muted: '#7D8A83',
  green: '#2E6A5C',
  greenSoft: '#DCEAE3',
  gold: '#B08442',
  goldSoft: '#EFE2CC',
  border: '#D7E0DA',
};

/**
 * The logo file is mostly transparent margin, so the mark is cropped out of it
 * rather than shrunk with all that empty space attached.
 */
const MARK = `
.mark{
  --s:1;
  width:calc(105px * var(--s));
  height:calc(100px * var(--s));
  background-image:url('file://${logo}');
  background-repeat:no-repeat;
  background-size:calc(322.6px * var(--s)) calc(215px * var(--s));
  background-position:calc(-109.2px * var(--s)) calc(-51.5px * var(--s));
}`;

/** A card that fills the lower half, so no slide is type floating over a void. */
function panel(inner, pad = '38px 40px', extra = '') {
  return `<div style="
    background:${C.surface};border:1px solid ${C.border};border-radius:36px;
    padding:${pad};box-shadow:0 24px 56px rgba(22,33,28,.06);${extra}">${inner}</div>`;
}

/** 66 squares — the Old Testament in green, the New in gold. */
function booksGrid() {
  const squares = Array.from({ length: 66 }, (_, i) => {
    const nt = i >= 39;
    return `<span style="
      width:56px;height:56px;border-radius:14px;
      background:${nt ? C.goldSoft : C.greenSoft};
      border:1px solid ${nt ? 'rgba(176,132,66,.28)' : 'rgba(46,106,92,.18)'}"></span>`;
  }).join('');

  return panel(`
    <div style="display:flex;flex-wrap:wrap;gap:11px;width:715px">${squares}</div>
    <div style="display:flex;gap:34px;margin-top:34px;font-size:23px;font-weight:600;color:${C.body}">
      <span><b style="color:${C.green}">39</b> Old Testament</span>
      <span><b style="color:${C.gold}">27</b> New Testament</span>
      <span style="color:${C.muted}">1,189 chapters</span>
    </div>`);
}

/** Four consecutive days from the real rotation. */
function weekList() {
  const days = [
    ['MON', 'Psalm 34:7', 'The angel of the LORD encampeth round about them…'],
    ['TUE', 'Mark 12:30', 'And thou shalt love the Lord thy God with all thy heart…'],
    ['WED', 'Isaiah 50:4', 'The Lord GOD hath given me the tongue of the learned…'],
    ['THU', 'Colossians 3:1', 'If ye then be risen with Christ, seek those things which are above…'],
  ];

  return panel(
    days
      .map(
        ([day, ref, text], i) => `
      <div style="
        display:flex;align-items:center;gap:26px;padding:22px 0;
        ${i ? `border-top:1px solid ${C.border}` : ''}">
        <span style="
          width:74px;flex:none;font-size:19px;font-weight:800;letter-spacing:.12em;color:${C.gold}">
          ${day}
        </span>
        <span style="flex:none;width:250px;font-size:26px;font-weight:700;color:${C.green}">${ref}</span>
        <span style="
          flex:1;font-family:Georgia,serif;font-size:23px;color:${C.muted};
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${text}</span>
      </div>`,
      )
      .join(''),
    '24px 40px',
  );
}

/** Three people part-way through the same plan. */
function membersList() {
  const people = [
    ['A', 'Ama', 14, 21],
    ['K', 'Kwesi', 11, 21],
    ['N', 'Nana', 9, 21],
  ];

  return panel(`
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:26px">
      <span style="font-family:Georgia,serif;font-size:31px;color:${C.ink}">John in 21 days</span>
      <span style="font-size:21px;font-weight:800;letter-spacing:.14em;color:${C.gold}">CODE K4M2PQ</span>
    </div>
    ${people
      .map(
        ([initial, name, done, total]) => `
      <div style="display:flex;align-items:center;gap:20px;margin-top:20px">
        <span style="
          width:52px;height:52px;flex:none;border-radius:50%;background:${C.greenSoft};
          display:flex;align-items:center;justify-content:center;
          font-size:23px;font-weight:800;color:${C.green}">${initial}</span>
        <span style="width:112px;flex:none;font-size:25px;font-weight:700;color:${C.ink}">${name}</span>
        <span style="flex:1;height:12px;border-radius:99px;background:${C.bg};overflow:hidden">
          <span style="
            display:block;height:100%;border-radius:99px;background:${C.green};
            width:${Math.round((done / total) * 100)}%"></span>
        </span>
        <span style="width:132px;flex:none;text-align:right;font-size:21px;font-weight:700;color:${C.muted}">
          Day ${done} of ${total}
        </span>
      </div>`,
      )
      .join('')}`);
}

/** What is in the app, at a glance rather than one slide each. */
function overviewGrid() {
  const items = [
    ['Bible reader', 'All 66 books, offline'],
    ['Verse of the day', 'Never the same twice'],
    ['Study plans', 'Followed with others'],
    ['Notes & sermons', 'Preacher, passage, series'],
    ['Prayer list', 'Marked answered'],
    ['Quiz', 'By book or topic'],
  ];

  return `<div style="display:flex;flex-wrap:wrap;gap:18px">
    ${items
      .map(
        ([title, sub]) => `
      <div style="
        width:calc(50% - 9px);background:${C.surface};border:1px solid ${C.border};
        border-radius:26px;padding:28px 30px">
        <div style="font-family:Georgia,serif;font-size:29px;color:${C.ink};margin-bottom:9px">${title}</div>
        <div style="font-size:22px;color:${C.muted}">${sub}</div>
      </div>`,
      )
      .join('')}
  </div>`;
}

/** The commitments, each one something the app already does. */
function promiseList() {
  const promises = [
    'Reading the Bible stays free, with no account needed',
    'The whole Bible works with no signal at all',
    'Your progress is your real progress — never a placeholder',
    'Notes, prayers and highlights live on your device first',
  ];

  return panel(
    promises
      .map(
        (text, i) => `
      <div style="display:flex;align-items:flex-start;gap:22px;padding:24px 0;${
        i ? `border-top:1px solid ${C.border}` : ''
      }">
        <span style="
          width:34px;height:34px;flex:none;border-radius:50%;background:${C.greenSoft};
          display:flex;align-items:center;justify-content:center;
          font-size:19px;font-weight:800;color:${C.green}">✓</span>
        <span style="font-size:26px;line-height:1.42;color:${C.ink}">${text}</span>
      </div>`,
      )
      .join(''),
    '20px 40px',
  );
}

/**
 * An introduction, not a feature tour. The first post has to say who this is
 * and why it exists before it lists anything, so the arc runs: hello → where
 * the name comes from → the problem → what we made → what we promise → where
 * we are → come with us.
 */
const slides = [
  {
    kind: 'cover',
    kicker: 'Hello',
    display: 'We’re <em>Rooted</em>.',
    body: 'A new Bible study app — and this is the first thing we have ever posted. Here is what we are making, and why.',
  },
  {
    kind: 'verse',
    label: 'Where the name comes from',
    verse: 'Rooted and built up in him, and stablished in the faith, as ye have been taught, abounding therein with thanksgiving.',
    ref: 'Colossians 2:7',
    note: 'Roots do their work out of sight, slowly, long before anything shows above ground. That felt like the right picture for time spent in Scripture.',
  },
  {
    kind: 'feature',
    n: '01',
    label: 'Why we are building it',
    display: 'Most Bible plans<br>die in February.',
    body: 'Not for lack of wanting. You begin in January, miss four days in a row, open the app to a wall of red, and quietly stop. We have all done it.',
    visual: weekList,
  },
  {
    kind: 'feature',
    n: '02',
    label: 'What Rooted is',
    display: 'One place for<br>the whole habit.',
    body: 'Reading, the verse you wake up to, the plan you share with friends, Sunday’s notes, your prayer list — instead of four apps and a notebook.',
    visual: overviewGrid,
  },
  {
    kind: 'feature',
    n: '03',
    label: 'Made to be kept up with',
    display: 'Read with people,<br>not at them.',
    body: 'Start a plan, share the code, and move through it together. Missing a day does not wipe anything out — you pick it back up where you are.',
    visual: membersList,
  },
  {
    kind: 'feature',
    n: '04',
    label: 'What we promise',
    display: 'Four things<br>we will not<br>compromise on.',
    body: 'These are not plans for later. They are how the app is built today.',
    visual: promiseList,
  },
  {
    kind: 'feature',
    n: '05',
    label: 'Where we are',
    display: 'Being built,<br>in the open.',
    body: 'Rooted is in testing on iOS right now, with the Bible reader, the daily verse, plans, notes, prayers and quizzes all working. We will show the rest as it lands.',
    visual: booksGrid,
  },
  {
    kind: 'cta',
    kicker: 'Coming to iOS',
    display: 'Come with us.',
    body: 'Follow along and watch it grow. Reading stays free, with no account needed.',
  },
];

const base = `
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px}
body{
  background:${C.bg};
  color:${C.ink};
  font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased;
  position:relative;
  overflow:hidden;
}
.glow{position:absolute;border-radius:50%;pointer-events:none}
.glow.a{width:760px;height:760px;top:-320px;right:-260px;background:radial-gradient(circle,rgba(46,106,92,.16) 0%,rgba(46,106,92,0) 68%)}
.glow.b{width:640px;height:640px;bottom:-280px;left:-240px;background:radial-gradient(circle,rgba(176,132,66,.15) 0%,rgba(176,132,66,0) 68%)}
.frame{position:absolute;inset:0;padding:104px 96px 88px;display:flex;flex-direction:column}
${MARK}
.kicker{
  font-size:23px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:${C.gold};
}
.rule{width:64px;height:3px;background:${C.gold};border-radius:2px;margin:26px 0 0}
.display{
  font-family:Georgia,'Times New Roman',serif;
  font-size:88px;line-height:1.08;letter-spacing:-.015em;color:${C.ink};
}
.display em{font-style:italic;color:${C.green}}
.body{font-size:31px;line-height:1.56;color:${C.body};max-width:790px}
.spacer{flex:1}
.foot{display:flex;align-items:center;justify-content:space-between}
.footL{display:flex;align-items:center;gap:16px}
.wordmark{font-family:Georgia,serif;font-size:28px;letter-spacing:.02em;color:${C.green}}
.dots{display:flex;gap:9px}
.dot{width:9px;height:9px;border-radius:50%;background:${C.border}}
.dot.on{background:${C.green};width:26px;border-radius:99px}
.swipe{font-size:22px;font-weight:700;letter-spacing:.06em;color:${C.muted}}
`;

function dots(index) {
  return `<div class="dots">${slides
    .map((_, i) => `<span class="dot${i === index ? ' on' : ''}"></span>`)
    .join('')}</div>`;
}

function foot(index, right) {
  return `<div class="foot">
    <div class="footL"><div class="mark" style="--s:.42"></div><span class="wordmark">Rooted</span></div>
    ${right ?? dots(index)}
  </div>`;
}

function render(slide, index) {
  let inner = '';

  if (slide.kind === 'cover') {
    inner = `
      <div class="spacer"></div>
      <div class="mark" style="--s:1.5;margin-bottom:56px"></div>
      <div class="kicker">${slide.kicker}</div>
      <div class="rule" style="margin-bottom:44px"></div>
      <div class="display" style="font-size:104px">${slide.display}</div>
      <div class="body" style="margin-top:40px">${slide.body}</div>
      <div class="spacer"></div>
      ${foot(index, `<span class="swipe">SWIPE →</span>`)}`;
  } else if (slide.kind === 'cta') {
    inner = `
      <div class="spacer"></div>
      <div class="mark" style="--s:1.9;margin-bottom:60px"></div>
      <div class="kicker">${slide.kicker}</div>
      <div class="rule" style="margin-bottom:40px"></div>
      <div class="display" style="font-size:112px">${slide.display}</div>
      <div class="body" style="margin-top:36px">${slide.body}</div>
      <div class="spacer"></div>
      ${foot(index)}`;
  } else if (slide.kind === 'verse') {
    inner = `
      <div class="kicker">${slide.label}</div>
      <div class="rule"></div>
      <div class="spacer"></div>
      <div style="
        background:${C.surface};border:1px solid ${C.border};border-radius:44px;
        padding:76px 68px;box-shadow:0 30px 70px rgba(22,33,28,.07)">
        <div style="font-family:Georgia,serif;font-size:52px;line-height:1.36;color:${C.ink}">
          “${slide.verse}”
        </div>
        <div style="margin-top:36px;font-size:29px;font-weight:700;color:${C.green};letter-spacing:.02em">
          ${slide.ref}
        </div>
      </div>
      <div class="body" style="margin-top:48px;font-size:28px">${slide.note}</div>
      <div class="spacer"></div>
      ${foot(index)}`;
  } else {
    inner = `
      <div style="display:flex;align-items:baseline;gap:22px">
        <span style="font-family:Georgia,serif;font-size:34px;color:${C.gold}">${slide.n}</span>
        <span class="kicker">${slide.label}</span>
      </div>
      <div class="rule" style="margin-bottom:44px"></div>
      <div class="display" style="font-size:78px">${slide.display}</div>
      <div class="body" style="margin-top:32px;font-size:29px">${slide.body}</div>
      <div class="spacer"></div>
      <div style="margin-bottom:52px">${slide.visual()}</div>
      ${foot(index)}`;
  }

  return `<!doctype html><html><head><meta charset="utf-8"><style>${base}</style></head>
<body><div class="glow a"></div><div class="glow b"></div><div class="frame">${inner}</div></body></html>`;
}

async function main() {
  await mkdir(outDir, { recursive: true });

  for (const [index, slide] of slides.entries()) {
    const n = index + 1;
    const htmlPath = path.join(outDir, `slide-${n}.html`);
    const pngPath = path.join(outDir, `rooted-carousel-${n}.png`);

    await writeFile(htmlPath, render(slide, index), 'utf8');

    await run(CHROME, [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${W},${H}`,
      `--screenshot=${pngPath}`,
      `file://${htmlPath}`,
    ]);

    console.log(`slide ${n}  ${slide.kind.padEnd(8)}  ${path.basename(pngPath)}`);
  }

  console.log(`\n${slides.length} slides at ${W}x${H} in ${path.relative(root, outDir)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
