/**
 * Translations available in the Bible reader.
 *
 * KJV ships with the app (see assets/bible/kjv). Everything else is fetched
 * from bible-api.com on demand and cached on device.
 *
 * Every translation here is Public Domain — no licensing restrictions on
 * bundling or redistribution.
 */

export type TranslationSource = 'offline' | 'remote';

export type Translation = {
  id: string;
  /** Short label shown in the picker. */
  abbr: string;
  name: string;
  source: TranslationSource;
  /** bible-api.com identifier — remote translations only. */
  apiId?: string;
  note: string;
};

export const TRANSLATIONS: Translation[] = [
  {
    id: 'kjv',
    abbr: 'KJV',
    name: 'King James Version',
    source: 'offline',
    note: 'Bundled — works offline',
  },
  {
    id: 'web',
    abbr: 'WEB',
    name: 'World English Bible',
    source: 'remote',
    apiId: 'web',
    note: 'Modern English',
  },
  {
    id: 'asv',
    abbr: 'ASV',
    name: 'American Standard Version',
    source: 'remote',
    apiId: 'asv',
    note: '1901',
  },
  {
    id: 'bbe',
    abbr: 'BBE',
    name: 'Bible in Basic English',
    source: 'remote',
    apiId: 'bbe',
    note: 'Simplified vocabulary',
  },
  {
    id: 'ylt',
    abbr: 'YLT',
    name: "Young's Literal Translation",
    source: 'remote',
    apiId: 'ylt',
    note: 'Literal rendering',
  },
  {
    id: 'darby',
    abbr: 'DBY',
    name: 'Darby Bible',
    source: 'remote',
    apiId: 'darby',
    note: '1890',
  },
];

export const DEFAULT_TRANSLATION_ID = 'kjv';

export const TRANSLATIONS_BY_ID: Record<string, Translation> = Object.fromEntries(
  TRANSLATIONS.map((translation) => [translation.id, translation])
);

export function getTranslation(id: string): Translation {
  return TRANSLATIONS_BY_ID[id] ?? TRANSLATIONS_BY_ID[DEFAULT_TRANSLATION_ID];
}
