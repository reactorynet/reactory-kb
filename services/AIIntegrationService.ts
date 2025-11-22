/**
 * AI Integration Service
 * 
 * Facilitates AI agent interactions with knowledge base content.
 * Provides AI-readable knowledge formatting, content validation, and context-aware retrieval.
 */

import Reactory from '@reactory/reactory-core';
import { roles } from '@reactory/server-core/authentication/decorators';
import { Content } from '@reactory/server-modules/reactory-core/models';
import logger from '@reactory/server-core/logging';
import {
  IKBContent,
  IAIKnowledgeContext,
  IAIContentSummary,
  IAICreateArticleInput,
  IAIContentValidation,
  KBContentType,
  KBArticleStatus,
  ILocalizedContext,
} from '../types';
import { getLocalizedContent } from '../utils/translation';

/**
 * AI Integration Service Interface
 */
export interface IAIIntegrationService extends Reactory.Service.IReactoryService {
  /**
   * Get articles formatted for AI consumption
   */
  getArticlesForAI(
    kbId: string,
    context: { topic?: string; language?: string; limit?: number }
  ): Promise<IAIContentSummary[]>;

  /**
   * Create article from AI-generated content
   */
  createArticleFromAI(input: IAICreateArticleInput): Promise<IKBContent>;

  /**
   * Validate AI-generated content
   */
  validateAIContent(content: string, metadata?: any): Promise<IAIContentValidation>;

  /**
   * Get knowledge context for AI query
   */
  getKnowledgeContext(query: string, kbId?: string): Promise<IAIKnowledgeContext>;

  /**
   * Update AI knowledge base (reindex for AI access)
   */
  updateAIKnowledge(kbId: string): Promise<void>;

  /**
   * Get localized content for AI in specific language
   */
  getLocalizedContentForAI(articleId: string, lng: string): Promise<IAIContentSummary>;

  /**
   * Format content for AI consumption
   */
  formatContentForAI(content: IKBContent, language?: string): IAIContentSummary;

  /**
   * Get related content suggestions
   */
  getRelatedContent(contentId: string, limit?: number): Promise<IAIContentSummary[]>;

  /**
   * Extract key points from content
   */
  extractKeyPoints(content: string): Promise<string[]>;
}

/**
 * AI Integration Service Implementation
 */
class AIIntegrationService implements IAIIntegrationService {
  name: string = 'AIIntegrationService';
  nameSpace: string = 'kb';
  version: string = '1.0.0';

  props: Reactory.Service.IReactoryServiceProps;
  context: Reactory.Server.IReactoryContext;
  searchService: any; // ISearchService
  kbService: any; // IKnowledgeBaseService

  constructor(
    props: Reactory.Service.IReactoryServiceProps,
    context: Reactory.Server.IReactoryContext
  ) {
    this.props = props;
    this.context = context;
  }

  /**
   * Get articles formatted for AI consumption
   */
  @roles(['USER', 'ADMIN', 'SYSTEM'])
  async getArticlesForAI(
    kbId: string,
    aiContext: { topic?: string; language?: string; limit?: number } = {}
  ): Promise<IAIContentSummary[]> {
    try {
      const { topic, language = 'en', limit = 10 } = aiContext;

      logger.debug(`Getting articles for AI from KB ${kbId}`, { topic, language, limit });

      // Build query for articles
      const query: any = {
        knowledgeBase: kbId,
        contentType: KBContentType.ARTICLE,
        published: true,
        status: KBArticleStatus.PUBLISHED,
      };

      if (language) {
        query.$or = [{ lng: language }, { 'localizedContent.lng': language }];
      }

      if (topic) {
        query.$or = [
          { tags: { $in: [topic] } },
          { title: { $regex: topic, $options: 'i' } },
          { content: { $regex: topic, $options: 'i' } },
        ];
      }

      const articles = await Content.find(query)
        .sort({ viewCount: -1, updatedAt: -1 })
        .limit(limit)
        .lean();

      // Format for AI
      const summaries = articles.map(article =>
        this.formatContentForAI(article as IKBContent, language)
      );

      return summaries;
    } catch (error) {
      logger.error(`Error getting articles for AI from KB ${kbId}:`, error);
      throw error;
    }
  }

  /**
   * Create article from AI-generated content
   */
  @roles(['USER', 'ADMIN', 'SYSTEM'])
  async createArticleFromAI(input: IAICreateArticleInput): Promise<IKBContent> {
    try {
      logger.debug(`Creating article from AI:`, { kbId: input.kbId, title: input.title });

      // Validate AI content first
      const validation = await this.validateAIContent(input.content, input.metadata);

      if (!validation.isValid) {
        throw new Error(`AI content validation failed: ${validation.issues.join(', ')}`);
      }

      // Get ArticleService
      const articleService = this.props.$services.kb?.ArticleService;
      if (!articleService) {
        throw new Error('ArticleService not available');
      }

      // Create article with AI metadata
      const article = await articleService.createArticle({
        kbId: input.kbId,
        title: input.title,
        content: input.content,
        lng: input.language || 'en',
        description: input.summary,
        summary: input.summary,
        tags: input.tags || ['ai-generated'],
        categories: input.categories || [],
        metadata: {
          ...input.metadata,
          generatedBy: input.generatedBy || 'ai-agent',
          confidence: input.confidence || 0.8,
          validationScore: validation.score,
          aiGenerated: true,
          generatedAt: new Date(),
        },
      });

      logger.info(`Article created from AI: ${article.id}`);
      return article;
    } catch (error) {
      logger.error('Error creating article from AI:', error);
      throw error;
    }
  }

  /**
   * Validate AI-generated content
   */
  @roles(['USER', 'ADMIN', 'SYSTEM'])
  async validateAIContent(
    content: string,
    metadata?: any
  ): Promise<IAIContentValidation> {
    try {
      const issues: string[] = [];
      let score = 100;

      // Basic validation
      if (!content || content.trim().length === 0) {
        issues.push('Content is empty');
        score -= 100;
      }

      // Length validation
      if (content.length < 100) {
        issues.push('Content is too short (minimum 100 characters)');
        score -= 20;
      }

      if (content.length > 100000) {
        issues.push('Content is too long (maximum 100,000 characters)');
        score -= 10;
      }

      // Structure validation
      const hasHeadings = /#{1,6}\s/.test(content);
      if (!hasHeadings) {
        issues.push('Content lacks structure (no markdown headings)');
        score -= 10;
      }

      // Check for common AI patterns that might need review
      const aiPatterns = [
        /as an ai language model/i,
        /i don't have personal opinions/i,
        /i cannot provide/i,
        /i'm not able to/i,
      ];

      for (const pattern of aiPatterns) {
        if (pattern.test(content)) {
          issues.push('Content contains AI disclaimer language');
          score -= 15;
          break;
        }
      }

      // Check confidence score if provided
      const confidence = metadata?.confidence;
      if (confidence !== undefined && confidence < 0.7) {
        issues.push(`Low confidence score: ${confidence}`);
        score -= 20;
      }

      // Ensure score doesn't go below 0
      score = Math.max(0, score);

      return {
        isValid: score >= 60,
        score,
        issues,
        suggestions: this.generateValidationSuggestions(issues),
        confidence: confidence || 0.8,
      };
    } catch (error) {
      logger.error('Error validating AI content:', error);
      return {
        isValid: false,
        score: 0,
        issues: ['Validation error occurred'],
        suggestions: ['Please review content manually'],
        confidence: 0,
      };
    }
  }

  /**
   * Generate suggestions based on validation issues
   */
  private generateValidationSuggestions(issues: string[]): string[] {
    const suggestions: string[] = [];

    if (issues.some(i => i.includes('too short'))) {
      suggestions.push('Expand the content with more details and examples');
    }

    if (issues.some(i => i.includes('lacks structure'))) {
      suggestions.push('Add markdown headings to organize the content');
    }

    if (issues.some(i => i.includes('AI disclaimer'))) {
      suggestions.push('Remove AI-specific language and rephrase in a direct tone');
    }

    if (issues.some(i => i.includes('confidence'))) {
      suggestions.push('Consider having a human review this content before publishing');
    }

    return suggestions;
  }

  /**
   * Get knowledge context for AI query
   */
  @roles(['USER', 'ADMIN', 'SYSTEM'])
  async getKnowledgeContext(query: string, kbId?: string): Promise<IAIKnowledgeContext> {
    try {
      logger.debug(`Getting knowledge context for query: "${query}"`, { kbId });

      // Search for relevant content
      const searchService = this.props.$services.kb?.SearchService;
      
      let results: IKBContent[] = [];
      
      if (searchService) {
        const searchResults = await searchService.searchArticles({
          query,
          filters: kbId ? { kbId } : undefined,
          limit: 5,
        });
        results = searchResults.results || [];
      } else {
        // Fallback to simple query
        const query_obj: any = {
          contentType: KBContentType.ARTICLE,
          published: true,
          $text: { $search: query },
        };

        if (kbId) {
          query_obj.knowledgeBase = kbId;
        }

        results = await Content.find(query_obj).limit(5).lean();
      }

      // Format results for AI
      const content = results.map(result =>
        this.formatContentForAI(result as IKBContent)
      );

      // Extract related topics
      const allTags = results.flatMap(r => (r as IKBContent).tags || []);
      const relatedTopics = [...new Set(allTags)].slice(0, 10);

      // Identify knowledge gaps (topics mentioned but not covered)
      const knowledgeGaps = this.identifyKnowledgeGaps(query, results);

      // Calculate confidence based on results
      const confidence = results.length > 0 ? Math.min(results.length / 5, 1) : 0;

      // Get localized versions
      const localizedVersions = this.getLocalizedVersionsInfo(results);

      return {
        query,
        content,
        relatedTopics,
        knowledgeGaps,
        confidence,
        localizedVersions,
      };
    } catch (error) {
      logger.error(`Error getting knowledge context for query "${query}":`, error);
      throw error;
    }
  }

  /**
   * Identify knowledge gaps
   */
  private identifyKnowledgeGaps(query: string, results: any[]): string[] {
    // Simple implementation - can be enhanced with NLP
    const gaps: string[] = [];

    if (results.length === 0) {
      gaps.push(`No content found for: ${query}`);
    }

    if (results.length < 3) {
      gaps.push('Limited coverage - more articles needed');
    }

    return gaps;
  }

  /**
   * Get localized versions information
   */
  private getLocalizedVersionsInfo(results: any[]): ILocalizedContext[] {
    const languageMap = new Map<string, Set<string>>();

    for (const result of results) {
      const content = result as IKBContent;
      const defaultLng = content.lng || 'en';

      if (!languageMap.has(defaultLng)) {
        languageMap.set(defaultLng, new Set());
      }
      languageMap.get(defaultLng)!.add(content.id?.toString() || content.slug);

      // Add localized versions
      if (content.localizedContent) {
        for (const localized of content.localizedContent) {
          if (!languageMap.has(localized.lng)) {
            languageMap.set(localized.lng, new Set());
          }
          languageMap.get(localized.lng)!.add(content.id?.toString() || content.slug);
        }
      }
    }

    const localizedVersions: ILocalizedContext[] = [];

    for (const [lng, contentIds] of languageMap) {
      const allContentIds = results.map(r =>
        (r as IKBContent).id?.toString() || (r as IKBContent).slug
      );
      const available = Array.from(contentIds);
      const missing = allContentIds.filter(id => !contentIds.has(id));

      localizedVersions.push({
        lng,
        availableContent: available,
        missingTranslations: missing,
      });
    }

    return localizedVersions;
  }

  /**
   * Update AI knowledge base
   */
  @roles(['ADMIN', 'SYSTEM'])
  async updateAIKnowledge(kbId: string): Promise<void> {
    try {
      logger.info(`Updating AI knowledge for KB ${kbId}`);

      // Reindex the knowledge base
      const searchService = this.props.$services.kb?.SearchService;
      if (searchService) {
        await searchService.reindexKnowledgeBase(kbId);
      }

      // TODO: Additional AI-specific indexing or model updates can be added here

      logger.info(`AI knowledge updated for KB ${kbId}`);
    } catch (error) {
      logger.error(`Error updating AI knowledge for KB ${kbId}:`, error);
      throw error;
    }
  }

  /**
   * Get localized content for AI
   */
  @roles(['USER', 'ADMIN', 'SYSTEM'])
  async getLocalizedContentForAI(articleId: string, lng: string): Promise<IAIContentSummary> {
    try {
      const article = await Content.findById(articleId).lean();

      if (!article) {
        throw new Error(`Article ${articleId} not found`);
      }

      return this.formatContentForAI(article as IKBContent, lng);
    } catch (error) {
      logger.error(`Error getting localized content for AI:`, error);
      throw error;
    }
  }

  /**
   * Format content for AI consumption
   */
  formatContentForAI(content: IKBContent, language?: string): IAIContentSummary {
    // Get localized version if language specified
    const localizedData = language
      ? getLocalizedContent(content, language)
      : {
          title: content.title || '',
          content: content.content || '',
          summary: content.description,
          lng: content.lng || 'en',
          isLocalized: false,
        };

    // Extract key information
    const summary: IAIContentSummary = {
      id: content.id?.toString() || content.slug,
      contentType: content.contentType || KBContentType.ARTICLE,
      title: localizedData.title,
      summary: this.generateSummary(localizedData.content),
      relevanceScore: 1.0,
      keyPoints: this.extractKeyPointsSync(localizedData.content),
      categories: (content.categories || []).map(c => c.toString()),
      tags: content.tags || [],
      lng: localizedData.lng,
      localizedVersions: (content.localizedContent || []).map(lc => lc.lng),
      metadata: {
        created: content.createdAt,
        modified: content.updatedAt,
        viewCount: content.viewCount || 0,
        published: content.published || false,
      },
    };

    return summary;
  }

  /**
   * Generate summary from content
   */
  private generateSummary(content: string, maxLength: number = 200): string {
    if (!content) return '';

    // Remove markdown formatting
    let plainText = content
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`(.+?)`/g, '$1')
      .trim();

    // Get first paragraph or first maxLength characters
    const firstPara = plainText.split('\n\n')[0];
    
    if (firstPara.length <= maxLength) {
      return firstPara;
    }

    return firstPara.substring(0, maxLength) + '...';
  }

  /**
   * Extract key points from content (sync version)
   */
  private extractKeyPointsSync(content: string, maxPoints: number = 5): string[] {
    if (!content) return [];

    const keyPoints: string[] = [];

    // Extract bullet points
    const bulletPattern = /^[\s]*[-*+]\s+(.+)$/gm;
    let match;

    while ((match = bulletPattern.exec(content)) !== null && keyPoints.length < maxPoints) {
      keyPoints.push(match[1].trim());
    }

    // If no bullet points, extract numbered lists
    if (keyPoints.length === 0) {
      const numberedPattern = /^[\s]*\d+\.\s+(.+)$/gm;
      while (
        (match = numberedPattern.exec(content)) !== null &&
        keyPoints.length < maxPoints
      ) {
        keyPoints.push(match[1].trim());
      }
    }

    // If still no points, extract first sentences from paragraphs
    if (keyPoints.length === 0) {
      const paragraphs = content.split('\n\n');
      for (const para of paragraphs) {
        if (keyPoints.length >= maxPoints) break;
        const sentences = para.split(/[.!?]+/);
        if (sentences.length > 0) {
          const sentence = sentences[0].trim();
          if (sentence.length > 20 && sentence.length < 200) {
            keyPoints.push(sentence);
          }
        }
      }
    }

    return keyPoints.slice(0, maxPoints);
  }

  /**
   * Extract key points from content (async version for external NLP services)
   */
  @roles(['USER', 'ADMIN', 'SYSTEM'])
  async extractKeyPoints(content: string): Promise<string[]> {
    // For now, use sync version
    // TODO: Integrate with external NLP service for better extraction
    return this.extractKeyPointsSync(content);
  }

  /**
   * Get related content suggestions
   */
  @roles(['USER', 'ADMIN', 'SYSTEM'])
  async getRelatedContent(contentId: string, limit: number = 5): Promise<IAIContentSummary[]> {
    try {
      // Get the original content
      const content = await Content.findById(contentId).lean();

      if (!content) {
        throw new Error(`Content ${contentId} not found`);
      }

      const kbContent = content as IKBContent;

      // Find related content based on tags and categories
      const query: any = {
        _id: { $ne: contentId },
        contentType: KBContentType.ARTICLE,
        published: true,
        $or: [],
      };

      if (kbContent.tags && kbContent.tags.length > 0) {
        query.$or.push({ tags: { $in: kbContent.tags } });
      }

      if (kbContent.categories && kbContent.categories.length > 0) {
        query.$or.push({ categories: { $in: kbContent.categories } });
      }

      if (kbContent.knowledgeBase) {
        query.$or.push({ knowledgeBase: kbContent.knowledgeBase });
      }

      if (query.$or.length === 0) {
        return [];
      }

      const relatedArticles = await Content.find(query).limit(limit).lean();

      return relatedArticles.map(article =>
        this.formatContentForAI(article as IKBContent)
      );
    } catch (error) {
      logger.error(`Error getting related content for ${contentId}:`, error);
      return [];
    }
  }

  /**
   * Lifecycle methods
   */
  async onStartup(): Promise<void> {
    logger.info('AIIntegrationService started');
  }

  getExecutionContext(): Reactory.Server.IReactoryContext {
    return this.context;
  }

  setExecutionContext(context: Reactory.Server.IReactoryContext): boolean {
    this.context = context;
    return true;
  }

  setSearchService(searchService: any): void {
    this.searchService = searchService;
  }

  setKBService(kbService: any): void {
    this.kbService = kbService;
  }

  /**
   * Service definition
   */
  static reactory: Reactory.Service.IReactoryServiceDefinition<AIIntegrationService> = {
    id: 'kb.AIIntegrationService@1.0.0',
    nameSpace: 'kb',
    name: 'AIIntegrationService',
    version: '1.0.0',
    description: 'Service for AI agent integration with knowledge bases',
    service: (
      props: Reactory.Service.IReactoryServiceProps,
      context: Reactory.Server.IReactoryContext
    ) => {
      return new AIIntegrationService(props, context);
    },
    dependencies: [
      { id: 'kb.SearchService@1.0.0', alias: 'searchService' },
      { id: 'kb.KnowledgeBaseService@1.0.0', alias: 'kbService' },
    ],
    serviceType: 'ai',
  };
}

export default AIIntegrationService;
export { IAIIntegrationService };

