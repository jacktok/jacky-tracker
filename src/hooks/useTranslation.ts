import { useLanguage } from '../contexts/LanguageContext';
import enTranslations from '../locales/en.json';
import thTranslations from '../locales/th.json';

type TranslationKey = keyof typeof enTranslations;
type NestedKey<T, K extends keyof T> = K extends string ? T[K] extends Record<string, any> ? `${K}.${keyof T[K] & string}` : K : never;

type AllKeys = {
  [K in TranslationKey]: NestedKey<typeof enTranslations, K>
}[TranslationKey];

const translations = {
  en: enTranslations,
  th: thTranslations,
};

export const useTranslation = () => {
  const { language } = useLanguage();

  const t = (key: AllKeys, variables?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if translation is missing
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return the key if no translation found
          }
        }
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Handle variable interpolation
    if (variables) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
        return variables[variableName]?.toString() || match;
      });
    }

    return value;
  };

  return { t, language };
};
