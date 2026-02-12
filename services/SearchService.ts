/**
 * Search Service
 * 
 * Provides full-text search capabilities for knowledge base content.
 * Wraps ReactorySearchService (MeiliSearch) with KB-specific functionality.
 */

import Reactory from '@reactory/reactory-core';
import { roles } from '@reactory/server-core/authentication/decorators';
import { Content } from '@reactory/server-modules/reactory-core/models';
import logger from '@reactory/server-core/logging';
import {
  IKBContent,
  IKBSearchQuery,
  IKBSearchResult,
  IKBSearchFilters,
  KBContentType,
  KBArticleStatus,
  IKBSearchSuggestions,
} from '../types';

/**
 * Search Service Interface
 */
export interface ISearchService extends Reactory.Service.IReactoryService {
  /**
   * Search articles with filters
   */
  searchArticles(query: IKBSearchQuery): Promise<IKBSearchResult>;

  /**
   * Search knowledge bases
   */
  searchKnowledgeBases(query: IKBSearchQuery): Promise<IKBSearchResult>;

  /**
   * Search by content type
   */
  searchByContentType(contentType: KBContentType, query: IKBSearchQuery): Promise<IKBSearchResult>;

  /**
   * Index content for search
   */
  indexContent(content: IKBContent): Promise<void>;

  /**
   * Reindex all content in a knowledge base
   */
  reindexKnowledgeBase(kbId: string): Promise<void>;

  /**
   * Get search suggestions (autocomplete)
   */
  getSearchSuggestions(query: string, limit?: number): Promise<IKBSearchSuggestions>;

  /**
   * Delete content from search index
   */
  deleteFromIndex(contentId: string): Promise<void>;
}

/**
 * Search Service Implementation
 */
class SearchService implements ISearchService {
  name: string = 'SearchService';
  nameSpace: string = 'kb';
  version: string = '1.0.0';

  props: Reactory.Service.IReactoryServiceProps;
  context: Reactory.Server.IReactoryContext;
  searchService: Reactory.Service.IReactorySearchService;

  private indexName = 'kb_content';

  constructor(
    props: Reactory.Service.IReactoryServiceProps,
    context: Reactory.Server.IReactoryContext
  ) {
    this.props = props;
    this.context = context;
  }

  /**
   * Build search filters for MeiliSearch
   */
  private buildFilters(filters?: IKBSearchFilters): string[] {
    const filterArray: string[] = [];

    if (!filters) {
      return filterArray;
    }

    if (filters.contentType) {
      const types = Array.isArray(filters.contentType) ? filters.contentType : [filters.contentType];
      filterArray.push(`contentType IN [${types.map(t => `"${t}"`).join(',')}]`);
    }

    if (filters.kbId) {
      filterArray.push(`knowledgeBase = "${filters.kbId}"`);
    }

    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      filterArray.push(`status IN [${statuses.map(s => `"${s}"`).join(',')}]`);
    }

    if (filters.authorId) {
      filterArray.push(`createdBy = "${filters.authorId}"`);
    }

    if (filters.tags && filters.tags.length > 0) {
      const tagFilters = filters.tags.map(tag => `tags = "${tag}"`).join(' OR ');
      filterArray.push(`(${tagFilters})`);
    }

    if (filters.lng) {
      filterArray.push(`lng = "${filters.lng}"`);
    }

    if (filters.published !== undefined) {
      filterArray.push(`published = ${filters.published}`);
    }

    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      if (start) {
        filterArray.push(`createdAt >= ${start.getTime()}`);
      }
      if (end) {
        filterArray.push(`createdAt <= ${end.getTime()}`);
      }
    }

    return filterArray;
  }

  /**
   * Prepare content for indexing
   */
  private prepareForIndex(content: IKBContent): any {
    return {
      id: content.id?.toString() || content.slug,
      slug: content.slug,
      title: content.title || '',
      content: content.content || '',
      description: content.description || '',
      contentType: content.contentType,
      knowledgeBase: content.knowledgeBase?.toString(),
      lng: content.lng || 'en',
      tags: content.tags || [],
      categories: content.categories?.map(c => c.toString()) || [],
      status: content.status || KBArticleStatus.DRAFT,
      published: content.published || false,
      createdBy: content.createdBy?.toString(),
      createdAt: content.createdAt?.getTime() || Date.now(),
      updatedAt: content.updatedAt?.getTime() || Date.now(),
      viewCount: content.viewCount || 0,
    };
  }

  /**
   * Search articles with filters
   */
  @roles(['USER', 'ANON'])
  async searchArticles(query: IKBSearchQuery): Promise<IKBSearchResult> {
    try {
      // Ensure content type is article
      const filters: IKBSearchFilters = {
        ...query.filters,
        contentType: KBContentType.ARTICLE,
      };

      // Non-authenticated users only see published articles
      if (!this.context.user) {
        filters.published = true;
        filters.status = KBArticleStatus.PUBLISHED;
      }

      return await this.searchByContentType(KBContentType.ARTICLE, {
        ...query,
        filters,
      });
    } catch (error) {
      logger.error('Error searching articles:', error);
      throw error;
    }
  }

  /**
   * Search knowledge bases
   */
  @roles(['USER', 'ANON'])
  async searchKnowledgeBases(query: IKBSearchQuery): Promise<IKBSearchResult> {
    try {
      const filters: IKBSearchFilters = {
        ...query.filters,
        contentType: KBContentType.KNOWLEDGE_BASE,
      };

      return await this.searchByContentType(KBContentType.KNOWLEDGE_BASE, {
        ...query,
        filters,
      });
    } catch (error) {
      logger.error('Error searching knowledge bases:', error);
      throw error;
    }
  }

  /**
   * Search by content type
   */
  @roles(['USER', 'ANON'])
  async searchByContentType(
    contentType: KBContentType,
    query: IKBSearchQuery
  ): Promise<IKBSearchResult> {
    try {
      logger.debug(`Searching ${contentType}:`, query);

      if (!this.searchService) {
        throw new Error('ReactorySearchService not available');
      }

      // Build filters
      const filters = this.buildFilters(query.filters);

      // Execute search
      const searchOptions: any = {
        filter: filters,
        limit: query.limit || 20,
        offset: query.offset || 0,
      };

      if (query.sortBy) {
        searchOptions.sort = [
          `${query.sortBy}:${query.sortDirection === 'asc' ? 'asc' : 'desc'}`,
        ];
      }

      const searchResults = await this.searchService.search(
        this.indexName,
        query.query,
        searchOptions
      );

      // Get full content objects from database
      const contentIds = searchResults.hits?.map((hit: any) => hit.id) || [];
      const contents = await Content.find({ _id: { $in: contentIds } }).lean();

      // Map results with relevance scores
      const results = contents.map((content: any) => {
        const hit = searchResults.hits?.find((h: any) => h.id === content._id.toString());
        return {
          ...content,
          _score: hit?._score || 0,
        };
      });

      return {
        query: query.query,
        filters: query.filters,
        total: searchResults.estimatedTotalHits || 0,
        limit: query.limit || 20,
        offset: query.offset || 0,
        results: results as IKBContent[],
        processingTimeMs: searchResults.processingTimeMs || 0,
      };
    } catch (error) {
      logger.error(`Error searching ${contentType}:`, error);
      throw error;
    }
  }

  /**
   * Index content for search
   */
  @roles(['USER', 'ADMIN'])
  async indexContent(content: IKBContent): Promise<void> {
    try {
      logger.debug(`Indexing content ${content.id}:`, content.contentType);

      if (!this.searchService) {
        throw new Error('ReactorySearchService not available');
      }

      const indexData = this.prepareForIndex(content);

      await this.searchService.index(this.indexName, [indexData]);

      logger.debug(`Content ${content.id} indexed successfully`);
    } catch (error) {
      logger.error(`Error indexing content ${content.id}:`, error);
      // Don't throw - indexing failure shouldn't break the main operation
    }
  }

  /**
   * Reindex all content in a knowledge base
   */
  @roles(['ADMIN'])
  async reindexKnowledgeBase(kbId: string): Promise<void> {
    try {
      logger.info(`Reindexing knowledge base ${kbId}`);

      // Get all content in this KB
      const contents = await Content.find({
        $or: [
          { _id: kbId, contentType: KBContentType.KNOWLEDGE_BASE },
          { knowledgeBase: kbId },
        ],
      }).lean();

      if (contents.length === 0) {
        logger.warn(`No content found for knowledge base ${kbId}`);
        return;
      }

      // Prepare all content for indexing
      const indexData = contents.map(content => this.prepareForIndex(content as IKBContent));

      // Batch index
      if (this.searchService) {
        await this.searchService.index(this.indexName, indexData);
      }

      logger.info(`Reindexed ${contents.length} items for knowledge base ${kbId}`);
    } catch (error) {
      logger.error(`Error reindexing knowledge base ${kbId}:`, error);
      throw error;
    }
  }

  /**
   * Get search suggestions (autocomplete)
   */
  @roles(['USER', 'ANON'])
  async getSearchSuggestions(query: string, limit: number = 5): Promise<IKBSearchSuggestions> {
    try {
      if (query.length < 2) {
        return {
          query,
          suggestions: [],
        };
      }

      // Search for matching titles
      const searchResults = await this.searchService.search(this.indexName, query, {
        limit,
        attributesToRetrieve: ['id', 'title', 'contentType', 'slug'],
        attributesToSearchOn: ['title'],
      });

      const suggestions = (searchResults.hits || []).map((hit: any) => ({
        id: hit.id,
        title: hit.title,
        contentType: hit.contentType,
        slug: hit.slug,
      }));

      return {
        query,
        suggestions,
      };
    } catch (error) {
      logger.error('Error getting search suggestions:', error);
      return {
        query,
        suggestions: [],
      };
    }
  }

  /**
   * Delete content from search index
   */
  @roles(['USER', 'ADMIN'])
  async deleteFromIndex(contentId: string): Promise<void> {
    try {
      logger.debug(`Deleting content ${contentId} from search index`);

      if (!this.searchService) {
        throw new Error('ReactorySearchService not available');
      }

      await this.searchService.deleteDocument(this.indexName, contentId);

      logger.debug(`Content ${contentId} deleted from index`);
    } catch (error) {
      logger.error(`Error deleting content ${contentId} from index:`, error);
      // Don't throw - index deletion failure shouldn't break the main operation
    }
  }

  /**
   * Initialize search index with proper settings
   */
  private async initializeIndex(): Promise<void> {
    try {
      if (!this.searchService) {
        logger.warn('ReactorySearchService not available, skipping index initialization');
        return;
      }

      // Configure searchable attributes
      const searchableAttributes = [
        'title',
        'content',
        'description',
        'tags',
      ];

      // Configure filterable attributes
      const filterableAttributes = [
        'contentType',
        'knowledgeBase',
        'status',
        'published',
        'lng',
        'tags',
        'categories',
        'createdBy',
        'createdAt',
      ];

      // Configure sortable attributes
      const sortableAttributes = [
        'createdAt',
        'updatedAt',
        'viewCount',
        'title',
      ];

      // TODO: Configure index settings through ReactorySearchService
      logger.info(`Search index ${this.indexName} initialized`);
    } catch (error) {
      logger.error('Error initializing search index:', error);
    }
  }

  /**
   * Lifecycle methods
   */
  async onStartup(): Promise<void> {
    logger.info('SearchService started');
    await this.initializeIndex();
  }

  getExecutionContext(): Reactory.Server.IReactoryContext {
    return this.context;
  }

  setExecutionContext(context: Reactory.Server.IReactoryContext): boolean {
    this.context = context;
    return true;
  }

  setSearchService(searchService: Reactory.Service.IReactorySearchService): void {
    this.searchService = searchService;
  }

  /**
   * Service definition
   */
  static reactory: Reactory.Service.IReactoryServiceDefinition<SearchService> = {
    id: 'kb.SearchService@1.0.0',
    nameSpace: 'kb',
    name: 'SearchService',
    version: '1.0.0',
    description: 'Service for searching knowledge base content',
    service: (
      props: Reactory.Service.IReactoryServiceProps,
      context: Reactory.Server.IReactoryContext
    ) => {
      return new SearchService(props, context);
    },
    dependencies: [{ id: 'core.ReactorySearchService@1.0.0', alias: 'searchService' }],
    serviceType: 'search',
  };
}

export default SearchService;
export { ISearchService };

