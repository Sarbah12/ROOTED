/**
 * Translations available in the Bible reader.
 *
 * KJV ships with the app (see assets/bible/kjv) and needs no network at all.
 *
 * Everything else is fetched. Where API.Bible carries the same text it is
 * preferred and proxied through our own backend, because bible-api.com is a
 * free community service with no key and aggressive per-IP rate limiting —
 * moderate use returns 403 and then blocks entirely, which reads to a user as
 * "this version is broken". Proxying also means one server-side fetch serves
 * every reader of that chapter.
 *
 * Public-domain texts stay readable without an account even when proxied; the
 * server keeps a list of ids it will serve unauthenticated.
 *
 * `coverage` matters. Several of these carry only the New Testament, and
 * without flagging it the reader would just fail on Genesis with no
 * explanation.
 */

export type TranslationSource = 'offline' | 'remote';
export type TranslationCoverage = 'full' | 'nt';

/**
 * Where the text comes from.
 *   bundled    shipped with the app, works offline
 *   public     bible-api.com, straight from the device — no key, rate limited
 *   proxied    API.Bible via our backend, public domain, no sign-in needed
 *   licensed   API.Bible or Tyndale via our backend, needs an account
 */
export type TranslationProvider = 'bundled' | 'public' | 'proxied' | 'licensed';

export type Translation = {
  id: string;
  /** Short label shown in the picker. */
  abbr: string;
  name: string;
  source: TranslationSource;
  coverage: TranslationCoverage;
  provider: TranslationProvider;
  /** bible-api.com identifier — public remote translations only. */
  apiId?: string;
  /** API.Bible id — licensed translations only. Set once you have a key. */
  bibleId?: string;
  language: string;
  note: string;
  /** Copyright line publishers require to be displayed alongside the text. */
  copyright?: string;
};

export const TRANSLATIONS: Translation[] = [
  // ---------------------------------------------------------------- English
  {
    id: 'kjv',
    abbr: 'KJV',
    name: 'King James Version',
    source: 'offline',
    coverage: 'full',
    provider: 'bundled',
    language: 'English',
    note: 'Bundled — works offline',
  },
  {
    id: 'web',
    abbr: 'WEB',
    name: 'World English Bible',
    source: 'remote',
    provider: 'proxied',
    bibleId: '9879dbb7cfe39e4d-01',
    coverage: 'full',
    language: 'English',
    note: 'Modern English',
  },
  {
    id: 'webbe',
    abbr: 'WEBBE',
    name: 'World English Bible, British Edition',
    source: 'remote',
    provider: 'proxied',
    bibleId: '7142879509583d59-01',
    coverage: 'full',
    language: 'English',
    note: 'Modern English, British spelling',
  },
  {
    id: 'asv',
    abbr: 'ASV',
    name: 'American Standard Version',
    source: 'remote',
    provider: 'proxied',
    bibleId: '06125adad2d5898a-01',
    coverage: 'full',
    language: 'English',
    note: '1901',
  },
  {
    id: 'dra',
    abbr: 'DRA',
    name: 'Douay-Rheims 1899',
    source: 'remote',
    provider: 'proxied',
    bibleId: '179568874c45066f-01',
    coverage: 'full',
    language: 'English',
    note: 'Catholic tradition',
  },
  {
    id: 'darby',
    abbr: 'DBY',
    name: 'Darby Bible',
    source: 'remote',
    provider: 'public',
    apiId: 'darby',
    coverage: 'full',
    language: 'English',
    note: '1890',
  },
  {
    id: 'bbe',
    abbr: 'BBE',
    name: 'Bible in Basic English',
    source: 'remote',
    provider: 'public',
    apiId: 'bbe',
    coverage: 'full',
    language: 'English',
    note: 'Simplified vocabulary',
  },
  {
    id: 'ylt',
    abbr: 'YLT',
    name: "Young's Literal Translation",
    source: 'remote',
    provider: 'public',
    apiId: 'ylt',
    coverage: 'nt',
    language: 'English',
    note: 'Literal rendering',
  },
  {
    id: 'oeb-us',
    abbr: 'OEB',
    name: 'Open English Bible, US',
    source: 'remote',
    provider: 'public',
    apiId: 'oeb-us',
    coverage: 'nt',
    language: 'English',
    note: 'Contemporary',
  },
  {
    id: 'oeb-cw',
    abbr: 'OEB-CW',
    name: 'Open English Bible, Commonwealth',
    source: 'remote',
    provider: 'public',
    apiId: 'oeb-cw',
    coverage: 'nt',
    language: 'English',
    note: 'Contemporary, British spelling',
  },

  // ------------------------------------------------------------ Other tongues
  {
    id: 'clementine',
    abbr: 'VUL',
    name: 'Clementine Latin Vulgate',
    source: 'remote',
    provider: 'public',
    apiId: 'clementine',
    coverage: 'full',
    language: 'Latin',
    note: 'Latin',
  },
  {
    id: 'almeida',
    abbr: 'ALM',
    name: 'João Ferreira de Almeida',
    source: 'remote',
    provider: 'public',
    apiId: 'almeida',
    coverage: 'full',
    language: 'Português',
    note: 'Portuguese',
  },
  {
    id: 'rccv',
    abbr: 'RCCV',
    name: 'Cornilescu Corrected',
    source: 'remote',
    provider: 'public',
    apiId: 'rccv',
    coverage: 'full',
    language: 'Română',
    note: 'Romanian',
  },
  {
    id: 'bkr',
    abbr: 'BKR',
    name: 'Bible kralická',
    source: 'remote',
    provider: 'proxied',
    bibleId: 'c61908161b077c4c-01',
    coverage: 'full',
    language: 'Čeština',
    note: 'Czech',
  },
  {
    id: 'synodal',
    abbr: 'SYN',
    name: 'Russian Synodal Translation',
    source: 'remote',
    provider: 'public',
    apiId: 'synodal',
    coverage: 'nt',
    language: 'Русский',
    note: 'Russian',
  },
  {
    id: 'ccb-simplified',
    abbr: '简体中文',
    name: 'Chinese Contemporary Bible, Simplified',
    source: 'remote',
    provider: 'proxied',
    bibleId: '7ea794434e9ea7ee-01',
    coverage: 'full',
    language: '中文',
    note: 'Simplified characters',
    copyright: '© Biblica, Inc.',
  },
  {
    id: 'ccb-traditional',
    abbr: '繁體中文',
    name: 'Chinese Contemporary Bible, Traditional',
    source: 'remote',
    provider: 'proxied',
    bibleId: 'a6e06d2c5b90ad89-01',
    coverage: 'full',
    language: '中文',
    note: 'Traditional characters',
    copyright: '© Biblica, Inc.',
  },
  {
    id: 'cherokee',
    abbr: 'CHR',
    name: 'Cherokee New Testament',
    source: 'remote',
    provider: 'public',
    apiId: 'cherokee',
    coverage: 'nt',
    language: 'ᏣᎳᎩ',
    note: 'Cherokee',
  },
];

/**
 * Copyrighted translations. Each stays inert until its `bibleId` is filled in,
 * so a translation never appears in the picker unless it can actually load.
 *
 * NKJV and AMP come through API.Bible: set API_BIBLE_KEY on the backend and
 * take ids from GET /v1/bible/versions.
 *
 * The binding limit on their free Starter tier is not the three-Bible cap, it
 * is 5,000 API calls a *month* — one call per user per month at the scale this
 * app is sized for. The backend caches chapters in memory for that reason.
 * Starter is also strictly non-commercial: the moment the app carries ads or
 * charges money it needs Pro (from $29/month, 150,000 calls) or a per
 * translation commercial licence (from $10/month). NIV commercial use is not
 * offered at all, at any price.
 *
 * The NLT does not go through API.Bible. Tyndale publish it and run their own
 * API (api.nlt.to), which gives 5,000 requests a day on a free key and a
 * direct line for a commercial licence later. It needs NLT_API_KEY instead.
 */
export const LICENSED_TRANSLATIONS: Translation[] = [
  {
    id: 'nkjv',
    abbr: 'NKJV',
    name: 'New King James Version',
    source: 'remote',
    provider: 'licensed',
    coverage: 'full',
    language: 'English',
    bibleId: '63097d2a0a2f7db3-01',
    note: 'Licensed via API.Bible',
    copyright: '© Thomas Nelson',
  },
  {
    id: 'nlt',
    abbr: 'NLT',
    name: 'New Living Translation',
    source: 'remote',
    provider: 'licensed',
    coverage: 'full',
    language: 'English',
    // Not API.Bible. Tyndale publish the NLT and run their own API for it, so
    // this goes to them directly — better limits, and a licence conversation
    // with the people who own the text. The backend routes `nlt` accordingly.
    bibleId: 'nlt',
    note: 'Licensed from Tyndale',
    copyright: '© Tyndale House Publishers',
  },
  {
    id: 'amp',
    abbr: 'AMP',
    name: 'Amplified Bible',
    source: 'remote',
    provider: 'licensed',
    coverage: 'full',
    language: 'English',
    bibleId: 'a81b73293d3080c9-01',
    note: 'Licensed via API.Bible',
    copyright: '© The Lockman Foundation',
  },

  // ------------------------------------------------------------ Ghana & Africa
  // Biblica publish these as open editions and the same key already reaches
  // them. Coverage was read from each Bible's own book list rather than
  // assumed — Hausa really is New Testament only.
  {
    id: 'twi-akuapem',
    abbr: 'Twi (Akuapem)',
    name: 'Akuapem Twi Nkwa Asɛm',
    source: 'remote',
    provider: 'licensed',
    coverage: 'full',
    language: 'Twi',
    bibleId: 'b6aee081108c0bc6-01',
    note: 'Akuapem dialect',
    copyright: '© Biblica, Inc.',
  },
  {
    id: 'twi-asante',
    abbr: 'Twi (Asante)',
    name: 'Asante Twi Nkwa Asɛm',
    source: 'remote',
    provider: 'licensed',
    coverage: 'full',
    language: 'Twi',
    bibleId: '18f6cf27f7b43297-01',
    note: 'Asante dialect',
    copyright: '© Biblica, Inc.',
  },
  {
    id: 'ewe',
    abbr: 'Eʋe',
    name: 'Agbenya La',
    source: 'remote',
    provider: 'licensed',
    coverage: 'full',
    language: 'Eʋegbe',
    bibleId: 'ac90bfebd4ee9c4d-01',
    note: 'Ewe',
    copyright: '© Biblica, Inc.',
  },
  {
    id: 'yoruba',
    abbr: 'Yorùbá',
    name: 'Yoruba Contemporary Bible',
    source: 'remote',
    provider: 'licensed',
    coverage: 'full',
    language: 'Yorùbá',
    bibleId: 'b8d1feac6e94bd74-01',
    note: 'Yoruba',
    copyright: '© Biblica, Inc.',
  },
  {
    id: 'igbo',
    abbr: 'Igbo',
    name: 'Igbo Contemporary Bible',
    source: 'remote',
    provider: 'licensed',
    coverage: 'full',
    language: 'Igbo',
    bibleId: 'a36fc06b086699f1-02',
    note: 'Igbo',
    copyright: '© Biblica, Inc.',
  },
  {
    id: 'hausa',
    abbr: 'Hausa',
    name: 'Hausa Contemporary Bible',
    source: 'remote',
    provider: 'licensed',
    coverage: 'nt',
    language: 'Hausa',
    bibleId: '0ab0c764d56a715d-01',
    note: 'Hausa',
    copyright: '© Biblica, Inc.',
  },
  {
    id: 'swahili',
    abbr: 'Neno',
    name: 'Kiswahili Contemporary Version',
    source: 'remote',
    provider: 'licensed',
    coverage: 'full',
    language: 'Kiswahili',
    bibleId: '611f8eb23aec8f13-01',
    note: 'Swahili',
    copyright: '© Biblica, Inc.',
  },

  // ----------------------------------------------------------- Other languages
  {
    id: 'darby-fr',
    abbr: 'JND',
    name: 'Bible J.N. Darby',
    source: 'remote',
    provider: 'licensed',
    coverage: 'full',
    language: 'Français',
    bibleId: 'a93a92589195411f-01',
    note: 'French',
  },
  {
    id: 'rvr09',
    abbr: 'RVR09',
    name: 'Reina Valera 1909',
    source: 'remote',
    provider: 'licensed',
    coverage: 'full',
    language: 'Español',
    bibleId: '592420522e16049f-01',
    note: 'Spanish',
  },
  {
    id: 'blt-pt',
    abbr: 'BLT',
    name: 'Biblia Livre Para Todos',
    source: 'remote',
    provider: 'licensed',
    coverage: 'full',
    language: 'Português',
    bibleId: 'd63894c8d9a7a503-01',
    note: 'Portuguese',
  },

  // ---------------------------------------------------------- Further English
  {
    id: 'fbv',
    abbr: 'FBV',
    name: 'Free Bible Version',
    source: 'remote',
    provider: 'licensed',
    coverage: 'full',
    language: 'English',
    bibleId: '65eec8e0b60e656b-01',
    note: 'Plain modern English',
  },
  {
    id: 'lsv',
    abbr: 'LSV',
    name: 'Literal Standard Version',
    source: 'remote',
    provider: 'licensed',
    coverage: 'full',
    language: 'English',
    bibleId: '01b29f4b342acc35-01',
    note: 'Literal rendering',
  },
  {
    id: 'gnv',
    abbr: 'GNV',
    name: 'Geneva Bible',
    source: 'remote',
    provider: 'licensed',
    coverage: 'full',
    language: 'English',
    bibleId: 'c315fa9f71d4af3a-01',
    note: '1599, the Reformers Bible',
  },
  {
    id: 'kjvcpb',
    abbr: 'KJVCPB',
    name: 'Cambridge Paragraph KJV',
    source: 'remote',
    provider: 'licensed',
    coverage: 'full',
    language: 'English',
    bibleId: '55212e3cf5d04d49-01',
    note: 'KJV set in paragraphs',
  },
  {
    id: 't4t',
    abbr: 'T4T',
    name: 'Translation for Translators',
    source: 'remote',
    provider: 'licensed',
    coverage: 'full',
    language: 'English',
    bibleId: '66c22495370cdfc0-01',
    note: 'Meaning made explicit',
  },
];

/** A licensed translation only works once its API.Bible id is set. */
export function isLicensedAndReady(translation: Translation) {
  return translation.provider !== 'licensed' || Boolean(translation.bibleId);
}

/** Licensed entries appear in the picker only when actually usable. */
export const ALL_TRANSLATIONS: Translation[] = [
  ...TRANSLATIONS,
  ...LICENSED_TRANSLATIONS.filter(isLicensedAndReady),
];

export const DEFAULT_TRANSLATION_ID = 'kjv';

export const TRANSLATIONS_BY_ID: Record<string, Translation> = Object.fromEntries(
  ALL_TRANSLATIONS.map((translation) => [translation.id, translation])
);

export function getTranslation(id: string): Translation {
  return TRANSLATIONS_BY_ID[id] ?? TRANSLATIONS_BY_ID[DEFAULT_TRANSLATION_ID];
}

/** Picker groups, English first. */
export function getTranslationsByLanguage() {
  const groups = new Map<string, Translation[]>();

  for (const translation of ALL_TRANSLATIONS) {
    const existing = groups.get(translation.language) ?? [];
    existing.push(translation);
    groups.set(translation.language, existing);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => (a === 'English' ? -1 : b === 'English' ? 1 : a.localeCompare(b)))
    .map(([language, translations]) => ({ language, translations }));
}

/** True when this translation cannot serve the given testament. */
export function isUnavailableFor(translation: Translation, testament: 'OT' | 'NT') {
  return translation.coverage === 'nt' && testament === 'OT';
}
