/**
 * Translation Utilities
 * 
 * Helper functions for working with multi-language content in the Knowledge Base.
 */

import {
  IKBContent,
  IKBLocalizedContent,
  IKBLocalizedContentInput,
} from '../types';

/**
 * Get preferred language from user context or request
 */
export function getPreferredLanguage(
  context: Reactory.Server.IReactoryContext,
  defaultLanguage: string = 'en'
): string {
  
 // Check user preferences
  if (context?.user?.il8n?.locale) {
    return context.user.il8n.locale;
  }

  // Check i18n context
  if (context?.i18n?.language) {
    return context.i18n.language;
  }

   // Check context language
  if (context?.lang) {
   return context.lang;
  } 

  // Check request headers
  if (context?.request?.headers?.['accept-language']) {
    const acceptLanguage = context.request.headers['accept-language'];
    // Parse accept-language header (e.g., "en-US,en;q=0.9,fr;q=0.8")
    const primaryLanguage = acceptLanguage.split(',')[0].split(';')[0].trim();
    if (primaryLanguage) {
      return primaryLanguage;
    }
  }

  return defaultLanguage;
}

/**
 * Get localized field value with fallback
 */
export function getLocalizedField<T extends keyof IKBLocalizedContent>(
  content: IKBContent,
  field: T,
  preferredLanguage: string
): IKBLocalizedContent[T] | undefined {
  if (!content.localizedContent || content.localizedContent.length === 0) {
    return undefined;
  }

  // Try exact match
  const exactMatch = content.localizedContent.find(lc => lc.lng === preferredLanguage);
  if (exactMatch && exactMatch[field]) {
    return exactMatch[field];
  }

  // Try base language (e.g., 'en' from 'en-US')
  if (preferredLanguage.includes('-')) {
    const baseLang = preferredLanguage.split('-')[0];
    const baseMatch = content.localizedContent.find(lc => lc.lng === baseLang);
    if (baseMatch && baseMatch[field]) {
      return baseMatch[field];
    }
  }

  // Try English as fallback
  const englishMatch = content.localizedContent.find(lc => lc.lng === 'en' || lc.lng.startsWith('en-'));
  if (englishMatch && englishMatch[field]) {
    return englishMatch[field];
  }

  // Return first available
  const firstAvailable = content.localizedContent.find(lc => lc[field]);
  return firstAvailable ? firstAvailable[field] : undefined;
}

/**
 * Get best available content (title, content, summary) for a language
 */
export function getLocalizedContent(
  content: IKBContent,
  preferredLanguage: string
): {
  title: string;
  content: string;
  summary?: string;
  description?: string;
  lng: string;
  isLocalized: boolean;
} {
  // Check if we have localized version
  const localizedTitle = getLocalizedField(content, 'title', preferredLanguage);
  const localizedContent = getLocalizedField(content, 'content', preferredLanguage);
  const localizedSummary = getLocalizedField(content, 'summary', preferredLanguage);
  const localizedDescription = getLocalizedField(content, 'description', preferredLanguage);

  // If we found localized content, use it
  if (localizedTitle || localizedContent) {
    return {
      title: localizedTitle || content.title || '',
      content: localizedContent || content.content || '',
      summary: localizedSummary,
      description: localizedDescription || content.description,
      lng: preferredLanguage,
      isLocalized: true,
    };
  }

  // Fall back to default content
  return {
    title: content.title || '',
    content: content.content || '',
    summary: content.description,
    description: content.description,
    lng: content.lng || 'en',
    isLocalized: false,
  };
}

/**
 * Check if content has translation for a specific language
 */
export function hasTranslation(content: IKBContent, language: string): boolean {
  if (!content.localizedContent || content.localizedContent.length === 0) {
    return language === (content.lng || 'en');
  }

  return content.localizedContent.some(lc => lc.lng === language);
}

/**
 * Get all available languages for content
 */
export function getAvailableLanguages(content: IKBContent): string[] {
  const languages: string[] = [content.lng || 'en'];

  if (content.localizedContent && content.localizedContent.length > 0) {
    const localizedLanguages = content.localizedContent.map(lc => lc.lng);
    languages.push(...localizedLanguages);
  }

  // Remove duplicates
  return [...new Set(languages)];
}

/**
 * Get completion percentage for a localized version
 */
export function getTranslationCompleteness(
  localized: IKBLocalizedContent,
  baseContent: IKBContent
): number {
  let completedFields = 0;
  let totalFields = 0;

  // Check title
  totalFields++;
  if (localized.title) completedFields++;

  // Check content
  totalFields++;
  if (localized.content) completedFields++;

  // Check summary (optional)
  if (baseContent.description) {
    totalFields++;
    if (localized.summary) completedFields++;
  }

  // Check description (optional)
  if (baseContent.description) {
    totalFields++;
    if (localized.description) completedFields++;
  }

  return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
}

/**
 * Validate localized content input
 */
export function validateLocalizedContent(
  input: IKBLocalizedContentInput
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!input.lng) {
    errors.push('Language code (lng) is required');
  }

  if (!input.title || input.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!input.content || input.content.trim().length === 0) {
    errors.push('Content is required');
  }

  // Validate language code format
  if (input.lng && !/^[a-z]{2}(-[A-Z]{2})?$/.test(input.lng)) {
    errors.push('Invalid language code format. Expected format: "en" or "en-US"');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Parse accept-language header
 */
export function parseAcceptLanguage(acceptLanguageHeader: string): string[] {
  if (!acceptLanguageHeader) {
    return [];
  }

  // Parse "en-US,en;q=0.9,fr;q=0.8" format
  const languages = acceptLanguageHeader
    .split(',')
    .map(lang => {
      const [code, q] = lang.split(';');
      const quality = q ? parseFloat(q.replace('q=', '')) : 1.0;
      return { code: code.trim(), quality };
    })
    .sort((a, b) => b.quality - a.quality)
    .map(lang => lang.code);

  return languages;
}

/**
 * Get language fallback chain
 */
export function getLanguageFallbackChain(language: string): string[] {
  const chain: string[] = [language];

  // If it's a locale (e.g., en-US), add the base language
  if (language.includes('-')) {
    const baseLang = language.split('-')[0];
    chain.push(baseLang);
  }

  // Always fall back to English
  if (!chain.includes('en')) {
    chain.push('en');
  }

  return chain;
}

/**
 * Compare two language codes
 */
export function languagesMatch(lang1: string, lang2: string, strict: boolean = false): boolean {
  if (strict) {
    return lang1 === lang2;
  }

  // Loose match: en-US matches en, fr-CA matches fr, etc.
  const base1 = lang1.split('-')[0];
  const base2 = lang2.split('-')[0];

  return base1 === base2 || lang1 === lang2;
}

/**
 * Format language code for display
 */
export function formatLanguageCode(code: string): string {
  const languageNames: Record<string, string> = {
    en: 'English',
    'en-US': 'English (US)',
    'en-GB': 'English (UK)',
    fr: 'Français',
    'fr-FR': 'Français (France)',
    'fr-CA': 'Français (Canada)',
    es: 'Español',
    'es-ES': 'Español (España)',
    'es-MX': 'Español (México)',
    pt: 'Português',
    'pt-BR': 'Português (Brasil)',
    'pt-PT': 'Português (Portugal)',
    de: 'Deutsch',
    'de-DE': 'Deutsch (Deutschland)',
    'de-AT': 'Deutsch (Österreich)',
    it: 'Italiano',
    ja: '日本語',
    zh: '中文',
    'zh-CN': '中文 (简体)',
    'zh-TW': '中文 (繁體)',
    ko: '한국어',
    ar: 'العربية',
    ru: 'Русский',
    nl: 'Nederlands',
    pl: 'Polski',
    tr: 'Türkçe',
    vi: 'Tiếng Việt',
    th: 'ไทย',
    id: 'Bahasa Indonesia',
    hi: 'हिन्दी',
  };

  return languageNames[code] || code.toUpperCase();
}

/**
 * Merge localized content updates
 */
export function mergeLocalizedContent(
  existing: IKBLocalizedContent,
  updates: Partial<IKBLocalizedContentInput>
): IKBLocalizedContent {
  return {
    ...existing,
    title: updates.title !== undefined ? updates.title : existing.title,
    content: updates.content !== undefined ? updates.content : existing.content,
    summary: updates.summary !== undefined ? updates.summary : existing.summary,
    description: updates.description !== undefined ? updates.description : existing.description,
    published: updates.published !== undefined ? updates.published : existing.published,
    modified: new Date(),
  };
}

/**
 * Export utilities as named exports and default object
 */
export default {
  getPreferredLanguage,
  getLocalizedField,
  getLocalizedContent,
  hasTranslation,
  getAvailableLanguages,
  getTranslationCompleteness,
  validateLocalizedContent,
  parseAcceptLanguage,
  getLanguageFallbackChain,
  languagesMatch,
  formatLanguageCode,
  mergeLocalizedContent,
};

