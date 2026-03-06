/**
 * Knowledge Base Service
 * 
 * Manages knowledge base entities using the Content model with contentType: 'knowledge-base'.
 * Extends functionality from ReactoryContentService.
 */

import Reactory from '@reactorynet/reactory-core';
import { roles } from '@reactory/server-core/authentication/decorators';
import { KBContent } from '../models';
import type { IKBContentDocument } from '../models';
import logger from '@reactory/server-core/logging';
import {
  IKBContent,
  ICreateKBInput,
  IUpdateKBInput,
  IKBFilter,
  IKBStats,
  KBContentType,
  KBVisibility,
  KBArticleStatus,
} from '../types';


/**
 * Knowledge Base Service Interface
 */
export interface IKnowledgeBaseService extends Reactory.Service.IReactoryService {
  /**
   * Create a new knowledge base
   */
  createKnowledgeBase(input: ICreateKBInput): Promise<IKBContent>;

  /**
   * Update an existing knowledge base
   */
  updateKnowledgeBase(id: string, input: IUpdateKBInput): Promise<IKBContent>;

  /**
   * Delete a knowledge base
   */
  deleteKnowledgeBase(id: string): Promise<boolean>;

  /**
   * Get a knowledge base by ID
   */
  getKnowledgeBase(id: string): Promise<IKBContent>;

  /**
   * Get a knowledge base by slug
   */
  getKnowledgeBaseBySlug(slug: string): Promise<IKBContent>;

  /**
   * List knowledge bases with filtering
   */
  listKnowledgeBases(filter: IKBFilter): Promise<IKBContent[]>;

  /**
   * Get all articles in a knowledge base
   */
  getKBArticles(kbId: string, filter?: IKBFilter): Promise<IKBContent[]>;

  /**
   * Get all categories in a knowledge base
   */
  getKBCategories(kbId: string): Promise<IKBContent[]>;

  /**
   * Get knowledge base statistics
   */
  getKBStatistics(kbId: string): Promise<IKBStats>;

  /**
   * Check if user has access to knowledge base
   */
  checkAccess(kbId: string, userId: string): Promise<boolean>;

  /**
   * Share knowledge base with users
   */
  shareKnowledgeBase(kbId: string, userIds: string[], permission: string): Promise<IKBContent>;
}

/**
 * Knowledge Base Service Implementation
 */
class KnowledgeBaseService implements IKnowledgeBaseService {
  name: string = 'KnowledgeBaseService';
  nameSpace: string = 'kb';
  version: string = '1.0.0';

  props: Reactory.Service.IReactoryServiceProps;
  context: Reactory.Server.IReactoryContext;  
  contentService: Reactory.Service.IReactoryContentService;
  userService: Reactory.Service.IReactoryUserService;

  constructor(
    props: Reactory.Service.IReactoryServiceProps,
    context: Reactory.Server.IReactoryContext
  ) {
    this.props = props;
    this.context = context;
  }

 
  /**
   * Generate a unique slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Build query from filter
   */
  private buildQuery(filter: IKBFilter = {}): any {
    const query: any = { contentType: KBContentType.KNOWLEDGE_BASE };

    if (filter.status) {
      query.status = Array.isArray(filter.status) ? { $in: filter.status } : filter.status;
    }

    if (filter.visibility) {
      query.visibility = Array.isArray(filter.visibility)
        ? { $in: filter.visibility }
        : filter.visibility;
    }

    if (filter.authorId) {
      query.createdBy = filter.authorId;
    }

    if (filter.tags && filter.tags.length > 0) {
      query.tags = { $in: filter.tags };
    }

    if (filter.categories && filter.categories.length > 0) {
      query.categories = { $in: filter.categories };
    }

    if (filter.lng) {
      query.lng = filter.lng;
    }

    if (filter.published !== undefined) {
      query.published = filter.published;
    }

    if (filter.createdAfter || filter.createdBefore) {
      query.createdAt = {};
      if (filter.createdAfter) {
        query.createdAt.$gte = filter.createdAfter;
      }
      if (filter.createdBefore) {
        query.createdAt.$lte = filter.createdBefore;
      }
    }

    return query;
  }

  /**
   * Create a new knowledge base
   */
  @roles(['USER', 'ADMIN'])
  async createKnowledgeBase(input: ICreateKBInput): Promise<IKBContent> {
    try {
      logger.debug('Creating knowledge base:', input);

      // Generate slug from title if not provided
      const slug = input.slug || this.generateSlug(input.title);

      // Check if slug already exists
      const existing = await KBContent.findOne({ slug, contentType: KBContentType.KNOWLEDGE_BASE });
      if (existing) {
        throw new Error(`Knowledge base with slug "${slug}" already exists`);
      }

      // Prepare KB content
      const kbContent: Partial<IKBContent> = {
        slug,
        title: input.title,
        description: input.description,
        content: input.content || '',
        contentType: KBContentType.KNOWLEDGE_BASE,
        lng: input.lng || 'en',
        tags: input.tags || [],
        categories: input.categories || [],
        visibility: input.visibility || KBVisibility.PRIVATE,
        status: KBArticleStatus.PUBLISHED,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: this.context.user._id,
        updatedBy: this.context.user._id,
        partner: this.context.partner?._id,
        organization: this.context.partner?.organization as Reactory.Models.IOrganizationDocument,
        viewCount: 0,
        allowComments: true,
        localizedContent: [],
      };

      // Create the knowledge base
      const kb = await KBContent.create(kbContent);

      logger.info(`Knowledge base created: ${kb._id}`);
      return kb.toObject() as IKBContent;
    } catch (error) {
      logger.error('Error creating knowledge base:', error);
      throw error;
    }
  }

  /**
   * Update an existing knowledge base
   */
  @roles(['USER', 'ADMIN'])
  async updateKnowledgeBase(id: string, input: IUpdateKBInput): Promise<IKBContent> {
    try {
      logger.debug(`Updating knowledge base ${id}:`, input);

      const kb = await KBContent.findOne({
        _id: id,
        contentType: KBContentType.KNOWLEDGE_BASE,
      });

      if (!kb) {
        throw new Error(`Knowledge base ${id} not found`);
      }

      // Check permissions
      const hasAccess = await this.checkAccess(id, this.context.user._id.toString());
      if (!hasAccess) {
        throw new Error('Access denied: You do not have permission to update this knowledge base');
      }

      // Update fields
      if (input.title) kb.title = input.title;
      if (input.description !== undefined) kb.description = input.description;
      if (input.content !== undefined) kb.content = input.content;
      if (input.lng) kb.lng = input.lng;
      if (input.tags) kb.tags = input.tags;
      if (input.categories) kb.categories = input.categories as any;
      if (input.status) kb.status = input.status;
      if (input.visibility) kb.visibility = input.visibility;
      if (input.metadata) {
        kb.metadata = { ...kb.metadata, ...input.metadata };
      }

      kb.updatedAt = new Date();
      kb.updatedBy = this.context.user._id;

      await kb.save();

      logger.info(`Knowledge base updated: ${kb._id}`);
      return kb.toObject() as IKBContent;
    } catch (error) {
      logger.error(`Error updating knowledge base ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a knowledge base
   */
  @roles(['USER', 'ADMIN'])
  async deleteKnowledgeBase(id: string): Promise<boolean> {
    try {
      logger.debug(`Deleting knowledge base ${id}`);

      const kb = await KBContent.findOne({
        _id: id,
        contentType: KBContentType.KNOWLEDGE_BASE,
      });

      if (!kb) {
        throw new Error(`Knowledge base ${id} not found`);
      }

      // Check permissions
      const hasAccess = await this.checkAccess(id, this.context.user._id.toString());
      if (!hasAccess) {
        throw new Error('Access denied: You do not have permission to delete this knowledge base');
      }

      // Delete all articles in this KB
      await KBContent.deleteMany({
        knowledgeBase: id,
        contentType: KBContentType.ARTICLE,
      });

      // Delete all categories in this KB
      await KBContent.deleteMany({
        knowledgeBase: id,
        contentType: KBContentType.CATEGORY,
      });

      // Delete the KB itself
      await kb.deleteOne();

      logger.info(`Knowledge base deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting knowledge base ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get a knowledge base by ID
   */
  @roles(['USER', 'ANON'])
  async getKnowledgeBase(id: string): Promise<IKBContent> {
    try {
      const kb = await KBContent.findOne({
        _id: id,
        contentType: KBContentType.KNOWLEDGE_BASE,
      });

      if (!kb) {
        throw new Error(`Knowledge base ${id} not found`);
      }

      // Check access for private/shared KBs
      const visibility = kb.visibility || KBVisibility.PRIVATE;
      if (
        visibility !== KBVisibility.PUBLIC &&
        this.context.user &&
        !(await this.checkAccess(id, this.context.user._id.toString()))
      ) {
        throw new Error('Access denied: You do not have permission to view this knowledge base');
      }

      return kb.toObject() as IKBContent;
    } catch (error) {
      logger.error(`Error getting knowledge base ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get a knowledge base by slug
   */
  @roles(['USER', 'ANON'])
  async getKnowledgeBaseBySlug(slug: string): Promise<IKBContent> {
    try {
      const kb = await KBContent.findOne({
        slug,
        contentType: KBContentType.KNOWLEDGE_BASE,
      });

      if (!kb) {
        throw new Error(`Knowledge base with slug "${slug}" not found`);
      }

      // Check access for private/shared KBs
      const visibility = kb.visibility || KBVisibility.PRIVATE;
      if (
        visibility !== KBVisibility.PUBLIC &&
        this.context.user &&
        !(await this.checkAccess(kb._id.toString(), this.context.user._id.toString()))
      ) {
        throw new Error('Access denied: You do not have permission to view this knowledge base');
      }

      return kb.toObject() as IKBContent;
    } catch (error) {
      logger.error(`Error getting knowledge base by slug "${slug}":`, error);
      throw error;
    }
  }

  /**
   * List knowledge bases with filtering
   */
  @roles(['USER', 'ANON'])
  async listKnowledgeBases(filter: IKBFilter = {}): Promise<IKBContent[]> {
    try {
      const query = this.buildQuery(filter);

      // For anonymous users, only show public KBs
      if (!this.context.user) {
        query.visibility = KBVisibility.PUBLIC;
      } else {
        // For authenticated users, show public + own + shared
        query.$or = [
          { visibility: KBVisibility.PUBLIC },
          { createdBy: this.context.user._id },
          { visibility: KBVisibility.ORGANIZATION, organization: this.context.partner?.organization },
          // TODO: Add shared KBs based on permissions
        ];
      }

      const sortBy = filter.sortBy || 'createdAt';
      const sortDirection = filter.sortDirection === 'asc' ? 1 : -1;
      const limit = filter.limit || 50;
      const offset = filter.offset || 0;

      const kbs = await KBContent.find(query)
        .sort({ [sortBy]: sortDirection })
        .skip(offset)
        .limit(limit)
        .lean();

      return kbs as IKBContent[];
    } catch (error) {
      logger.error('Error listing knowledge bases:', error);
      throw error;
    }
  }

  /**
   * Get all articles in a knowledge base
   */
  @roles(['USER', 'ANON'])
  async getKBArticles(kbId: string, filter: IKBFilter = {}): Promise<IKBContent[]> {
    try {
      // First check if KB exists and user has access
      await this.getKnowledgeBase(kbId);

      const query: any = {
        knowledgeBase: kbId,
        contentType: KBContentType.ARTICLE,
      };

      if (filter.status) {
        query.status = Array.isArray(filter.status) ? { $in: filter.status } : filter.status;
      }

      if (filter.tags && filter.tags.length > 0) {
        query.tags = { $in: filter.tags };
      }

      if (filter.categories && filter.categories.length > 0) {
        query.categories = { $in: filter.categories };
      }

      if (filter.lng) {
        query.lng = filter.lng;
      }

      // Non-authenticated or non-owner users only see published articles
      if (!this.context.user) {
        query.published = true;
        query.status = KBArticleStatus.PUBLISHED;
      }

      const sortBy = filter.sortBy || 'createdAt';
      const sortDirection = filter.sortDirection === 'asc' ? 1 : -1;
      const limit = filter.limit || 50;
      const offset = filter.offset || 0;

      const articles = await KBContent.find(query)
        .sort({ [sortBy]: sortDirection })
        .skip(offset)
        .limit(limit)
        .lean();

      return articles as IKBContent[];
    } catch (error) {
      logger.error(`Error getting articles for KB ${kbId}:`, error);
      throw error;
    }
  }

  /**
   * Get all categories in a knowledge base
   */
  @roles(['USER', 'ANON'])
  async getKBCategories(kbId: string): Promise<IKBContent[]> {
    try {
      // First check if KB exists and user has access
      await this.getKnowledgeBase(kbId);

      const categories = await KBContent.find({
        knowledgeBase: kbId,
        contentType: KBContentType.CATEGORY,
      })
        .sort({ order: 1, title: 1 })
        .lean();

      return categories as IKBContent[];
    } catch (error) {
      logger.error(`Error getting categories for KB ${kbId}:`, error);
      throw error;
    }
  }

  /**
   * Get knowledge base statistics
   */
  @roles(['USER'])
  async getKBStatistics(kbId: string): Promise<IKBStats> {
    try {
      // Check if KB exists and user has access
      await this.getKnowledgeBase(kbId);

      // Count articles by status
      const [totalArticles, publishedArticles, draftArticles, archivedArticles] = await Promise.all([
        KBContent.countDocuments({ knowledgeBase: kbId, contentType: KBContentType.ARTICLE }),
        KBContent.countDocuments({
          knowledgeBase: kbId,
          contentType: KBContentType.ARTICLE,
          status: KBArticleStatus.PUBLISHED,
        }),
        KBContent.countDocuments({
          knowledgeBase: kbId,
          contentType: KBContentType.ARTICLE,
          status: KBArticleStatus.DRAFT,
        }),
        KBContent.countDocuments({
          knowledgeBase: kbId,
          contentType: KBContentType.ARTICLE,
          status: KBArticleStatus.ARCHIVED,
        }),
      ]);

      // Count categories
      const totalCategories = await KBContent.countDocuments({
        knowledgeBase: kbId,
        contentType: KBContentType.CATEGORY,
      });

      // Get unique languages
      const articles = await KBContent.find({
        knowledgeBase: kbId,
        contentType: KBContentType.ARTICLE,
      }).select('lng');
      const availableLanguages = [...new Set(articles.map((a) => a.lng).filter(Boolean))];

      // Sum view counts
      const viewCountResult = await KBContent.aggregate([
        { $match: { knowledgeBase: kbId, contentType: KBContentType.ARTICLE } },
        { $group: { _id: null, totalViews: { $sum: '$viewCount' } } },
      ]);
      const totalViews = viewCountResult[0]?.totalViews || 0;

      // TODO: Get counts for comments and bookmarks from their respective collections

      return {
        id: kbId,
        knowledgeBaseId: kbId,
        totalArticles,
        publishedArticles,
        draftArticles,
        archivedArticles,
        totalViews,
        totalComments: 0, // TODO: Implement
        totalBookmarks: 0, // TODO: Implement
        totalCategories,
        availableLanguages,
        lastUpdated: new Date(),
        createdAt: new Date(),
      };
    } catch (error) {
      logger.error(`Error getting statistics for KB ${kbId}:`, error);
      throw error;
    }
  }

  /**
   * Check if user has access to knowledge base
   */
  @roles(['USER', 'ANON'])
  async checkAccess(kbId: string, userId: string): Promise<boolean> {
    try {
      const kb = await KBContent.findOne({
        _id: kbId,
        contentType: KBContentType.KNOWLEDGE_BASE,
      });

      if (!kb) {
        return false;
      }

      const visibility = kb.visibility || KBVisibility.PRIVATE;

      // Public KBs are accessible to everyone
      if (visibility === KBVisibility.PUBLIC) {
        return true;
      }

      // Check if user is the owner
      if (kb.createdBy && kb.createdBy.toString() === userId) {
        return true;
      }

      // Check organization-level access
      if (visibility === KBVisibility.ORGANIZATION) {
        const user = await this.context.services.core.UserService.findById(userId);
        if (user && user.organization && kb.organization) {
          return user.organization.toString() === kb.organization.toString();
        }
      }

      // TODO: Check shared permissions

      return false;
    } catch (error) {
      logger.error(`Error checking access for KB ${kbId}:`, error);
      return false;
    }
  }

  /**
   * Share knowledge base with users
   */
  @roles(['USER', 'ADMIN'])
  async shareKnowledgeBase(
    kbId: string,
    userIds: string[],
    permission: string
  ): Promise<IKBContent> {
    try {
      logger.debug(`Sharing KB ${kbId} with users:`, userIds);

      const kb = await KBContent.findOne({
        _id: kbId,
        contentType: KBContentType.KNOWLEDGE_BASE,
      });

      if (!kb) {
        throw new Error(`Knowledge base ${kbId} not found`);
      }

      // Check if current user is owner
      if (kb.createdBy.toString() !== this.context.user._id.toString()) {
        throw new Error('Access denied: Only the owner can share this knowledge base');
      }

      // Update visibility to shared
      kb.visibility = KBVisibility.SHARED;

      // TODO: Create permission records for each user
      // This would be implemented in PermissionService

      await kb.save();

      logger.info(`Knowledge base ${kbId} shared with ${userIds.length} users`);
      return kb.toObject() as IKBContent;
    } catch (error) {
      logger.error(`Error sharing KB ${kbId}:`, error);
      throw error;
    }
  }

  /**
   * Lifecycle methods
   */
  async onStartup(): Promise<void> {
    logger.info('KnowledgeBaseService started 📗');
    // ensure we have a default user for the knowledge base workflows
    if (!process.env.KB_SYSTEM_USER) {
      logger.warn('KB_SYSTEM_USER not set, using default REACTORY system user');
    } else {
      logger.info(`KB_SYSTEM_USER set to ${process.env.KB_SYSTEM_USER}`);
      // check if the user exists and log a warning if not
      const userExists = await this.userService.findByEmail(process.env.KB_SYSTEM_USER);
      if (!userExists) {
        logger.warn(
          `KB_SYSTEM_USER ${process.env.KB_SYSTEM_USER} does not exist in the system. Please create this user to ensure proper functioning of knowledge base workflows.`
        );
      } else {
        logger.info(`KB_SYSTEM_USER ${process.env.KB_SYSTEM_USER} exists in the system.`);
      }
    }

    if (!process.env.KB_SYSTEM_PARTNER) {
      logger.warn('KB_SYSTEM_PARTNER not set, using default REACTORY partner');
    } 
  }

  getExecutionContext(): Reactory.Server.IReactoryContext {
    return this.context;
  }

  setExecutionContext(context: Reactory.Server.IReactoryContext): boolean {
    this.context = context;
    return true;
  }

  setContentService(contentService: Reactory.Service.IReactoryContentService): void {
    this.contentService = contentService;
  }

  setUserService(userService: Reactory.Service.IReactoryUserService): void {
    this.userService = userService;
  }

  /**
   * Service definition
   */
  static reactory: Reactory.Service.IReactoryServiceDefinition<KnowledgeBaseService> = {
    id: 'kb.KnowledgeBaseService@1.0.0',
    nameSpace: 'kb',
    name: 'KnowledgeBaseService',
    version: '1.0.0',
    description: 'Service for managing knowledge bases',
    service: (
      props: Reactory.Service.IReactoryServiceProps,
      context: Reactory.Server.IReactoryContext
    ) => {
      return new KnowledgeBaseService(props, context);
    },
    dependencies: [
      { id: 'core.ReactoryContentService@1.0.0', alias: 'contentService' },
      { id: 'core.UserService@1.0.0', alias: 'userService' },
    ],
    serviceType: 'data',
  };
}

export default KnowledgeBaseService;
