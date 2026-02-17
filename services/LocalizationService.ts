/**
 * Localization Service
 * 
 * Provides multi-language support for knowledge base content.
 * Extends/wraps the existing ReactoryTranslationService for KB-specific localization needs.
 */

import Reactory from '@reactorynet/reactory-core';
import { roles } from '@reactory/server-core/authentication/decorators';
import { Content } from '@reactory/server-modules/reactory-core/models';
import logger from '@reactory/server-core/logging';
import {
  IKBContent,
  IKBLocalizedContent,
  IKBLocalizedContentInput,
  KBContentType,
  IKBLanguage,
  ITranslationRequest,
  ITranslationStatus,
  TranslationRequestStatus,
} from '../types';

/**
 * Localization Service Interface
 */
export interface ILocalizationService extends Reactory.Service.IReactoryService {
  /**
   * Add localized content to an article
   */
  addLocalizedContent(
    contentId: string,
    localized: IKBLocalizedContentInput
  ): Promise<IKBContent>;

  /**
   * Update localized content
   */
  updateLocalizedContent(
    contentId: string,
    lng: string,
    localized: Partial<IKBLocalizedContentInput>
  ): Promise<IKBContent>;

  /**
   * Remove localized content
   */
  removeLocalizedContent(contentId: string, lng: string): Promise<IKBContent>;

  /**
   * Get localized content for a specific language
   */
  getLocalizedContent(contentId: string, lng: string): Promise<IKBLocalizedContent | null>;

  /**
   * Get available languages for content
   */
  getAvailableLanguages(contentId: string): Promise<IKBLanguage[]>;

  /**
   * Get missing translations for content
   */
  getMissingTranslations(contentId: string, targetLanguages: string[]): Promise<string[]>;

  /**
   * Get best matching language with fallback
   */
  getBestMatchingLanguage(
    contentId: string,
    preferredLanguage: string
  ): Promise<string>;

  /**
   * Translate content using external service (future)
   */
  requestTranslation(
    contentId: string,
    sourceLng: string,
    targetLng: string
  ): Promise<ITranslationRequest>;

  /**
   * Get translation request status
   */
  getTranslationStatus(requestId: string): Promise<ITranslationStatus>;

  /**
   * Translate a specific string using i18n
   */
  translate(key: string, lng?: string, params?: any): string;
}

/**
 * Localization Service Implementation
 */
class LocalizationService implements ILocalizationService {
  name: string = 'LocalizationService';
  nameSpace: string = 'kb';
  version: string = '1.0.0';

  props: Reactory.Service.IReactoryServiceProps;
  context: Reactory.Server.IReactoryContext;
  translationService: Reactory.Service.IReactoryTranslationService;

  // Language fallback chain (e.g., fr-CA -> fr -> en)
  private fallbackChains: Map<string, string[]> = new Map([
    ['fr-CA', ['fr-CA', 'fr', 'en']],
    ['fr-FR', ['fr-FR', 'fr', 'en']],
    ['en-US', ['en-US', 'en']],
    ['en-GB', ['en-GB', 'en']],
    ['es-MX', ['es-MX', 'es', 'en']],
    ['es-ES', ['es-ES', 'es', 'en']],
    ['pt-BR', ['pt-BR', 'pt', 'en']],
    ['pt-PT', ['pt-PT', 'pt', 'en']],
  ]);

  constructor(
    props: Reactory.Service.IReactoryServiceProps,
    context: Reactory.Server.IReactoryContext
  ) {
    this.props = props;
    this.context = context;
  }

  /**
   * Get fallback chain for a language
   */
  private getFallbackChain(lng: string): string[] {
    // Check if we have a predefined fallback chain
    if (this.fallbackChains.has(lng)) {
      return this.fallbackChains.get(lng)!;
    }

    // Generate fallback chain
    const chain: string[] = [lng];

    // If it's a locale (e.g., en-US), add the base language (en)
    if (lng.includes('-')) {
      const baseLang = lng.split('-')[0];
      chain.push(baseLang);
    }

    // Always fall back to English
    if (!chain.includes('en')) {
      chain.push('en');
    }

    return chain;
  }

  /**
   * Verify content exists and get it
   */
  private async getContent(contentId: string): Promise<IKBContent> {
    const content = await Content.findById(contentId);

    if (!content) {
      throw new Error(`Content ${contentId} not found`);
    }

    return content.toObject() as IKBContent;
  }

  /**
   * Add localized content to an article
   */
  @roles(['USER', 'ADMIN'])
  async addLocalizedContent(
    contentId: string,
    localized: IKBLocalizedContentInput
  ): Promise<IKBContent> {
    try {
      logger.debug(`Adding localized content (${localized.lng}) to content ${contentId}`);

      const content = await Content.findById(contentId);

      if (!content) {
        throw new Error(`Content ${contentId} not found`);
      }

      // Check permissions
      const isOwner = content.createdBy && content.createdBy.toString() === this.context.user._id.toString();
      const isAdmin = this.context.user.roles?.includes('ADMIN');

      if (!isOwner && !isAdmin) {
        throw new Error('Access denied: You do not have permission to add localized content');
      }

      // Get existing localized content
      const localizedContent = (content as any).localizedContent || [];

      // Check if this language already exists
      const existingIndex = localizedContent.findIndex(
        (lc: IKBLocalizedContent) => lc.lng === localized.lng
      );

      const newLocalized: IKBLocalizedContent = {
        lng: localized.lng,
        title: localized.title,
        content: localized.content,
        summary: localized.summary,
        description: localized.description,
        published: localized.published !== undefined ? localized.published : false,
        created: new Date(),
        modified: new Date(),
        modifiedBy: this.context.user._id,
      };

      if (existingIndex >= 0) {
        // Update existing localized content
        localizedContent[existingIndex] = {
          ...localizedContent[existingIndex],
          ...newLocalized,
          created: localizedContent[existingIndex].created, // Keep original creation date
        };
      } else {
        // Add new localized content
        localizedContent.push(newLocalized);
      }

      (content as any).localizedContent = localizedContent;
      content.updatedAt = new Date();
      content.updatedBy = this.context.user._id;

      await content.save();

      logger.info(`Localized content (${localized.lng}) added to content ${contentId}`);
      return content.toObject() as IKBContent;
    } catch (error) {
      logger.error(`Error adding localized content to ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Update localized content
   */
  @roles(['USER', 'ADMIN'])
  async updateLocalizedContent(
    contentId: string,
    lng: string,
    localized: Partial<IKBLocalizedContentInput>
  ): Promise<IKBContent> {
    try {
      logger.debug(`Updating localized content (${lng}) for content ${contentId}`);

      const content = await Content.findById(contentId);

      if (!content) {
        throw new Error(`Content ${contentId} not found`);
      }

      // Check permissions
      const isOwner = content.createdBy && content.createdBy.toString() === this.context.user._id.toString();
      const isAdmin = this.context.user.roles?.includes('ADMIN');

      if (!isOwner && !isAdmin) {
        throw new Error('Access denied: You do not have permission to update localized content');
      }

      // Get existing localized content
      const localizedContent = (content as any).localizedContent || [];
      const existingIndex = localizedContent.findIndex(
        (lc: IKBLocalizedContent) => lc.lng === lng
      );

      if (existingIndex < 0) {
        throw new Error(`Localized content for language ${lng} not found`);
      }

      // Update the localized content
      if (localized.title !== undefined) localizedContent[existingIndex].title = localized.title;
      if (localized.content !== undefined) localizedContent[existingIndex].content = localized.content;
      if (localized.summary !== undefined) localizedContent[existingIndex].summary = localized.summary;
      if (localized.description !== undefined)
        localizedContent[existingIndex].description = localized.description;
      if (localized.published !== undefined)
        localizedContent[existingIndex].published = localized.published;

      localizedContent[existingIndex].modified = new Date();
      localizedContent[existingIndex].modifiedBy = this.context.user._id;

      (content as any).localizedContent = localizedContent;
      content.updatedAt = new Date();
      content.updatedBy = this.context.user._id;

      await content.save();

      logger.info(`Localized content (${lng}) updated for content ${contentId}`);
      return content.toObject() as IKBContent;
    } catch (error) {
      logger.error(`Error updating localized content for ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Remove localized content
   */
  @roles(['USER', 'ADMIN'])
  async removeLocalizedContent(contentId: string, lng: string): Promise<IKBContent> {
    try {
      logger.debug(`Removing localized content (${lng}) from content ${contentId}`);

      const content = await Content.findById(contentId);

      if (!content) {
        throw new Error(`Content ${contentId} not found`);
      }

      // Check permissions
      const isOwner = content.createdBy && content.createdBy.toString() === this.context.user._id.toString();
      const isAdmin = this.context.user.roles?.includes('ADMIN');

      if (!isOwner && !isAdmin) {
        throw new Error('Access denied: You do not have permission to remove localized content');
      }

      // Get existing localized content
      const localizedContent = (content as any).localizedContent || [];

      // Filter out the specified language
      const filteredContent = localizedContent.filter(
        (lc: IKBLocalizedContent) => lc.lng !== lng
      );

      if (filteredContent.length === localizedContent.length) {
        throw new Error(`Localized content for language ${lng} not found`);
      }

      (content as any).localizedContent = filteredContent;
      content.updatedAt = new Date();
      content.updatedBy = this.context.user._id;

      await content.save();

      logger.info(`Localized content (${lng}) removed from content ${contentId}`);
      return content.toObject() as IKBContent;
    } catch (error) {
      logger.error(`Error removing localized content from ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Get localized content for a specific language
   */
  @roles(['USER', 'ANON'])
  async getLocalizedContent(
    contentId: string,
    lng: string
  ): Promise<IKBLocalizedContent | null> {
    try {
      const content = await this.getContent(contentId);
      const localizedContent = content.localizedContent || [];

      // Try to find exact match
      const localized = localizedContent.find(lc => lc.lng === lng);

      if (localized) {
        return localized;
      }

      // Try fallback chain
      const fallbackChain = this.getFallbackChain(lng);

      for (const fallbackLng of fallbackChain) {
        const fallbackLocalized = localizedContent.find(lc => lc.lng === fallbackLng);
        if (fallbackLocalized) {
          logger.debug(`Using fallback language ${fallbackLng} for ${lng}`);
          return fallbackLocalized;
        }
      }

      return null;
    } catch (error) {
      logger.error(`Error getting localized content for ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Get available languages for content
   */
  @roles(['USER', 'ANON'])
  async getAvailableLanguages(contentId: string): Promise<IKBLanguage[]> {
    try {
      const content = await this.getContent(contentId);
      const localizedContent = content.localizedContent || [];
      const defaultLng = content.lng || 'en';

      // Start with default language
      const languages: IKBLanguage[] = [
        {
          code: defaultLng,
          name: this.getLanguageName(defaultLng),
          isDefault: true,
          isComplete: true,
          lastModified: content.updatedAt,
        },
      ];

      // Add localized languages
      for (const localized of localizedContent) {
        // Skip if it's the same as default
        if (localized.lng === defaultLng) {
          continue;
        }

        languages.push({
          code: localized.lng,
          name: this.getLanguageName(localized.lng),
          isDefault: false,
          isComplete: localized.published || false,
          lastModified: localized.modified,
        });
      }

      return languages;
    } catch (error) {
      logger.error(`Error getting available languages for ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Get language name from code
   */
  private getLanguageName(code: string): string {
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
      it: 'Italiano',
      ja: '日本語',
      zh: '中文',
      'zh-CN': '中文 (简体)',
      'zh-TW': '中文 (繁體)',
    };

    return languageNames[code] || code;
  }

  /**
   * Get missing translations for content
   */
  @roles(['USER'])
  async getMissingTranslations(
    contentId: string,
    targetLanguages: string[]
  ): Promise<string[]> {
    try {
      const content = await this.getContent(contentId);
      const localizedContent = content.localizedContent || [];
      const availableLanguages = [content.lng, ...localizedContent.map(lc => lc.lng)];

      const missing = targetLanguages.filter(lng => !availableLanguages.includes(lng));

      return missing;
    } catch (error) {
      logger.error(`Error getting missing translations for ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Get best matching language with fallback
   */
  @roles(['USER', 'ANON'])
  async getBestMatchingLanguage(
    contentId: string,
    preferredLanguage: string
  ): Promise<string> {
    try {
      const content = await this.getContent(contentId);
      const localizedContent = content.localizedContent || [];
      const availableLanguages = [content.lng, ...localizedContent.map(lc => lc.lng)];

      // Check for exact match
      if (availableLanguages.includes(preferredLanguage)) {
        return preferredLanguage;
      }

      // Try fallback chain
      const fallbackChain = this.getFallbackChain(preferredLanguage);

      for (const fallbackLng of fallbackChain) {
        if (availableLanguages.includes(fallbackLng)) {
          return fallbackLng;
        }
      }

      // Return default language as last resort
      return content.lng || 'en';
    } catch (error) {
      logger.error(`Error getting best matching language for ${contentId}:`, error);
      return 'en';
    }
  }

  /**
   * Request translation using external service (placeholder for future implementation)
   */
  @roles(['USER', 'ADMIN'])
  async requestTranslation(
    contentId: string,
    sourceLng: string,
    targetLng: string
  ): Promise<ITranslationRequest> {
    try {
      logger.debug(`Translation requested: ${contentId} from ${sourceLng} to ${targetLng}`);

      // Verify content exists
      await this.getContent(contentId);

      // TODO: Integrate with external translation service (Google Translate, DeepL, etc.)
      const request: ITranslationRequest = {
        id: `tr-${Date.now()}`,
        contentId,
        sourceLng,
        targetLng,
        status: TranslationRequestStatus.PENDING,
        requestedBy: this.context.user._id.toString(),
        requestedAt: new Date(),
      };

      logger.warn('Translation request created but external service integration not implemented');

      return request;
    } catch (error) {
      logger.error(`Error requesting translation for ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Get translation request status (placeholder)
   */
  @roles(['USER'])
  async getTranslationStatus(requestId: string): Promise<ITranslationStatus> {
    try {
      // TODO: Implement translation status tracking
      const status: ITranslationStatus = {
        requestId,
        status: TranslationRequestStatus.PENDING,
        progress: 0,
        estimatedCompletion: undefined,
      };

      return status;
    } catch (error) {
      logger.error(`Error getting translation status for ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Translate a specific string using i18n (leverages ReactoryTranslationService)
   */
  @roles(['USER', 'ANON'])
  translate(key: string, lng?: string, params?: any): string {
    try {
      // Use the translation service if available
      if (this.translationService) {
        return this.translationService.translate(key, params);
      }

      // Use context i18n directly
      if (this.context.i18n) {
        const currentLng = this.context.i18n.language;
        
        // Change language if specified
        if (lng && lng !== currentLng) {
          this.context.i18n.changeLanguage(lng);
        }

        const translation = this.context.i18n.t(key, params);

        // Restore original language
        if (lng && lng !== currentLng) {
          this.context.i18n.changeLanguage(currentLng);
        }

        return translation;
      }

      // Fallback to key if no translation available
      logger.warn(`Translation not available for key: ${key}`);
      return key;
    } catch (error) {
      logger.error(`Error translating key ${key}:`, error);
      return key;
    }
  }

  /**
   * Lifecycle methods
   */
  async onStartup(): Promise<void> {
    logger.info('LocalizationService started');
  }

  getExecutionContext(): Reactory.Server.IReactoryContext {
    return this.context;
  }

  setExecutionContext(context: Reactory.Server.IReactoryContext): boolean {
    this.context = context;
    return true;
  }

  setTranslationService(translationService: Reactory.Service.IReactoryTranslationService): void {
    this.translationService = translationService;
  }

  /**
   * Service definition
   */
  static reactory: Reactory.Service.IReactoryServiceDefinition<LocalizationService> = {
    id: 'kb.LocalizationService@1.0.0',
    nameSpace: 'kb',
    name: 'LocalizationService',
    version: '1.0.0',
    description: 'Service for managing multi-language content in knowledge bases',
    service: (
      props: Reactory.Service.IReactoryServiceProps,
      context: Reactory.Server.IReactoryContext
    ) => {
      return new LocalizationService(props, context);
    },
    dependencies: [
      { id: 'core.ReactoryTranslationService@1.0.0', alias: 'translationService' },
    ],
    serviceType: 'translation',
  };
}

export default LocalizationService;
export { ILocalizationService };

