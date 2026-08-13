/**
 * Translations available in the Bible reader.
 *
 * KJV ships with the app (see assets/bible/kjv). Everything else is fetched
 * from bible-api.com on demand and cached on device.
 *
 * Every translation here is Public Domain — no licensing restrictions on
 * bundling or redistribution. This is deliberate: modern copyrighted
 * translations (NIV, ESV, NLT) would each need a separate licence.
 *
 * `coverage` matters. Several of these carry only the New Testament, and
 * without flagging it the reader would just fail on Genesis with no
 * explanation.
 */

export type TranslationSource = 'offline' | 'remote';
export type TranslationCoverage = 'full' | 'nt';

/**
 * Where the text comes from.
 *   bundled    shipped with the app
 *   public     bible-api.com, fetched straight from the device
 *   licensed   API.Bible, proxied through our backend so the key stays private
 */
export type TranslationProvider = 'bundled' | 'public' | 'licensed';

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
    provider: 'public',
    apiId: 'web',
    coverage: 'full',
    language: 'English',
    note: 'Modern English',
  },
  {
    id: 'webbe',
    abbr: 'WEBBE',
    name: 'World English Bible, British Edition',
    source: 'remote',
    provider: 'public',
    apiId: 'webbe',
    coverage: 'full',
    language: 'English',
    note: 'Modern English, British spelling',
  },
  {
    id: 'asv',
    abbr: 'ASV',
    name: 'American Standard Version',
    source: 'remote',
    provider: 'public',
    apiId: 'asv',
    coverage: 'full',
    language: 'English',
    note: '1901',
  },
  {
    id: 'dra',
    abbr: 'DRA',
    name: 'Douay-Rheims 1899',
    source: 'remote',
    provider: 'public',
    apiId: 'dra',
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
    provider: 'public',
    apiId: 'bkr',
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
    id: 'cuv',
    abbr: 'CUV',
    name: 'Chinese Union Version',
    source: 'remote',
    provider: 'public',
    apiId: 'cuv',
    coverage: 'nt',
    language: '中文',
    note: 'Chinese',
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
    note: 'Requires a licence',
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
    note: 'Requires a licence',
    copyright: '© The Lockman Foundation',
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
