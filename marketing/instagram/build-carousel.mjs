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

/** A sermon note with the fields the app actually stores. */
function noteCard() {
  return panel(`
    <div style="display:flex;gap:12px;margin-bottom:24px">
      ${['SERMON', 'SUNDAY SERVICE']
        .map(
          (tag, i) => `<span style="
            background:${i ? C.bg : C.greenSoft};border-radius:99px;padding:11px 22px;
            font-size:19px;font-weight:800;letter-spacing:.08em;
            color:${i ? C.muted : C.green}">${tag}</span>`,
        )
        .join('')}
    </div>
    <div style="font-family:Georgia,serif;font-size:38px;color:${C.ink};margin-bottom:20px">
      Abiding, not striving
    </div>
    <div style="display:flex;gap:40px;margin-bottom:24px;font-size:23px;color:${C.body}">
      <span>Ps. <b style="color:${C.ink}">Daniel Mensah</b></span>
      <span>John 15:1–8</span>
    </div>
    <div style="
      border-left:4px solid ${C.gold};padding-left:24px;
      font-family:Georgia,serif;font-size:26px;line-height:1.5;color:${C.body}">
      “The branch does not strain to stay attached. It simply stays.”
    </div>`);
}

/** Prayer on the left, quiz on the right. */
function prayerQuiz() {
  return `<div style="display:flex;gap:22px">
    <div style="flex:1">${panel(
      `<div style="font-size:20px;font-weight:800;letter-spacing:.12em;color:${C.gold};margin-bottom:24px">PRAYER LIST</div>
       ${[
         ['Mum’s results', true],
         ['Job interview', true],
         ['Wisdom for the move', false],
       ]
         .map(
           ([text, done], i) => `
        <div style="display:flex;align-items:center;gap:16px;padding:16px 0;${
          i ? `border-top:1px solid ${C.border}` : ''
        }">
          <span style="
            width:30px;height:30px;flex:none;border-radius:50%;
            background:${done ? C.green : 'transparent'};border:2px solid ${done ? C.green : C.border};
            color:#fff;font-size:17px;font-weight:800;
            display:flex;align-items:center;justify-content:center">${done ? '✓' : ''}</span>
          <span style="font-size:23px;color:${done ? C.muted : C.ink};${
            done ? 'text-decoration:line-through' : ''
          }">${text}</span>
        </div>`,
         )
         .join('')}`,
      '32px 30px',
      'height:100%',
    )}</div>
    <div style="flex:1">${panel(
      `<div style="font-size:20px;font-weight:800;letter-spacing:.12em;color:${C.gold};margin-bottom:22px">QUIZ · JOHN</div>
       <div style="font-family:Georgia,serif;font-size:27px;line-height:1.4;color:${C.ink};margin-bottom:22px">
         Who said “I am the true vine”?
       </div>
       ${['Paul', 'Jesus', 'Isaiah']
         .map(
           (option, i) => `
        <div style="
          border:2px solid ${i === 1 ? C.green : C.border};
          background:${i === 1 ? C.greenSoft : 'transparent'};
          border-radius:16px;padding:16px 20px;margin-top:12px;
          font-size:23px;font-weight:${i === 1 ? 700 : 500};
          color:${i === 1 ? C.green : C.body}">${option}</div>`,
         )
         .join('')}`,
      '32px 30px',
      'height:100%',
    )}</div>
  </div>`;
}

const slides = [
  {
    kind: 'cover',
    kicker: 'A Bible study app',
    display: 'Scripture that actually<br><em>sticks</em>.',
    body: 'Built for people who keep starting over in January and stalling by February.',
  },
  {
    kind: 'feature',
    n: '01',
    label: 'Open to everyone',
    display: 'The whole Bible.<br>No account.',
    body: 'Sixty-six books and 31,100 verses are bundled into the app itself, so it opens with no signal and no sign-up.',
    visual: booksGrid,
  },
  {
    kind: 'feature',
    n: '02',
    label: 'Verse of the day',
    display: 'A different verse<br>every day for five<br>and a half years.',
    body: 'Most apps loop the same handful and you notice within a month. Rooted walks a pool of 2,011 and repeats none of them until it has shown you all.',
    visual: weekList,
  },
  {
    kind: 'verse',
    label: 'Today',
    verse: 'The angel of the LORD encampeth round about them that fear him, and delivereth them.',
    ref: 'Psalm 34:7',
  },
  {
    kind: 'feature',
    n: '03',
    label: 'Read together',
    display: 'Plans you finish,<br>because someone<br>is reading with you.',
    body: 'Start a plan, share the code, and watch everyone move through it together.',
    visual: membersList,
  },
  {
    kind: 'feature',
    n: '04',
    label: 'Notes & sermons',
    display: 'Sunday’s sermon,<br>still there on Thursday.',
    body: 'Keep the preacher, the passage and the series together. Highlight a verse while reading and it carries into a note with the reference attached.',
    visual: noteCard,
  },
  {
    kind: 'feature',
    n: '05',
    label: 'Prayer & quiz',
    display: 'Track what you pray.<br>Test what you learn.',
    body: 'Keep a prayer list and mark the answers as they come. Then quiz yourself on the book you have just studied.',
    visual: prayerQuiz,
  },
  {
    kind: 'cta',
    kicker: 'Coming to iOS',
    display: 'Get rooted.',
    body: 'Reading stays free, with no account needed.',
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
        <div style="font-family:Georgia,serif;font-size:60px;line-height:1.34;color:${C.ink}">
          “${slide.verse}”
        </div>
        <div style="margin-top:40px;font-size:29px;font-weight:700;color:${C.green};letter-spacing:.02em">
          ${slide.ref}
        </div>
      </div>
      <div class="body" style="margin-top:52px;font-size:29px">
        Tomorrow brings another. So does the day after that, for years.
      </div>
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
