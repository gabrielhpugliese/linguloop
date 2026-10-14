import { LANGUAGES } from './catalog';

/** Flag per language id ("German" -> "🇩🇪"). Derived from the filter catalog. */
export const languageFlags: Record<string, string> = Object.fromEntries(
  LANGUAGES.map((language) => [language.id, language.flag]),
);
