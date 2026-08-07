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

export type Translation = {
  id: string;
  /** Short label shown in the picker. */
  abbr: string;
  name: string;
  source: TranslationSource;
  coverage: TranslationCoverage;
  /** bible-api.com identifier — remote translations only. */
  apiId?: string;
  language: string;
  note: string;
};

export const TRANSLATIONS: Translation[] = [
  // ---------------------------------------------------------------- English
  {
    id: 'kjv',
    abbr: 'KJV',
    name: 'King James Version',
    source: 'offline',
    coverage: 'full',
    language: 'English',
    note: 'Bundled — works offline',
  },
  {
    id: 'web',
    abbr: 'WEB',
    name: 'World English Bible',
    source: 'remote',
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
    apiId: 'cherokee',
    coverage: 'nt',
    language: 'ᏣᎳᎩ',
    note: 'Cherokee',
  },
];

export const DEFAULT_TRANSLATION_ID = 'kjv';

export const TRANSLATIONS_BY_ID: Record<string, Translation> = Object.fromEntries(
  TRANSLATIONS.map((translation) => [translation.id, translation])
);

export function getTranslation(id: string): Translation {
  return TRANSLATIONS_BY_ID[id] ?? TRANSLATIONS_BY_ID[DEFAULT_TRANSLATION_ID];
}

/** Picker groups, English first. */
export function getTranslationsByLanguage() {
  const groups = new Map<string, Translation[]>();

  for (const translation of TRANSLATIONS) {
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
