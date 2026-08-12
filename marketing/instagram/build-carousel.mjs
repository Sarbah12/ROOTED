/**
 * Builds the Instagram introduction carousel.
 *
 *   node marketing/instagram/build-carousel.mjs
 *
 * Renders one 1080x1350 PNG per slide through headless Chrome, so a copy
 * change is a re-run rather than an afternoon in a design tool.
 *
 * Style: bold colour-blocked slides alternating with light ones, heavy
 * geometric headlines with the key word highlighted, and the product itself
 * carried in device frames with real app UI inside. The screens are built from
 * the app's own palette and real content — the verse on the phone is a verse
 * the rotation actually serves.
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
  green: '#2E6A5C',
  greenDeep: '#1C453A',
  greenSoft: '#DCEAE3',
  cream: '#F4F1EA',
  white: '#FEFDF9',
  ink: '#16211C',
  body: '#5B6961',
  muted: '#7D8A83',
  gold: '#B08442',
  goldBright: '#F2C879',
  border: '#D7E0DA',
};

const FONT = "'Avenir Next','Helvetica Neue',Helvetica,Arial,sans-serif";

/** The logo file is mostly transparent margin, so the mark is cropped out. */
const MARK = `
.mark{
  --s:1;
  width:calc(105px * var(--s));
  height:calc(100px * var(--s));
  background-image:url('file://${logo}');
  background-repeat:no-repeat;
  background-size:calc(322.6px * var(--s)) calc(215px * var(--s));
  background-position:calc(-109.2px * var(--s)) calc(-51.5px * var(--s));
  flex:none;
  display:block;
}
/* On the dark slides the green mark disappears, so it sits on a light chip. */
.markChip{
  background:${C.white};border-radius:22px;padding:10px 14px;display:inline-flex;
}`;

// ------------------------------------------------------------------ device

/** A phone, drawn rather than photographed, with real UI inside. */
function phone(screen, { w = 440, rotate = 0, x = 0, y = 0 } = {}) {
  const h = Math.round(w * 2.03);
  return `<div style="
    width:${w}px;height:${h}px;flex:none;position:relative;
    transform:translate(${x}px,${y}px) rotate(${rotate}deg);
    border-radius:${Math.round(w * 0.115)}px;
    background:linear-gradient(160deg,#2A3630,#101815);
    padding:11px;box-shadow:0 40px 90px rgba(12,18,16,.38);">
    <div style="
      width:100%;height:100%;border-radius:${Math.round(w * 0.095)}px;
      background:${C.cream};overflow:hidden;position:relative">
      <div style="
        position:absolute;top:14px;left:50%;transform:translateX(-50%);
        width:${Math.round(w * 0.3)}px;height:${Math.round(w * 0.075)}px;
        background:#101815;border-radius:99px;z-index:5"></div>
      ${screen}
    </div>
  </div>`;
}

/** Home: the greeting and the verse of the day, as the app lays it out. */
function homeScreen() {
  return `<div style="padding:62px 26px 0;font-family:${FONT}">
    <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:700;color:${C.ink};padding:0 6px 18px">
      <span>9:41</span><span>▮▮▮ ᯤ ▰</span>
    </div>
    <div style="display:flex;align-items:center;gap:11px;margin-bottom:22px">
      <div class="mark" style="--s:.33"></div>
      <div>
        <div style="font-size:11px;font-weight:800;letter-spacing:.14em;color:${C.muted}">ROOTED</div>
        <div style="font-size:18px;font-weight:700;color:${C.ink}">Welcome back, Ama</div>
      </div>
    </div>
    <div style="background:${C.green};border-radius:28px;padding:26px 24px;color:#fff">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
        <span style="background:rgba(255,255,255,.2);border-radius:99px;padding:6px 13px;font-size:11px;font-weight:800;letter-spacing:.1em">TODAY</span>
        <span style="font-size:12px;opacity:.85;font-weight:600">12 Aug</span>
      </div>
      <div style="font-family:Georgia,serif;font-size:22px;line-height:1.4">
        “The angel of the LORD encampeth round about them that fear him.”
      </div>
      <div style="margin-top:16px;font-size:14px;font-weight:800;opacity:.9">Psalm 34:7</div>
    </div>
    <div style="display:flex;gap:12px;margin-top:16px">
      ${[
        ['Streak', '14 days'],
        ['Plan', 'Day 14/21'],
      ]
        .map(
          ([label, value]) => `
        <div style="flex:1;background:${C.white};border:1px solid ${C.border};border-radius:20px;padding:16px">
          <div style="font-size:11px;font-weight:800;letter-spacing:.1em;color:${C.muted}">${label.toUpperCase()}</div>
          <div style="font-size:19px;font-weight:800;color:${C.ink};margin-top:5px">${value}</div>
        </div>`,
        )
        .join('')}
    </div>
    <div style="margin-top:16px;background:${C.white};border:1px solid ${C.border};border-radius:20px;padding:16px">
      <div style="font-size:11px;font-weight:800;letter-spacing:.1em;color:${C.muted}">CONTINUE READING</div>
      <div style="font-size:18px;font-weight:700;color:${C.ink};margin-top:6px">John 3</div>
      <div style="height:7px;background:${C.cream};border-radius:99px;margin-top:12px;overflow:hidden">
        <div style="width:62%;height:100%;background:${C.green};border-radius:99px"></div>
      </div>
    </div>
  </div>`;
}

/** Reader: John 3 with verse 16 highlighted, as marking actually looks. */
function readerScreen() {
  const verses = [
    [14, 'And as Moses lifted up the serpent in the wilderness, even so must the Son of man be lifted up:'],
    [15, 'That whosoever believeth in him should not perish, but have eternal life.'],
    [16, 'For God so loved the world, that he gave his only begotten Son…'],
    [17, 'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.'],
  ];

  return `<div style="padding:62px 26px 0;font-family:${FONT}">
    <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:700;color:${C.ink};padding:0 6px 20px">
      <span>9:41</span><span>▮▮▮ ᯤ ▰</span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <span style="font-family:Georgia,serif;font-size:27px;color:${C.ink}">John 3</span>
      <span style="background:${C.greenSoft};color:${C.green};border-radius:99px;padding:7px 15px;font-size:12px;font-weight:800">KJV</span>
    </div>
    ${verses
      .map(
        ([n, text]) => `
      <div style="
        display:flex;gap:10px;margin-bottom:15px;padding:${n === 16 ? '11px 12px' : '0'};
        ${n === 16 ? `background:${C.goldBright}55;border-radius:14px;` : ''}">
        <span style="font-size:12px;font-weight:800;color:${C.gold};flex:none;padding-top:4px">${n}</span>
        <span style="font-family:Georgia,serif;font-size:16px;line-height:1.55;color:${C.ink}">${text}</span>
      </div>`,
      )
      .join('')}
    <div style="
      position:absolute;left:26px;right:26px;bottom:26px;background:${C.ink};border-radius:22px;
      padding:15px 18px;display:flex;gap:20px;justify-content:space-around">
      ${['Highlight', 'Note', 'Share'].map(
        (a) => `<span style="color:#fff;font-size:13px;font-weight:700">${a}</span>`,
      ).join('')}
    </div>
  </div>`;
}

// ------------------------------------------------------------- float cards

/** The floating stat chips that overlap the device. */
function chip({ icon, value, label, x, y, rotate = 0 }) {
  return `<div style="
    position:absolute;left:${x}px;top:${y}px;transform:rotate(${rotate}deg);
    background:${C.white};border-radius:22px;padding:16px 22px;
    display:flex;align-items:center;gap:14px;
    box-shadow:0 22px 48px rgba(12,18,16,.22);white-space:nowrap;z-index:4">
    <span style="
      width:44px;height:44px;flex:none;border-radius:14px;background:${C.greenSoft};
      display:flex;align-items:center;justify-content:center;font-size:21px">${icon}</span>
    <span>
      <span style="display:block;font-size:26px;font-weight:800;color:${C.ink};line-height:1.1">${value}</span>
      <span style="display:block;font-size:15px;font-weight:600;color:${C.muted}">${label}</span>
    </span>
  </div>`;
}

/** Three people part-way through the same plan. */
function planCard(x, y, w = 700) {
  const people = [
    ['A', 'Ama', 14],
    ['K', 'Kwesi', 11],
    ['N', 'Nana', 9],
  ];

  return `<div style="
    position:absolute;left:${x}px;top:${y}px;width:${w}px;
    background:${C.white};border-radius:32px;padding:32px 34px;
    box-shadow:0 30px 66px rgba(12,18,16,.2);z-index:4">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:22px">
      <span style="font-family:Georgia,serif;font-size:27px;color:${C.ink}">John in 21 days</span>
      <span style="font-size:16px;font-weight:800;letter-spacing:.12em;color:${C.gold}">K4M2PQ</span>
    </div>
    ${people
      .map(
        ([initial, name, done]) => `
      <div style="display:flex;align-items:center;gap:16px;margin-top:16px">
        <span style="
          width:44px;height:44px;flex:none;border-radius:50%;background:${C.greenSoft};
          display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:800;color:${C.green}">${initial}</span>
        <span style="width:82px;flex:none;font-size:19px;font-weight:700;color:${C.ink}">${name}</span>
        <span style="flex:1;height:10px;border-radius:99px;background:${C.cream};overflow:hidden">
          <span style="display:block;height:100%;background:${C.green};width:${Math.round((done / 21) * 100)}%"></span>
        </span>
        <span style="width:96px;flex:none;text-align:right;font-size:16px;font-weight:700;color:${C.muted}">Day ${done}</span>
      </div>`,
      )
      .join('')}
  </div>`;
}

/** Six tiles: the shape of the app without a slide each. */
function tiles(dark) {
  const items = [
    ['📖', 'Bible reader', 'All 66 books, offline'],
    ['🌱', 'Verse of the day', 'Never the same twice'],
    ['👥', 'Study plans', 'Followed with others'],
    ['✍️', 'Notes & sermons', 'Preacher, passage, series'],
    ['🙏', 'Prayer list', 'Marked answered'],
    ['🎯', 'Quiz', 'By book or topic'],
  ];

  return `<div style="display:flex;flex-wrap:wrap;gap:16px">
    ${items
      .map(
        ([icon, title, sub]) => `
      <div style="
        width:calc(50% - 8px);border-radius:26px;padding:24px 26px;
        background:${dark ? 'rgba(255,255,255,.1)' : C.white};
        border:1px solid ${dark ? 'rgba(255,255,255,.16)' : C.border}">
        <div style="font-size:26px;margin-bottom:10px">${icon}</div>
        <div style="font-size:25px;font-weight:800;color:${dark ? '#fff' : C.ink};margin-bottom:5px">${title}</div>
        <div style="font-size:18px;font-weight:600;color:${dark ? 'rgba(255,255,255,.66)' : C.muted}">${sub}</div>
      </div>`,
      )
      .join('')}
  </div>`;
}

/** Four commitments, each one behaviour the app already has. */
function promises(dark) {
  const items = [
    'Reading the Bible stays free, no account needed',
    'The whole Bible works with no signal at all',
    'Your progress is real progress, never a placeholder',
    'Notes and prayers live on your device first',
  ];

  return `<div>
    ${items
      .map(
        (text) => `
      <div style="
        display:flex;align-items:center;gap:20px;margin-bottom:14px;
        background:${dark ? 'rgba(255,255,255,.1)' : C.white};
        border:1px solid ${dark ? 'rgba(255,255,255,.16)' : C.border};
        border-radius:22px;padding:24px 26px">
        <span style="
          width:38px;height:38px;flex:none;border-radius:50%;background:${C.goldBright};
          display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:900;color:${C.greenDeep}">✓</span>
        <span style="font-size:25px;font-weight:600;color:${dark ? '#fff' : C.ink}">${text}</span>
      </div>`,
      )
      .join('')}
  </div>`;
}

// ----------------------------------------------------------------- slides

const slides = [
  {
    dark: true,
    kicker: 'Hello',
    head: 'What in the<br>world is <hl>Rooted</hl>?',
    sub: 'Meet the Bible app you can keep up with',
    stage: () => `
      ${phone(homeScreen(), { w: 430, rotate: -4, x: 250, y: 60 })}
      ${chip({ icon: '🌱', value: '2,011', label: 'verses in rotation', x: -10, y: 150, rotate: -3 })}
      ${chip({ icon: '📖', value: '31,100', label: 'verses, offline', x: 0, y: 400, rotate: 2 })}
      ${chip({ icon: '🔥', value: '14 days', label: 'current streak', x: 40, y: 640, rotate: -2 })}`,
  },
  {
    dark: false,
    kicker: 'Where the name comes from',
    head: '<hl>Rooted</hl> and built<br>up in him.',
    sub: 'Colossians 2:7',
    body: 'Roots do their work out of sight, slowly, long before anything shows above ground. That felt like the right picture for time spent in Scripture.',
  },
  {
    dark: true,
    kicker: 'Why we built it',
    head: 'Most Bible plans<br>die in <hl>February</hl>.',
    body: 'You start in January, miss four days in a row, open the app to a wall of red, and quietly stop. We have all done it. So we made something that does not punish you for a bad week.',
  },
  {
    dark: false,
    kicker: 'What Rooted is',
    head: 'One place for<br>the whole habit.',
    stage: () => `<div style="padding:0 0 0 0">${tiles(false)}</div>`,
    flow: true,
  },
  {
    dark: true,
    kicker: 'Verse of the day',
    head: 'A new verse<br>every day for<br><hl>5.5 years</hl>.',
    sub: 'Before a single one repeats',
    stage: () => `
      ${phone(readerScreen(), { w: 415, rotate: 4, x: 300, y: 70 })}
      ${chip({ icon: '✨', value: 'Never', label: 'the same twice', x: -10, y: 210, rotate: -3 })}
      ${chip({ icon: '🗓️', value: '2,011', label: 'before a repeat', x: 20, y: 470, rotate: 2 })}`,
  },
  {
    dark: false,
    kicker: 'Made to be kept up with',
    head: 'Read <hl>with</hl> people,<br>not at them.',
    body: 'Start a plan, share the code, and move through it together.',
    stage: () => `${planCard(-6, 40)}${chip({ icon: '🔥', value: '14 days', label: 'and counting', x: 470, y: 430, rotate: -3 })}`,
  },
  {
    dark: true,
    kicker: 'What we promise',
    head: 'Four things we<br>will not <hl>bend</hl> on.',
    stage: () => promises(true),
    flow: true,
  },
  {
    dark: false,
    cta: true,
    kicker: 'Coming to iOS',
    head: 'Come with us.',
    body: 'Follow along and watch it grow. Reading stays free, with no account needed.',
  },
];

// ----------------------------------------------------------------- render

function css(dark) {
  const fg = dark ? '#FFFFFF' : C.ink;
  return `
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px}
body{
  background:${dark ? C.green : C.cream};
  color:${fg};font-family:${FONT};-webkit-font-smoothing:antialiased;
  position:relative;overflow:hidden;
}
.blob{position:absolute;border-radius:50%;pointer-events:none}
.blob.a{width:820px;height:820px;top:-340px;right:-300px;
  background:radial-gradient(circle,${dark ? 'rgba(255,255,255,.11)' : 'rgba(46,106,92,.14)'} 0%,transparent 68%)}
.blob.b{width:700px;height:700px;bottom:-300px;left:-260px;
  background:radial-gradient(circle,${dark ? 'rgba(242,200,121,.16)' : 'rgba(176,132,66,.14)'} 0%,transparent 68%)}
.frame{position:absolute;inset:0;padding:78px 76px 72px;display:flex;flex-direction:column;z-index:2}
${MARK}
.top{display:flex;align-items:center;justify-content:space-between;margin-bottom:52px}
.brand{display:flex;align-items:center;gap:14px}
.word{font-family:Georgia,serif;font-size:31px;color:${dark ? '#fff' : C.green}}
.swipe{
  display:flex;align-items:center;gap:12px;background:${C.goldBright};color:${C.greenDeep};
  border-radius:99px;padding:14px 26px;font-size:21px;font-weight:800;
}
.kicker{font-size:24px;font-weight:800;letter-spacing:.02em;color:${dark ? C.goldBright : C.gold};margin-bottom:18px}
.head{font-size:86px;font-weight:800;line-height:1.26;letter-spacing:-.025em;color:${fg}}
hl{background:${C.goldBright};color:${C.greenDeep};border-radius:12px;padding:3px 14px;
   box-decoration-break:clone;-webkit-box-decoration-break:clone}
.sub{font-size:30px;font-weight:700;color:${dark ? C.goldBright : C.gold};margin-top:22px}
.body{font-size:28px;line-height:1.55;color:${dark ? 'rgba(255,255,255,.82)' : C.body};margin-top:24px;max-width:830px}
.spacer{flex:1}
.stage{position:absolute;left:76px;right:0;top:600px;bottom:0;z-index:1}
.flow{margin-top:44px}
.dots{display:flex;gap:9px;position:absolute;right:76px;bottom:44px;z-index:3}
.dot{width:10px;height:10px;border-radius:50%;background:${dark ? 'rgba(255,255,255,.32)' : C.border}}
.dot.on{width:30px;border-radius:99px;background:${dark ? C.goldBright : C.green}}
`;
}

function render(slide, index) {
  const dots = slides
    .map((_, i) => `<span class="dot${i === index ? ' on' : ''}"></span>`)
    .join('');

  const top = `<div class="top">
    <div class="brand">
      <span class="${slide.dark ? 'markChip' : ''}"><span class="mark" style="--s:.42"></span></span>
      <span class="word">Rooted</span>
    </div>
    ${index < slides.length - 1 ? `<span class="swipe">Swipe <b>→</b></span>` : ''}
  </div>`;

  const copy = `
    <div class="kicker">${slide.kicker}</div>
    <div class="head">${slide.head}</div>
    ${slide.sub ? `<div class="sub">${slide.sub}</div>` : ''}
    ${slide.body ? `<div class="body">${slide.body}</div>` : ''}`;

  // Two shapes: content that flows under the headline, or a stage the device
  // and floating cards are positioned inside.
  // The closing frame centres on the mark rather than hanging from the top.
  const inner = slide.cta
    ? `${top}<div class="spacer"></div><div class="mark" style="--s:2.3;margin-bottom:52px"></div>${copy}<div class="spacer"></div>`
    : slide.flow
    ? `${top}${copy}<div class="spacer"></div><div class="flow">${slide.stage()}</div><div class="spacer"></div>`
    : `${top}${copy}<div class="spacer"></div>`;

  const stage = !slide.flow && slide.stage ? `<div class="stage">${slide.stage()}</div>` : '';

  return `<!doctype html><html><head><meta charset="utf-8"><style>${css(slide.dark)}</style></head>
<body>
  <div class="blob a"></div><div class="blob b"></div>
  ${stage}
  <div class="frame">${inner}</div>
  <div class="dots">${dots}</div>
</body></html>`;
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

    console.log(`slide ${n}  ${slide.dark ? 'dark ' : 'light'}  ${path.basename(pngPath)}`);
  }

  console.log(`\n${slides.length} slides at ${W}x${H} in ${path.relative(root, outDir)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
